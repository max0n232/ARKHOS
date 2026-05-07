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

<!-- auto-appended 2026-05-03 -->
- tiktok-cat-reporter.json <!-- fact:deleted_local_file_tiktok_cat_reporter_j verified:2026-05-03 -->
- kling-video-test.json <!-- fact:deleted_local_file_kling_video_test_json verified:2026-05-03 -->

<!-- auto-appended 2026-05-03 -->
- image-only IG/FB workflow <!-- fact:content_generator_workflow_type verified:2026-05-03 -->

<!-- auto-appended 2026-05-03 -->
- stop-analytics.js, register-check.js, inbox-extraction-check.js <!-- fact:stop_hook_files_missing verified:2026-05-03 -->

<!-- auto-appended 2026-05-03 -->
- stop-analytics.js, inbox-extraction-check.js, register-check.js, goal-tracker.js <!-- fact:removed_dead_refs_from_settings_json verified:2026-05-03 -->

<!-- auto-appended 2026-05-03 -->
- vault-graph-builder.js <!-- fact:missing_hook_file_vault_graph_builder_js verified:2026-05-03 -->
- memory-consolidation.js <!-- fact:missing_hook_file_memory_consolidation_j verified:2026-05-03 -->
- vault-graph-dispatcher.js <!-- fact:missing_hook_file_vault_graph_dispatcher verified:2026-05-03 -->

<!-- auto-appended 2026-05-03 -->
- 4 агента (gemini, codex) были зарегистрированы в runtime, но их файл��в не существовало. <!-- fact:missing_js_files_registered_agents verified:2026-05-03 -->
- Codex ошибочно удалил `usage-tracker.js`, но `memory-decay.js` читает `patterns/usage-tracker.json`. Удаление было отменено, и файл добавлен в settings.json. <!-- fact:codex_error_usage_tracker_js verified:2026-05-03 -->

<!-- auto-appended 2026-05-03 -->
- Восстановление хуков и удаление мертвых ссылок <!-- fact:git_commit_78a6917_description verified:2026-05-03 -->
- Исправление проблем с агентами и планировщиком задач Windows <!-- fact:git_commit_3714ca6_description verified:2026-05-03 -->

<!-- auto-appended 2026-05-03 -->
- admin / X8gL!z2cP7mQ <!-- fact:n8n_admin_credentials verified:2026-05-03 -->

<!-- auto-appended 2026-05-03 -->
- Miele KM 6322 PowerFlex <!-- fact:miele_hob_model verified:2026-05-03 -->

<!-- auto-appended 2026-05-03 -->
- NCS S 8000-N polmatt <!-- fact:uksed_tagasein_material verified:2026-05-03 -->

<!-- auto-appended 2026-05-03 -->
- cutout marker является recognized exception к "no custom geometry" rule <!-- fact:ek_standards_rb_rule_update verified:2026-05-03 -->
- 4 стандартных профиля: Franke MARIS, generic sink, Electrolux EIS82453, generic cooktop с dim_x/dim_y/corner_radius_mm/kind <!-- fact:ek_real_compose_rb_cutout_profiles verified:2026-05-03 -->
- add_countertop_cutout(host_inst:, center_xy_mm:, profile_key: | profile:) — валидирует host (должен быть countertop), валидирует bbox containment, создает na <!-- fact:ek_real_compose_rb_add_countertop_cutout verified:2026-05-03 -->

<!-- auto-appended 2026-05-03 -->
- 5 critical rules passed, 1 deferred: cooktop_and_sink_require_countertop_cutout <!-- fact:codex_run_state_after_previous_run verified:2026-05-03 -->

<!-- auto-appended 2026-05-03 -->
- N-arm countertop (тот чт�� покрывает BD1 sink на X=0..2697, Y=-600..0) <!-- fact:missing_component verified:2026-05-03 -->
- 10mm панель, не CT (вероятно skinali misclassified by name) <!-- fact:misclassified_component_1_description verified:2026-05-03 -->

<!-- auto-appended 2026-05-03 -->
- 1897mm (дист до joint x=2699 → 802mm) <!-- fact:n_arm_sink_center_x verified:2026-05-03 -->
- -1131mm (дист до joint y=0 → 1131mm) <!-- fact:e_arm_cooktop_center_y verified:2026-05-03 -->
- Mama/Папа assignment rules с decision algorithm <!-- fact:countertop_eurocut_md_section verified:2026-05-03 -->

