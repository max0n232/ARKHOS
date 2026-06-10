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
- Token: see `credentials/video-service.token` (redacted from git 2026-06-08)

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
- Working generative endpoints: `POST /api/v1/jobs/createTask` + `GET /api/v1/jobs/recordInfo?taskId=X`, state enum `generating|success|fail` <!-- fact:kie_ai_api_endpoints verified:2026-05-03 -->
- Working slugs: video `kling-2.6/image-to-video` (~60s), image `google/nano-banana` (~6s); Broken (do not use): `google/imagen4*` (500), `kling-3.0-omni`, `kling-2.5/i2v`, `flux/dev`, `runway/gen3`, `sora-2`, `veo3-fast` (422) <!-- fact:kie_ai_working_slugs verified:2026-05-03 -->
- Kling 2.6 i2v body: `{prompt, image_urls:[url], sound:bool, duration:"5"|"10"}` <!-- fact:kie_ai_kling26_i2v_body verified:2026-05-03 -->
- Result shape: `resultJson` → `{"resultUrls":["..."]}` <!-- fact:kie_ai_result_shape verified:2026-05-03 -->
- chat `/v1/chat/completions` returns 404 — NOT an LLM proxy <!-- fact:kie_ai_no_chat_proxy verified:2026-05-03 -->
- Top-up: dashboard.kie.ai (Billing → Add credits); 1000 credits ≈ $4.99 <!-- fact:kie_ai_top_up verified:2026-05-04 stale_after:180d -->

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
- COT symbol mapping: `COPPER→COPPER; NATGAS→NATGAS; USOIL→CRUDE_OIL; XAGUSD→SILVER; XAUUSD→GOLD; SPX500→SP500` <!-- fact:cot_symbol_mapping verified:2026-05-17 -->
- Seasonality symbol mapping: `NATGAS→NATGAS; USOIL→WTI_OIL; XAGUSD→SILVER; XAUUSD→GOLD; SPX500→SPY` <!-- fact:seasonality_symbol_mapping verified:2026-05-17 -->
- macro_regime DB format: `inflation_growth` (underscore, not space) <!-- fact:macro_regime_db_format verified:2026-05-17 -->
- DXY Yahoo Finance symbol: `DX-Y.NYB` <!-- fact:dxy_yahoo_symbol verified:2026-05-17 -->
- Macro agent rationale schema: "one sentence in Russian (Wyckoff/Elder/HTF/FRED/VIX/DXY/yields stay English): regime + divergence + implication" <!-- fact:macro_agent_rationale_schema verified:2026-05-17 -->
- SEO Traffic Drop WF schedule: weeks / triggerAtDay:[1] (Monday) / triggerAtHour:9 / timezone Europe/Tallinn; 2 triggers (Weekly + webhook `traffic-drop-test`); fires when clicks ≤ -5 AND pos ≥ 2 <!-- fact:seo_traffic_drop_workflow verified:2026-05-17 stale_after:90d -->
- knowledge_chunks: 229 chunks from 13 books in pgvector HNSW; `search_knowledge(query_vec, k)` helper <!-- fact:trading_knowledge_chunks verified:2026-05-18 stale_after:90d -->
- Trading DB migration 005: `trades.signal_id UUID NULL` + FK to `signals_v2(ON DELETE SET NULL)` + composite index `(symbol,status,opened_at DESC)` + partial idx on signal_id <!-- fact:migration_005_details verified:2026-05-05 -->
- Trading DB migrations 007: tables `instruments_universe, daily_briefs, news_cache` <!-- fact:migration_007_tables verified:2026-05-05 -->

## n8n API Access
- Key from `user_api_keys` table (not basic auth). PUT requires name+nodes+connections+settings. Credential binding: `credentials:{type:{id,name}}` on node
- JWT secret = SHA256(every 2nd char of encryptionKey). Config at `/home/node/.n8n/config`. Generate inside container with jsonwebtoken lib
- Current key in credentials/n8n-api.key, expires ~2027-06
- n8n admin credentials: admin / see `credentials/n8n-admin.pass` (redacted from git 2026-06-08) <!-- fact:n8n_admin_credentials verified:2026-05-03 stale_after:30d -->

