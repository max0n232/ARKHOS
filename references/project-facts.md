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
- Token: `<redacted-video-token>`

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
- admin / <redacted-n8n-pass> <!-- fact:n8n_admin_credentials verified:2026-05-03 -->

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

<!-- auto-appended 2026-05-07 -->
- session-audit.js, compact-report-injector.js, init-memory.js <!-- fact:hook_change_files verified:2026-05-07 -->
- CLAUDE.md (3 правила), constitution.md (1 exception) <!-- fact:routing_rules_files verified:2026-05-07 -->
- dc-mechanics, composition×2, troubleshooting, global-patterns, hooks-skil <!-- fact:vault_migrations_destinations_examples verified:2026-05-07 -->

<!-- auto-appended 2026-05-07 -->
- PD1_1 (oven+MO pencil, 600×671×2178) <!-- fact:canonical_pencil_module verified:2026-05-07 -->
- BD1_M (custom Studiokook sink) <!-- fact:canonical_sink_base_module verified:2026-05-07 -->

<!-- auto-appended 2026-05-07 -->
- VPS auth.json от Apr 30 <!-- fact:codex_oauth_host_2 verified:2026-05-07 -->

<!-- auto-appended 2026-05-07 -->
- 5 entities + 10 definitions <!-- fact:sketchup_scene_entities verified:2026-05-07 -->
- BG1_M (custom Studiokook sink) <!-- fact:ek_canonical_corner_base_module verified:2026-05-07 -->
- PD1_1 (600×671×2178) <!-- fact:ek_canonical_oven_mo_pencil_module verified:2026-05-07 -->

<!-- auto-appended 2026-05-07 -->
- 8 косяков классифицированных по vault doc, 4 action items, 6 lessons <!-- fact:post_mortem_content_summary verified:2026-05-07 -->

<!-- auto-appended 2026-05-07 -->
- auto-frontmatter on save <!-- fact:obsidian_linter_config verified:2026-05-07 -->
- folderNoteName: {{folder_name}} <!-- fact:folder_notes_default_config verified:2026-05-07 -->
- folderNoteName: _index <!-- fact:folder_notes_modified_config verified:2026-05-07 -->

<!-- auto-appended 2026-05-07 -->
- 32 (drift 6 unindexed) <!-- fact:vault_mocs_before verified:2026-05-07 -->
- 13 + Templater configured + Folder Notes mapped to `_index` + Find Orphaned configured <!-- fact:plugins_active_after verified:2026-05-07 -->
- +3 active Templater (trading-chapter / legal-note / ) <!-- fact:templates_after verified:2026-05-07 -->

<!-- auto-appended 2026-05-07 -->
- Always loaded в каждый context (system prompt) <!-- fact:auto_memory_load_condition verified:2026-05-07 -->
- Behavioral rules (always-on), index project ст <!-- fact:auto_memory_content verified:2026-05-07 -->

<!-- auto-appended 2026-05-07 -->
- 16 (8 Trading-Knowledge books + 7 Legal subfolders + ARKHOS components) <!-- fact:templater_folder_template_mappings verified:2026-05-07 -->

<!-- auto-appended 2026-05-07 -->
- Ghost-сессии (last 7 дней) <!-- fact:memory_consolidation_source verified:2026-05-07 -->
- vault `pattern-library.md` <!-- fact:memory_consolidation_output_vault verified:2026-05-07 -->

<!-- auto-appended 2026-05-07 -->
- bash ghost session-start <!-- fact:ghost_cli_session_start_command verified:2026-05-07 -->

<!-- auto-appended 2026-05-09 -->
- 12 попыток custom-l в kitchens/ (от 01:20 до 12:28) <!-- fact:custom_l_attempts_today verified:2026-05-09 -->

<!-- auto-appended 2026-05-09 -->
- 4 (researcher, translator, wp-auditor, wp-specialist) <!-- fact:agents_with_sonnet_model verified:2026-05-09 -->

<!-- auto-appended 2026-05-09 -->
- 12 попыток custom-l в `kitchens/` (от 01:20 до 12:28) <!-- fact:custom_l_attempts_today verified:2026-05-09 -->

<!-- auto-appended 2026-05-09 -->
- 11 агентов, из них 4 ('researcher', 'translator', 'wp-auditor', 'wp-specialist') используют 'model: sonnet', 7 агентов без поля 'model'. <!-- fact:agent_model_configuration verified:2026-05-09 -->
- Opus 4.7 является CLI default. <!-- fact:cli_default_model verified:2026-05-09 -->

