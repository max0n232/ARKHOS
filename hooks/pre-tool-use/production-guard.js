// Production Guard — blocks destructive operations targeting studiokook.ee
// PreToolUse hook (NO matcher → receives stdin for every tool call, Bash + MCP alike)
// Two guarded surfaces:
//   1. Bash: curl/SSH/PowerShell command strings hitting studiokook.ee with a write verb.
//   2. MCP:  tool_name carrying a production-mutation verb (n8n execute/publish/update/delete,
//            any future WP-adapter write/replace/restore/deploy/full-clear). Verb-substring
//            matching — NOT server-prefix (would over-block read-only build tools) and NOT a
//            fixed tool list (model can substitute a sibling tool with the same effect).
// Approval (canon A3): deploy-codephrase, checked via two sources in precedence order:
//   1. NON-FORGEABLE stamp — deploy-approval-stamp.js (UserPromptSubmit) records the
//      codephrase from the harness-delivered prompt (stdin), which an agent cannot forge.
//      15-min freshness window + per-session scope. This closes the live-MCP-write gap.
//   2. FALLBACK history.jsonl scan — forgeable (append-only file), kept only for sessions
//      predating the stamp hook. Defense-in-depth: forging it still requires defeating the
//      auto-mode classifier (which blocks .claude/ control-file writes intent-aware).
//   Fail-CLOSED: neither source matching = block. Git commit-msg codex-gate remains the
//   persist-time backstop for commits.
// Returns {"decision":"block","reason":"..."} or allows silently.

const fs = require("fs");
const path = require("path");

const DEPLOY_KEYWORDS = /деплой|deploy|выкатывай|выкати|задеплой|разверни|пуш на прод|push to prod/i;
const HISTORY_LOOKBACK = 10; // check last N user messages
const STAMP_FRESH_MS = 15 * 60 * 1000; // approval token valid 15 min (shrinks replay window)

// Non-forgeable approval (canon A3): the deploy-approval-stamp UserPromptSubmit hook
// writes this token from the harness-delivered prompt (stdin), which an agent cannot
// forge — unlike history.jsonl, an append-only file any process can write to. Prefer
// the stamp; fall back to the history scan only when no stamp exists (sessions
// predating the stamp hook). Fail-CLOSED: neither source matching → not approved.
function hasStampApproval(sessionId) {
  if (!sessionId) return false;
  const tokenPath = path.join(
    process.env.HOME || process.env.USERPROFILE,
    ".claude", "hooks", `.deploy-approval-${sessionId}.json`
  );
  try {
    const tok = JSON.parse(fs.readFileSync(tokenPath, "utf8"));
    if (tok.sessionId !== sessionId) return false;       // cross-session isolation
    if (!tok.ts || (Date.now() - tok.ts) > STAMP_FRESH_MS) return false; // staleness
    return true;
  } catch { return false; } // no/unreadable token → defer to fallback, not auto-approve
}

function hasHistoryApproval(sessionId) {
  // Fail-closed on missing session: without a sessionId the loop below would drop
  // its session filter (`sessionId && ...`) and approve on ANY session's codephrase
  // (cross-session unlock). No session → no approval. (codex review 2026-06-02)
  if (!sessionId) return false;
  const historyPath = path.join(
    process.env.HOME || process.env.USERPROFILE,
    ".claude",
    "history.jsonl"
  );
  try {
    const data = fs.readFileSync(historyPath, "utf8");
    const lines = data.trim().split("\n");
    // Read from end, find recent messages in this session
    let checked = 0;
    for (let i = lines.length - 1; i >= 0 && checked < HISTORY_LOOKBACK; i--) {
      try {
        const entry = JSON.parse(lines[i]);
        if (sessionId && entry.sessionId !== sessionId) continue;
        checked++;
        if (entry.display && DEPLOY_KEYWORDS.test(entry.display)) return true;
      } catch { /* skip malformed lines */ }
    }
  } catch { /* history unreadable — deny */ }
  return false;
}

function hasUserApproval(sessionId) {
  // Non-forgeable stamp takes precedence; forgeable history.jsonl is degraded fallback.
  if (hasStampApproval(sessionId)) return true;
  return hasHistoryApproval(sessionId);
}

