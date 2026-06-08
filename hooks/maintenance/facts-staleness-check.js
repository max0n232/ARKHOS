#!/usr/bin/env node
/**
 * facts-staleness-check.js — SessionStart staleness report for opt-in volatile facts.
 *
 * Root-#1 cure (ObsidianVault/.../architecture/rework-from-scratch-diagnosis-20260608.md):
 * a volatile fact (software version, credential, live endpoint, runtime state) whose
 * `verified:DATE` is older than its explicit `stale_after:Nd` budget is masquerading as
 * authoritative in always-loaded context — the exact trigger of the n8n-2.60 planning error.
 *
 * OPT-IN ONLY: reports a fact ONLY if its marker carries an explicit `stale_after:Nd`.
 * Bare facts are never flagged (the auto-classifier proved too noisy on 632 facts — see
 * diagnosis "Plan + adversarial review outcome"). This is honest-secondary-source, not
 * enforcement: it MARKS the fact stale in the report, it does NOT block anything.
 *
 * Read-only: never edits project-facts.md. Throttled like health-check/vault-audit.
 *
 * Usage: node facts-staleness-check.js [--force] [--json]
 */

const fs = require('fs');
const path = require('path');
const { CLAUDE_DIR } = require('../shared/paths');

const FACTS = path.join(CLAUDE_DIR, 'references', 'project-facts.md');
const STATE_FILE = path.join(CLAUDE_DIR, 'hooks', 'maintenance', '.facts-staleness-state.json');
const INTERVAL_HOURS = 12;

const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const AS_JSON = args.includes('--json');

// Re-verify hints by fact-key heuristic — embedded in the report so the agent knows
// WHERE ground truth lives (the diagnosis: a stale-flag is useless without the live source).
function reverifyHint(key, value) {
  if (/version|community_nodes|native_mcp/i.test(key))
    return 'live host: ssh root@157.180.33.253 "docker exec n8n n8n --version" / n8n_health_check';
  if (/credential|encryption_key|oauth|creds_apis/i.test(key))
    return 'credentials/ file — confirm rotation date; never trust the cached value';
  if (/scene_state|tracer/i.test(key))
    return 'live SketchUp via mcp__sketchup__get_scene_info';
  return 'the authoritative live source for this value';
}

function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); }
  catch { return { lastRun: 0 }; }
}
function saveState(s) {
  // Law 3: don't swallow silently — a failed throttle-write makes the hook fire every
  // session (noise) with no diagnostic. Surface to stderr so the cause is visible.
  try { fs.writeFileSync(STATE_FILE, JSON.stringify(s)); }
  catch (e) { process.stderr.write(`[FACTS-STALE] WARN: throttle state write failed (${e.message}) — will re-fire next session\n`); }
}

function parseDuration(s) {
  const m = String(s).match(/^(\d+)\s*d$/i);
  return m ? parseInt(m[1], 10) : null;
}

function main() {
  const now = Date.now();
  if (!FORCE) {
    const st = loadState();
    if (now - st.lastRun < INTERVAL_HOURS * 3600 * 1000) process.exit(0);
  }

  let content;
  try { content = fs.readFileSync(FACTS, 'utf8'); }
  catch { process.exit(0); } // file gone → nothing to do, fail-quiet

  const lines = content.split('\n');
  // A4 / constitution § Credentials: never echo a credential value OR a credential-file
  // reference into the report/log. Checked against BOTH the key and the value text.
  const SECRET_RE = /credential|encryption_key|oauth|creds_apis|token|password|_key\b/i;
  // Locate any fact marker first; parse fields order-independently (a marker written
  // stale_after-before-verified must not silently miss — codex review must-fix 2).
  const factRe = /<!--\s*fact:([^\s]+)\s+([^>]*?)-->/;
  const todayMs = now;
  const stale = [];

  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(factRe);
    if (!m) continue;
    const key = m[1];
    const attrs = m[2];
    const verifiedM = attrs.match(/verified:(\d{4}-\d{2}-\d{2})/);
    const staleM = attrs.match(/stale_after:(\d+)d\b/);
    if (!staleM) continue; // opt-in only: no stale_after → never flagged
    if (!verifiedM) { // malformed: budget without a verified date — surface, don't swallow (law 3)
      process.stderr.write(`[FACTS-STALE] WARN: fact:${key} has stale_after but no verified: — skipped\n`);
      continue;
    }
    const ttl = parseInt(staleM[1], 10);
    const age = Math.floor((todayMs - new Date(verifiedM[1]).getTime()) / 86400000);
    if (age <= ttl) continue;
    const rawValue = lines[i].replace(/<!--[\s\S]*?-->/g, '').replace(/^\s*-\s*/, '').trim();
    const isSecret = SECRET_RE.test(key) || SECRET_RE.test(rawValue);
    const value = isSecret ? '«[credential — value withheld]»' : rawValue.slice(0, 80);
    stale.push({ line: i + 1, key, verified: verifiedM[1], ttl, age, over: age - ttl,
      value, hint: reverifyHint(key, rawValue) });
  }

  saveState({ lastRun: now });

  if (AS_JSON) { console.log(JSON.stringify({ stale }, null, 2)); return; }
  if (!stale.length) process.exit(0); // silent when nothing stale — no noise

  stale.sort((a, b) => b.over - a.over);
  console.log(`[FACTS-STALE] ${stale.length} volatile fact(s) past their stale_after budget — re-verify against live source before relying on them:`);
  for (const s of stale) {
    console.log(`  • ${s.key} — verified ${s.verified} (${s.age}d ago, budget ${s.ttl}d)`);
    console.log(`    value: ${s.value}${s.value.length >= 80 ? '…' : ''}`);
    console.log(`    ↳ ${s.hint}`);
  }
}

main();