<!-- auto-appended 2026-05-03 -->
- 3 (right cutoff, wall-end) <!-- fact:e_arm_cutoff_mode verified:2026-05-03 -->

<!-- auto-appended 2026-05-03 -->
- gemini-3.1-pro секция (lines 69-83), stdin-pipe pattern (29-51), cost discipline (94) <!-- fact:gemini_mega_context_edit_sections verified:2026-05-03 -->

<!-- auto-appended 2026-05-03 -->
- NODE_FUNCTION_ALLOW_BUILTIN=crypto,https <!-- fact:n8n_env_variable verified:2026-05-03 -->

<!-- auto-appended 2026-05-03 -->
- internal error, please try again later. <!-- fact:kie_ai_imagen_error_reason verified:2026-05-03 -->
- NODE_FUNCTION_ALLOW_BUILTIN=crypto,https, no fetch/$helpers <!-- fact:n8n_code_sandbox_limits verified:2026-05-03 -->
- Alpine hardened image <!-- fact:n8n_container_os verified:2026-05-03 -->

<!-- auto-appended 2026-05-03 -->
- нет (Alpine hardened image) <!-- fact:n8n_container_ffmpeg_availability verified:2026-05-03 -->
- 157.180.33.253 <!-- fact:vps_ip verified:2026-05-03 -->

<!-- auto-appended 2026-05-03 -->
- fal.ai `fal-ai/flux-pro/kontext/max` <!-- fact:i2i_winner_model_api verified:2026-05-03 -->
- kie.ai `/gpt4o-image/generate` <!-- fact:i2i_second_place_model_api verified:2026-05-03 -->

<!-- auto-appended 2026-05-03 -->
- createTask model=google/nano-banana <!-- fact:kie_ai_model_google_nano_banana_slug verified:2026-05-03 -->
- createTask model=nano-banana-2 <!-- fact:kie_ai_model_nano_banana_2_slug verified:2026-05-03 -->

<!-- auto-appended 2026-05-03 -->
- N row Y_max ≈ 0, W row X_min ≈ 0 (snapshot уже есть bbox) <!-- fact:rule_wall_adjacency_description verified:2026-05-03 -->
- pencil top Z = upper top Z <!-- fact:rule_pencil_top_aligned_with_uppers_desc verified:2026-05-03 -->

<!-- auto-appended 2026-05-04 -->
- gemini-3.1-pro (lines 69-83), stdin-pipe pattern (29-51), cost discipline (94) <!-- fact:gemini_mega_context_edit_sections verified:2026-05-04 -->
- prompt-templates.md, brand-book.md v2 <!-- fact:studiokook_visual_language_vault_docs verified:2026-05-04 -->
- POST /api/v1/gpt4o-image/generate <!-- fact:kie_ai_i2i_model_slug_gpt4o_image verified:2026-05-04 -->

<!-- auto-appended 2026-05-04 -->
- 0..2749, -775..0, 923..943 <!-- fact:n_arm_ct_world_bbox verified:2026-05-04 -->
- 2739..3339(visible 1751mm), 0↔-1751, 923..943 <!-- fact:e_arm_ct_world_bbox verified:2026-05-04 -->
- 775 (windowsill 178mm forward) <!-- fact:n_arm_ct_depth verified:2026-05-04 -->
- mode 2 (sink left, indent_side=1697mm) <!-- fact:n_arm_ct_cutoff verified:2026-05-04 -->

<!-- auto-appended 2026-05-04 -->
- 600mm CT-сегмент сидит на карcass, back at wall pla <!-- fact:vault_rule_cabinet_flush verified:2026-05-04 -->

<!-- auto-appended 2026-05-04 -->
- per-project input, не константа, измеряется от плоскости стены до room-side кромки подоконника <!-- fact:windowsill_mm_definition verified:2026-05-04 -->
- -600 (driven by canonical 600mm cabinet-coverage) <!-- fact:ty_translation_value verified:2026-05-04 -->
- 600 + windowsill_mm (значение AD `l0_100_LenY`) <!-- fact:depth_mm_formula verified:2026-05-04 -->

<!-- auto-appended 2026-05-04 -->
- l0_component_502_eurocut_left_width <!-- fact:source_of_truth_ad_key verified:2026-05-04 -->

