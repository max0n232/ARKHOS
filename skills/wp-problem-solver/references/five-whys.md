# 5 Whys Root Cause Analysis

## Purpose

The 5 Whys technique helps identify the ROOT CAUSE of a problem, not just its symptoms. Without this, fixes become patches that create technical debt.

## How to Apply

Start with the visible symptom and ask "Why?" iteratively:

### Example 1: Slow Page Load

```
SYMPTOM: "Страница медленно грузится"

WHY 1: Почему медленно?
→ Много запросов к БД (15 queries per page)

WHY 2: Почему много запросов?
→ WP_Query вызывается в цикле foreach

WHY 3: Почему WP_Query в цикле?
→ Шаблон загружает related posts для каждого поста

WHY 4: Почему для каждого отдельно?
→ Копипаста кода без понимания batch loading

WHY 5: ROOT CAUSE
→ Нужен prefetch с одним запросом, не 15 отдельных
```

**Solution:** Single WP_Query with `post__in`, not loop queries.

### Example 2: Broken Layout After Update

```
SYMPTOM: "Сломалась верстка после обновления темы"

WHY 1: Почему сломалась?
→ CSS классы изменились

WHY 2: Почему классы влияют?
→ Кастомные стили завязаны на классы темы

WHY 3: Почему завязаны на классы темы?
→ Стили добавлены напрямую в файл темы

WHY 4: Почему в файле темы?
→ Не использовали child theme

WHY 5: ROOT CAUSE
→ Нет child theme, кастомизации теряются при обновлении
```

**Solution:** Create child theme, move customizations there.

### Example 3: Plugin Conflict

```
SYMPTOM: "Форма не отправляется"

WHY 1: Почему не отправляется?
→ JavaScript ошибка в консоли

WHY 2: Почему JS ошибка?
→ jQuery undefined в момент вызова

WHY 3: Почему jQuery undefined?
→ Плагин подключает свой скрипт без зависимости от jQuery

WHY 4: Почему без зависимости?
→ wp_enqueue_script без ['jquery'] в deps

WHY 5: ROOT CAUSE
→ Неправильный wp_enqueue_script в плагине
```

**Solution:** Fix plugin's script registration, not add jQuery manually.

## Common Anti-Patterns

### ❌ Stopping Too Early

```
SYMPTOM: "Site is slow"
WHY 1: "Too many plugins"
→ STOP: "Let's disable plugins"
```

This is symptom treatment. The real question: WHY do we have many plugins? What are they doing? Can functionality be consolidated?

### ❌ Jumping to Solutions

```
SYMPTOM: "Error on checkout"
→ "Let's add a try-catch"
```

No analysis at all. The error exists for a reason. Find it.

### ❌ Blaming External Factors

```
SYMPTOM: "API timeout"
WHY 1: "Third-party API is slow"
→ STOP: "Nothing we can do"
```

Wrong. Why are we calling API synchronously? Can we cache? Can we defer?

## When 5 Whys Isn't Enough

Sometimes root cause is:
- External (hosting, third-party)
- Historical (legacy code, no one knows)
- Political (client requirement)

In these cases:
1. Document the known limitation
2. Create a WORKAROUND (not fix)
3. Set cleanup_after date
4. Track in registry as workaround

## Template

```markdown
## 5 Whys Analysis

**Date:** YYYY-MM-DD
**Problem:** [User-visible symptom]

### Analysis

| # | Question | Answer |
|---|----------|--------|
| 1 | Why does [symptom] happen? | [immediate cause] |
| 2 | Why does [cause 1] happen? | [deeper cause] |
| 3 | Why does [cause 2] happen? | [even deeper] |
| 4 | Why does [cause 3] happen? | [root level] |
| 5 | ROOT CAUSE | [actual source] |

### Conclusion

**Root Cause:** [one sentence]
**Solution Type:** fix / workaround / enhancement
**Proposed Action:** [brief description]
```