<!-- auto-appended 2026-05-09 -->
- 4 агента (`researcher`/`translator`/`wp-auditor`/`wp-specialist`) <!-- fact:agents_with_model_sonnet verified:2026-05-09 -->

<!-- auto-appended 2026-05-09 -->
- SKK_TG1_R (unsuffixed TG1.skp = right-hand по EK convention) <!-- fact:tg1_right_hand_convention verified:2026-05-09 -->

<!-- auto-appended 2026-05-09 -->
- Требует живой SketchUp с открытой сценой и MCP-плагином. <!-- fact:mcp_sketchup_eval_ruby_requirement verified:2026-05-09 -->

<!-- auto-appended 2026-05-09 -->
- 912 / 450 / 900 / 450 <!-- fact:f7_north_row_door_widths verified:2026-05-09 -->

<!-- auto-appended 2026-05-09 -->
- .before-tracer-20260509 <!-- fact:ek_real_compose_backup_file verified:2026-05-09 -->
- disabled (tracer_enabled = false) <!-- fact:ek_real_compose_tracer_default_state verified:2026-05-09 -->
- SKK_TG1_R for NE corner L-kitchen <!-- fact:tg1_canonical_decision verified:2026-05-09 -->

<!-- auto-appended 2026-05-09 -->
- pre-arkhos-refactor-20260509 <!-- fact:claude_code_global_repo_anchor verified:2026-05-09 -->

<!-- auto-appended 2026-05-09 -->
- librarian, researcher, gemini-mega-context already on sonnet; 3 other shell-wrapper agents updated to haiku <!-- fact:global_agent_model_updates verified:2026-05-09 -->
- 4 agents moved from ~/.claude to Studiokook project directory <!-- fact:studiokook_agents_moved verified:2026-05-09 -->
- 6 merge edits applied to wp-specialist <!-- fact:wp_specialist_merge_edits_applied verified:2026-05-09 -->
- 60 days for cold to archive <!-- fact:vault_memory_decay_cutoff verified:2026-05-09 -->
- 46 days ago (2026-03-24) <!-- fact:vault_memory_decay_oldest_entry verified:2026-05-09 -->
- -7/-14 days boost, keeping entries in cold <!-- fact:vault_memory_decay_touch_promotion_effec verified:2026-05-09 -->

<!-- auto-appended 2026-05-09 -->
- Sonnet прописан дефолтом в `settings.json`. <!-- fact:default_model_sonnet verified:2026-05-09 -->
- Команда `/fast` работает только на Opus 4.6. <!-- fact:fast_command_model_requirement verified:2026-05-09 -->

<!-- auto-appended 2026-05-09 -->
- SKK_TG1_R для NE corner L-kitchen <!-- fact:tg1_canonical_decision verified:2026-05-09 -->

<!-- auto-appended 2026-05-09 -->
- redraw_with_undo(bg1) hangs SU on 1489 defs <!-- fact:sketchup_hang_root_cause verified:2026-05-09 -->
- 14mm (10 design + 4 native indent) <!-- fact:backsplash_thickness verified:2026-05-09 -->

<!-- auto-appended 2026-05-09 -->
- рядом с `ek_acceptance.rb` / `ek_f10_verify.rb` / `ek_standards.rb` <!-- fact:preflight_gate_location verified:2026-05-09 -->
- `ek_real_compose.rb:221-263` <!-- fact:commit_with_audit_location verified:2026-05-09 -->

<!-- auto-appended 2026-05-09 -->
- конференция Code with Claude 2026 <!-- fact:claude_dreaming_feature_announcement_eve verified:2026-05-09 -->

<!-- auto-appended 2026-05-09 -->
- Haiku (changed to Sonnet) <!-- fact:codex_second_opinion_agent_model verified:2026-05-09 -->
- `ek_real_compose.rb:221-263` (commit_with_audit) <!-- fact:ek_preflight_integration_point verified:2026-05-09 -->

<!-- auto-appended 2026-05-09 -->
- конференция Code with Claude 2026, начало мая <!-- fact:dreaming_feature_announcement verified:2026-05-09 -->

