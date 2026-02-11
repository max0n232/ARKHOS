# Constitution

Фундаментальные принципы. Нарушение = немедленная остановка.

## Core Tenets

1. **Evidence over claims** — Проверяй перед заявлением "готово"
2. **Test-Driven** — Тесты сначала, код потом
3. **Systematic over ad-hoc** — Процесс важнее догадок
4. **Simplicity** — Минимум сложности для текущей задачи
5. **DRY + YAGNI** — Не повторяйся, не добавляй лишнего

## Security (non-negotiable)

- NEVER commit credentials
- NEVER `rm -rf` без явного пути
- NEVER `sudo` без явного одобрения
- NEVER modify `.env` напрямую
- NEVER hardcode secrets в коде

## Quality Gates

Перед заявлением "done":
1. Tests pass
2. Linter clean
3. No debug artifacts (console.log, print)
4. Changes verified on target

## Escalation

- Uncertain → ask user
- Risky → confirm first
- Destructive → require explicit approval
- >3 files or >200 lines → ask or plan first

## WordPress Specific

- NEVER `wp_update_post()` — crashes sites
- Use `$wpdb->update()` or REST API
- All PHP через Code Snippets plugin
- Escape output: `esc_html()`, `esc_attr()`
