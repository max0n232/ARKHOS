# Global Skills Registry

Shared skills available across all projects.

## Available Skills

### Core
| Skill | Path | Description |
|-------|------|-------------|
| assistant | skills/assistant/ | Personal task management and productivity planning |
| knowledge-manager | skills/knowledge-manager/ | Knowledge DB via DAL |
| pattern-tracker | skills/pattern-tracker/ | Pattern tracking and correction system |
| post-mortem | skills/post-mortem/ | Session error analysis, auto-patching SKILL.md |

### Automation
| Skill | Path | Description |
|-------|------|-------------|
| n8n-expert | skills/n8n-expert/ | Advanced n8n workflow patterns (7 sub-skills) |

### Content
| Skill | Path | Description |
|-------|------|-------------|
| content-creator | skills/content-creator/ | YouTube, Telegram content strategy |

### Integrations
| Skill | Path | Description |
|-------|------|-------------|
| integrations | skills/integrations/ | Telegram Bot API, n8n webhooks, notifications |
| fal-ai | skills/fal-ai/ | AI image/audio generation |

### Compliance
| Skill | Path | Description |
|-------|------|-------------|
| legal | skills/legal/ | Estonian law, OÜ, GDPR, contracts |

### WordPress
| Skill | Path | Description |
|-------|------|-------------|
| wordpress | skills/wordpress/ | studiokook.ee REST API, TranslatePress, Elementor |
| studiokook-knowledge | skills/wordpress/projects/studiokook/KNOWLEDGE.md | Project-specific quirks, patterns, decisions |
| studiokook-infra | skills/wordpress/projects/studiokook/INFRASTRUCTURE.md | Full technical reference (plugins, pages, API) |

## Community Skills

| Skill | Source | Installed |
|-------|--------|-----------|
| supabase-postgres | supabase/agent-skills | 2026-02-13 |
| context-compression | muratcankoylan/Agent-Skills-for-Context-Engineering | 2026-02-13 |
| context-optimization | muratcankoylan/Agent-Skills-for-Context-Engineering | 2026-02-13 |
| multi-agent-patterns | muratcankoylan/Agent-Skills-for-Context-Engineering | 2026-02-13 |
| memory-systems | muratcankoylan/Agent-Skills-for-Context-Engineering | 2026-02-13 |

## Project Routing

Skills are loaded based on:
1. YAML frontmatter `description` field (auto-discovery)
2. Project-specific `_triggers.json`
3. Explicit user request

## Memory Integration

- Session skills tracked in `capsule.json`
- Usage stats in project `knowledge.db`
- Cross-project patterns in `memory/global/`