<!-- auto-appended 2026-05-09 -->
- SKK_TG1_R (не _L) для NE corner L-kitchen <!-- fact:tg1_canonical_decision verified:2026-05-09 -->
- 18mm (равно толщине нижних фасадов) <!-- fact:facade_thickness_standard verified:2026-05-09 -->

<!-- auto-appended 2026-05-09 -->
- Managed Agents API only (не CLI) <!-- fact:anthropic_dreaming_api_availability verified:2026-05-09 -->
- `claude-opus-4-7`, `claude-sonnet-4-6` <!-- fact:anthropic_dreaming_api_supported_models verified:2026-05-09 -->
- Стандартные API-токены, пропорционал <!-- fact:anthropic_dreaming_api_cost verified:2026-05-09 -->

<!-- auto-appended 2026-05-09 -->
- Managed Agents API only — не CLI <!-- fact:dreaming_availability verified:2026-05-09 -->

<!-- auto-appended 2026-05-09 -->
- ширина 900, глубина 450, высота 900 mm <!-- fact:tg1_scene_dimensions verified:2026-05-09 -->
- на 28 mm вперёд от задней стенки <!-- fact:bind_front_plane_position_depth verified:2026-05-09 -->

<!-- auto-appended 2026-05-09 -->
- managed-agents-2026-04-01 <!-- fact:anthropic_beta_access_expected_email_hea verified:2026-05-09 -->

<!-- auto-appended 2026-05-09 -->
- claude-opus-4-7, claude-sonnet-4-6 <!-- fact:dreaming_api_models verified:2026-05-09 -->
- Стандартные API-токены, пропорционально <!-- fact:dreaming_api_cost verified:2026-05-09 -->
- gemini-embedding-001 <!-- fact:gemini_embedding_model verified:2026-05-09 -->

<!-- auto-appended 2026-05-09 -->
- строка 7: "model": "sonnet" <!-- fact:settings_json_model_line verified:2026-05-09 -->
- отсутствует (production scene без convention-named walls) <!-- fact:villu_scene_wall_convention verified:2026-05-09 -->
- I-kitchen вдоль северной стены <!-- fact:villu_scene_topology verified:2026-05-09 -->
- z=[0, 2400], толщина y=[0, 100], длина x=[-200, 3539] <!-- fact:wall_n_dimensions verified:2026-05-09 -->
- CT gap 30mm @ 3339-3369mm, TB2 facade y tolerance <!-- fact:villu_open_findings verified:2026-05-09 -->

<!-- auto-appended 2026-05-09 -->
- 1. Dedupe before load (reuse exclusive_def_name). 2. Auto-purge after save (purge_unused). 3. Baseline warn ([EK WARNING] if pre-compose defs.size > 2000). <!-- fact:f10_fix_changes verified:2026-05-09 -->
- 16 `make_unique` orphans <!-- fact:f10_purged_orphans verified:2026-05-09 -->
- Wall_length должен считаться до облицовочной ПАНЕЛИ pencil-а (3024), не до bbox (3042). <!-- fact:f12_wall_length_correction verified:2026-05-09 -->
- laminate=18 / MDF/Шпон Fres=19 <!-- fact:facade_thickness_standard verified:2026-05-09 -->
- `facade-gap-standards.md` <!-- fact:panel_thickness_rule_location verified:2026-05-09 -->
- `kitchen-build-checklist.md` <!-- fact:deprecated_composition_md_replacement verified:2026-05-09 -->
- F15 (дубли при пересборе) → F16 (eurocut на пенале) → F13 (стыковка через bind_front) <!-- fact:f15_f16_f13_agent_scope verified:2026-05-09 -->
- residue>0, defs>2000, defs>5000 <!-- fact:hard_stop_2_residue_check_gates verified:2026-05-09 -->
- no_duplicate_kitchen_instances, eurocut_only_at_corner, ct_does_not_overlap_panels, appliance_z_origin_check, no_floating_appliances <!-- fact:new_validators_added verified:2026-05-09 -->
- `custom-l-20260509-185005/custom_l_showcase.skp` открыта. Содержит orphan upper-rows из старых сессий на `Layer0` без `run_id`. <!-- fact:current_scene_state verified:2026-05-09 -->

<!-- auto-appended 2026-05-09 -->
- `dreaming-2026-04-21` + `managed-agents-2026-04-01` <!-- fact:anthropic_beta_headers verified:2026-05-09 -->
- .ghost-last-prompt (hash+ts) <!-- fact:ghost_dedup_prompt_sidecar_flag verified:2026-05-09 -->
- .ghost-last-stop (ts) <!-- fact:ghost_dedup_stop_sidecar_flag verified:2026-05-09 -->

