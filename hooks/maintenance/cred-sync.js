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
const SSH_TIMEOUT_ENV_MS = 90000;           // env path: compose force-recreate + healthcheck is slower
const MTIME_SETTLE_MS = 5000;               // skip a key file written within the last 5s (torn-read guard)
const TG_CHAT = '804465999';
const VPS = 'root@157.180.33.253';
const SSH_KEY = path.join(CLAUDE_DIR, 'credentials', 'n8n-host-ssh.key');
const STATE_FILE = path.join(CLAUDE_DIR, 'hooks', 'maintenance', '.cred-sync-state.json');
const LOCK_FILE = STATE_FILE + '.lock';
const LOCK_TTL_MS = 5 * 60 * 1000;          // a stuck sync lock is stealable after 5 min
const LOG_FILE = path.join(CLAUDE_DIR, 'logs', 'cred-sync.log');

// ── Mapping table. `id` is the state-map + ledger key (MUST stay stable across deploys —
// the gemini `id` equals its old credId so its lastPushedHash is preserved). `syncType`
// dispatches the remote operation: 'credential' = n8n import:credentials; 'env' = rewrite a
// var in a docker .env + compose force-recreate. ──
const MAPPINGS = [{
  syncType: 'credential',
  id: 'lH0DpGTK2Q79me2I',                   // == credId; do not change (preserves state hash)
  keyFile: path.join(CLAUDE_DIR, 'credentials', 'gemini-api.key'),
  credId: 'lH0DpGTK2Q79me2I',
  credName: 'Gemini API Key (ARKHOS)',
  name: 'Gemini API Key (ARKHOS)',
  credType: 'httpHeaderAuth',
  headerName: 'x-goog-api-key',
}, {
  syncType: 'env',
  id: 'anthropic-env',                      // synthetic — not an n8n credId; state/ledger key
  keyFile: path.join(CLAUDE_DIR, 'credentials', 'anthropic-api.key'),
  name: 'Anthropic API Key (n8n .env)',
  envVar: 'ANTHROPIC_API_KEY',
  envFile: '/opt/n8n/.env',
  composeDir: '/opt/n8n',
  composeService: 'n8n',
  backupDir: '/opt/n8n/backups',
  backupKeep: 5,
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
  logLine(`[ERROR] ${m.id}: ${short}`);
  process.stderr.write(`[cred-sync] FAILED ${m.name}: ${short}\n`);
  try {
    appendLedger({
      key: `cred-sync:${m.id}`, hook: 'cred-sync', kind: 'detected',
      severity: 'error', title: `Cred sync failed: ${m.name} — ${short}`,
      detail: { id: m.id, target: 'remote-n8n' },
    });
  } catch {}
  sendTelegram(TG_CHAT, `⚠️ ARKHOS cred-sync failed\n${m.name}\n${short}`).catch(() => {});
}

// ── Dispatcher: route by syncType. Both paths keep the key off argv/stdout/log (A4). ──
function pushMapping(m, keyValue) {
  if (m.syncType === 'env') return pushEnvMapping(m, keyValue);
  return pushCredentialMapping(m, keyValue);
}

// ── A4-CRITICAL push path. Key reaches the remote ONLY via ssh stdin; never argv/stdout/log. ──
function pushCredentialMapping(m, keyValue) {
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

// ── A4-CRITICAL env push path. Rewrites one var in a docker .env, then compose-recreates.
// Key reaches the remote ONLY via ssh stdin → $KEY → tmpfile read by awk (NOT awk -v, which
// would expose it in the awk process /proc/cmdline — parity with the credential path's
// --rawfile rationale). LAW 1: backup .env BEFORE mutate. LAW 2: write to a temp file ON THE
// SAME FS (inside composeDir) then `mv` = atomic rename. LAW 3: any failure surfaces and the
// caller does NOT advance the hash → retry next session. Idempotent (Q3): if .env already
// holds the key, ENV_NOOP — no backup, no rewrite, no recreate (avoids a needless n8n bounce).
// Q4: refuse if the var is missing/duplicated (grep -c != 1) so a non-matching rewrite can't
// silently no-op; post-verify the written value and roll back from backup on mismatch.
function pushEnvMapping(m, keyValue) {
  const ev = m.envVar, ef = m.envFile, dir = m.composeDir, svc = m.composeService;
  const bdir = m.backupDir, keep = m.backupKeep;
  const remote = `bash -c '
set -e
KEYTMP=$(mktemp ${dir}/.cred-key.XXXXXX)
ENVTMP=$(mktemp ${dir}/.env.tmp.XXXXXX)
CURTMP=""; NEWTMP=""
# Trap covers EVERY exit path (set -e abort, guard exit, SIGKILL-then-EXIT). CURTMP/NEWTMP also
# hold key bytes (extracted live value) → shred them too, not just KEYTMP (codex A4 hardening).
cleanup() {
  shred -u "$KEYTMP" 2>/dev/null || rm -f "$KEYTMP"
  [ -n "$CURTMP" ] && { shred -u "$CURTMP" 2>/dev/null || rm -f "$CURTMP"; }
  [ -n "$NEWTMP" ] && { shred -u "$NEWTMP" 2>/dev/null || rm -f "$NEWTMP"; }
  rm -f "$ENVTMP"
}
trap cleanup EXIT
KEY="$(cat)"
[ -n "$KEY" ] || { echo "EMPTY_KEY" >&2; exit 3; }
cd ${dir}
[ -f ${ef} ] || { echo "NO_ENV_FILE" >&2; exit 6; }
printf "%s" "$KEY" > "$KEYTMP"
# Idempotency (Q3): compare live value to the new key by reading both from files (no echo of either).
CURTMP=$(mktemp ${dir}/.cur.XXXXXX)
# tr -d "\\n": grep|sed appends a trailing newline; KEYTMP (printf %s) has none → cmp would
# ALWAYS mismatch and ENV_NOOP could never fire (codex catch). Strip it for a true byte compare.
grep "^${ev}=" ${ef} | head -n1 | sed "s/^${ev}=//" | tr -d "\\n" > "$CURTMP" || true
if cmp -s "$KEYTMP" "$CURTMP"; then rm -f "$CURTMP"; echo "ENV_NOOP"; exit 0; fi
rm -f "$CURTMP"
# Q4 guard: exactly one uncommented assignment, else refuse (missing/dup → sed/awk would corrupt).
MATCHES=$(grep -c "^${ev}=" ${ef})
[ "$MATCHES" = "1" ] || { echo "BAD_ENV_MATCH=$MATCHES" >&2; exit 4; }
# LAW 1: backup BEFORE mutate, namespaced, into the dedicated backup dir.
mkdir -p ${bdir}
BK=${bdir}/.env.bak-anthropic-sync-$(date +%Y%m%d-%H%M%S)
cp -p ${ef} "$BK"
# LAW 2 + A4: literal substitution — awk reads the value from $KEYTMP (file), not argv.
awk -v ev="${ev}" "
  NR==FNR { val=\\$0; next }
  \\$0 ~ \"^\" ev \"=\" { print ev \"=\" val; done=1; next }
  { print }
  END { if (!done) exit 9 }
" "$KEYTMP" ${ef} > "$ENVTMP"
mv "$ENVTMP" ${ef}    # same-fs rename = atomic (LAW 2)
# Post-verify (Q4): re-read written value, compare to key file; rollback from backup on mismatch.
NEWTMP=$(mktemp ${dir}/.new.XXXXXX)
# tr -d "\\n": same trailing-newline strip as the NOOP check — without it cmp ALWAYS mismatches
# → rollback fires every run → key never persists, env path inoperative (codex catch).
grep "^${ev}=" ${ef} | head -n1 | sed "s/^${ev}=//" | tr -d "\\n" > "$NEWTMP" || true
if ! cmp -s "$KEYTMP" "$NEWTMP"; then rm -f "$NEWTMP"; cp -p "$BK" ${ef}; echo "VERIFY_FAILED_ROLLED_BACK" >&2; exit 5; fi
rm -f "$NEWTMP"
# Reload: n8n caches env in-process → force-recreate (NOT restart) so the new var is read.
docker compose up -d --force-recreate ${svc} >/dev/null 2>&1
# Backup rotation: keep the most recent N, drop older (only our namespaced backups).
ls -1t ${bdir}/.env.bak-anthropic-sync-* 2>/dev/null | tail -n +$((${keep} + 1)) | xargs -r rm -f
echo ENV_SYNC_OK
'`;

  const res = spawnSync('ssh', [
    '-i', SSH_KEY, '-o', 'BatchMode=yes', '-o', 'StrictHostKeyChecking=accept-new',
    '-o', 'ConnectTimeout=15', VPS, remote,
  ], { input: keyValue, timeout: SSH_TIMEOUT_ENV_MS, encoding: 'utf8' });

  // ENV_NOOP (remote already current) counts as success → local hash advances, no retry loop.
  if (res.status === 0 && /ENV_SYNC_OK|ENV_NOOP/.test(res.stdout || '')) return { ok: true };
  // stderr carries only markers (EMPTY_KEY / NO_ENV_FILE / BAD_ENV_MATCH / VERIFY_FAILED…) or
  // ssh-transport errors — never the key value (the key lives only in $KEY / the tmpfile).
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
      catch { logLine(`[skip] ${m.id}: keyfile unreadable`); continue; }
      if (!raw) { warn(m, 'empty key file — refusing to push (would brick credential)'); continue; }
      if (!force && now - stat.mtimeMs < MTIME_SETTLE_MS) {     // torn-read guard: file just written
        logLine(`[defer] ${m.id}: key file modified <${MTIME_SETTLE_MS}ms ago, retry next session`);
        continue;
      }

      const hash = crypto.createHash('sha256').update(raw).digest('hex');
      const prev = state.mappings[m.id] && state.mappings[m.id].lastPushedHash;
      if (!force && hash === prev) continue;  // LAW 4: unchanged → no-op (the common path).
                                              // --force re-pushes even if unchanged (manual "fix
                                              // it now" escape hatch, e.g. n8n cred reverted).

      const r = pushMapping(m, raw);
      if (r.ok) {
        state.mappings[m.id] = {
          lastPushedHash: hash, lastPushedAt: new Date().toISOString(), lastResult: 'ok',
        };
        pushed = true;
        const reload = m.syncType === 'env' ? 'recreated' : (RESTART_AFTER_IMPORT ? 'restarted' : 'no-reload');
        logLine(`[ok] pushed ${m.id} (key rotated), n8n ${reload}`);
        console.log(`[CRED-SYNC] ${m.name}: rotated key pushed to n8n (${reload})`);
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
