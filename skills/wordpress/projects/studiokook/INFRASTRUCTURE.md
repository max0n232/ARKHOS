# Studiokook Infrastructure Reference

> Technical reference for studiokook.ee infrastructure.
> Last audit: 2026-02-12

## Server

| Property | Value |
|----------|-------|
| Domain | studiokook.ee |
| Hosting | ZoneOS (zone.eu) |
| Server | Apache |
| Path | /data01/virt103578/domeenid/www.studiokook.ee/htdocs |
| SSL | Yes (Let's Encrypt) |
| CDN | None detected |

## WordPress Core

| Component | Version | Notes |
|-----------|---------|-------|
| WordPress | 6.9.1 | Latest stable |
| PHP | 8.x | (exact version requires server access) |
| Database | MySQL/MariaDB | wp_ prefix |

## Active Plugins (28)

### Core Functionality
| Plugin | File | Purpose |
|--------|------|---------|
| Elementor | elementor/elementor.php | Page builder |
| TranslatePress Business | translatepress-business/index.php | Premium translation features |
| TranslatePress Multilingual | translatepress-multilingual/index.php | Base translation |
| Xpro Theme Builder | xpro-theme-builder/xpro-theme-builder.php | Header/Footer templates |
| Xpro Elementor Addons | xpro-elementor-addons/xpro-elementor-addons.php | Extra widgets |

### SEO & Analytics
| Plugin | File | Purpose |
|--------|------|---------|
| Yoast SEO | wordpress-seo/wp-seo.php | SEO management |
| Site Kit by Google | google-site-kit/google-site-kit.php | Analytics integration |

### Forms & Communication
| Plugin | File | Purpose |
|--------|------|---------|
| Contact Form 7 | contact-form-7/wp-contact-form-7.php | Forms |
| CF7 Telegram | cf7-telegram/cf7-telegram.php | Form notifications to Telegram |
| Flamingo | flamingo/flamingo.php | Form submission storage |
| Drag and Drop Multiple File Upload CF7 | drag-n-drop-upload-cf7/drag-n-drop-upload-cf7.php | File uploads |

### Media
| Plugin | File | Purpose |
|--------|------|---------|
| NextGEN Gallery | nextgen-gallery/nggallery.php | Gallery management |
| NextGEN Gallery Pro | nextgen-gallery-pro/nggallery-pro.php | Premium gallery features |
| NGG Alt Updater | ngg-alt-updater/ngg-alt-updater.php | Alt text management |
| NGG MCP Abilities | ngg-mcp-abilities/ngg-mcp-abilities.php | MCP integration for galleries |

### Performance
| Plugin | File | Purpose |
|--------|------|---------|
| Seraphinite Accelerator Ext | seraphinite-accelerator-ext/plugin_root.php | Page caching |

### Development & Admin
| Plugin | File | Purpose |
|--------|------|---------|
| Code Snippets | code-snippets/code-snippets.php | PHP customization |
| WP Abilities API | abilities-api/abilities-api.php | sk/v1 REST API |
| MCP Adapter | mcp-adapter/mcp-adapter.php | MCP protocol support |
| Better Search Replace | better-search-replace/better-search-replace.php | DB search/replace |
| WP File Manager | wp-file-manager/file_folder_manager.php | File management |
| WordPress Importer | wordpress-importer/wordpress-importer.php | Content import |
| Insert Headers and Footers | insert-headers-and-footers/ihaf.php | Code injection |
| Disable Admin Notices | disable-admin-notices/disable-admin-notices.php | UI cleanup |

### Blocks & Widgets
| Plugin | File | Purpose |
|--------|------|---------|
| Kadence Blocks | kadence-blocks/kadence-blocks.php | Gutenberg blocks |
| Unlimited Elements for Elementor | unlimited-elements-for-elementor/unlimited_elements.php | Extra Elementor widgets |
| Sticky Header Effects for Elementor | sticky-header-effects-for-elementor/sticky-header-effects-for-elementor.php | Header effects |
| AI Addons for Elementor | ai-addons-for-elementor/ai-addons.php | AI-powered widgets |

## Theme

| Property | Value |
|----------|-------|
| Parent Theme | Astra |
| Builder | Xpro Theme Builder |
| Header | Xpro Themer template (ID: 7) |
| Footer | Xpro Themer template |

## Languages & Translation

### TranslatePress Configuration
| Property | Value |
|----------|-------|
| Primary Language | Estonian (et) |
| Secondary Languages | Russian (ru-RU), English (en-GB), Finnish (fi) |
| URL Structure | Path prefix: `/{lang}/` |
| Slug Translation | No (keeps original Estonian slugs) |

### URL Examples
```
Estonian: https://studiokook.ee/koogid/
Russian:  https://studiokook.ee/ru/koogid/
English:  https://studiokook.ee/en/koogid/
Finnish:  https://studiokook.ee/fi/koogid/
```

### Dictionary Tables
| Table | Language Pair | Notes |
|-------|---------------|-------|
| wp_trp_dictionary_et_en_gb | ET → EN | Primary, used by trp-search |
| wp_trp_dictionary_et_ru_ru | ET → RU | Separate IDs |
| wp_trp_dictionary_et_fi | ET → FI | Separate IDs |

### Current Translation Status (2026-02-12)
- Untranslated strings (EN table): 50
- Most untranslated: SEO meta descriptions

## Pages

### Page Map
| ID | Slug | Builder | Parent | URL |
|----|------|---------|--------|-----|
| 8 | home | Elementor | - | / |
| 21 | koogid | Elementor | - | /koogid/ |
| 25 | hinnaparing | Elementor | - | /hinnaparing/ |
| 536 | tostemehhanismid | Elementor | - | /tostemehhanismid/ |
| 2465 | kontakt | Elementor | - | /kontakt/ |
| 2530 | materjalid | Elementor | - | /materjalid/ |
| 2619 | sahtlid | Elementor | - | /sahtlid/ |
| 2651 | nurgamehhanismid | Elementor | - | /nurgamehhanismid/ |
| 2674 | ladustamissusteemid | Elementor | - | /ladustamissusteemid/ |
| 2706 | meie-furnituur | Elementor | - | /meie-furnituur/ |
| 2776 | toopinnad | Native | - | /toopinnad/ |
| 2943 | laminaadist-tootasapinnad | Elementor | - | /laminaadist-tootasapinnad/ |
| 2951 | kividest-tootasapinnad | Elementor | - | /kividest-tootasapinnad/ |
| 3010 | valmistamine | Elementor | - | /valmistamine/ |
| 3133 | koogid-eritellimusel | Elementor | - | /koogid-eritellimusel/ |
| 5161 | privacy | Native | - | /privacy/ |
| 5800 | fassaadid | Native | - | /fassaadid/ |
| 5802 | egger | Native | - | /egger/ |
| 5804 | fenix | Native | 5800 | /fassaadid/fenix/ |
| 6291 | kivi | Native | 5802 | /egger/kivi/ |
| 6293 | puit | Native | 5802 | /egger/puit/ |
| 6295 | monokroom | Native | 5802 | /egger/monokroom/ |
| 6309 | egger-fassaadid | Native | 5800 | /fassaadid/egger-fassaadid/ |
| 6335 | hpl-tootasapinnad | Native | 2776 | /toopinnad/hpl-tootasapinnad/ |

### Page Hierarchy
```
/ (home, ID:8)
├── /koogid/ (ID:21) - Portfolio
├── /hinnaparing/ (ID:25) - Price request form
├── /kontakt/ (ID:2465) - Contact
├── /materjalid/ (ID:2530) - Materials
├── /meie-furnituur/ (ID:2706) - Furniture hardware
│   ├── /sahtlid/ (ID:2619) - Drawers
│   ├── /nurgamehhanismid/ (ID:2651) - Corner mechanisms
│   ├── /ladustamissusteemid/ (ID:2674) - Storage systems
│   └── /tostemehhanismid/ (ID:536) - Lift mechanisms
├── /toopinnad/ (ID:2776) - Countertops
│   ├── /laminaadist-tootasapinnad/ (ID:2943) - Laminate
│   ├── /kividest-tootasapinnad/ (ID:2951) - Stone
│   └── /hpl-tootasapinnad/ (ID:6335) - HPL
├── /fassaadid/ (ID:5800) - Facades
│   ├── /fenix/ (ID:5804) - Fenix
│   └── /egger-fassaadid/ (ID:6309) - Egger facades
├── /egger/ (ID:5802) - Egger catalog
│   ├── /kivi/ (ID:6291) - Stone patterns
│   ├── /puit/ (ID:6293) - Wood patterns
│   └── /monokroom/ (ID:6295) - Monochrome
├── /valmistamine/ (ID:3010) - Manufacturing
├── /koogid-eritellimusel/ (ID:3133) - Custom kitchens
└── /privacy/ (ID:5161) - Privacy policy
```

## Blog

| Property | Value |
|----------|-------|
| Posts | 31+ |
| Category | Blogi (ID: 5) |
| Most recent | 2025-11-15: koogimoobel-tellimisel-mida-peaks-teadma-2026-aastal |

## Media & Galleries

### NextGEN Gallery
- Storage: `/wp-content/gallery/`
- Images on /koogid/ page: ~1575 (from NextGEN)
- Display: Via Elementor Gallery widget (not NGG shortcodes)
- Albums: Multiple, kitchen project portfolios

### Standard Media
- Storage: `/wp-content/uploads/YYYY/MM/`
- Format: Optimized JPG

## Caching

### Seraph Accelerator
| Property | Value |
|----------|-------|
| Cache directory | /wp-content/cache/ |
| Cache files | 1 (at audit time) |
| Status | Active |

### Cache Invalidation
```bash
# Clear specific page
curl "https://studiokook.ee/wp-json/sk/v1/touch-page" -H "Authorization: Basic $WP_AUTH"

# Clear all Seraph cache
curl "https://studiokook.ee/wp-json/sk/v1/clear-seraph" -H "Authorization: Basic $WP_AUTH"

# Full clear (all layers)
curl "https://studiokook.ee/wp-json/sk/v1/full-clear" -H "Authorization: Basic $WP_AUTH"
```

## Custom REST API

### Namespaces
| Namespace | Source | Endpoints |
|-----------|--------|-----------|
| sk/v1 | WP Abilities API | 19 endpoints |
| wp-abilities/v1 | WP Abilities API | Generic abilities |
| ngg-fix/v1 | Custom | Gallery repair |
| xpro/v1/dynamic-content | Xpro Theme Builder | Dynamic content |
| code-snippets/v1 | Code Snippets | Snippet management |
| contact-form-7/v1 | CF7 | Form endpoints |
| yoast/v1 | Yoast SEO | SEO data |
| ngg/v1, nggpro/v1 | NextGEN | Gallery operations |

### sk/v1 Endpoints
| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| clear-seraph | GET | Yes | Clear Seraph cache |
| seraph-info | GET | No | Cache status |
| full-clear | GET | Yes | Clear all caches |
| list-plugins | GET | No | List active plugins |
| touch-page | GET | Yes | Invalidate page cache |
| fix-trp-dicts | GET | Yes | Rebuild TRP dictionaries |
| fix-trp-tasuta | GET | Yes | Fix "tasuta" translations |
| trp-untranslated | GET | No | Get untranslated strings |
| trp-search | GET | No | Search TRP dictionary |
| trp-update | POST | Yes | Update translation |
| trp-add | POST | Yes | Add translation |
| trp-insert | POST | Yes | Insert dictionary entry |
| trp-update-by-id | POST | Yes | Update by dictionary ID |
| trp-update-id | POST | Yes | Update specific ID |
| trp-clean-emoji | POST | Yes | Remove emoji from TRP |
| update-seo | POST | Yes | Update Yoast SEO meta |
| faq | POST | Yes | FAQ management |
| elementor/{id} | GET | Yes | Get Elementor page data |
| elementor/{id}/replace | POST | Yes | Replace content in page |

## Custom Post Types

| CPT | Slug | Purpose |
|-----|------|---------|
| kadence_form | Forms | Kadence form builder |
| kadence_navigation | Navigation | Kadence menus |
| kadence_header | Header | Kadence headers |
| kadence_lottie | Lottie | Lottie animations |
| xpro_content | Templates | Xpro saved templates |

## Header/Footer

### Structure
- **Header**: Xpro Theme Builder template (ID: 7)
- **Type**: `data-elementor-type="xpro-themer"`
- **Footer**: Xpro Theme Builder template
- **Menu**: WordPress nav_menu taxonomy

### Header Elements
- Site logo
- Main navigation menu
- Language switcher (TRP)
- Contact button

## Forms

### Contact Form 7
- Forms: Present (exact count requires auth)
- Telegram integration: Active (cf7-telegram)
- File uploads: Enabled
- Submission storage: Flamingo

## SEO

### Yoast SEO
- Status: Active
- Schema: WebPage, WebSite, BreadcrumbList
- Language: et (Estonian primary)

### Meta Structure
```html
<meta property="og:locale" content="et_EE" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Studioköök" />
```

## Performance Notes

1. **Large image count**: ~1575 images on portfolio page
2. **Seraph caching**: Aggressive, clear after content changes
3. **No CDN**: Images served directly from server
4. **Elementor**: Heavy, generates large HTML output

## Security

### Exposed Information
- WordPress version: Visible in HTML
- Elementor version: Visible in HTML
- Site Kit version: Visible in HTML

### Recommendations
- Remove generator meta tags
- Implement rate limiting on API
- Consider CDN for image delivery

## Maintenance Tasks

### Regular
- Check trp-untranslated weekly
- Monitor cache effectiveness
- Review form submissions (Flamingo)

### After Content Changes
1. Clear cache: `touch-page` or `clear-seraph`
2. Verify translation matching
3. Check page on all languages

### After Plugin Updates
1. Test Elementor rendering
2. Verify TRP functionality
3. Check custom API endpoints
