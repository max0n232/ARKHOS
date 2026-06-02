# Claude Code Hooks — Internals

Reference for hook development. Read on-demand, not always in context.

## PreToolUse / PostToolUse status
- **PreToolUse FIRES (verified live on 2.1.154, 2026-06-02)** — sentinel-block probe confirmed `decision:"block"` intercepts the tool call. The old "#6305/#6403 doesn't fire" note was true ~2.1.85 but is STALE as of 2.1.154 (+70 releases). codex-gate/production-guard/memory-line-guard PreToolUse layer IS live, not dead weight.
- PostToolUse — historically buggy (#6305/#6403); not re-verified on 2.1.154. `trace-collector.js` (Stop hook) parses transcript JSONL as the trace-collection workaround regardless.
- SessionStart, Stop, PreCompact, SubagentStart/Stop — work fine
- NEW (2.1.85): PreToolUse can now satisfy AskUserQuestion via `updatedInput`
- **Enforcement reality (verified 2026-06-02):** git-layer `.githooks/commit-msg` (codex-gate mirror) ALIVE — live marker-less commit of a critical file blocked, exit 1. Two live enforcement layers now confirmed: PreToolUse `decision:block` + git commit-msg.
- **Auto-mode classifier is a THIRD enforcement layer (verified 2026-06-02):** native, intent-aware (NOT regex). Empirically blocked self-modification of settings.json via Write/Edit AND via bash redirect (`cat > settings.json`) AND recognized a channel-probe sweep as "Auto-Mode Bypass" by intent. → A custom regex `self-protect-guard.js` for control-file protection is REDUNDANT with this layer (and was broken on Windows backslash paths anyway) — abandoned 2026-06-02. Residual gap the classifier does NOT cover: **subagent (Task) writes** may not trigger the same signal (RFC #45427 vector c) — still an open MECH item.
- **MCP tool calls reach the no-matcher PreToolUse hook:** harness routes `mcp__*` events through the same hook layer as Bash (matcher `mcp__.*` is a documented feature; a no-matcher entry receives all). production-guard now guards MCP production-mutation tools (n8n/WP) by verb-substring in tool_name, not just Bash-curl. (Live-confirmed via guard logic test; could not inject a settings probe — classifier blocks it.)
- **Subagent tool calls FIRE the parent PreToolUse hooks** (authoritative, Claude Code docs, 2026-06-02): identical to main-thread, with `agent_id`/`agent_type` added to stdin. Auto-mode classifier applies uniformly to subagents. NO documented bypass gap — RFC #45427 "subagent evades PreToolUse" is closed in current Claude Code. production-guard + classifier cover subagent writes too. (Don't probe this from inside a subagent — it's enforcement-boundary recon the subagent will refuse; read the authority instead, per canon law 6.)
- **SubagentStop hook = observability ONLY:** receives `transcript_path` + a `tool_calls[]` summary on stdin; CANNOT block (exit 2 is non-blocking, unlike Stop). Use for audit-trail/logging/cleanup, NOT enforcement. SubagentStart-block-to-prevent-spawn = undocumented (unverified).

## New Hook Events (2.1.83-2.1.85)
- `StopFailure` — fires when Stop hook fails (API error, timeout). We use it to log output-critic failures
- `FileChanged` — fires on file edits. We filter for ObsidianVault paths via conditional `if`
- `TaskCreated` — fires on TodoWrite. We log to session capsule for Ghost
- `CwdChanged` — available but not used yet
- Conditional `if` field (2.1.85): hooks support permission-syntax filters, e.g. `"if": "Bash(git *)"`

## UserPromptSubmit Limitations
- `type: "prompt"` → BLOCKED by safety system as "untrusted content injection" (#17804, closed NOT_PLANNED)
- `type: "command"` → works, stdout injected as context (advisory, not enforcement)

## Stop Hook Enforcement (output-critic)
- `type: "prompt"` в Stop — работает! Отдельная модель (Haiku) оценивает, возвращает `{ok: false}` → Claude вынужден продолжить
- `stop_hook_active` в input → check для предотвращения бесконечных циклов
- Это ЕДИНСТВЕННЫЙ надёжный enforcement mechanism в Claude Code

## Windows Path Gotcha
- Hook command paths: использовать `/` (forward slash), НЕ `\` (backslash)
- Git Bash на Windows съедает обратные слэши → path mangling

## Transcript Format
- JSONL stores data at `obj.message.content[]`, not `obj.content`
- tool_use: `{ type: "assistant", message: { content: [{ type: "tool_use", id, name, input }] } }`
- tool_result: `{ type: "user", message: { content: [{ type: "tool_result", tool_use_id, content }] } }`

## Hook stdin vs env
- Stop/PreCompact hooks receive `transcript_path` via **stdin JSON**, NOT env variables
- `CLAUDE_ENV_FILE` is SessionStart-only, sets env for Bash tool calls (not hooks)
- Always read stdin in hooks: `fs.readSync(0, buf, 0, 1024)` loop

## Hook timeout unit
- Timeout in **seconds** (not milliseconds). Default: 600s command, 30s prompt, 60s agent

## Matchers
- Stop, UserPromptSubmit, TeammateIdle, TaskCompleted — don't support matchers (silently ignored)
- Tool events match on PascalCase: `Bash`, `Edit|Write`, `mcp__.*`
