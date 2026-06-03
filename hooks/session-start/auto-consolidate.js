#!/usr/bin/env node
/**
 * Auto-Consolidate (SessionStart hook)
 *
 * ROOT-CAUSE fix for "uncommitted drift piles up in .claude". The vault auto-commits;
 * .claude never did, so machine housekeeping (hooks deleting .bak, creating snapshots,
 * session-audit appending facts) accumulated uncommitted for weeks. This consolidates
 * the SAFE class autonomously and SURFACES the critical-path class for a human decision.
 *
 * TRUST BOUNDARY (the whole point — do NOT auto-commit blindly like the vault):
 *   ✅ auto-commit  — only files matching SAFE_ALLOWLIST (logs/, data-home auto-appends,
 *                     .gitkeep). Pure machine housekeeping, low loss, reversible.
 *   🚫 NEVER commit — critical-path (settings.json, hooks/, CLAUDE.md, rules/, agents/,
 *                     skills/, credentials/, patterns/*.js, .gitignore) + ANYTHING not on
 *                     the allowlist. These are SURFACED ("N files await a deliberate commit")
 *                     but left for the human/agent to commit with intent + codex-gate.
 *   ⛔ SECRET FUSE  — before committing, the staged set is grepped for secret patterns and
 *                     embedded .git repos; ANY hit aborts the whole commit (fail-safe).
 *
 * Throttle: once per THROTTLE_H hours (flag file). Fail-OPEN on any own error (a buggy
 * housekeeping commit must never disrupt session start). Output goes to stdout — note
 * SessionStart stdout does NOT enter model context, so the SURFACE message also writes a
 * pending flag that compact-report-injector relays on the next UserPromptSubmit.
 */

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const CLAUDE_DIR = path.join(process.env.HOME || process.env.USERPROFILE, '.claude');
const FLAG = path.join(CLAUDE_DIR, 'hooks', '.auto-consolidate-last.json');
const SURFACE_FLAG = path.join(CLAUDE_DIR, 'hooks', '.consolidate-surface.json');
const LEDGER = path.join(CLAUDE_DIR, 'patterns', 'maintenance-ledger.json');
const THROTTLE_H = 6;

// Append an autonomous-action entry to the shared maintenance ledger (stack-auditor reads it
// weekly → one TG report "what the system did on its own"). Atomic temp+rename, fail-silent.
function appendLedger(entry) {
  let arr = [];
  try { arr = JSON.parse(fs.readFileSync(LEDGER, 'utf8')); if (!Array.isArray(arr)) arr = []; } catch {}
  arr.push(entry);
  try {
    fs.mkdirSync(path.dirname(LEDGER), { recursive: true });
    const tmp = LEDGER + '.tmp-' + process.pid;
    fs.writeFileSync(tmp, JSON.stringify(arr, null, 2), 'utf8');
    fs.renameSync(tmp, LEDGER);
  } catch {}
}

// SAFE to auto-commit: machine housekeeping only. Anchored to known data-homes / log dirs.
// NB: logs/rollback/ is gitignored already, so it never appears in status — no carve-out needed.
const SAFE_ALLOWLIST = [
  /^logs\//,
  /(^|\/)\.gitkeep$/,
];
// NOTE: references/project-facts.md was a candidate (session-audit auto-appends), but it
// documents truncated key PREFIXES (sk-ant-/fc-) as facts → the secret fuse trips on it
// every run and it can never auto-commit anyway (codex F1). Left out of SAFE → it surfaces
// for a deliberate commit instead. Cleaner than special-casing the fuse for one file.
// Critical-path: NEVER auto-commit, always SURFACE. Mirrors codex-gate CRITICAL_PATHS + secrets.
const CRITICAL = [
  /(^|\/)settings\.json$/, /(^|\/)hooks\//, /(^|\/)\.githooks\//, /(^|\/)CLAUDE\.md$/,
  /(^|\/)rules\//, /(^|\/)agents\//, /(^|\/)skills\//, /(^|\/)credentials\//,
  /(^|\/)patterns\/.*\.js$/, /(^|\/)\.gitignore$/,
];
// Secret fuse: if a staged path OR its content smells of secrets, abort the commit.
const SECRET_NAME = /(oauth|token|secret|\bkey\b|key-rotation|\.key$|\.pem$|service-account|credential|\.env$|encryption)/i;
const SECRET_CONTENT = /api[_-]?key|private_key|client_secret|access_token|refresh_token|BEGIN [A-Z ]*PRIVATE KEY|sk-ant-|fc-/i;

function git(args) {
  // NB: do NOT .trim() here — porcelain lines start with a leading space for some statuses
  // (" M path"); trimming the whole blob eats the first line's leading space and shifts the
  // path parse by one char. Trim only the trailing newline.
  return execFileSync('git', args, { cwd: CLAUDE_DIR, encoding: 'utf8', timeout: 15000 }).replace(/\n+$/, '');
}

