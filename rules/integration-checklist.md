# Integration Checklist

> Обязательное правило при добавлении любого нового инструмента, skill, API, плагина или сервиса в ARKHOS.
> Нарушение = инструмент будет "невидим" для CLI в следующих сессиях.

## Проблема которую решает это правило

CLI создаёт файлы, но не встраивает их в систему. Результат:
- Skill лежит в skills/ но нигде не упомянут → CLI не знает что он существует
- API endpoint создан на сервере но не задокументирован → CLI использует костыли
- Агент добавлен в agents/ но нет связи с routing → никогда не вызывается
- Hook написан но не добавлен в settings.json → не выполняется

## Чеклист (обязателен к выполнению)

При добавлении ЛЮБОГО нового компонента — пройди все 7 пунктов.
Пропуск пункта = компонент не интегрирован.

### 1. SKILL.md — создать или обновить

```
Новый инструмент → создай skills/{name}/SKILL.md
Расширение существующего → обнови соответствующий SKILL.md
```

SKILL.md должен содержать:
- **Что это** — одна строка описания
- **API Reference** — все endpoints/методы с параметрами и примерами
- **Authentication** — какие endpoints требуют auth, какой метод
- **Decision Framework** — когда использовать, когда НЕ использовать, приоритеты
- **Safety Rules** — что НЕЛЬЗЯ делать (ссылка на constitution.md)
- **Common Workflows** — 2-3 реальных сценария с командами

Эталон: `skills/wordpress/SKILL.md`

### 2. REGISTRY.md — зарегистрировать

```
Обнови skills/REGISTRY.md — добавь запись:
| {name} | skills/{name}/ | {описание} |
```

Без записи в REGISTRY.md — skill "не существует" для routing.

### 3. Triggers — настроить обнаружение

```
Для глобальных skills:
  → Обнови docs/skills-reference.md — добавь triggers

Для проектных skills:
  → Обнови {project}/skills/_triggers.json
```

Triggers = ключевые слова которые активируют skill автоматически.
Без triggers — skill вызывается только вручную.

### 4. Routing — привязать к маршрутизации

```
Если skill привязан к проекту:
  → Проверь docs/routing.md — есть ли mapping project→skill

Если skill требует agents:
  → Обнови agents/*.md — добавь domain/role/team_eligible

Если skill работает через MCP:
  → Проверь ~/.claude/mcp.json — сервер подключён?
```

### 5. Dependencies — задокументировать

```
Обнови docs/dependencies.md:
  - Внешние зависимости (npm пакеты, API ключи, серверы)
  - Связи с другими skills/hooks/agents
  - Версии критических компонентов
```

### 6. CLAUDE.md — добавить ссылку (если критично)

```
Только для КРИТИЧЕСКИХ skills (используются в >30% сессий):
  → Добавь @reference в CLAUDE.md

Для остальных:
  → НЕ добавляй в CLAUDE.md (не раздувать контекст)
  → Достаточно REGISTRY.md + triggers
```

CLAUDE.md должен быть <20 строк. Не забивай его.

### 7. Verification — проверить интеграцию

```
□ Skill файл существует и содержит API reference
□ Запись в REGISTRY.md есть
□ Triggers настроены (skills-reference.md или _triggers.json)
□ Routing работает (запрос с trigger-словом → активирует skill)
□ Auth задокументирован (какие endpoints, какой метод)
□ Зависимости записаны
□ Safety rules добавлены
```

## Примеры

### Пример: Добавление нового REST API endpoint на сайте

Допустим добавили `sk/v1/new-endpoint` на studiokook.ee.

```
□ Обновить skills/wordpress/SKILL.md — добавить endpoint в таблицу
□ Описать параметры, auth, пример запроса
□ Добавить в Decision Framework — когда использовать
□ Если новый trigger — обновить _triggers.json
□ Проверить что CLI находит при релевантном запросе
```

### Пример: Подключение нового MCP сервера

```
□ Добавить в ~/.claude/mcp.json
□ Создать skills/{service}/SKILL.md с описанием tools
□ Добавить в skills/REGISTRY.md
□ Добавить triggers в docs/skills-reference.md
□ Задокументировать env variables и credentials
□ Протестировать через CLI
```

### Пример: Добавление нового WordPress плагина

```
□ Обновить skills/wordpress/SKILL.md — секция Plugin Dependencies
□ Если плагин имеет API — задокументировать endpoints
□ Если плагин влияет на content — обновить Decision Framework
□ Если нужны новые safety rules — добавить в Safety Rules
□ Обновить docs/dependencies.md
```

### Пример: Создание нового агента

```
□ Создать agents/{name}.md с frontmatter (name, description, tools, model, permissionMode)
□ Добавить domain, role, team_eligible в frontmatter
□ Проверить что agent вызывается при релевантном запросе
```

## Anti-patterns (ЗАПРЕЩЕНО)

1. **Создать файл и забыть** — файл без записи в REGISTRY = мёртвый файл
2. **API без документации** — endpoint без SKILL.md = CLI его не найдёт
3. **Snippet вместо правильного решения** — если есть API endpoint, используй его
4. **Дублирование** — если skill уже покрывает тему, расширяй его а не создавай новый
5. **Раздувание CLAUDE.md** — CLAUDE.md не справочник, он маршрутизатор. Детали в SKILL.md.
6. **Hook без settings.json** — скрипт в hooks/ без записи в settings.json не выполнится
7. **Credentials в коде** — NEVER. Используй env variables или credentials/ directory.

## Когда НЕ нужен этот чеклист

- Одноразовый скрипт для ad-hoc задачи (не часть системы)
- Временный debug файл (удалить после)
- Документация не связанная с инструментами (notes, plans)
