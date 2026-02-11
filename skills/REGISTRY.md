# Global Skills Registry

Shared skills available across all projects.

## Available Skills

### Core
| Skill | Path | Description |
|-------|------|-------------|
| assistant | skills/assistant/ | General task management |
| knowledge | skills/knowledge/ | Knowledge DB operations |

### Automation
| Skill | Path | Description |
|-------|------|-------------|
| n8n | skills/n8n.md | n8n MCP tools |
| n8n-expert | skills/n8n-expert/ | Advanced workflow patterns |

### Content
| Skill | Path | Description |
|-------|------|-------------|
| content-creator | skills/content-creator.md | YouTube, Telegram content |

### External
| Skill | Path | Description |
|-------|------|-------------|
| external | skills/external.md | Telegram Bot, webhooks |
| fal-ai | skills/fal-ai/ | AI image generation |

### Compliance
| Skill | Path | Description |
|-------|------|-------------|
| legal | skills/legal.md | Estonian law, GDPR |

## Project Routing

Skills are loaded based on:
1. Project-specific `_triggers.json`
2. Global fallback patterns
3. Explicit user request

## Memory Integration

- Session skills tracked in `capsule.json`
- Usage stats in project `knowledge.db`
- Cross-project patterns in `memory/global/`
