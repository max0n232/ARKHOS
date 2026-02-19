# Фасады: Menu Setup Status

**Date:** 2026-02-02
**Status:** ⚠️ Partially Complete — Requires Manual Steps

---

## Completed Tasks

### ✅ 1. Page Structure Created

```
Fassaadid (5800)
  └─ Egger (6309)
       ├─ F - Kivi (6310)
       ├─ H - Puit (6311)
       └─ U - Monokroom (6312)
```

**URLs:**
- https://studiokook.ee/fassaadid/
- https://studiokook.ee/fassaadid/egger-fassaadid/
- https://studiokook.ee/fassaadid/egger-fassaadid/f-kivi-fassaad/
- https://studiokook.ee/fassaadid/egger-fassaadid/h-puit-fassaad/
- https://studiokook.ee/fassaadid/egger-fassaadid/u-monokroom-fassaad/

###✅ 2. Galleries Assigned

| Page | Gallery ID | Name | Images | Thumbs |
|------|-----------|------|--------|--------|
| F - Kivi | 1 | toopind-egger-f-stone | 44 | ✅ |
| H - Puit | 9 | egger-h-puit | 122 | ✅ |
| U - Monokroom | 11 | egger-u-monokroom | 150 | ✅ |

**Total:** 316 decor thumbnails generated

### ✅ 3. Tööpinnad Fixed (Partially)

**Elementor data updated:**
- Old shortcode: `ids="10,9,11,12,13"`
- New shortcode: `ids="1,2,10"` ✅

**Expected result:** Galleries 9 (H-Puit facades) and 11 (U-Monokroom facades) removed from worktops page.

---

## ⚠️ Issues & Manual Steps Needed

### Issue 1: Elementor Cache

**Problem:** Despite shortcode update in database, Tööpinnad page still shows gallery 9 (egger-h-puit).

**Evidence:**
```bash
curl -s "https://studiokook.ee/toopinnad/" | grep -o 'wp-content/gallery/[^/]*/' | sort -u
```

**Output:**
- `/wp-content/gallery/tootasapinnad/` (Gallery 1) ✅
- `/wp-content/gallery/toopind-egger-h-wood/` (Gallery 2) ✅
- `/wp-content/gallery/egger-f-kivi/` (Gallery 10) ✅
- `/wp-content/gallery/egger-h-puit/` (Gallery 9) ❌ Should not be here!

**Solution Required:**

**Option A: Via WordPress Admin (Recommended)**
1. Login to WordPress admin
2. Pages → Tööpinnad (2776) → Edit with Elementor
3. Find shortcode widget (container ID `81977c7`)
4. Verify shortcode shows: `[ngg src="galleries" ids="1,2,10" display="basic_thumbnail"]`
5. If still shows `9,11` → manually update to `1,2,10`
6. Save → Update page
7. Clear Elementor cache: Elementor → Tools → Regenerate CSS & Data

**Option B: Clear All Caches**
1. Elementor → Tools → Regenerate CSS
2. Plugins → Seraphinite Accelerator → Clear cache (if active)
3. Server cache clear (if CDN/hosting cache enabled)
4. Hard refresh browser (Ctrl+Shift+R)

### Issue 2: Fassaadid Not in Menu

**Problem:** Fassaadid pages exist but not visible in site navigation.

**Solution Required:**

**Via WordPress Admin (Only Way):**
1. Appearance → Menus
2. Select "Menu" (ID 3)
3. Add pages:
   - **Fassaadid** (top level, same level as Materjalid)
     - **Egger** (child of Fassaadid)
       - **F - Kivi** (child of Egger)
       - **H - Puit** (child of Egger)
       - **U - Monokroom** (child of Egger)
4. Drag to correct positions
5. Save Menu

**Target Structure:**
```
Menu
├─ Avaleht
├─ Valmis köögid
├─ Materjalid
│   ├─ Meie furnituur
│   │   ├─ Sahtlid
│   │   ├─ Ladustamissüsteemid
│   │   ├─ Nurgamehhanismid
│   │   └─ Tõstemehhanismid
│   └─ Tööpinnad
│       ├─ Laminaadist töötasapinnad
│       └─ Kividest töötasapinnad
├─ **Fassaadid** [ADD]
│   └─ **Egger** [ADD]
│       ├─ **F - Kivi** [ADD]
│       ├─ **H - Puit** [ADD]
│       └─ **U - Monokroom** [ADD]
├─ Hinnapäring
└─ Kontakt
```

