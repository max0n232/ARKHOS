// Spend Guard — external-spend / subagent-fanout ceiling (engineering-canon law A6).
// PreToolUse hook (NO matcher → receives stdin for every tool call, Bash + MCP alike).
// Sibling of production-guard.js: that gates A3 (irreversible PROD-MUTATION); this gates
// A6 (runaway external SPEND). Distinct concerns, distinct files, same block-shape.
//
// Two ceilings, both HARD (block when crossed, lift via deploy/spend codephrase stamp):
//   1. billed external calls/day — Gemini REST, Kie.ai, firecrawl credits. (n8n exec is A3
//      prod-mutation, already gated by production-guard — not double-counted here; see F4 note.)
//   2. subagent spawns/session — Task/Agent fan-out depth (runaway swarm backstop).
// "Lift the ceiling" = the SAME deploy codephrase (деплой/deploy/выкатывай) the user already
// uses for prod-writes — it is the one deliberate "I accept the cost" signal in this system.
// No separate "spend ok" phrase: deploy-approval-stamp only recognizes the deploy keywords.
//
// Counting is a PROXY (no native cost field exists in Claude Code — confirmed via docs):
// we count invocations of known-billed surfaces, not dollars. Ledger: patterns/resource-homeostat.json
// (date-keyed daily reset, mirrors gemini-quota.json shape).
//
// FAIL POSTURE (deliberate inversion of production-guard, documented in plan §7):
//   - Fail-OPEN on the meter's OWN errors (ledger unreadable, parse fail) → exit 0, tool proceeds.
//     A bug in a spend METER must never brick legitimate work (it's reversible: you spend slightly more).
//   - Fail-CLOSED only on a CONFIDENT ceiling-cross (ledger read OK, count >= ceiling, no approval) → block.
//     The block is the intended loud failure; everything else is open. (canon §3 protects against silent
//     DATA corruption — a read-only meter cannot corrupt data, so fail-open here is correct.)
//
// Approval (canon A3/A6): reuse production-guard's non-forgeable deploy-approval-stamp
// (UserPromptSubmit writes a per-session token from harness stdin the agent cannot forge).
// Same codephrase lifts both prod-write and spend ceilings for the session.

const fs = require("fs");
const path = require("path");

const HOME = process.env.HOME || process.env.USERPROFILE;
const LEDGER = path.join(HOME, ".claude", "patterns", "resource-homeostat.json");
const STAMP_FRESH_MS = 15 * 60 * 1000;

// --- Ceilings (tuned high to catch only RUNAWAY, not legitimate fan-out; refine via Observation) ---
const MAX_BILLED_PER_DAY = 40;        // billed external calls/day across all surfaces
const MAX_SUBAGENT_SPAWNS = 16;       // Task/Agent spawns per session (a 6-agent workflow is normal)

// --- Billed-surface classifiers (the only lever: match tool_name / command, count invocations) ---
// firecrawl = per-call credits (A6 spend). n8n execute/test_workflow are PROD-MUTATION already
// gated by production-guard (A3) — NOT counted here: PreToolUse hooks run in PARALLEL, so counting
// a call production-guard blocks would inflate the ledger on zero real spend (codex F4). A6 covers
// the firecrawl credit surface n8n's A3 guard does not. Verb anchored to the op position (no `.*`,
// which false-matched read-only get_execute_history — codex F1).
const MCP_BILLED = /^mcp__firecrawl__firecrawl_(scrape|crawl|search|extract|map|agent|parse)/i;
// Bash billed CLI: Gemini REST (GCP-billed; classify by SCRIPT path so it survives the bare-`gemini`
// CLI deprecation 2026-06-18) + Kie.ai endpoints (per-task billing, hostname-gated — bare `createTask`
// false-matched local scripts / commit msgs, codex F2).
const BASH_BILLED = /gemini-rest\.js|kie\.ai/i;

