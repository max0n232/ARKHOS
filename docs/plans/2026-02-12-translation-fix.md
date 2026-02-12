# Translation Fix Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all missing translations on studiokook.ee using TranslatePress API, eliminate translation snippets, and establish proper workflow for future translations.

**Architecture:** TranslatePress stores translations in `wp_trp_dictionary_*` tables. Custom REST API (`sk/v1/`) provides CRUD. Elementor content has whitespace issues causing duplicate entries. Fix via API first, snippets only as last resort.

**Tech Stack:** WordPress REST API (sk/v1), TranslatePress 2.7.4, Code Snippets plugin, Elementor 3.25.11

---

## Phase 0: Setup & Documentation

### Task 1: Create translation-guide.md

**Files:**
- Create: `C:\Users\sorte\Desktop\Studiokook\docs\translation-guide.md`

**Step 1: Create the documentation file**

```markdown
# Translation Guide for studiokook.ee

## Architecture

- **CMS:** WordPress + TranslatePress 2.7.4
- **Storage:** wp_trp_dictionary_* tables
- **Languages:** et (primary), ru, en_gb, fi
- **Custom API:** sk/v1 endpoints

## FORBIDDEN

- Creating snippets for text that can be added to TranslatePress
- Creating snippets without checking sk/v1/trp-search first
- Changing Elementor content without verifying it fixes the issue

## Required Workflow

### Step 1: Diagnose

```bash
# Search for text in TranslatePress dictionary
curl -u "admin:APP_PASSWORD" "studiokook.ee/wp-json/sk/v1/trp-search?q={text}"
```

Check: Does entry exist? What status? Are there duplicates?

### Step 2: Choose method

| Condition | Method |
|-----------|--------|
| status=0, entry exists | `trp-update-by-id` (add translation) |
| No entry | `trp-add` (create entry with translation) |
| Duplicates with whitespace | `elementor/{id}/replace` (clean) + `trp-update` |
| None of above | Snippet (with documentation) |

### Step 3: Apply

```bash
# Update existing entry
curl -X POST -u "admin:APP_PASSWORD" "studiokook.ee/wp-json/sk/v1/trp-update-id" \
  -H "Content-Type: application/json" \
  -d '{"id":1234,"translated":"Translated text","lang":"ru_ru"}'

# Add new translation
curl -X POST -u "admin:APP_PASSWORD" "studiokook.ee/wp-json/sk/v1/trp-add" \
  -H "Content-Type: application/json" \
  -d '{"original":"Estonian text","translated":"Translated text","lang":"ru_ru"}'
```

### Step 4: Verify

Open page in browser at target language URL, confirm translation displays.

## API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `sk/v1/trp-untranslated` | GET | List untranslated strings |
| `sk/v1/trp-search?q=text` | GET | Search dictionary |
| `sk/v1/trp-add` | POST | Add new translation |
| `sk/v1/trp-update-id` | POST | Update by ID |
| `sk/v1/trp-update-by-id` | POST | Update by ID (alias) |
| `sk/v1/elementor/{id}` | GET | Get Elementor content |
| `sk/v1/elementor/{id}/replace` | POST | Search/replace in Elementor |
| `sk/v1/fix-trp-dicts` | POST | Fix dictionaries |

## Language Codes

| Display | TRP Code | Locale |
|---------|----------|--------|
| Estonian | et | et |
| Russian | ru_ru | ru_RU |
| English | en_gb | en_GB |
| Finnish | fi | fi |

## Snippet Format (last resort only)

```php
/**
 * TRP-fallback: {Page} - {Description}
 * Reason: {Why TranslatePress cannot handle this}
 * Languages: {RU, EN, FI}
 * Date: YYYY-MM-DD
 */
add_filter('the_content', function($content) {
    if (get_locale() === 'ru_RU' && is_page(PAGE_ID)) {
        $content = str_replace('Estonian text', 'Russian text', $content);
    }
    return $content;
});
```
```

**Step 2: Commit**

```bash
git add docs/translation-guide.md
git commit -m "docs: add translation guide for TranslatePress workflow"
```

---

### Task 2: Create translator agent

**Files:**
- Create: `C:\Users\sorte\.claude\agents\translator.md`

**Step 1: Create the agent file**

```yaml
---
name: translator
description: Translation specialist for studiokook.ee. Uses TranslatePress API as primary method.
tools: Read, Grep, Glob, Bash
model: sonnet
permissionMode: default
domain: wordpress
role: translator
team_eligible: true
---
```

