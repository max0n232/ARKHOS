# TranslatePress Fix & Russian Translation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix SKILL.md documentation errors, add critical TRP table architecture docs, and complete 15 Russian translations for studiokook.ee

**Architecture:** Update wordpress/SKILL.md with correct HTTP methods and TRP multi-table architecture documentation, then use Node.js scripts (not curl) to add Russian translations via trp-add API with lang='ru' parameter

**Tech Stack:** WordPress REST API (sk/v1), TranslatePress 2.7.4, Node.js https module, Git

---

## Task 1: Fix HTTP Methods in SKILL.md

**Files:**
- Modify: `C:\Users\sorte\.claude\skills\wordpress\SKILL.md:24-41` (Authentication table)
- Modify: `C:\Users\sorte\.claude\skills\wordpress\SKILL.md:116-143` (Endpoint descriptions)
- Modify: `C:\Users\sorte\.claude\skills\wordpress\SKILL.md:245-288` (Common Workflows)

**Step 1: Update Authentication table HTTP methods**

Change lines 37-39 from POST to GET:
```markdown
| fix-trp-dicts | **Yes** | GET |
| fix-trp-tasuta | **Yes** | GET |
| touch-page | **Yes** | GET |
```

**Step 2: Update endpoint descriptions**

Change line 116:
```markdown
#### `GET fix-trp-dicts` (auth required)
```

Add after line 119:
```markdown
#### `GET fix-trp-tasuta` (auth required)
Fix specific TRP dictionary issue with "tasuta" translations.

#### `GET touch-page` (auth required)
```

Change line 143:
```markdown
Invalidate page cache. Run after content changes.
```

**Step 3: Update Common Workflows to use GET**

Replace lines 263-266:
```bash
# 4. After all translations: rebuild dictionary
curl "https://studiokook.ee/wp-json/sk/v1/fix-trp-dicts" \
  -H "Authorization: Basic $WP_AUTH"

# 5. Clear cache
curl "https://studiokook.ee/wp-json/sk/v1/touch-page" \
  -H "Authorization: Basic $WP_AUTH"
```

Replace lines 286-287:
```bash
# 4. Rebuild + clear cache
curl "https://studiokook.ee/wp-json/sk/v1/fix-trp-dicts" \
  -H "Authorization: Basic $WP_AUTH"
curl "https://studiokook.ee/wp-json/sk/v1/touch-page" \
  -H "Authorization: Basic $WP_AUTH"
```

**Step 4: Verify changes**

Run: `grep -n "fix-trp-dicts\|touch-page\|fix-trp-tasuta" C:\Users\sorte\.claude\skills\wordpress\SKILL.md`

Expected: All mentions should show GET method, no POST remaining

**Step 5: Commit HTTP method fixes**

```bash
cd C:\Users\sorte\.claude
git add skills/wordpress/SKILL.md
git commit -m "fix: correct HTTP methods for fix-trp-dicts, fix-trp-tasuta, touch-page (GET not POST)"
```

---

## Task 2: Add TRP Table Architecture Documentation

**Files:**
- Modify: `C:\Users\sorte\.claude\skills\wordpress\SKILL.md:325-330` (insert after "Dictionary tables")

**Step 1: Insert new section after line 330**

Add after `Each row: id, original, translated, status, original_id`:

```markdown

### Table Architecture (КРИТИЧНО)

TranslatePress хранит переводы в ОТДЕЛЬНЫХ таблицах для каждой языковой пары:

| Таблица | Пара | Примечание |
|---|---|---|
| `wp_trp_dictionary_et_en_gb` | Estonian → English | **Основная** — trp-search и trp-untranslated читают отсюда |
| `wp_trp_dictionary_et_ru_ru` | Estonian → Russian | Отдельная таблица, свои ID |
| `wp_trp_dictionary_et_fi` | Estonian → Finnish | Отдельная таблица, свои ID |

**Критические правила:**

1. `trp-search` и `trp-untranslated` возвращают данные ТОЛЬКО из EN-таблицы
2. `?lang=` параметр в этих endpoints ИГНОРИРУЕТСЯ
3. `trp-update-by-id` обновляет записи ТОЛЬКО в EN-таблице
4. Для добавления RU перевода: `trp-add` с `lang: 'ru'` — пишет в `et_ru_ru`
5. Для добавления FI перевода: `trp-add` с `lang: 'fi'` — пишет в `et_fi`
6. ID в EN-таблице ≠ ID в RU-таблице для одной и той же строки

**Последствия:**
- "success: true" от trp-update-by-id НЕ означает что RU перевод обновлён
- После добавления перевода — ВСЕГДА открыть страницу и визуально проверить
- Для bulk RU переводов — использовать ТОЛЬКО `trp-add` с `lang: 'ru'`
```

