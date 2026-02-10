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

## Project-Specific Skills

| Project | Skills | Triggers |
|---------|--------|----------|
| Studiokook | `claude-wordpress-skills:wp-performance-review` | "performance", "slow site", "timeout", "500 error", "optimization" |
| Personal | n/a | n/a |

## Additional Skills (Context-based)

Автоматически загружаются при релевантном контексте:

| Category | Location | Triggers |
|----------|----------|----------|
| n8n Expert (MCP tools) | `~/.claude/skills/n8n-expert/` | Advanced n8n patterns, MCP tools |
| n8n Workflows | `~/.claude/skills/n8n.md` | n8n workflow automation (16+ operations) |
| FAL-AI | `~/.claude/skills/fal-ai/` | Image generation, audio synthesis, AI models |
| External | `~/.claude/skills/external.md` | Telegram bot, webhooks, n8n integration |
| Legal | `~/.claude/skills/legal.md` | Estonian law, OÜ, GDPR, contracts, tax |
| Content Creator | `~/.claude/skills/content-creator.md` | YouTube, Telegram strategy, SEO |
| Assistant | `~/.claude/skills/assistant.md` | Task management, Eisenhower, Pomodoro |
| Knowledge | `~/.claude/skills/knowledge.md` | Knowledge DB, decisions, logs, snippets |

## Constitution

@CONSTITUTION.md

## Defaults

- **Language:** RU primary, EN tech terms
- **Autonomy:** <3 файлов, <200 строк — решай сам
- **Token Budget:** 200k. At 50% STOP
