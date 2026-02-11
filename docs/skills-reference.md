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
| n8n Workflows | `~/.claude/skills/n8n.md` | n8n workflow automation (16+ operations) |
| FAL-AI | `~/.claude/skills/fal-ai/` | Image generation, audio synthesis, AI models |
| External | `~/.claude/skills/external.md` | Telegram bot, webhooks, n8n integration |
| Legal | `~/.claude/skills/legal.md` | Estonian law, OÜ, GDPR, contracts, tax |
| Content Creator | `~/.claude/skills/content-creator.md` | YouTube, Telegram strategy, SEO |
| Assistant | `~/.claude/skills/assistant.md` | Task management, Eisenhower, Pomodoro |
| Knowledge | `~/.claude/skills/knowledge.md` | Knowledge DB, decisions, logs, snippets |
