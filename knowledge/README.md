# ARKHOS Knowledge Base

**Location:** `~/.claude/knowledge/`
**Database:** `knowledge.db`
**DAL:** `~/.claude/scripts/data_access_layer.py`

---

## Quick Reference

### Import DAL

```python
import sys
sys.path.insert(0, os.path.expanduser("~/.claude/scripts"))
from data_access_layer import dal
```

### Save Decision

```python
decision_id = dal.decisions.add(
    title="Title of the decision",
    problem="What problem are we solving?",
    decision="What did we decide to do?",
    alternatives="What other options were considered?",
    consequences="What are the implications?",
    project="ProjectName",  # optional
    tags=["tag1", "tag2"]   # optional
)
```

### Save Work Log

```python
log_id = dal.logs.add(
    summary="Brief summary of work completed",
    details="Detailed description of work, challenges, outcomes",
    project="ProjectName",  # optional
    tags=["tag1", "tag2"]   # optional
)
```

### Save Code Snippet

```python
snippet_id = dal.snippets.add(
    name="Snippet Name",
    code="<?php\n// code here\n?>",
    language="php",  # optional
    description="What this snippet does",
    tags=["wordpress", "performance"]  # optional
)
```

### Save Error/Lesson

```python
error_id = dal.errors.add(
    title="Brief description of error",
    error_text="Full error message or stack trace",
    solution="How it was fixed",
    lesson="What we learned for next time"
)
```

### Search

```python
# Search decisions
results = dal.decisions.search("wordpress performance", limit=10)

# Search logs
results = dal.logs.search("optimization", limit=10)

# Search snippets
results = dal.snippets.search("lazy loading", limit=10)

# Search errors
results = dal.errors.search("unicode error", limit=10)
```

### Get Specific Record

```python
decision = dal.decisions.get(2)  # Get decision by ID
print(decision['title'])
print(decision['decision'])
print(decision['project_name'])
```

---

## Database Schema

### Tables

- **projects** - Project metadata
- **decisions** - Architectural and technical decisions
- **logs** - Work logs and session summaries
- **snippets** - Code snippets and examples
- **errors** - Errors and lessons learned
- **tags** - Tags for categorization

### FTS5 Virtual Tables

- **decisions_fts** - Full-text search for decisions
- **logs_fts** - Full-text search for logs
- **snippets_fts** - Full-text search for snippets
- **errors_fts** - Full-text search for errors

---

## Backup Structure

Markdown backups are automatically saved to:

- `~/.claude/knowledge/decisions/` - Decision documents
- `~/.claude/knowledge/logs/` - Work log documents

These serve as:
1. Human-readable reference
2. Backup if database is corrupted
3. Version control friendly format

---

## Usage from Skills

Skills can use DAL for persistent memory:

```python
# In skill code
from data_access_layer import dal

# Auto-save decisions
dal.decisions.add(
    title="...",
    decision="...",
    project=context.get('project_name'),
    tags=["skill-name", "auto-saved"]
)

# Auto-save work logs
dal.logs.add(
    summary="...",
    details="...",
    project=context.get('project_name'),
    tags=["skill-name", "session-log"]
)
```

---

## Search Tips

### FTS5 Query Syntax

```python
# Basic search
dal.decisions.search("wordpress performance")

# Phrase search (exact match)
dal.decisions.search('"lazy loading"')

# Multiple terms (OR)
dal.decisions.search("wordpress OR optimization")

# Multiple terms (AND)
dal.decisions.search("wordpress AND performance")

# Exclude term
dal.decisions.search("wordpress NOT elementor")

# Prefix search
dal.decisions.search("optim*")  # matches "optimize", "optimization", etc.
```

---

## Current Records

### Decisions

- **ID 2:** WordPress Performance Optimization: 3-Phase Strategy
  - Project: Studiokook
  - Tags: wordpress, performance, optimization, lazy-loading, autoload, transients, elementor, ngg

### Logs

- **ID 1:** WordPress Performance Optimization - 3 Phases Complete
  - Project: Studiokook
  - Tags: wordpress, performance, optimization, lazy-loading, autoload, transients

---

## Maintenance

### Database Location

```bash
~/.claude/knowledge/knowledge.db
```

### Backup Database

```bash
# Manual backup
cp ~/.claude/knowledge/knowledge.db ~/.claude/knowledge/knowledge.db.backup

# Or with timestamp
cp ~/.claude/knowledge/knowledge.db ~/.claude/knowledge/knowledge.db.$(date +%Y%m%d)
```

### Reset Database

```bash
# Delete and reinitialize
rm ~/.claude/knowledge/knowledge.db
python ~/.claude/scripts/data_access_layer.py
```

### Check Database

```bash
sqlite3 ~/.claude/knowledge/knowledge.db "SELECT COUNT(*) FROM decisions"
sqlite3 ~/.claude/knowledge/knowledge.db "SELECT COUNT(*) FROM logs"
sqlite3 ~/.claude/knowledge/knowledge.db "SELECT COUNT(*) FROM snippets"
```

---

## Integration with Skills

Skills that use DAL:

- `/save-decision` - Save architectural decisions
- `/log` - Save work logs
- `/save-snippet` - Save code snippets
- `/learn-error` - Save errors and lessons
- `/search-memory` - Search all records

---

## Version

**DAL Version:** 1.0
**Database Schema:** 2026-02-02
**Last Updated:** 2026-02-02

---

## Future Enhancements

Planned features:

1. **Relationships** - Link decisions to logs, snippets to decisions
2. **Status updates** - Mark decisions as deprecated/superseded
3. **Export** - Export to Markdown, JSON, or PDF
4. **Sync** - Sync between devices
5. **Web UI** - Browse knowledge base in browser

---

**Documentation:** See `~/.claude/CLAUDE.md` for ARKHOS system overview