<!-- auto-appended 2026-05-09 -->
- `.ghost-last-prompt` (hash+ts) <!-- fact:ghost_prompt_dedup_sidecar_flag verified:2026-05-09 -->
- `.ghost-last-stop` (ts) <!-- fact:ghost_stop_dedup_sidecar_flag verified:2026-05-09 -->

<!-- auto-appended 2026-05-09 -->
- workspace-mcp (Drive/Sheets/Calendar/Docs) <!-- fact:leaked_oauth_scope verified:2026-05-09 -->
- sorte1912@gmail.com, sortefyy@gmail.com <!-- fact:oauth_tokens_cached verified:2026-05-09 -->

<!-- auto-appended 2026-05-09 -->
- https://github.com/max0n232/ARKHOS/security/secret-scanning/unblock-secret/3DUzmY4clP51XOaP0R47S4RJ8IG <!-- fact:github_secret_unblock_url verified:2026-05-09 -->

<!-- auto-appended 2026-05-09 -->
- 14 дней (`observe_until: 2026-05-23`) <!-- fact:observation_window_ghost_dedup_wrappers verified:2026-05-09 -->
- Google OAuth client secret (workspace-mcp config) <!-- fact:github_leaked_oauth_secret_type verified:2026-05-09 -->

<!-- auto-appended 2026-05-09 -->
- у левого края TG1, на 28 mm вперёд от задней стенки <!-- fact:tg1_bind_front_position verified:2026-05-09 -->

<!-- auto-appended 2026-05-09 -->
- distill, дистилляция, librarian <!-- fact:distill_agent_trigger_phrases verified:2026-05-09 -->
- Read, Grep, Glob, Bash, Edit, Write, obsidian-router <!-- fact:distill_agent_tools verified:2026-05-09 -->

<!-- auto-appended 2026-05-09 -->
- Sonnet → Gemini fallback <!-- fact:session_audit_llm_fallback verified:2026-05-09 -->

<!-- auto-appended 2026-05-09 -->
- 18mm (laminate) / 19mm (MDF/Шпон Fres) <!-- fact:facade_thickness_standard verified:2026-05-09 -->
- 450×900 mm плоскость внутри `MAINFRAME` модуля, у левого края TG1, на 28 mm вперёд от задней стенки <!-- fact:bind_front_dimensions_tg1 verified:2026-05-09 -->
- residue=0, defs<2000, defs<5000 <!-- fact:hard_stop_2_ruby_gates verified:2026-05-09 -->
- `no_duplicate_kitchen_instances`, `eurocut_only_at_corner`, `ct_does_not_overlap_panels`, `appliance_z_origin_check`, `no_orphan_components` <!-- fact:new_validators_added verified:2026-05-09 -->
- `ensure_main_menu` (line 309) <!-- fact:main_menu_import_function verified:2026-05-09 -->
- `main_menu.skp` из 3 fallback-путей <!-- fact:main_menu_import_source verified:2026-05-09 -->
- ~12 мин на spawn → completion (80% всего runtime) <!-- fact:pd1_6_cascade_runtime verified:2026-05-09 -->

<!-- auto-appended 2026-05-09 -->
- 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 <!-- fact:new_oauth_client_secret verified:2026-05-09 -->

<!-- auto-appended 2026-05-09 -->
- https://console.cloud.google.com/apis/credentials?project=283475319435 <!-- fact:gcp_credentials_list_url verified:2026-05-09 -->
- https://console.cloud.google.com/auth/clients/create?project=283475319435 <!-- fact:gcp_create_oauth_client_url verified:2026-05-09 -->

<!-- auto-appended 2026-05-09 -->
- line 911 in harness (ek_showcase_custom_l_kitchen.rb) <!-- fact:harness_f12_bug_line verified:2026-05-09 -->
- lines 858, 860 in harness (ek_showcase_custom_l_kitchen.rb) <!-- fact:harness_f4_bug_lines verified:2026-05-09 -->

<!-- auto-appended 2026-05-09 -->
- line 911 in `ek_showcase_custom_l_kitchen.rb` <!-- fact:harness_f12_bug_line verified:2026-05-09 -->
- lines 858, 860 in `ek_showcase_custom_l_kitchen.rb` <!-- fact:harness_f4_bug_lines verified:2026-05-09 -->

