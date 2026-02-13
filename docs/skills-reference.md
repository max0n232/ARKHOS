# Skills Reference

## Superpowers (auto-invoke)

ОБЯЗАТЕЛЬНО вызывай через Skill tool БЕЗ запроса пользователя:

| Триггер | Skill |
|---------|-------|
| Новая фича, творческая работа | `superpowers:brainstorming` |
| Баг, ошибка, неожиданное поведение | `superpowers:systematic-debugging` |
| Написание кода | `superpowers:test-driven-development` |
| Многошаговая задача | `superpowers:writing-plans` |
| Создание skill | `superpowers:writing-skills` |
| Заявление "готово" | `superpowers:verification-before-completion` |
| 2+ независимых задач | `superpowers:dispatching-parallel-agents` |

**Правило:** Вызывай skill ДО начала работы, не после.

## Execution Superpowers (после planning)

Выбор execution path после writing-plans:

| Условие | Skill | Примечание |
|---------|-------|-----------|
| Execution в текущей сессии | `superpowers:subagent-driven-development` | Fresh subagent + review checkpoints |
| Execution в отдельной сессии | `superpowers:executing-plans` | Batch execution + checkpoints |
| Завершение development | `superpowers:finishing-a-development-branch` | Merge strategy + cleanup |
| Setup workspace | `superpowers:using-git-worktrees` | Isolated workspace creation |

## Meta Superpowers (обязательные)

| Skill | Когда | Примечание |
|-------|-------|-----------|
| `superpowers:using-superpowers` | Перед любой задачей | Выбирает оптимальные skills |

## Additional Skills (Context-based)

Автоматически загружаются при релевантном контексте:

| Category | Location | Triggers |
|----------|----------|----------|
| n8n Expert (MCP tools) | `~/.claude/skills/n8n-expert/` | Advanced n8n patterns, MCP tools |
| FAL-AI | `~/.claude/skills/fal-ai/` | Image generation, audio synthesis, AI models |
| Integrations | `~/.claude/skills/integrations/` | Telegram bot, webhooks, n8n integration |
| Legal | `~/.claude/skills/legal/` | Estonian law, OÜ, GDPR, contracts, tax |
| Content Creator | `~/.claude/skills/content-creator/` | YouTube, Telegram strategy, SEO |
| Assistant | `~/.claude/skills/assistant/` | Task management, Eisenhower, Pomodoro |
| Knowledge Manager | `~/.claude/skills/knowledge-manager/` | Knowledge DB, decisions, logs, snippets |
| WordPress | `~/.claude/skills/wordpress/` | WordPress, WP, сайт, studiokook, перевод, translation, TRP, Elementor, SEO, snippets |

## Marketing Skills (`skills/marketing/`)

Источник: [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills)

| Skill | Применение |
|-------|-----------|
| SEO Audit | Аудит studiokook.ee |
| Schema Markup | Product, LocalBusiness, FAQ |
| Programmatic SEO | Лендинги по городам/продуктам |
| Social Content | Instagram/LinkedIn посты |
| Copywriting | Тексты для сайта и рекламы |
| Content Strategy | Контент-план |
| Analytics Tracking | GA4, UTM, события |
| Page CRO | Конверсия страниц |

## MCP Integrations

| MCP | Инструменты |
|-----|-------------|
| **WordPress** | Abilities API (ngg-gallery/query, page management) |
| **n8n** | Workflows CRUD, templates, validation, execution |
| **Playwright** | Browser automation, scraping |

## DAL (Data Access Layer)

```python
from data_access_layer import dal

dal.decisions.add(title=..., decision=..., reasoning=...)
dal.logs.add(summary=..., details=..., project="Studiokook")
dal.snippets.add(name=..., code=..., language="python")
dal.errors.add(title=..., solution=..., lesson=...)
dal.decisions.search("query")
```