```markdown
You are a translation specialist for studiokook.ee WordPress site.

## Architecture

- TranslatePress 2.7.4 stores translations in wp_trp_dictionary_* tables
- Custom REST API at sk/v1/ provides CRUD for translations
- Site uses Elementor, text in text-editor widgets
- Languages: et (primary), ru, en_gb, fi

## Your workflow

1. ALWAYS check sk/v1/trp-search before any action
2. ALWAYS use sk/v1/trp-update-id or trp-add for translations
3. NEVER create snippets unless TranslatePress cannot handle the case
4. When whitespace causes mismatch - fix Elementor content via sk/v1/elementor/{id}/replace

## Translation quality

- Professional tone, kitchen/furniture industry terminology
- Estonian to Russian: natural Russian, not translationese
- Estonian to English: British English (site targets EU market)
- Estonian to Finnish: standard Finnish

## Kitchen industry terms

| Estonian | Russian | English | Finnish |
|----------|---------|---------|---------|
| köök | кухня | kitchen | keittio |
| mööbel | мебель | furniture | huonekalut |
| tasuta | бесплатно | free | ilmainen |
| hinnapakkumine | ценовое предложение | quote | tarjous |
| disain | дизайн | design | suunnittelu |

## Reference

See: `docs/translation-guide.md` in Studiokook project
```

**Step 2: Update registry.json with translator role**

**Files:**
- Modify: `C:\Users\sorte\.claude\skills\task-router\registry.json`

Add to `domains.wordpress.roles`:

```json
"translator": {
  "description": "TranslatePress translations via sk/v1 API",
  "agent_ref": "agents/translator.md",
  "tools": ["Read", "Grep", "Glob", "Bash"]
}
```

**Step 3: Commit**

```bash
git add agents/translator.md skills/task-router/registry.json
git commit -m "feat: add translator agent for studiokook.ee"
```

---

## Phase 1: Audit & Cleanup

### Task 3: Get untranslated strings

**Step 1: Fetch untranslated list**

```bash
curl -u "admin:APP_PASSWORD" "studiokook.ee/wp-json/sk/v1/trp-untranslated" > untranslated.json
```

**Step 2: Count and categorize**

Review JSON output. Group by:
- Has translation in one language but not others
- Has whitespace issues (leading/trailing spaces)
- No translation in any language

**Step 3: Save audit report**

Create `C:\Users\sorte\Desktop\Studiokook\logs\2026-02-12-translation-audit.json`

---

### Task 4: Find and fix whitespace duplicates

**Step 1: Identify duplicates**

For each untranslated entry with leading/trailing whitespace:

```bash
# Search for trimmed version
curl -u "admin:APP_PASSWORD" "studiokook.ee/wp-json/sk/v1/trp-search?q=Trimmed+text"
```

**Step 2: Copy translations from clean duplicate to dirty duplicate**

If clean version (status=2) has translation:

```bash
curl -X POST -u "admin:APP_PASSWORD" "studiokook.ee/wp-json/sk/v1/trp-update-id" \
  -H "Content-Type: application/json" \
  -d '{"id":DIRTY_ID,"translated":"Translation from clean","lang":"ru_ru"}'
```

**Step 3: Fix Elementor source content**

```bash
# Get Elementor data for page
curl -u "admin:APP_PASSWORD" "studiokook.ee/wp-json/sk/v1/elementor/8"

# Replace whitespace-prefixed text with clean version
curl -X POST -u "admin:APP_PASSWORD" "studiokook.ee/wp-json/sk/v1/elementor/8/replace" \
  -H "Content-Type: application/json" \
  -d '{"search":" Täitke vorm","replace":"Täitke vorm"}'
```

**Step 4: Run dictionary fix**

```bash
curl -X POST -u "admin:APP_PASSWORD" "studiokook.ee/wp-json/sk/v1/fix-trp-dicts"
```

---

### Task 5: Audit existing snippets

**Step 1: List all Code Snippets**

```bash
curl -u "admin:APP_PASSWORD" "studiokook.ee/wp-json/code-snippets/v1/snippets"
```

**Step 2: Filter translation-related snippets**

Look for:
- `str_replace` with locale checks
- `the_content` filter with language conditions
- Names containing: translat, перевод, язык, lang

**Step 3: For each translation snippet**

