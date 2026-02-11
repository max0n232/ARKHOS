# Полноценная Enterprise-Grade Архитектура Claude Code

## Исследование: Best Practices из индустрии

### Источники
- [Claude Code Official Docs - Subagents](https://code.claude.com/docs/en/sub-agents)
- [Claude Code Official Docs - Skills](https://code.claude.com/docs/en/skills)
- [Claude Code Official Docs - Hooks](https://code.claude.com/docs/en/hooks)
- [Claude-Flow - 12.9k stars](https://github.com/ruvnet/claude-flow)
- [Claude Code Showcase](https://github.com/ChrisWiles/claude-code-showcase)
- [VoltAgent Awesome Subagents](https://github.com/VoltAgent/awesome-claude-code-subagents)

### Ключевые принципы Enterprise-архитектуры

1. **Иерархия конфигурации** (от высшего к низшему приоритету):
   - Enterprise managed-settings.json (не переопределяется)
   - CLI flags (--agent, --allowedTools)
   - Project .claude/settings.json
   - User ~/.claude/settings.json

2. **Orchestrator-Worker Pattern**: один координатор, специализированные исполнители
3. **Lazy Loading**: MCP tools загружаются по требованию (>10K tokens)
4. **Skills vs Subagents**: Skills для знаний, Subagents для изолированных задач
5. **Hooks для lifecycle**: PreToolUse, PostToolUse, SessionStart, Stop

---

## Предлагаемая архитектура

### Уровень 1: Глобальный (User-Level) — ~/.claude/

```
~/.claude/
├── CLAUDE.md                     # Минимальный роутер (< 50 строк)
├── settings.json                 # Глобальные hooks, permissions
├── projects.json                 # Карта проектов → paths
│
├── agents/                       # User-level subagents (все проекты)
│   ├── code-reviewer.md          # Proactive code review
│   ├── debugger.md               # Debugging specialist
│   └── researcher.md             # Codebase exploration
│
├── skills/                       # User-level skills (все проекты)
│   ├── assistant.md
│   ├── n8n-expert/
│   │   ├── SKILL.md
│   │   └── references/
│   ├── content-creator.md
│   └── legal.md
│
├── rules/                        # Security rules (все проекты)
│   ├── security.md               # OWASP guidelines
│   └── code-style.md             # Global conventions
│
├── hooks/                        # Hook scripts
│   ├── session-init.js           # SessionStart handler
│   ├── validate-command.js       # PreToolUse Bash validation
│   └── audit-log.js              # PostToolUse logging
│
├── memory/                       # Cross-session state
│   └── session/
│       └── capsule.json          # Current session state
│
├── lifecycle/                    # File lifecycle management
│   ├── lifecycle-manager.js
│   └── metadata.json
│
├── db/                           # SQLite databases
│   ├── global.db                 # Patterns, skill stats
│   ├── sessions.db               # Session tracking
│   └── db-manager.js             # Unified DB API
│
├── plans/                        # Active plans
│   └── archive/                  # Completed plans (90 days TTL)
│
└── mcp-servers/                  # MCP server configs
    └── gsc/                      # Google Search Console
```

### Уровень 2: Проектный — project/.claude/

```
project/.claude/
├── settings.json                 # Project hooks, permissions
├── settings.local.json           # Personal overrides (gitignored)
│
├── agents/                       # Project subagents
│   ├── wp-specialist.md          # WordPress domain expert
│   ├── seo-auditor.md            # SEO analysis
│   └── deployment.md             # Deploy orchestrator
│
├── hooks/                        # Project hook scripts
│   ├── context-loader.js         # SessionStart: load context
│   ├── validate-wp.js            # PreToolUse: WP safety
│   └── route-skill.js            # UserPromptSubmit: skill routing
│
├── agent-memory/                 # Persistent agent memory
│   ├── wp-specialist/
│   │   └── MEMORY.md             # Accumulated knowledge
│   └── seo-auditor/
│       └── MEMORY.md
│
└── agent-memory-local/           # Local-only memory (gitignored)
```

### Уровень 3: Skills — project/skills/

```
project/skills/
├── _triggers.json                # Skill routing rules
│
├── wordpress/                    # Domain skills
│   ├── wp-rest-api/
│   │   ├── SKILL.md              # < 500 lines
│   │   └── references/           # Detailed docs
│   ├── wp-performance/
│   ├── wp-problem-solver/
│   └── ...
│
├── seo/
│   ├── seo-aeo/
│   └── seo-smm.md                # Single-file skill
│
├── marketing/                    # Skill collection
│   └── skills/
│       ├── copywriting/
│       ├── schema-markup/
│       └── ...
│
└── n8n/                          # Workflow automation
    └── workflow-patterns/
```

---

## Компоненты и их роли

### 1. CLAUDE.md — Минимальный роутер

**Глобальный (~/.claude/CLAUDE.md):**
```markdown
# Claude Router

## Routing
1. Определи проект по cwd → читай projects.json
2. Загрузи {project}/CLAUDE.md
3. MCP tools: /mcp (auto-discovery)
4. Skills: auto-discovered из папок

## Defaults
- Language: RU primary, EN tech terms
- Autonomy: <3 файлов, <200 строк — решай сам
- Token Budget: 200k (30% notify, 50% STOP, 70% EMERGENCY)
```

**Проектный (project/CLAUDE.md) — Полная спецификация:**

Проектный CLAUDE.md должен содержать:
1. **Header** — название, краткое описание, домен
2. **Structure** — карта проекта (папки, ключевые файлы)
3. **Credentials** — список доступных credentials (имена, не содержимое)
4. **Integrations** — краткие примеры использования внешних API
5. **Critical Rules** — правила которые НЕЛЬЗЯ нарушать (5-7 максимум)
6. **Quick Actions** — ссылки на часто используемые skills
7. **Context** — специфичная для проекта информация (языки, статусы)

**Пример для Studiokook (целевой формат, ~80 строк):**
```markdown
# Studiokook

Кухонный бизнес, Tallinn, Estonia. WordPress: studiokook.ee

## Structure

```
Studiokook/
├── CLAUDE.md               ← Этот файл
├── credentials/            ← API ключи (НЕ в git)
├── n8n/                    ← Workflows (dev → prod)
└── skills/                 ← Project skills (wp-*, seo-*, marketing/)
```

## Credentials

Файлы в `credentials/` (reference only, never expose):
- wp_rest_api.json — WordPress REST API
- google_credentials.json — OAuth
- supabase.json — Supabase API
- n8n_webhooks.json — VPS webhooks

## Integrations

**WordPress REST:** `curl -u "admin:APP_PASSWORD" "studiokook.ee/wp-json/wp/v2/..."`
**GSC:** `sc-domain:studiokook.ee`
**GA4:** `properties/441276059`

## Critical Rules

1. **WordPress PHP:** MUST use `/wp-problem-solver` before ANY code changes
2. **NEVER** wp_update_post() — crashes site. Use $wpdb->update()
3. **TranslatePress:** Use `skills/wp-translatepress/SKILL.md`
4. **Credentials:** Reference by name only, never hardcode values
5. **Code Snippets plugin:** For all PHP (schemas, hreflang)

## Quick Actions

| Action | Skill |
|--------|-------|
| WP code changes | /wp-problem-solver |
| SEO audit | /seo-audit |
| Performance check | /wp-performance |
| Deploy n8n | /deploy |

## Languages (site)

| Lang | URL | Status |
|------|-----|--------|
| ET | studiokook.ee | Primary |
| RU | /ru/ | Needs SEO audit |
| EN | /en/ | ✅ Fixed 2026-02-10 |
| FI | /fi/ | ✅ Fixed 2026-02-10 |

## n8n Flow

1. Generate → `n8n/dev/`
2. Test locally
3. Copy to `n8n/prod/`
4. Deploy to VPS

## Style

RU primary, EN tech terms. Concise. No TODOs in code.
```

**Ключевые принципы проектного CLAUDE.md:**
- Размер: 60-100 строк (не больше)
- Детали в skills, не здесь
- Critical Rules — только то, что может сломать систему
- Quick Actions — ссылки, не инструкции
- Динамический контент (статусы) обновляется вручную

### Иерархия CLAUDE.md файлов

```
~/.claude/CLAUDE.md (Global)          project/CLAUDE.md (Project)
┌─────────────────────────┐           ┌─────────────────────────┐
│ • Routing logic         │           │ • Project identity      │
│ • Default behaviors     │  ──────►  │ • Structure map         │
│ • Token budget          │  extends  │ • Credentials list      │
│ • Language preferences  │           │ • Critical rules        │
│ • Discovery info        │           │ • Quick actions         │
└─────────────────────────┘           │ • Project context       │
     ~50 lines                        └─────────────────────────┘
                                           ~80 lines
```

**Что НЕ дублировать:**
- Language/style — наследуется от global
- Token budget — наследуется от global
- Общие правила безопасности — в `~/.claude/rules/`

**Что ОБЯЗАТЕЛЬНО в project:**
- Critical Rules специфичные для проекта
- Credentials list (имена файлов)
- Structure map
- Quick Actions (ссылки на skills)

### 2. Agents — Изолированные специалисты

**Структура agent файла:**
```yaml
---
name: wp-specialist
description: WordPress domain expert. Use for WP-related tasks.
tools: Read, Grep, Glob, Bash, Edit
model: sonnet
permissionMode: acceptEdits
memory: project  # Persistent memory
skills:
  - wp-rest-api
  - wp-performance
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "$CLAUDE_PROJECT_DIR/.claude/hooks/validate-wp.js"
---

You are a WordPress specialist for studiokook.ee.

## Your capabilities
- REST API operations
- Performance optimization
- Theme/plugin analysis

## Your memory
Check your agent memory before starting. Update it with patterns you discover.

## Constraints
- Never use wp_update_post()
- Always verify changes in staging first
```

### 3. Skills — Модульные знания

**SKILL.md формат:**
```yaml
---
name: wp-problem-solver
description: MANDATORY before any WordPress PHP changes.
             Enforces root cause analysis (5 Whys).
disable-model-invocation: false  # Claude can invoke
user-invocable: true             # User can invoke via /
---

# WP Problem Solver

## When to use
MUST invoke before:
- Creating PHP snippets
- Adding hooks (add_action, add_filter)
- Modifying existing code

## Procedure
1. 5 Whys Analysis (see references/five-whys.md)
2. Check existing snippets
3. Propose, don't apply
4. Update registry after creation

## References
- [5 Whys Methodology](references/five-whys.md)
- [Solution Types](references/solution-types.md)
```

### 4. Hooks — Lifecycle автоматизация

**settings.json структура:**
```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup|resume",
        "hooks": [
          {
            "type": "command",
            "command": "node \"$CLAUDE_PROJECT_DIR/.claude/hooks/context-loader.js\"",
            "timeout": 5000,
            "statusMessage": "Loading context..."
          }
        ]
      }
    ],
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node \"$CLAUDE_PROJECT_DIR/.claude/hooks/route-skill.js\"",
            "timeout": 3000
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "node \"$CLAUDE_PROJECT_DIR/.claude/hooks/validate-wp.js\"",
            "timeout": 5000
          }
        ]
      },
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "node ~/.claude/hooks/validate-command.js"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "node \"$CLAUDE_PROJECT_DIR/.claude/hooks/run-linter.js\"",
            "async": true,
            "timeout": 30
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "prompt",
            "prompt": "Check if all tasks are complete: $ARGUMENTS",
            "timeout": 30
          }
        ]
      }
    ],
    "SubagentStart": [
      {
        "matcher": "wp-specialist",
        "hooks": [
          {
            "type": "command",
            "command": "echo 'WP specialist started' >> ~/.claude/logs/agents.log"
          }
        ]
      }
    ],
    "PreCompact": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node ~/.claude/hooks/save-state.js"
          }
        ]
      }
    ]
  },

  "permissions": {
    "allow": [
      "Read",
      "Glob",
      "Grep",
      "Bash(npm *)",
      "Bash(node *)",
      "Bash(git *)"
    ],
    "deny": [
      "Bash(rm -rf *)",
      "Bash(sudo *)",
      "Task(deployment)"  # Require explicit invocation
    ]
  }
}
```

### 5. MCP — External integrations

**Автоматическое обнаружение:**
- Claude Code автоматически сканирует MCP серверы
- Lazy loading при >10K tokens
- `/mcp` показывает доступные серверы

**Конфигурация (.mcp.json):**
```json
{
  "mcpServers": {
    "n8n": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@n8n/mcp-server"],
      "env": {
        "N8N_HOST": "${N8N_HOST}",
        "N8N_API_KEY": "${N8N_API_KEY}"
      }
    },
    "gsc": {
      "type": "stdio",
      "command": "python",
      "args": ["~/.claude/mcp-servers/gsc/server.py"]
    }
  }
}
```

### 6. Memory — Persistent state

**Agent Memory (project scope):**
```
project/.claude/agent-memory/
├── wp-specialist/
│   └── MEMORY.md     # Накопленные паттерны
└── seo-auditor/
    └── MEMORY.md     # Найденные проблемы
```

**Session Capsule (cross-session):**
```json
{
  "session_id": "abc123",
  "project": "studiokook",
  "started_at": "2026-02-10T10:00:00Z",
  "context": {
    "mcp_tools": ["n8n", "gsc"],
    "loaded_skills": ["wp-rest-api", "seo-aeo"],
    "current_task": "SEO audit"
  },
  "token_budget": {
    "total": 200000,
    "used": 45000
  }
}
```

### 7. Database — Structured knowledge

**global.db (user-level):**
- patterns: Общие паттерны кода
- skill_stats: Использование skills
- preferences: Пользовательские настройки

**sessions.db (cross-project):**
- sessions: История сессий
- events: Важные события
- capsules: Состояния сессий

**memory.db (project-level):**
- decisions: Принятые решения
- errors: Ошибки и уроки
- context: Контекстные данные

---

## Dependency Management

### Зависимости между компонентами

```
┌─────────────────────────────────────────────────────────────┐
│                     CLAUDE CODE CORE                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   MCP Tools  │◄───│   Hooks      │───►│   Agents     │  │
│  │  (auto-disc) │    │ (lifecycle)  │    │ (isolated)   │  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘  │
│         │                   │                   │          │
│         ▼                   ▼                   ▼          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                     SKILLS                            │  │
│  │   (on-demand loading, description in context)         │  │
│  └──────────────────────────────────────────────────────┘  │
│                            │                               │
│                            ▼                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                   MEMORY LAYER                        │  │
│  │   SQLite DBs │ Agent Memory │ Session Capsule         │  │
│  └──────────────────────────────────────────────────────┘  │
│                            │                               │
│                            ▼                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                  CLAUDE.md + Rules                    │  │
│  │   (minimal, критичные правила only)                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Правила зависимостей

1. **MCP Tools** → независимы, auto-discovery
2. **Hooks** → могут вызывать scripts, обновлять DB
3. **Agents** → могут загружать Skills, имеют persistent memory
4. **Skills** → загружаются on-demand, references отдельно
5. **Memory** → доступна всем через db-manager.js
6. **CLAUDE.md** → только критичные правила, < 100 строк

### При добавлении нового компонента

**Новый MCP Server:**
1. Добавить в `.mcp.json`
2. Claude автоматически обнаружит при старте
3. Ничего не ломается

**Новый Skill:**
1. Создать `skills/new-skill/SKILL.md`
2. Claude автоматически обнаружит
3. Добавить в `_triggers.json` если нужен routing

**Новый Agent:**
1. Создать `.claude/agents/new-agent.md`
2. Определить tools, skills, memory scope
3. Claude автоматически обнаружит

**Новый Hook:**
1. Добавить в `settings.json`
2. Создать script в `.claude/hooks/`
3. Restart session для применения

---

## Security Layer

### Уровни защиты

1. **Permissions в settings.json:**
   ```json
   {
     "permissions": {
       "deny": ["Bash(rm -rf *)", "Bash(sudo *)"],
       "allow": ["Bash(npm *)", "Bash(git *)"]
     }
   }
   ```

2. **PreToolUse hooks:**
   - Валидация команд
   - Блокировка опасных операций
   - Проверка путей (path traversal)

3. **Agent tool restrictions:**
   ```yaml
   tools: Read, Grep, Glob  # Read-only agent
   disallowedTools: Write, Edit, Bash
   ```

4. **Credential isolation:**
   - Credentials только в `credentials/`
   - Reference по имени, не содержимое
   - PreToolUse блокирует hardcoded secrets

---

## Реализация: Что нужно создать/изменить

### Фаза 1: Реструктуризация ~/.claude/

1. [ ] Создать `~/.claude/agents/` с базовыми agents
2. [ ] Создать `~/.claude/rules/` с security.md
3. [ ] Обновить `~/.claude/settings.json` с полным hooks config
4. [ ] Переместить hook scripts в `~/.claude/hooks/`

### Фаза 2: Проектный уровень Studiokook

1. [ ] Создать `.claude/agents/` с wp-specialist, seo-auditor
2. [ ] Создать `.claude/agent-memory/` структуру
3. [ ] Обновить `.claude/settings.json` с project hooks
4. [ ] Добавить `skills/_triggers.json` для routing

### Фаза 3: Skills модернизация

1. [ ] Проверить все SKILL.md < 500 строк
2. [ ] Вынести детали в references/
3. [ ] Добавить правильный frontmatter
4. [ ] Связать skills с agents

### Фаза 4: Memory интеграция

1. [ ] Настроить agent memory scopes
2. [ ] Интегрировать db-manager в hooks
3. [ ] Добавить PreCompact hook для сохранения состояния

---

## Верификация архитектуры

### Чек-лист

- [ ] Новый MCP server добавляется без изменения кода
- [ ] Новый skill обнаруживается автоматически
- [ ] Новый agent работает с persistent memory
- [ ] Hooks корректно блокируют опасные операции
- [ ] CLAUDE.md < 100 строк
- [ ] При старте сессии Claude знает свои capabilities
- [ ] Cross-session state сохраняется в capsule.json
- [ ] Agents используют свои накопленные знания

### Тесты

1. Запустить новую сессию → проверить что context загружен
2. Спросить "Какие MCP tools доступны?" → должен ответить
3. Попробовать `rm -rf` → должен заблокировать
4. Использовать wp-specialist → должен помнить предыдущие сессии
