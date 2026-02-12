# TranslatePress REST API Reference - studiokook.ee

**Date:** 2026-02-12
**Base URL:** https://studiokook.ee
**Auth:** WordPress authentication required (cookies or app password)

---

## Available Endpoints

### 1. Debug & Search

#### GET `/sk/v1/trp-untranslated`
**Source:** Snippet 198 (DEBUG TRP Settings)
**Purpose:** Get list of untranslated entries

**Response:**
```json
[
  {
    "id": 123,
    "original": "Some text"
  }
]
```

**Limit:** 50 most recent untranslated entries

---

#### GET `/sk/v1/trp-search?q={query}`
**Source:** Snippet 198 (DEBUG TRP Settings)
**Purpose:** Search translations by keyword

**Parameters:**
- `q` (required) - Search query

**Response:**
```json
[
  {
    "id": 123,
    "original": "Hello",
    "translated": "Tere",
    "status": 2
  }
]
```

**Limit:** 20 results

---

### 2. Single Translation Update

#### POST `/sk/v1/trp-update`
**Source:** Snippet 198 (DEBUG TRP Settings)
**Purpose:** Update single translation

**Body:**
```json
{
  "id": 123,
  "translated": "New translation"
}
```

**Table:** `wp_trp_dictionary_et_en_gb` (hardcoded to EN)

---

#### POST `/sk/v1/trp-update-id`
**Source:** Snippet 216 (SK TRP Update ID v4)
**Purpose:** Update translation by ID with language selection

**Body:**
```json
{
  "id": 123,
  "translated": "New translation",
  "lang": "en_gb"
}
```

**Parameters:**
- `id` (required) - Translation row ID
- `translated` (required) - New translation text
- `lang` (optional) - Target language (default: "en_gb")
  - Options: "en_gb", "ru_ru", "fi"

**Response:**
```json
{
  "success": true,
  "rows_affected": 1
}
```

**Error Response:**
```json
{
  "code": "missing",
  "message": "id and translated required",
  "data": {"status": 400}
}
```

---

### 3. Add/Insert Translations

#### POST `/sk/v1/trp-add`
**Source:** Snippet 209 (SK TRP Add Translation)
**Purpose:** Add or update single translation

**Body:**
```json
{
  "lang": "en_gb",
  "original": "Original text",
  "translated": "Translated text"
}
```

**Response:**
```json
{
  "action": "updated",
  "id": 123
}
```
or
```json
{
  "action": "inserted",
  "id": 456
}
```

**Behavior:**
- If `original` exists → updates translation
- If `original` doesn't exist → inserts new row

---

#### POST `/sk/v1/trp-insert`
**Source:** Snippet 210 (SK TRP Insert Translations)
**Purpose:** Bulk insert/update translations

**Body:**
```json
{
  "lang": "en_gb",
  "translations": [
    {
      "original": "Text 1",
      "translated": "Translation 1"
    },
    {
      "original": "Text 2",
      "translated": "Translation 2"
    }
  ]
}
```

**Response:**
```json
{
  "inserted": 2,
  "skipped": 0
}
```

**Behavior:** Skips existing entries, inserts only new ones

---

#### POST `/sk/v1/trp-update-by-id`
**Source:** Snippet 211 (SK TRP Update By ID)
**Purpose:** Bulk update translations by ID

**Body:**
```json
{
  "lang": "en_gb",
  "updates": [
    {
      "id": 123,
      "translated": "New translation 1"
    },
    {
      "id": 456,
      "translated": "New translation 2"
    }
  ]
}
```

**Response:**
```json
{
  "updated": 2
}
```

---

### 4. Maintenance Operations

#### POST `/sk/v1/trp-clean-emoji`
**Source:** Snippet 208 (SK TRP Clean Emoji)
**Purpose:** Remove emoji characters from all TRP dictionary tables

**Response:**
```json
{
  "updated": 15,
  "tables_processed": 3
}
```

**Warning:** Affects ALL TRP dictionary tables

---

#### GET `/sk/v1/fix-trp-dicts`
**Source:** Snippet 165 (Fix TRP Dicts)
**Purpose:** Replace old address with new address in all dictionaries

**Operation:** Replaces "Pärnu mnt 139c" → "Paldiski mnt 21"

**Response:**
```json
{
  "ru": 3,
  "en": 2,
  "fi": 1
}
```

**Warning:** Should be run ONCE and then snippet deactivated

---

