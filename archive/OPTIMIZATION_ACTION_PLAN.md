# Studiokook Performance Optimization — Action Plan

**Created:** 2026-02-02
**Based on:** PERFORMANCE_AUDIT.md findings
**Estimated Total Time:** 2-3 hours
**Expected Performance Gain:** 30-40% page load improvement

---

## Database Audit Results

### Autoload Status: ✅ HEALTHY

**Total autoloaded data:** 180.57 KB (391 options)
**Threshold:** <1 MB (PASS)
**Status:** Good, but room for optimization

### Top Offenders (Autoloaded)

| Option | Size | Plugin | Impact |
|--------|------|--------|--------|
| `rewrite_rules` | 38.39 KB | WordPress Core | ⚠️ MEDIUM |
| `seraph_accel_Sett` | 33.72 KB | Seraphinite Accelerator | ⚠️ HIGH |
| `seraph_accel_RmtCfg` | 26.28 KB | Seraphinite Accelerator | ⚠️ HIGH |
| `duplicator_pro_package_active` | 20.36 KB | Duplicator Pro | ⚠️ MEDIUM |
| `astra-settings` | 9.13 KB | Astra Theme | ✅ OK |
| `wpseo_titles` | 8.18 KB | Yoast SEO | ✅ OK |

**Combined Seraphinite:** 60 KB (33% of total autoload) 🚨

### Transients Issues

**Found:** 7 autoloaded transients (should be 0)
- `ngg_transient_groups`
- `_wpforms_transient_*` (2 instances)
- `_transient_trp_active_taxonomies_slugs`
- `_transient_update_plugins`
- `_transient_update_themes`
- `_transient_health-check-site-status-result`

**Impact:** Transients should NEVER be autoloaded (defeats their purpose)

---

## HIGH Priority Actions (Do Today)

### 1. Fix Autoloaded Transients ⚠️ CRITICAL

**Problem:** Transients with `autoload='yes'` defeat caching purpose
**Impact:** Every transient update rewrites autoload cache

**Solution:**
```sql
-- Fix autoload for transients (run via MCP query)
UPDATE wp_options
SET autoload = 'no'
WHERE option_name LIKE '_transient_%'
  OR option_name LIKE '_site_transient_%'
  OR option_name LIKE 'ngg_transient_%'
  OR option_name LIKE '_wpforms_transient_%';
```

**Verification:**
```sql
SELECT COUNT(*) as fixed_count
FROM wp_options
WHERE (option_name LIKE '_transient_%' OR option_name LIKE '%transient%')
  AND autoload = 'no';
```

**Expected Result:** 7+ transients moved to non-autoload
**Time:** 5 minutes
**Risk:** LOW (safe change)

---

### 2. Optimize Seraphinite Accelerator Settings

**Problem:** 60 KB autoloaded settings (33% of total)
**Plugin:** Seraphinite Accelerator (page speed optimization)

**Options:**

#### Option A: Disable Autoload (Recommended)
```sql
-- Move Seraphinite settings to lazy load
UPDATE wp_options
SET autoload = 'no'
WHERE option_name IN ('seraph_accel_Sett', 'seraph_accel_RmtCfg');
```

**Risk:** Plugin may expect autoload; test after change
**Rollback:**
```sql
UPDATE wp_options SET autoload = 'yes' WHERE option_name LIKE 'seraph_accel_%';
```

#### Option B: Review Plugin Settings
- Check if Seraphinite settings can be simplified
- Consider disabling unused features
- May reduce config size

**Time:** 15 minutes
**Expected gain:** 60 KB autoload reduction

---

### 3. Audit Duplicator Pro Package State

**Problem:** 20 KB autoloaded data for backup package
**Concern:** `duplicator_pro_package_active` suggests active/stuck backup

**Investigation needed:**
```sql
-- Check Duplicator package data
SELECT option_value FROM wp_options WHERE option_name = 'duplicator_pro_package_active';
```

**Action:**
- Complete or cancel stuck backup package
- Verify no ongoing backup before changing autoload
- Consider moving to `autoload='no'` after completion

**Time:** 10 minutes
**Risk:** MEDIUM (verify backup status first)

---

## MEDIUM Priority Actions (This Week)

### 4. Enable NGG Query Caching

**Problem:** Gallery pages load 100+ images with potential N+1 queries
**Solution:** Enable NextGEN Gallery caching