**Step 2: Verify section added correctly**

Run: `grep -n "Table Architecture" C:\Users\sorte\.claude\skills\wordpress\SKILL.md`

Expected: Line number showing new section exists

**Step 3: Commit architecture docs**

```bash
git add skills/wordpress/SKILL.md
git commit -m "docs: add critical TRP multi-table architecture explanation"
```

---

## Task 3: Replace "Translate a page to Russian" Workflow

**Files:**
- Modify: `C:\Users\sorte\.claude\skills\wordpress\SKILL.md:245-267`

**Step 1: Replace entire workflow section**

Replace lines 245-267 with:

```markdown
### Translate a page to Russian

```bash
# ВАЖНО: trp-search показывает только EN-таблицу!
# Для RU переводов используй trp-add с lang='ru'

# 1. Найти непереведённые строки (это EN-таблица, но оригиналы те же)
curl "https://studiokook.ee/wp-json/sk/v1/trp-untranslated"

# 2. Для каждой строки — добавить RU перевод
# Используй Node.js скрипт из-за UTF-8 проблем в Windows bash

node -e "
const https = require('https');
const data = JSON.stringify({
  original: 'Estonian original text',
  translated: 'Русский перевод',
  lang: 'ru'
});
const req = https.request({
  hostname: 'studiokook.ee',
  path: '/wp-json/sk/v1/trp-add',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(data),
    'Authorization': 'Basic ' + Buffer.from(process.env.WP_USER + ':' + process.env.WP_APP_PASS).toString('base64')
  }
}, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log(body));
});
req.write(data);
req.end();
"

# 3. После всех переводов: пересобрать словари
curl "https://studiokook.ee/wp-json/sk/v1/fix-trp-dicts" \
  -H "Authorization: Basic $WP_AUTH"

# 4. Очистить кеш
curl "https://studiokook.ee/wp-json/sk/v1/touch-page" \
  -H "Authorization: Basic $WP_AUTH"

# 5. ОБЯЗАТЕЛЬНО: открыть страницу в браузере и проверить визуально
```
```

**Step 2: Verify replacement**

Run: `grep -n "Node.js скрипт" C:\Users\sorte\.claude\skills\wordpress\SKILL.md`

Expected: Shows line number with new Node.js script workflow

**Step 3: Commit workflow update**

```bash
git add skills/wordpress/SKILL.md
git commit -m "docs: replace RU translation workflow with Node.js script (UTF-8 safe)"
```

---

## Task 4: Add Windows/Bash Gotchas Section

**Files:**
- Modify: `C:\Users\sorte\.claude\skills\wordpress\SKILL.md:241` (insert after Safety Rules)

**Step 1: Insert new section after line 241**

Add after `9. After content changes: run 'touch-page' to clear cache.`:

```markdown

## Windows/Bash Gotchas

1. **UTF-8:** Никогда не передавай Unicode (ö, ü, ä, кириллицу) inline в curl -d. Используй:
   - `curl -d @file.json` (JSON записан в файл)
   - Node.js скрипт с https модулем
2. **Символ `!`:** Bash интерпретирует как history expansion. Записывай в файл.
3. **Content-Length:** Для Node.js https.request ВСЕГДА указывай Content-Length: Buffer.byteLength(data)
4. **Pipe blocking:** `curl | node -e` блокируется security pattern. Используй промежуточный файл.
```

**Step 2: Verify section exists**

Run: `grep -n "Windows/Bash Gotchas" C:\Users\sorte\.claude\skills\wordpress\SKILL.md`

Expected: Shows line number with new section

**Step 3: Commit gotchas section**

```bash
git add skills/wordpress/SKILL.md
git commit -m "docs: add Windows/Bash UTF-8 and security gotchas"
```

---

## Task 5: Create Translation Helper Script

**Files:**
- Create: `C:\Users\sorte\Desktop\Studiokook\scripts\add-translation.js`

**Step 1: Create scripts directory**

