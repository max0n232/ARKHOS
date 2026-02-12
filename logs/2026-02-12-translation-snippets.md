# Translation Snippets Audit - studiokook.ee

**Date:** 2026-02-12
**Site:** https://studiokook.ee
**Total Code Snippets:** 204
**Active snippets:** 24 (11.8%)
**Translation-related:** 109 (53.4%)
**Active translation snippets:** 15 (7.4%)

---

## Summary

- **Total snippets:** 204
- **Active snippets:** 24 (11.8%)
- **Translation-related:** 109 (53.4%)
- **Active translation snippets:** 15 (7.4%)
- **Can migrate to TRP:** 4
- **Must keep as snippet:** 11

---

## ACTIVE Translation Snippets

### Migration Candidates

#### 1. Snippet: SEO Meta v5.1 Complete (ID: 105)
- **Status:** Active
- **Purpose:** Hardcoded title + description + OG translations for RU/EN/FI pages
- **Original text examples:**
  - ET: "Köögi mööbel Tallinnas | Studioköök"
  - RU: "Кухни на заказ в Таллинне | Кухонная мебель | Studioköök"
  - EN: "Custom Kitchens in Tallinn | Kitchen Furniture | Studioköök"
  - FI: "Mittatilauskeittöt Tallinnassa | Keittiökalusteet | Studioköök"
- **Target languages:** RU, EN, FI
- **Applies to:** Homepage, kontakt, hinnaparing, koogid-eritellimusel pages
- **Migration:** YES
- **Reason:** All hardcoded translations can be moved to TRP dictionary. Uses filters to override titles/descriptions based on language detection. TRP can handle this natively if translations are in the database.

#### 2. Snippet: Yoast Schema Language Filter (ID: 220)
- **Status:** Active
- **Purpose:** Override Yoast schema description for EN locale
- **Original:** (uses site default)
- **Translation:** "Custom kitchen furniture in Tallinn. Bespoke kitchens with individual measurements and designs."
- **Language:** EN
- **Migration:** YES
- **Reason:** Static translation can be added to TRP. Schema filters can check TRP translations instead.

#### 3. Snippet: Localized 404 Titles (ID: 227)
- **Status:** Active
- **Purpose:** Localized 404 page titles
- **Translations:**
  - ET: "Lehte ei leitud - Studioköök"
  - RU: "Страница не найдена - Studioköök"
  - EN: "Page not found - Studioköök"
  - FI: "Sivua ei löytynyt - Studioköök"
- **Migration:** PARTIAL
- **Reason:** 404 titles are dynamic. Can add translations to TRP but snippet logic (detecting lang from URI) may still be needed since 404 pages don't have language context automatically.

#### 4. Snippet: SK hreflang x-default fix (ID: 207)
- **Status:** Active
- **Tags:** seo, hreflang
- **Purpose:** Add x-default hreflang tag, remove TRP's x-default
- **Migration:** NO (keep as snippet)
- **Reason:** This is SEO technical implementation, not translation content. Must remain as code to control hreflang behavior.

---

### Must Keep as Snippets

#### 1. Snippet: SEO Schemas Output (ID: 102)
- **Status:** Active
- **Tags:** seo
- **Purpose:** Outputs FAQ and Product JSON-LD schemas based on current language
- **Migration:** NO
- **Reason:** Dynamic schema generation based on language. Contains logic, not just translations. TRP cannot handle structured data generation.

#### 2. Snippet: Fix TRP Dicts (ID: 165)
- **Status:** Active
- **Purpose:** Database update - fixes old address "Pärnu mnt 139c" to new "Paldiski mnt 21"
- **Migration:** NO (maintenance snippet)
- **Reason:** This is a data migration utility, not active translation logic. Should be deactivated after migration is complete.

#### 3. Snippet: Fix TRP Tasuta (ID: 167)
- **Status:** Active
- **Purpose:** Database cleanup - removes "Tasuta " prefix from translations
- **Migration:** NO (maintenance snippet)
- **Reason:** Data cleanup utility. Should be deactivated after cleanup is complete.

#### 4. Snippet: DEBUG TRP Settings (ID: 198)
- **Status:** Active
- **Purpose:** REST API endpoints for debugging TRP translations
- **Endpoints:**
  - `/sk/v1/trp-untranslated` - Lists untranslated entries
  - `/sk/v1/trp-search` - Search translations
  - `/sk/v1/trp-update` - Update translation by ID
- **Migration:** NO (keep as tool)
- **Reason:** Development/debugging tool. Useful for TranslatePress management.

#### 5. Snippet: SK TRP Clean Emoji (ID: 208)
- **Status:** Active
- **Tags:** trp, cleanup
- **Purpose:** REST API to clean emoji characters from TRP dictionaries
- **Migration:** NO (maintenance tool)
- **Reason:** Data cleanup utility. Keep for maintenance.

#### 6. Snippet: SK TRP Add Translation (ID: 209)
- **Status:** Active
- **Tags:** trp
- **Purpose:** REST API to add/update translations programmatically
- **Migration:** NO (keep as tool)
- **Reason:** Development tool for bulk translation management.

#### 7. Snippet: SK TRP Insert Translations (ID: 210)
- **Status:** Active
- **Tags:** trp
- **Purpose:** REST API for bulk translation insert
- **Migration:** NO (keep as tool)
- **Reason:** Bulk operations tool. Useful for TranslatePress data management.

