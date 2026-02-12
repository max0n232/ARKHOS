# Translation Snippets Audit - Executive Summary

**Date:** 2026-02-12
**Site:** https://studiokook.ee
**Auditor:** Claude Code

---

## Key Findings

### Current State
- **Total Code Snippets:** 204
- **Active:** 24 (11.8%)
- **Inactive:** 180 (88.2%)
- **Translation-related:** 109 (53.4% of all snippets)
- **Active translation snippets:** 15 (7.4% of all snippets)

### Critical Issues

1. **Fragmented Translation System**
   - TranslatePress is installed but underutilized
   - ~50+ hardcoded translations in Code Snippets (especially Snippet 105)
   - Mixed approach creates maintenance burden

2. **Technical Debt**
   - 180 inactive snippets (88.2% of total)
   - Many are historical migration/cleanup tasks that should be deleted
   - Duplicate functionality across multiple snippets

3. **Migration Opportunities**
   - 4 active snippets can be fully migrated to TRP
   - Estimated 50+ hardcoded translations should move to TRP dictionary
   - Would simplify architecture and improve maintainability

---

## Active Translation Snippets Breakdown

### Can Migrate to TRP (4 snippets)

| ID | Name | Priority | Effort |
|----|------|----------|--------|
| 105 | SEO Meta v5.1 Complete | HIGH | 4-6h |
| 220 | Yoast Schema Language Filter | MEDIUM | 1-2h |
| 227 | Localized 404 Titles | LOW | 1-2h |
| 207 | SK hreflang x-default fix | N/A | Keep as-is (SEO technical) |

### Must Keep as Snippets (11 snippets)

**Active Production:**
- **102** - SEO Schemas Output (dynamic schema generation)
- **206** - SK FAQ Schema by Page (language-aware schemas)
- **207** - SK hreflang x-default fix (SEO technical implementation)

**TRP Management Tools (keep):**
- **198** - DEBUG TRP Settings (REST API for debugging)
- **209** - SK TRP Add Translation (programmatic translation management)
- **210** - SK TRP Insert Translations (bulk insert)
- **211** - SK TRP Update By ID (bulk update)
- **216** - SK TRP Update ID v4 (single update)
- **212** - SK Elementor Data API (content management tool)

**Maintenance/Cleanup (review & deactivate):**
- **165** - Fix TRP Dicts (address migration - can deactivate after verification)
- **167** - Fix TRP Tasuta (cleanup - can deactivate after verification)
- **208** - SK TRP Clean Emoji (maintenance tool - keep but rarely used)

---

## Recommended Actions

### Phase 1: Quick Wins (Week 1)
1. **Audit TRP dictionary** - Check what's already translated
2. **Deactivate completed maintenance snippets** - Review 165, 167 (if data is fixed)
3. **Delete inactive historical snippets** - Remove 51+ old migration snippets

### Phase 2: Content Migration (Week 2-3)
1. **Extract hardcoded translations from Snippet 105**
   - ~50+ title/description translations across 4+ languages
2. **Bulk import to TRP** using Snippet 210 REST API
3. **Verify translations** in TRP admin panel

### Phase 3: Refactoring (Week 3-4)
1. **Refactor Snippet 105** - Replace hardcoded arrays with TRP lookups
2. **Update Snippet 220** - Use `trp_translate()` instead of hardcoded strings
3. **Test Snippet 227** - Verify if TRP can handle 404 translations

### Phase 4: Testing & Cleanup (Week 4)
1. **Test all pages in all languages** (ET, RU, EN, FI)
2. **Verify SEO tags** (titles, descriptions, OG tags)
3. **Check schemas** (FAQ, Product)
4. **Delete or deactivate migrated snippets**

---

## Risk Assessment

### LOW RISK
- Migrating static translations to TRP
- Deactivating completed maintenance snippets
- Deleting old inactive snippets

### MEDIUM RISK
- Refactoring Snippet 105 (critical for SEO)
- Modifying Snippet 220 (affects Yoast schemas)
- Testing required on staging first

### HIGH RISK
- Deleting active snippets without backup
- Modifying TRP database directly
- Changing hreflang implementation (Snippet 207)

---

## Benefits of Migration

### Immediate
- **Single source of truth** for all translations
- **Easier content management** (no code editing required)
- **Better visibility** (translations in TRP admin panel)

### Long-term
- **Reduced maintenance burden** (fewer snippets to manage)
- **Improved consistency** (all translations follow same system)
- **Easier onboarding** (editors can manage translations without developer)

### Performance
- **Fewer active snippets** = slightly faster execution
- **No hardcoded arrays** in PHP memory

---

## Cost-Benefit Analysis

**Time Investment:**
- Audit & Planning: 2-3 hours (DONE)
- Migration work: 12-16 hours
- Testing: 4-6 hours
- **Total: ~20-25 hours**

**Ongoing Savings:**
- Reduce snippet management time by ~50%
- Enable non-technical editors to manage translations
- Eliminate translation-related code updates
- **Estimated: 2-3 hours/month saved**

**ROI Timeline:** ~8-12 months to break even

---

## Next Steps

1. **Review this audit** with stakeholders
2. **Get approval** for migration plan
3. **Set up staging environment** for testing
4. **Begin Phase 1** (quick wins)
5. **Schedule weekly check-ins** during migration

---

## Related Documents

- **Full audit report:** `2026-02-12-translation-snippets.md`
- **Snippet code samples:** `2026-02-12-key-snippets-code.md`
- **TRP documentation:** TranslatePress official docs
- **REST API endpoints:** `/sk/v1/trp-*` (see Snippet 198, 209-211, 216)

---

## Contact

For questions or clarifications, refer to:
- TRP admin panel: https://studiokook.ee/wp-admin/options-general.php?page=translate-press
- Code Snippets: https://studiokook.ee/wp-admin/admin.php?page=code-snippets
- REST API docs: Check snippet descriptions (198, 209-211, 216)
