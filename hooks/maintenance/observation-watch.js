#!/usr/bin/env node
/**
 * Observation Watch — alerts when an "under observation" card hits its deadline.
 *
 * Reads vault `10-Projects/ARKHOS/observations/*.md`.
 * Frontmatter contract:
 *   type: observation
 *   subject: <name>
 *   observe_until: YYYY-MM-DD
 *   status: watching | review_due | closed | extended
 *   alerted: YYYY-MM-DD       (set by hook for idempotency)
 *
 * On expiry: status → review_due, alerted → today, send Telegram.
 * Throttle: SessionStart, every 12h.
 */

const fs = require('fs');
const path = require('path');
const { CLAUDE_DIR, VAULT_DIR } = require('../shared/paths');
const { sendTelegram } = require('../shared/obsidian-api');

const INTERVAL_HOURS = 12;
const STATE_FILE = path.join(CLAUDE_DIR, 'hooks', 'maintenance', '.observation-watch-state.json');
const OBS_DIR = path.join(VAULT_DIR, '10-Projects', 'ARKHOS', 'observations');
const CHAT_ID = '804465999';

function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); }
  catch { return { lastRun: 0 }; }
}
function saveState(s) { fs.writeFileSync(STATE_FILE, JSON.stringify(s, null, 2)); }

const state = loadState();
const now = Date.now();
if (now - state.lastRun < INTERVAL_HOURS * 3600 * 1000) process.exit(0);
saveState({ lastRun: now });

if (!fs.existsSync(OBS_DIR)) {
  console.log('[OBSERVATION] dir not found, skipping');
  process.exit(0);
}

const today = new Date().toISOString().slice(0, 10);

function parseFrontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { fm: null, body: text, raw: '' };
  const fm = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([\w_]+):\s*(.*)$/);
    if (kv) fm[kv[1]] = kv[2].trim();
  }
  return { fm, body: text.slice(m[0].length), raw: m[1] };
}

function serializeFrontmatter(fm) {
  return Object.entries(fm).map(([k, v]) => `${k}: ${v}`).join('\n');
}

const expired = [];
const watching = [];

for (const f of fs.readdirSync(OBS_DIR)) {
  if (!f.endsWith('.md') || f.startsWith('_')) continue;
  const fp = path.join(OBS_DIR, f);
  const text = fs.readFileSync(fp, 'utf8');
  const { fm, body } = parseFrontmatter(text);
  if (!fm || fm.type !== 'observation') continue;
  if (fm.status === 'closed') continue;
  if (!fm.observe_until) continue;

  const overdue = fm.observe_until <= today;

  if (overdue && !fm.alerted) {
    fm.status = 'review_due';
    fm.alerted = today;
    fs.writeFileSync(fp, `---\n${serializeFrontmatter(fm)}\n---\n${body}`);
    expired.push({ file: f, ...fm });
  } else if (fm.status === 'watching') {
    watching.push({ file: f, ...fm });
  } else if (fm.status === 'review_due') {
    expired.push({ file: f, ...fm, _reAlert: false });
  }
}

if (expired.filter(e => e._reAlert !== false).length === 0) {
  console.log(`[OBSERVATION] ✅ ${watching.length} watching, no expired`);
  process.exit(0);
}

const fresh = expired.filter(e => e._reAlert !== false);
console.log(`[OBSERVATION] ⏰ ${fresh.length} review_due | ${watching.length} watching`);

const lines = fresh.map(e =>
  `• ${e.subject} (${e.host || 'n/a'}) — until ${e.observe_until}\n  ✓ ${e.success_criteria || 'criteria not set'}`
);
const msg = `⏰ ARKHOS Observations — review due (${fresh.length})\n\n` +
  lines.join('\n\n') +
  `\n\nFiles: ObsidianVault/10-Projects/ARKHOS/observations/`;

sendTelegram(CHAT_ID, msg).catch(() => {});
