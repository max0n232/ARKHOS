# WP-Specialist Memory

Accumulated knowledge from WordPress work on studiokook.ee.

## Critical Patterns Learned

### NEVER DO
- `wp_update_post()` — crashes site, causes infinite loops
- Direct SQL without escaping
- Modifying core WordPress files

### ALWAYS DO
- Use `$wpdb->update()` instead of wp_update_post()
- PHP на сервер: через Deploy API (`/sk/v1/deploy-file`), НЕ через Code Snippets plugin (его REST API не сохраняет code)
- mu-plugin `studiokook-seo.php` — основной файл (robots.txt, schemas, Deploy API). Обновлять через Deploy API
- Deploy-скрипты: `deploy/` — Node.js, юзер запускает на своей машине (sandbox блокирует outbound)
- Check snippets-registry.json before creating new code
- Run 5 Whys analysis before fixing

## Site-Specific Knowledge

### TranslatePress
- 4 languages: ET (primary), RU, EN, FI
- URL structure: `/`, `/ru/`, `/en/`, `/fi/`
- Hreflang must include x-default pointing to ET

### NextGen Gallery (NGG)
- Post IDs: Egger=6309, Fundermax=6335
- Gallery IDs mapped in knowledge.db
- Thumbnail regeneration: use NGG Tools, not WP-CLI

### Plugins Active
- Flavor theme (custom)
- TranslatePress (multilingual)
- NextGen Gallery (product images)
- WPCode (snippets management)
- Seraphinite (caching)

## Successful Fixes

| Date | Issue | Solution | File |
|------|-------|----------|------|
| 2026-02-10 | Missing H1 tags | Added via Code Snippets | auto-h1-titles.php |
| 2026-02-09 | FAQ schema duplicates | Consolidated to one snippet | faq-schema-unified.php |
| 2026-02-15 | Code Snippets API broken | mu-plugin + Deploy API | studiokook-seo.php |
| 2026-02-15 | Physical robots.txt blocked filter | Deleted file, mu-plugin override | studiokook-seo.php |

## Known Issues (Unresolved)

| Issue | Root Cause | Workaround | Cleanup Date |
|-------|------------|------------|--------------|
| - | - | - | - |

## Deploy API (sk/v1)

mu-plugin `studiokook-seo.php` предоставляет файловый REST API:
- `POST /sk/v1/deploy-file` — записать файл (params: `path`, `content`)
- `GET /sk/v1/deploy-file?path=` — прочитать файл
- `DELETE /sk/v1/deploy-file?path=` — удалить файл
- `GET /sk/v1/deploy-ls?dir=` — список файлов

Разрешённые директории: `mu-plugins/`, `themes/`, `uploads/`. Требует admin auth.

Code Snippets plugin REST API **НЕ РАБОТАЕТ** — создаёт пустые записи. Не использовать.

---
*Last updated: 2026-02-15*
*Update this file after every significant WordPress fix*
