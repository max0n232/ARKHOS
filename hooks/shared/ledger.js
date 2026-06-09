'use strict';
// Shared maintenance-ledger bus for ARKHOS hooks.
//
// WHY THIS MODULE EXISTS (File Discipline justification):
//   `appendLedger` was duplicated verbatim in auto-consolidate.js and memory-unload-worker.js,
//   and stack-auditor.js had its own readLedger/clearLedger. Promoting to one module lets EVERY
//   maintenance hook feed ONE bus → stack-auditor renders ONE weekly report (efferent §9 "acted"
//   + afferent §10 "detected — needs decision") instead of 6 scattered channels.
//   Concrete consumers (8): auto-consolidate, memory-unload-worker, drift-check, n8n-monitor,
//   atlas-staleness, vault-audit, health-check, stack-auditor.
//
// ENTRY SCHEMA (additive — old readers switch on `e.action`, kept for back-compat):
//   {
//     key:       string,   // DEDUP IDENTITY `${hook}:${findingId}` — REQUIRED (Law 4)
//     hook:      string,   // producing hook id
//     kind:      'detected'|'acted',  // afferent (needs decision) vs efferent (system did it)
//     severity:  'info'|'warn'|'error',
//     action:    string,   // legacy label stack-auditor §9 switches on (acted entries)
//     title:     string,   // one-line human summary
//     detail:    object,   // arbitrary structured payload (counts, files[], target label…)
//     firstSeen: ISO,      // set once on insert, preserved across upserts
//     lastSeen:  ISO,      // refreshed every upsert
//     count:     number,   // times (re-)seen since firstSeen
//     ts:        ISO,      // = lastSeen (legacy §9 reads e.ts)
//   }
//
// CONCURRENCY (Law 7): drift-check runs from Task Scheduler (.vbs) on its own clock and can
//   overlap a SessionStart batch. temp+rename is atomic for READERS but does NOT serialize the
//   read-modify-write → lost-update. So the WHOLE RMW runs under a wx-lock with TTL-steal
//   (mirrors the proven pattern in stack-auditor.js:79-96). Fail-open last-resort (these are
//   non-critical maintenance hooks — must never disrupt a session).

const fs = require('fs');
const path = require('path');
const os = require('os');

const CLAUDE_DIR = path.join(os.homedir(), '.claude');
const LEDGER = path.join(CLAUDE_DIR, 'patterns', 'maintenance-ledger.json');
const LOCK = LEDGER + '.lock';
const LOCK_TTL_MS = 60_000;   // steal a lock older than this (dead writer); 60s tolerates slow
                              // writers (Gemini-embed dedup held >30s → live lock stolen → lost update)
const LOCK_TRIES = 50;        // bounded retry budget (Law 9) — no infinite spin
const WAIT_BUDGET_MS = 2000;  // hard cap on TOTAL lock wait: PreToolUse callers (spend-guard) run
                              // under a 3s harness timeout (settings.json) — the spin must fail-open
                              // INSIDE that window or the harness kills the write mid-flight silently

function nowIso() { return new Date().toISOString(); }

// Run fn() while holding an exclusive lock over the ledger file. Wraps the ENTIRE
// read-modify-write so concurrent writers can't lose-update. Fail-open: if the lock can't be
// acquired within the budget, run fn() anyway (a possible lost-update on a non-critical bus is
// strictly better than a maintenance hook hanging or throwing into a session).
function withLock(fn) {
  const start = Date.now();
  for (let i = 0; i < LOCK_TRIES; i++) {
    try {
      fs.writeFileSync(LOCK, JSON.stringify({ pid: process.pid, started: Date.now() }), { flag: 'wx' });
      try { return fn(); }
      finally { try { fs.unlinkSync(LOCK); } catch {} }
    } catch (e) {
      if (e.code !== 'EEXIST') return fn();   // unexpected FS error → fail-open, don't lose the write
      // lock held — steal if stale, else brief bounded busy-wait (foreground sleep is unavailable)
      try {
        const cur = JSON.parse(fs.readFileSync(LOCK, 'utf8'));
        if (Date.now() - (cur.started || 0) > LOCK_TTL_MS) { fs.unlinkSync(LOCK); continue; }
      } catch { try { fs.unlinkSync(LOCK); continue; } catch {} }
      if (Date.now() - start >= WAIT_BUDGET_MS) break;   // total budget spent → fail-open NOW
      // Growing bounded wait (Law 9: backoff, no fixed-rate hammering). 50ms→400ms cap.
      const waitMs = Math.min(50 * (i + 1), 400);
      const t = Date.now(); while (Date.now() - t < waitMs) { /* bounded spin */ }
    }
  }
  return fn();   // last resort after budget exhausted — fail-open
}

function readUnlocked() {
  try {
    const arr = JSON.parse(fs.readFileSync(LEDGER, 'utf8'));
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

function writeUnlocked(arr) {
  fs.mkdirSync(path.dirname(LEDGER), { recursive: true });
  const tmp = LEDGER + '.tmp-' + process.pid;
  fs.writeFileSync(tmp, JSON.stringify(arr, null, 2), 'utf8');
  fs.renameSync(tmp, LEDGER);   // atomic for readers (Law 2)
}

// Read-only snapshot of the ledger (no lock — readers tolerate a slightly stale view).
function readLedger() { return readUnlocked(); }

// Upsert an entry by entry.key (Law 4: a re-detected finding refreshes in place, never
// duplicates). Preserves firstSeen, refreshes lastSeen/ts, increments count. Requires entry.key.
function appendLedger(entry) {
  if (!entry || !entry.key) return;   // key mandatory — silently ignore malformed (fail-safe, not fail-loud: bus is non-critical)
  withLock(() => {
    const arr = readUnlocked();
    const now = nowIso();
    const i = arr.findIndex(e => e && e.key === entry.key);
    if (i >= 0) {
      arr[i] = {
        ...arr[i], ...entry,
        firstSeen: arr[i].firstSeen || now,
        lastSeen: now, ts: now,
        count: (arr[i].count || 1) + 1,
      };
    } else {
      arr.push({ ...entry, firstSeen: now, lastSeen: now, ts: now, count: 1 });
    }
    writeUnlocked(arr);
  });
}

// Partitioned clear (Law 7: under the same lock). `keep` is a predicate: entries for which
// keep(entry) returns true are RETAINED, the rest dropped. With no predicate, wipe everything.
// stack-auditor uses this to clear `acted` entries after the weekly report while PERSISTING
// `detected` entries (a standing condition must keep surfacing until resolved).
function clearLedger(keep) {
  withLock(() => {
    if (typeof keep !== 'function') { try { fs.unlinkSync(LEDGER); } catch {} return; }
    const arr = readUnlocked();
    const kept = arr.filter(e => { try { return keep(e); } catch { return true; } });
    if (kept.length) writeUnlocked(kept);
    else try { fs.unlinkSync(LEDGER); } catch {}
  });
}

module.exports = { appendLedger, readLedger, clearLedger, LEDGER, nowIso };