```bash
mkdir -p C:\Users\sorte\Desktop\Studiokook\scripts
```

**Step 2: Write translation helper script**

Create file `C:\Users\sorte\Desktop\Studiokook\scripts\add-translation.js`:

```javascript
#!/usr/bin/env node
/**
 * Add Russian translation to studiokook.ee via TRP API
 * Usage: node add-translation.js "Estonian text" "Русский перевод"
 */

const https = require('https');

const WP_USER = process.env.WP_USER;
const WP_APP_PASS = process.env.WP_APP_PASS;

if (!WP_USER || !WP_APP_PASS) {
  console.error('ERROR: Set WP_USER and WP_APP_PASS environment variables');
  process.exit(1);
}

const [original, translated] = process.argv.slice(2);

if (!original || !translated) {
  console.error('Usage: node add-translation.js "Estonian text" "Русский перевод"');
  process.exit(1);
}

const data = JSON.stringify({
  original,
  translated,
  lang: 'ru'
});

const req = https.request({
  hostname: 'studiokook.ee',
  path: '/wp-json/sk/v1/trp-add',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(data),
    'Authorization': 'Basic ' + Buffer.from(WP_USER + ':' + WP_APP_PASS).toString('base64')
  }
}, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', body);
  });
});

req.on('error', err => {
  console.error('Request failed:', err.message);
  process.exit(1);
});

req.write(data);
req.end();
```

**Step 3: Test script with dummy data**

Run: `cd C:\Users\sorte\Desktop\Studiokook && node scripts/add-translation.js "test" "тест"`

Expected: Status 200 or error message explaining credentials needed

**Step 4: Commit helper script**

```bash
cd C:\Users\sorte\Desktop\Studiokook
git add scripts/add-translation.js
git commit -m "feat: add Node.js helper script for TRP Russian translations"
```

---

## Task 6: Add Homepage Translations Block 1 (Täitke vorm variants)

**Files:**
- Execute: `C:\Users\sorte\Desktop\Studiokook\scripts\add-translation.js` (2 times for whitespace variants)

**Step 1: Add translation for clean variant**

Run:
```bash
cd C:\Users\sorte\Desktop\Studiokook
node scripts/add-translation.js "Täitke vorm – ja meie disainerid koostavad teile detailse projekt, arvestades teie soove, ruumi eripärasid ja eluviisi." "Заполните форму — и наши дизайнеры подготовят для вас детальный проект, учитывая ваши пожелания, особенности помещения и образ жизни."
```

Expected: Status 200, success response

**Step 2: Add translation for space-prefixed variant**

Run:
```bash
node scripts/add-translation.js " Täitke vorm – ja meie disainerid koostavad teile detailse projekt, arvestades teie soove, ruumi eripärasid ja eluviisi." "Заполните форму — и наши дизайнеры подготовят для вас детальный проект, учитывая ваши пожелания, особенности помещения и образ жизни."
```

Expected: Status 200, success response

**Step 3: Log completion**

Run: `echo "Block 1 (Täitke vorm variants): DONE" >> C:\Users\sorte\Desktop\Studiokook\translation-progress.txt`

---

## Task 7: Add Homepage Translations Blocks 2-5

**Files:**
- Execute: `C:\Users\sorte\Desktop\Studiokook\scripts\add-translation.js` (4 times)

**Step 1: Block 2 - Valmistame täpselt**

```bash
cd C:\Users\sorte\Desktop\Studiokook
node scripts/add-translation.js "Valmistame täpselt teie soovide järgi" "Изготавливаем точно по вашим пожеланиям"
```

**Step 2: Block 3 - Paras suhe**

```bash
node scripts/add-translation.js "Paras suhe hinnale ja kvaliteedile" "Лучшее соотношение цены и качества"
```

**Step 3: Block 4 - Kõrgklassi materjalid**

```bash
node scripts/add-translation.js "Kõrgklassi materjalid ja foorium" "Материалы и фурнитура премиум-класса"
```

**Step 4: Block 5 - Täielik teenindus**

```bash
node scripts/add-translation.js "Täielik teenindus – algusest lõpuni" "Полный сервис — от начала до конца"
```

**Step 5: Log completion**

```bash
echo "Blocks 2-5: DONE" >> C:\Users\sorte\Desktop\Studiokook\translation-progress.txt
```

---

## Task 8: Get Full Text for Homepage Blocks 6-9