### Issue 3: Facade Pages Need Elementor Content

**Problem:** H-Puit and U-Monokroom pages have NGG shortcodes in content but galleries not displaying (F-Kivi works).

**Reason:** Shortcode placeholders (`ngg_shortcode_0_placeholder`) not rendering.

**Solution Required:**

**Via Elementor Editor:**
1. Pages → H - Puit → Edit with Elementor
2. Add **NextGEN Gallery** widget (or **Shortcode** widget)
3. Configure:
   - Gallery ID: 9
   - Display type: Basic Thumbnails
   - Thumbnail size: 240x240
4. Save
5. Repeat for U - Monokroom (Gallery ID 11)

**Alternative:** Copy Elementor template from F-Kivi page and change gallery ID.

---

## Saved Tools

### 1. NGG Thumbs Regeneration Endpoint

**Snippet ID:** 78 (permanent, active)
**Endpoint:** `POST /wp-json/ngg-fix/v1/regen-thumbs`

```bash
curl -X POST "https://studiokook.ee/wp-json/ngg-fix/v1/regen-thumbs" \
  -u "admin:PASSWORD" \
  -H "Content-Type: application/json" \
  -d '{"gallery_id": 9, "width": 240, "height": 240}'
```

### 2. Tööpinnad Fix Snippet

**Snippet ID:** 79 (deactivated)
**Purpose:** Removed facade galleries (9, 11) from Tööpinnad Elementor shortcode

**Status:** Executed successfully, can be deleted.

### 3. Python Scripts

**Location:** `C:\Users\sorte\AppData\Local\Temp\claude\...\scratchpad\`

- `create_facade_pages.py` — Creates F/H/U pages
- `add_galleries_to_facades.py` — Adds NGG shortcodes
- `fix_galleries_direct.py` — Updates Elementor data
- `create_fix_snippet.py` — Creates Tööpinnad fix snippet
- `add_fassaadid_to_menu.py` — Menu creation (failed, needs manual)

---

## Quick Verification Checklist

### After Manual Steps:

**1. Tööpinnad Page (https://studiokook.ee/toopinnad/)**
- [ ] Shows only worktop galleries (1, 2, 10)
- [ ] NO H-Puit facades (gallery 9)
- [ ] NO U-Monokroom facades (gallery 11)

**Check:**
```bash
curl -s "https://studiokook.ee/toopinnad/" | grep -c 'egger-h-puit'  # Should be 0
curl -s "https://studiokook.ee/toopinnad/" | grep -c 'egger-u-monokroom'  # Should be 0
```

**2. Navigation Menu**
- [ ] "Fassaadid" visible in main menu
- [ ] Clicking "Fassaadid" → shows "Egger" submenu
- [ ] "Egger" → shows F/H/U sub-items

**3. Facade Pages**
- [ ] F - Kivi: Shows 44 F-decor thumbnails
- [ ] H - Puit: Shows 122 H-decor thumbnails
- [ ] U - Monokroom: Shows 150 U-decor thumbnails

---

## Current Gallery Status

| GID | Name | Path | Images | Purpose |
|-----|------|------|--------|---------|
| 1 | toopind-egger-f-stone | tootasapinnad | 44 | Worktops & Facades (F-Stone) |
| 2 | toopind-egger-h-wood | toopind-egger-h-wood | 26 | Worktops (H-Wood) |
| 6 | toopind-tehnostone | kivist-tootasapinnad | 49 | Worktops (Stone) |
| 8 | fenix | fenix | 37 | Worktops (Fenix) |
| 9 | egger-h-puit | egger-h-puit | 122 | **Facades (H-Wood)** |
| 10 | melaminovye-dekory | egger-f-kivi | 62 | Worktops (Egger F) |
| 11 | egger-u-monokroom | egger-u-monokroom | 150 | **Facades (U-Monochrome)** |

**Total:** 490 thumbnails generated

---

## Next Session

**Manual work estimated:** 15-20 minutes

**Priority:**
1. Clear Elementor cache & verify Tööpinnad shows only 3 galleries
2. Add Fassaadid menu structure
3. Add galleries to H-Puit and U-Monokroom via Elementor editor

**Documentation:**
- `FACADE_PAGES_SETUP.md` — Original facade setup doc
- `GALLERY_FIX_RESOLUTION.md` — NGG thumbs fix
- This file: `FACADE_MENU_SETUP_STATUS.md` — Current status

---

**Contact:** Continue with manual steps via WordPress admin or resume in new session.
