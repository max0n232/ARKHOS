# Архитектура Claude CLI: Многослойная Система

## Резюме

Создание системной архитектуры с механизмами на каждом слое:
- **Memory** — session + cross-session persistence
- **Security** — PreToolUse валидация, audit logging
- **Quality** — code standards, validation rules
- **Skills** — trigger-based activation, routing

---

## Слой 1: Global Router (`.claude/`)

### 1.1 Memory System

```
.claude/
├── memory/
│   ├── session/
│   │   └── capsule.json        # Session state (task, skills, tokens)
│   └── global/
│       ├── patterns.md         # Cross-project patterns
│       └── troubleshooting.md  # Problem solutions
```

### 1.2 Security System

```
.claude/
├── security/
│   ├── rules.toml              # deny/allow patterns
│   ├── validate-command.js     # PreToolUse hook
│   ├── validate-file-access.js # File access validator
│   ├── audit-log.js            # PostToolUse logger
│   └── audit/                  # Daily JSONL logs
```

**rules.toml** паттерны:
- **deny**: `rm -rf`, credentials access, `.env` files
- **allow**: git, npm, node, python commands
- **passthrough**: ls, dir, pwd

### 1.3 Hooks Config (settings.json)

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Bash",
      "hooks": [{"command": "node .claude/security/validate-command.js"}]
    }],
    "PostToolUse": [{
      "matcher": "*",
      "hooks": [{"command": "node .claude/security/audit-log.js"}]
    }],
    "SessionStart": [{
      "hooks": [{"command": "node .claude/memory/session-init.js"}]
    }]
  }
}
```

### 1.4 Global Skills

```
.claude/
├── skills/
│   ├── REGISTRY.md             # Index
│   ├── assistant/SKILL.md
│   ├── n8n-expert/SKILL.md
│   └── knowledge/SKILL.md
```

---

## Слой 2: Project (Studiokook/)

### 2.1 Memory System

```
Studiokook/
├── .claude/
│   └── session.json            # Project session
├── knowledge/
│   └── knowledge.db            # SQLite (decisions, errors, work_logs)
```

**Расширение схемы:**
```sql
CREATE TABLE session_context (session_id, key, value, created_at);
CREATE TABLE skill_usage (skill_name, used_at, success, notes);
```

### 2.2 Project Security

```
Studiokook/.claude/security.toml
```

```toml
[project]
inherits = "global"

[deny]
php_functions = ["wp_update_post"]  # Crashes site
file_patterns = ["credentials/**"]

[credentials_access]
allowed = ["wp_rest_api", "google_analytics"]
require_confirmation = ["zone_ee"]
```

### 2.3 Skills Organization

```
Studiokook/skills/
├── REGISTRY.md                  # Index
├── _triggers.json               # Activation triggers
├── seo-aeo/                     # SEO optimization
├── marketing/                   # 25+ marketing skills
│   ├── seo-audit/
│   ├── copywriting/
│   └── cro/
└── wp-*/                        # 6 WordPress skills
```

**_triggers.json:**
```json
{
  "seo-audit": {"triggers": ["SEO audit", "ranking"], "priority": 1},
  "wordpress-router": {"triggers": ["WordPress", "plugin"], "routes_to": ["wp-rest-api"]}
}
```

### 2.4 Context Loader

```
Studiokook/.claude/
├── hooks.json                   # Project hooks
├── context-loader.js            # SessionStart: load decisions, check tokens
└── route-skill.js               # UserPromptSubmit: match triggers
```

### 2.5 n8n Workflows

```
Studiokook/n8n/
├── dev/                         # Development
├── prod/                        # Production
└── deploy.json                  # Sync config (pre_deploy: validate, check credentials)
```

---

## Потоки Данных

### Memory Flow
```
SessionStart → capsule.json → session.json → knowledge.db (work_logs)
UserPrompt → route-skill.js → load SKILL.md → update capsule (loaded_skills)
```

### Security Flow
```
PreToolUse → validate-command.js
  → check global rules.toml [deny] → BLOCK
  → check project security.toml [deny] → BLOCK
  → check [allow] → ALLOW
  → default → DENY/PROMPT

