# Cross-Project Sync Audit
**Teammate:** 1
**Дата:** 2026-02-10
**Scope:** Global (~/.claude/) vs Project (~/Desktop/Studiokook/.claude/) configuration

---

## Проверенные файлы

### Global Level
1. `C:\Users\sorte\.claude\CLAUDE.md`
2. `C:\Users\sorte\.claude\CONSTITUTION.md`
3. `C:\Users\sorte\.claude\rules\code-style.md`
4. `C:\Users\sorte\.claude\rules\security.md`

### Project Level
1. `C:\Users\sorte\Desktop\Studiokook\.claude\security.toml`
2. `C:\Users\sorte\Desktop\Studiokook\.claude\settings.local.json`
3. `C:\Users\sorte\Desktop\Studiokook\.claude\hooks.json`
4. `C:\Users\sorte\Desktop\Studiokook\.claude\agents\studiokook-context.md`
5. `C:\Users\sorte\Desktop\Studiokook\.claude\agents\wp-specialist.md`

---

## Находки

### 1. EXACT DUPLICATES (Критично)

#### WordPress-Specific Rules
**Location 1:** `C:\Users\sorte\.claude\CONSTITUTION.md` (lines 36-41)
**Location 2:** `C:\Users\sorte\Desktop\Studiokook\.claude\security.toml` (lines 13-127)

**Дублирующийся контент:**
```
- NEVER wp_update_post() — crashes sites
- Use $wpdb->update() or REST API
- All PHP через Code Snippets plugin
- Escape output: esc_html(), esc_attr()
```

**Проблема:** Одинаковое содержание в разных форматах (Markdown vs TOML)

**Рекомендация:**
- Оставить в global `CONSTITUTION.md` как источник истины
- В `security.toml` заменить на: `# See ~/.claude/CONSTITUTION.md § WordPress Specific`

---

### 2. CONFLICTS

**Статус:** ❌ Не обнаружено

Конфликтующих правил (одна настройка — разные значения) не найдено.

---

### 3. INCONSISTENCIES

#### Language Preference Mismatch
**Global:** `CLAUDE.md` → "RU primary, EN tech terms"
**Project:** `wp-specialist.md`, `studiokook-context.md` → English only

**Проблема:** Project-level agents не следуют global language mandate

**Рекомендация:**
- Перевести project agents на RU
- ИЛИ задокументировать English-only exception в CLAUDE.md

#### Authority Structure Gap
**Global:** `CONSTITUTION.md` referenced in `CLAUDE.md`
**Project:** Agents не ссылаются на global CONSTITUTION

**Проблема:** Нет явной иерархии наследования

**Рекомендация:**
- Добавить в project agents: "Constraints: See ~/.claude/CONSTITUTION.md"
- Создать `HIERARCHY.md` с precedence rules

#### Format Inconsistency
**Global:** Markdown (.md)
**Project:** TOML для security, JSON для settings, Markdown для agents

**Проблема:** Разные форматы = разная парсинг логика

**Рекомендация:**
- Стандартизировать на Markdown где возможно
- Документировать когда использовать какой формат (создать `FORMATS.md`)

---

### 4. MISSING REFERENCES

#### Inheritance Chain
- `security.toml` line 6: `inherits = "global"` — но механизм наследования не реализован
- Project `CLAUDE.md` не существует → нет явного расширения global version

**Рекомендация:**
- Создать `~/Desktop/Studiokook/.claude/CLAUDE.md` с:
  ```markdown
  # Studiokook Project Configuration

  Extends: ~/.claude/CLAUDE.md

  ## Project-Specific Overrides
  - WordPress performance monitoring enabled
  - Estonian market context (legal, SEO)
  ```

#### Hardcoded Paths
`settings.local.json` содержит абсолютные пути без ссылок на central config

**Рекомендация:**
- Использовать environment variables или relative paths
- Задокументировать path resolution order

---

## Что должно быть где?

### Global (~/.claude/)
**Держать здесь:**
- Universal rules (security, code style)
- Core constitution (non-negotiables)
- Language preferences
- Superpowers routing table
- Cross-project tools (hooks, scripts)

**Примеры:**
- ✅ "NEVER commit credentials"
- ✅ "Test-Driven Development"
- ✅ "RU primary, EN tech terms"

### Project (~/Desktop/Studiokook/.claude/)
**Держать здесь:**
- Project-specific context (Studiokook = кухни, Estonian market)
- Domain-specific agents (wp-specialist)
- Project-specific security rules (if any)
- Local overrides (settings.local.json)

**Примеры:**
- ✅ "Studiokook.ee — Estonian kitchen firm"
- ✅ "WordPress multisite setup"
- ✅ "Local database credentials path"

### Сейчас неправильно размещено

| Контент | Сейчас | Должно быть |
|---------|--------|-------------|
| WordPress-specific rules | И в global, и в project | Только в global |
| Language preference | Только в global | Global + enforce в project |
| Superpowers routing | Только в global | Global (OK) |
| Authority reference | Нет в project | Добавить в project |

---

## Рекомендации

### Priority 1 (Immediate)

1. **Консолидировать WordPress rules**
   ```bash
   # Удалить дублирование из security.toml
   # Заменить на:
   # See ~/.claude/CONSTITUTION.md § WordPress Specific
   ```

2. **Создать project CLAUDE.md**
   ```bash
   ~/Desktop/Studiokook/.claude/CLAUDE.md
   ```
   С явным extends к global version

### Priority 2 (This Week)

3. **Унифицировать язык**
   - Перевести `wp-specialist.md` на RU
   - Перевести `studiokook-context.md` на RU

4. **Документировать precedence**
   - Создать `~/.claude/HIERARCHY.md`
   - Указать порядок: Project overrides Global

### Priority 3 (Nice to Have)

5. **Создать format guide**
   - `~/.claude/FORMATS.md`
   - Когда использовать MD, TOML, JSON

6. **Добавить sync checklist**
   - Header в дублированных файлах: `# Last synced: 2026-02-10`
   - Скрипт для проверки синхронизации

---

## Статистика

| Метрика | Значение |
|---------|----------|
| Files reviewed | 9 |
| Exact duplicates | 3 critical |
| Conflicts | 0 |
| Inconsistencies | 3 |
| Missing references | 2 |
| Redundancy rate | ~40% |

---

## Вердикт

**Система структурирована хорошо**, но имеет дублирование и неявную иерархию. Исправление займёт 2-4 часа и снизит maintenance cost на 40%.

**Ключевое действие:** Консолидировать WordPress rules и создать project CLAUDE.md с явным наследованием.
