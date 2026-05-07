#!/usr/bin/env node
/**
 * n8n Monitor — Proactive event watcher for n8n failed executions.
 *
 * GAP-3 from brain-architecture-gaps.md. Mimics sensory cortex: scans n8n
 * executions API at SessionStart, alerts on NEW failures (24h window) via
 * Telegram. Tracks acknowledged execution IDs in state file to avoid spam.
 *
 * Throttled 1h. Native HTTPS, no n8n SDK. Read-only API access.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { CLAUDE_DIR } = require('../shared/paths');
const { sendTelegram } = require('../shared/obsidian-api');

const INTERVAL_HOURS = 1;
const WINDOW_HOURS = 24;
const STATE_FILE = path.join(CLAUDE_DIR, 'hooks', 'maintenance', '.n8n-monitor-state.json');
const KEY_FILE = path.join(CLAUDE_DIR, 'credentials', 'n8n-api.key');
const HOST = 'n8n.studiokook.ee';
const TG_CHAT = '804465999';

function loadState() {
  try {
    const s = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    if (!s.signatures) s.signatures = {};
    return s;
  }
  catch { return { lastRun: 0, alerted: [], wfNames: {}, signatures: {} }; }
}

function sigOf(workflowId, nodeName, message) {
  const m = String(message || '').slice(0, 120).replace(/\s+/g, ' ').trim();
  return `${workflowId}::${nodeName || '?'}::${m}`;
}

async function getErrorSignature(execId, key, workflowId) {
  try {
    const det = await apiGet(`/api/v1/executions/${execId}?includeData=true`, key);
    const raw = det && det.data;
    let parsed = raw;
    if (typeof raw === 'string') {
      try { parsed = JSON.parse(raw); } catch { parsed = null; }
    }
    const rd = parsed && (parsed.resultData || (parsed.data && parsed.data.resultData));
    const err = rd && rd.error;
    const message = err && (err.message || err.description) || '';
    const nodeName = (err && err.node && (err.node.name || err.node)) || rd && rd.lastNodeExecuted || '';
    if (!message && !nodeName) return null;
    return sigOf(workflowId, nodeName, message);
  } catch { return null; }
}

function saveState(s) { fs.writeFileSync(STATE_FILE, JSON.stringify(s, null, 2)); }

function getApiKey() {
  try { return fs.readFileSync(KEY_FILE, 'utf8').trim(); }
  catch { return ''; }
}

function apiGet(p, key) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: HOST,
      path: p,
      method: 'GET',
      headers: { 'X-N8N-API-KEY': key, 'Accept': 'application/json' }
    }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
        catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.setTimeout(8000, () => { req.destroy(); reject(new Error('n8n timeout')); });
    req.end();
  });
}

async function run() {
  const state = loadState();
  const now = Date.now();
  if (now - state.lastRun < INTERVAL_HOURS * 3600 * 1000 && !process.argv.includes('--force')) return;

  const key = getApiKey();
  if (!key) {
    process.stderr.write('[n8n-monitor] no api key\n');
    return;
  }

  let resp;
  try { resp = await apiGet('/api/v1/executions?status=error&limit=50', key); }
  catch (e) {
    process.stderr.write(`[n8n-monitor] API failed: ${e.message}\n`);
    return;
  }

  const cutoff = now - WINDOW_HOURS * 3600 * 1000;
  const alerted = new Set(state.alerted);
  const wfNames = state.wfNames || {};
  const signatures = state.signatures || {};

  const candidates = (resp.data || []).filter(e => {
    if (alerted.has(e.id)) return false;
    const t = new Date(e.stoppedAt || e.startedAt).getTime();
    return t >= cutoff;
  });

  if (candidates.length === 0) {
    saveState({ ...state, lastRun: now, signatures });
    return;
  }

  const newWfIds = [...new Set(candidates.map(f => f.workflowId).filter(id => !wfNames[id]))];
  for (const wfId of newWfIds) {
    try {
      const wf = await apiGet(`/api/v1/workflows/${wfId}`, key);
      wfNames[wfId] = (wf.name || wfId).slice(0, 60);
    } catch { wfNames[wfId] = wfId; }
  }

  const fresh = [];
  let suppressed = 0;
  for (const e of candidates) {
    const sig = await getErrorSignature(e.id, key, e.workflowId);
    if (sig && signatures[sig]) {
      signatures[sig].count++;
      signatures[sig].lastId = e.id;
      signatures[sig].lastSeen = now;
      suppressed++;
    } else {
      if (sig) signatures[sig] = { firstId: e.id, lastId: e.id, count: 1, lastSeen: now };
      fresh.push(e);
    }
  }

  const sigEntries = Object.entries(signatures);
  if (sigEntries.length > 100) {
    sigEntries.sort((a, b) => (b[1].lastSeen || 0) - (a[1].lastSeen || 0));
    const trimmed = {};
    for (const [k, v] of sigEntries.slice(0, 100)) trimmed[k] = v;
    Object.keys(signatures).forEach(k => delete signatures[k]);
    Object.assign(signatures, trimmed);
  }

  if (fresh.length === 0) {
    if (suppressed > 0) console.log(`[N8N-MONITOR] ${suppressed} duplicate failure(s) suppressed`);
    const newAlerted = [...alerted, ...candidates.map(f => f.id)].slice(-200);
    saveState({ lastRun: now, alerted: newAlerted, wfNames, signatures });
    return;
  }

  const groups = {};
  for (const e of fresh) {
    const k = e.workflowId;
    if (!groups[k]) groups[k] = { name: wfNames[k] || k, count: 0, lastTime: '' };
    groups[k].count++;
    const t = new Date(e.stoppedAt || e.startedAt);
    const hhmm = `${String(t.getUTCHours()).padStart(2,'0')}:${String(t.getUTCMinutes()).padStart(2,'0')}`;
    if (!groups[k].lastTime || t.getTime() > new Date(groups[k].lastTime).getTime()) {
      groups[k].lastTime = t.toISOString();
      groups[k].lastHHMM = hhmm;
    }
  }

  const lines = Object.entries(groups)
    .sort((a, b) => b[1].count - a[1].count)
    .map(([id, g]) => `• ${g.name} × ${g.count} (last ${g.lastHHMM} UTC)`)
    .join('\n');

  const suppressNote = suppressed > 0 ? `\n\n(${suppressed} duplicate root cause suppressed)` : '';
  const msg = `⚠️ n8n failures (${fresh.length} new, last ${WINDOW_HOURS}h)\n\n${lines}${suppressNote}`;
  console.log(`[N8N-MONITOR] ${fresh.length} new failure(s) in ${Object.keys(groups).length} workflow(s)${suppressed ? `, ${suppressed} dup suppressed` : ''}`);

  try { await sendTelegram(TG_CHAT, msg); } catch {}

  const newAlerted = [...alerted, ...candidates.map(f => f.id)].slice(-200);
  saveState({ lastRun: now, alerted: newAlerted, wfNames, signatures });
}

run().catch(e => process.stderr.write(`[n8n-monitor] fatal: ${e.message}\n`));
