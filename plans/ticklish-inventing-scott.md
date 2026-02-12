# Integration Plan: WordPress SKILL + Integration Checklist

## Summary

Интеграция двух новых компонентов в ARKHOS:
1. **integration-checklist.md** — обязательное правило при добавлении компонентов
2. **wordpress/SKILL.md** — skill для работы с studiokook.ee REST API

## Current State Analysis

**Уже существует (НЕ нужно менять):**
- `CLAUDE.md` содержит `@skills/task-router/SKILL.md` и `registry.json`
- Agents (`code-reviewer`, `debugger`, `researcher`) уже имеют `domain`, `role`, `team_eligible`
- `REGISTRY.md` содержит `task-router`

**Нужно создать/обновить:**
- 2 новых файла
- 4 обновления существующих файлов

---

## Implementation Steps

### Step 1: Create rules/integration-checklist.md
**Path:** `~/.claude/rules/integration-checklist.md`
**Source:** `C:/Users/sorte/Desktop/TT/integration-checklist.md`
**Action:** Copy content

### Step 2: Create skills/wordpress/SKILL.md
**Path:** `~/.claude/skills/wordpress/SKILL.md`
**Source:** `C:/Users/sorte/Desktop/TT/wordpress-SKILL.md`
**Action:** Copy content (создать директорию wordpress/)

### Step 3: Update CLAUDE.md
**Path:** `~/.claude/CLAUDE.md`
**Changes:** Add 2 @references to References section

```markdown
## References

@rules/constitution.md
@rules/code-style.md
@rules/security.md
@rules/integration-checklist.md        ← NEW
@docs/routing.md
@docs/skills-reference.md
@skills/task-router/SKILL.md
@skills/task-router/registry.json
@skills/wordpress/SKILL.md             ← NEW
```

### Step 4: Update skills/REGISTRY.md
**Path:** `~/.claude/skills/REGISTRY.md`
**Changes:** Add wordpress skill to table

Add new section "WordPress" or add to "External":
```markdown
### WordPress
| Skill | Path | Description |
|-------|------|-------------|
| wordpress | skills/wordpress/ | studiokook.ee REST API, TranslatePress, Elementor |
```

### Step 5: Update docs/skills-reference.md
**Path:** `~/.claude/docs/skills-reference.md`
**Changes:** Add WordPress to "Additional Skills" table

```markdown
| WordPress | ~/.claude/skills/wordpress/ | WordPress, WP, сайт, studiokook, перевод, translation, TRP, Elementor, SEO, snippets |
```

### Step 6: Update docs/routing.md
**Path:** `~/.claude/docs/routing.md`
**Changes:** Add WordPress skill to Project-Specific Skills

```markdown
| Studiokook | skills/wordpress/SKILL.md | "перевод", "translation", "контент", "страница", "TRP", "SEO", "snippet" |
```

### Step 7: Update docs/ARCHITECTURE.md
**Path:** `~/.claude/docs/ARCHITECTURE.md`
**Changes:** Replace "Adding New Components" section

New content:
```markdown
## Adding New Components

**ОБЯЗАТЕЛЬНО:** При добавлении любого компонента следуй @rules/integration-checklist.md

Quick reference:
1. Создай/обнови SKILL.md
2. Зарегистрируй в skills/REGISTRY.md
3. Настрой triggers (skills-reference.md или _triggers.json)
4. Привяжи к routing (routing.md, task-router, agents)
5. Задокументируй dependencies
6. Добавь @reference в CLAUDE.md (только для критических)
7. Проверь что CLI находит при релевантном запросе

Полный чеклист: rules/integration-checklist.md
```

---

## Files Summary

| Action | File | Lines Changed |
|--------|------|---------------|
| CREATE | rules/integration-checklist.md | ~165 |
| CREATE | skills/wordpress/SKILL.md | ~350 |
| EDIT | CLAUDE.md | +2 lines |
| EDIT | skills/REGISTRY.md | +5 lines |
| EDIT | docs/skills-reference.md | +1 line |
| EDIT | docs/routing.md | +1 line |
| EDIT | docs/ARCHITECTURE.md | ~15 lines |

**Total:** 2 creates, 5 edits

---

## NOT Included (per analysis)

1. ❌ settings.json env variables — уже настроены или не требуются
2. ❌ agents/ frontmatter updates — уже содержат domain/role/team_eligible
3. ❌ task-router в REGISTRY.md — уже есть
4. ❌ task-router в CLAUDE.md — уже есть

---

## Verification

After implementation:
1. Запросить "WordPress" или "studiokook" — должен загрузиться wordpress SKILL
2. Проверить что `@rules/integration-checklist.md` загружается
3. Проверить что `@skills/wordpress/SKILL.md` загружается в контекст
