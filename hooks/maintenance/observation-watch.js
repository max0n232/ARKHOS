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
 * Also scans vault `10-Projects/Legal/**` frontmatter for `recheck_due: YYYY-MM-DD`
 * (legal citation re-verification deadlines — audit 2026-06-10: 9 files carried the
 * field with zero monitoring). Overdue → same Telegram alert. Legal files are NOT
 * mutated; alert idempotency lives in the state file keyed by file+due, re-alert
 * every 7 days while overdue. Files with superseded status are skipped.
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
const LEGAL_DIR = path.join(VAULT_DIR, '10-Projects', 'Legal');
const LEGAL_REALERT_DAYS = 7;
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
  if (['closed','failed','done','completed','stale','archived','superseded'].includes(fm.status)) continue;

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

// --- Legal recheck_due scan (read-only over vault Legal/, state-file idempotency) ---
const legalState = state.legalRecheck || {};
const legalDue = [];

function walkMd(dir, out = []) {
  let entries = [];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const fp = path.join(dir, e.name);
    if (e.isDirectory()) walkMd(fp, out);
    else if (e.name.endsWith('.md')) out.push(fp);
  }
  return out;
}

if (fs.existsSync(LEGAL_DIR)) {
  for (const fp of walkMd(LEGAL_DIR)) {
    let fm;
    try { fm = parseFrontmatter(fs.readFileSync(fp, 'utf8')).fm; } catch { continue; }
    if (!fm || !fm.recheck_due) continue;
    const due = String(fm.recheck_due).slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(due) || due > today) continue;
    const status = `${fm.verification_status || ''} ${fm.status || ''}`;
    if (/superseded/.test(status)) continue;
    const rel = path.relative(VAULT_DIR, fp).split(path.sep).join('/');
    const key = `${rel}|${due}`;
    const lastAlerted = legalState[key] || 0;
    if (now - lastAlerted < LEGAL_REALERT_DAYS * 86400000) continue;
    legalState[key] = now;
    legalDue.push({ rel, due });
  }
  // Drop state entries for files whose due passed out of scope (re-verified or removed)
  for (const key of Object.keys(legalState)) {
    const [rel] = key.split('|');
    if (!fs.existsSync(path.join(VAULT_DIR, rel))) delete legalState[key];
  }
}

const fresh = expired.filter(e => e._reAlert !== false);
const totalAlerts = fresh.length + staled.length + legalDue.length;

console.log(`[OBSERVATION] checked=${files.length} expired=${fresh.length} staled=${staled.length} watching=${watching.length} legalRecheckDue=${legalDue.length}`);

// Persist success state (used by health-check.js to verify watcher liveness)
saveState({
  lastAttempt: now,
  lastSuccess: now,
  cardsChecked: files.length,
  cardsAlerted: fresh.length,
  cardsStaled: staled.length,
  legalRecheck: legalState,
});

if (totalAlerts === 0) process.exit(0);

const expiredLines = fresh.map(e =>
  `• ${e.subject} (${e.host || 'n/a'}) — until ${e.observe_until}\n  ✓ ${e.success_criteria || 'criteria not set'}`
);
const staledLines = staled.map(e =>
  `• ${e.subject} — alerted ${e.alerted}, no resolution in ${STALE_AFTER_DAYS}d → status:stale`
);

// Codex review 2026-06-10: escape '_' (parse_mode Markdown treats it as italic —
// legal paths like _index.md would break the whole message) + cap line count.
const LEGAL_LINES_MAX = 15;
const legalLines = legalDue.slice(0, LEGAL_LINES_MAX)
  .map(e => `• ${e.rel.replace(/_/g, '\\_')} — due ${e.due}`);
if (legalDue.length > LEGAL_LINES_MAX) {
  legalLines.push(`• … (+${legalDue.length - LEGAL_LINES_MAX} ещё — см. vault Legal/)`);
}

const parts = [`⏰ ARKHOS Observations`];
if (fresh.length) parts.push(`Review due (${fresh.length}):\n${expiredLines.join('\n\n')}`);
if (staled.length) parts.push(`Auto-staled (${staled.length}):\n${staledLines.join('\n')}`);
if (legalDue.length) parts.push(`⚖️ Legal re-verification due (${legalDue.length}) — нормы могли измениться, прогнать law-ee verify:\n${legalLines.join('\n')}`);
parts.push(`Files: ObsidianVault/10-Projects/ARKHOS/observations/`);

// Length guard + 400-fallback live centrally in shared sendTelegram (2026-06-11):
// 4096-code-point truncation + non-2xx reject + plain-text retry on Markdown 400.
sendTelegram(CHAT_ID, parts.join('\n\n')).catch(e =>
  console.error(`[OBSERVATION] telegram send failed: ${e.message}`));
