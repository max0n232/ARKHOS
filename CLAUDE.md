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
4. Не дублируй — проверь существующие записи, обнови если нужно
5. **Проверь лимиты** → read `references/growth-limits.md`, если файл превышает лимит → запусти очистку
6. **TODO для следующей сессии** → три точки сохранения (любая одна выживет):
   - MEMORY.md pending block (compact report)
   - Vault: **проектный** path (`Studiokook/knowledge.md`, НЕ `ARKHOS/knowledge.md`)
   - Ghost: `ghost knowledge` с точными ключевыми словами

Ручной триггер: "distill" / "дистилляция" → запусти librarian agent.

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

Триггер: "distill" / "дистилляция" → librarian agent.
Routing map + classification: vault `90-System/routing-map.md` (single source of truth).
Growth limits: `references/growth-limits.md` (read on-demand при audit step 5).

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
- Приоритеты: P0 (security) → P1 (weekly use) → P2 (monthly) → P3 (infra/hooks) → P4 (rare, review candidate)
- Жизненный цикл: ACTIVE → [1 month unused] → REVIEW → DEPRECATED → DELETE. Новый skill → REGISTRY.md + дата + приоритет.

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
