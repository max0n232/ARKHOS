---
name: obsidian-router
description: >
  Trigger: vault, obsidian, заметки, БЗ, qmd, "найди в заметках", "сохрани в базу знаний",
  vault paths. Routes to QMD/Nexus/REST API.
model: haiku
---

# obsidian-router

Routes knowledge operations between QMD (always available) and Nexus (when Obsidian is running).

## Trigger

Any vault operation: search, read, write, update, append to Obsidian.

## Tool Selection

| Condition | Tool | Use For |
|-----------|------|---------|
| Any search | `mcp__obsidian__obsidian_simple_search` or `mcp__obsidian__obsidian_complex_search` | Search first, always |
| Obsidian running + CRUD | `mcp__nexus__*` | Create/update/append notes |
| Obsidian not running | `mcp__obsidian__*` | Read/append via REST API |
| Semantic search | `qmd search vault "<query>"` via Bash | Cross-vault semantic query |

## Decision Tree

```
SEARCH query?
  → mcp__obsidian__obsidian_simple_search (fast, most cases)
  → mcp__obsidian__obsidian_complex_search (JsonLogic filters needed)
  → qmd search vault "<query>" (semantic / natural language)

READ file?
  → mcp__obsidian__obsidian_get_file_contents

WRITE / UPDATE / APPEND?
  → Obsidian open? check: qmd collection status or just try mcp__nexus__*
    YES → mcp__nexus__* (preferred, keeps Obsidian sync)
    NO  → mcp__obsidian__obsidian_patch_content or obsidian_append_content

CREATE new note?
  → mcp__obsidian__obsidian_append_content (creates if not exists)
```

## QMD Collections

| Collection | Path | Content |
|-----------|------|---------|
| `vault` | `C:/Users/sorte/ObsidianVault` | All vault notes |
| `ghost-.claude` | `C:/Users/sorte/.claude/.ai-sessions/completed` | Session history |

### QMD Commands (via Bash)

```bash
# Semantic search (default — across all of vault)
qmd search vault "query"
qmd search ghost-.claude "query"

# Scoped search via --path (PREFERRED for domain-specific lookups)
# Use this instead of creating subset collections — see growth-limits.md § QMD Collection Hygiene.
qmd query "trading psychology" --collection vault --path "30-Resources"   # theory: Elder/Wyckoff/Brooks/Dalton/Douglas/Van Tharp/Taleb books
qmd query "Studiokook hosting" --collection vault --path "10-Projects"    # live work: Studi/Trading/ARKHOS/EK/Legal sprints
qmd query "routing"            --collection vault --path "90-System"      # routing-map, MOC, system docs

# Reindex after vault changes
qmd update

# Check status
qmd collection list
```

### Scoping rules

- **NEVER add subset collections** (`qmd collection add <subdir-of-vault>`) — default search will return cross-collection duplicates (each chunk surfaces under both `qmd://vault/...` and `qmd://<subset>/...` at identical scores). See `references/growth-limits.md` § QMD Collection Hygiene.
- **DO use `--path`** with `qmd query` for any scoped semantic search. The flag is a soft path-bias signal to the reranker, not a strict filter — but it consistently steers results to the requested PARA branch.
- **DO use `-c vault` explicit** when calling from skills/hooks/scripts — leaves room to add unrelated collections (like `ghost-.claude`) without changing default-search behavior for vault consumers.

## Pending Writes Flush

If CRUD ops were done via Obsidian REST API while Obsidian is open, run flush to sync:

```bash
node ~/.claude/skills/obsidian-router/scripts/flush-pending-writes.js
```

## Routing Rules

1. **Search first** — before writing, check for existing note to avoid duplicates
2. **QMD for semantic** — keyword lookup → obsidian search; conceptual/contextual → QMD
3. **Session audit** — use `ghost-.claude` collection to find what was done in past sessions
4. **Reindex after bulk changes** — after migrating or bulk-editing vault files
