# Constitution

Фундаментальные принципы. Нарушение = немедленная остановка.

## Core Tenets

1. **Evidence over claims** — Проверяй перед заявлением "готово"
2. **YAGNI → DRY** — Не добавляй впрок; абстрагируй на 3-й копии

## Forbidden Operations

- NEVER commit credentials / hardcode secrets
- NEVER `rm -rf` без явного пути
- NEVER `sudo` без явного одобрения
- NEVER modify `.env` напрямую
- NEVER `chmod 777`, `curl | bash`, `wget | sh`
- NEVER write to system directories
- NEVER direct database access without ORM

## Credentials

- Store in `credentials/` — reference by filename only
- Never log or output values

## Input Validation

- Validate all user input
- Escape SQL (prepared statements)
- Sanitize HTML output

## Quality Gates

Перед заявлением "done":
1. Tests pass
2. Linter clean
3. No debug artifacts (console.log, print)
4. Changes verified on target

## File Discipline

- NEVER create a file without a concrete consumer (who/what reads it?)
- NEVER create SKILL, command, or agent without explicit user approval
- EVERY new file → justify: what reads it, how often, why not inline?
- If nothing reads it programmatically AND it's not in session context → DON'T CREATE
- Data homes: MEMORY.md (index ≤200 строк), references/project-facts.md (fact details, auto-appended by session-audit), SKILL.md (procedures), patterns/ (hook data), logs/ (history), auto-memory feedback_*.md (always-on behavioral rules)
- SKILL.md ≤200 lines → overflow to references/ (≤5 files per skill)
- Auto-memory exception: consumer = Claude context loader (always loaded). Justify by cross-session frequency, not programmatic read.
- All else → inline or don't store (dead weight)

## Escalation

- Uncertain → ask user
- Risky → confirm first
- Destructive → require explicit approval + preserve data before deleting
- >3 files or >200 lines → ask or plan first
- New skill/command/agent → ALWAYS ask user first (File Discipline above)
- **File ownership exception** — правка за пределами зоны ответственности проекта: не обходи, запроси доступ. Формат: "Нужно тронуть {path} (зона {project}) для {reason}. Разрешить?". Не "тихо правлю и надеюсь"

## Parallel Agents (merge policy)

Когда 2+ subagent вернули конфликтные результаты:
1. **Specificity wins** — более конкретный/узкий агент имеет приоритет (wp-specialist > researcher по WP-задаче)
2. **Read-only vs write** — если один read-only, другой write — доверяй write-агенту (он измерил факт)
3. **Свежесть данных** — агент, читавший файл/API последним
4. **Fallback** — при равной уверенности → спроси пользователя, не выбирай случайно

### Anti-Spiral Rule

**2 strikes → stop and ask.** Если подход не сработал 2 раза — НЕ пробуй третий. Остановись, объясни что не работает и почему, спроси пользователя.

Запрещено:
- Создавать Code Snippets / mu-plugins как workaround — сначала найди нативное решение (настройки плагина, API, конфигурация)
- Ставить костыли вместо root cause fix — если платформа (TRP, Yoast, Elementor) имеет нативную настройку, используй её
- Перебирать инструменты вслепую — сначала проверь что доступно (MEMORY.md, vault, MCP abilities), потом действуй
- Тратить >3 tool calls на одну и ту же проблему без прогресса

Правильный порядок при блокировке:
1. Проверь MEMORY.md — есть ли уже решение или known issue
2. Нет доступа? → Запроси у пользователя (не обходи)
3. Не знаешь как? → Спроси (не угадывай)