#### 8. Snippet: SK TRP Update By ID (ID: 211)
- **Status:** Active
- **Tags:** trp
- **Purpose:** REST API to update multiple translations by ID
- **Migration:** NO (keep as tool)
- **Reason:** Bulk update utility for TRP.

#### 9. Snippet: SK TRP Update ID v4 (ID: 216)
- **Status:** Active
- **Tags:** trp
- **Purpose:** REST API to update single translation by ID
- **Migration:** NO (keep as tool)
- **Reason:** TRP management tool.

#### 10. Snippet: SK FAQ Schema by Page (ID: 206)
- **Status:** Active
- **Tags:** seo, schema, faq
- **Purpose:** Adds FAQ Schema to pages with language detection
- **Migration:** NO (keep as snippet)
- **Reason:** Dynamic structured data generation with TRP language detection. Cannot be handled by TRP alone - requires PHP logic.

#### 11. Snippet: SK Elementor Data API (ID: 212)
- **Status:** Active
- **Tags:** elementor, api
- **Purpose:** REST API for reading and updating Elementor content
- **Migration:** NO (keep as tool)
- **Reason:** Development tool for Elementor content management. Not related to visible translations but useful for bulk content operations.

---

## Inactive Translation Snippets (Historical)

These snippets contain translation work but are currently **inactive**. Listed for reference:

| ID | Name | Purpose |
|----|------|---------|
| 97 | SNIPPET_TRANSLATIONS_HPL | HPL translations (old) |
| 98 | SNIPPET_TRANSLATIONS_HPL | HPL translations duplicate (old) |
| 103 | Hreflang Tags Output | Hreflang implementation (replaced) |
| 107-110 | TRP Tables Check/Debug/Structure/Fix | TRP debugging (old) |
| 113 | TRP Test | Testing snippet |
| 115-134 | Fix Materjalid/Kontakt/Toopinnad/etc RU/EN/FI | Page-specific translation fixes (completed) |
| 135-140 | Fix Address/Remove Free | Address update + cleanup (completed) |
| 145-147 | Find/Show/Fix 139c | Address migration (completed) |
| 166-169 | Check/Fix Kontakt | Kontakt page fixes (completed) |
| 193-196 | SEO Fix og site_name/hreflang | SEO fixes (replaced) |
| 199-201 | TRP Translation Fix Homepage/Clear | Homepage fixes (completed) |
| 213, 215 | SK TRP Update by ID (old versions) | Replaced by v4 (ID 216) |
| 218, 221 | TMP Debug Lang | Temporary debugging |
| 223-225 | Footer/Menu/CTA Translations | Page element translations (completed) |

---

## Migration Strategy

### Phase 1: Content Migration to TRP
1. **Extract hardcoded translations from Snippet 105** → Add to TRP dictionary
2. **Extract schema descriptions from Snippet 220** → Add to TRP
3. **Extract 404 titles from Snippet 227** → Add to TRP (if possible)

### Phase 2: Refactor Active Snippets
1. **Snippet 105 (SEO Meta):** Replace with TRP-aware filters that fetch from TRP dictionary
2. **Snippet 220 (Schema):** Update to use `trp_translate()` function
3. **Snippet 227 (404):** Keep logic, but fetch strings from TRP

### Phase 3: Cleanup
1. **Deactivate maintenance snippets:** 165, 167 (after verifying data is fixed)
2. **Review debug/tool snippets:** Keep 198, 208-211, 216 as they're useful for TRP management
3. **Delete old inactive snippets:** 97-98, 103, 107-110, 113, 115-140, 145-147, etc.

---

## Technical Notes

### Current Translation Architecture
- **TranslatePress:** Primary translation system (dictionary tables exist)
- **Code Snippets:** Override/supplement TRP with hardcoded translations
- **Yoast SEO:** Uses filters for meta translations

### Key Findings
1. **Duplicate logic:** Snippet 105 reimplements translation detection that TRP already provides
2. **Hardcoded content:** ~50+ translations in Snippet 105 should be in TRP database
3. **Mixed approach:** Some translations in TRP DB, some in snippets = inconsistent
4. **Historical debt:** 51 inactive snippets from past migration work

### Recommended Approach
- **Prefer TRP dictionary** for all static text translations
- **Use snippets only for:**
  - Technical SEO implementation (hreflang, schemas)
  - Dynamic content generation
  - Development/debugging tools
- **Avoid snippets for:** Simple text replacements that TRP can handle

---

## Next Steps

1. **Audit current TRP dictionary** to see what's already translated
2. **Extract all hardcoded translations** from Snippet 105 → CSV/JSON
3. **Bulk import to TRP** using Snippet 210 (SK TRP Insert Translations)
4. **Test** each page in all languages
5. **Refactor Snippet 105** to use TRP translations
6. **Verify** all pages still work correctly
7. **Deactivate/delete** old snippets

---

## Files Referenced

- **Active snippets:** 102, 105, 165, 167, 198, 207-211, 216, 220, 227
- **TRP tables:** `wp_trp_dictionary_et_ru_ru`, `wp_trp_dictionary_et_en_gb`, `wp_trp_dictionary_et_fi`
- **REST endpoints:** `/sk/v1/trp-*` (various TRP management endpoints)
