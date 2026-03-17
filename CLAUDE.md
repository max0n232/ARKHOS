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

## Obsidian Vault

Reference knowledge в `C:/Users/sorte/ObsidianVault`, MCP-сервер: `obsidian` (mcpvault).

| Действие | MCP Tool |
|----------|----------|
| Поиск по знаниям | `mcp__obsidian__search_notes` |
| Чтение заметки | `mcp__obsidian__read_note` |
| Добавить к заметке | `mcp__obsidian__patch_note` |
| Записать целиком | `mcp__obsidian__write_note` |

**Когда что:**
- **MEMORY.md** — факты (ID, configs), всегда в контексте
- **Vault** — reference material, on-demand через search/read
- **patterns/** — данные для hooks (JS читает программно)

## Session Audit (автоматический)

Перед завершением последней задачи в сессии — проведи мини-аудит:
1. Новые факты (ID, endpoints, configs) → MEMORY.md
2. Ошибки/workarounds → vault `troubleshooting/current` (`mcp__obsidian__patch_note`)
3. Паттерны (повторяемые решения) → vault `troubleshooting/global-patterns` (`mcp__obsidian__patch_note`)
4. Не дублируй — проверь существующие записи (`mcp__obsidian__read_note`), обнови если нужно
5. **Проверь лимит:** если vault troubleshooting файлы > 150 строк → запусти Knowledge Distillation (секция ниже)

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
Source: vault `troubleshooting/current`, `troubleshooting/global-patterns` (via `mcp__obsidian__read_note`)

### Routing Map (destination → keywords)

| # | Destination | Keywords |
|---|-------------|----------|
| 1 | vault `wordpress/windows-gotchas` | curl+UTF-8, encoding, ANSI codepage, Buffer.byteLength, Content-Length, history expansion, `!`, shell-quote, pipe blocking, Base64 auth, Node 24, UV_HANDLE_CLOSING, better-sqlite3, sql.js, path.join, drive letters, node -e, `!==`, Git Bash, platform-specific |
| 2 | vault `wordpress/translatepress` | wp_trp_dictionary_*, status=0/2, HTML entity mismatch, whitespace sensitivity, Elementor rebuild+translations, emoji/Unicode breaking TRP, trp-search/trp-add internals, output buffer, rendering pipeline |
| 3 | vault `studiokook/examples` | curl -d @file.json, https.request, Buffer.from(), API endpoint usage (trp-*, elementor/{id}, update-seo), JSON request/response, deploy-file usage, workflow recipes |
| 4 | vault `studiokook/knowledge` | Architecture quirks, wp_update_post crashes, REST API errors (401/500), Elementor hybrid state, TRP multi-table quirks, cache propagation, MCP Abilities gotchas, SSH→REST fallback |
| 5 | vault `studiokook/infrastructure` | Zone.ee, PHP version, plugin versions, Code Snippet #numbers, page IDs+slugs, Schema config, Seraphinite cache paths, Yoast setup, hreflang, NGG gallery IDs, dependency map, known issues |
| 6 | vault `studiokook/seo-strategy` | Keywords (ET/RU/EN), title/meta rules, SMM strategy, Instagram, Google Ads, Meta Ads, CRO, email marketing, KPIs, content automation |
| 7 | vault `seo/technical-seo` | generateMetadata, Open Graph, robots.txt, Sitemap, Core Web Vitals (LCP/INP/CLS), image/font optimization, canonical URLs, redirects, noindex |
| 8 | vault `n8n/workflow-patterns` | Webhook/HTTP API/Database/AI Agent/Scheduled patterns, data flow, webhook auth, HMAC, cron, pagination, rate limiting, workflow debugging, n8n local testing |
| 9 | vault `n8n/mcp-tools` | search_nodes, get_node, validate_node, addNode/removeNode, validation profiles, execution management, version control, template deployment |
| 10 | vault `wordpress/translation-verify` | Negative-match verification, confirmation bias, scope narrowing, TRP string segmentation, Estonian patterns (õ,ü,verbs), visual browser verification, red flags |
| 11 | vault `wordpress/problem-solving` | FIX/WORKAROUND/ENHANCEMENT, root cause, 5 Whys, cleanup_after, lifecycle (ACTIVE→DEPRECATED→DELETED) |
| 12 | `MEMORY.md` (проектный, fallback) | Page IDs, endpoints, configs, API gotchas (method/auth/encoding), version numbers |

### Классификация

| Тип записи | Destination | Признак |
|------------|-------------|---------|
| Факт (ID, config, endpoint) | MEMORY.md или vault `studiokook/infrastructure` | Конкретное значение, lookup |
| Gotcha (подводный камень) | vault `studiokook/knowledge` или `wordpress/windows-gotchas` | "Ошибка X потому что Y" |
| Рабочий пример (curl, code) | vault `studiokook/examples` | Содержит копируемый код |
| Паттерн (повторяемый процесс) | vault `n8n/workflow-patterns` / `wordpress/translation-verify` | Шаги 1-2-3, чеклист |
| Устаревшее | УДАЛИТЬ | Проблема не актуальна, система заменена |

### Процедура

```
1. `mcp__obsidian__read_note` troubleshooting/current + troubleshooting/global-patterns
2. Для каждой записи:
   a. Тип: факт | gotcha | пример | паттерн | устаревшее
   b. Destination по keyword match (routing map)
   c. `mcp__obsidian__read_note` destination — дубликат? → пропусти
   d. Нет → `mcp__obsidian__patch_note` к подходящей секции
3. После маршрутизации:
   a. `mcp__obsidian__write_note` source — удалить absorbed записи
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

After completing ANY generation task, apply the critic phase using the `output-critic` skill.

### When critic phase is MANDATORY (auto-trigger):
- AI prompt generated (image, video, audio)
- Text content produced (post, article, SEO copy, caption)
- Code or script written
- JSON / workflow / structured config created
- Any task where user asked for a "final" result

### When critic phase is SKIPPED:
- User said: "quick", "draft", "rough", "just sketch", "черновик", "быстро"
- Iterative back-and-forth (user is actively editing in conversation)
- Output is purely informational (answer to a question, explanation)

### Protocol:
1. Complete v1 generation as normal
2. Immediately run critic phase — do NOT ask user permission
3. Deliver v2 as the actual response (v1 internalized, not shown unless useful for context)
4. If no gaps found → deliver v1 as final with note: "Critic pass: no significant gaps"

### Override:
- Disable per-session: "skip critic" / "no review needed"
- Force on any output: "critique this" / "review" / "is this good enough"
