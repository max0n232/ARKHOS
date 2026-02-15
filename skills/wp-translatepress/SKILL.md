---
name: wp-translatepress
description: "Use when fixing TranslatePress translations, diagnosing missing translations, or clearing translation cache. Covers: finding untranslated strings, adding translations via DB, clearing Seraphinite cache."
compatibility: "WordPress with TranslatePress plugin. Requires wp-abilities API (ngg-gallery/query) and Code Snippets plugin."
---

# TranslatePress Translation Fixes

## When to use

- Translations not showing on frontend (FI/EN/RU show Estonian text)
- Need to bulk-add or fix translations
- Cache shows old/wrong translations after update

## Prerequisites

- `credentials/wp_rest_api.json` — WordPress REST API auth
- `ngg-gallery/query` ability — SQL SELECT access
- Code Snippets plugin — for UPDATE operations

## Database Structure

```
wp_trp_original_strings     — source strings (Estonian)
  ├── id
  └── original

wp_trp_dictionary_et_fi     — ET → FI translations
wp_trp_dictionary_et_en_gb  — ET → EN translations
wp_trp_dictionary_et_ru_ru  — ET → RU translations
  ├── id
  ├── original_id           — FK to original_strings.id
  ├── original              — copy of source text
  ├── translated            — translation (empty = not translated)
  └── status                — 0=pending, 2=translated
```

## Procedure

### 1. Find untranslated strings

```bash
# Search by text fragment
curl -s -u "admin:APP_PASSWORD" -X POST \
  "https://studiokook.ee/wp-json/wp-abilities/v1/abilities/ngg-gallery/query/run" \
  -H "Content-Type: application/json" \
  -d '{"input": {"sql": "SELECT id, original FROM wp_trp_original_strings WHERE original LIKE \"%search text%\" LIMIT 20"}}'
```

### 2. Check translation status

```bash
# Replace LANG with: fi, en_gb, ru_ru
curl -s -u "admin:APP_PASSWORD" -X POST \
  "https://studiokook.ee/wp-json/wp-abilities/v1/abilities/ngg-gallery/query/run" \
  -H "Content-Type: application/json" \
  -d '{"input": {"sql": "SELECT id, original_id, translated, status FROM wp_trp_dictionary_et_LANG WHERE original_id IN (ID1, ID2, ID3)"}}'
```

**Status values:** `0` = not translated, `2` = translated

### 3. Add translation via Code Snippets

For UTF-8 characters (ö, ä, ü, –), use base64 encoding:

```bash
# Encode translation
TRANS=$(echo -n "Mittatilauskeittö Tallinnassa" | base64)

# Create and activate snippet
curl -s -u "admin:APP_PASSWORD" -X POST \
  "https://studiokook.ee/wp-json/code-snippets/v1/snippets" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "TRP Fix",
    "scope": "global",
    "active": true,
    "code": "global $wpdb; $wpdb->update(\"wp_trp_dictionary_et_fi\", array(\"translated\" => base64_decode(\"'$TRANS'\"), \"status\" => 2), array(\"id\" => ROW_ID));"
  }'
```

### 4. Delete snippet after execution

```bash
curl -s -u "admin:APP_PASSWORD" -X DELETE \
  "https://studiokook.ee/wp-json/code-snippets/v1/snippets/SNIPPET_ID"
```

### 5. Clear Seraphinite cache

```bash
curl -s -u "admin:APP_PASSWORD" -X POST \
  "https://studiokook.ee/wp-json/code-snippets/v1/snippets" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Clear Cache",
    "scope": "global",
    "active": true,
    "code": "$dir=WP_CONTENT_DIR.\"/cache\";function dr($d){if(!is_dir($d))return;foreach(scandir($d)as$i){if($i==\".\"||$i==\"..\")continue;$p=$d.\"/\".$i;is_dir($p)?dr($p):@unlink($p);}@rmdir($d);}foreach(glob($dir.\"/*\",GLOB_ONLYDIR)as$d){if(strpos(basename($d),\"seraph\")!==false)dr($d);}"
  }'

# Trigger execution
curl -s "https://studiokook.ee/" > /dev/null

# Delete snippet
curl -s -u "admin:APP_PASSWORD" -X DELETE \
  "https://studiokook.ee/wp-json/code-snippets/v1/snippets/SNIPPET_ID"
```

## Verification

```bash
# Check H1 on translated page
curl -s "https://studiokook.ee/fi/" | grep -o '<h1[^>]*>[^<]*</h1>'
```

## Common issues

| Problem | Cause | Solution |
|---------|-------|----------|
| Translation in DB but not on page | Seraphinite cache | Clear cache (step 5) |
| `status=0` in dictionary | Not marked as translated | Set `status=2` in UPDATE |
| Special chars broken (ö→o) | JSON encoding issue | Use base64 for UTF-8 |
| String not in original_strings | Never detected by TRP | Visit page in translation editor |
