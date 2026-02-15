# Studiokook - Current State

**Last Updated:** 2026-02-03

---

## Status: HPL Page + Fundermax Gallery + Translations

---

## Completed (this session, 2026-02-03)

### Snippets executed (Code Snippets → Run Once)
1. **SNIPPET_TRANSLATIONS_HPL** — 22 строки RU/EN/FI в TranslatePress (status=2)
2. **SNIPPET_FUNDERMAX_GALLERY** — 16 декоров Fundermax 1000x1000, NGG галерея, shortcode
3. **SNIPPET_HPL_SEO_CONTENT** — HPL страница (6335) с SEO-таблицами, H-структурой

### MCP actions
- Alttext: F221_ST87→F221, F244_ST76→F244, F311_ST87→F311, U7081_ST76→U7081
- GID 15 (broken HPL) deleted
- Galleries renamed to Series (F-series, H-series, U-series)

### Skills installed
- `~/.claude/skills/marketing/` — 25 skills
- `~/.claude/skills/n8n-expert/` — 7 skills
- `~/.claude/skills/seo-aeo/` — 1 skill
- `~/.claude/skills/fal-ai/` — 5 skills
- `/seo-smm` updated as marketing hub

### Previous sessions
- Gallery filtering by eamf.ee 18mm catalog
- Texture deduplication (one per code)
- HPL page created under Tööpinnad
- Menu updated with HPL
- SEO Audit workflow (n8n ID: 6PYNEXX34zO4IfzP)
- Homepage SEO 68→97/100
- Alt text 328/328 (100%)

---

## NGG Galleries

| GID | Title | Visible | Path |
|-----|-------|---------|------|
| 1 | Egger F-series (worktops) | 34 | /gallery/tootasapinnad/ |
| 2 | Egger H-series (worktops) | 15 | /gallery/toopind-egger-h-wood/ |
| 6 | Tööpind Tehnostone | 49 | /gallery/kivist-tootasapinnad/ |
| 7 | koogid gallery | 105 | /gallery/koogid-gallery/ |
| 8 | Fenix | 37 | /gallery/fenix/ |
| 9 | Egger H-series (facades) | 70 | /gallery/egger-h-puit/ |
| 10 | Egger F-series (facades) | 12 | /gallery/egger-f-kivi/ |
| 11 | Egger U-series (facades) | 52 | /gallery/egger-u-monokroom/ |
| 14 | Egger (empty) | 0 | /gallery/egger/ |
| NEW | Fundermax HPL | 16 | /gallery/fundermax-hpl/ |

---

## Key Pages

### HPL (6335) — hpl-tootasapinnad, parent: 2776
- SEO content: H2/H3/H4, 3 tables (Egger specs, Fundermax specs, comparison)
- Egger: `[ngg src="images" ids="509,511,523,528,587,588,1294,1349"]`
- Fundermax: `[ngg src="galleries" ids="FM_GID"]`
- No prices

### Egger Facades (6309) — egger-fassaadid
- F-series (GID 10), H-series (GID 9), U-series (GID 11)

### Page tree
```
Materjalid (2530)
├── Meie furnituur (2706)
├── Tööpinnad (2776)
│   ├── Laminaadist töötasapinnad (2943)
│   ├── Kividest töötasapinnad (2951)
│   └── HPL kompaktlaminaat (6335)
└── Fassaadid (5800)
    ├── Egger (6309) — F/H/U-series
    └── Fenix (5804)
```

---

## TranslatePress
- Languages: ET (base), RU, FI, EN_GB
- DeepL connected
- Old strings: translated (status=2)
- **New SEO strings (tables, lists) need translation** — run DeepL or create snippet

---

## TODO next session
1. Verify HPL page on all 4 languages (/et/, /ru/, /en/, /fi/)
2. Run DeepL auto-translate for new SEO strings
3. Check Fundermax images display (no DivisionByZero)
4. Confirm Seraphinite cache cleared
5. Verify Egger Facades F/H/U-series
6. Verify HPL in nav menu

---

## Quick Context

**Architecture:** CLI (brain) + n8n (hands) + Python agents (AI workers)
**SEO Score:** 97/100 (homepage)
**n8n Workflow:** SEO Audit Weekly (ID: 6PYNEXX34zO4IfzP) — active
**Knowledge DB:** knowledge/knowledge.db
**WordPress:** studiokook.ee (admin via REST API + Playwright for Yoast)
**Seraphinite:** Disk cache — "Удалить кэш" (not "Обновить") for full clear

---

## Notes

- Seraphinite cache active — clear after any content change
- Yoast meta via Playwright JS injection only
- WP REST API Application Password: read-only
- WPCode Header/Footer: CodeMirror editor
- eamf.ee original images: /media/catalog/product/7/6/ (not /cache/)