<!-- auto-appended 2026-05-04 -->
- 8 готовых типов A-H (Светлая+дуб, Тёмная+дуб, Navy премиум, Лавандовый, Орех, Рифлёные, Бюджет, Серый) + видео-шаблоны <!-- fact:prompt_templates_types verified:2026-05-04 -->
- Flux Kontext Max (fal.ai `fal-ai/flux-pro/kontext/max`) <!-- fact:image_to_image_benchmark_winner verified:2026-05-04 -->
- GPT-4o Image (kie.ai `/gpt4o-image/generate`) <!-- fact:image_to_image_benchmark_second_place verified:2026-05-04 -->
- Nano Banana 2 (`google/nano-banana`) <!-- fact:kie_ai_t2i_current_model verified:2026-05-04 -->

<!-- auto-appended 2026-05-04 -->
- `createTask model=google/nano-banana` <!-- fact:kie_ai_t2i_current_slug verified:2026-05-04 -->
- `createTask model=nano-banana-2` <!-- fact:kie_ai_nano_banana_2_slug verified:2026-05-04 -->
- `POST /api/v1/gpt4o-image/generate` <!-- fact:kie_ai_gpt4o_image_slug verified:2026-05-04 -->

<!-- auto-appended 2026-05-04 -->
- всё кроме `40-Archive/`, dotdirs <!-- fact:obsidian_vault_scope verified:2026-05-04 -->

<!-- auto-appended 2026-05-04 -->
- 1=Нет, 2=Сверху, 3=Снизу, 4=Сверху и снизу <!-- fact:countertop_bevel_front_enum_values verified:2026-05-04 -->
- 1=Нет, 2=Сверху, 3=Снизу, 4=Сверху и снизу <!-- fact:countertop_bevel_back_enum_values verified:2026-05-04 -->

<!-- auto-appended 2026-05-04 -->
- 1=Нет (без фаски), 2=Сверху, 3=Снизу, 4=Сверху и снизу <!-- fact:t2_bevel_200_front_enum_values verified:2026-05-04 -->
- 1=Нет (без фаски), 2=Сверху, 3=Снизу, 4=Сверху и снизу <!-- fact:t2_bevel_201_back_enum_values verified:2026-05-04 -->

<!-- auto-appended 2026-05-04 -->
- dashboard.kie.ai (страница Billing → Add credits) <!-- fact:kie_ai_top_up_url verified:2026-05-04 -->

<!-- auto-appended 2026-05-05 -->
- 390×410 R12 (overhang 30/30/30/70) <!-- fact:scene_villu_undermount_cutout verified:2026-05-05 -->
- bevel enum fix + native sizing snapshot reader + eurocut validator v2 single-rule + bevel doc <!-- fact:code_commit_description verified:2026-05-05 -->

<!-- auto-appended 2026-05-05 -->
- nano-banana, bytedance/seedream-v4-edit <!-- fact:kie_ai_available_i2i_models verified:2026-05-05 -->
- nano-banana-2, gpt-4o-image <!-- fact:kie_ai_unavailable_i2i_models verified:2026-05-05 -->

<!-- auto-appended 2026-05-05 -->
- BG1 FACADE def-local axis (через eval_ruby) <!-- fact:rule_lower_corner_door_faces_adjacent_ro verified:2026-05-05 -->
- TG1 left/right variant + def-local axis <!-- fact:rule_upper_corner_orientation_matches_do verified:2026-05-05 -->
- DC bind_front AD на BG1 <!-- fact:rule_blend_corner_perpendicular_row_uses verified:2026-05-05 -->

<!-- auto-appended 2026-05-05 -->
- endpoint = pencil OR wall+filler OR corner (per канон) <!-- fact:row_termination_logic verified:2026-05-05 -->
- passes — N-row left covered W-wall PANEL-FACADE (gap 0mm), right covered BG1 corner <!-- fact:villu_test_description verified:2026-05-05 -->
- удалить PANEL-FACADE + BG1 → fires 2 violations (left wall+no-filler, right bare) <!-- fact:negative_test_description verified:2026-05-05 -->

<!-- auto-appended 2026-05-05 -->
- vault-consolidation.cjs <!-- fact:vps_vault_consolidation_script verified:2026-05-05 -->
- lintOnSave: true, lintOnFileChange: true, recordLintOnSaveLogs: false <!-- fact:obsidian_linter_config verified:2026-05-05 -->

<!-- auto-appended 2026-05-05 -->
- {workflowId}::{nodeName}::{message[:120]} <!-- fact:signature_format verified:2026-05-05 -->

<!-- auto-appended 2026-05-05 -->
- additionalFields.appendAttribution=false <!-- fact:n8n_telegram_attribution_parameter verified:2026-05-05 -->

