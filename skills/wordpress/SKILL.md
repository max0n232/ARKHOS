# WordPress / Studioköök Skill

> Site: studiokook.ee | WordPress + Elementor 3.25.11 + TranslatePress 2.7.4
> Languages: et (primary), ru, en, fi
> Theme: Xpro Themer + Astra

## Architecture

studiokook.ee — WordPress site with:
- **Elementor** page builder (content in widgets)
- **TranslatePress** multilingual (translations in `wp_trp_dictionary_*` tables)
- **Code Snippets** plugin for PHP customization
- **Yoast SEO** for meta/SEO
- **Contact Form 7** for forms
- **NextGEN Gallery** for images
- **Kadence Blocks** for additional blocks

## Custom REST API: `sk/v1`

Base URL: `https://studiokook.ee/wp-json/sk/v1/`

### Authentication

| Endpoint | Auth Required | Method |
|---|---|---|
| trp-search | No | GET |
| trp-untranslated | No | GET |
| list-plugins | No | GET |
| trp-add | **Yes** | POST |
| trp-insert | **Yes** | POST |
| trp-update | No* | POST |
| trp-update-by-id | **Yes** | POST |
| trp-update-id | **Yes** | POST |
| update-seo | **Yes** | POST |
| elementor/{id} | **Yes** | GET |
| elementor/{id}/replace | **Yes** | POST |
| fix-trp-dicts | **Yes** | GET |
| fix-trp-tasuta | **Yes** | GET |
| touch-page | **Yes** | GET |
| clear-seraph | **Yes** | POST |
| trp-clean-emoji | **Yes** | POST |

Auth method: WordPress application password or nonce cookie.
For CLI: use `curl` with stored credentials from project's credentials/ directory.

### Translation Endpoints

#### `GET trp-untranslated`
Returns strings with no translation (status=0).

```bash
curl "https://studiokook.ee/wp-json/sk/v1/trp-untranslated"
# Optional: ?lang=ru (filter by language)
```

Response:
```json
[
  {"id": "5306", "original": "Köögi tellimine Tallinnas..."},
  {"id": "5305", "original": "We use only quality Austrian hardware..."}
]
```

#### `GET trp-search?q={text}`
Search dictionary by text fragment.

```bash
curl "https://studiokook.ee/wp-json/sk/v1/trp-search?q=Täitke"
```

Response:
```json
[
  {
    "id": "2544",
    "original": " Täitke vorm...",
    "translated": "",
    "status": "0"
  },
  {
    "id": "5166",
    "original": "Täitke vorm...",
    "translated": "Fill out the form...",
    "status": "2"
  }
]
```
Status values: 0=not translated, 2=translated

#### `POST trp-add` (auth required)
Add new translation to dictionary.

```bash
curl -X POST "https://studiokook.ee/wp-json/sk/v1/trp-add" \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $WP_AUTH" \
  -d '{"original": "Estonian text", "translated": "Russian text", "lang": "ru"}'
```

#### `POST trp-update-by-id` (auth required)
Update existing translation by dictionary ID.

```bash
curl -X POST "https://studiokook.ee/wp-json/sk/v1/trp-update-by-id" \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $WP_AUTH" \
  -d '{"id": "2544", "translated": "Заполните форму...", "status": "2"}'
```

#### `POST trp-insert` (auth required)
Insert new dictionary entry.

#### `POST trp-update-id` (auth required)
Update entry by specific ID.

#### `GET fix-trp-dicts` (auth required)
Repair/rebuild TranslatePress dictionaries. Run after bulk changes.

#### `GET fix-trp-tasuta` (auth required)
Fix specific TRP dictionary issue with "tasuta" translations.

#### `POST trp-clean-emoji` (auth required)
Remove emoji artifacts from translation entries.

### Content Endpoints

#### `GET elementor/{page_id}` (auth required)
Get Elementor page content as structured data.

```bash
curl "https://studiokook.ee/wp-json/sk/v1/elementor/8" \
  -H "Authorization: Basic $WP_AUTH"
```

#### `POST elementor/{page_id}/replace` (auth required)
Replace content in Elementor page. Use for fixing whitespace, broken HTML.

```bash
curl -X POST "https://studiokook.ee/wp-json/sk/v1/elementor/8/replace" \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $WP_AUTH" \
  -d '{"search": " Täitke vorm", "replace": "Täitke vorm"}'
```

#### `GET touch-page` (auth required)
Invalidate page cache. Run after content changes.

### SEO Endpoints

#### `POST update-seo` (auth required)
Update Yoast SEO meta for a page.

### Utility Endpoints

#### `GET list-plugins`
List all installed WordPress plugins.

#### `POST clear-seraph` / `GET seraph-info` (auth required)
Seraph Accel cache management.