// freshnessMs = how long the deploy stamp keeps "approved" true for the EXACT-session match.
// Billed-spend (money) passes STAMP_FRESH_MS (tight). Spawn-ceiling passes Infinity: one деплой
// lifts spawn fan-out session-wide (block message promises "lift for this session"; a long task
// shouldn't re-hit the ceiling mid-run).
//
// allowCrossSession — the compact-desync fallback (below). Enabled ONLY for the spawn ceiling.
// COMPACT DESYNC (empirically found 2026-06-07): after /compact the harness gives the
// UserPromptSubmit hook (which writes the stamp) a DIFFERENT session_id than the PreToolUse hook
// (which reads it) within the same logical session. The exact-match token then lives under an id
// PreToolUse never queries → permanent false → permanent block despite a real деплой.
//
// WHY spawn-only (codex A/E must-fix 2026-06-07): the fallback cannot distinguish a compact
// id-rotation (same logical session) from a genuinely PARALLEL concurrent session (two Claude Code
// windows). For the BILLED-money ceiling that ambiguity is unacceptable — a parallel session's
// fresh stamp would silently lift a different session's spend block (canon A6, violates the
// stamp writer's "cannot leak across sessions" contract). So billed stays exact-session-only:
// after a compact the user re-says деплой once (5s cost) to re-arm the money ceiling. Spawn
// fan-out costs nothing financially, so cross-session acceptance there is a safe UX win.
function readStampApproval(sessionId, freshnessMs = STAMP_FRESH_MS, allowCrossSession = false) {
  // 1. Exact-session match — honors the caller's freshnessMs (Infinity for spawn = session-wide).
  if (sessionId) {
    try {
      const tok = JSON.parse(fs.readFileSync(
        path.join(HOME, ".claude", "hooks", `.deploy-approval-${sessionId}.json`), "utf8"));
      if (tok.sessionId === sessionId && tok.ts && (Date.now() - tok.ts) <= freshnessMs) return true;
    } catch { /* fall through */ }
  }
  if (!allowCrossSession) return false; // billed-money path: exact-session only, no cross-session leak
  // 2. Compact-desync fallback (spawn ceiling only) — newest deploy token from any session, ONLY
  //    within STAMP_FRESH_MS (never Infinity here → an old-session token cannot grant permanent lift).
  try {
    const dir = path.join(HOME, ".claude", "hooks");
    const now = Date.now();
    let newest = 0;
    for (const f of fs.readdirSync(dir)) {
      if (!f.startsWith(".deploy-approval-") || !f.endsWith(".json")) continue;
      try {
        const tok = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
        if (tok.ts && (now - tok.ts) <= STAMP_FRESH_MS && tok.ts > newest) newest = tok.ts;
      } catch { /* skip unreadable token */ }
    }
    return newest > 0;
  } catch { return false; }
}

function today() {
  // No Date.now()-free constraint here (this is a hook, not a workflow script): plain date is fine.
  return new Date().toISOString().split("T")[0];
}

// Load DAILY ledger (billed calls); reset if stale (new day). Throws → main → fail-OPEN.
// NOTE: subagent spawns are tracked SEPARATELY (per-session file, see loadSpawnState) so a
// session crossing midnight doesn't get its spawn counter wiped by the daily reset (codex F3).
function loadLedger() {
  let l = null;
  let corrupted = false;
  try { l = JSON.parse(fs.readFileSync(LEDGER, "utf8")); }
  catch (e) { corrupted = e.code !== "ENOENT"; } // missing file = normal first run, not corruption
  // Parse-valid but wrong shape (truncated write, manual edit) is corruption too — it would
  // silently reset the daily counter just like unparseable JSON (codex 2026-06-10).
  if (l !== null && (typeof l !== "object" || typeof l.date !== "string" || typeof l.billed_calls !== "number")) {
    corrupted = true;
    l = null;
  }
  if (corrupted) {
    // Stay fail-open (meter must not brick work) but FAIL LOUD (canon law 3 / A6): a corrupted
    // ledger silently resetting the daily counter = unlimited spend with zero signal. Surface it
    // on the maintenance bus so stack-auditor / weekly report shows the reset.
    try {
      require("../shared/ledger").appendLedger({
        key: "spend-guard:ledger-corruption", hook: "spend-guard", kind: "detected", severity: "error",
        title: "Spend-guard daily ledger unreadable — billed counter reset to 0 (fail-open)",
        detail: { file: LEDGER },
      });
    } catch { /* bus unavailable — stderr below is the last resort */ }
    try { process.stderr.write("spend-guard: ledger corrupted, counter reset\n"); } catch {}
  }
  if (!l || l.date !== today()) {
    l = { date: today(), billed_calls: 0, by_surface: {}, seen_ids: [] };
  }
  if (!Array.isArray(l.seen_ids)) l.seen_ids = [];
  return l;
}