function throttled() {
  try {
    const f = JSON.parse(fs.readFileSync(FLAG, 'utf8'));
    return (Date.now() - f.ts) < THROTTLE_H * 3600 * 1000;
  } catch { return false; }
}

function classify(porcelainLine) {
  // porcelain: "XY path" — XY = status, path may be quoted/renamed. Take path tail.
  const status = porcelainLine.slice(0, 2);
  let p = porcelainLine.slice(3);
  if (p.includes(' -> ')) p = p.split(' -> ')[1];          // rename
  p = p.replace(/^"|"$/g, '');                              // unquote
  const safe = SAFE_ALLOWLIST.some(re => re.test(p));
  const critical = CRITICAL.some(re => re.test(p));
  return { status, path: p, safe, critical };
}

function looksSecret(p) {
  if (SECRET_NAME.test(p)) return true;
  // Content check only for added/modified files that exist on disk (deletions can't leak).
  try {
    const abs = path.join(CLAUDE_DIR, p);
    if (!fs.existsSync(abs)) return false;
    if (fs.statSync(abs).size > 512 * 1024) return false;  // skip huge files
    return SECRET_CONTENT.test(fs.readFileSync(abs, 'utf8'));
  } catch { return false; }
}

function main() {
  if (throttled()) return;

  let porcelain;
  try { porcelain = git(['status', '--porcelain']); } catch { return; } // not a repo / git absent → fail-open
  // Stamp throttle EARLY so a mid-run error doesn't make us retry every session-start.
  try { fs.writeFileSync(FLAG, JSON.stringify({ ts: Date.now() }), 'utf8'); } catch {}

  if (!porcelain) return; // clean tree — nothing to do
  const entries = porcelain.split('\n').filter(Boolean).map(classify);

  const safe = entries.filter(e => e.safe && !e.critical);
  // surface = NOT cleanly safe. Must include safe+critical OVERLAP (e.g. logs/hooks/x.js
  // matches both) — `!safe` alone would drop it from BOTH lists silently (codex F2).
  const surface = entries.filter(e => !e.safe || e.critical);

  // --- Auto-commit the SAFE class, with the secret fuse ---
  if (safe.length) {
    const tainted = safe.filter(e => e.status !== ' D' && e.status !== 'D ' && looksSecret(e.path));
    // codex BONUS must-fix: if the USER pre-staged anything before this session, `git diff
    // --cached` would include it and our commit would absorb it (and `git reset` would wipe
    // their staging). Never touch a non-empty pre-existing index — surface and bail entirely.
    let preStaged = [];
    try { preStaged = git(['diff', '--cached', '--name-only']).split('\n').filter(Boolean); } catch {}
    if (tainted.length) {
      // Secret fuse tripped — do NOT commit anything; fold into surface for human review.
      surface.push(...safe);
    } else if (preStaged.length) {
      // User has work staged — respect it, do not auto-commit on top of a human's index.
      surface.push(...safe);
    } else {
      try {
        for (const e of safe) git(['add', '--', e.path]);
        // Re-verify only our intended paths got staged (no surprise critical file rode along).
        const staged = git(['diff', '--cached', '--name-only']).split('\n').filter(Boolean);
        const strayCritical = staged.filter(p => CRITICAL.some(re => re.test(p)));
        if (strayCritical.length) {
          git(['reset', '-q']); // abort — a critical file slipped into staging
          surface.push(...safe);
        } else if (staged.length) {
          git(['commit', '-q', '-m',
            `chore(auto): consolidate ${staged.length} housekeeping change(s)\n\n` +
            `Auto-consolidate hook (SAFE class only: logs/, data-home appends, .gitkeep).\n` +
            `Critical-path is never auto-committed — surfaced for deliberate commit.`]);
          appendLedger({
            ts: new Date().toISOString(),
            action: 'auto-consolidate-commit',
            count: staged.length,
            files: staged.slice(0, 10),
          });
        }
      } catch {
        try { git(['reset', '-q']); } catch {}
      }
    }
  }

  // --- SURFACE the critical/unrecognized class (do NOT commit) ---
  if (surface.length) {
    const list = surface.slice(0, 12).map(e => `${e.status.trim()} ${e.path}`).join('; ');
    const msg = `${surface.length} uncommitted file(s) await a DELIBERATE commit (not auto-committed — critical-path/unrecognized): ${list}${surface.length > 12 ? ' …' : ''}`;
    try { fs.writeFileSync(SURFACE_FLAG, JSON.stringify({ ts: Date.now(), count: surface.length, msg }), 'utf8'); } catch {}
    console.log(`[AUTO-CONSOLIDATE] ${msg}`);
  } else {
    try { fs.unlinkSync(SURFACE_FLAG); } catch {}
  }
}

try { main(); } catch { /* fail-open: housekeeping must never disrupt session start */ }
