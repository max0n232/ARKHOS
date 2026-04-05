<!-- ghost:header -->
## Ghost — AI Session Memory

**ALWAYS search Ghost before reading code or grepping.** When asked about a feature, bug, scenario,
or component — your FIRST action must be a Ghost search. Past sessions contain architecture decisions,
dead ends, failed approaches, and reasoning that code cannot reveal. Do not skip this step.

Use the `ghost-sessions` MCP tool with `deep_search` (not `search`). Fallback CLI commands:

| Command | Purpose |
|---------|---------|
| `ghost search <query>` | Semantic search across past sessions |
| `ghost show <session-id>` | Read a specific session |
| `ghost log` | Recent sessions with summaries |
| `ghost decisions` | Decision log |
| `ghost decision "desc"` | Log a technical decision mid-session |
| `ghost mistake "desc"` | Log a mistake or gotcha mid-session |
| `ghost knowledge "desc"` | Log an insight or pattern mid-session |
| `ghost strategy "desc"` | Log a trade-off explored mid-session |
<!-- ghost:header -->

# ARKHOS

@rules/constitution.md
@rules/code-style.md

## Defaults

- **Language:** RU primary, EN tech terms
- **Autonomy:** <3 файлов, <200 строк — решай сам. Больше — спроси.
- **Token Budget:** 200k. At 50% → STOP and report.

## Operational Facts

### n8n
- URL: `https://n8n.studiokook.ee`
- Docker compose: `/opt/n8n/docker-compose.yml`

## Projects

| Project | Path | Triggers |
|---------|------|----------|
| Studiokook | ~/Desktop/Studiokook | кухни, WordPress, SEO, studiokook.ee, фирма, SMM |
| AiGeneration | ~/Desktop/AiGeneration | личное, задачи, напоминания, AI, генерация |

Получил запрос → определи проект по триггерам → читай `{path}/CLAUDE.md`

## File Routing

| Зона | Путь | Что хранится |
|------|------|--------------|
| Claude Code config | `~/.claude/` | Native dirs + credentials/, patterns/, logs/post-mortem/ |
| MCP серверы | `~/mcp-servers/{name}/` | Кастомный серверный код (gsc и т.д.) |
| Проекты | `~/Desktop/{Project}/` | Всё проектное (бэкапы, ассеты, скрипты) |

- Temp/debug артефакты → не сохранять на диск, выводить в чат
- Новые директории в `~/.claude/` → спроси пользователя

## Obsidian Vault + Knowledge Stack

Vault: `C:/Users/sorte/ObsidianVault` (PARA structure). Три слоя доступа:

### 1. QMD — Semantic Search (always available)

| Collection | Content | Command |
|-----------|---------|---------|
| `vault` | All vault notes | `qmd search vault "<query>"` |
| `ghost-.claude` | Session history | `qmd search ghost-.claude "<query>"` |

**FIRST action for any knowledge query** — search before reading/grepping.

### 2. Obsidian REST API — CRUD (always available)

| Действие | MCP Tool |
|----------|----------|
| Поиск | `mcp__obsidian__obsidian_simple_search` |
| Чтение | `mcp__obsidian__obsidian_get_file_contents` |
| Добавить | `mcp__obsidian__obsidian_patch_content` |
| Создать | `mcp__obsidian__obsidian_append_content` |
| Список | `mcp__obsidian__obsidian_list_files_in_vault` |

### 3. Nexus — Full CRUD (when Obsidian app is running)

Prefer Nexus MCP tools (`mcp__nexus__*`) for CRUD when Obsidian is open — keeps sync.
Fallback: REST API tools above.

### Ghost — Session Memory

```bash
ghost search "<query>"   # semantic search past sessions
ghost log                # recent sessions
ghost decisions          # decision log
ghost decision "desc"    # log mid-session decision
ghost mistake "desc"     # log mid-session mistake
```

**Also available via `ghost-sessions` MCP**: `deep_search` (preferred over `search`).

### Skill: obsidian-router

Use `obsidian-router` skill for routing logic (QMD vs Nexus vs REST API).