<!-- auto-appended 2026-05-09 -->
- studiokook@studiokook.iam.gserviceaccount.com <!-- fact:n8n_service_account_email verified:2026-05-09 -->

<!-- auto-appended 2026-05-09 -->
- line 911 in harness (`ek_showcase_custom_l_kitchen.rb`) <!-- fact:harness_f12_bug_line verified:2026-05-09 -->
- lines 858, 860 in harness (`ek_showcase_custom_l_kitchen.rb`) <!-- fact:harness_f4_bug_lines verified:2026-05-09 -->

<!-- auto-appended 2026-05-09 -->
- dreaming-2026-04-21, managed-agents-2026-04-01 <!-- fact:anthropic_dreaming_api_headers verified:2026-05-09 -->

<!-- auto-appended 2026-05-09 -->
- timestamp <!-- fact:auto_librarian_flag_file_content_key verified:2026-05-09 -->

<!-- auto-appended 2026-05-09 -->
- https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar <!-- fact:google_oauth_scope verified:2026-05-09 -->

<!-- auto-appended 2026-05-09 -->
- Managed Agents API (Research Preview) <!-- fact:anthropic_dreaming_api_access_type verified:2026-05-09 -->

<!-- auto-appended 2026-05-09 -->
- dreaming-2026-04-21 + managed-agents-2026-04-01 <!-- fact:anthropic_dreaming_api_headers verified:2026-05-09 -->

<!-- auto-appended 2026-05-10 -->
- ek_real_compose.rb, ek_compose.rb, staged_pi <!-- fact:ek_domain_compose_harness_files verified:2026-05-10 -->

<!-- auto-appended 2026-05-10 -->
- Excalidraw plugin для Obsidian <!-- fact:recommended_architecture_tool_1 verified:2026-05-10 -->

<!-- auto-appended 2026-05-10 -->
- Compose harness (`ek_real_compose.rb`, `ek_compose.rb`, `staged_pi`), staged_pipeline, agent-playbook <!-- fact:ek_domain_execution_layers verified:2026-05-10 -->
- ek_standards.rb:1414-1425 <!-- fact:ek_standards_auto_loader_lines verified:2026-05-10 -->

<!-- auto-appended 2026-05-10 -->
- Reasoning (с <think>) <!-- fact:ollama_model_deepseek_r1_14b_type verified:2026-05-10 -->
- Код-специализированная <!-- fact:ollama_model_qwen2_5_coder_14b_type verified:2026-05-10 -->
- Reasoning (с <think>) <!-- fact:ollama_model_deepseek_r1_8b_type verified:2026-05-10 -->

<!-- auto-appended 2026-05-10 -->
- module_dc_value_matches_bbox_dim.rb, n_row_lower_uniform_depth.rb, module_dc_value_matches_bind_axis_pos.rb, module_dc_value_matches_lower_row_span.rb <!-- fact:ek_validators_new_files verified:2026-05-10 -->

<!-- auto-appended 2026-05-10 -->
- Compose harness (ek_real_compose.rb + ek_compose.rb + staged_pi), SketchUp Ruby API, MCP (Multi-Component Platform) <!-- fact:ek_domain_execution_layers verified:2026-05-10 -->
- perpendicular_upper_row_uses_corner_bind_axis.rb <!-- fact:perpendicular_upper_row_uses_corner_bind verified:2026-05-10 -->

<!-- auto-appended 2026-05-10 -->
- 127.0.0.1:11434 <!-- fact:ollama_host verified:2026-05-10 -->

<!-- auto-appended 2026-05-10 -->
- ! winget install terrastruct.d2 <!-- fact:d2_winget_install_command verified:2026-05-10 -->

<!-- auto-appended 2026-05-10 -->
- a100 + d106 + 2·d101 <!-- fact:bind_front_formula verified:2026-05-10 -->
- 570 (глубина корпуса) <!-- fact:a100_value verified:2026-05-10 -->
- 3 (смещение фасада по Y) <!-- fact:d106_value verified:2026-05-10 -->
- 19 (толщина двери / ширина боковой бленды) <!-- fact:d101_value verified:2026-05-10 -->
- Vault формула (`a100 + d106 + d101 + k146`) содержит `k146` (22mm = corner-internal carcass offset) вместо `d101` для ширины боковой бленды. <!-- fact:vault_formula_discrepancy verified:2026-05-10 -->

