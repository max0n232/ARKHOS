// Codex review gate — blocks `git commit` on critical paths without [codex-reviewed:] marker.
// Reads tool_input.command from stdin (PreToolUse Bash matcher).
// If critical files staged AND no override marker in commit message → blocks.
//
// Override mechanisms:
//   - [codex-reviewed: <reason>] in commit message (preferred — documents context)
//   - [codex-skip: <reason>] in commit message (when codex is unavailable / trivial)
//   - env CLAUDE_SKIP_CODEX_GATE=1 (emergency bypass)
//
// Scope (CRITICAL_PATHS): hook code, settings.json, CLAUDE.md, rules/**, agents/**,
// skills/**/SKILL.md, vault 90-System/**, vault ARKHOS/architecture/**.
//
// Known limitations (codex review 2026-05-13):
//   - `git --git-dir=X --work-tree=Y commit` bypasses repo check (uses hook cwd, not target repo).
//     Low risk: Claude Code Bash typically commits CWD worktree.
//   - `git status && git commit` chain (not via cd prefix) — false-negative,
//     Claude Code typically uses separate Bash calls.
//   - Multi-prefix forms: `env VAR=x git commit`, `GIT_DIR=... git commit` — false-negative.
//   - `-F message-file` does not put marker in expanded -m argv;
//     unsupported by design (use inline -m with marker).

const { execSync } = require("child_process");

const CRITICAL_PATHS = [
  /(^|\/)hooks\//,
  /(^|\/)settings\.json$/,
  /(^|\/)CLAUDE\.md$/,
  /(^|\/)rules\/.*\.md$/,
  /(^|\/)agents\/[^/]+\.md$/,
  /(^|\/)skills\/[^/]+\/SKILL\.md$/,
  /(^|\/)90-System\//,
  /(^|\/)10-Projects\/ARKHOS\/architecture\//,
];

const REVIEW_MARKER = /\[codex-(reviewed|skip):/i;

// Detect `git commit` as the actual command (not inside string literals).
// Strip optional leading `cd <path> &&` then require first token chain to be `git ... commit`.
function isGitCommit(command) {
  const stripped = command.replace(
    /^\s*cd\s+("[^"]*"|'[^']*'|[^\s&;]+)\s*(?:&&|;)\s*/,
    ""
  );
  return /^\s*git\s+(?:-\S+(?:\s+\S+)?\s+)*commit\b/.test(stripped);
}

function extractCwd(command) {
  const m = command.match(/^\s*cd\s+("([^"]*)"|'([^']*)'|([^\s&;]+))\s*(?:&&|;)/);
  if (m) return (m[2] ?? m[3] ?? m[4] ?? "").trim();
  const gc = command.match(/^\s*git\s+-C\s+("([^"]*)"|'([^']*)'|(\S+))/);
  if (gc) return gc[2] ?? gc[3] ?? gc[4] ?? "";
  return process.cwd();
}

function extractCommitMessage(command) {
  // HEREDOC form: -m "$(cat <<'EOF' ... EOF)"
  const hd = command.match(/<<\s*['"]?([A-Z_]+)['"]?\s*\r?\n([\s\S]*?)\r?\n\s*\1\b/);
  if (hd) return hd[2];
  // Quoted -m "..." or -m '...'
  const dq = command.match(/-m\s+"([^"]*)"/);
  if (dq) return dq[1];
  const sq = command.match(/-m\s+'([^']*)'/);
  if (sq) return sq[1];
  return "";
}

function main(raw) {
  if (process.env.CLAUDE_SKIP_CODEX_GATE === "1") return;

  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    return;
  }

  const cmd = input.tool_input?.command || "";
  if (!isGitCommit(cmd)) return;
  // Allow amends/reverts only with marker (still gated)
  // Allow --allow-empty etc. — same gate logic

  const cwd = extractCwd(cmd);

  let staged;
  try {
    staged = execSync("git diff --cached --name-only", {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 2000,
    })
      .trim()
      .split("\n")
      .filter(Boolean);
  } catch (err) {
    // Fail-CLOSED on timeout — gate cannot verify staged files, must not silently pass.
    // Fail-OPEN on ENOENT/not-a-repo (Claude often runs git from non-repo paths).
    if (err && (err.killed || err.signal === "SIGTERM" || err.code === "ETIMEDOUT")) {
      console.log(
        JSON.stringify({
          decision: "block",
          reason:
            `Codex-gate: git diff --cached timed out (>2s). Cannot verify staged files for critical-path check.\n` +
            `Retry the commit, or set CLAUDE_SKIP_CODEX_GATE=1 for emergency bypass.`,
        })
      );
    }
    return;
  }
  if (staged.length === 0) return;

  const critical = staged.filter((f) =>
    CRITICAL_PATHS.some((re) => re.test(f))
  );
  if (critical.length === 0) return;

  const msg = extractCommitMessage(cmd);
  if (REVIEW_MARKER.test(msg)) return;

  const fileList = critical.map((f) => `  - ${f}`).join("\n");
  const reason =
    `Codex-gate: ${critical.length} critical file(s) staged without codex-review marker.\n` +
    `\nFiles:\n${fileList}\n` +
    `\nRequired action:\n` +
    `1. Spawn codex-second-opinion subagent to review the diff\n` +
    `2. Address any P0/critical findings\n` +
    `3. Add to commit message: [codex-reviewed: <one-line reason>]\n` +
    `   Example: git commit -m "fix(hook): X. [codex-reviewed: minor refactor, no behavior change]"\n` +
    `\nOverrides (use sparingly):\n` +
    `- env CLAUDE_SKIP_CODEX_GATE=1 (one-off)\n` +
    `- [codex-skip: <reason>] in message (codex unavailable / trivial)\n` +
    `\nNote: marker must appear in inline -m message. -F <file> message form is not supported by this gate.\n` +
    `\nScope: hooks/**, settings.json, CLAUDE.md, rules/**, agents/**, skills/**/SKILL.md, vault 90-System/**, vault ARKHOS/architecture/**.`;

  console.log(JSON.stringify({ decision: "block", reason }));
}

let raw = "";
process.stdin.on("data", (c) => (raw += c));
process.stdin.on("end", () => main(raw));