**Когда что:**
- **MEMORY.md** — факты (ID, configs), всегда в контексте
- **QMD** — semantic/contextual search across vault + sessions
- **Vault** — reference material, on-demand через search/read
- **patterns/** — данные для hooks (JS читает программно)

## Session Audit (автоматический)

Перед завершением последней задачи в сессии — проведи мини-аудит:
1. Новые факты (ID, endpoints, configs) → MEMORY.md
2. Ошибки/workarounds → vault `10-Projects/Studiokook/20-Areas/Infrastructure/troubleshooting-current` (`mcp__obsidian__obsidian_patch_content`)
3. Паттерны (повторяемые решения) → vault `10-Projects/Studiokook/20-Areas/Infrastructure/global-patterns` (`mcp__obsidian__obsidian_patch_content`)
4. Не дублируй — проверь существующие записи (`mcp__obsidian__obsidian_get_file_contents`), обнови если нужно
5. **Проверь лимиты** (таблица Growth Limits в Knowledge Distillation): если любой файл превышает лимит → запусти очистку
6. **TODO для следующей сессии** → три точки сохранения (любая одна выживет):
   - MEMORY.md pending block (compact report)
   - Vault: **проектный** path (`Studiokook/knowledge.md`, НЕ `ARKHOS/knowledge.md`)
   - Ghost: `ghost knowledge` с точными ключевыми словами (страницы, действия: translate, hreflang, schema)

Ручной триггер: пользователь говорит "distill" / "дистилляция" / "почисти troubleshooting/patterns".

## Knowledge Routing

Куда сохранять найденные знания/паттерны (полное дерево решений → `post-mortem` skill):

| Тип знания | Хранилище | Почему |
|------------|-----------|--------|
| Чеклист / процедура | **Существующий Skill** | Расширяй, не создавай новый |
| Факт (ID, config, API) | **MEMORY.md** | Всегда в контексте сессии |
| Анализ инцидента | **logs/post-mortem/** | Историческая справка |
| Правило для hook/script | **patterns/** | Hook читает программно |
| Reference material | **Obsidian vault** (MCP: obsidian) | Searchable, on-demand, saves tokens |
| Всё остальное | **Не сохранять** | Если ничто не читает — мёртвый груз |

## Knowledge Distillation

Цикл: **накопление → классификация → маршрутизация → очистка**.
Source: vault `10-Projects/Studiokook/20-Areas/Infrastructure/troubleshooting-current`, `10-Projects/Studiokook/20-Areas/Infrastructure/global-patterns` (via `mcp__obsidian__obsidian_get_file_contents`)

### Growth Limits (проверка при session audit)

Два типа файлов — разные правила:

**Accumulators** (записи копятся, устаревают → нужен cleanup):

| Файл | Лимит | Действие |
|------|-------|----------|
| troubleshooting-current.md | 150 строк | Distillation → routing map destinations |
| global-patterns.md | 150 строк | Distillation → routing map destinations |
| MEMORY.md | 250 строк | Ревью: удалить невалидные `[verified:]` факты, схлопнуть дубли |
| VPS refresh.log | 50 строк | Auto-rotation (cron) |
| VPS telegram-reports.archive.log | 30 дней | Auto-trim (report-lifecycle.sh) |

**Reference** (knowledge base, растёт ≈ постоянно — cleanup только дубли/deprecated):

| Файл | Soft limit | Действие |
|------|-----------|----------|
| Studiokook/knowledge.md | 500 строк | Merge дублирующих записей, удалить `<!-- audit: -->` маркеры старше 60 дней |
| Studiokook/infrastructure.md | Без лимита | Это reference (page IDs, configs). Только удалять deprecated записи |
| Studiokook/seo-strategy.md | 400 строк | Архивировать выполненные action items (✅ → `40-Archive/seo-done.md`) |
| ARKHOS/knowledge.md | 300 строк | Merge дублей. Deprecated patterns → `40-Archive/` |
| Routing map destinations (17 файлов) | 300 строк каждый | Если >300 — ревью на дубли при session audit |

**Ключевое правило:** лимит ≠ "удалить лишнее". Лимит = "проверь на дубли, deprecated, и merge". Полезный reference data **никогда не удаляется** — только консолидируется.

### Routing Map (destination → keywords)

| # | Destination | Keywords |
|---|-------------|----------|
| 1 | vault `10-Projects/Studiokook/20-Areas/WordPress/windows-gotchas` | curl+UTF-8, encoding, ANSI codepage, Buffer.byteLength, Content-Length, history expansion, `!`, shell-quote, pipe blocking, Base64 auth, Node 24, UV_HANDLE_CLOSING, better-sqlite3, sql.js, path.join, drive letters, node -e, `!==`, Git Bash, platform-specific |
| 2 | vault `10-Projects/Studiokook/20-Areas/WordPress/translatepress` | wp_trp_dictionary_*, status=0/2, HTML entity mismatch, whitespace sensitivity, Elementor rebuild+translations, emoji/Unicode breaking TRP, trp-search/trp-add internals, output buffer, rendering pipeline |
| 3 | vault `30-Resources/API-Reference/studiokook-examples` | curl -d @file.json, https.request, Buffer.from(), API endpoint usage (trp-*, elementor/{id}, update-seo), JSON request/response, deploy-file usage, workflow recipes |
| 4 | vault `10-Projects/Studiokook/knowledge` | Architecture quirks, wp_update_post crashes, REST API errors (401/500), Elementor hybrid state, TRP multi-table quirks, cache propagation, MCP Abilities gotchas, SSH→REST fallback |
| 5 | vault `10-Projects/Studiokook/infrastructure` | Zone.ee, PHP version, plugin versions, Code Snippet #numbers, page IDs+slugs, Schema config, Seraphinite cache paths, Yoast setup, hreflang, NGG gallery IDs, dependency map, known issues |
| 6 | vault `10-Projects/Studiokook/seo-strategy` | Keywords (ET/RU/EN), title/meta rules, SMM strategy, Instagram, Google Ads, Meta Ads, CRO, email marketing, KPIs, content automation |
| 7 | vault `30-Resources/Learning/technical-seo` | generateMetadata, Open Graph, robots.txt, Sitemap, Core Web Vitals (LCP/INP/CLS), image/font optimization, canonical URLs, redirects, noindex |
| 8 | vault `10-Projects/Studiokook/20-Areas/n8n/workflow-patterns` | Webhook/HTTP API/Database/AI Agent/Scheduled patterns, data flow, webhook auth, HMAC, cron, pagination, rate limiting, workflow debugging, n8n local testing |
| 9 | vault `10-Projects/Studiokook/20-Areas/n8n/mcp-tools` | search_nodes, get_node, validate_node, addNode/removeNode, validation profiles, execution management, version control, template deployment |
| 10 | vault `10-Projects/Studiokook/20-Areas/WordPress/translation-verify` | Negative-match verification, confirmation bias, scope narrowing, TRP string segmentation, Estonian patterns (õ,ü,verbs), visual browser verification, red flags |
| 11 | vault `10-Projects/Studiokook/20-Areas/WordPress/problem-solving` | FIX/WORKAROUND/ENHANCEMENT, root cause, 5 Whys, cleanup_after, lifecycle (ACTIVE→DEPRECATED→DELETED) |
| 12 | `MEMORY.md` (проектный, fallback) | Page IDs, endpoints, configs, API gotchas (method/auth/encoding), version numbers |
| 13 | vault `10-Projects/ARKHOS/knowledge` | Claude Code, hooks, skills, MCP server, ghost session, qmd, semantic search, ARKHOS, prompt engineering, AI agent architecture, session memory, context window |
| 14 | vault `30-Resources/Learning/ai-ml-patterns` | LLM, RAG, embeddings, vector search, fine-tuning, token optimization, AI agent workflow, model comparison, Claude API, prompt technique |
| 15 | vault `10-Projects/AiGeneration/content-strategy` | content strategy, brand voice, content calendar, AI content generation, copywriting, editorial workflow, content repurposing, content automation |
| 16 | vault `10-Projects/SocialMedia/smm-patterns` | Instagram strategy, TikTok, Telegram channel, Threads, SMM automation, posting schedule, engagement, cross-platform content |
| 17 | vault `10-Projects/Trading/knowledge` | trading, algorithmic trading, market analysis, technical analysis, backtesting, trading bot, exchange API, risk management, portfolio |

### Классификация

| Тип записи | Destination | Признак |
|------------|-------------|---------|
| Факт (ID, config, endpoint) | MEMORY.md или vault `10-Projects/Studiokook/infrastructure` | Конкретное значение, lookup |
| Gotcha (подводный камень) | vault `10-Projects/Studiokook/knowledge` или `10-Projects/Studiokook/20-Areas/WordPress/windows-gotchas` | "Ошибка X потому что Y" |
| Рабочий пример (curl, code) | vault `30-Resources/API-Reference/studiokook-examples` | Содержит копируемый код |
| Паттерн (повторяемый процесс) | vault `10-Projects/Studiokook/20-Areas/n8n/workflow-patterns` / `10-Projects/Studiokook/20-Areas/WordPress/translation-verify` | Шаги 1-2-3, чеклист |
| Устаревшее | УДАЛИТЬ | Проблема не актуальна, система заменена |

### Процедура

```
1. `mcp__obsidian__obsidian_get_file_contents` 10-Projects/Studiokook/20-Areas/Infrastructure/troubleshooting-current + 10-Projects/Studiokook/20-Areas/Infrastructure/global-patterns
2. Для каждой записи:
   a. Тип: факт | gotcha | пример | паттерн | устаревшее
   b. Destination по keyword match (routing map)
   c. `mcp__obsidian__obsidian_get_file_contents` destination — дубликат? → пропусти
   d. Нет → `mcp__obsidian__obsidian_patch_content` к подходящей секции
3. После маршрутизации:
   a. `mcp__obsidian__obsidian_append_content` source — перезаписать очищенной версией
   b. Оставить скелет (заголовки + Self-Learning секция)
   c. Нераспределённые → показать user
4. Отчёт: N обработано, куда ушло, N осталось
```

## Scaling Rules

Каждый skill/command/agent = ~100 слов metadata overhead в КАЖДОЙ сессии навсегда.

### Перед созданием нового skill/command/agent:

1. **Проверь REGISTRY.md** — уже есть похожий? → Расширяй его
2. Будет использоваться >1 раза? Нет → **не создавай, сделай inline**
3. Триггерится автоматически? Нет → **не создавай** (manual-only = мёртвый груз)
4. **Спроси пользователя** перед созданием любого нового skill/command/agent

### Запрещено:

- Создавать skill "на будущее" или "на всякий случай" (YAGNI)
- Создавать command для одноразовой операции
- Дублировать функциональность существующего skill — расширяй
- Создавать agent без явного запроса пользователя
- Создавать reference docs >300 строк без согласования

### Бюджет:

- SKILL.md: ≤200 строк (больше → выноси в references/)
- Reference files на skill: ≤5 файлов
- Всего own skills: сверяй с REGISTRY.md, не плоди

### Приоритеты скиллов:

| Приоритет | Что это | Metadata | Примеры |
|-----------|---------|----------|---------|
| **P0** | Безопасность, конституция | Всегда | rules/ (constitution, code-style) |
| **P1** | Основной workflow (>1 раз/неделю) | Всегда | wordpress, wp-problem-solver |
| **P2** | Поддержка (несколько раз/месяц) | Всегда | seo-aeo, n8n-expert |
| **P3** | Инфраструктура (фоновые/hooks) | Всегда | post-mortem |
| **P4** | По запросу (редко) | Всегда, но кандидат на ревью | — |

При аудите: P4 скиллы — первые кандидаты на удаление/merge.

### Жизненный цикл:

```
СОЗДАНИЕ → [user approval] → ACTIVE
ACTIVE → [не используется 1 месяц] → REVIEW
REVIEW → [нужен] → ACTIVE
REVIEW → [не нужен] → DEPRECATED
DEPRECATED → [подтверждение] → DELETE
```

При создании нового skill — добавь в REGISTRY.md с датой и приоритетом.
`assistant` skill: при monthly review → проверяй P4 скиллы на актуальность.

---

## OUTPUT QUALITY PROTOCOL

**MANDATORY** after generating: AI prompt, text content, code/script, JSON/config, plan.
Skill: `output-critic`. Запускай СРАЗУ после генерации v1 — без вопросов к пользователю.

### Workflow:
1. Generate v1
2. **Call `Skill("output-critic")` tool** — в том же ответе, до финальной выдачи (не ждать Stop hook)
3. Deliver v2 (or v1 if no gaps: "Critic pass: no significant gaps")

### Plans:
Before ExitPlanMode → apply critic to plan (Completeness, Clarity, Goal alignment, Edge cases). Fix if ≤ 3.

### Skip when:
User said: "quick", "draft", "rough", "черновик", "быстро", или iterative editing.

### Manual trigger:
"critique this" / "review" / "проверь качество" / "is this good enough"
