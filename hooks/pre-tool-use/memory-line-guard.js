// Memory Line Guard — keeps MEMORY.md index entries short (root-cause fix for bloat)
// PreToolUse hook, runs on Edit/Write targeting MEMORY.md.
// Rule (CLAUDE.md / constitution File Discipline): MEMORY.md = index, one-liner ≤~200 chars,
// detail belongs in topic files. Bloat warning fires at harness limit 24.4KB.
// This guard blocks an Edit/Write that introduces an index line over the limit, so the
// rule is structurally enforced, not left to discipline (it was violated 57× before this).
//
// Contract: stdin JSON {tool_name, tool_input} → {"decision":"block","reason":...} or silent allow.

const fs = require("fs");
const path = require("path");

const MAX_INDEX_LINE = 220; // 200 rule + small slack for the wikilink/path overhead

// An index entry looks like:  - [Title](path) — detail...
const INDEX_LINE_RE = /^\s*-\s*\[.+?\]\(.+?\)/;

// Target ONLY <...>/memory/MEMORY.md (direct parent === "memory"), case-insensitive
// for Windows. path.resolve normalizes separators and "..", so nested dirs and
// path-traversal don't false-match. (Codex BLOCKER 3)
function isMemoryFile(filePath) {
  if (!filePath) return false;
  const resolved = path.resolve(filePath);
  const base = path.basename(resolved).toLowerCase();
  const parent = path.basename(path.dirname(resolved)).toLowerCase();
  return base === "memory.md" && parent === "memory";
}

// Return the offending index lines (>MAX) found in the given text, with their lengths.
// Split tolerates CRLF, LF and lone CR. (Codex BLOCKER 4)
function offendingLines(text) {
  if (!text) return [];
  const out = [];
  for (const line of text.split(/\r\n?|\n/)) {
    if (INDEX_LINE_RE.test(line) && line.length > MAX_INDEX_LINE) {
      // grab the title for a helpful message
      const m = line.match(/^\s*-\s*\[(.+?)\]/);
      out.push({ title: m ? m[1] : line.slice(0, 40), len: line.length });
    }
  }
  return out;
}

function main(raw) {
  let input;
  try { input = JSON.parse(raw); } catch { return; }

  // Explicit one-shot bypass for sanctioned bulk distill (mirrors codex-gate's skip env).
  // The guard checks the WHOLE post-op file, so during a multi-edit distill it would block
  // every intermediate state that still contains an un-shortened line. Set this env for that.
  if (process.env.CLAUDE_SKIP_MEMORY_GUARD === "1") return;

  const tool = input.tool_name || "";
  if (tool !== "Edit" && tool !== "Write") return;

  const ti = input.tool_input || {};
  const filePath = ti.file_path || "";
  if (!isMemoryFile(filePath)) return;

  // Inspect the POST-operation file body, not just the introduced fragment:
  //  - Write → content is the full new body.
  //  - Edit  → reconstruct by applying old_string→new_string to current file, so a
  //    fragment replacement that lengthens an existing index line is caught. (Codex BLOCKER 1)
  let body;
  if (tool === "Write") {
    body = ti.content || "";
  } else {
    // Edit
    let current = "";
    try { current = fs.readFileSync(filePath, "utf8"); } catch { current = ""; }
    const oldStr = ti.old_string || "";
    const newStr = ti.new_string || "";
    if (current && oldStr) {
      body = ti.replace_all
        ? current.split(oldStr).join(newStr)
        : current.replace(oldStr, newStr);
    } else {
      // file unreadable or no anchor — fall back to inspecting the introduced text alone
      body = newStr;
    }
  }
  const bad = offendingLines(body);
  if (bad.length === 0) return;

  const list = bad
    .map((b) => `  • "${b.title}" — ${b.len} chars`)
    .join("\n");

  process.stdout.write(JSON.stringify({
    decision: "block",
    reason:
      `MEMORY.md index line(s) exceed ${MAX_INDEX_LINE} chars:\n${list}\n\n` +
      `Rule (CLAUDE.md): MEMORY.md is an INDEX — one-liner ≤200 chars per entry, ` +
      `detail lives in the topic file the entry links to. ` +
      `Shorten the entry to a pointer (title + 1 phrase + link) and move the detail ` +
      `into its topic/reference file. This is why the file bloated past the 24.4KB harness limit.`,
  }));
}

let chunks = [];
process.stdin.setEncoding("utf8");
process.stdin.on("data", (d) => chunks.push(d));
process.stdin.on("end", () => main(chunks.join("")));
process.stdin.on("error", () => process.exit(0));
