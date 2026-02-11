# n8n Hub

Центральный хаб для n8n workflows. Shared templates и конфигурация синхронизации.

## Структура

```
n8n-hub/
├── templates/           <- Переиспользуемые паттерны
│   ├── webhook-handler.json
│   ├── error-notifier.json
│   └── supabase-logger.json
├── sync-config.json     <- Конфиг деплоя Local -> VPS
└── README.md
```

## Templates

| Template | Назначение |
|----------|------------|
| `webhook-handler` | Универсальный webhook с валидацией |
| `error-notifier` | Отлов ошибок -> Telegram + Supabase |
| `supabase-logger` | Структурированное логирование |

## Использование

### 1. Копирование template в проект

```bash
cp templates/webhook-handler.json ../Desktop/Studiokook/n8n/dev/my-webhook.json
```

### 2. Замена placeholders

В скопированном файле замени:
- `{{WEBHOOK_ID}}` -> уникальный ID
- `{{TELEGRAM_CREDENTIAL_ID}}` -> ID из n8n credentials
- `{{SUPABASE_CREDENTIAL_ID}}` -> ID из n8n credentials

### 3. Импорт в n8n

```bash
# Local dev
n8n import:workflow --input=my-webhook.json

# После тестирования -> prod
cp dev/my-webhook.json prod/
```

## Sync: Local -> VPS

1. Разработка в `project/n8n/dev/`
2. Тестирование на Local n8n
3. Перенос в `project/n8n/prod/`
4. Деплой: `scp` или git pull на VPS
5. Импорт на VPS n8n

См. `sync-config.json` для команд.