**Files:**
- Execute: Bash curl to fetch Elementor page content

**Step 1: Fetch homepage Elementor content**

```bash
curl "https://studiokook.ee/wp-json/sk/v1/elementor/8" \
  -H "Authorization: Basic $(echo -n $WP_USER:$WP_APP_PASS | base64)" \
  > C:\Users\sorte\Desktop\Studiokook\homepage-content.json
```

Expected: JSON file with Elementor widgets content

**Step 2: Extract blocks starting with "-"**

Run: `grep -A 10 '"-' C:\Users\sorte\Desktop\Studiokook\homepage-content.json | head -n 50`

Expected: Four text blocks with "-" prefix visible

**Step 3: Document extracted texts**

Manually extract and save to `C:\Users\sorte\Desktop\Studiokook\blocks-6-9.txt`:
```
Block 6: [full Estonian text starting with "-"]
Block 7: [full Estonian text starting with "-"]
Block 8: [full Estonian text starting with "-"]
Block 9: [full Estonian text starting with "-"]
```

**Step 4: Verify extraction complete**

Run: `cat C:\Users\sorte\Desktop\Studiokook\blocks-6-9.txt | wc -l`

Expected: At least 4 lines (one per block)

---

## Task 9: Translate and Add Homepage Blocks 6-9

**Files:**
- Read: `C:\Users\sorte\Desktop\Studiokook\blocks-6-9.txt`
- Execute: `C:\Users\sorte\Desktop\Studiokook\scripts\add-translation.js` (4 times)

**Step 1: Translate Block 6 to Russian**

[Translate Estonian text to Russian maintaining professional kitchen furniture tone]

Run:
```bash
node scripts/add-translation.js "[Estonian Block 6 text]" "[Russian translation]"
```

**Step 2: Translate Block 7 to Russian**

Run:
```bash
node scripts/add-translation.js "[Estonian Block 7 text]" "[Russian translation]"
```

**Step 3: Translate Block 8 to Russian**

Run:
```bash
node scripts/add-translation.js "[Estonian Block 8 text]" "[Russian translation]"
```

**Step 4: Translate Block 9 to Russian**

Run:
```bash
node scripts/add-translation.js "[Estonian Block 9 text]" "[Russian translation]"
```

**Step 5: Log completion**

```bash
echo "Homepage blocks 6-9: DONE" >> C:\Users\sorte\Desktop\Studiokook\translation-progress.txt
```

---

## Task 10: Add /fassaadid/ Page Translations

**Files:**
- Execute: `C:\Users\sorte\Desktop\Studiokook\scripts\add-translation.js` (2 times)

**Step 1: Block 1 - Köögifassaadide materjalide valik**

```bash
cd C:\Users\sorte\Desktop\Studiokook
node scripts/add-translation.js "Köögifassaadide materjalide valik. Pakume kahte kvaliteetset tootjat." "Выбор материалов для кухонных фасадов. Предлагаем двух качественных производителей."
```

**Step 2: Block 2 - Itaalia innovaatiline**

```bash
node scripts/add-translation.js "Itaalia innovaatiline nanotehnoloogiline matt pinnamaterjal. Sõrmejälgedele vastupidav..." "Инновационный итальянский нанотехнологический матовый материал. Устойчив к отпечаткам пальцев..."
```

**Step 3: Log completion**

```bash
echo "/fassaadid/ translations: DONE" >> C:\Users\sorte\Desktop\Studiokook\translation-progress.txt
```

---

## Task 11: Add /toopinnad/ Page Translations

**Files:**
- Execute: `C:\Users\sorte\Desktop\Studiokook\scripts\add-translation.js` (2 times)

**Step 1: Block 1 - Kvaliteetsed tööpinnad**

```bash
cd C:\Users\sorte\Desktop\Studiokook
node scripts/add-translation.js "Kvaliteetsed tööpinnad teie köögile..." "Качественные рабочие поверхности для вашей кухни..."
```

**Step 2: Block 2 - Luksuslik ja vastupidav**

```bash
node scripts/add-translation.js "Luksuslik ja vastupidav. Graniit, kvarts ja tehiskivi..." "Роскошный и долговечный. Гранит, кварц и искусственный камень..."
```

**Step 3: Log completion**

```bash
echo "/toopinnad/ translations: DONE" >> C:\Users\sorte\Desktop\Studiokook\translation-progress.txt
```

