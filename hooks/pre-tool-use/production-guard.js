// Production Guard — blocks destructive operations targeting studiokook.ee
// PreToolUse hook, runs only when tool_name == 'Bash'
// Reads tool_input from stdin, checks for production write patterns
// Checks recent user messages in history.jsonl for deploy approval
// Returns {"decision":"block","reason":"..."} or allows silently

const fs = require("fs");
const path = require("path");

const DEPLOY_KEYWORDS = /деплой|deploy|выкатывай|выкати|задеплой|разверни|пуш на прод|push to prod/i;
const HISTORY_LOOKBACK = 10; // check last N user messages

function hasUserApproval(sessionId) {
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

function main(raw) {
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    return;
  }

  const cmd = input.tool_input?.command || "";
  const sessionId = input.session_id || "";

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
