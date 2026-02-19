# Фасады: Структура и Инструменты

**Date:** 2026-02-02
**Status:** ✅ Структура создана, galleries готовы

---

## Созданная Структура

### Pages Hierarchy

```
Fassaadid (5800) — https://studiokook.ee/fassaadid/
  └─ Egger (6309) — https://studiokook.ee/fassaadid/egger-fassaadid/
       ├─ F - Kivi (6310) — https://studiokook.ee/fassaadid/egger-fassaadid/f-kivi-fassaad/
       ├─ H - Puit (6311) — https://studiokook.ee/fassaadid/egger-fassaadid/h-puit-fassaad/
       └─ U - Monokroom (6312) — https://studiokook.ee/fassaadid/egger-fassaadid/u-monokroom-fassaad/
```

### NGG Galleries

| Page | Gallery ID | Name | Images | Thumbs Status |
|------|-----------|------|--------|---------------|
| F - Kivi | 1 | toopind-egger-f-stone | 44 | ✅ Generated (240x240) |
| H - Puit | 9 | egger-h-puit | 122 | ✅ Generated (240x240) |
| U - Monokroom | 11 | egger-u-monokroom | 150 | ✅ Generated (240x240) |

**Total:** 316 decor images с thumbnails

---

## NGG Shortcodes

Добавлены в content каждой страницы:

### F - Kivi (6310)
```
[ngg src="galleries" ids="1" display="basic_thumbnail" thumbnail_width="240" thumbnail_height="240"]
```

### H - Puit (6311)
```
[ngg src="galleries" ids="9" display="basic_thumbnail" thumbnail_width="240" thumbnail_height="240"]
```

### U - Monokroom (6312)
```
[ngg src="galleries" ids="11" display="basic_thumbnail" thumbnail_width="240" thumbnail_height="240"]
```

---

## Current Status

✅ **Pages created** (F/H/U)
✅ **Galleries assigned** (1, 9, 11)
✅ **Thumbnails regenerated** (316 total)
✅ **Shortcodes added** to content

⚠️  **Galleries not displaying** on H and U pages (cache/Elementor issue)

### Issue

NGG shortcodes работают на F-Kivi (176 thumbs visible), но **не работают** на H-Puit и U-Monokroom.

**Причина:** Worktop pages (Tööpinnad) используют **Elementor builder**, а facade pages созданы с простым content editor.

**Solution:** Нужно добавить galleries через **Elementor visual editor**.

---

## Next Steps (Manual)

### Option 1: Elementor Editor (Recommended)

1. Open WordPress admin
2. Navigate to Pages → H - Puit (6311)
3. Click "Edit with Elementor"
4. Add NGG Gallery widget:
   - Drag "NextGEN Gallery" widget
   - Select Gallery ID: 9
   - Set display type: Basic Thumbnails
   - Thumbnail size: 240x240
5. Repeat for U - Monokroom (6312) with Gallery ID 11
6. Publish

### Option 2: Copy Elementor Data

1. Export Elementor template from working worktop page (Tööpinnad)
2. Import to facade pages
3. Replace gallery IDs in imported template

### Option 3: Use Code Snippet (Programmatic)

Create snippet to inject Elementor data:

```php
// Copy _elementor_data meta from page 2776 (Tööpinnad)
// Replace gallery IDs (1 → 9 for H, 1 → 11 for U)
// Update pages 6311 and 6312
```

---

## Saved Tools

### 1. NGG Thumbs Regeneration Endpoint

**Snippet ID:** 78
**Status:** ✅ Active (permanent)
**Endpoint:** `POST /wp-json/ngg-fix/v1/regen-thumbs`

**Usage:**
```bash
curl -X POST "https://studiokook.ee/wp-json/ngg-fix/v1/regen-thumbs" \
  -u "admin:PASSWORD" \
  -H "Content-Type: application/json" \
  -d '{"gallery_id": 9, "width": 240, "height": 240}'
```

**Returns:**
```json
{
  "success": true,
  "gallery_id": 9,
  "regenerated": 122,
  "total": 122,
  "errors": []
}
```

**Code Location:** Code Snippets plugin → Snippet #78

### 2. Page Creation Scripts

**Location:** `C:\Users\sorte\AppData\Local\Temp\claude\...\scratchpad\`

- `create_facade_pages.py` — Creates F/H/U pages under Egger parent
- `add_galleries_to_facades.py` — Adds NGG shortcodes to pages

**Usage:**
```bash
python create_facade_pages.py
python add_galleries_to_facades.py
```

---

## Gallery Maintenance

### Regenerate All Facade Thumbnails

```bash
# F-Kivi (Gallery 1)
curl -X POST "https://studiokook.ee/wp-json/ngg-fix/v1/regen-thumbs" \
  -u "admin:PASSWORD" \
  -d '{"gallery_id":1,"width":240,"height":240}'

# H-Puit (Gallery 9)
curl -X POST "https://studiokook.ee/wp-json/ngg-fix/v1/regen-thumbs" \
  -u "admin:PASSWORD" \
  -d '{"gallery_id":9,"width":240,"height":240}'

# U-Monokroom (Gallery 11)
curl -X POST "https://studiokook.ee/wp-json/ngg-fix/v1/regen-thumbs" \
  -u "admin:PASSWORD" \
  -d '{"gallery_id":11,"width":240,"height":240}'
```

### Check Thumbnail Status

```bash
# Sample checks
curl -I https://studiokook.ee/wp-content/gallery/tootasapinnad/thumbs/thumbs-F032.jpg
curl -I https://studiokook.ee/wp-content/gallery/egger-h-puit/thumbs/thumbs-H011_STG8.jpg
curl -I https://studiokook.ee/wp-content/gallery/egger-u-monokroom/thumbs/thumbs-U104_ST9.jpg
```

---

## Decor Collections

### F - Kivi (Stone Textures)
- **Gallery:** GID 1 (shared with worktops)
- **Path:** `/wp-content/gallery/tootasapinnad/`
- **Images:** 44 unique F-decors
- **Format:** `F###_ST##.jpg` или `F###.jpg`
- **Examples:** F032, F030_ST75, F021_ST75, F052

### H - Puit (Wood Textures)
- **Gallery:** GID 9
- **Path:** `/wp-content/gallery/egger-h-puit/`
- **Images:** 122 H-decors
- **Format:** `H####_ST##.jpg`
- **Examples:** H011_STG8, H1113_ST10, H1133_ST10

### U - Monokroom (Solid Colors)
- **Gallery:** GID 11
- **Path:** `/wp-content/gallery/egger-u-monokroom/`
- **Images:** 150 U-decors
- **Format:** `U###_ST#.jpg`
- **Examples:** U104_ST9, U113_ST9, U114_ST9

---

## WordPress Auth

- **Username:** `admin`
- **App Password:** `aKpB V7OX x3a4 QJGs hPXs Oj7B`

---

## Summary

✅ **Infrastructure ready:**
- Permanent REST endpoint for thumbnail regeneration
- All facade pages created
- All galleries have thumbnails (316 images)
- Python scripts for automation

⚠️  **Requires manual action:**
- Add galleries via Elementor editor to H-Puit and U-Monokroom pages
- OR copy Elementor template from working page

**Estimated time:** 10-15 minutes через Elementor GUI

---

## Related Documentation

- `GALLERY_FIX_RESOLUTION.md` — NGG thumbs fix для worktops
- `URGENT_GALLERY_BUG.md` — Original issue report

---

**Contact:** Continue in new session with this context loaded.