// Per-session spawn ledger — survives the daily reset (a long session that crosses midnight
// keeps its fan-out count). Ephemeral, keyed on sessionId, like the .checkpoint-* flags.
function spawnStatePath(sessionId) {
  return path.join(HOME, ".claude", "hooks", `.homeostat-spawns-${sessionId || "nosession"}.json`);
}
function loadSpawnState(sessionId) {
  try { return JSON.parse(fs.readFileSync(spawnStatePath(sessionId), "utf8")); }
  catch { return { spawns: 0, seen: [] }; }
}
function saveSpawnState(sessionId, s) {
  if (s.seen.length > 200) s.seen = s.seen.slice(-100);
  try { fs.writeFileSync(spawnStatePath(sessionId), JSON.stringify(s), "utf8"); } catch {}
}

function saveLedger(l) {
  // Bound seen_ids growth (daily reset already caps it, but a long day could bloat).
  if (l.seen_ids.length > 2000) l.seen_ids = l.seen_ids.slice(-1000);
  try { fs.writeFileSync(LEDGER, JSON.stringify(l, null, 2), "utf8"); } catch {}
}

function classifyBilled(toolName, cmd) {
  if (MCP_BILLED.test(toolName)) return "firecrawl";
  if (toolName === "Bash" && BASH_BILLED.test(cmd)) {
    if (/gemini-rest/i.test(cmd)) return "gemini";
    if (/kie/i.test(cmd)) return "kie";
  }
  return null;
}

function block(reason) {
  process.stdout.write(JSON.stringify({ decision: "block", reason }));
}

function main(raw) {
  let input;
  try { input = JSON.parse(raw); } catch { return; } // unparseable stdin → fail-open

  const toolName = input.tool_name || "";
  const cmd = (input.tool_input && input.tool_input.command) || "";
  const sessionId = input.session_id || "";
  // Stable per-call key to dedupe subagent double-fire (RFC #45427: a subagent's tool calls
  // re-fire the parent PreToolUse). tool_use id is the harness-stable identity when present.
  const callId = input.tool_use_id || input.tool_use?.id || "";

  // --- Ceiling 1: subagent spawn fan-out (Task/Agent) — per-session, survives daily reset ---
  // Spawn lift is session-wide (Infinity freshness): one деплой lifts the spawn ceiling for the
  // whole session, matching the block message "lift for this session" (no 15-min re-block mid-task).
  if (toolName === "Task" || toolName === "Agent") {
    const approved = readStampApproval(sessionId, Infinity, true); // spawn: session-wide + compact-desync fallback
    const sess = loadSpawnState(sessionId);   // throws → caught below → fail-open
    if (callId && sess.seen.includes(callId)) return; // re-fire of same spawn → ignore
    if (sess.spawns >= MAX_SUBAGENT_SPAWNS && !approved) {
      return block(
        `A6 subagent ceiling: ${sess.spawns} spawns this session (limit ${MAX_SUBAGENT_SPAWNS}). ` +
        `Runaway fan-out backstop. User must say деплой/deploy/выкатывай to lift for this session.`
      );
    }
    sess.spawns += 1;
    if (callId) sess.seen.push(callId);
    saveSpawnState(sessionId, sess);
    return; // spawn allowed (or approved) — don't fall through to billed-call check
  }

  // --- Ceiling 2: billed external call (daily) ---
  const surface = classifyBilled(toolName, cmd);
  if (!surface) return; // not a spend-incurring call → allow silently
  const ledger = loadLedger();           // throws → caught below → fail-open
  if (callId && ledger.seen_ids.includes(callId)) return; // dedupe subagent re-fire

  // Billed-spend lift: tight 15-min window AND exact-session only (no cross-session fallback) —
  // money ceiling must not be liftable by a parallel session's stamp (codex must-fix 2026-06-07).
  const approved = readStampApproval(sessionId);
  if (ledger.billed_calls >= MAX_BILLED_PER_DAY && !approved) {
    return block(
      `A6 external-spend ceiling: ${ledger.billed_calls} billed calls today (limit ${MAX_BILLED_PER_DAY}, ` +
      `surface=${surface}). User must say деплой/deploy/выкатывай to lift for this session.`
    );
  }

  ledger.billed_calls += 1;
  ledger.by_surface[surface] = (ledger.by_surface[surface] || 0) + 1;
  if (callId) ledger.seen_ids.push(callId);
  saveLedger(ledger);
}

let chunks = [];
process.stdin.setEncoding("utf8");
process.stdin.on("data", (d) => chunks.push(d));
process.stdin.on("end", () => {
  try { main(chunks.join("")); }
  catch (e) {
    // fail-open by design (meter must not brick work) — but not SILENT (canon law 3)
    try { process.stderr.write(`spend-guard: ${e.message}\n`); } catch {}
  }
});
process.stdin.on("error", () => process.exit(0));
