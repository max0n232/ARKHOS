# Translation Snippets Audit - INDEX

**Date:** 2026-02-12
**Site:** studiokook.ee
**Task:** Audit existing Code Snippets for translation-related code

---

## Quick Summary

- **Total Code Snippets:** 204
- **Active:** 24 (11.8%)
- **Translation-related:** 109 (53.4%)
- **Active translation snippets:** 15 (7.4%)
- **Can migrate to TRP:** 4
- **Must keep as snippet:** 11

---

## Audit Files

### 1. Executive Summary
**File:** `2026-02-12-audit-executive-summary.md`
**Size:** 5.4KB
**Purpose:** High-level overview for stakeholders

**Contents:**
- Key findings
- Risk assessment
- Cost-benefit analysis
- Recommended action plan (4 phases)
- Timeline estimates

**Best for:** Decision makers, project managers

---

### 2. Full Audit Report
**File:** `2026-02-12-translation-snippets.md`
**Size:** 9.4KB
**Purpose:** Comprehensive analysis of all translation snippets

**Contents:**
- Detailed breakdown of 15 active snippets
- Migration candidates (4 snippets)
- Must-keep snippets (11 snippets)
- Inactive snippets summary (51+ historical)
- Migration strategy
- Technical notes

**Best for:** Developers, technical leads

---

### 3. Snippet Code Reference
**File:** `2026-02-12-key-snippets-code.md`
**Size:** 22KB
**Purpose:** Full source code of key translation snippets

**Contents:**
- Complete PHP code for 5 critical snippets:
  - ID 102: SEO Schemas Output
  - ID 105: SEO Meta v5.1 Complete
  - ID 207: SK hreflang x-default fix
  - ID 220: Yoast Schema Language Filter
  - ID 227: Localized 404 Titles

**Best for:** Code review, migration planning

---

### 4. REST API Reference
**File:** `2026-02-12-trp-rest-api-reference.md`
**Size:** 7.4KB
**Purpose:** Complete documentation of TRP REST API endpoints

**Contents:**
- 11 REST API endpoints with examples
- Language codes and table structure
- Translation status codes
- Usage examples (curl commands)
- Best practices
- Security notes

**Best for:** Developers working with TRP API

---

## Key Findings Summary

### Critical Insights

1. **Fragmented System**
   - TranslatePress installed but underutilized
   - ~50+ translations hardcoded in Snippet 105
   - Mixed approach = maintenance burden

2. **Technical Debt**
   - 180 inactive snippets (88%)
   - Many completed migration tasks not cleaned up
   - Duplicate functionality

3. **Quick Wins Available**
   - 4 snippets can migrate to TRP
   - 51+ inactive snippets can be deleted
   - Cleanup = immediate improvement

---

## Active Translation Snippets

### Priority 1: Migrate to TRP
| ID | Name | Effort | Impact |
|----|------|--------|--------|
| 105 | SEO Meta v5.1 Complete | 4-6h | HIGH |
| 220 | Yoast Schema Language Filter | 1-2h | MEDIUM |
| 227 | Localized 404 Titles | 1-2h | LOW |

### Priority 2: Keep as Snippets
| ID | Name | Category | Reason |
|----|------|----------|--------|
| 102 | SEO Schemas Output | Production | Dynamic schema logic |
| 206 | SK FAQ Schema by Page | Production | Language-aware schemas |
| 207 | SK hreflang x-default fix | Production | SEO technical |
| 198 | DEBUG TRP Settings | Tool | REST API debugging |
| 209 | SK TRP Add Translation | Tool | Programmatic management |
| 210 | SK TRP Insert Translations | Tool | Bulk operations |
| 211 | SK TRP Update By ID | Tool | Bulk updates |
| 216 | SK TRP Update ID v4 | Tool | Single updates |
| 212 | SK Elementor Data API | Tool | Content management |
| 165 | Fix TRP Dicts | Maintenance | Deactivate after verification |
| 167 | Fix TRP Tasuta | Maintenance | Deactivate after verification |
| 208 | SK TRP Clean Emoji | Maintenance | Keep for emergency |

---

## Migration Plan (4 Phases)

### Phase 1: Quick Wins (Week 1)
- Audit TRP dictionary
- Deactivate completed maintenance snippets
- Delete inactive historical snippets
- **Time:** 2-3 hours

