# Credentials Management

Secrets stored PER-PROJECT, not in this global directory.

## Access Hierarchy

| Tier | Method | When | Scope |
|------|--------|------|-------|
| 1 | **MCP servers** | Default for supported operations | Structured API, auto-connected |
| 2 | **App Password** (via `credentials/*.env`) | MCP doesn't cover the endpoint | Full REST API, custom endpoints |

### WordPress

- **MCP** (`wordpress` in `~/.claude.json`): posts, pages, media, comments, taxonomy — use first
- **App Password** (`credentials/wp-auth.env`): custom endpoints (`/sk/v1/*`), TranslatePress, bulk operations, WP-CLI over SSH

### n8n

- **MCP** (`n8n-mcp` in `~/.claude.json`): workflow CRUD, executions, templates — use first
- **API Key** (`credentials/n8n-api.env`): direct REST for edge cases not covered by MCP

### Google (GSC / GA4)

- **MCP** (`gsc` in `~/.claude.json`): Search Console queries, sitemap data
- **OAuth tokens** (`credentials/google_*.json`): GA4 reports, batch GSC operations

### Meta (Facebook / Instagram)

- **n8n env var** (`META_PAGE_TOKEN`): used by n8n workflows
- **Page Token** (`credentials/meta-api.env`): direct Graph API calls from scripts

### SSH / VPS

- **Zone.ee** (`credentials/wp-ssh.env`): shared hosting for WordPress (`virt103578@studiokook.ee`)
- **Hetzner VPS** (`credentials/wp-ssh.env`): Docker host for n8n, Supabase (`root@157.180.33.253`)
- **SSH Key**: `~/.ssh/id_studiokook` (ED25519, used for both servers)

## Project Locations

| Project | Path |
|---------|------|
| Studiokook | `~/Desktop/Studiokook/credentials/` |

## Loading in Bash (Git Bash on Windows)

```bash
source ~/Desktop/Studiokook/credentials/wp-auth.env
curl -u "$WP_USER:$WP_APP_PASS" "https://studiokook.ee/wp-json/sk/v1/trp-search?q=test"
```

## Loading in Node.js

```javascript
const auth = Buffer.from(
  process.env.WP_USER + ':' + process.env.WP_APP_PASS
).toString('base64');
```

## Adding a New Project

1. Create `{project}/credentials/` directory
2. Ensure `credentials/` is in project `.gitignore`
3. Copy `~/.claude/credentials/_template.env` to `{project}/credentials/{service}.env`
4. Fill in real values
5. Update `~/.claude/docs/dependencies.md` with new paths

## Rotation

When rotating credentials:
1. Update the `.env` file
2. Update "Last used" / "Last rotated" date in file header
3. Test: `curl -u "$WP_USER:$WP_APP_PASS" $WP_BASE_URL/wp-json/wp/v2/posts?per_page=1`

## Security Rules

- NEVER commit credential files to git
- NEVER display credential values in CLI output
- NEVER hardcode credentials in scripts
- `source` + env vars is the approved access pattern
- All project `.gitignore` files must exclude `credentials/`
- MCP credentials live in `~/.claude.json` (not synced to cloud, not in any git repo)
