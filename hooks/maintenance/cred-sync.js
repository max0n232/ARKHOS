#!/usr/bin/env node
/**
 * Credential Auto-Sync — push a rotated local API key into its n8n credential.
 *
 * Root cause (2026-06-07): the local gemini key was rotated, but the n8n credential
 * `lH0DpGTK2Q79me2I` still held the stale value → daily WF o4GyBrp2rs4jZ2Y0 failed
 * with "API key expired" on every run. This hook closes that drift class.
 *
 * Trigger: SessionStart. Gate: SHA-256 of the trimmed key differs from last-pushed
 * (LAW 4 idempotency — no SSH unless the key actually changed). Throttle 12h.
 *
 * A4 (secret egress): the key value NEVER touches stdout / logs / argv / Claude context.
 * It flows file -> ssh stdin (spawnSync `input`) -> remote shell var -> jq --arg -> import.
 * The only thing persisted is a one-way SHA-256 hash.
 * LAW 1: the remote backs up the current decrypted credential before import, shreds after.
 * LAW 3: failures surface (stderr + Telegram + ledger + log) but never crash the session,
 *        and the hash is NOT advanced on failure → next session retries automatically.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const { CLAUDE_DIR } = require('../shared/paths');
const { sendTelegram } = require('../shared/obsidian-api');
const { appendLedger } = require('../shared/ledger');

const INTERVAL_HOURS = 12;
const RESTART_AFTER_IMPORT = true;          // n8n 2.18.5 caches decrypted creds in-process
const SSH_TIMEOUT_MS = 45000;               // export + import + docker restart can take ~30s
const MTIME_SETTLE_MS = 5000;               // skip a key file written within the last 5s (torn-read guard)
const TG_CHAT = '804465999';
const VPS = 'root@157.180.33.253';
const SSH_KEY = path.join(CLAUDE_DIR, 'credentials', 'n8n-host-ssh.key');
const STATE_FILE = path.join(CLAUDE_DIR, 'hooks', 'maintenance', '.cred-sync-state.json');
const LOCK_FILE = STATE_FILE + '.lock';
const LOCK_TTL_MS = 5 * 60 * 1000;          // a stuck sync lock is stealable after 5 min
const LOG_FILE = path.join(CLAUDE_DIR, 'logs', 'cred-sync.log');

// ── Mapping table: one entry today, clean spot for a 2nd later (File Discipline / YAGNI) ──
const MAPPINGS = [{
  keyFile: path.join(CLAUDE_DIR, 'credentials', 'gemini-api.key'),
  credId: 'lH0DpGTK2Q79me2I',
  credName: 'Gemini API Key (ARKHOS)',
  credType: 'httpHeaderAuth',
  headerName: 'x-goog-api-key',
}];

function loadState() {
  try {
    const s = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    if (!s.mappings) s.mappings = {};
    return s;
  } catch { return { lastRun: 0, mappings: {} }; }
}

function saveState(s) {
  const tmp = STATE_FILE + '.tmp-' + process.pid;
  fs.writeFileSync(tmp, JSON.stringify(s, null, 2), 'utf8');
  fs.renameSync(tmp, STATE_FILE);           // atomic (LAW 2)
}

function logLine(msg) {                      // NEVER logs the key value
  try {
    fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
    fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] ${msg}\n`, 'utf8');
  } catch {}
}

function readKey(keyFile) {                  // trim mirrors the manual `tr -d ' \t\r\n'`
  return fs.readFileSync(keyFile, 'utf8').replace(/[ \t\r\n]/g, '');
}

function warn(m, err) {                      // LAW 3: surface on every channel, never throw
  const short = String(err).slice(0, 200);
  logLine(`[ERROR] ${m.credId}: ${short}`);
  process.stderr.write(`[cred-sync] FAILED ${m.credName}: ${short}\n`);
  try {
    appendLedger({
      key: `cred-sync:${m.credId}`, hook: 'cred-sync', kind: 'detected',
      severity: 'error', title: `Cred sync failed: ${m.credName} — ${short}`,
      detail: { credId: m.credId, target: 'remote-n8n' },
    });
  } catch {}
  sendTelegram(TG_CHAT, `⚠️ ARKHOS cred-sync failed\n${m.credName}\n${short}`).catch(() => {});
}

// ── A4-CRITICAL push path. Key reaches the remote ONLY via ssh stdin; never argv/stdout/log. ──
function pushMapping(m, keyValue) {
  // Remote script (bash -c) reads the key from STDIN into $KEY, writes it to a temp file so jq
  // ingests it via --rawfile (NOT argv — no /proc/cmdline exposure), backs up the current
  // credential (LAW 1), imports (n8n re-encrypts), restarts n8n, then `trap cleanup EXIT`
  // SHREDS every plaintext copy UNCONDITIONALLY — even if import/restart fails under `set -e`
  // (codex: a bare && chain would skip cleanup on failure, leaving the plaintext key in /tmp).
  // jq stderr is suppressed so a jq error can never echo the key into our log/TG channel.
  const remote = `bash -c '
set -e
cleanup() {
  shred -u /tmp/cred-key.tmp 2>/dev/null || rm -f /tmp/cred-key.tmp
  shred -u /tmp/cred-import.json 2>/dev/null || rm -f /tmp/cred-import.json
  shred -u /tmp/cred-backup.json 2>/dev/null || rm -f /tmp/cred-backup.json
  docker exec n8n sh -c "shred -u /tmp/cred-import.json 2>/dev/null || rm -f /tmp/cred-import.json" >/dev/null 2>&1 || true
}
trap cleanup EXIT
KEY="$(cat)"
[ -n "$KEY" ] || { echo "EMPTY_KEY" >&2; exit 3; }
printf "%s" "$KEY" > /tmp/cred-key.tmp
docker exec n8n n8n export:credentials --id=${m.credId} --decrypted --output=/tmp/cred-backup.json >/dev/null 2>&1
jq -nc --rawfile v /tmp/cred-key.tmp --arg id "${m.credId}" --arg nm "${m.credName}" --arg ty "${m.credType}" --arg hn "${m.headerName}" "[{id:\\$id,name:\\$nm,type:\\$ty,data:{name:\\$hn,value:\\$v}}]" > /tmp/cred-import.json 2>/dev/null
docker cp /tmp/cred-import.json n8n:/tmp/cred-import.json >/dev/null 2>&1
docker exec n8n n8n import:credentials --input=/tmp/cred-import.json >/dev/null 2>&1
${RESTART_AFTER_IMPORT ? 'docker restart n8n >/dev/null 2>&1' : ':'}
echo SYNC_OK
'`;

  const res = spawnSync('ssh', [
    '-i', SSH_KEY, '-o', 'BatchMode=yes', '-o', 'StrictHostKeyChecking=accept-new',
    '-o', 'ConnectTimeout=15', VPS, remote,
  ], { input: keyValue, timeout: SSH_TIMEOUT_MS, encoding: 'utf8' });

  if (res.status === 0 && /SYNC_OK/.test(res.stdout || '')) return { ok: true };
  // Error string: docker/import stderr is suppressed remotely, so this carries only markers
  // (EMPTY_KEY) / ssh-transport errors — never the key value.
  const err = (res.stderr && res.stderr.trim()) || (res.error && res.error.message) || `ssh exit ${res.status}`;
  return { ok: false, err };
}

function acquireLock() {
  try {
    fs.writeFileSync(LOCK_FILE, JSON.stringify({ pid: process.pid, started: Date.now() }), { flag: 'wx' });
    return true;
  } catch (e) {
    if (e.code !== 'EEXIST') return true;    // unexpected FS error → fail-open (rare key rotation, low risk)
    try {
      const cur = JSON.parse(fs.readFileSync(LOCK_FILE, 'utf8'));
      if (Date.now() - (cur.started || 0) > LOCK_TTL_MS) { fs.unlinkSync(LOCK_FILE); return acquireLock(); }
    } catch { try { fs.unlinkSync(LOCK_FILE); return acquireLock(); } catch {} }
    return false;                            // another session is syncing — yield
  }
}

function releaseLock() { try { fs.unlinkSync(LOCK_FILE); } catch {} }

function run() {
  const force = process.argv.includes('--force');
  const now = Date.now();
  // Cheap pre-lock throttle read (avoids taking the lock on the common no-op path).
  if (!force && now - (loadState().lastRun || 0) < INTERVAL_HOURS * 3600 * 1000) return;

  if (!acquireLock()) return;
  try {
    const state = loadState();   // authoritative re-read INSIDE the lock (codex: check-lock-recheck
                                 // — else two concurrent sessions both push + double-restart n8n).
    let pushed = false;
    for (const m of MAPPINGS) {
      let raw, stat;
      try { stat = fs.statSync(m.keyFile); raw = readKey(m.keyFile); }
      catch { logLine(`[skip] ${m.credId}: keyfile unreadable`); continue; }
      if (!raw) { warn(m, 'empty key file — refusing to push (would brick credential)'); continue; }
      if (!force && now - stat.mtimeMs < MTIME_SETTLE_MS) {     // torn-read guard: file just written
        logLine(`[defer] ${m.credId}: key file modified <${MTIME_SETTLE_MS}ms ago, retry next session`);
        continue;
      }

      const hash = crypto.createHash('sha256').update(raw).digest('hex');
      const prev = state.mappings[m.credId] && state.mappings[m.credId].lastPushedHash;
      if (!force && hash === prev) continue;  // LAW 4: unchanged → no-op (the common path).
                                              // --force re-pushes even if unchanged (manual "fix
                                              // it now" escape hatch, e.g. n8n cred reverted).

      const r = pushMapping(m, raw);
      if (r.ok) {
        state.mappings[m.credId] = {
          lastPushedHash: hash, lastPushedAt: new Date().toISOString(), lastResult: 'ok',
        };
        pushed = true;
        logLine(`[ok] pushed ${m.credId} (key rotated), n8n restarted=${RESTART_AFTER_IMPORT}`);
        console.log(`[CRED-SYNC] ${m.credName}: rotated key pushed to n8n${RESTART_AFTER_IMPORT ? ' (restarted)' : ''}`);
      } else {
        warn(m, r.err);                       // hash NOT advanced → auto-retry next session
      }
    }
    state.lastRun = now;
    saveState(state);
    if (pushed) {
      appendLedger({
        key: 'cred-sync:last-push', hook: 'cred-sync', kind: 'acted', severity: 'info',
        title: 'Credential(s) synced to n8n after local rotation', detail: { at: new Date().toISOString() },
      });
    }
  } finally {
    releaseLock();
  }
}

try { run(); }
catch (e) { process.stderr.write(`[cred-sync] fatal: ${e.message}\n`); }
