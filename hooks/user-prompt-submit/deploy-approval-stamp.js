#!/usr/bin/env node
/**
 * Deploy Approval Stamp — non-forgeable production-approval signal (canon A3).
 *
 * UserPromptSubmit hook. The harness delivers the verbatim CURRENT user turn to
 * this hook via stdin `input.prompt` — a signal an agent/subagent CANNOT forge
 * (it cannot append to another process's stdin; cf. references/hooks-internals.md
 * "hook stdin comes from the harness, not files"). history.jsonl, by contrast, is
 * an append-only FILE any process can write — so reading approval from it is
 * forgeable. This hook records the approval from the trustworthy source.
 *
 * When the user's prompt contains a deploy codephrase, write a per-session token
 * file. production-guard.js prefers this token over the history.jsonl scan; the
 * file scan stays only as a degraded fallback for sessions predating this hook.
 *
 * The token is per-session (filename carries sessionId) → cannot leak across
 * sessions. It carries a timestamp → production-guard enforces a freshness window
 * (shrinks the replay window). It is advisory-write only; never blocks a prompt.
 *
 * Contract: stdin JSON {prompt, session_id} → maybe write
 *   hooks/.deploy-approval-<sessionId>.json = {sessionId, ts, promptHash}. Always exit 0.
 */

"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const os = require("os");

// Same keyword set as production-guard.js (single source would be better, but the
// guard is a separate process; keep in sync — both reference canon A3).
const DEPLOY_KEYWORDS = /деплой|deploy|выкатывай|выкати|задеплой|разверни|пуш на прод|push to prod/i;

const CLAUDE_DIR = path.join(os.homedir(), ".claude");

function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    const t = setTimeout(() => resolve(data), 3000);
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (c) => (data += c));
    process.stdin.on("end", () => { clearTimeout(t); resolve(data); });
    process.stdin.on("error", () => { clearTimeout(t); resolve(data); });
  });
}

async function main() {
  const raw = await readStdin();
  let prompt = "", sessionId = "";
  try {
    const input = JSON.parse(raw);
    prompt = input.prompt || "";
    sessionId = input.session_id || "";
  } catch { return; }

  if (!sessionId) return;                 // can't scope a token without a session
  if (!DEPLOY_KEYWORDS.test(prompt)) return; // not an approval turn — nothing to stamp

  const tokenPath = path.join(CLAUDE_DIR, "hooks", `.deploy-approval-${sessionId}.json`);
  const promptHash = crypto.createHash("sha256").update(prompt).digest("hex").slice(0, 16);
  try {
    fs.writeFileSync(tokenPath, JSON.stringify({
      sessionId,
      ts: Date.now(),
      promptHash,
    }), "utf8");
  } catch { /* advisory only — never block the prompt on a write failure */ }
}

main().catch(() => process.exit(0));
