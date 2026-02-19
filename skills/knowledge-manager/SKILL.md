---
name: knowledge-manager
description: "Knowledge base management via DAL. Use for saving decisions, work logs, snippets, error solutions. Auto-save at session end."
---

# Knowledge Manager Skill

**Роль:** Knowledge Base Manager (integration with DAL)

## Purpose

Автоматическое сохранение и поиск важной информации через `data_access_layer` (DAL).

## Database Structure

Located: `~/.claude/knowledge/knowledge.db`

**Tables:**
1. **decisions** - архитектурные решения
2. **logs** - рабочие логи сессий
3. **snippets** - переиспользуемые фрагменты кода
4. **errors** - ошибки и их решения

## Usage

### Import
```python
from data_access_layer import dal
```

### Save Decision
```python
dal.decisions.add(
    title="Выбор WordPress плагина для галереи",
    decision="Используем NextGEN Gallery вместо нативной Media Library",
    reasoning="NGG позволяет управлять большим количеством изображений, имеет встроенные шаблоны и сео-оптимизацию",
    alternatives="Media Library (слишком простой), Envira Gallery (платный)",
    tags=["wordpress", "gallery", "studiokook"]
)
```

### Save Work Log
```python
dal.logs.add(
    summary="Установка alt text для 70 Egger декоров через WordPress API",
    details="Создан плагин ngg-alt-updater.php с REST endpoint. Использован Playwright для автоматической установки. Обновлено 69 из 70 декоров.",
    tags=["wordpress", "ngg", "studiokook", "automation"],
    project="Studiokook",
    outcome="success"  # success | partial | failed
)
```

### Save Snippet
```python
dal.snippets.add(
    name="WordPress REST API upload with Application Password",
    code='''
import requests
from requests.auth import HTTPBasicAuth

files = {'file': open('image.jpg', 'rb')}
headers = {'Content-Disposition': 'attachment; filename=image.jpg'}

response = requests.post(
    'https://example.com/wp-json/wp/v2/media',
    auth=HTTPBasicAuth('username', 'app_password'),
    files=files,
    headers=headers
)
''',
    language="python",
    description="Загрузка файла в WordPress Media Library через REST API с Application Password аутентификацией",
    tags=["wordpress", "rest-api", "upload"]
)
```

### Save Error & Solution
```python
dal.errors.add(
    title="WordPress REST API 401 Unauthorized с Basic Auth",
    error_message="401: Vabandust, sul ei ole õigust seda teha",
    solution="Использовать Application Password вместо обычного пароля. Создать в Users → Profile → Application Passwords",
    context="При попытке POST запроса к /wp-json/wp/v2/media",
    lesson="WordPress REST API не принимает обычные пароли по соображениям безопасности. Application Password обязателен для любых модифицирующих операций.",
    tags=["wordpress", "rest-api", "auth"]
)
```

### Search

**By keyword:**
```python
# Search across all tables
results = dal.decisions.search("wordpress gallery")
results = dal.logs.search("studiokook")
results = dal.snippets.search("playwright login")
results = dal.errors.search("401 unauthorized")

# Returns list of matching records
for r in results:
    print(r.title, r.created_at)
```

**By tags:**
```python
decisions = dal.decisions.get_by_tags(["wordpress", "ngg"])
snippets = dal.snippets.get_by_tags(["python", "automation"])
```

**Recent items:**
```python
recent_logs = dal.logs.get_recent(limit=10)
recent_errors = dal.errors.get_recent(limit=5)
```

## Auto-Save Guidelines

**When to save automatically (silently):**

1. **Decisions** - любое техническое решение:
   - Выбор технологии/инструмента
   - Архитектурный паттерн
   - Отказ от альтернативы (почему не X)

2. **Logs** - в конце сессии:
   - Что сделано
   - Какие задачи выполнены
   - Итоговый статус
   - Только если работа продлилась >30 мин

3. **Snippets** - переиспользуемый код:
   - Написан универсальный скрипт
   - Решена типовая задача
   - Может пригодиться снова

4. **Errors** - каждая новая ошибка:
   - Потрачено >10 мин на решение
   - Не очевидная проблема
   - Может повториться

**Notification:**
```
Сохранять молча во время работы.
В конце сессии уведомить:

"✓ Сохранено в knowledge base:
  - 2 decisions
  - 1 work log
  - 3 snippets
  - 1 error solution"
```

## Search Strategy

**Before solving a problem:**
```python
# Check if we solved it before
past_errors = dal.errors.search("wordpress rest api auth")
if past_errors:
    print("Found previous solution:", past_errors[0].solution)
    return

# Check for relevant snippets
snippets = dal.snippets.search("wordpress upload")
if snippets:
    print("Reusable code:", snippets[0].code)
```

**During decision-making:**
```python
# Check past decisions in same area
past_decisions = dal.decisions.get_by_tags(["wordpress", "gallery"])
# Review reasoning to stay consistent
```

## Quick Commands

**Save Decision:**
```
Title: [...]
Decision: [...]
Reasoning: [...]
Alternatives: [...]
Tags: [comma-separated]
```

**Save Error:**
```
Error message: [...]
Solution: [...]
Context: [where it happened]
Lesson learned: [...]
Tags: [comma-separated]
```

**Search Knowledge:**
```
Query: [keywords]
Type: [decisions/logs/snippets/errors/all]

→ Relevant results with timestamps
```

**Recent Activity:**
```
Last N: [number]
Type: [decisions/logs/snippets/errors]

→ Chronological list
```

## Integration with Other Skills

All skills should use knowledge base:

**WordPress:**
- Save successful post templates
- Log campaign results
- Store keyword research

**Legal:**
- Save contract templates
- Log legal decisions
- Store compliance checklists

**Content Creator:**
- Save video scripts
- Log performance data
- Store thumbnail formulas

**Assistant:**
- Log completed projects
- Save productivity techniques
- Store successful routines

## Maintenance

**Weekly:**
```python
# Review recent logs
logs = dal.logs.get_recent(7)
# Identify patterns
# Update snippets if needed
```

**Monthly:**
```python
# Export backup
dal.export_backup('~/.claude/knowledge/backups/2026-02-01.json')

# Clean duplicates
dal.deduplicate()

# Tag review
dal.tags.get_all()  # Check for typos/consolidation
```

## Schema

**decisions:**
- id, title, decision, reasoning, alternatives, tags, created_at

**logs:**
- id, summary, details, tags, project, outcome, created_at

**snippets:**
- id, name, code, language, description, tags, created_at

**errors:**
- id, title, error_message, solution, context, lesson, tags, created_at

## Best Practices

✅ **Do:**
- Descriptive titles
- Actionable solutions
- Specific tags (not "misc")
- Include context
- Date-agnostic content

❌ **Don't:**
- Save trivial decisions
- Log every tiny action
- Duplicate existing entries
- Use vague descriptions
- Include sensitive data (passwords, keys)