#### `POST full-clear` (auth required)
Full cache clear (all layers).

## WordPress MCP Server

Available at: `https://studiokook.ee/wp-json/mcp/`
Status: Active, requires auth.
Use for: advanced WordPress operations via MCP protocol.

## Code Snippets API

Base: `https://studiokook.ee/wp-json/code-snippets/v1/`
Auth: Not required for read, required for write.

Use for: Managing PHP snippets programmatically.

## Decision Framework

### When modifying content or translations

```
Step 1: DIAGNOSE
  → GET trp-search?q={text} — is it in TranslatePress dictionary?
  → Check status: 0 (untranslated), 2 (translated)
  → Check for duplicates (whitespace variants)

Step 2: CHOOSE METHOD (in priority order)

  Priority 1 — TranslatePress API (95% of cases)
  Use when: text exists in TRP dictionary or should be added
  Method: POST trp-update-by-id (if entry exists) or trp-add (if new)
  Result: translation in DB, editable via TRP UI, survives theme updates

  Priority 2 — Elementor content fix (4%)
  Use when: original content has whitespace/HTML issues causing TRP mismatch
  Method: POST elementor/{id}/replace to clean original, then add TRP translation
  Result: clean original + correct TRP matching

  Priority 3 — Code Snippet (1%, LAST RESORT)
  Use ONLY when:
    - Dynamic PHP-generated content (prices, dates, calculations)
    - Hardcoded strings in theme/plugin source (not in TRP scope)
    - Shortcode output from third-party plugins
    - WordPress system strings (gettext domain)
  Required: Document WHY snippet is needed in snippet description
  Naming: "TRP-fallback: {page} - {what it translates}"

Step 3: VERIFY
  → GET the page on target language
  → Confirm text displays correctly
  → If cache: GET touch-page or clear-seraph

Step 4: LOG
  → Record what was changed and why
```

### When working with pages

```
Read content:     GET sk/v1/elementor/{page_id}        (auth)
Modify content:   POST sk/v1/elementor/{page_id}/replace (auth)
Update SEO:       POST sk/v1/update-seo                (auth)
Clear cache:      GET sk/v1/touch-page or clear-seraph (auth)
```

### When debugging issues

```
List plugins:     GET sk/v1/list-plugins
Check cache:      GET sk/v1/seraph-info
Full reset:       POST sk/v1/full-clear                (auth)
```

## Safety Rules (extends constitution.md)

1. **NEVER** use `wp_update_post()` — crashes sites. Use `$wpdb->update()` or REST API.
2. **NEVER** modify theme files directly — use Code Snippets plugin.
3. **NEVER** hardcode credentials in snippets.
4. All PHP through Code Snippets plugin.
5. Escape output: `esc_html()`, `esc_attr()`, `esc_url()`.
6. **NEVER** create a snippet for something that can be done through TranslatePress API.
7. **ALWAYS** check `trp-search` before creating translation-related snippets.
8. After bulk translation changes: run `fix-trp-dicts` to rebuild dictionary.
9. After content changes: run `touch-page` to clear cache.

## Windows/Bash Gotchas

1. **UTF-8:** Никогда не передавай Unicode (ö, ü, ä, кириллицу) inline в curl -d. Используй:
   - `curl -d @file.json` (JSON записан в файл)
   - Node.js скрипт с https модулем
2. **Символ `!`:** Bash интерпретирует как history expansion. Записывай в файл.
3. **Content-Length:** Для Node.js https.request ВСЕГДА указывай Content-Length: Buffer.byteLength(data)
4. **Pipe blocking:** `curl | node -e` блокируется security pattern. Используй промежуточный файл.

## Common Workflows

### Translate a page to Russian

```bash
# ВАЖНО: trp-search показывает только EN-таблицу!
# Для RU переводов используй trp-add с lang='ru'

# 1. Найти непереведённые строки (это EN-таблица, но оригиналы те же)
curl "https://studiokook.ee/wp-json/sk/v1/trp-untranslated"

# 2. Для каждой строки — добавить RU перевод
# Используй Node.js скрипт из-за UTF-8 проблем в Windows bash

node -e "
const https = require('https');
const data = JSON.stringify({
  original: 'Estonian original text',
  translated: 'Русский перевод',
  lang: 'ru'
});
const req = https.request({
  hostname: 'studiokook.ee',
  path: '/wp-json/sk/v1/trp-add',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(data),
    'Authorization': 'Basic ' + Buffer.from(process.env.WP_USER + ':' + process.env.WP_APP_PASS).toString('base64')
  }
}, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log(body));
});
req.write(data);
req.end();
"

# 3. После всех переводов: пересобрать словари
curl "https://studiokook.ee/wp-json/sk/v1/fix-trp-dicts" \
  -H "Authorization: Basic $WP_AUTH"

# 4. Очистить кеш
curl "https://studiokook.ee/wp-json/sk/v1/touch-page" \
  -H "Authorization: Basic $WP_AUTH"

# 5. ОБЯЗАТЕЛЬНО: открыть страницу в браузере и проверить визуально
```

