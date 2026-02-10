# Dependencies

## Required

All scripts use built-in Node.js modules:
- `fs` - file system
- `path` - path utilities
- `crypto` - session ID generation
- `readline` - interactive CLI

## Optional

### better-sqlite3

**Used by:**
- `db/db-manager.js` - database abstraction
- `db/migrate.js` - migration tool

**Purpose:**
- Long-term analytics (pattern search, skill stats)
- Cross-session data persistence
- Usage metrics

**Installation:**
```bash
cd ~/.claude
npm install better-sqlite3
```

**Without this:**
- Core functionality works normally
- No long-term analytics
- No cross-session pattern search
- Session data stored in JSON only

**Decision:** Install if you need analytics. Skip for basic usage.
