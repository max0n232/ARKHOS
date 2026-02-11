# План: Исправление "Амнезии" между сессиями

## Проблема

Claude в новых сессиях "забывает" свои возможности:
- Не помнит какие API/интеграции доступны (WordPress REST, GSC, n8n)
- Делегирует пользователю задачи, которые сам выполнял в прошлой сессии
- MCP tools не отображаются в контексте
- Skills показаны как "25+" вместо конкретного списка

## Root Cause (из исследования)

```
context-loader.js (line 37-47)
└── Возвращает HARDCODED значения:
    decisions: ['Use $wpdb->update()...']  ← Захардкодировано!
    active_skills: ['seo-aeo', 'wp-rest-api']  ← Статично!

ОТСУТСТВУЕТ:
├── Чтение реальных данных из knowledge.db
├── Манифест доступных MCP tools и credentials
├── Конкретный список skills (вместо "25+")
└── Reminder о capabilities при старте сессии
```

## Корневые причины

1. **context-loader.js** не сканирует MCP серверы
2. **Knowledge DB** использует hardcoded placeholder
3. **Skills** перечислены неконкретно ("25+ skills")
4. **Нет capabilities.json** — единого манифеста возможностей

## Решение: Capabilities Manifest

### Архитектура

```
SessionStart
    ↓
session-init.js (глобальный)
    ↓ определяет project
context-loader.js (проект)
    ↓ читает capabilities.json ← НОВЫЙ
    ↓ сканирует MCP servers
    ↓ читает knowledge.db
    ↓ формирует полный контекст
capsule.json (обновлённый)
```

### Файлы для создания/изменения

1. **НОВЫЙ: `Studiokook/.claude/capabilities.json`**
   - Полный список MCP tools с описаниями
   - Все skills с триггерами
   - Credentials с уровнями доступа
   - Endpoints и integrations

2. **ИЗМЕНИТЬ: `Studiokook/.claude/context-loader.js`**
   - Читать capabilities.json
   - Подключаться к knowledge.db через SQLite
   - Формировать конкретный список capabilities

3. **ИЗМЕНИТЬ: `capsule.json` структура**
   - Добавить `mcp_tools: []`
   - Добавить `available_credentials: []`
   - Конкретизировать `loaded_skills: []`

## Детальный план

### Шаг 1: Создать capabilities.json

```json
{
  "version": "1.0",
  "project": "studiokook",

  "mcp_tools": {
    "n8n": {
      "status": "active",
      "server": "local:5678",
      "tools": [
        "mcp__n8n-mcp__search_nodes",
        "mcp__n8n-mcp__get_node",
        "mcp__n8n-mcp__validate_workflow",
        "mcp__n8n-mcp__n8n_create_workflow",
        "mcp__n8n-mcp__n8n_get_workflow",
        "mcp__n8n-mcp__n8n_list_workflows",
        "mcp__n8n-mcp__n8n_test_workflow",
        "mcp__n8n-mcp__n8n_executions"
      ],
      "use_for": "Автоматизация, workflows, интеграции"
    },
    "gsc": {
      "status": "active",
      "property": "sc-domain:studiokook.ee",
      "tools": [
        "mcp__gsc__get_search_analytics",
        "mcp__gsc__get_performance_overview",
        "mcp__gsc__inspect_url_enhanced",
        "mcp__gsc__get_sitemaps"
      ],
      "use_for": "SEO анализ, индексация, поисковые запросы"
    },
    "wordpress": {
      "status": "active",
      "site": "studiokook.ee",
      "method": "REST API + Abilities",
      "endpoints": [
        "/wp-json/wp/v2/pages",
        "/wp-json/wp/v2/posts",
        "/wp-json/ngg/v1/abilities"
      ],
      "use_for": "Контент, галереи, настройки сайта"
    }
  },

  "skills": {
    "seo": ["seo-aeo", "seo-smm"],
    "wordpress": [
      "wp-rest-api",
      "wp-performance",
      "wp-abilities-api",
      "wp-wpcli-and-ops",
      "wp-problem-solver"
    ],
    "marketing": [
      "copywriting",
      "schema-markup",
      "analytics-tracking",
      "a-b-test-setup",
      "page-cro"
    ],
    "n8n": ["n8n-expert", "n8n-workflow-patterns"]
  },

  "credentials": {
    "auto_available": ["wp_rest_api", "google_analytics"],
    "require_confirmation": ["zone_ee", "supabase"]
  },

  "quick_actions": {
    "seo_audit": "Используй GSC MCP для анализа",
    "create_workflow": "Используй n8n MCP",
    "edit_page": "Используй WordPress REST API"
  }
}
```