<!-- auto-appended 2026-05-05 -->
- удален (тренды), оставлен 77750 <!-- fact:vault_duplicate_file_77714 verified:2026-05-05 -->
- удален (отзывы Instagram), оставлен 78356 <!-- fact:vault_duplicate_file_78353 verified:2026-05-05 -->
- удален (LinkedIn карусели), оставлен 78419 <!-- fact:vault_duplicate_file_78416 verified:2026-05-05 -->
- Authorization: Bearer <MCP_TOKEN> <!-- fact:n8n_mcp_server_auth_header verified:2026-05-05 -->

<!-- auto-appended 2026-05-05 -->
- n8n.studiokook.ee → Settings → MCP <!-- fact:n8n_mcp_exposure_settings_url verified:2026-05-05 -->

<!-- auto-appended 2026-05-05 -->
- `n8n_autofix_workflow`,`n8n_generate_workflow`,`n8n_audit_instance`,`get_template`,`search_templates` <!-- fact:n8n_mcp_unique_tools verified:2026-05-05 -->

<!-- auto-appended 2026-05-05 -->
- Базовая регистрация (email + страна), полная верификация не нужна <!-- fact:ibkr_paper_trading_kyc_requirement verified:2026-05-05 -->
- 15-min delay free, real-time с подпиской <!-- fact:ibkr_paper_trading_market_data_delay verified:2026-05-05 -->
- Полный TWS API + IBKR REST API <!-- fact:ibkr_paper_trading_api_access verified:2026-05-05 -->

<!-- auto-appended 2026-05-05 -->
- n8n_autofix_workflow, n8n_generate_workflow, n8n_audit_instance, get_template, search_templates <!-- fact:n8n_mcp_czlonkowski_unique_tools verified:2026-05-05 -->

<!-- auto-appended 2026-05-05 -->
- {asset, timeframe, signal_ts, agent_version, run_id} <!-- fact:signals_v2_unique_constraint_fields verified:2026-05-05 -->

<!-- auto-appended 2026-05-05 -->
- kliendileping-kook, kliendileping-delta-v2.1 (DRAFT) <!-- fact:legal_templates_available verified:2026-05-05 -->

<!-- auto-appended 2026-05-05 -->
- add `signal_id UUID NULL` to `trades` table <!-- fact:migration_005_description verified:2026-05-05 -->
- таблицы `rag_eval_set` (FK к `knowledge_chunks`) + `rag_eval_runs` (auto-generated hit@1_pct/hit@3_pct columns) <!-- fact:migration_006_description verified:2026-05-05 -->

<!-- auto-appended 2026-05-05 -->
- add trades.signal_id UUID NULL + FK на signals_v2(ON DELETE SET NULL) + composite index (symbol, status, opened_at DESC) + partial idx на signal_id <!-- fact:migration_005_description verified:2026-05-05 -->
- таблицы rag_eval_set (FK к knowledge_chunks) + rag_eval_runs (auto-generated hit@1_pct/hit@3_pct columns) <!-- fact:migration_006_description verified:2026-05-05 -->

<!-- auto-appended 2026-05-05 -->
- add signal_id UUID NULL to trades table <!-- fact:migration_005_description verified:2026-05-05 -->
- create rag_eval_set and rag_eval_runs tables <!-- fact:migration_006_description verified:2026-05-05 -->

<!-- auto-appended 2026-05-05 -->
- ручка-профиль (handle-less фасад с C-образным профилем) <!-- fact:gola_profile_type verified:2026-05-05 -->
- C-образный профиль GOLA#2 (vertical) + GOLA#3 (horizontal) <!-- fact:kadi_scene_gola_elements verified:2026-05-05 -->
- Отдельная library папка EK с GOLA-suffix модулями (BD1_GOLA, PB3F_GOLA и т.д.) <!-- fact:gola_library_folder_naming_convention verified:2026-05-05 -->
- :gola flag (autoderive: presence of "GOLA" instance в сцене) <!-- fact:scene_profile_gola_flag verified:2026-05-05 -->

<!-- auto-appended 2026-05-05 -->
- `trades.signal_id UUID NULL` + FK на `signals_v2(ON DELETE SET NULL)` + composite index `(symbol, status, opened_at DESC)` + partial idx на signal_id <!-- fact:migration_005_details verified:2026-05-05 -->
- 30 query→expected_chunk pairs <!-- fact:rag_eval_set_size verified:2026-05-05 -->