#### GET `/sk/v1/fix-trp-tasuta`
**Source:** Snippet 167 (Fix TRP Tasuta)
**Purpose:** Remove "Tasuta " prefix from translations

**Response:**
```json
{
  "ru": 5,
  "en": 4,
  "fi": 3
}
```

**Warning:** Should be run ONCE and then snippet deactivated

---

### 5. Elementor API

#### GET `/sk/v1/elementor/{post_id}`
**Source:** Snippet 212 (SK Elementor Data API)
**Purpose:** Get Elementor page data

**Response:**
```json
{
  "post_id": 123,
  "data": "...Elementor JSON..."
}
```

---

#### POST `/sk/v1/elementor/{post_id}`
**Source:** Snippet 212 (SK Elementor Data API)
**Purpose:** Update Elementor page data

**Body:**
```json
{
  "data": "...Elementor JSON..."
}
```

**Response:**
```json
{
  "success": true
}
```

---

### 6. FAQ Schema

#### POST `/sk/v1/faq`
**Source:** Snippet 206 (SK FAQ Schema by Page)
**Purpose:** Add FAQ schema to page

**Body:**
```json
{
  "page_id": 8,
  "faqs": [
    {
      "question": "Question 1?",
      "answer": "Answer 1"
    }
  ]
}
```

---

## Language Codes

| Language | TRP Code | Table Suffix |
|----------|----------|--------------|
| English | `en_gb` | `et_en_gb` |
| Russian | `ru_ru` | `et_ru_ru` |
| Finnish | `fi` | `et_fi` |
| Estonian | `et` | (original) |

---

## Translation Status Codes

| Status | Meaning |
|--------|---------|
| 0 | Untranslated |
| 1 | Needs review |
| 2 | Translated (approved) |

---

## Table Structure

**Format:** `wp_trp_dictionary_{source_lang}_{target_lang}`

**Examples:**
- `wp_trp_dictionary_et_en_gb` - Estonian → English
- `wp_trp_dictionary_et_ru_ru` - Estonian → Russian
- `wp_trp_dictionary_et_fi` - Estonian → Finnish

**Columns:**
- `id` - Primary key
- `original` - Original text (Estonian)
- `translated` - Translation
- `status` - Translation status (0, 1, 2)

---

## Usage Examples

### Example 1: Add single translation
```bash
curl -X POST https://studiokook.ee/sk/v1/trp-add \
  -H "Content-Type: application/json" \
  -u "admin:APP_PASSWORD" \
  -d '{
    "lang": "en_gb",
    "original": "Köögi mööbel",
    "translated": "Kitchen furniture"
  }'
```

### Example 2: Bulk insert translations
```bash
curl -X POST https://studiokook.ee/sk/v1/trp-insert \
  -H "Content-Type: application/json" \
  -u "admin:APP_PASSWORD" \
  -d '{
    "lang": "en_gb",
    "translations": [
      {"original": "Köögi mööbel", "translated": "Kitchen furniture"},
      {"original": "Kontakt", "translated": "Contact"}
    ]
  }'
```

### Example 3: Update by ID
```bash
curl -X POST https://studiokook.ee/sk/v1/trp-update-id \
  -H "Content-Type: application/json" \
  -u "admin:APP_PASSWORD" \
  -d '{
    "id": 123,
    "translated": "Updated translation",
    "lang": "en_gb"
  }'
```

### Example 4: Search translations
```bash
curl "https://studiokook.ee/sk/v1/trp-search?q=kitchen" \
  -u "admin:APP_PASSWORD"
```

### Example 5: Get untranslated entries
```bash
curl "https://studiokook.ee/sk/v1/trp-untranslated" \
  -u "admin:APP_PASSWORD"
```

---

## Best Practices

1. **Use bulk operations** (trp-insert, trp-update-by-id) for multiple translations
2. **Set status=2** for approved translations
3. **Clear cache** after bulk operations
4. **Test on staging** before production updates
5. **Backup database** before maintenance operations (clean-emoji, fix-dicts)

---

## Security Notes

- All endpoints require authentication
- Some endpoints use `permission_callback => '__return_true'` (not recommended for production)
- Consider adding proper capability checks (e.g., `manage_options`)
- Input sanitization is minimal - be careful with user input

---

## Related Files

- **Full audit:** `2026-02-12-translation-snippets.md`
- **Snippet code:** `2026-02-12-key-snippets-code.md`
- **Executive summary:** `2026-02-12-audit-executive-summary.md`
