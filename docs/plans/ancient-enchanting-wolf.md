# Plan: Fix Estonian Text on English Version of studiokook.ee

## Problem Summary

The English version (`/en/`) displays Estonian text in:

1. **Schema.org JSON-LD** — FAQ questions/answers, business description
2. **Image Alt Text** — "Modern valge eritellimuskööк baaritoolidega..."
3. **TranslatePress strings** — Some entries with status=0

## Root Cause Analysis

### Schema Sources (confirmed via Code Snippets API)

| Schema Type | Source | Snippet ID | Status |
|-------------|--------|------------|--------|
| FAQ Schema | Custom Code Snippet | #102 | Issues |
| LocalBusiness/FurnitureStore | Custom Code Snippet | #197 | ACTIVE |
| WebPage/Breadcrumb | Yoast SEO | — | OK |

**Key Finding:** Estonian text in schema comes from **custom Code Snippets**, NOT Yoast SEO.

### FAQ Schema (#102) Contains Estonian Text:
- "Kui palju maksab eritellimusköök?" (How much does a custom kitchen cost?)
- "Kui kaua võtab aega köögimööbli valmistamine?" (How long does kitchen furniture making take?)
- "Kas 3D-projekt on tasuta?" (Is 3D project free?)
- "Milliseid materjale te kasutate?" (What materials do you use?)
- "Kas te pakute garantiid?" (Do you offer warranties?)

---

## Implementation Plan

### Step 1: Modify Snippet #102 — Language-Aware FAQ Schema

**Current problem:** FAQ schema reads from single field `_seo_faq_schema` regardless of language.

**Solution:** Change `studiokook_output_seo_schemas()` to detect language and use `_seo_faq_schema_{lang}`:

```php
function studiokook_output_seo_schemas() {
    if (!is_singular()) return;
    $post_id = get_the_ID();
    if (!$post_id) return;

    // Detect current language
    $lang = 'et';
    if (function_exists('trp_get_current_language')) {
        $lang = trp_get_current_language();
    } elseif (isset($_GET['lang'])) {
        $lang = sanitize_key($_GET['lang']);
    }

    // Map TRP codes to meta suffix
    $lang_map = ['en_GB' => 'en', 'ru_RU' => 'ru', 'fi' => 'fi', 'et' => 'et'];
    $lang_suffix = isset($lang_map[$lang]) ? $lang_map[$lang] : 'et';

    // Try language-specific FAQ, fallback to Estonian
    $faq_schema = get_post_meta($post_id, '_seo_faq_schema_' . $lang_suffix, true);
    if (!$faq_schema) {
        $faq_schema = get_post_meta($post_id, '_seo_faq_schema', true); // fallback
    }

    if ($faq_schema && !empty(trim($faq_schema))) {
        echo "\n<script type=\"application/ld+json\">" . $faq_schema . "</script>\n";
    }

    // Product schema (same logic)
    $product_schema = get_post_meta($post_id, '_seo_product_schema_' . $lang_suffix, true);
    if (!$product_schema) {
        $product_schema = get_post_meta($post_id, '_seo_product_schema', true);
    }
    if ($product_schema && !empty(trim($product_schema))) {
        echo "<script type=\"application/ld+json\">" . $product_schema . "</script>\n";
    }
}
```

### Step 2: Create English FAQ Schema Meta

Add post meta `_seo_faq_schema_en` for page ID 8 with translated content:

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How much does a custom kitchen cost?",
      "acceptedAnswer": {"@type": "Answer", "text": "Custom kitchens start from €2,500..."}
    },
    {
      "@type": "Question",
      "name": "How long does kitchen furniture production take?",
      "acceptedAnswer": {"@type": "Answer", "text": "Production typically takes 4-6 weeks..."}
    },
    {
      "@type": "Question",
      "name": "Is the 3D design free?",
      "acceptedAnswer": {"@type": "Answer", "text": "Yes, 3D visualization is included..."}
    },
    {
      "@type": "Question",
      "name": "What materials do you use?",
      "acceptedAnswer": {"@type": "Answer", "text": "We use high-quality materials including Austrian fittings..."}
    },
    {
      "@type": "Question",
      "name": "Do you offer a warranty?",
      "acceptedAnswer": {"@type": "Answer", "text": "Yes, we provide warranty on all kitchen furniture..."}
    }
  ]
}
```

### Step 3: Fix Image Alt Texts via TranslatePress

```bash
# Search for Estonian image alts
curl -u "admin:APP" "https://studiokook.ee/wp-json/sk/v1/trp-search?q=valge"

# Update each found entry
curl -X POST -u "admin:APP" "https://studiokook.ee/wp-json/sk/v1/trp-update-id" \
  -H "Content-Type: application/json" \
  -d '{"id": ID, "translated": "Modern white custom kitchen with bar stools and wood ceiling details", "lang": "en_gb"}'
```

### Step 4: Clear All Caches

```bash
curl -u "admin:APP" "https://studiokook.ee/wp-json/sk/v1/full-clear"
```

### Step 5: Verify & Audit Other Pages

1. Check `/en/` homepage for correct schema
2. Check other pages if they exist

---

## Translation Mapping

| Estonian | English |
|----------|---------|
| Kui palju maksab eritellimusköök? | How much does a custom kitchen cost? |
| Kui kaua võtab aega köögimööbli valmistamine? | How long does kitchen furniture production take? |
| Kas 3D-projekt on tasuta? | Is the 3D design free? |
| Milliseid materjale te kasutate? | What materials do you use? |
| Kas te pakute garantiid? | Do you offer a warranty? |
| Modern valge eritellimuskööк baaritoolidega ja puitlae detailidega | Modern white custom kitchen with bar stools and wood ceiling details |
| köögimööbel | kitchen furniture |
| eritellimusköök | custom kitchen |

---

## Files to Modify

1. **Code Snippet #102** — Add language detection for FAQ/Product schema output
2. **Post Meta (page 8)** — Add `_seo_faq_schema_en` with English FAQ content
3. **TranslatePress Dictionary** — Add missing EN translations for image alts

## REST API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/wp-json/code-snippets/v1/snippets/102` | PUT | Update snippet code |
| `/sk/v1/trp-search?q=` | GET | Search translations |
| `/sk/v1/trp-update-id` | POST | Update translation |
| `/sk/v1/full-clear` | GET | Clear all caches |

## Execution Sequence

1. Update Snippet #102 code via REST API
2. Add `_seo_faq_schema_en` post meta for page 8
3. Search & fix TranslatePress image alt translations
4. Clear caches
5. Verify

## Verification

1. `curl https://studiokook.ee/en/ | grep -A20 "FAQPage"` → English FAQ
2. View page source → Check `<img alt="">` attributes
3. Google Rich Results Test: https://search.google.com/test/rich-results?url=https://studiokook.ee/en/