<!-- auto-appended 2026-05-10 -->
- "parent!x203 - parent!k146 - parent!d101" <!-- fact:bind_front_canonical_formula verified:2026-05-10 -->

<!-- auto-appended 2026-05-10 -->
- nomic-embed-text, deepseek-r1:8b, qwen2.5-coder:14b, arkhos-ru (based on qwen3.5:9b), qwen3.5:9b, abliterated <!-- fact:ollama_models_installed verified:2026-05-10 -->
- OLLAMA_FLASH_ATTENTION=1, OLLAMA_KV_CACHE_TYPE=q8_0 <!-- fact:ollama_env_vars_set verified:2026-05-10 -->
- ENABLE_COMMUNITY_SHARING=False, ENABLE_VERSION_UPDATE_CHECK=False, OFFLINE_MODE=True, WEBUI_AUTH=False, OLLAMA_BASE_URL=http://host.docker.internal:11434 <!-- fact:open_webui_env_vars_set verified:2026-05-10 -->

<!-- auto-appended 2026-05-10 -->
- main.js, manifest.json, styles.css <!-- fact:excalidraw_plugin_files verified:2026-05-10 -->

<!-- auto-appended 2026-05-10 -->
- main.js (8.4MB), manifest.json, styles.css <!-- fact:excalidraw_plugin_files verified:2026-05-10 -->

<!-- auto-appended 2026-05-10 -->
- 3 шт за 5 часов (09:42, 12:13, 14:19) <!-- fact:bsod_count_10_05 verified:2026-05-10 -->
- c000009a = STATUS_INSUFFICIENT_RESOURCES <!-- fact:bsod_error_code_0x116_parameter verified:2026-05-10 -->

<!-- auto-appended 2026-05-10 -->
- Нарушено правило feedback_codex_review_gate.md при проведении strategic-critique по architecture <!-- fact:feedback_rule_violation verified:2026-05-10 -->
- ct_no_physical_overlap, ct_segments_cover_lower_row_no_gap, pencil_top_aligned_with_uppers <!-- fact:anna_scene_violations verified:2026-05-10 -->
- k143/k144/k145/k146 = nil (def defaults: 500/500/40/40), d201..d204 = 3mm, a103 = nil (def default 2), a100 = 570mm, d101 = 19mm, d106 = 3mm, a101 = 16mm, z101=0, z201=950mm <!-- fact:bg1_default_parameters verified:2026-05-10 -->
- a100=320mm, a101=18mm, d101=18mm, d106=0, z201=700, k143=k144=320, k147=2 <!-- fact:tg1_default_parameters verified:2026-05-10 -->
- a100=370mm, a101=16mm, d101=19mm <!-- fact:tg1_updated_parameters_after_menu verified:2026-05-10 -->

<!-- auto-appended 2026-05-10 -->
- _d102_formula = CHOOSE(parent!a103,2,4) <!-- fact:facade1_opening_side_formula verified:2026-05-10 -->

<!-- auto-appended 2026-05-10 -->
- Нарушено: strategic-critique по architecture = textbook codex trigger <!-- fact:feedback_codex_review_gate_rule verified:2026-05-10 -->
- parent!z201-parent!a101*2 <!-- fact:magic_corner_x_span_formula verified:2026-05-10 -->
- parent!z202-parent!a101 <!-- fact:magic_corner_y_span_formula verified:2026-05-10 -->

<!-- auto-appended 2026-05-10 -->
- Y -3000mm (3m offset behind) <!-- fact:bg1_left_position_world verified:2026-05-10 -->
- 1 (corner right, door left) <!-- fact:bg1_left_a103_parameter verified:2026-05-10 -->

<!-- auto-appended 2026-05-10 -->
- 1168×554×788 (proportional stretch) <!-- fact:left_magic_corner_inside_dimensions verified:2026-05-10 -->

<!-- auto-appended 2026-05-10 -->
- _x_formula="-55*animate" <!-- fact:el_magic_corner_animation_parameter verified:2026-05-10 -->

<!-- auto-appended 2026-05-10 -->
- CHOOSE(parent!a103,4,2) <!-- fact:bg1_left_def_corrected_formula verified:2026-05-10 -->

<!-- auto-appended 2026-05-10 -->
- Compose harness (`ek_real_compose.rb` + `ek_compose.rb` + `staged_pi`), visual rules, def-surgery scaling <!-- fact:ek_domain_layers verified:2026-05-10 -->

