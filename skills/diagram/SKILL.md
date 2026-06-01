---
name: diagram
description: >
  Trigger ONLY on explicit diagram regeneration intent: "/diagram <topic>",
  "/atlas" (the L1 system map), "обнови диаграмму X", "обнови атлас",
  "regenerate the X diagram", "нарисуй topology X".
  DO NOT fire on conversational mentions of "agent graph" / "knowledge routing"
  / "ek pipeline" / "n8n topology" without the regenerate verb. For one-off
  visualisation in chat use a mermaid block instead. Skill = Excalidraw vault
  asset refresh from generator scripts in 90-System/scripts/ (atlas = top-level
  linking map over the 6 detail diagrams).
model: haiku
---

# diagram

Generate or refresh an Excalidraw diagram in `ObsidianVault/10-Projects/ARKHOS/diagrams/` from live sources.

## When to invoke

- User types `/diagram <topic>` or `/diagram` (interactive choice)
- User types `/atlas` → regenerate the L1 Atlas (alias for `/diagram atlas`)
- User asks "обнови диаграмму X" / "regenerate the X diagram"
- User asks "что у нас по агентам / n8n / EK pipeline" → suggest diagram refresh first
- User asks "покажи архитектуру / where are the holes / структура системы" → suggest `atlas` (L1 map)
- After major infra change (new hook / new MCP / new agent / many WF changes) — proactively offer

## Atlas — the L1 system map (interactive graph · Excalidraw fallback · 3D brain)

`atlas` is the top-level system map. Three renders from ONE source (`atlas-health.json`),
all emitted by `gen-atlas-graph.js` (graph + brain) and `gen-atlas.js` (fallback):

1. **`atlas.html` — PRIMARY, interactive** (Cytoscape.js force-directed graph). Open in a
   browser. zoom/pan/drag · click a node → side-panel with its health + holes + drill link ·
   filters by zone and by status (broken/warn/holes/isolates) · **isolated nodes (no edges) =
   structural gaps surfaced physically** (e.g. feature-watcher). 4 compound zones, node colour
   = health, red ring = has holes, dashed = isolate, red edge = anomaly/SPOF, dotted = dependency.
2. **`arkhos-atlas.excalidraw.md` — FALLBACK**, lightweight in-Obsidian snapshot (static box-and-arrow,
   `obsidian://` drill links, Holes panel). Use when a browser isn't handy.
3. **`atlas-brain.html` — METAPHOR** (Three.js 3D neural brain, GLB inlined). ARKHOS infra mapped
   onto 8 anatomical lobes; x-ray glass cortex with the neural net inside, per-lobe glow, animated
   synapses. Canonical lateral profile (camera on +Z). Presentation render — open in a browser.

Use it to *see the whole structure and where the gaps are*.

- **Health is computed** from live sources (wired-vs-orphan hooks, agent/skill counts);
  **remote/manual states** (VPS LiveSync, Codex OAuth, Kie.ai, n8n) live in
  `atlas-health.json.overrides` with a `verified` date — re-check, don't trust blindly.
- **Adding/moving a node, edge, or hole** → edit `atlas-health.json` (the single SSOT for layout +
  edges + holes), then regenerate. Holes can bind to a node via `node:` so they show on click.
- `/atlas` regenerates ALL renders. Stop-hook `atlas-staleness.js` reminds when sources are newer.

## Topics

| Topic | Source | Generator | Output file |
|-------|--------|-----------|-------------|
| `atlas` (graph) | `90-System/scripts/atlas-health.json` + computed health | `gen-atlas-graph.js` | `diagrams/atlas-graph.json` → `atlas.html` |
| `atlas` (brain) | `90-System/scripts/atlas-brain/` (shell.html + brain.glb pipeline) | `atlas-brain/generate.js` → `gen-atlas-graph.js` | `diagrams/atlas-brain.html` |
| `atlas` (fallback) | same source | `gen-atlas.js` | `diagrams/arkhos-atlas.excalidraw.md` |
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

`/atlas` regenerates all three renders — `gen-atlas-graph.js` emits the graph (`atlas.html`)
AND the 3D brain (`atlas-brain.html`); `gen-atlas.js` emits the Excalidraw fallback:

```bash
node C:/Users/sorte/ObsidianVault/90-System/scripts/gen-atlas-graph.js
node C:/Users/sorte/ObsidianVault/90-System/scripts/gen-atlas.js
```

Then open `10-Projects/ARKHOS/diagrams/atlas.html` in a browser.

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
