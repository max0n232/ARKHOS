# Translation Guide for studiokook.ee

## Architecture

- **CMS:** WordPress + TranslatePress 2.7.4
- **Storage:** wp_trp_dictionary_* tables
- **Languages:** et (primary), ru, en_gb, fi
- **Custom API:** sk/v1 endpoints

## FORBIDDEN

- Creating snippets for text that can be added to TranslatePress
- Creating snippets without checking sk/v1/trp-search first
- Changing Elementor content without verifying it fixes the issue

## Required Workflow

### Step 1: Diagnose

```bash
# Search for text in TranslatePress dictionary
curl -u "admin:APP_PASSWORD" "studiokook.ee/wp-json/sk/v1/trp-search?q={text}"
```

Check: Does entry exist? What status? Are there duplicates?

### Step 2: Choose method

| Condition | Method |
|-----------|--------|
| status=0, entry exists | `trp-update-by-id` (add translation) |
| No entry | `trp-add` (create entry with translation) |
| Duplicates with whitespace | `elementor/{id}/replace` (clean) + `trp-update` |
| None of above | Snippet (with documentation) |

### Step 3: Apply

```bash
# Update existing entry
curl -X POST -u "admin:APP_PASSWORD" "studiokook.ee/wp-json/sk/v1/trp-update-id" \
  -H "Content-Type: application/json" \
  -d '{"id":1234,"translated":"Translated text","lang":"ru_ru"}'

# Add new translation
curl -X POST -u "admin:APP_PASSWORD" "studiokook.ee/wp-json/sk/v1/trp-add" \
  -H "Content-Type: application/json" \
  -d '{"original":"Estonian text","translated":"Translated text","lang":"ru_ru"}'
```

### Step 4: Verify

Open page in browser at target language URL, confirm translation displays.

## API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `sk/v1/trp-untranslated` | GET | List untranslated strings |
| `sk/v1/trp-search?q=text` | GET | Search dictionary |
| `sk/v1/trp-add` | POST | Add new translation |
| `sk/v1/trp-update-id` | POST | Update by ID |
| `sk/v1/trp-update-by-id` | POST | Update by ID (alias) |
| `sk/v1/elementor/{id}` | GET | Get Elementor content |
| `sk/v1/elementor/{id}/replace` | POST | Search/replace in Elementor |
| `sk/v1/fix-trp-dicts` | POST | Fix dictionaries |

## Language Codes

| Display | TRP Code | Locale |
|---------|----------|--------|
| Estonian | et | et |
| Russian | ru_ru | ru_RU |
| English | en_gb | en_GB |
| Finnish | fi | fi |

## Snippet Format (last resort only)

```php
/**
 * TRP-fallback: {Page} - {Description}
 * Reason: {Why TranslatePress cannot handle this}
 * Languages: {RU, EN, FI}
 * Date: YYYY-MM-DD
 */
add_filter('the_content', function($content) {
    if (get_locale() === 'ru_RU' && is_page(PAGE_ID)) {
        $content = str_replace('Estonian text', 'Russian text', $content);
    }
    return $content;
});
```