## n8n Gotchas
- `@mendable/n8n-nodes-firecrawl.firecrawl` — community node, not installed by default
- Spawn on Windows: `windowsHide:true` only, no `detached:true` (prevents console window leak)
- `NODE_FUNCTION_ALLOW_BUILTIN=crypto,https` — required in n8n env; no `fetch`/`$helpers` in Code sandbox; Alpine hardened image (no ffmpeg) <!-- fact:n8n_code_sandbox verified:2026-05-03 -->
- n8n container OS: Alpine hardened (no ffmpeg natively; ffmpeg available on host via SSH stitch cred) <!-- fact:n8n_container_os verified:2026-05-03 -->

## WP Abilities API / MCP Gotchas
- MCP adapter stdClass cast: Some WP REST endpoints return stdClass that MCP adapter can't serialize — must explicit `(array)` cast
- qmd WAL contention on Windows: multiple processes can't write to same DB; serialize writes

## ClaudeClaw (VPS)
- Restart: `sudo -n systemctl restart claudeclaw` <!-- fact:claudeclaw_self_restart_command verified:2026-05-20 stale_after:180d -->
- SSH: `ssh -tt -i ~/.ssh/hetzner_key root@157.180.33.253 "sudo -u claudeclaw -i ..."` <!-- fact:claudeclaw_ssh_command verified:2026-05-27 stale_after:180d -->
- Vault sync: `startVaultSync()` in `src/vault.ts`, interval `VAULT_PULL_INTERVAL_MS=300000` (5 min) <!-- fact:claudeclaw_vault_sync verified:2026-06-01 -->
- Deploy key scoped to obsidian-vault repo only (not account-level) <!-- fact:claudeclaw_vps_deploy_key_scope verified:2026-06-01 -->
- Pre-commit secret-scan hook patterns: `sk-ant-, ghp_, AKIA, eyJ, AIza, sbp_, -----BEGIN, Telegram bot-token` — activated via `package.json` postinstall `git config core.hooksPath scripts/git-hooks` <!-- fact:claudeclaw_secret_scan_hook verified:2026-06-01 -->
- julive bot crontab: memory-consolidation (daily 06:00), vault-consolidation (weekly Mon 03:00), event-watcher (hourly), health-check (hourly), tmp-cleanup (weekly) <!-- fact:julive_bot_crontab_jobs verified:2026-05-26 stale_after:90d -->
- Claude Code OAuth token lifetime: 1 год, до 2027-05-27 (`credentials/claude-code-oauth.token`) <!-- fact:claude_code_oauth_token_lifetime verified:2026-05-27 -->

## Google Workspace / GCP
- OAuth client secret → `credentials/google-workspace.env` (reference by filename). ✅ РОТИРОВАН 2026-06-04: старый клиент удалён в GCP (старый `GOCSPX-kjd…` мёртв), создан новый — client_id ТОТ ЖЕ (`283475319435-m90m…`), новый secret. Consumers обновлены: `credentials/google-workspace.env` + `Studiokook/.mcp.json` + cached OAuth token. <!-- fact:new_oauth_client_secret verified:2026-06-04 -->
- GCP credentials list: https://console.cloud.google.com/apis/credentials?project=283475319435 <!-- fact:gcp_credentials_list_url verified:2026-05-09 stale_after:365d -->
- n8n service account: studiokook@studiokook.iam.gserviceaccount.com (googleApi cred, GSC studiokook.ee verified) <!-- fact:n8n_service_account verified:2026-05-17 stale_after:180d -->
- Dreaming API beta headers: `dreaming-2026-04-21` + `managed-agents-2026-04-01`; Managed Agents API only (not CLI); models: `claude-opus-4-7`, `claude-sonnet-4-6` <!-- fact:anthropic_dreaming_api verified:2026-05-09 stale_after:180d -->