PostToolUse → audit-log.js → audit/{date}.jsonl
```

### Token Budget
```json
{"total": 200000, "thresholds": {"notify": 60000, "stop": 100000, "emergency": 140000}}
```

---

## Шаги Имплементации

### Phase 1: Security Foundation
1. Создать `.claude/security/rules.toml` — global deny/allow patterns
2. Создать `.claude/security/validate-command.js` — PreToolUse hook
3. Создать `.claude/security/audit-log.js` — PostToolUse logger
4. Обновить `.claude/settings.json` — добавить hooks

### Phase 2: Memory System
5. Создать `.claude/memory/session/capsule.json` — session state template
6. Создать `.claude/memory/session-init.js` — SessionStart hook
7. Расширить `Studiokook/knowledge/schema.sql` — session_context, skill_usage

### Phase 3: Project Layer
8. Создать `Studiokook/.claude/security.toml` — project overrides
9. Создать `Studiokook/.claude/context-loader.js` — load decisions from DB
10. Создать `Studiokook/.claude/hooks.json` — project hooks

### Phase 4: Skills System
11. Создать `Studiokook/skills/REGISTRY.md` — skills index
12. Создать `Studiokook/skills/_triggers.json` — activation triggers
13. Создать `Studiokook/.claude/route-skill.js` — skill router

### Phase 5: Marketing Skills
14. Установить `marketingskills` plugin или клонировать из GitHub
15. Адаптировать под Studiokook (SEO, CRO, copywriting)

---

## Критические Файлы

| Файл | Назначение |
|------|------------|
| `.claude/settings.json` | Центральная hooks конфигурация |
| `.claude/security/rules.toml` | Global security patterns |
| `Studiokook/.claude/security.toml` | Project security (wp_update_post block) |
| `Studiokook/skills/_triggers.json` | Skill routing |

---

## Проверка

1. **Security**: Выполнить `rm -rf test` — должно заблокироваться
2. **Memory**: Начать сессию — capsule.json должен создаться
3. **Audit**: Выполнить любую команду — проверить audit/{date}.jsonl
4. **Skills**: Написать "SEO audit" — должен активироваться seo-audit skill
5. **Token**: При 50% использования — должно появиться предупреждение

---

---

## Phase 6: File Lifecycle System (РЕАЛИЗОВАНО)

### 6.1 Структура

```
.claude/lifecycle/
├── lifecycle-manager.js    # Core: scan, TTL, LRU, frecency
├── session-cleanup.js      # SessionEnd hook
├── session-scan.js         # SessionStart hook (раз в 24ч)
├── cleanup.js              # CLI команда
├── metadata.json           # File tracking data
└── analyze.ps1             # PowerShell диагностика
```

### 6.2 TTL по категориям

| Категория | TTL | Deletable |
|-----------|-----|-----------|
| temp | 1 день | ✓ |
| debug | 3 дня | ✓ |
| session | 7 дней | ✓ |
| todos | 14 дней | ✓ |
| projects | 30 дней | ✓ |
| user | 90 дней | требует confirm |
| system/plugins | никогда | ✗ |

### 6.3 Hooks

```json
{
  "SessionStart": ["session-init.js", "session-scan.js"],
  "SessionEnd": ["session-cleanup.js"],
  "PreToolUse": ["validate-command.js", "validate-file-access.js"],
  "PostToolUse": ["audit-log.js"]
}
```

---

## Phase 7: Windows Task Scheduler (РЕАЛИЗОВАНО)

### 7.1 Задача

Ежедневный запуск cleanup в 03:00 (или при включении ПК если пропущено).

### 7.2 Реализация

```powershell
# Создать scheduled task
$action = New-ScheduledTaskAction -Execute "node" -Argument "C:\Users\sorte\.claude\lifecycle\cleanup.js --all --force"
$trigger = New-ScheduledTaskTrigger -Daily -At 3am
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable
Register-ScheduledTask -TaskName "ClaudeCleanup" -Action $action -Trigger $trigger -Settings $settings
```

### 7.3 Файлы

```
.claude/lifecycle/
└── setup-scheduler.ps1     # Установка scheduled task
```

---

## Phase 8: Frecency Scoring (РЕАЛИЗОВАНО)

### 8.1 Формула

```javascript
frecency = (recencyScore * 0.6) + (frequencyScore * 0.4)

