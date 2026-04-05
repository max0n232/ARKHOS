# Claude Code Hooks — Internals

Reference for hook development. Read on-demand, not always in context.

## PostToolUse Bug (confirmed)
- PostToolUse and PreToolUse hooks DON'T FIRE — known Claude Code bug (#6305, #6403)
- SessionStart, Stop, PreCompact, SubagentStart/Stop — work fine
- NEW (2.1.85): PreToolUse can now satisfy AskUserQuestion via `updatedInput`
- Workaround: `trace-collector.js` (Stop hook) parses transcript JSONL to collect tool traces

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
