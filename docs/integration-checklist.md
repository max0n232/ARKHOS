> Этот файл НЕ импортируется в CLAUDE.md. Вызывай по запросу.

# Integration Checklist

При добавлении нового инструмента, skill, API или сервиса в ARKHOS.

## Чеклист

### 1. SKILL.md — создать или обновить

- Новый инструмент → `skills/{name}/SKILL.md`
- Расширение существующего → обнови соответствующий SKILL.md
- Содержание: что это, API reference, auth, decision framework, safety rules, workflows

### 2. Проверка интеграции

- [ ] SKILL.md существует и содержит реальную документацию
- [ ] CLI находит skill при релевантном запросе
- [ ] Auth задокументирован
- [ ] Safety rules добавлены (ссылка на constitution.md)

### 3. CLAUDE.md — только если критично

- Используется в >30% сессий → добавь @reference в CLAUDE.md
- Остальные → НЕ добавляй (CLI находит по описанию в SKILL.md)

## Anti-patterns

- Создать файл и забыть (без проверки что CLI его находит)
- API без документации в SKILL.md
- Дублирование — расширяй существующий skill, не создавай новый
- Credentials в коде — NEVER
