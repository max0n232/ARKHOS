# Studiokook Skills Registry

Индекс всех доступных skills для проекта.

## Quick Reference

| Триггер | Skill | Описание |
|---------|-------|----------|
| `SEO audit` | seo-aeo | SEO/AEO оптимизация, EEAT |
| `Instagram` | seo-smm | SEO + SMM стратегия |
| `WordPress` | wordpress-router | Роутер → wp-* skills |
| `marketing` | marketing | 25+ marketing skills |
| `n8n` | n8n-workflow | Workflow automation |
| `schema` | schema-markup | JSON-LD разметка |

## Skills по Категориям

### SEO & Content
- **seo-aeo/** — EEAT, metadata, JSON-LD, AEO
- **seo-smm.md** — SEO + Instagram стратегия

### WordPress
- **wordpress-router/** — Классификация WP задач
- **wp-rest-api/** — Endpoints, auth, validation
- **wp-abilities-api/** — NGG gallery, MCP tools
- **wp-performance/** — Lazy loading, Core Web Vitals
- **wp-wpcli-and-ops/** — WP-CLI команды
- **wp-project-triage/** — Detect plugin/theme type

### Marketing (25+ skills)
- **marketing/CLAUDE.md** — Entry point
- **marketing/skills/seo-audit/** — Technical audit
- **marketing/skills/copywriting/** — Copy creation
- **marketing/skills/schema-markup/** — Structured data
- **marketing/skills/analytics-tracking/** — GA4, GTM
- **marketing/skills/cro/** — Conversion optimization
- ... (20+ more)

### Automation
- **n8n-workflow** → Global skill (n8n-expert)

## Activation

Skills активируются автоматически через `_triggers.json`:
1. User prompt анализируется
2. Matching triggers определяют skill
3. SKILL.md загружается в контекст

## Adding New Skills

1. Создай `skills/{skill-name}/SKILL.md`
2. Добавь triggers в `_triggers.json`
3. Обнови этот REGISTRY.md

## Usage Stats

Tracked в `knowledge.db` → таблица `skill_usage`