### Fix whitespace duplicate in TRP

```bash
# 1. Find the problematic entry
curl ".../sk/v1/trp-search?q=Täitke"
# Returns: id=2544 " Täitke..." (with space, status=0)
#          id=5166 "Täitke..."  (clean, status=2, has translation)

# 2. Fix Elementor content (remove leading space)
curl -X POST ".../sk/v1/elementor/8/replace" \
  -d '{"search": " Täitke vorm", "replace": "Täitke vorm"}'

# 3. Copy translation to the space-variant entry (or it will persist in DB)
curl -X POST ".../sk/v1/trp-update-by-id" \
  -d '{"id": "2544", "translated": "Заполните форму...", "status": "2"}'

# 4. Rebuild + clear cache
curl "https://studiokook.ee/wp-json/sk/v1/fix-trp-dicts" \
  -H "Authorization: Basic $WP_AUTH"
curl "https://studiokook.ee/wp-json/sk/v1/touch-page" \
  -H "Authorization: Basic $WP_AUTH"
```

### Audit existing snippets

```bash
# 1. List all snippets
curl "https://studiokook.ee/wp-json/code-snippets/v1/"

# 2. For each translation-related snippet:
#    - Extract the text it replaces
#    - Check trp-search if TRP can handle it
#    - If yes: migrate to TRP, deactivate snippet
#    - If no: keep snippet, rename to "TRP-fallback: ..."
```

### Update page SEO

```bash
curl -X POST ".../sk/v1/update-seo" \
  -d '{"page_id": 8, "title": "...", "description": "...", "lang": "ru"}'
```

## TranslatePress Internals

### How TRP works
1. Page renders in original language (et)
2. TRP intercepts HTML output
3. For each text node, TRP looks up `wp_trp_dictionary_{lang}` table
4. If match found (status=2) → replaces with translation
5. If no match → shows original (Estonian)

### Why translations "disappear"
- **Whitespace mismatch**: ` Text` ≠ `Text` (leading space = different entry)
- **HTML entity mismatch**: `&amp;` vs `&` in source
- **Elementor rebuild**: re-saving a page can change HTML structure
- **Emoji/special chars**: TranslatePress chokes on some Unicode

### Dictionary tables
- `wp_trp_dictionary_en_gb` — English translations
- `wp_trp_dictionary_ru_ru` — Russian translations
- `wp_trp_dictionary_fi` — Finnish translations

Each row: id, original, translated, status, original_id

### Table Architecture (КРИТИЧНО)

TranslatePress хранит переводы в ОТДЕЛЬНЫХ таблицах для каждой языковой пары:

| Таблица | Пара | Примечание |
|---|---|---|
| `wp_trp_dictionary_et_en_gb` | Estonian → English | **Основная** — trp-search и trp-untranslated читают отсюда |
| `wp_trp_dictionary_et_ru_ru` | Estonian → Russian | Отдельная таблица, свои ID |
| `wp_trp_dictionary_et_fi` | Estonian → Finnish | Отдельная таблица, свои ID |

**Критические правила:**

1. `trp-search` и `trp-untranslated` возвращают данные ТОЛЬКО из EN-таблицы
2. `?lang=` параметр в этих endpoints ИГНОРИРУЕТСЯ
3. `trp-update-by-id` обновляет записи ТОЛЬКО в EN-таблице
4. Для добавления RU перевода: `trp-add` с `lang: 'ru'` — пишет в `et_ru_ru`
5. Для добавления FI перевода: `trp-add` с `lang: 'fi'` — пишет в `et_fi`
6. ID в EN-таблице ≠ ID в RU-таблице для одной и той же строки

**Последствия:**
- "success: true" от trp-update-by-id НЕ означает что RU перевод обновлён
- После добавления перевода — ВСЕГДА открыть страницу и визуально проверить
- Для bulk RU переводов — использовать ТОЛЬКО `trp-add` с `lang: 'ru'`

## Page IDs Reference

| Page | ID | URL slug |
|---|---|---|
| Главная | 8 | / |
| (add others as discovered) | | |

## Plugin Dependencies

- TranslatePress Multilingual 2.7.4
- Elementor 3.25.11
- Code Snippets (for PHP customization)
- Yoast SEO
- Contact Form 7
- NextGEN Gallery
- Kadence Blocks
- Seraph Accel (caching)
- Xpro Theme Builder
- WP Abilities API (sk/v1 custom endpoints)
