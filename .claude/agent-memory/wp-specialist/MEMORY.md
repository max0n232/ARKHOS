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

## SSH Access

- Host: `studiokook.ee`, User: `virt103578`
- Key: `C:/Users/sorte/.ssh/id_studiokook`
- WP root: `~/domeenid/www.studiokook.ee/htdocs`
- WP-CLI 2.12.0 (cd to WP root first, `--path=~` doesn't expand)
- Usage: `ssh -i "C:/Users/sorte/.ssh/id_studiokook" virt103578@studiokook.ee "cd ~/domeenid/www.studiokook.ee/htdocs && wp ..."`
- SCP: `scp -i "C:/Users/sorte/.ssh/id_studiokook" file virt103578@studiokook.ee:~/domeenid/www.studiokook.ee/htdocs/`

## Site-Specific Knowledge

### Elementor
- Front page (ID 8) is Elementor. Content lives in BOTH `post_content` AND `_elementor_data` meta
- Must update both when editing. After changes: `wp elementor flush-css && wp cache flush`

### TranslatePress
- 4 languages: ET (primary), RU, EN, FI
- URL structure: `/`, `/ru/`, `/en/`, `/fi/`
- Hreflang must include x-default pointing to ET
- **API gotcha:** `/sk/v1/trp-update-id` works for EN only (dictionary IDs match original_id). RU and FI dictionary tables have own auto-increment IDs — use `$wpdb->update()` on `wp_trp_dictionary_{lang}` directly
- Translation workflow for new pages:
  1. Visit page in all 4 languages to trigger TRP string detection
  2. Find IDs: `wp db query "SELECT id, LEFT(original,80) FROM wp_trp_dictionary_{lang} WHERE original LIKE '%text%'"`
  3. Update via PHP eval-file with `$wpdb->update()`, set `status=2`
  4. Flush: `wp cache flush && wp transient delete --all`
- **Cache clear via API:** `GET /sk/v1/full-clear` (NOT POST!)

### Code Snippets
- Table `wp_snippets`, scope `front-end` for frontend-only. Insert via `$wpdb->insert()`
- REST API broken (creates empty records) — use DB or eval-file

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
*Last updated: 2026-02-19*
*Update this file after every significant WordPress fix*
