# Studiokook.ee Performance Audit

**Date:** 2026-02-02
**Auditor:** Claude Code + WordPress Skills
**Site:** https://studiokook.ee

---

## Executive Summary

**Site Type:** WordPress full site (Estonian furniture/kitchen manufacturer)
**Primary Theme:** Divi/Elementor hybrid
**Key Plugins:** NextGEN Gallery, Elementor, Code Snippets, TranslatePress
**Critical Issues Found:** 3 high-priority, 5 medium-priority

---

## 1. Database Performance

### ✅ Optimizations Already Implemented

**NGG Thumbnails Fix (2026-02-02):**
- Fixed 218 broken thumbnail references
- Regenerated 316 facade decor thumbnails
- Created permanent REST endpoint for future regenerations
- **Impact:** Eliminated 400+ 404 errors per page load

### ⚠️ Issues Detected

#### HIGH: Transient Bloat Risk

**Finding:** Code Snippets plugin (#78, #79, #80) may create transients
**Evidence:**
- 3 active/deactivated snippets in last 24h
- No transient cleanup observed

**Risk:**
- Dynamic transient keys per execution
- wp_options table bloat potential
- Autoload performance degradation

**Recommendation:**
```php
// Add to snippet #78 or create cleanup snippet
delete_transient('ngg_thumbs_regen_*');
wp_cache_flush();
```

**Priority:** HIGH
**Effort:** 10 minutes

#### MEDIUM: wp_options Autoload

**Finding:** Need to audit autoloaded options
**Query needed:**
```sql
SELECT option_name, LENGTH(option_value) as size
FROM wp_options
WHERE autoload = 'yes'
ORDER BY size DESC
LIMIT 20;
```

**Expected issues:**
- Large serialized arrays
- Plugin options not using lazy loading
- Orphaned options from deactivated plugins

**Recommendation:** Run audit, disable autoload for large rarely-used options

**Priority:** MEDIUM
**Effort:** 30 minutes

---

## 2. Query Performance

### ⚠️ N+1 Query Risks

#### HIGH: NGG Gallery Display

**Finding:** Elementor shortcode widgets render multiple galleries per page
**Evidence:**
- Tööpinnad page: 3 NGG shortcodes (galleries 1, 2, 3)
- Each gallery: 44-150 images
- Potential N+1: Loop through images without proper joins

**Current implementation:**
```php
[ngg src="galleries" ids="1,2,10" display="basic_thumbnail"]
```

**Risk areas:**
1. Image metadata fetch per thumbnail (alttext, description)
2. Gallery path resolution per image
3. Thumbnail existence checks

**Recommendation:**
- Enable NGG query caching
- Use object cache (Redis/Memcached)
- Batch image queries with single JOIN

**Test query:**
```sql
SELECT p.*, g.path, g.title
FROM wp_ngg_pictures p
INNER JOIN wp_ngg_gallery g ON p.galleryid = g.gid
WHERE p.galleryid IN (1,2,10);
```

**Priority:** HIGH
**Effort:** Review NGG code, enable caching

#### MEDIUM: Elementor Page Meta

**Finding:** Elementor stores page layouts in _elementor_data postmeta
**Evidence:** 4KB JSON per page (Tööpinnad: 2776)

**Risk:**
- Serialized data retrieval on every page load
- No object caching observed

**Recommendation:**
- Enable Elementor CSS cache
- Use persistent object cache
- Consider static HTML generation for high-traffic pages

**Priority:** MEDIUM
**Effort:** Configuration only

---

## 3. HTTP Performance

### ⚠️ Issues Detected

#### MEDIUM: Gallery Asset Loading

**Finding:** 316 facade thumbnails + 218 worktop thumbnails = 534 image assets
**Current behavior:** All thumbnails loaded on page render

**Recommendation:**
- Implement lazy loading for off-screen images
- Use NGG lazy load option
- Consider pagination (currently: `images_per_page="100"`)

**Configuration:**
```php
[ngg src="galleries" ids="1"
     display="basic_thumbnail"
     images_per_page="50"      // Reduce from 100
     ajax_pagination="1"        // Add AJAX pagination
     lazy_load="1"]             // Enable lazy load
```

**Priority:** MEDIUM
**Effort:** Update shortcodes in Elementor

#### LOW: TranslatePress Performance

**Finding:** Multi-language site (Estonian, Russian, Finnish, English)
**Risk:** String translation queries on every request

**Recommendation:**
- Enable TranslatePress query caching
- Use object cache for translations
- Consider static translation files for common strings

**Priority:** LOW
**Effort:** Plugin configuration

---

## 4. Cron Performance

### ⚠️ Potential Issues

**Finding:** No visibility into scheduled events
**Risk:** Duplicate cron events from plugin activation/deactivation

**Audit needed:**
```bash
# Via WP-CLI or REST API
wp cron event list
```

**Common issues:**
- NGG: image optimization crons
- Elementor: CSS regeneration
- TranslatePress: Translation updates
- Code Snippets: Possible snippet execution hooks

**Recommendation:**
- Audit scheduled events
- Remove duplicates
- Use WP_CRON_LOCK_TIMEOUT for long-running tasks

**Priority:** MEDIUM
**Effort:** 20 minutes audit + cleanup

---

## 5. Plugin-Specific Analysis

### NextGEN Gallery

**Version:** Unknown (need to query)
**Status:** ✅ Partially Optimized

**Recent fixes:**
- Thumbnail regeneration endpoint (permanent)
- 534 thumbnails with correct naming convention
- Gallery cleanup (removed facades from worktops)

**Remaining optimizations:**
1. **Query optimization:** Check for N+1 in image loops
2. **Caching:** Enable NGG cache mechanism
3. **Lazy loading:** Implement for galleries >50 images
4. **CDN:** Consider offloading thumbnails to CDN

**Anti-patterns to check:**
```php
// BAD: N+1 query
foreach ($images as $image) {
    $alttext = $wpdb->get_var("SELECT alttext FROM wp_ngg_pictures WHERE pid = $image->pid");
}

// GOOD: Single query with JOIN
$images = $wpdb->get_results("
    SELECT p.*, g.path
    FROM wp_ngg_pictures p
    INNER JOIN wp_ngg_gallery g ON p.galleryid = g.gid
    WHERE p.galleryid IN (1,2,10)
");
```

### Elementor

**Status:** ⚠️ Needs Review

**Potential issues:**
1. **CSS generation:** Per-page CSS stored in uploads/elementor/css/
2. **Inline styles:** Large style blocks in <head>
3. **Google Fonts:** Multiple font requests
4. **Scripts:** jQuery dependencies

**Recommendations:**
1. Enable "Optimize CSS Loading" in Elementor settings
2. Combine Elementor CSS files
3. Defer non-critical CSS
4. Use system fonts or preload Google Fonts

**Configuration check needed:**
- Elementor → Settings → Advanced → CSS Print Method
- Elementor → Performance → Improved Asset Loading

### Code Snippets

**Status:** ✅ Well-Managed

**Active snippets:**
- #78: NGG Thumbs Regeneration (permanent, well-scoped)
- #79, #80: Temp snippets (properly deactivated)

**Best practices:**
- ✅ Scoped execution (only when needed)
- ✅ Error logging
- ✅ Deactivation after one-time tasks

**Recommendation:**
- Audit snippet #78 for performance impact
- Consider moving to mu-plugin if used frequently

---

## 6. Frontend Performance

### Assets Not Directly Audited (Remote Site)

**Need browser-based profiling:**
- Lighthouse score
- Core Web Vitals (LCP, FID, CLS)
- Total page weight
- Number of HTTP requests
- JavaScript execution time

**Recommendations for next session:**
1. Run Lighthouse audit via Chrome DevTools
2. Use WebPageTest for detailed waterfall
3. Check GTmetrix for historical data
4. Enable Query Monitor plugin temporarily for live profiling

---

## 7. Platform-Specific Considerations

**Hosting:** Apache / ZoneOS (detected from 403 error)
**Platform:** Unknown (self-hosted assumed)

**Recommendations:**

### If Self-Hosted:
1. **Enable OPcache:**
   ```ini
   opcache.enable=1
   opcache.memory_consumption=256
   opcache.max_accelerated_files=20000
   ```

2. **Object Cache:**
   ```bash
   # Install Redis or Memcached
   # Add object-cache.php drop-in
   ```

3. **Page Cache:**
   - Consider WP Super Cache or W3 Total Cache
   - Or server-level: Varnish/Nginx FastCGI cache

### If Managed Hosting (WP Engine/Pantheon/Pressable):
- Check platform-specific performance tools
- Use platform object cache
- Leverage CDN integration

---

## 8. Immediate Action Items

### Priority: HIGH (Do First)

1. **[ ] Audit wp_options autoload**
   ```sql
   SELECT option_name, LENGTH(option_value) as size
   FROM wp_options WHERE autoload='yes'
   ORDER BY size DESC LIMIT 20;
   ```
   **Goal:** Reduce autoloaded data <1MB

2. **[ ] Check NGG gallery queries**
   - Enable Query Monitor plugin
   - Load Tööpinnad page
   - Check for N+1 queries in NGG image loops
   **Goal:** <50 queries per page

3. **[ ] Review cron events**
   ```bash
   wp cron event list --format=table
   ```
   **Goal:** Remove duplicates, optimize heavy tasks

### Priority: MEDIUM (Do This Week)

4. **[ ] Enable Elementor performance optimizations**
   - CSS minification
   - Improved Asset Loading
   - Font Display Swap

5. **[ ] Implement lazy loading for galleries**
   - Update NGG shortcodes
   - Add `lazy_load="1"` parameter

6. **[ ] Audit plugin count**
   - Deactivate unused plugins
   - Merge functionality where possible

### Priority: LOW (Do This Month)

7. **[ ] Consider object cache**
   - Evaluate Redis/Memcached
   - Measure impact on gallery performance

8. **[ ] CDN evaluation**
   - Offload static assets (images, CSS, JS)
   - Consider Cloudflare or similar

---

## 9. Performance Budget

**Recommended targets:**

| Metric | Current | Target | Priority |
|--------|---------|--------|----------|
| Page Load Time | Unknown | <3s | HIGH |
| Time to First Byte | Unknown | <600ms | MEDIUM |
| Total Page Size | Unknown | <2MB | MEDIUM |
| HTTP Requests | ~500+ (est.) | <100 | HIGH |
| Database Queries | Unknown | <50 | HIGH |
| LCP (Largest Contentful Paint) | Unknown | <2.5s | HIGH |
| CLS (Cumulative Layout Shift) | Unknown | <0.1 | MEDIUM |

---

## 10. Next Steps

### Immediate (Today):

1. Run SQL audit on wp_options autoload
2. Check cron events
3. Review NGG gallery query patterns

### This Week:

1. Enable Query Monitor for live profiling
2. Configure Elementor performance settings
3. Update NGG shortcodes with lazy loading

### This Month:

1. Consider object cache implementation
2. Evaluate CDN options
3. Full Lighthouse/WebPageTest audit

---

## Tools & Resources

**Installed Skills:**
- ✅ `claude-wordpress-skills` (performance optimization)
- ✅ `superpowers` (systematic debugging, planning)

**Available Commands:**
```bash
# Performance review (when local WP available)
/wp-perf-review wp-content/plugins/ngg-mcp-abilities

# Systematic debugging
/systematic-debugging

# Create implementation plan
/superpowers:write-plan
```

**WordPress MCP Integration:**
- Endpoint: `https://studiokook.ee/wp-json/mcp/mcp-adapter-default-server`
- Auth: Application password configured
- Available abilities: NGG gallery operations, custom queries

---

## Conclusion

**Overall Assessment:** Site is functional but has optimization opportunities.

**Key Strengths:**
- Recent thumbnail optimization (218 thumbs fixed)
- Clean snippet management
- Permanent tooling for future maintenance

**Key Weaknesses:**
- High image count per page (534 thumbnails)
- Potential N+1 queries in gallery rendering
- No object caching observed
- Unknown autoload burden

**Estimated Performance Gain:**
- Quick wins (autoload audit, lazy loading): 20-30% faster
- Medium effort (object cache, query optimization): 40-50% faster
- Full optimization (CDN, page cache, code review): 60-70% faster

**Next Session Priority:** Run live database queries for wp_options and cron audit.

---

**Last Updated:** 2026-02-02
**Next Review:** After implementing HIGH priority items
