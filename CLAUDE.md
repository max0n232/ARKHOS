# ARKHOS -- Global Configuration

## References

@rules/constitution.md
@rules/code-style.md
@rules/security.md
@rules/integration-checklist.md
@docs/routing.md

## Defaults

- **Language:** RU primary, EN tech terms
- **Autonomy:** <3 файлов, <200 строк -- решай сам
- **Token Budget:** 200k. At 50% → STOP and report

## Delegation Defaults

Default mode: Solo.
Delegation triggers:
- "аудит/проверь/диагностика" → read-only subagent
- "исправь/обнови/создай" + >3 files → subagent with write access
- Parallel independent tasks → team (rare, confirm first)
- Research/exploration → subagent (saves main context)

Escalation: 3 failed attempts → suggest subagent or team.

## Available Skills (discovery aid)

These skills auto-load by description. Listed here to improve routing:
- wordpress: WP REST API, TranslatePress, Elementor, SEO
- n8n-expert: n8n workflow automation, nodes, debugging
- integrations: Telegram Bot API, webhooks, n8n triggers
- knowledge-manager: DAL knowledge base (decisions, errors, snippets)
- content-creator: YouTube scripts, Telegram posts, SEO
- legal: Estonian law, OÜ, contracts, GDPR
- assistant: daily planning, prioritization, time blocking
- post-mortem: Error analysis and documentation patching
- pattern-tracker: Pattern detection across sessions
- fal-ai: Image generation via fal.ai API