<!-- auto-appended 2026-05-10 -->
- В этой сессии нет инструмента для генерации изображений <!-- fact:image_generation_tool_missing verified:2026-05-10 -->

<!-- auto-appended 2026-05-10 -->
- bf_y=29mm, formula с d106, d106 на MAINFRAME <!-- fact:bind_front_v2_formula_details verified:2026-05-10 -->

<!-- auto-appended 2026-05-10 -->
- parent!x203-parent!k146-parent!d101 <!-- fact:bg1_5_mainframe_6_bind_front_y_formula_o verified:2026-05-10 -->
- parent!x203-parent!k146-parent!d101-parent!d106 <!-- fact:bg1_5_mainframe_6_bind_front_y_formula_n verified:2026-05-10 -->

<!-- auto-appended 2026-05-10 -->
- Готовые/Villu Jõgi/Scene.skp <!-- fact:loaded_sketchup_file verified:2026-05-10 -->

<!-- auto-appended 2026-05-11 -->
- compose checklist, orientation, row formulas, custom library, gap standards, countertop eurocut, agent playbook <!-- fact:vault_document_compose_recipe verified:2026-05-11 -->

<!-- auto-appended 2026-05-11 -->
- X=700..2381.3 (1681.3mm) <!-- fact:n_arm_uppers_span verified:2026-05-11 -->
- Y=-470..-2380.8 (1910.8mm) <!-- fact:w_arm_uppers_span verified:2026-05-11 -->
- 0mm (касается TG1 east @ 700) <!-- fact:tg1_face_gap_n_arm verified:2026-05-11 -->
- 0mm (касается TG1 south @ -470) <!-- fact:tg1_face_gap_w_arm verified:2026-05-11 -->

<!-- auto-appended 2026-05-11 -->
- только verified successes (5 feedback files без изменений) <!-- fact:canon_auto_memory_content verified:2026-05-11 -->
- все 9 нарушений D1-D9 как session-specific findings (НЕ canon) <!-- fact:vault_scene_deviations_content verified:2026-05-11 -->

<!-- auto-appended 2026-05-11 -->
- Step 0, одновременно со стенами (отменено) <!-- fact:outer_side_panels_placement_step verified:2026-05-11 -->
- dimension-defining constraint <!-- fact:outer_side_panels_constraint_type verified:2026-05-11 -->
- walls → lowers → pencils → INNER+OUTER облицовка → THEN uppers/CT/фартуки <!-- fact:furniture_recalculation_canon_order verified:2026-05-11 -->
- BG1[0-1241] → BD3[1241-1841] → BD2[1841-2381] (lenx 559→540) → INNER[2362-2381] → PB3F[2381-2981] → OUTER[2981-3000] <!-- fact:n_arm_final_layout verified:2026-05-11 -->
- BG1 → BD1_M → BI → BD2#1 (lenx 562→543) → INNER → PD1_1 → OUTER до Y=-3000 <!-- fact:w_arm_final_layout verified:2026-05-11 -->
- 798×450, k145=k146=17, translated +19 Y (origin -469→-450) <!-- fact:tg1_final_dimensions_and_position verified:2026-05-11 -->

<!-- auto-appended 2026-05-12 -->
- X=0..370, Y=100..162, Z=16..32 <!-- fact:panel_g_4_dimensions_k143_370mm verified:2026-05-12 -->

<!-- auto-appended 2026-05-12 -->
- от стыковочной панели <!-- fact:x_axis_gap_location verified:2026-05-12 -->
- отдельная coordinate от Y <!-- fact:x_axis_gap_coordinate_type verified:2026-05-12 -->

<!-- auto-appended 2026-05-12 -->
- `CHOOSE(parent!a103, parent!d204, parent!d202)` <!-- fact:canon_lenx_formula_retraction verified:2026-05-12 -->
- d201=0, d203=0, d202=d204=1.5mm <!-- fact:canon_d_gap_params_studiokook_upper verified:2026-05-12 -->
- внутреннее -12mm extension (tab) <!-- fact:panel_g_cut_slot_4_def_bug verified:2026-05-12 -->

<!-- auto-appended 2026-05-13 -->
- _index, agent-playbook, validators-changelog <!-- fact:easykitchen_root_files verified:2026-05-13 -->