**Steps:**
1. Navigate to WP Admin → Gallery → Options
2. Find "Performance" or "Cache" section
3. Enable:
   - Image metadata caching
   - Gallery query caching
   - Object cache integration (if available)

**Alternative (via code):**
```php
// Add to theme functions.php or mu-plugin
add_filter('ngg_use_imagick', '__return_true'); // Better image processing
add_filter('ngg_enable_cache', '__return_true'); // Enable caching
```

**Time:** 20 minutes
**Expected gain:** 20-30% gallery load time reduction

---

### 5. Implement Lazy Loading for Galleries

**Problem:** 534 thumbnails loaded immediately on Tööpinnad page
**Current:** All images load on page render

**Solution:** Update NGG shortcodes in Elementor

**Pages to update:**
- Tööpinnad (2776) — 3 shortcodes
- Fassaadid pages (6310, 6311, 6312) — if/when Elementor setup complete

**New shortcode format:**
```php
[ngg src="galleries" ids="1"
     display="basic_thumbnail"
     images_per_page="50"         // Reduced from 100
     ajax_pagination="1"           // Add AJAX pagination
     ngg_triggers_display="never" // Disable auto-display
     slug="gallery-slug"]          // Add for better URLs
```

**Implementation via Elementor:**
1. Edit page with Elementor
2. Find NGG shortcode widget (ID: df9addf, 08cb200)
3. Update shortcode parameters
4. Test pagination and lazy load

**Time:** 30 minutes per page
**Expected gain:** 40-50% initial page weight reduction

---

### 6. Enable Elementor Performance Features

**Current status:** Unknown configuration
**Need to check:** Elementor → Settings → Advanced

**Recommended settings:**
```
✅ CSS Print Method: External File
✅ Google Fonts: Yes (but consider preload)
✅ Font Display: Swap
✅ Improved Asset Loading: Active
✅ Experiment: DOM Optimization
✅ Experiment: Optimized Inline Loading
```

**Additional:**
- Regenerate CSS files after changes
- Clear Elementor cache
- Test frontend after enabling experiments

**Time:** 15 minutes
**Expected gain:** 10-15% page load improvement

---

## LOW Priority Actions (This Month)

### 7. Object Cache Implementation

**Current:** No object cache detected
**Options:**
- Redis (recommended)
- Memcached
- APCu (if available)

**Benefits:**
- Faster database query caching
- Reduced wp_options lookups
- Better transient handling
- NGG gallery metadata caching

**Implementation steps:**
1. Install Redis on server (if not available)
2. Install Redis Object Cache plugin
3. Enable object cache
4. Test gallery performance

**Time:** 1-2 hours (including server setup)
**Expected gain:** 20-30% overall performance boost
**Risk:** MEDIUM (requires server access and testing)

---

### 8. Rewrite Rules Optimization

**Problem:** 38 KB `rewrite_rules` autoload
**Cause:** Large number of registered rewrites from plugins

**Audit needed:**
```sql
-- Get rewrite rules (will be large JSON)
SELECT option_value FROM wp_options WHERE option_name = 'rewrite_rules';
```

**Actions:**
1. Flush rewrite rules: `wp rewrite flush`
2. Check for duplicate rules
3. Disable permalink-based features in unused plugins
4. Consider hard flush:
```php
delete_option('rewrite_rules');
flush_rewrite_rules(true);
```

**Time:** 30 minutes
**Expected gain:** 5-10 KB autoload reduction
**Risk:** LOW (can always regenerate)

---

## Monitoring & Verification

### After Each Change

**Required checks:**
1. Frontend test: Load Tööpinnad page
2. Check for errors in browser console
3. Verify galleries display correctly
4. Test pagination if implemented
5. Check admin area functionality

**Performance metrics:**
```bash
# Browser DevTools → Network tab
- Total page size (target: <2 MB)
- Number of requests (target: <100)
- DOM Content Loaded (target: <2s)
- Load time (target: <3s)

# Optional: Use external tool
- GTmetrix: https://gtmetrix.com
- WebPageTest: https://webpagetest.org
```

### Database Verification Queries

