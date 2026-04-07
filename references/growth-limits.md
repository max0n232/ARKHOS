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

## Memory Decay (automated)

Linear decay runs every 3 days via `hooks/maintenance/memory-decay.js` (SessionStart hook).
Formula: `relevance = max(0.1, 1.0 - days * 0.015)`. Nothing is ever deleted.

| Tier | Days | Behavior |
|------|------|----------|
| active | 0-7 | Normal visibility |
| warm | 8-21 | Normal visibility |
| cold | 22-60 | Decay marker added. Creative recall candidate |
| archive | 60+ | Decay marker added. Creative recall candidate |

Touch: reading an entry promotes it one tier (graduated recall, not instant reset).
Creative recall: compact-report-injector.js randomly surfaces cold/archive entries at session start.

## Auto-Distillation Trigger

session-audit.js (PreCompact) checks accumulator sizes. If troubleshooting-current.md or
global-patterns.md exceeds 100 lines → writes `.distill-needed` flag → compact-report-injector.js
surfaces warning in next session. Flag expires after 7 days.
