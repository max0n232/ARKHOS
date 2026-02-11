# План: Динамическая архитектура вместо жёсткого capabilities.json

## Проблема

Текущий `capabilities.json` имеет жёстко прописанные списки:
- MCP tools — при добавлении/удалении нужно вручную обновлять
- Skills — то же самое
- Нет автоматического обнаружения

**Это противоречит принципам Claude Code:**
- Claude Code уже имеет встроенный Tool Search для MCP (автоматически)
- Skills обнаруживаются автоматически из `.claude/skills/`
- Жёсткие списки создают tech debt

## Исследование: Как это работает в Claude Code

### MCP Tools — АВТОМАТИЧЕСКИ

По данным [Anthropic](https://www.atcyrus.com/stories/mcp-tool-search-claude-code-context-pollution-guide):
- Claude Code автоматически сканирует MCP servers из `.mcp.json`
- Если tools > 10K tokens — включается lazy loading
- `/mcp` команда показывает доступные серверы
- **НЕ НУЖЕН capabilities.json для MCP**

### Skills — АВТОМАТИЧЕСКИ

По данным [официальной документации](https://code.claude.com/docs/en/skills):
- Skills обнаруживаются из `.claude/skills/` автоматически
- Иерархия: enterprise > personal > project
- Nested discovery из поддиректорий
- Description в frontmatter определяет когда использовать
- **НЕ НУЖЕН capabilities.json для skills**

### Что НУЖНО в родительской архитектуре

По данным [Claude Code Best Practices](https://www.builder.io/blog/claude-md-guide) и [GitHub Showcase](https://github.com/ChrisWiles/claude-code-showcase):

```
~/.claude/                          ← ГЛОБАЛЬНЫЙ УРОВЕНЬ
├── CLAUDE.md                       ← Общие правила поведения
├── settings.json                   ← Hooks, permissions
├── mcp.json                        ← MCP серверы (auto-discovery)
├── skills/                         ← Глобальные skills (auto-discovery)
└── rules/                          ← Правила безопасности

project/.claude/                    ← ПРОЕКТНЫЙ УРОВЕНЬ
├── settings.json                   ← Project-specific hooks
├── skills/                         ← Project skills (auto-discovery)
└── agents/                         ← Custom agents
```

## Решение: Минималистичная динамическая архитектура

### Принцип

**НЕ дублировать то, что Claude Code делает сам:**
- MCP tools → `/mcp` или автоматический Tool Search
- Skills → автоматическое обнаружение из папок
- Credentials → сканировать `credentials/` папку

**ЧТО должно быть в CLAUDE.md:**
- Общие правила поведения
- Критические ограничения (forbidden functions)
- Ссылки на ключевые навигационные точки
- Стиль работы

### Что удалить

1. **capabilities.json** — полностью удалить (дублирует встроенные механизмы)
2. **Жёсткие списки в context-loader.js** — заменить на динамическое сканирование

### Что создать/изменить

1. **context-loader.js v3** — динамический сканер:
   ```javascript
   // Сканировать .claude/skills/ для подсчёта
   // Сканировать credentials/ для списка
   // НЕ дублировать MCP — это делает Claude сам
   ```

2. **~/.claude/CLAUDE.md** — минимальный роутер:
   ```markdown
   # Claude Router
   - Определи проект по cwd
   - Читай {project}/CLAUDE.md
   - Используй /mcp для MCP tools
   - Skills загружаются автоматически
   ```

3. **Project CLAUDE.md** — проектные правила:
   ```markdown
   # Studiokook
   ## Critical Rules (не дублировать, только критичное)
   ## Credentials (где искать, не список)
   ## Skills (где искать, не список)
   ```

## Сравнение: Было vs Станет

| Аспект | Было (capabilities.json) | Станет (динамически) |
|--------|-------------------------|---------------------|
| MCP tools | 20+ items hardcoded | Автоматически через /mcp |
| Skills | 36 items hardcoded | Scan .claude/skills/ |
| Credentials | Список в JSON | Scan credentials/ |
| Обновление | Вручную при изменениях | Автоматически |
| CLAUDE.md | 71 строка | ~50 строк (меньше) |

## Файлы для изменения

### Удалить:
- `Studiokook/.claude/capabilities.json`

### Изменить:
- `Studiokook/.claude/context-loader.js` — динамический сканер
- `~/.claude/CLAUDE.md` — убрать лишнее, оставить роутинг

### Структура context-loader.js v3:

```javascript
function scanSkills() {
    // Glob .claude/skills/*/SKILL.md
    // Вернуть count и categories
}

function scanCredentials() {
    // Glob credentials/*.json
    // Вернуть names (не содержимое!)
}

function getProjectRules() {
    // Читать CLAUDE.md → извлечь критичные правила
}

// Output: динамический summary
// НЕ включать MCP — Claude видит их через /mcp
```

## Критерии успеха

1. При добавлении нового MCP server — работает автоматически
2. При добавлении нового skill — работает автоматически
3. При добавлении credentials — появляется в списке автоматически
4. CLAUDE.md остаётся компактным (< 100 строк)
5. Нет дублирования информации

## Риски

- **Claude может не знать о специфике проекта** — решается через CLAUDE.md с критичными правилами
- **Не все MCP tools видны сразу** — это by design (lazy loading экономит контекст)

## Источники

- [Claude Code Skills Documentation](https://code.claude.com/docs/en/skills)
- [MCP Tool Search](https://www.atcyrus.com/stories/mcp-tool-search-claude-code-context-pollution-guide)
- [Claude Code Best Practices](https://www.builder.io/blog/claude-md-guide)
- [claude-code-showcase](https://github.com/ChrisWiles/claude-code-showcase)
- [MCP Configuration Guide](https://deepwiki.com/FlorianBruniaux/claude-code-ultimate-guide/6.8-mcp-configuration-and-debugging)