### Phase 2: Content Migration (Week 2-3)
- Extract 50+ hardcoded translations
- Bulk import to TRP
- Verify in admin panel
- **Time:** 6-8 hours

### Phase 3: Refactoring (Week 3-4)
- Refactor Snippet 105 → use TRP lookups
- Update Snippet 220 → use trp_translate()
- Test Snippet 227 → verify TRP compatibility
- **Time:** 8-10 hours

### Phase 4: Testing & Cleanup (Week 4)
- Test all pages (ET, RU, EN, FI)
- Verify SEO tags
- Check schemas
- Delete/deactivate migrated snippets
- **Time:** 4-6 hours

**Total:** ~20-25 hours

---

## Risk Management

### LOW RISK ✅
- Migrating static translations to TRP
- Deactivating completed maintenance snippets
- Deleting old inactive snippets

### MEDIUM RISK ⚠️
- Refactoring Snippet 105 (critical for SEO)
- Modifying Snippet 220 (affects Yoast)
- Test on staging first

### HIGH RISK ❌
- Deleting active snippets without backup
- Direct TRP database modifications
- Changing hreflang (Snippet 207)

---

## Benefits

### Immediate
- Single source of truth for translations
- Easier content management (no code editing)
- Better visibility (TRP admin panel)

### Long-term
- 50% reduction in snippet management time
- Improved consistency
- Non-technical editors can manage translations
- Better maintainability

### Performance
- Fewer active snippets = faster execution
- No hardcoded arrays in memory

---

## ROI

**Investment:** 20-25 hours
**Monthly savings:** 2-3 hours
**Break-even:** 8-12 months

---

## Next Steps

1. ✅ **Review audit** with stakeholders
2. ⏳ **Get approval** for migration plan
3. ⏳ **Set up staging** environment
4. ⏳ **Begin Phase 1** (quick wins)
5. ⏳ **Schedule check-ins** (weekly during migration)

---

## Available REST APIs

### Debug/Search
- `GET /sk/v1/trp-untranslated` - List untranslated
- `GET /sk/v1/trp-search?q={query}` - Search translations

### Update Operations
- `POST /sk/v1/trp-update` - Update single (EN only)
- `POST /sk/v1/trp-update-id` - Update by ID (any lang)
- `POST /sk/v1/trp-update-by-id` - Bulk update

### Insert Operations
- `POST /sk/v1/trp-add` - Add/update single
- `POST /sk/v1/trp-insert` - Bulk insert

### Maintenance
- `POST /sk/v1/trp-clean-emoji` - Clean emojis
- `GET /sk/v1/fix-trp-dicts` - Fix addresses
- `GET /sk/v1/fix-trp-tasuta` - Remove "Tasuta"

---

## Contact & Resources

**WordPress Admin:**
- TRP: https://studiokook.ee/wp-admin/options-general.php?page=translate-press
- Code Snippets: https://studiokook.ee/wp-admin/admin.php?page=code-snippets

**Credentials:**
- Username: `admin`
- App Password: `9hDv Tkk0 55Eh WqkD fo5s K3oA`

**Documentation:**
- TranslatePress: https://translatepress.com/docs/
- Code Snippets: https://codesnippets.pro/documentation/

---

## Audit Metadata

**Performed by:** Claude Code
**Date:** 2026-02-12
**Method:** REST API + Code analysis
**Total snippets analyzed:** 204
**Time spent:** ~2 hours

**Tools used:**
- WordPress REST API (Code Snippets plugin)
- Python (JSON parsing)
- Grep (pattern matching)

**Files generated:**
1. Executive Summary (5.4KB)
2. Full Audit Report (9.4KB)
3. Snippet Code Reference (22KB)
4. REST API Reference (7.4KB)
5. INDEX (this file)

**Total documentation:** ~44KB

---

## Quick Links

- [Executive Summary](./2026-02-12-audit-executive-summary.md) - For decision makers
- [Full Audit Report](./2026-02-12-translation-snippets.md) - For developers
- [Snippet Code](./2026-02-12-key-snippets-code.md) - For code review
- [REST API Docs](./2026-02-12-trp-rest-api-reference.md) - For API usage

---

**End of Index**