---

## Task 12: Rebuild Dictionaries and Clear Cache

**Files:**
- Execute: Bash curl commands

**Step 1: Rebuild TRP dictionaries**

```bash
curl "https://studiokook.ee/wp-json/sk/v1/fix-trp-dicts" \
  -H "Authorization: Basic $(echo -n $WP_USER:$WP_APP_PASS | base64)"
```

Expected: Success response from API

**Step 2: Clear page cache**

```bash
curl "https://studiokook.ee/wp-json/sk/v1/touch-page" \
  -H "Authorization: Basic $(echo -n $WP_USER:$WP_APP_PASS | base64)"
```

Expected: Cache cleared confirmation

**Step 3: Log rebuild completion**

```bash
echo "Dictionaries rebuilt, cache cleared: DONE" >> C:\Users\sorte\Desktop\Studiokook\translation-progress.txt
```

---

## Task 13: Verify Russian Translations Visually

**Files:**
- Browser verification (manual step)

**Step 1: Check homepage /ru/**

Open: `https://studiokook.ee/ru/`

Verify: All 9 blocks visible in Russian (not Estonian)

**Step 2: Check /ru/fassaadid/**

Open: `https://studiokook.ee/ru/fassaadid/`

Verify: 2 blocks in Russian

**Step 3: Check /ru/toopinnad/**

Open: `https://studiokook.ee/ru/toopinnad/`

Verify: 2 blocks in Russian

**Step 4: Document any missing translations**

If any blocks still show Estonian, record to:
```bash
echo "[Page URL] - [Estonian text that didn't translate]" >> C:\Users\sorte\Desktop\Studiokook\missing-translations.txt
```

**Step 5: Log verification status**

```bash
echo "Visual verification: DONE (see missing-translations.txt for issues)" >> C:\Users\sorte\Desktop\Studiokook\translation-progress.txt
```

---

## Task 14: Check EN/FI Translations Status

**Files:**
- Execute: Bash curl to check untranslated strings

**Step 1: Check EN untranslated strings**

```bash
curl "https://studiokook.ee/wp-json/sk/v1/trp-untranslated" | grep -i "status.*0" > C:\Users\sorte\Desktop\Studiokook\en-missing.json
```

**Step 2: Analyze EN gaps**

Run: `cat C:\Users\sorte\Desktop\Studiokook\en-missing.json | wc -l`

Expected: Count of missing EN translations

**Step 3: Check /en/ homepage visually**

Open: `https://studiokook.ee/en/`

Verify: Compare with /ru/ - should have similar or better translation coverage

**Step 4: Check /fi/ homepage visually**

Open: `https://studiokook.ee/fi/`

Verify: Note any Estonian blocks that should be Finnish

**Step 5: Document EN/FI findings**

```bash
echo "EN missing count: [number]" >> C:\Users\sorte\Desktop\Studiokook\translation-progress.txt
echo "FI issues: [list pages with untranslated blocks]" >> C:\Users\sorte\Desktop\Studiokook\translation-progress.txt
```

---

## Task 15: Fix NextGEN Gallery Alt-Text Encoding

**Files:**
- Create: `C:\Users\sorte\Desktop\Studiokook\scripts\fix-ngg-encoding.php`
- Execute: WordPress Code Snippet or direct SQL fix

**Background:**
NextGEN Gallery image alt-texts on /ru/fassaadid/egger-fassaadid/ display as "?????????" due to double UTF-8 encoding or CP1251→UTF-8 mismatch in `wp_ngg_pictures` table.

**Step 1: Create diagnostic script**

Create `C:\Users\sorte\Desktop\Studiokook\scripts\fix-ngg-encoding.php`:

```php
<?php
/**
 * Fix NextGEN Gallery alt-text encoding issues
 * Run via WP-CLI or Code Snippets (one-time execution)
 */

global $wpdb;

