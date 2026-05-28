---
name: diagram
description: >
  Trigger ONLY on explicit diagram regeneration intent: "/diagram <topic>",
  "обнови диаграмму X", "regenerate the X diagram", "нарисуй topology X".
  DO NOT fire on conversational mentions of "agent graph" / "knowledge routing"
  / "ek pipeline" / "n8n topology" without the regenerate verb. For one-off
  visualisation in chat use a mermaid block instead. Skill = Excalidraw vault
  asset refresh from 5 generator scripts in 90-System/scripts/.
model: haiku
---

# diagram

Generate or refresh an Excalidraw diagram in `ObsidianVault/10-Projects/ARKHOS/diagrams/` from live sources.

## When to invoke

- User types `/diagram <topic>` or `/diagram` (interactive choice)
- User asks "обнови диаграмму X" / "regenerate the X diagram"
- User asks "что у нас по агентам / n8n / EK pipeline" → suggest diagram refresh first
- After major infra change (new hook / new MCP / new agent / many WF changes) — proactively offer

## Topics

| Topic | Source | Generator | Output file |
|-------|--------|-----------|-------------|
| `hook-lifecycle` | `~/.claude/settings.json` | `90-System/scripts/gen-hook-lifecycle.js` | `diagrams/hook-lifecycle.excalidraw.md` |
| `n8n-topology` | n8n REST API (`https://n8n.studiokook.ee/api/v1/workflows`) + `n8n-api.key` | `gen-n8n-topology.js` | `diagrams/n8n-topology.excalidraw.md` |
| `agent-graph` | `~/.claude/agents/*.md` + `skills/REGISTRY.md` + `~/.claude.json` | `gen-agent-graph.js` | `diagrams/agent-graph.excalidraw.md` |
| `ek-pipeline` | `~/Desktop/easykitchen/scripts/` + CLAUDE.md File Routing | `gen-ek-pipeline.js` | `diagrams/ek-pipeline.excalidraw.md` |
| `knowledge-routing` | `CLAUDE.md § Knowledge Routing` + `90-System/routing-map.md` | `gen-knowledge-routing.js` | `diagrams/knowledge-routing.excalidraw.md` |
| `arkhos-brain` | manual mapping (constitution + skills + hooks) | `gen-arkhos-brain.js` | `diagrams/arkhos-brain.excalidraw.md` |
| `n8n-topology-d2` | n8n REST API (live) | `gen-n8n-topology-d2.js` | `diagrams/n8n-topology.d2` (D2 plugin alt) |

## Run

```bash
node C:/Users/sorte/ObsidianVault/90-System/scripts/gen-{topic}.js
```

For `all`:

```bash
for f in C:/Users/sorte/ObsidianVault/90-System/scripts/gen-*.js; do node "$f"; done
```

## Conventions

- All generators use `excalidraw-builder.js` for rect/text/arrow/lane primitives.
- Output frontmatter contains `generated_from:` (source path/URL) and `generated_at:` (ISO timestamp). Staleness check possible later via this metadata.
- Generators are idempotent — overwriting is intentional, no `.bak` files (git history covers rollback).
- Each diagram includes a `Re-run` instruction in its description so users know how to refresh.

## When NOT to use

- For in-chat communication (>4 entities) → use **Mermaid block in response** instead. Excalidraw is heavy (~8k tokens JSON), only worth generating when artifact will be re-read multiple times in vault.
- For one-off ad-hoc drawings → user can open Obsidian and draw manually in Excalidraw view.
- For diagrams unrelated to any source-of-truth file → no generator exists; either add a new generator or draw manually.

## Adding a new topic

1. Identify a source-of-truth file/API (must be machine-readable, deterministic).
2. Create `90-System/scripts/gen-<topic>.js` using `require('./excalidraw-builder')`.
3. Add row to the table above.
4. Test by running once; verify in Obsidian Excalidraw view.
5. Update `architecture-changelog.md` with the new diagram.

## Output verification

After generating, the output file should:
- Have valid frontmatter with `excalidraw-plugin: parsed` tag
- Open cleanly in Obsidian (right-click file → "Open in Excalidraw")
- Include source attribution in the title text (`Source: …` line)