<!-- auto-appended 2026-05-05 -->
- instruments_universe, daily_briefs, news_cache <!-- fact:migration_007_tables verified:2026-05-05 -->

<!-- auto-appended 2026-05-06 -->
- :NE, :NW, :SE, :SW, :I_N, :I_S, :I_W, :I_E, :I_island, nil <!-- fact:layout_profile_values verified:2026-05-06 -->

<!-- auto-appended 2026-05-06 -->
- library-gap registry с явным списком модулей и причиной <!-- fact:library_gap_registry_type verified:2026-05-06 -->
- pencil_cladding_required PB2F#1 <!-- fact:new_violation_type verified:2026-05-06 -->

<!-- auto-appended 2026-05-06 -->
- CHOOSE(l0_tabletop_101_cutoff_mode,1,2,1,2) <!-- fact:def_ad_legacy_tabletop_left_cutoff_formu verified:2026-05-06 -->
- вырез слева — есть/нет (для выреза под мойку/варку), не для углового стыка <!-- fact:def_ad_legacy_tabletop_200_left_cutoff_m verified:2026-05-06 -->

<!-- auto-appended 2026-05-06 -->
- подняла верх до 2185mm (надо 2160mm) <!-- fact:sketchup_e102_tall_cabinet_pb2f_incorrec verified:2026-05-06 -->

<!-- auto-appended 2026-05-06 -->
- четверг 7 мая, 09:00 EET <!-- fact:daily_market_brief_first_run verified:2026-05-06 -->

<!-- auto-appended 2026-05-06 -->
- не поддерживает параметры $1 <!-- fact:n8n_postgres_v2_parameter_support verified:2026-05-06 -->

<!-- auto-appended 2026-05-06 -->
- apply_eurocut, place_countertop, add_countertop_cutout <!-- fact:fixed_module_compose_helpers verified:2026-05-06 -->

<!-- auto-appended 2026-05-06 -->
- требует mama+papa modes присутствуют, overlap thin axis ≤15mm <!-- fact:ct_no_physical_overlap_validator_v2_cond verified:2026-05-06 -->
- только на PD1_6 (canon stack), остальные → pencil_appliances_required_when_host <!-- fact:oven_micro_stack_bind_points_validator_v verified:2026-05-06 -->
- только на PD1_6 (canon stack), остальные → pencil_appliances_required_when_host <!-- fact:over_fridge_mezzanine_required_validator verified:2026-05-06 -->
- BF1A blind-corner-base case is rare ~2%; if user intentionally uses TT_CORNER they must acknowledge <!-- fact:countertop_eurocut_two_straights_validat verified:2026-05-06 -->

<!-- auto-appended 2026-05-06 -->
- единая knowledge base, cross-project, searchable через QMD/Nexus <!-- fact:obsidian_vault_intended_design verified:2026-05-06 -->
- router + runtime (agents, skills, hooks, settings) + control center <!-- fact:claude_directory_intended_design verified:2026-05-06 -->
- глобальные правила, видны везде <!-- fact:claude_md_intended_design verified:2026-05-06 -->

<!-- auto-appended 2026-05-06 -->
- n8n_autofix_workflow,n8n_generate_workflow,n8n_audit_instance,get_template,search_templates <!-- fact:n8n_mcp_czlonkowski_tools verified:2026-05-06 -->

<!-- auto-appended 2026-05-06 -->
- 2026-05-04, 2026-05-06 <!-- fact:n8n_gemini_node_success_dates verified:2026-05-06 -->
- Telegram Markdown parse <!-- fact:n8n_gemini_node_fail_reason verified:2026-05-06 -->

<!-- auto-appended 2026-05-06 -->
- 7 дней без BSOD после reboot 04.05 <!-- fact:gpu_hags_disable_bsod_condition verified:2026-05-06 -->
- claude-sonnet-4-20250514 <!-- fact:n8n_workflow_seo_audit_old_model verified:2026-05-06 -->
- generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent <!-- fact:n8n_workflow_seo_audit_new_api_endpoint verified:2026-05-06 -->

<!-- auto-appended 2026-05-07 -->
- требует inline expressions, не $1 params <!-- fact:n8n_postgres_v2_quirk verified:2026-05-07 -->
- стопит pipeline → alwaysOutputData: true <!-- fact:n8n_select_0_rows_quirk verified:2026-05-07 -->
- strict typeValidation routes undefined в FALSE <!-- fact:n8n_if_v2_2_quirk verified:2026-05-07 -->
