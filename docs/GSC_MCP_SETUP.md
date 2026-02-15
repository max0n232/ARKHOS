# Google Search Console MCP - Инструкция для Claude Code (Terminal)

## Зачем нужно

GSC MCP даёт прямой доступ к данным Search Console:
- Позиции по ключевым словам
- Клики, показы, CTR
- Статус индексации страниц
- Анализ трафика по языкам (ET, RU, EN, FI)

---

## Установка (5 шагов)

### Шаг 1: Клонировать репозиторий

```bash
cd C:\Users\sorte\.claude
git clone https://github.com/AminForou/mcp-gsc.git
cd mcp-gsc
```

### Шаг 2: Установить зависимости

```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### Шаг 3: Google Cloud Console — получить OAuth credentials

1. Открой https://console.cloud.google.com/
2. Проект: `arkhos-485120` (или создай новый)
3. **APIs & Services → Library** → включи:
   - Google Search Console API
4. **APIs & Services → Credentials** → Create Credentials → **OAuth 2.0 Client ID**
5. Application type: **Desktop app**
6. Скачай JSON файл
7. Переименуй и положи сюда:
   ```
   C:\Users\sorte\.claude\mcp-gsc\client_secrets.json
   ```

### Шаг 4: Добавить MCP в Claude Code

Открой файл:
```
C:\Users\sorte\.claude.json
```

Найди секцию `"mcpServers"` и добавь `gsc`:

```json
"mcpServers": {
  "n8n-mcp": { ... },
  "wordpress": { ... },
  "gsc": {
    "type": "stdio",
    "command": "C:\\Users\\sorte\\.claude\\mcp-gsc\\venv\\Scripts\\python.exe",
    "args": ["C:\\Users\\sorte\\.claude\\mcp-gsc\\src\\mcp_gsc\\server.py"],
    "env": {}
  }
}
```

### Шаг 5: Авторизация и перезапуск

1. Перезапусти Claude Code (закрой и открой терминал)
2. При первом вызове GSC инструмента — откроется браузер для OAuth
3. Авторизуйся аккаунтом с доступом к GSC studiokook.ee

---

## Проверка

После настройки я смогу:
```
"Покажи топ-10 запросов studiokook.ee за 7 дней"
"Какие страницы не проиндексированы?"
"Сравни трафик /ru/ vs /en/"
```

---

## Быстрый путь (если OAuth уже есть)

У тебя уже есть credentials в Studiokook:
```
Studiokook/credentials/google_credentials.json
```

Просто скопируй:
```bash
copy "C:\Users\sorte\Desktop\Studiokook\credentials\google_credentials.json" "C:\Users\sorte\.claude\mcp-gsc\client_secrets.json"
```

---

## Источники

- [mcp-gsc на GitHub](https://github.com/AminForou/mcp-gsc)
- [Сравнение GSC MCP серверов 2025](https://www.ekamoira.com/blog/google-search-console-mcp-servers-compared-complete-2025-guide)
