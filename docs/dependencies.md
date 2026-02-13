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

## WordPress Skill Dependencies

**External services:**
- studiokook.ee WordPress site
- TranslatePress 2.7.4
- Elementor 3.25.11
- Code Snippets plugin
- sk/v1 REST API (custom endpoints)

**Required credentials:**
- `~/Desktop/Studiokook/credentials/wp_rest_api.json` - WordPress application password (JSON)
- `~/Desktop/Studiokook/credentials/wp-auth.env` - WordPress application password (env, for `source`)
- Load: `source ~/Desktop/Studiokook/credentials/wp-auth.env` then use `$WP_USER`, `$WP_APP_PASS`

**API base:** `https://studiokook.ee/wp-json/sk/v1/`