### Шаг 2: Обновить context-loader.js

```javascript
// Добавить:
function loadCapabilities() {
    const capPath = path.join(STUDIOKOOK_DIR, '.claude', 'capabilities.json');
    if (fs.existsSync(capPath)) {
        return JSON.parse(fs.readFileSync(capPath, 'utf-8'));
    }
    return null;
}

// В main():
const capabilities = loadCapabilities();
if (capabilities) {
    output.mcp_tools = capabilities.mcp_tools;
    output.all_skills = capabilities.skills;
    output.credentials = capabilities.credentials;
    output.quick_actions = capabilities.quick_actions;
}
```

### Шаг 3: Подключить Knowledge DB

```javascript
// Использовать better-sqlite3 (уже есть в ~/.claude/db/)
const Database = require('better-sqlite3');

function readKnowledgeDB() {
    const dbPath = path.join(STUDIOKOOK_DIR, 'knowledge', 'memory.db');
    if (!fs.existsSync(dbPath)) return { decisions: [], errors: [] };

    const db = new Database(dbPath, { readonly: true });
    const decisions = db.prepare(`
        SELECT content, context FROM memory
        WHERE type = 'decision'
        ORDER BY created_at DESC LIMIT 10
    `).all();
    db.close();

    return { decisions };
}
```

### Шаг 4: Обновить вывод контекста

Финальный output context-loader.js:

```
╔══════════════════════════════════════════════════════════════╗
║  STUDIOKOOK CONTEXT LOADED                                   ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  MCP TOOLS AVAILABLE:                                        ║
║  • n8n: 8 tools (workflows, nodes, validation)              ║
║  • GSC: 4 tools (analytics, indexing, sitemaps)             ║
║  • WordPress: REST API + Abilities                          ║
║                                                              ║
║  SKILLS: 15 loaded (seo, wp, marketing, n8n)                ║
║                                                              ║
║  CREDENTIALS: wp_rest_api, google_analytics (auto)          ║
║               zone_ee, supabase (confirmation required)      ║
║                                                              ║
║  RECENT DECISIONS: 3 loaded from knowledge.db               ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

## Верификация

1. Запустить новую сессию Claude в Studiokook
2. Спросить "Какие MCP tools у тебя есть?"
3. Спросить "Можешь ли ты создать n8n workflow?"
4. Спросить "Какие credentials доступны?"

Claude должен ответить конкретно, не делегируя пользователю.

## Критические файлы

| Файл | Действие | Строк |
|------|----------|-------|
| `Studiokook/.claude/capabilities.json` | СОЗДАТЬ | ~130 |
| `Studiokook/.claude/context-loader.js` | ИЗМЕНИТЬ | ~40 изменений |

## Не в scope

- SQLite коннектор к knowledge.db (требует npm install better-sqlite3)
- SessionEnd hook (отсутствует в Claude Code)
- Полноценная персистентная БД сессий

## Быстрая проверка после реализации

```bash
# 1. Открыть новую сессию в Studiokook
# 2. Спросить:
"Какие MCP tools у тебя доступны?"
"Можешь создать n8n workflow?"
"У тебя есть доступ к WordPress REST API?"

# Ожидаемый результат: конкретные ответы, без делегирования
```