// Get all NGG pictures with broken encoding
$pictures = $wpdb->get_results("
    SELECT pid, alttext, description, filename
    FROM {$wpdb->prefix}ngg_pictures
    WHERE alttext LIKE '%?%' OR description LIKE '%?%'
");

echo "Found " . count($pictures) . " images with encoding issues\n";

foreach ($pictures as $pic) {
    // Attempt to fix double UTF-8 encoding
    $fixed_alt = mb_convert_encoding($pic->alttext, 'UTF-8', 'UTF-8');

    // If still broken, try CP1251→UTF-8
    if (strpos($fixed_alt, '?') !== false) {
        $fixed_alt = mb_convert_encoding($pic->alttext, 'UTF-8', 'Windows-1251');
    }

    // Update if changed
    if ($fixed_alt !== $pic->alttext && !empty($fixed_alt)) {
        $wpdb->update(
            $wpdb->prefix . 'ngg_pictures',
            ['alttext' => $fixed_alt],
            ['pid' => $pic->pid],
            ['%s'],
            ['%d']
        );
        echo "Fixed: {$pic->filename} → {$fixed_alt}\n";
    }
}
```

**Step 2: Test via Code Snippets API**

Upload snippet:
```bash
curl -X POST "https://studiokook.ee/wp-json/code-snippets/v1/snippets" \
  -H "Authorization: Basic $(echo -n $WP_USER:$WP_APP_PASS | base64)" \
  -H "Content-Type: application/json" \
  -d @- <<EOF
{
  "name": "NGG Alt-Text Encoding Fix (one-time)",
  "code": "$(cat C:\Users\sorte\Desktop\Studiokook\scripts\fix-ngg-encoding.php | sed 's/"/\\"/g')",
  "scope": "admin",
  "active": false,
  "description": "Fix double UTF-8 encoding in NextGEN Gallery alt-texts"
}
EOF
```

**Step 3: Execute snippet manually via WordPress admin**

Navigate to: Tools → Code Snippets → "NGG Alt-Text Encoding Fix" → Run Once

**Step 4: Verify fix**

```bash
curl -s "https://studiokook.ee/ru/fassaadid/egger-fassaadid/" | grep -o "alt=\"[^\"]*\"" | grep "?" | wc -l
```

Expected: 0 (no more broken alt-texts)

**Step 5: Deactivate and document**

```bash
echo "NGG encoding fix applied on $(date)" >> C:\Users\sorte\Desktop\Studiokook\maintenance-log.txt
```

---

## Task 16: Final Commit and Push

**Files:**
- Git operations on both repositories

**Step 1: Commit plan update**

```bash
cd C:\Users\sorte\.claude
git add docs/plans/2026-02-12-translation-fix-final.md
git commit -m "docs: add Task 15 (NGG alt-text encoding fix)"
```

**Step 2: Commit SKILL.md changes**

```bash
cd C:\Users\sorte\.claude
git add skills/wordpress/SKILL.md
git commit -m "fix: SKILL.md methods + TRP table architecture

- Correct HTTP methods: fix-trp-dicts, fix-trp-tasuta, touch-page → GET
- Add critical TRP multi-table architecture documentation
- Replace RU translation workflow with Node.js UTF-8-safe script
- Add Windows/Bash gotchas section"
git push
```

**Step 2: Commit Studiokook work**

```bash
cd C:\Users\sorte\Desktop\Studiokook
git add scripts/add-translation.js translation-progress.txt
git commit -m "feat: add 15 Russian translations via TRP API

- Homepage: 9 blocks translated to RU
- /fassaadid/: 2 blocks
- /toopinnad/: 2 blocks
- Add Node.js translation helper script
- Document EN/FI translation status"
git push
```

**Step 3: Verify commits pushed**

Run: `git log --oneline -2` in both repos

Expected: Latest commits visible with correct messages

---

## Completion Checklist

- [ ] SKILL.md HTTP methods corrected (GET not POST)
- [ ] TRP multi-table architecture documented
- [ ] Node.js translation workflow added
- [ ] Windows/Bash gotchas section added
- [ ] Translation helper script created and tested
- [ ] 9 homepage RU translations added (including whitespace variants)
- [ ] 2 /fassaadid/ RU translations added
- [ ] 2 /toopinnad/ RU translations added
- [ ] Dictionaries rebuilt and cache cleared
- [ ] All RU pages verified visually in browser
- [ ] EN/FI translation status checked and documented
- [ ] NGG alt-text encoding fixed and verified
- [ ] Both repositories committed and pushed

## Notes

- Use Node.js script instead of curl for ALL UTF-8 content (Cyrillic, Estonian special chars)
- Remember: trp-search only shows EN table, use `lang: 'ru'` in trp-add for Russian translations
- Visual verification in browser is MANDATORY - API success doesn't guarantee visible translation
- Whitespace variants must be handled separately (with and without leading space)