## IBKR Paper Trading
- KYC: базовая регистрация (email + страна), полная верификация не нужна <!-- fact:ibkr_paper_kyc verified:2026-05-05 -->
- Market data: 15-min delay free, real-time с подпиской <!-- fact:ibkr_paper_data verified:2026-05-05 -->
- API: полный TWS API + IBKR REST API доступны <!-- fact:ibkr_paper_api verified:2026-05-05 -->

## GPU / Hardware
- System: Lenovo LOQ 15IRX10 (MT 83JE), RTX 5070 Laptop GPU <!-- fact:system_model verified:2026-05-18 -->
- GPU BSOD: nvlddmkm Event 14+153, error 0x116 (STATUS_INSUFFICIENT_RESOURCES c000009a) — resolved with driver 596.36 + HAGS OFF <!-- fact:gpu_bsod_diagnosis verified:2026-05-18 -->
- HWiNFO64 INI keys: `SensorsOnly=1`, `StartMinimized=1`, `LogInterval=1000` <!-- fact:hwinfo64_ini_keys verified:2026-05-17 -->

## fact:trading_db_ddl_owner (2026-06-02)
**brain_decisions + signals_v2 → owner `n8n_admin`** (были `postgres`). Вся trading-схема public теперь под n8n_admin → DDL-миграции (ALTER/CREATE) делаются через SSH `docker exec postgres psql -U n8n_admin -d n8n`, БЕЗ superuser/Portainer. Колонка `brain_decisions.engine_version TEXT DEFAULT 'v1'` добавлена (v1=Signal Brain, v2=Confluence Engine Phase 2). Confluence Engine `D8Lt8m7ghTqO1qD7` Log Decision пишет `'v2'` (verified standalone tx-test). pg container = `postgres`.

## fact:anthropic_key_rotation (2026-06-09)
Anthropic API key ротирован (2026-06-09: старый ключ засветился в этой сессии через сломанный curl `$(cat)` quoting + промежуточный ключ через файл-обмен; оба revoked в Console). Актуальный ключ — в `credentials/anthropic-api.key` (по filename, не цитируется). Прописан: local `credentials/anthropic-api.key` + VPS `/opt/n8n/.env` как `ANTHROPIC_API_KEY` (НЕ docker-compose.yml — env_file; `docker compose up -d --force-recreate n8n`, verified: container env совпал с local, healthz 200, live /v1/models 200). Бэкап `.env.before-anthropic-rotation-20260609`. Предыдущая ротация 2026-06-02: ключ утёк в n8n execution log №118286 через TG. ClaudeClaw НЕ использует API-key (OAuth setup-token, `getSessionToken()` в src/agent.ts) — `.env` ANTHROPIC_API_KEY рудимент, не трогать. Gemini billing (GCP project 58791593392) был отдельный dunning-инцидент, оплачен, restored (HTTP 200).

