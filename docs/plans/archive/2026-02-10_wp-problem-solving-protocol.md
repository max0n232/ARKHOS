# План: Механизм предотвращения костылей в WordPress

## Проблема

Claude Code при решении проблем WordPress:
1. **Не анализирует корневую причину** — сразу лепит код-снипеты
2. **Не проверяет существующие решения** — добавляет дубликаты поверх
3. **Не убирает за собой** — оставляет временные снипеты в "Активном" статусе
4. **Накапливает технический долг** — сайт обрастает костылями

## Исследование

### Источники решений:

1. **[GitHub Blog: Reliable AI Workflows](https://github.blog/ai-and-ml/github-copilot/how-to-build-reliable-ai-workflows-with-agentic-primitives-and-context-engineering/)** — "Find root cause, think 3 solutions with trade-offs, seek validation BEFORE changing files"

2. **[Agentic Coding Handbook: Debug Workflow](https://tweag.github.io/agentic-coding-handbook/WORKFLOW_DEBUG/)** — "Use reasoning-first prompts: List 5-7 possible causes BEFORE code changes"

3. **[5 Whys for AI](https://www.skan.ai/blogs/ai-root-cause-analysis-applying-the-5-whys-to-digital-operations)** — "Ask WHY 5 times to drill past symptoms to root causes"

4. **[Claude Code Hooks](https://dev.to/lukaszfryc/claude-code-hooks-complete-guide-with-20-ready-to-use-examples-2026-dcg)** — "PreToolUse hooks can block operations, exit code 2 sends error to Claude"

5. **[WordPress Agent Skills](https://github.com/elvismdev/claude-wordpress-skills)** — "Professional WordPress engineering skills for Claude Code"

## Решение: 3-уровневая защита

### Уровень 1: CLAUDE.md правила (Soft enforcement)

Добавить в `Studiokook/CLAUDE.md`:

```markdown
## WordPress Problem-Solving Protocol

### ОБЯЗАТЕЛЬНО перед любым изменением кода:

1. **5 WHYS Analysis** — Задай 5 вопросов "Почему?" чтобы найти корень
2. **Check Existing** — Проверь существующие снипеты в Code Snippets
3. **Propose, Don't Apply** — Предложи решение, дождись одобрения
4. **Root Cause First** — Исправляй причину, не симптом
5. **Cleanup After** — Удали/деактивируй временные решения

### ЗАПРЕЩЕНО:

- Создавать снипет без проверки существующих
- Оставлять "временные" решения активными
- Применять fix без анализа причины
- Добавлять код поверх существующего без понимания
```

### Уровень 2: PreToolUse Hook (Hard enforcement)

`Studiokook/.claude/validate-wordpress-changes.js`:

```javascript
// Блокирует создание PHP-кода без:
// 1. Предварительного анализа (5 whys в контексте)
// 2. Проверки существующих снипетов
// 3. Явного одобрения пользователя

// Exit code 2 → Claude получает сообщение и объясняет
```

### Уровень 3: Snippet Registry (State tracking)

`Studiokook/knowledge/snippets-registry.json`:

```json
{
  "snippets": [
    {
      "id": "seo-hreflang-fix",
      "file": "11-hreflang-fix.php",
      "status": "active|temporary|deprecated",
      "purpose": "Fix hreflang for multilingual",
      "root_cause": "WPML не генерирует корректные теги",
      "created": "2026-02-01",
      "cleanup_after": "2026-03-01",
      "dependencies": []
    }
  ]
}
```

## Workflow при проблеме

```
1. Проблема обнаружена
   ↓
2. [HOOK] Проверка: есть ли 5 Whys анализ?
   ↓ НЕТ → BLOCK, запросить анализ
   ↓ ДА
3. [HOOK] Проверка: проверены ли существующие снипеты?
   ↓ НЕТ → BLOCK, показать список
   ↓ ДА
4. [HOOK] Проверка: есть ли одобрение пользователя?
   ↓ НЕТ → BLOCK, запросить
   ↓ ДА
5. Применить изменение
   ↓
6. Записать в registry
   ↓
7. Установить cleanup_after если временное
```

## Файлы для создания

| Файл | Назначение |
|------|------------|
| `Studiokook/CLAUDE.md` | Обновить с Protocol |
| `Studiokook/.claude/validate-wp-changes.js` | PreToolUse hook |
| `Studiokook/.claude/check-snippets.js` | Проверка существующих |
| `Studiokook/knowledge/snippets-registry.json` | Реестр снипетов |
| `Studiokook/.claude/snippets-manager.js` | CRUD для реестра |

## Интеграция с существующей архитектурой

```
.claude/security/validate-command.js  ← Global rules
    ↓ inherits
Studiokook/.claude/validate-wp-changes.js  ← WordPress-specific
    ↓ uses
Studiokook/knowledge/snippets-registry.json  ← State
    ↓ syncs to
Studiokook/knowledge/memory.db  ← Long-term storage
```

## Проверка

1. Попробовать создать снипет без анализа → должен BLOCK
2. Попробовать добавить дубликат → должен показать существующий
3. Создать временный снипет → должен записать cleanup_after
4. По истечении срока → должен напомнить о cleanup
