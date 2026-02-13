# Studiokook Project Knowledge

> On-demand context for studiokook.ee specific knowledge.
> Loaded when task involves studiokook triggers.

## Architecture

| Component | Technology | Notes |
|-----------|------------|-------|
| CMS | WordPress 6.9.1 | Self-hosted on ZoneOS |
| Page Builder | Elementor 3.25.11 | Content in widgets, not post_content |
| Translation | TranslatePress 2.7.4 | Multi-table: et_en_gb, et_ru_ru, et_fi |
| Theme | Astra + Xpro Themer | No child theme |
| Caching | Seraph Accel | Aggressive caching, requires touch-page after changes |
| Custom API | sk/v1 | WP Abilities plugin, 15+ endpoints |

## Quirks

### TranslatePress Multi-Table Architecture
- `wp_trp_dictionary_et_en_gb` — English translations (trp-search reads HERE)
- `wp_trp_dictionary_et_ru_ru` — Russian translations (separate table, separate IDs)
- `wp_trp_dictionary_et_fi` — Finnish translations
- **CRITICAL:** `trp-search` and `trp-untranslated` ONLY read EN table
- **CRITICAL:** `trp-update-by-id` ONLY updates EN table
- For RU/FI: use `trp-add` with `lang` parameter

### Whitespace Sensitivity
- TRP matches EXACT strings including leading/trailing whitespace
- ` Text` ≠ `Text` — these are different dictionary entries
- Fix source in Elementor first, then update TRP

### Caching Layers
1. Seraph Accel (page-level)
2. Browser cache
3. Cloudflare (if enabled)
- After content changes: `touch-page` + wait 30s for propagation

## Page IDs

> Full page map with hierarchy: see INFRASTRUCTURE.md

### Key Pages (Quick Reference)
| Page | ID | Slug | Builder |
|------|----|----- |---------|
| Главная | 8 | home | Elementor |
| Кухни (портфолио) | 21 | koogid | Elementor |
| Запрос цены | 25 | hinnaparing | Elementor |
| Контакт | 2465 | kontakt | Elementor |
| Материалы | 2530 | materjalid | Elementor |
| Столешницы | 2776 | toopinnad | Native |
| Фасады | 5800 | fassaadid | Native |
| Egger каталог | 5802 | egger | Native |
| Производство | 3010 | valmistamine | Elementor |
| Privacy | 5161 | privacy | Native |

### Page Hierarchy
```
/ (8)
├── /koogid/ (21) - ~1575 images from NextGEN
├── /toopinnad/ (2776)
│   ├── /laminaadist-tootasapinnad/ (2943)
│   ├── /kividest-tootasapinnad/ (2951)
│   └── /hpl-tootasapinnad/ (6335)
├── /fassaadid/ (5800)
│   ├── /fenix/ (5804)
│   └── /egger-fassaadid/ (6309)
├── /egger/ (5802)
│   ├── /kivi/ (6291)
│   ├── /puit/ (6293)
│   └── /monokroom/ (6295)
└── /meie-furnituur/ (2706)
    ├── /sahtlid/ (2619)
    ├── /nurgamehhanismid/ (2651)
    ├── /ladustamissusteemid/ (2674)
    └── /tostemehhanismid/ (536)
```

## Decisions

### 2026-02-12: Translation API Priority
- **Decision:** Always use TranslatePress API over Code Snippets
- **Reasoning:** TRP translations are editable via UI, survive updates
- **Exception:** Dynamic PHP content (prices, calculations)

### 2026-02-13: Infrastructure documentation approach
- **Decision:** Single INFRASTRUCTURE.md (Russian, comprehensive) replaces auto-generated English version
- **Reasoning:** CLI-generated file was incomplete (no Known Issues, no CLI rules, no dependency map)
- **Impact:** CLI reads one file before edits, all context in one place

### 2026-02-13: SEO fix approach
- **Decision:** Sequential fixes by priority (hreflang -> 404 -> galleries -> translations -> meta)
- **Reasoning:** Each task can cascade to the next (especially TranslatePress <-> NextGEN conflict)
- **Impact:** Minimizes cascading breakage

### 2026-02-12: UTF-8 in Windows Bash
- **Decision:** Use Node.js scripts for API calls with UTF-8 data
- **Reasoning:** Windows cmd/bash mangles Unicode in curl -d
- **Pattern:** Write JSON to file, use `curl -d @file.json`

## Patterns (Project-Specific)

<!-- Post-mortem analyzer (Phase 3) appends findings here automatically -->
<!-- Format: ### YYYY-MM-DD: Error Type
     - Location, Problem, Resolution, Confidence
     - Cross-session boost applied if pattern recurs -->

### 2026-02-12: HTTP 500
- **Location:** studiokook.ee/wp-json/sk/v1/trp-search
- **Problem:** HTTP 500 Internal Server Error
- **Resolution:** unknown
- **Confidence:** 0.90

## Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| HTTP 500 on trp-* | PHP timeout on large dict | Retry or split request |
| Translation "missing" | Whitespace mismatch | Check TRP dictionary for variants |
| Changes not visible | Cache | Run touch-page, wait 30s |
| trp-update-by-id success but RU unchanged | Wrong table | Use trp-add with lang='ru' |

## Related Files

- [INFRASTRUCTURE.md](./INFRASTRUCTURE.md) — Full technical reference (plugins, API, pages, media)
- [SKILL.md](../../SKILL.md) — WordPress skill with API reference

## Links

- [Admin Panel](https://studiokook.ee/wp-admin/)
- [TranslatePress Editor](https://studiokook.ee/wp-admin/admin.php?page=translate-press)
- [Code Snippets](https://studiokook.ee/wp-admin/admin.php?page=snippets)
- [Elementor Templates](https://studiokook.ee/wp-admin/edit.php?post_type=elementor_library)
