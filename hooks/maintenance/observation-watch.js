#!/usr/bin/env node
/**
 * Observation Watch — alerts when an "under observation" card hits its deadline,
 * and stales out review_due cards that get no resolution within 7 days.
 *
 * Reads vault `10-Projects/ARKHOS/observations/*.md`.
 * Frontmatter contract:
 *   type: observation
 *   subject: <name>
 *   observe_until: YYYY-MM-DD
 *   status: watching | review_due | extended | stale | closed
 *   alerted: YYYY-MM-DD       (set by hook for idempotency)
 *
 * On expiry: status → review_due, alerted → today, send Telegram.
 * After 7d in review_due without resolution: status → stale, send re-alert.
 *
 * State file tracks `lastAttempt` (written at start, heartbeat) and
 * `lastSuccess` (written only after card loop completes — used by health-check
 * to detect a silently-crashed watcher).
 *
 * Throttle: SessionStart, every 12h.
 */

const fs = require('fs');
const path = require('path');
const { CLAUDE_DIR, VAULT_DIR } = require('../shared/paths');
const { sendTelegram } = require('../shared/obsidian-api');

const INTERVAL_HOURS = 12;
const STALE_AFTER_DAYS = 7;
const VALID_STATUSES = new Set(['watching', 'review_due', 'extended', 'stale', 'closed']);
const STATE_FILE = path.join(CLAUDE_DIR, 'hooks', 'maintenance', '.observation-watch-state.json');
const OBS_DIR = path.join(VAULT_DIR, '10-Projects', 'ARKHOS', 'observations');
const CHAT_ID = '804465999';

function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); }
  catch { return { lastAttempt: 0, lastSuccess: 0, cardsChecked: 0, cardsAlerted: 0, cardsStaled: 0 }; }
}
function saveState(s) { fs.writeFileSync(STATE_FILE, JSON.stringify(s, null, 2)); }

const state = loadState();
const now = Date.now();
if (now - (state.lastAttempt || 0) < INTERVAL_HOURS * 3600 * 1000 && !process.argv.includes('--force')) {
  process.exit(0);
}

// Heartbeat: write lastAttempt up-front so health-check can see "we tried recently"
// even if processing crashes below.
saveState({ ...state, lastAttempt: now });

if (!fs.existsSync(OBS_DIR)) {
  console.log('[OBSERVATION] dir not found, skipping');
  process.exit(0);
}

const today = new Date().toISOString().slice(0, 10);
const todayMs = Date.parse(today);

function parseFrontmatter(text) {
  // Strip BOM if present
  const cleaned = text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text;
  const m = cleaned.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { fm: null, body: cleaned, raw: '' };
  const fm = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([\w_]+):\s*(.*)$/);
    if (kv) fm[kv[1]] = kv[2].trim();
  }
  return { fm, body: cleaned.slice(m[0].length), raw: m[1] };
}

function serializeFrontmatter(fm) {
  return Object.entries(fm).map(([k, v]) => `${k}: ${v}`).join('\n');
}

function daysSince(dateStr) {
  if (!dateStr) return Infinity;
  const ms = Date.parse(dateStr);
  if (Number.isNaN(ms)) return Infinity;
  return Math.floor((todayMs - ms) / 86400000);
}

const expired = [];
const staled = [];
const watching = [];
const hygieneIssues = [];
const enumIssues = [];

const files = fs.readdirSync(OBS_DIR).filter(f => f.endsWith('.md') && !f.startsWith('_'));

for (const f of files) {
  const fp = path.join(OBS_DIR, f);
  const text = fs.readFileSync(fp, 'utf8');
  const { fm, body } = parseFrontmatter(text);
  if (!fm || fm.type !== 'observation') continue;
  if (fm.status === 'closed' || fm.status === 'stale') continue;

  // Enum hygiene — warn but still process via fallback to "watching"
  if (fm.status && !VALID_STATUSES.has(fm.status)) {
    enumIssues.push(`${f} (status=${fm.status})`);
  }

  if (!fm.observe_until) continue;

  // `extended` recovery: re-arm by clearing alerted (Codex insight — extending
  // a card without clearing alerted leaves the next expiry silent).
  if (fm.status === 'extended' && fm.alerted) {
    delete fm.alerted;
    fm.status = 'watching';
    fs.writeFileSync(fp, `---\n${serializeFrontmatter(fm)}\n---\n${body}`);
  }

  // Hygiene invariant: status:watching + alerted is inconsistent — recover.
  const brokenHygiene = fm.status === 'watching' && fm.alerted;
  if (brokenHygiene) hygieneIssues.push(f);
  const effectiveAlerted = brokenHygiene ? null : fm.alerted;

  const overdue = fm.observe_until <= today;

  if (overdue && !effectiveAlerted) {
    fm.status = 'review_due';
    fm.alerted = today;
    fs.writeFileSync(fp, `---\n${serializeFrontmatter(fm)}\n---\n${body}`);
    expired.push({ file: f, ...fm });
  } else if (fm.status === 'review_due' && fm.alerted && daysSince(fm.alerted) >= STALE_AFTER_DAYS) {
    // 7+ days post-alert with no human resolution → stale + re-alert.
    // No file move per Codex — in-place mark only. archive/ reserved for explicit closures.
    fm.status = 'stale';
    fm.staled_at = today;
    fs.writeFileSync(fp, `---\n${serializeFrontmatter(fm)}\n---\n${body}`);
    staled.push({ file: f, ...fm });
  } else if (fm.status === 'watching') {
    watching.push({ file: f, ...fm });
  } else if (fm.status === 'review_due') {
    expired.push({ file: f, ...fm, _reAlert: false });
  }
}

if (hygieneIssues.length > 0) {
  console.log(`[OBSERVATION] ⚠️  hygiene drift: ${hygieneIssues.length} files with watching+alerted (treated as re-armed): ${hygieneIssues.join(', ')}`);
}
if (enumIssues.length > 0) {
  console.log(`[OBSERVATION] ⚠️  enum drift: ${enumIssues.length} files with non-standard status: ${enumIssues.join(', ')}`);
}

const fresh = expired.filter(e => e._reAlert !== false);
const totalAlerts = fresh.length + staled.length;

console.log(`[OBSERVATION] checked=${files.length} expired=${fresh.length} staled=${staled.length} watching=${watching.length}`);

// Persist success state (used by health-check.js to verify watcher liveness)
saveState({
  lastAttempt: now,
  lastSuccess: now,
  cardsChecked: files.length,
  cardsAlerted: fresh.length,
  cardsStaled: staled.length,
});

if (totalAlerts === 0) process.exit(0);

const expiredLines = fresh.map(e =>
  `• ${e.subject} (${e.host || 'n/a'}) — until ${e.observe_until}\n  ✓ ${e.success_criteria || 'criteria not set'}`
);
const staledLines = staled.map(e =>
  `• ${e.subject} — alerted ${e.alerted}, no resolution in ${STALE_AFTER_DAYS}d → status:stale`
);

const parts = [`⏰ ARKHOS Observations`];
if (fresh.length) parts.push(`Review due (${fresh.length}):\n${expiredLines.join('\n\n')}`);
if (staled.length) parts.push(`Auto-staled (${staled.length}):\n${staledLines.join('\n')}`);
parts.push(`Files: ObsidianVault/10-Projects/ARKHOS/observations/`);

sendTelegram(CHAT_ID, parts.join('\n\n')).catch(() => {});