## n8n Infrastructure Core (canonical — moved from MEMORY.md 2026-06-03)
<!-- SSOT for n8n infra. MEMORY.md keeps only a pointer. Verified facts (git/user-confirmed), not session-llm. -->
- VPS `157.180.33.253`. n8n **2.18.5** (latest stable 2026-04-29, verified 2026-05-03), Docker `n8nio/n8n:2.18.5` pinned, postgres `pgvector/pgvector:pg15` <!-- fact:n8n_version_host verified:2026-05-03 stale_after:21d -->
- Native MCP server (n8n 2.14.0+ GA): `https://n8n.studiokook.ee/mcp-server/http` (streamable HTTP), Bearer token `credentials/n8n-mcp-token.txt` (aud=`mcp-server-api`). v1.1.0, 25 tools (`n8n-native`). WF must be explicitly exposed per WF (default zero). Coexists с czlonkowski `n8n-mcp` <!-- fact:n8n_native_mcp_server verified:2026-05-10 stale_after:30d -->
- 45 WF total / 39 active (verified 2026-05-10 via /api/v1/workflows live) <!-- fact:n8n_wf_count verified:2026-05-10 -->
- `N8N_BLOCK_ENV_ACCESS_IN_NODE=false` — required for `$env` in Code nodes <!-- fact:n8n_env_access_flag verified:2026-05-03 -->
- `N8N_ENCRYPTION_KEY` in compose env since 2026-05-03 (auto-gen value also in `/opt/n8n/n8n_data/config`). Local backup `credentials/n8n-encryption-key.txt` <!-- fact:n8n_encryption_key verified:2026-05-03 stale_after:30d -->
- Community nodes: `n8n-nodes-google-search-console@1.0.40`, `@mendable/n8n-nodes-firecrawl@2.1.0` <!-- fact:n8n_community_nodes verified:2026-05-03 stale_after:30d -->
- Compose backup `/opt/n8n/docker-compose.yml.before-pin-20260502`. Baseline pg dump `/opt/n8n/backups/n8n-baseline-2.18.5-20260503.dump` (285MB, 692 entries). WF snapshot `C:/tmp/n8n-pre-upgrade-20260502/`. Compose must include `networks: n8n-network` (external `n8n_n8n-network`) <!-- fact:n8n_backups_compose verified:2026-05-03 -->
- Google OAuth2 cred `0a4JFSW3JyCsi8wo` (GCP studiokook). Telegram cred `mxbg2RUQv7Widfws`, chat `804465999`. Gemini `GEMINI_API_KEY` env, model `gemini-2.5-flash`, GCP ARKHOS (billing). Supabase `SUPABASE_URL=https://app.studiokook.ee`, PostgREST upsert needs `?on_conflict=column`. GCP projects: ARKHOS (billing+Gemini) + studiokook (OAuth2) <!-- fact:n8n_creds_apis verified:2026-05-03 stale_after:30d -->
- Workflow IDs: SEO Audit `EMUTtOI8BWLvDxn0`, Traffic Drop `8ZsWQfxf1oMZYQFe`, Analytics `n4unkzPUqdWklOhc`, Studiokook Video Gen v1 `kyuBLkWS7q6wodAM` (webhook stub only, 0 exec), Video Error Handler v1 `oKMVXx6UX3Ln13Ta`, Video TG Callback Handler v1 `wNkjWy0nT3odT9PP` (webhook `/studiokook-tg-callback`). SSH stitch cred `ESEf68VzIbrarVlP` → `root@172.17.0.1` → ffmpeg → `/opt/n8n/n8n_data/output/{exec_id}.mp4`. Private key `credentials/n8n-host-ssh.key` <!-- fact:n8n_workflow_ids verified:2026-05-10 -->
- ANTHROPIC_API_KEY (n8n env): credit balance 0 — не использовать api.anthropic.com напрямую без top-up <!-- fact:n8n_anthropic_balance verified:2026-05-03 -->
- ANTHROPIC_API_KEY pointer: `credentials/anthropic-api.key` (значение НЕ хранить здесь) <!-- fact:anthropic_api_key_current_pointer 2026-06-04 -->

## Niche Project Facts (moved from MEMORY.md 2026-04-23)

<!-- manual 2026-06-07 -->
- ✅ ЗАКРЫТО: Gemini-ключ ротирован (новый `AQ.Ab8…G8g`, старый revoked), VPS .env обновлён, история переписана (filter-branch) + force-push (`1be2583→b57ae22`), новый pre-commit secret-guard. OpenRouter-ключ был мёртв. Детали: [[project_vault_secret_leak_20260607]] <!-- fact:vault_secret_leak_20260607_resolved manual:2026-06-07 src:session verified -->
