# SK/V1 Custom REST API Reference

Base: `https://studiokook.ee/wp-json/sk/v1/`
Auth: `Basic` (WP Application Password из `credentials/wp-auth.env`)

## Deploy API

mu-plugin `studiokook-seo.php`. Полный файловый доступ к серверу.
Разрешённые директории: `wp-content/mu-plugins/`, `wp-content/themes/`, `wp-content/uploads/`.

| Endpoint | Method | Params | Description |
|----------|--------|--------|-------------|
| `/deploy-file` | POST | `path`, `content` | Записать/обновить файл |
| `/deploy-file?path=` | GET | `path` | Прочитать файл |
| `/deploy-file?path=` | DELETE | `path` | Удалить файл |
| `/deploy-ls?dir=` | GET | `dir` | Список файлов |

```bash
# Записать файл
curl -X POST -u "$WP_USER:$WP_APP_PASS" "studiokook.ee/wp-json/sk/v1/deploy-file" \
  -H "Content-Type: application/json" \
  -d '{"path":"wp-content/mu-plugins/my-plugin.php","content":"<?php // code"}'

# Прочитать файл
curl -u "$WP_USER:$WP_APP_PASS" "studiokook.ee/wp-json/sk/v1/deploy-file?path=wp-content/mu-plugins/studiokook-seo.php"

# Список файлов
curl -u "$WP_USER:$WP_APP_PASS" "studiokook.ee/wp-json/sk/v1/deploy-ls?dir=wp-content/mu-plugins"
```

## Контент и переводы

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/elementor/{id}` | GET | Elementor data страницы |
| `/elementor/{id}/replace` | POST | Search/replace (`search`, `replace`) |
| `/trp-search?q=` | GET | Поиск в TranslatePress |
| `/trp-update-id` | POST | Обновить перевод (`id`, `translated`, `lang`) |
| `/trp-add` | POST | Добавить перевод |
| `/full-clear` | GET | Очистить все кэши |
| `/touch-page?id=` | GET | Обновить modified date |
| `/update-seo` | POST | Обновить Yoast meta |
| `/faq` | POST | Добавить FAQ Schema |

## Известные ограничения

- **Code Snippets REST API** (`/code-snippets/v1/snippets`) — НЕ РАБОТАЕТ. POST создаёт пустые записи. Используй Deploy API вместо этого.
- **Sandbox** блокирует outbound. Deploy-скрипты (`deploy/`) юзер запускает на своей машине.