recencyScore = Math.max(0, 30 - daysSinceAccess) / 30  // 0-1
frequencyScore = Math.min(accessCount, 100) / 100       // 0-1, cap at 100
```

### 8.2 Применение

- **frecency > 0.7**: critical — никогда не удалять
- **frecency 0.4-0.7**: normal — по TTL
- **frecency < 0.4**: low — первые кандидаты на LRU

### 8.3 Обновление metadata.json

```json
{
  "files": {
    "path/to/file": {
      "access_count": 15,
      "last_accessed": "2026-02-09T18:00:00Z",
      "frecency": 0.72,
      "auto_priority": "critical"
    }
  }
}
```

---

## Критические Файлы для Фаз 7-8

| Файл | Фаза | Действие |
|------|------|----------|
| `.claude/lifecycle/setup-scheduler.ps1` | 7 | Создать |
| `.claude/lifecycle/lifecycle-manager.js` | 8 | Добавить frecency calculation |
| `.claude/lifecycle/metadata.json` | 8 | Расширить схему |

---

## Источники

Архитектура основана на исследовании:
- [super-claude-kit](https://github.com/arpitnath/super-claude-kit) — memory persistence
- [everything-claude-code](https://github.com/affaan-m/everything-claude-code) — agents, skills, hooks
- [claude-memory-bank](https://github.com/russbeye/claude-memory-bank) — decisions/patterns/architecture
- [claude-code-permissions-hook](https://github.com/kornysietsma/claude-code-permissions-hook) — granular permissions
- [GitHub Copilot architecture](https://dzone.com/articles/github-copilot-multi-file-context-internal-architecture) — frecency scoring
- [Dropbox ML](https://dropbox.tech/machine-learning/content-suggestions-machine-learning) — file prediction
- [node-lru-files](https://github.com/yetzt/node-lru-files) — LRU file cache

---

## Phase 9: Database Architecture (РЕАЛИЗОВАНО)

### 9.1 Гибридная архитектура

Исследование GitHub (Claude-Flow, AI CLI Memory, Cortex) показало оптимальный вариант — **гибридная архитектура**:

```
.claude/
├── db/
│   ├── global.db       # Shared patterns, skill stats, preferences
│   └── sessions.db     # Session tracking, events, capsules