// MCP production-mutation detection. Match the VERB carried in the tool_name, scoped to
// servers that can touch production state (n8n WFs, WordPress). Verb-substring (not whole
// server, not a fixed name list) so: read-only build tools (search_/get_/list_/validate_)
// pass, and a sibling tool with the same effect (publish vs update+activate) can't slip by.
// Explicit server allowlist (identity, not substring) — adding a new prod-capable MCP server
// means adding it here on purpose. Anchored alternation, no catch-all `.*WordPress.*`
// (that over-matched any server whose name merely contained "WordPress").
const MCP_PROD_SERVERS = /^mcp__(n8n-native|n8n-mcp|claude_ai_WordPress_com|wordpress[_-]?adapter)__/i;
// Mutation verbs/op-name fragments that change production state. Covers sibling-substitution
// (publish vs update+activate) and prefix families (add_/set_/run_/import_). Read verbs
// (search/get/list/validate/health/suggest/reference/documentation/audit/prepare) are excluded.
const MCP_MUTATION_VERB = /(execute|run|publish|unpublish|activate|deactivate|deploy|update|delete|archive|create|add|set|insert|import|write|replace|restore|rename|move|copy|patch|manage|full[_-]?clear|autofix)/i;

function isMcpProductionWrite(toolName) {
  if (!toolName || !MCP_PROD_SERVERS.test(toolName)) return false;
  // Strip the server prefix; inspect only the operation part for a mutation verb.
  const op = toolName.replace(MCP_PROD_SERVERS, "");
  return MCP_MUTATION_VERB.test(op);
}

function main(raw) {
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    return;
  }

  const toolName = input.tool_name || "";
  const cmd = input.tool_input?.command || "";
  const sessionId = input.session_id || "";

  // --- MCP surface: production-mutating tool call (WP/n8n) ---
  if (isMcpProductionWrite(toolName)) {
    if (hasUserApproval(sessionId)) return; // deploy codephrase present this session
    process.stdout.write(JSON.stringify({
      decision: "block",
      reason:
        `Production MCP write BLOCKED: ${toolName}\n` +
        "This MCP tool can mutate production (n8n workflow / WordPress). " +
        "Say деплой/deploy/выкатывай in this session to approve. " +
        "Guard checks last " + HISTORY_LOOKBACK + " messages.",
    }));
    return; // decided — don't fall through to Bash inspection
  }

  // Studiokook REST API write endpoints (from MEMORY.md)
  const SK_WRITE_ENDPOINTS = [
    /sk\/v1\/elementor\/\d+\/write/i,
    /sk\/v1\/elementor\/\d+\/replace/i,
    /sk\/v1\/elementor\/\d+\/restore/i,
    /sk\/v1\/deploy-file/i,
    /sk\/v1\/full-clear/i,
  ];

  // General production write patterns
  const PROD_WRITE_PATTERNS = [
    /curl\s[^|]*-X\s*(POST|PUT|PATCH|DELETE)[^|]*studiokook\.ee/i,
    /curl\s[^|]*studiokook\.ee[^|]*-X\s*(POST|PUT|PATCH|DELETE)/i,
    /curl\s[^|]*(-d\s|--data)[^|]*studiokook\.ee/i,
    /curl\s[^|]*studiokook\.ee[^|]*(-d\s|--data)/i,
    /curl\s[^|]*-X\s*(POST|PUT|PATCH|DELETE)[^|]*app\.studiokook\.ee/i,
    /curl\s[^|]*app\.studiokook\.ee[^|]*-X\s*(POST|PUT|PATCH|DELETE)/i,
  ];

  // SSH tunnel to VPS + production curl inside
  const SSH_PROD_PATTERNS = [
    /ssh\s.*157\.180\.33\.253.*curl.*studiokook\.ee.*(-X\s*(POST|PUT|PATCH|DELETE)|-d\s)/i,
    /ssh\s.*157\.180\.33\.253.*curl.*studiokook\.ee.*(\/write|\/replace|\/restore|\/deploy|\/full-clear)/i,
  ];

  function isProductionWrite(command) {
    for (const re of SK_WRITE_ENDPOINTS) {
      if (re.test(command)) return true;
    }
    for (const re of PROD_WRITE_PATTERNS) {
      if (re.test(command)) return true;
    }
    for (const re of SSH_PROD_PATTERNS) {
      if (re.test(command)) return true;
    }
    return false;
  }

  if (isProductionWrite(cmd)) {
    if (hasUserApproval(sessionId)) return; // user approved deploy in this session
    process.stdout.write(JSON.stringify({
      decision: "block",
      reason:
        "Production write to studiokook.ee BLOCKED. " +
        "Say деплой/deploy/выкатывай to approve. " +
        "Guard checks last " + HISTORY_LOOKBACK + " messages in this session.",
    }));
  }
}

// Read stdin cross-platform
let chunks = [];
process.stdin.setEncoding("utf8");
process.stdin.on("data", (d) => chunks.push(d));
process.stdin.on("end", () => main(chunks.join("")));
process.stdin.on("error", () => process.exit(0));