<!-- auto-appended 2026-05-13 -->
- Bash(powershell.exe *) <!-- fact:claude_settings_local_json_bash_permissi verified:2026-05-13 -->

<!-- auto-appended 2026-05-13 -->
- "Read(//c/Users/sorte/**)" covers .ssh, .gnupg, credentials/, Desktop/* (all projects) <!-- fact:claude_settings_local_json_permission_is verified:2026-05-13 -->

<!-- auto-appended 2026-05-13 -->
- 8 буллетов в стиле 'X — это Y', без того, ЧТО Claude знает про каждую (где живёт, как вызывается, какой контракт, gotchas) <!-- fact:arkhos_integrations_list_issue verified:2026-05-13 -->

<!-- auto-appended 2026-05-13 -->
- updated: < 2026-04-13 <!-- fact:vault_audit_stale_threshold verified:2026-05-13 -->

<!-- auto-appended 2026-05-13 -->
- event-watcher.cjs:256-258 <!-- fact:event_watcher_cjs_emergency_line_vps verified:2026-05-13 -->

<!-- auto-appended 2026-05-14 -->
- Шлёт `📊 VAULT INSIGHT` / `📋 VAULT DIGEST` про видео-пайплайн <!-- fact:pattern_analyzer_telegram_content verified:2026-05-14 -->

<!-- auto-appended 2026-05-14 -->
- "WARNING LOOP DETECTED: Command failed N times..." → "⚠️ Цикл: команда упала N раз...","WARNING BUDGET BURN: N tool calls..." → "⚠️ Сжигание бюджета: N вызовов..." <!-- fact:vps_file_modification_details verified:2026-05-14 -->

<!-- auto-appended 2026-05-14 -->
- Thu 2026-05-14 05:34:20 UTC <!-- fact:claude_claw_vps_service_restart_time verified:2026-05-14 -->

<!-- auto-appended 2026-05-15 -->
- Gemini → Sonnet fallback chain, Ollama embed <!-- fact:llm_call_site_obsidian_api_models verified:2026-05-15 -->

<!-- auto-appended 2026-05-16 -->
- "Read(//c/Users/sorte/**)" покрывает .ssh, .gnupg, credentials/, Desktop/* (все проекты) <!-- fact:claude_settings_local_json_permission_is verified:2026-05-16 -->
- .before-codex-gate-20260514 <!-- fact:vps_claude_settings_json_backup verified:2026-05-16 -->

<!-- auto-appended 2026-05-16 -->
- googleApi Service Account <!-- fact:n8n_workflow_auth_type verified:2026-05-16 -->
- sc-domain%3Astudiokook.ee <!-- fact:n8n_workflow_gsc_url_format verified:2026-05-16 -->
- codex-gate hook + settings + CLAUDE.md <!-- fact:git_commit_0804c07_description verified:2026-05-16 -->
- game-theory-playbook +44, causal-rules +16, observation +23 <!-- fact:git_commit_e122491_description verified:2026-05-16 -->
- Session log 2026-05-13-audit-codex-gate.md <!-- fact:git_commit_27f8efb_description verified:2026-05-16 -->

<!-- auto-appended 2026-05-16 -->
- Service Account (googleApi) <!-- fact:n8n_workflow_seo_audit_credential_type verified:2026-05-16 -->
- Mon 2026-05-18 09:00 Europe/Tallinn <!-- fact:n8n_workflow_ucb1_bandit_next_signal_tim verified:2026-05-16 -->

<!-- auto-appended 2026-05-17 -->
- "Bash(powershell.exe *)" <!-- fact:claude_settings_local_bash_permissions verified:2026-05-17 -->

<!-- auto-appended 2026-05-17 -->
- `new URL(url).pathname` → regex parse <!-- fact:n8n_workflow_ucb1_calculate_fix verified:2026-05-17 -->

<!-- auto-appended 2026-05-17 -->
- Read(//c/Users/sorte/**), Bash(powershell.exe *) <!-- fact:claude_settings_local_json_permissions verified:2026-05-17 -->

<!-- auto-appended 2026-05-17 -->
- SensorsOnly=1 <!-- fact:hwinfo64_sensors_only_ini_key verified:2026-05-17 -->
- StartMinimized=1 <!-- fact:hwinfo64_minimized_ini_key verified:2026-05-17 -->
- LogInterval=1000 <!-- fact:hwinfo64_log_interval_ini_key verified:2026-05-17 -->