a. Extract original text it replaces
b. Check if in TranslatePress: `sk/v1/trp-search?q={text}`
c. If can migrate to TRP:
   - Add translation via `sk/v1/trp-add`
   - Deactivate snippet (don't delete yet)
   - Verify page displays correctly
   - Delete snippet if OK
d. If cannot migrate:
   - Rename to format: "TRP-fallback: {page} - {description}"
   - Add documentation comment

**Step 4: Document remaining snippets**

Create `C:\Users\sorte\Desktop\Studiokook\logs\2026-02-12-translation-snippets.md`

List all remaining translation snippets with justification.

---

## Phase 2: Translate Homepage (page ID 8)

### Task 6: Translate missing RU strings

**Step 1: Get untranslated for RU**

```bash
curl -u "admin:APP_PASSWORD" "studiokook.ee/wp-json/sk/v1/trp-untranslated" | jq '.[] | select(.lang == "ru_ru")'
```

**Step 2: Translate each string**

For each Estonian string, translate to Russian:

| Estonian | Russian |
|----------|---------|
| Täitke vorm ja saate hinnapakkumise 24h jooksul! | Заполните форму и получите ценовое предложение в течение 24 часов! |
| Tasuta disain ja mõõtmine | Бесплатный дизайн и замеры |
| ... | ... |

**Step 3: Add translations via API**

```bash
curl -X POST -u "admin:APP_PASSWORD" "studiokook.ee/wp-json/sk/v1/trp-update-id" \
  -H "Content-Type: application/json" \
  -d '{"id":ENTRY_ID,"translated":"Russian translation","lang":"ru_ru"}'
```

**Step 4: Verify**

Open studiokook.ee/ru/ in browser. Confirm all texts display in Russian.

---

### Task 7: Verify EN and FI translations

**Step 1: Check EN version**

Open studiokook.ee/en/ - scan for Estonian text.

**Step 2: Check FI version**

Open studiokook.ee/fi/ - scan for Estonian text.

**Step 3: Fix any missing translations**

Same process as Task 6 but for EN and FI.

---

## Phase 3: All Pages Translation

### Task 8: Generate page list

**Step 1: Get all public pages**

```bash
curl -u "admin:APP_PASSWORD" "studiokook.ee/wp-json/wp/v2/pages?per_page=100&status=publish" | jq '.[].id'
```

**Step 2: Create checklist**

For each page, track:
- Page ID
- Estonian title
- RU status (done/missing)
- EN status
- FI status

---

### Task 9: Translate remaining pages

For each page with missing translations:

**Step 1: Get page content**

```bash
curl -u "admin:APP_PASSWORD" "studiokook.ee/wp-json/sk/v1/elementor/{PAGE_ID}"
```

**Step 2: Search for untranslated text**

```bash
curl -u "admin:APP_PASSWORD" "studiokook.ee/wp-json/sk/v1/trp-search?q={text}"
```

**Step 3: Add missing translations**

Same API calls as Task 6.

**Step 4: Verify each page**

Open /ru/, /en/, /fi/ versions in browser.

---

## Phase 4: Verification & Protection

### Task 10: Final verification

**Step 1: Run untranslated check**

```bash
curl -u "admin:APP_PASSWORD" "studiokook.ee/wp-json/sk/v1/trp-untranslated"
```

Expected: Empty array or only dynamic content that requires snippets.

**Step 2: Visual verification**

For each language (ru, en, fi):
- Open homepage
- Open each main menu page
- Scan for Estonian text

**Step 3: Document results**

Update `C:\Users\sorte\Desktop\Studiokook\SESSION_STATE.md` with translation status.

---

### Task 11: Commit all changes

**Step 1: Review changes**

```bash
git status
git diff
```

**Step 2: Stage and commit**

```bash
git add docs/translation-guide.md logs/
git commit -m "feat: complete translation fix for all languages

- Add translation guide documentation
- Audit and fix 50 untranslated strings
- Migrate snippets to TranslatePress
- Fix whitespace duplicates in Elementor"
```

---

## Acceptance Criteria

| Criterion | Verification |
|-----------|-------------|
| No Estonian text on /ru/ | Visual check |
| No Estonian text on /en/ | Visual check |
| No Estonian text on /fi/ | Visual check |
| All translations in TRP DB | `trp-untranslated` returns empty |
| Translation snippets removed | Code Snippets audit |
| Remaining snippets documented | logs/translation-snippets.md |
| CLI agent knows workflow | agents/translator.md exists |
| No dictionary duplicates | fix-trp-dicts completed |

---

## Notes

- **Credentials:** Use `credentials/wp_rest_api.json` for API calls
- **Backup:** TranslatePress has versioning, but consider export before major changes
- **Monitoring:** Run `trp-untranslated` weekly to catch new content
