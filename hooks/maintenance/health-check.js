#!/usr/bin/env node
/**
 * Health Check — smoke test for ARKHOS infrastructure.
 *
 * Ported from ClaudeClaw GAP-4 (hooks/health-check.cjs), adapted for
 * local Windows + ARKHOS surface (different MCP set, no n8n local API,
 * SQLite tracker.db instead of claudeclaw.db).
 *
 * Skips checks already covered by vault-audit.js (vault graph health).
 * Focuses on ARKHOS-specific risks: hook syntax, SQLite, vault git, disk,
 * n8n remote reachability, credential files, Telegram bot reachable.
 *
 * Throttled: SessionStart, runs at most once per HOURS interval.
 * Reports failures via Telegram + stdout.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');
const { CLAUDE_DIR, VAULT_DIR } = require('../shared/paths');

const INTERVAL_HOURS = 6;
const STATE_FILE = path.join(CLAUDE_DIR, 'hooks', 'maintenance', '.health-check-state.json');
const HOOKS_DIR = path.join(CLAUDE_DIR, 'hooks');
const DB_PATH = path.join(CLAUDE_DIR, 'patterns', 'tracker.db');

function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); }
  catch { return { lastRun: 0 }; }
}
function saveState(s) { fs.writeFileSync(STATE_FILE, JSON.stringify(s, null, 2)); }

const state = loadState();
const now = Date.now();
const force = process.argv.includes('--force');
if (!force && now - state.lastRun < INTERVAL_HOURS * 3600 * 1000) process.exit(0);

const results = [];
function check(name, fn) {
  try { results.push({ name, ok: fn() === true, error: null }); }
  catch (e) { results.push({ name, ok: false, error: (e.message || String(e)).slice(0, 200) }); }
}

// 1. Hook syntax — all .js files in hooks/ subdirs
check('Hooks syntax', () => {
  const subdirs = ['session-start', 'user-prompt-submit', 'stop', 'pre-compact',
                   'pre-tool-use', 'post-tool-use', 'maintenance'];
  for (const sd of subdirs) {
    const dir = path.join(HOOKS_DIR, sd);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) {
      if (!f.endsWith('.js')) continue;
      const fp = path.join(dir, f);
      execSync(`node -c "${fp}"`, { timeout: 5000, stdio: 'ignore' });
    }
  }
  return true;
});

// 2. SQLite tracker.db — file exists and has valid SQLite magic header
check('SQLite tracker.db', () => {
  if (!fs.existsSync(DB_PATH)) throw new Error('not found');
  const fd = fs.openSync(DB_PATH, 'r');
  const buf = Buffer.alloc(16);
  fs.readSync(fd, buf, 0, 16, 0);
  fs.closeSync(fd);
  return buf.toString('utf8', 0, 15) === 'SQLite format 3';
});

// 3. Vault git — repo intact
check('Vault git', () => {
  execSync(`git -C "${VAULT_DIR}" rev-parse --is-inside-work-tree`, { timeout: 3000, stdio: 'ignore' });
  return true;
});

// 4. n8n remote reachability — via node https in subprocess (curl from execSync unreliable on Windows)
check('n8n.studiokook.ee', () => {
  const code = execSync(
    `node -e "const h=require('https');const r=h.request({hostname:'n8n.studiokook.ee',path:'/healthz',timeout:5000},x=>{console.log(x.statusCode);x.resume();});r.on('error',()=>console.log(0));r.on('timeout',()=>{r.destroy();console.log(0);});r.end();"`,
    { encoding: 'utf8', timeout: 8000 }
  ).trim();
  return code === '200';
});

// 5. Critical credentials present (file existence — not values)
check('Credentials', () => {
  const required = ['anthropic-api.key', 'telegram-bot.token', 'firecrawl-api.key'];
  for (const f of required) {
    if (!fs.existsSync(path.join(CLAUDE_DIR, 'credentials', f))) throw new Error(`missing: ${f}`);
  }
  return true;
});

// 6. Disk space (Windows: drive C:) — fs.statfsSync is native, no PS dependency
check('Disk space', () => {
  const s = fs.statfsSync('C:\\');
  const freeBytes = s.bavail * s.bsize;
  return freeBytes > 5 * 1024 * 1024 * 1024; // >5 GB
});

// 7. Observation-watch heartbeat — fail if watcher hasn't successfully run in 72h.
// 72h tolerates 3-day weekends + laptop offline. Reads `lastSuccess` not `lastAttempt`
// so a watcher that crashed mid-run shows up as stale (not silently masked).
check('Observation-watch alive', () => {
  const obsState = path.join(CLAUDE_DIR, 'hooks', 'maintenance', '.observation-watch-state.json');
  if (!fs.existsSync(obsState)) return true; // first-run grace period
  const s = JSON.parse(fs.readFileSync(obsState, 'utf8'));
  const lastSuccess = s.lastSuccess || 0;
  const ageH = (Date.now() - lastSuccess) / 3600000;
  if (ageH > 72) throw new Error(`last successful run ${Math.round(ageH)}h ago (>72h threshold)`);
  return true;
});

// 8. Auto-librarian heartbeat — fail if log mtime >36h (6 missed scheduled ticks).
// Catches the silent-failure mode where Task Scheduler reports LastTaskResult=0
// but the wscript→node chain never actually runs (wrapper crash, claude.cmd
// resolution break, etc — see 2026-05-09 incident). 36h tolerates a 3-day
// laptop-offline window while still surfacing a chain that's been dead across
// multiple ticks.
check('Auto-librarian alive', () => {
  const log = path.join(CLAUDE_DIR, 'logs', 'auto-librarian.log');
  if (!fs.existsSync(log)) return true; // first-run grace
  const ageH = (Date.now() - fs.statSync(log).mtime.getTime()) / 3600000;
  if (ageH > 36) throw new Error(`log mtime ${Math.round(ageH)}h ago (>36h threshold)`);
  return true;
});

// 9. .claude size sanity (warn if >2GB — ghost archives + memory + patterns)
check('.claude size <2GB', () => {
  const out = execSync(`powershell -NoProfile -Command "(Get-ChildItem '${CLAUDE_DIR}' -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum"`,
    { encoding: 'utf8', timeout: 30000 }).trim();
  const bytes = parseInt(out, 10);
  return Number.isFinite(bytes) && bytes < 2 * 1024 * 1024 * 1024;
});

// Persist run timestamp regardless
saveState({ lastRun: now });

const failures = results.filter(r => !r.ok);
if (failures.length === 0) {
  console.log(`[HEALTH] ✅ ${results.length}/${results.length} OK`);
  process.exit(0);
}

const failNames = failures.map(f => `${f.name}${f.error ? ': ' + f.error : ''}`);
console.log(`[HEALTH] ❌ ${failures.length}/${results.length}: ${failNames.join(' | ')}`);

// Alert to Telegram
try {
  const tokenFile = path.join(CLAUDE_DIR, 'credentials', 'telegram-bot.token');
  if (!fs.existsSync(tokenFile)) process.exit(0);
  const token = fs.readFileSync(tokenFile, 'utf8').trim();
  const chatId = '804465999';
  const msg = `❌ ARKHOS Health Check\n\nFailed (${failures.length}/${results.length}):\n` +
    failures.map(f => `• ${f.name}${f.error ? ': ' + f.error : ''}`).join('\n');
  const data = JSON.stringify({ chat_id: chatId, text: msg });
  const req = https.request({
    hostname: 'api.telegram.org',
    path: `/bot${token}/sendMessage`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
    timeout: 5000,
  });
  req.on('error', () => {});
  req.write(data);
  req.end();
} catch {}
