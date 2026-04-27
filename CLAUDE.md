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

## Obsidian Vault

Path: `C:/Users/sorte/ObsidianVault` (PARA). Доступ → skill `obsidian-router` (QMD semantic search / Nexus CRUD when app running / REST API fallback). Коллекции QMD: `vault`, `ghost-.claude`.

## Session Audit

Автомат: `hooks/pre-compact/session-audit.js` извлекает facts/errors/patterns → MEMORY.md + vault. Ghost перехватывает decisions/mistakes/knowledge.

Ручное: создан/изменён компонент инфры (VPS service, hook, n8n, MCP, bot) → `10-Projects/ARKHOS/components/{name}.md` (см. `components-registry.md`).

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

## Observation Protocol

После любого внедрения, требующего проверки в проде через N дней (новый hook, n8n WF, WP mu-plugin, схема, throttle) → создай файл `ObsidianVault/10-Projects/ARKHOS/observations/<subject>-YYYYMMDD.md` с frontmatter (`type: observation`, `observe_until`, `success_criteria`, `status: watching`, `host`). Hook `observation-watch.js` (SessionStart, 12ч throttle) пришлёт TG-алерт по истечении `observe_until`. Lifecycle и контракт → `observations/_index.md`.

## Knowledge Distillation

Триггер: "distill" / "дистилляция" → librarian agent. Routing map: vault `90-System/routing-map.md`. Growth limits: `references/growth-limits.md`.

## Scaling Rules

Каждый skill/command/agent ≈ 100 слов в контекст каждой сессии навсегда. Перед созданием:

- <2 использований → inline, не создавай
- Только manual (нет авто-триггера) → не создавай (мёртвый груз)
- Похожий существует в `skills/REGISTRY.md` → расширяй
- Reference doc >300 строк → согласование

File discipline (approval, ≤200 строк, data homes) → `constitution.md § File Discipline`. Lifecycle + priorities → `skills/REGISTRY.md`.

---

## Output Quality

После генерации (code/prompt/content/config/plan) — `Skill("output-critic")` в том же ответе перед финальной выдачей, включая перед ExitPlanMode. Skip: "quick"/"draft"/"rough"/"черновик"/"быстро"/iterative edits.

## Causal Rules

Перед решениями в типовых ситуациях → vault `10-Projects/ARKHOS/causal-rules.md` (IF→THEN). Триггеры:
- ASEO drop, health-check fail, >3 corrections, >3 файла в задаче
- **Параметрическая/математическая** (DC формулы, координаты, layout, геометрия, EasyKitchen, SU) → Zero Point First + mandatory topic-file reads
- **EK/DC задача** (set_attribute, redraw, FACADE, BLEND, d106, lenz, mm!key, parent!, CHOOSE, countertop, eurocut, столешница) → Read dc-mechanics/facade-gap-standards/formulas/export-pipeline/composition/schema/countertop-eurocut перед кодом
- **Multi-step domain task** (EK/SU compose-kitchen, n8n WF build, WP REST batch, legal lepingu, copy для лендинга) → first instinct: специалист-агент? Match by intent (read agent description), не по keyword. Делегируй вместо solo, если scope > tuning одного файла.
- **Knowledge routing** (distill, librarian, vault, _index.md) → Read routing-map; new topic-файл = добавь row в routing-map; folder-MOC ≠ свалка
- **Hooks/agents/settings правка** — Plan agent перед write

## Rollback Protocol

Перед мульти-шаговыми операциями над критичными файлами (settings.json, hooks/*, CLAUDE.md, rules/*, n8n WF, WP):
1. `git stash` или зафиксируй HEAD hash
2. Выполни операции
3. Ошибка mid-way → `git checkout -- <files>` для отката
4. Для MCP write (n8n, WP, vault) → прочитай текущее состояние ДО write, лог previous version в `logs/rollback/`
