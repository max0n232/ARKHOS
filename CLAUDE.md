# Claude Router

Центральный маршрутизатор. Классифицирует запрос → направляет в проект.

## Projects

| Project | Path | Triggers |
|---------|------|----------|
| Studiokook | ~/Desktop/Studiokook | кухни, WordPress, SEO, studiokook.ee, фирма, SMM |
| Personal | ~/Desktop/Personal | личное, задачи, напоминания |

**Routing:** Получил запрос → определи проект по триггерам → читай `{path}/CLAUDE.md`

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

## Conditional Superpowers (после основных)

Выбор execution path после writing-plans:

| Условие | Skill | Примечание |
|---------|-------|-----------|
| Execution в текущей сессии | `superpowers:subagent-driven-development` | Свежий subagent + review между tasks |
| Execution в отдельной сессии | `superpowers:executing-plans` | Batch execution с checkpoints |
| Завершение development | `superpowers:finishing-a-development-branch` | После всех задач branch |
| Setup workspace | `superpowers:using-git-worktrees` | ДО начала implementation |

## Meta Superpowers (обязательные)

| Skill | Когда | Примечание |
|-------|-------|-----------|
| `superpowers:using-superpowers` | ВСЕГДА первым | 1% chance = MUST invoke |

## Project-Specific Skills

| Project | Skills | Triggers |
|---------|--------|----------|
| Studiokook | `claude-wordpress-skills:wp-performance-review` | "performance", "slow site", "timeout", "500 error", "optimization" |
| Personal | n/a | n/a |

## Additional Skills (Context-based)

Автоматически загружаются при релевантном контексте:

| Category | Location | Triggers |
|----------|----------|----------|
| n8n Expert | `~/.claude/skills/n8n-expert/` | Любой запрос про n8n workflows, MCP tools |
| FAL-AI | `~/.claude/skills/fal-ai/` | Image generation, audio synthesis, AI models |
| External | `~/.claude/skills/external.md` | Telegram bot, webhooks, n8n integration |
| Legal | `~/.claude/skills/legal.md` | Estonian law, OÜ, GDPR, contracts, tax |
| Content Creator | `~/.claude/skills/content-creator.md` | YouTube, Telegram strategy, SEO |
| n8n | `~/.claude/skills/n8n.md` | n8n workflow automation (16+ operations) |
| Assistant | `~/.claude/skills/assistant.md` | Task management, Eisenhower, Pomodoro |
| Knowledge | `~/.claude/skills/knowledge.md` | Knowledge DB, decisions, logs, snippets |

## Constitution

@CONSTITUTION.md

## Defaults

- **Language:** RU primary, EN tech terms
- **Autonomy:** <3 файлов, <200 строк — решай сам
- **Token Budget:** 200k. At 50% STOP