**After autoload changes:**
```sql
-- Total autoload size (should decrease)
SELECT ROUND(SUM(LENGTH(option_value))/1024, 2) as autoload_kb
FROM wp_options WHERE autoload = 'yes';

-- Check transients are not autoloaded
SELECT COUNT(*) FROM wp_options
WHERE (option_name LIKE '_transient_%' OR option_name LIKE '%transient%')
  AND autoload = 'yes';
-- Expected: 0
```

---

## Rollback Procedures

### If Site Breaks After Changes

**1. Revert autoload changes:**
```sql
-- Restore transients to autoload (if needed)
UPDATE wp_options SET autoload = 'yes'
WHERE option_name IN (
    'ngg_transient_groups',
    '_transient_update_plugins',
    '_transient_update_themes'
);
```

**2. Restore Seraphinite:**
```sql
UPDATE wp_options SET autoload = 'yes'
WHERE option_name LIKE 'seraph_accel_%';
```

**3. Flush all caches:**
```php
wp_cache_flush();
delete_transient('all'); // Via WP-CLI or snippet
```

**4. Regenerate rewrite rules:**
```bash
wp rewrite flush --hard
```

---

## Implementation Checklist

### Today (30-45 minutes)

- [ ] Fix autoloaded transients (SQL update)
- [ ] Test site after transient fix
- [ ] Disable autoload for Seraphinite settings
- [ ] Test site after Seraphinite change
- [ ] Document baseline performance (page load time)

### This Week (2-3 hours)

- [ ] Enable NGG caching
- [ ] Implement lazy loading in gallery shortcodes
- [ ] Enable Elementor performance optimizations
- [ ] Audit Duplicator Pro package state
- [ ] Run full Lighthouse audit
- [ ] Document performance improvements

### This Month (Optional, 3-5 hours)

- [ ] Evaluate object cache implementation
- [ ] Set up Redis if beneficial
- [ ] Optimize rewrite rules
- [ ] Consider CDN for static assets
- [ ] Full performance review after all changes

---

## Expected Results

### Immediate (After Today's Changes)

**Autoload Reduction:**
- Before: 180.57 KB
- After: ~120 KB (60 KB Seraphinite removed)
- Improvement: 33% autoload reduction

**Page Load:**
- Expected: 5-10% faster initial page load
- Measurement: Compare before/after with browser DevTools

### After Week's Work

**Combined improvements:**
- Autoload: -33%
- Gallery load: -30% (lazy loading + caching)
- Page size: -40% (pagination + lazy images)
- Total page load: **30-40% faster**

### After Full Optimization

**With object cache + CDN:**
- Database queries: -50%
- Page load: -50-60%
- TTFB: -40%
- LCP: -50%

**Realistic target:**
- Current: ~5-7s page load (estimated)
- After immediate fixes: ~4-5s
- After week's work: ~3-4s
- After full optimization: ~2-3s

---

## Tools & Commands Reference

### Via WordPress MCP (ngg-gallery/query ability)

```sql
-- Check autoload size
SELECT ROUND(SUM(LENGTH(option_value))/1024, 2) as kb
FROM wp_options WHERE autoload='yes';

-- Fix transients
UPDATE wp_options SET autoload='no'
WHERE option_name LIKE '_transient_%';

-- Disable Seraphinite autoload
UPDATE wp_options SET autoload='no'
WHERE option_name LIKE 'seraph_accel_%';
```

### Via WP-CLI (if available)

```bash
# Flush caches
wp cache flush
wp transient delete --all

# Rewrite rules
wp rewrite flush --hard

# Check options
wp option get rewrite_rules --format=json | wc -c
```

### Via Code Snippets Plugin

Create temporary snippet for one-time changes:
```php
// Fix autoloaded transients
global $wpdb;
$wpdb->query("UPDATE {$wpdb->options} SET autoload='no'
              WHERE option_name LIKE '_transient_%'");
wp_cache_flush();
error_log('[Autoload Fix] Transients updated');
```

---

## Contact & Next Steps

**Created by:** Claude Code + WordPress Skills
**Skills used:**
- `claude-wordpress-skills` (database optimization patterns)
- `superpowers` (systematic analysis)

**Next session:**
1. Execute HIGH priority SQL updates
2. Test and verify changes
3. Move to MEDIUM priority optimizations

**Questions to address:**
- Is object cache already available on hosting?
- Can we access wp-config.php for constants?
- Are there server-level caching mechanisms in place?

---

**Last Updated:** 2026-02-02
**Status:** Ready for implementation