Studiokook/
├── knowledge/
│   └── memory.db       # Project-specific (decisions, errors, work_logs)
```

### 9.2 Схемы таблиц

**global.db** (3 таблицы):
```sql
-- Паттерны (cross-project)
CREATE TABLE patterns (
    id INTEGER PRIMARY KEY,
    pattern TEXT NOT NULL,
    category TEXT,              -- 'error', 'solution', 'architecture'
    source_project TEXT,        -- откуда пришел
    frecency REAL DEFAULT 0.5,
    access_count INTEGER DEFAULT 0,
    last_accessed TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE VIRTUAL TABLE patterns_fts USING fts5(pattern, category, content='patterns');

-- Статистика skills
CREATE TABLE skill_stats (
    skill_name TEXT PRIMARY KEY,
    total_uses INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    avg_duration_ms INTEGER,
    last_used TEXT,
    frecency REAL DEFAULT 0.5
);

-- Пользовательские настройки
CREATE TABLE preferences (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

**sessions.db** (3 таблицы):
```sql
-- Сессии
CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    project TEXT,
    started_at TEXT,
    ended_at TEXT,
    tokens_used INTEGER,
    skills_loaded TEXT,         -- JSON array
    summary TEXT
);
CREATE VIRTUAL TABLE sessions_fts USING fts5(summary, content='sessions');

-- События (timeline)
CREATE TABLE events (
    id INTEGER PRIMARY KEY,
    session_id TEXT,
    event_type TEXT,            -- 'tool_use', 'skill_load', 'error', 'decision'
    data TEXT,                  -- JSON
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(id)
);

-- Capsules (session state snapshots)
CREATE TABLE capsules (
    session_id TEXT PRIMARY KEY,
    state TEXT,                 -- JSON (current capsule.json content)
    created_at TEXT,
    updated_at TEXT,
    FOREIGN KEY (session_id) REFERENCES sessions(id)
);
```

**memory.db** (7+ таблиц, project-specific):
```sql
-- Decisions (architectural)
CREATE TABLE decisions (
    id INTEGER PRIMARY KEY,
    decision TEXT NOT NULL,
    context TEXT,
    reasoning TEXT,
    status TEXT DEFAULT 'active',
    frecency REAL DEFAULT 0.5,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE VIRTUAL TABLE decisions_fts USING fts5(decision, context, reasoning, content='decisions');

-- Errors и solutions
CREATE TABLE errors (
    id INTEGER PRIMARY KEY,
    error_message TEXT NOT NULL,
    solution TEXT,
    category TEXT,              -- 'php', 'js', 'wordpress', 'n8n'
    times_occurred INTEGER DEFAULT 1,
    last_occurred TEXT,
    frecency REAL DEFAULT 0.5
);
CREATE VIRTUAL TABLE errors_fts USING fts5(error_message, solution, content='errors');

-- Work logs
CREATE TABLE work_logs (
    id INTEGER PRIMARY KEY,
    session_id TEXT,
    description TEXT,
    files_modified TEXT,        -- JSON array
    status TEXT,                -- 'completed', 'in_progress', 'blocked'
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Links (URLs, resources)
CREATE TABLE links (
    id INTEGER PRIMARY KEY,
    url TEXT NOT NULL,
    title TEXT,
    category TEXT,
    notes TEXT,
    access_count INTEGER DEFAULT 0,
    last_accessed TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- SEO data (project-specific)
CREATE TABLE seo_data (
    page_url TEXT PRIMARY KEY,
    title TEXT,
    meta_description TEXT,
    keywords TEXT,              -- JSON array
    last_audit TEXT,
    score REAL
);

-- n8n workflows
CREATE TABLE n8n_workflows (
    workflow_id TEXT PRIMARY KEY,
    name TEXT,
    environment TEXT,           -- 'dev', 'prod'
    status TEXT,
    last_run TEXT,
    error_count INTEGER DEFAULT 0
);

-- Skill usage (project-level)
CREATE TABLE skill_usage (
    id INTEGER PRIMARY KEY,
    skill_name TEXT,
    session_id TEXT,
    success INTEGER,
    notes TEXT,
    used_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### 9.3 Hybrid Search (FTS5 + Frecency)

```javascript
function hybridSearch(query, db, table) {
    // FTS5 search
    const ftsResults = db.prepare(`
        SELECT *, bm25(${table}_fts) as fts_score
        FROM ${table}_fts
        WHERE ${table}_fts MATCH ?
        ORDER BY fts_score
        LIMIT 50
    `).all(query);

    // Combine with frecency
    const combined = ftsResults.map(r => ({
        ...r,
        final_score: (r.fts_score * 0.6) + (r.frecency * 0.4)
    }));

    return combined.sort((a, b) => b.final_score - a.final_score).slice(0, 10);
}
```

### 9.4 Promotion Mechanism (Project → Global)

```javascript
// Если паттерн использован в 2+ проектах — promote to global
function checkPromotion(pattern, sourceProject) {
    const global = require('./global.db');
    const existing = global.prepare(
        'SELECT source_project FROM patterns WHERE pattern = ?'
    ).get(pattern);

    if (existing && existing.source_project !== sourceProject) {
        // Уже есть из другого проекта — promote
        global.prepare(`
            UPDATE patterns SET
                category = 'cross-project',
                access_count = access_count + 1
            WHERE pattern = ?
        `).run(pattern);
    }
}
```

### 9.5 Миграция

Текущее состояние:
- `.claude/knowledge.db` — пустая
- `Studiokook/knowledge.db` — decisions, errors, work_logs, links (частично заполнены)

Шаги миграции:
1. Создать `.claude/db/` директорию
2. Создать `global.db` и `sessions.db` с новыми схемами
3. Переименовать `Studiokook/knowledge.db` → `memory.db`
4. Добавить FTS5 таблицы к существующим
5. Создать `db-manager.js` — unified API

### 9.6 Файлы для создания

| Файл | Назначение |
|------|------------|
| `.claude/db/schema-global.sql` | Схема global.db |
| `.claude/db/schema-sessions.sql` | Схема sessions.db |
| `.claude/db/db-manager.js` | Unified API (connect, search, promote) |
| `.claude/db/migrate.js` | Миграция существующих данных |
| `Studiokook/knowledge/schema-memory.sql` | Расширенная схема memory.db |

### 9.7 Интеграция с Lifecycle

```javascript
// В lifecycle-manager.js — обновлять frecency в БД при recordAccess
recordAccess(relativePath) {
    // ... existing code ...

    // Sync to DB
    const db = require('../db/db-manager');
    db.updateFrecency('files', relativePath, meta.frecency);
}
```

---

## Статус Фаз

| Фаза | Статус |
|------|--------|
| 1-5: Security, Memory, Project, Skills, Marketing | ✓ РЕАЛИЗОВАНО |
| 6: File Lifecycle System | ✓ РЕАЛИЗОВАНО |
| 7: Windows Task Scheduler | ✓ РЕАЛИЗОВАНО |
| 8: Frecency Scoring | ✓ РЕАЛИЗОВАНО |
| 9: Database Architecture | ✓ РЕАЛИЗОВАНО |

---

## Phase 10: Финальные доработки (РЕАЛИЗОВАНО)

### 10.1 Недоработки из-за обрыва связи

1. **lifecycle-manager.js** — отсутствует `syncToDatabase()` метод
   - Нужно добавить интеграцию с db-manager.js
   - Синхронизация frecency при recordAccess()

2. **Тестирование hooks** — не проверено
   - SessionStart hooks
   - SessionEnd hooks
   - PreToolUse/PostToolUse

### 10.2 Шаги

1. Добавить `syncToDatabase()` в lifecycle-manager.js:
```javascript
syncToDatabase(relativePath, meta) {
    try {
        const dbPath = path.join(this.claudeDir, 'db', 'db-manager.js');
        if (fs.existsSync(dbPath)) {
            const { manager } = require(dbPath);
            const sessionId = process.env.CLAUDE_SESSION_ID;
            if (sessionId && manager.initialized) {
                manager.logEvent(sessionId, 'file_access', {
                    path: relativePath,
                    frecency: meta.frecency,
                    category: meta.category
                });
            }
        }
    } catch (e) { /* DB not available */ }
}
```

2. Вызвать `this.syncToDatabase(relativePath, meta)` в конце `recordAccess()`

3. Добавить `db/**` в system категорию (уже сделано)

4. Протестировать полный цикл

---

## Источники для Phase 9

- [Claude-Flow](https://github.com/ruvnet/claude-flow) — 12-table SQLite architecture
- [AI CLI Memory System](https://medium.com/@0niel) — hierarchical memory
- [Cortex](https://github.com/janhq/cortex) — simple + efficient DB
- [FTS5 documentation](https://sqlite.org/fts5.html) — full-text search
