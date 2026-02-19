---
name: wp-elementor
description: "Use when reading or editing Elementor page content via REST API. Supports: reading _elementor_data, search/replace text, updating full content, cache clearing."
compatibility: "studiokook.ee with Code Snippets ID: 212 (SK Elementor Data API)"
---

# WP Elementor API

## When to use

Use this skill when you need to:

- Read Elementor page content programmatically
- Search and replace text in Elementor pages
- Update Elementor content without using the visual editor
- Fix translation issues in Elementor data
- Remove unwanted characters (emojis, non-breaking spaces, etc.)
- Bulk edit text across Elementor widgets

## Prerequisites

- Code Snippet ID: 212 (SK Elementor Data API) must be active
- WordPress REST API authentication (Basic Auth with app password)

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/sk/v1/elementor/{id}` | GET | Read Elementor data for a page |
| `/sk/v1/elementor/{id}` | POST | Full update of Elementor data |
| `/sk/v1/elementor/{id}/replace` | POST | Search/replace in Elementor data |

## Procedure

### 1) Read Elementor Data

```bash
curl -u "admin:APP_PASSWORD" "https://studiokook.ee/wp-json/sk/v1/elementor/{page_id}"
```

Response:
```json
{
  "post_id": 8,
  "data": [...],  // Parsed JSON array of widgets
  "raw": "..."    // Original JSON string
}
```

### 2) Search and Replace

```bash
curl -X POST -u "admin:APP_PASSWORD" \
  "https://studiokook.ee/wp-json/sk/v1/elementor/{page_id}/replace" \
  -H "Content-Type: application/json" \
  -d '{"search":"old text","replace":"new text"}'
```

Response:
```json
{
  "success": true,
  "replacements": 3,
  "post_id": 8
}
```

### 3) Full Update (advanced)

```bash
curl -X POST -u "admin:APP_PASSWORD" \
  "https://studiokook.ee/wp-json/sk/v1/elementor/{page_id}" \
  -H "Content-Type: application/json" \
  -d '{"data": [...]}'
```

## Important Notes

### Data Structure

Elementor stores content in `_elementor_data` post meta as JSON. Structure:

```
[
  {
    "id": "abc123",
    "elType": "section",
    "elements": [
      {
        "id": "def456",
        "elType": "column",
        "elements": [
          {
            "id": "ghi789",
            "elType": "widget",
            "widgetType": "heading",
            "settings": {
              "title": "Your text here"
            }
          }
        ]
      }
    ]
  }
]
```

### Character Encoding

- Non-breaking spaces stored as `\u00a0` in JSON
- To remove: search for literal `\u00a0` string in raw data
- Emojis stored as unicode characters

### Backup

API automatically creates backup in `_elementor_data_backup` before updates.

### Cache

API automatically clears Elementor cache after updates. For full cache clear:

```bash
curl -u "admin:APP_PASSWORD" "https://studiokook.ee/wp-json/sk/v1/full-clear"
```

## Common Patterns

### Remove emojis from text

```bash
# Find text with emoji
curl -u "admin:APP_PASSWORD" "https://studiokook.ee/wp-json/sk/v1/elementor/8" | grep -o "🛠️[^\"]*"

# Replace
curl -X POST -u "admin:APP_PASSWORD" \
  "https://studiokook.ee/wp-json/sk/v1/elementor/8/replace" \
  -d '{"search":"🛠️ Text","replace":"Text"}'
```

### Remove non-breaking spaces

```bash
curl -X POST -u "admin:APP_PASSWORD" \
  "https://studiokook.ee/wp-json/sk/v1/elementor/8/replace" \
  -d '{"search":"\\u00a0","replace":" "}'
```

### Find specific widget text

```python
import requests
import json

auth = ('admin', 'APP_PASSWORD')
r = requests.get('https://studiokook.ee/wp-json/sk/v1/elementor/8', auth=auth)
data = r.json()['data']

def find_text(elements, search):
    results = []
    for el in elements:
        if 'settings' in el:
            for key, val in el['settings'].items():
                if isinstance(val, str) and search in val:
                    results.append({'widget_id': el['id'], 'key': key, 'value': val})
        if 'elements' in el:
            results.extend(find_text(el['elements'], search))
    return results

print(find_text(data, 'keyword'))
```

## Integration with TranslatePress

Elementor content appears in TranslatePress dictionary. Workflow:

1. Edit Estonian text in Elementor (source)
2. TranslatePress picks up as original
3. Update translations via `/sk/v1/trp-update-id`

See `skills/wp-translatepress/SKILL.md` for translation updates.

## Failure Modes

| Error | Cause | Fix |
|-------|-------|-----|
| 404 No Elementor data | Page not built with Elementor | Check page_id |
| 401 Unauthorized | Missing/wrong credentials | Check app password |
| 0 replacements | Search string not found | Check exact string, encoding |
| Site crash | Used wp_update_post() | Fixed in snippet - uses update_post_meta |

## Page IDs (studiokook.ee)

| Page | ID | Language |
|------|----|----------|
| Homepage | 8 | ET (primary) |
| Homepage EN | 8 (translated) | EN |
| Homepage RU | 8 (translated) | RU |
| Homepage FI | 8 (translated) | FI |

Note: TranslatePress uses same page_id for all languages. Elementor data is same, translations stored in `wp_trp_dictionary_et_*` tables.

## Verification

1. Read endpoint returns valid JSON with `data` array
2. Replace endpoint returns `replacements` count > 0
3. Frontend shows updated content after cache clear
4. Backup created in `_elementor_data_backup`
