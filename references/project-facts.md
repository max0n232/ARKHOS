# Project Facts — On-Demand

Lookup facts for specific projects. Not always in context.

## Video Service (VPS)
- Path: `/opt/video-service/` — Python HTTP sidecar, port 3001
- Auth: Bearer token in `/opt/video-service/.env` (VIDEO_SERVICE_TOKEN)
- n8n access: `http://172.22.0.1:3001/transcript` (POST) or `/health` (GET) — primary n8n-network gateway
- fallback: `http://172.19.0.1:3001` (n8n_default network)
- UFW: port 3001 open for 172.19.0.0/24 + 172.22.0.0/24 (docker subnets only)
- Systemd: `video-service.service` (enabled, restart=always)
- Stack: youtube-transcript-api (fast) → yt-dlp + Whisper API (fallback)
- Token: `94bb0237e54de7bbf60089826b9af06a830020fc092efb22fbd60bd09eb3388c`

## YouTube Vault Pipeline
- VPS IP blocked by YouTube → video-service (port 3001) uses Whisper for transcription
- Bot: @VideoDev_bot, webhook: n8n.studiokook.ee/webhook/yt-vault-telegram-2026/webhook
- Telegram Bot API local server: 2GB file limit, storage /opt/n8n/telegram-bot-api-data
- youtube-transcript-api 1.2.4 (v1.x API), yt-dlp 2026.03.17 (player_client=ios workaround)
- Local: C:/Users/sorte/ObsidianVault/youtube-notes/, auto-pull every 15min (Task Scheduler)
- n8n workflow: 23 nodes, insight extraction via claude-sonnet-4-5, 2 commits per video (raw + enriched)
- Router: dedup ~56%, routes to workflow-patterns/mcp-tools/infrastructure/knowledge

## Portfolio (Studiokook)
- Skill files live in `~/Desktop/Studiokook/.claude/skills/` (authoritative location, NOT global `~/.claude/skills/`)
- NGG gallery 7: 105 photos (koogid), pages 3133+3010 updated, 134 thumbnails with captions
- Rena template v1 approved: Playfair, designer narratives ET+RU, scroll animations, masonry layout
- 16/16 projects: unique alt-texts, narrative agent generates 7 texts per project per angle
- Portfolio index: dark theme, parallax hero, 3-col masonry (420px cards), responsive
- Portfolio colors: accent #c8a97e, dark #1a1a1a, bg #faf7f2

## Dancing Cat Factory
- Kling i2i pipeline, 8 kitchen templates A-H, kieai-api.env

## Kie.ai API
- Key in credentials/kieai-api.env, Flux.1 Kontext (i2i editing)
- Upload: POST kieai.redpandaai.co/api/file-stream-upload
- Generate: POST api.kie.ai/api/v1/flux/kontext/generate
- Poll: GET .../record-info?taskId=

## HAL Agent Suite (reference architecture)
- 3-level hierarchy: Orchestrator → 5 Supervisors → 15+ Agents
- Pattern: 'agent as tool' via n8n toolWorkflow

## Obsidian Smart Connections
- nomic-embed-text-v1.5 (768d, multilingual), 43/43 notes, Omnisearch active

## Studiokook REST API Endpoints
- `sk/v1/elementor/{id}` — GET Elementor data (read-only)
- `sk/v1/elementor/{id}/write` — POST full Elementor JSON array (sk-elementor-write.php, `manage_options`, auto-backup)
- `sk/v1/elementor/{id}/replace` — POST search/replace in Elementor JSON
- `sk/v1/elementor/{id}/backup` — GET backup data
- `sk/v1/elementor/{id}/restore` — POST restore from backup
- `sk/v1/full-clear` — GET (not POST!) — flushes object cache + Seraphinite static files
- `sk/v1/deploy-file` — POST raw PHP string (NOT base64) in `content` field. Path MUST start with `wp-content/`

## Studiokook Hosting
- Zone.ee, IP 217.146.69.15, DB prefix d103930
- Staging: staging.studiokook.ee (db: d103930_staging, user: d103930_new)
- Root: /data01/virt103578/domeenid/www.studiokook.ee/staging/

## Trading WFs (n8n)
- 7 workflows: Market Collector `i1Mm51TbeTNrKmmj` (CoinGecko→DB, 15min), Alert Engine `t8C46YvvyXvIS9QE` (price levels, 5min), TV Webhook `s7jkfnXTbHAGJkuf` (path: trading-webhook-51209d6a), Trade Journal `2IVvaPQb5YEnHl1a` (read-only /trade stats|list), Daily Digest `eQyU4RUnPKnxEIyL` (20:00 UTC), Whale Monitor `lGWK39AYgOTkw0TZ` (Binance Spot+funding, 5min), Signal Brain `NEQvshqMBeZGqIVi` (weighted scoring, 5min)
- Credentials: `TradingPostgres1` (host=postgres, db=n8n), TG: `TradingTelegramBot`
- Tables: trades, tv_signals, market_snapshots, alerts, whale_activity, funding_rates, brain_decisions, portfolio_snapshots
- Binance API: Spot `/api/v3/trades` safe (20 req/s). Futures `/fapi/v1/trades` bans IP ~1 req/min. Always `onError:continueRegularOutput` on HTTP nodes. Funding: `/fapi/v1/premiumIndex` (public, no auth)
- CryptoPanic: token in credentials/cryptopanic-api.key returns HTML (free tier may not include API 2026) — consider LunarCrush

## n8n API Access
- Key from `user_api_keys` table (not basic auth). PUT requires name+nodes+connections+settings. Credential binding: `credentials:{type:{id,name}}` on node
- JWT secret = SHA256(every 2nd char of encryptionKey). Config at `/home/node/.n8n/config`. Generate inside container with jsonwebtoken lib
- Current key in credentials/n8n-api.key, expires ~2027-06

## n8n Gotchas
- `@mendable/n8n-nodes-firecrawl.firecrawl` — community node, not installed by default
- Spawn on Windows: `windowsHide:true` only, no `detached:true` (prevents console window leak)

## WP Abilities API / MCP Gotchas
- MCP adapter stdClass cast: Some WP REST endpoints return stdClass that MCP adapter can't serialize — must explicit `(array)` cast
- qmd WAL contention on Windows: multiple processes can't write to same DB; serialize writes
