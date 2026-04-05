# Growth Limits

Проверка при session audit (step 5) и дистилляции.

## Accumulators (записи копятся, устаревают → cleanup)

| Файл | Лимит | Действие |
|------|-------|----------|
| troubleshooting-current.md | 150 строк | Distillation → routing map destinations |
| global-patterns.md | 150 строк | Distillation → routing map destinations |
| MEMORY.md | 250 строк | Ревью: удалить невалидные `[verified:]` факты, схлопнуть дубли |
| VPS refresh.log | 50 строк | Auto-rotation (cron) |
| VPS telegram-reports.archive.log | 30 дней | Auto-trim (report-lifecycle.sh) |

## Reference (knowledge base — cleanup только дубли/deprecated)

| Файл | Soft limit | Действие |
|------|-----------|----------|
| Studiokook/knowledge.md | 500 строк | Merge дублей, удалить `<!-- audit: -->` маркеры старше 60 дней |
| Studiokook/infrastructure.md | Без лимита | Reference (page IDs, configs). Только deprecated записи |
| Studiokook/seo-strategy.md | 400 строк | Архивировать выполненные action items → `40-Archive/seo-done.md` |
| ARKHOS/knowledge.md | 300 строк | Merge дублей. Deprecated → `40-Archive/` |
| Routing map destinations (17 файлов) | 300 строк каждый | Ревью на дубли при session audit |

**Правило:** лимит ≠ "удалить лишнее". Лимит = "проверь на дубли, deprecated, merge". Полезные данные никогда не удаляются — только консолидируются.
