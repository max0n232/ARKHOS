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
