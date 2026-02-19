# План: Комплексный SEO-аудит и исправление ошибок studiokook.ee

**Обновлено:** 2026-02-09

---

## ЧАСТЬ 1: Технические SEO-ошибки (ранее исправлено)

| # | Проблема | Статус |
|---|----------|--------|
| 1 | 301 редиректы для дублей URL | ✅ Код готов |
| 2 | FAQ schema multilingual fix | ✅ Код готов |
| 3 | Meta descriptions для подкатегорий | ✅ Код готов |

**Файлы готовы к деплою:**
- `code-snippets/04-301-redirects.php` — 15 новых редиректов
- `scripts/SEO_SCHEMAS_FAQ.php` — исправлен для multilingual
- `code-snippets/11-egger-subcategories-meta.php` — создан

---

## ЧАСТЬ 2: Проблемы контента и заголовков (НОВОЕ)

### 🔴 КРИТИЧЕСКИЕ проблемы заголовков

| Страница | Проблема | Детали |
|----------|----------|--------|
| `/toopinnad/` | **0 H1 тегов** | Нет заголовка первого уровня вообще |
| `/toopinnad/hpl-tootasapinnad/` | **2 H1 тега** | Дублирование: "HPL kompaktlaminaat töötasapinnad" × 2 |
| `/fassaadid/egger-fassaadid/` | **2 H1 тега** | Дублирование: "Egger" × 2, + H2 "Egger fassaadimaterjalid" |
| `/fassaadid/fenix/` | **2 H1 тега** | "Fenix" + "Fenix NTM Fassaadid", + H2 = "Fenix" (дубль!) |
| `/fassaadid/` | **0 H2/H3** | Только H1, нет иерархии контента |

### Пример проблемы (из запроса пользователя):

```
HPL kompaktlaminaat töötasapinnad    ← H1 #1
HPL Kompaktlaminaat Töötasapinnad    ← H1 #2 (дубль!)
HPL kompaktlaminaat töötasapinnad    ← H2 (ещё один дубль!)
HPL (High Pressure Laminate)...      ← текст

Egger                                 ← H1 #1
Egger                                 ← H1 #2 (дубль!)
Egger fassaadimaterjalid             ← H2 (тройное повторение!)
```

### 🟠 Проблемы копирайтинга

| Страница | Проблема |
|----------|----------|
| HPL | Слово "HPL kompaktlaminaat" повторяется 20+ раз |
| Ламинат | Странный H2: "Lamineeritud Pindade ja Tööpindade Eelised Köögimööbli Valmistamisel Tallinnas" |
| Камень | Контент идёт ПОСЛЕ галереи, 0 H3 тегов |
| Egger | 3× повторение "Egger" в заголовках |
| Fenix | 4× повторение "Fenix/FENIX" в заголовках |

### 🟡 Слабые показатели GSC

| Страница | Клики | Показы | CTR | Позиция |
|----------|-------|--------|-----|---------|
| /toopinnad/hpl-tootasapinnad/ | 0 | 10 | 0% | 4.9 |
| /fassaadid/egger-fassaadid/ | 0 | 3 | 0% | 6.3 |
| /fassaadid/fenix/ | 0 | 1 | 0% | 9.0 |

**Вывод:** Страницы ранжируются, но НЕ получают кликов из-за слабых meta descriptions и контента.

---

## Диагностика корневых причин

### 1. HPL страницы (УТОЧНЕНО)
- **Правильный URL:** `/hpl-tootasapinnad/` (в корне, НЕ в /toopinnad/)
- **Статус GSC:** ИНДЕКСИРУЕТСЯ (проверено 2026-02-09)
- **Проблема:** Ранее думали что URL должен быть вложенным — это НЕВЕРНО
- **Действие:** Убраны HPL редиректы из 04-301-redirects.php

**Структура столешниц (актуальная):**
- `/hpl-tootasapinnad/` — HPL (в корне)
- `/laminaadist-tootasapinnad/` — Ламинат (в корне)
- `/kividest-tootasapinnad/` — Камень (в корне)

### 2. Подкатегории Egger (КРИТИЧЕСКОЕ)
- `/kivi/`, `/monokroom/`, `/puit/` - НЕТ canonical тега, НЕТ meta description
- Возможно дубли с `/egger/kivi/` и т.д.

### 3. Дубли фасадов (ВЫСОКОЕ)
- `/egger-fassaadid/` → canonical указывает на `/fassaadid/egger-fassaadid/`
- `/fenix/` → canonical указывает на `/fassaadid/fenix/`
- Нужны 301 редиректы со старых URL

### 4. FAQ schema не multilingual (СРЕДНЕЕ)
- `SEO_SCHEMAS_FAQ.php:14` использует `is_page('hpl-tootasapinnad')`
- Это работает только для ET, не для `/ru/hpl-tootasapinnad/`

---

## План исправлений

### Фаза 1: Диагностика структуры URL (READ-ONLY)

1. **SQL-запрос для определения иерархии страниц:**
```sql
SELECT c.ID, c.post_title, c.post_name, p.post_name as parent_slug
FROM wp_posts c
LEFT JOIN wp_posts p ON c.post_parent = p.ID
WHERE c.post_type = 'page' AND c.post_status = 'publish'
AND c.post_name IN ('hpl-tootasapinnad', 'egger-fassaadid', 'fenix', 'kivi', 'monokroom', 'puit');
```

2. **Проверить Yoast noindex:**
```sql
SELECT p.ID, p.post_title, pm.meta_value
FROM wp_posts p
JOIN wp_postmeta pm ON p.ID = pm.post_id
WHERE pm.meta_key = '_yoast_wpseo_meta-robots-noindex' AND pm.meta_value = '1';
```

### Фаза 2: 301 редиректы (ФАЙЛ: code-snippets/04-301-redirects.php)

Добавить в массив `$redirects`:

```php
// Фасады - старые URL → вложенные
'/egger-fassaadid/' => '/fassaadid/egger-fassaadid/',
'/ru/egger-fassaadid/' => '/ru/fassaadid/egger-fassaadid/',
'/en/egger-fassaadid/' => '/en/fassaadid/egger-fassaadid/',
'/fi/egger-fassaadid/' => '/fi/fassaadid/egger-fassaadid/',

'/fenix/' => '/fassaadid/fenix/',
'/ru/fenix/' => '/ru/fassaadid/fenix/',
'/en/fenix/' => '/en/fassaadid/fenix/',
'/fi/fenix/' => '/fi/fassaadid/fenix/',

// Подкатегории материалов (если нужно)
'/kivi/' => '/egger/kivi/',
'/monokroom/' => '/egger/monokroom/',
'/puit/' => '/egger/puit/',
```

### Фаза 3: Исправление FAQ schema (ФАЙЛ: scripts/SEO_SCHEMAS_FAQ.php)

**Проблема:** `is_page('slug')` не работает с TranslatePress URL.

**Решение:** Заменить на URL matching:

```php
// Вместо: if (!is_page('hpl-tootasapinnad')) return;
// Использовать:
function studiokook_is_page_multilang($base_slug) {
    $uri = $_SERVER['REQUEST_URI'];
    // Проверяем ET, RU, EN, FI версии
    return preg_match('#^/(ru/|en/|fi/)?' . preg_quote($base_slug, '#') . '/?$#', $uri);
}

if (!studiokook_is_page_multilang('hpl-tootasapinnad')) return;
```

Применить ко ВСЕМ FAQ schema в файле (строки 14, 72, 130, 313).

### Фаза 4: Meta descriptions для подкатегорий

**Новый snippet:** `code-snippets/11-egger-subcategories-meta.php`

Добавить meta description для `/egger/kivi/`, `/egger/monokroom/`, `/egger/puit/` на 4 языках.

### Фаза 5: Проверка sitemap

1. В WordPress Admin: **Yoast SEO → Settings → Site Features → Sitemaps**
2. Проверить, что HPL страницы включены
3. Очистить кэш sitemap

---

## Критические файлы для редактирования

| Файл | Действие |
|------|----------|
| `C:/Users/sorte/Desktop/Studiokook/code-snippets/04-301-redirects.php` | Добавить 12 редиректов |
| `C:/Users/sorte/Desktop/Studiokook/scripts/SEO_SCHEMAS_FAQ.php` | Заменить is_page() на URL matching |
| `C:/Users/sorte/Desktop/Studiokook/code-snippets/11-egger-subcategories-meta.php` | Создать новый (meta descriptions) |

---

## Верификация после исправлений

### 1. Проверить редиректы (Bash):
```bash
curl -I https://studiokook.ee/egger-fassaadid/
# Ожидается: HTTP/2 301, Location: /fassaadid/egger-fassaadid/

curl -I https://studiokook.ee/fenix/
# Ожидается: HTTP/2 301, Location: /fassaadid/fenix/
```

### 2. Проверить FAQ schema (Browser DevTools):
- Открыть https://studiokook.ee/ru/hpl-tootasapinnad/
- Ctrl+U → искать `FAQPage`
- Должен быть JSON-LD с русскими вопросами

### 3. Запросить переиндексацию в GSC:
```
mcp__gsc__batch_url_inspection(
    site_url="sc-domain:studiokook.ee",
    urls="https://studiokook.ee/hpl-tootasapinnad/
https://studiokook.ee/fassaadid/egger-fassaadid/
https://studiokook.ee/fassaadid/fenix/
https://studiokook.ee/egger/kivi/"
)
```

### 4. Мониторинг через 7 дней:
- GSC Coverage Report: все URL "Submitted and indexed"
- Старые URL показывают "Redirected"

---

---

## ЧАСТЬ 3: План исправления контента

### Фаза A: Исправление H1 тегов (WordPress Admin)

**Страницы требующие исправления:**

| Страница | Текущее | Требуется |
|----------|---------|-----------|
| /toopinnad/ | 0 H1 | Добавить H1: "Köögitöötasapinnad" |
| /toopinnad/hpl-tootasapinnad/ | 2 H1 | Оставить 1 H1, второй → H2 или удалить |
| /fassaadid/egger-fassaadid/ | 2 H1 "Egger" | Оставить 1 H1: "Egger Fassaadid" |
| /fassaadid/fenix/ | 2 H1 | Оставить 1 H1: "Fenix NTM Fassaadid" |

**Метод исправления:**
1. WP Admin → Pages → найти страницу
2. Открыть в Elementor (или редакторе)
3. Найти виджеты Heading с тегом H1
4. Оставить только ОДИН H1 на странице
5. Остальные изменить на H2 или удалить

### Фаза B: Рефакторинг структуры заголовков

**HPL страница — целевая структура:**
```
H1: HPL Kompaktlaminaat Töötasapinnad
  H2: Mis on HPL kompaktlaminaat?
    (текст описания)
  H2: HPL eelised
    H3: Vastupidavus
    H3: Niiskuskindlus
  H2: Meie HPL brändid
    H3: Egger (11 dekoori)
    H3: Fundermax (16 dekoori)
  H2: Korduma kippuvad küsimused (FAQ)
```

**Egger фасады — целевая структура:**
```
H1: Egger Fassaadid — Laminaat ja PerfectSense Matt
  H2: Materjalide ülevaade
    (текст)
  H2: Dekooriseeriad
    H3: F-series (kivi tekstuurid)
    H3: H-series (puit tekstuurid)
    H3: U-series (monokroom)
  H2: Tehnilised omadused
  H2: Korduma kippuvad küsimused
```

### Фаза C: Улучшение копирайтинга

**Принципы:**
1. **Снизить keyword stuffing** — max 8 повторений ключевого слова на 1000 слов
2. **Убрать водянистость** — каждый абзац должен нести информацию
3. **Добавить структуру** — использовать H3 для подтем
4. **Добавить CTA** — в конце каждой секции

**Конкретные правки:**

| Страница | Убрать | Добавить |
|----------|--------|----------|
| HPL | 12+ лишних повторений "HPL kompaktlaminaat" | Сравнительную таблицу Egger vs Fundermax |
| Ламинат | Странный длинный H2 с "Tallinnas" | Нормальный H2: "Laminaadi eelised" |
| Камень | — | Переместить текст ВЫШЕ галереи |
| Egger | 2 лишних H1 "Egger" | Один чёткий H1 + описательные H2 |
| Fenix | H2 "Fenix" (дубль H1) | H2 "Fenix NTM omadused" |

---

## ЧАСТЬ 4: Верификация

### После исправлений проверить:

1. **H1 теги** — только 1 на страницу
   ```bash
   curl -s https://studiokook.ee/toopinnad/hpl-tootasapinnad/ | grep -c "<h1"
   # Ожидается: 1
   ```

2. **Rich Results Test:**
   - https://search.google.com/test/rich-results
   - Проверить FAQ schema работает на /ru/ версиях

3. **GSC URL Inspection:**
   - Запросить переиндексацию исправленных страниц

### Мониторинг через 14 дней:

- CTR должен вырасти (текущий 0% → цель 2-3%)
- Позиции могут временно упасть после изменений (это нормально)

---

## Ограничения (из CLAUDE.md)

- НИКОГДА `wp_update_post()` в snippets — только `$wpdb->update()`
- Code Snippets plugin для PHP кода
- Scope: "Only run on site front-end" для SEO snippets
- Изменения контента страниц — через WP Admin / Elementor

---

## Приоритет выполнения

| # | Задача | Приоритет | Где делать |
|---|--------|-----------|------------|
| 1 | Деплой 301 редиректов | 🔴 КРИТИЧНО | Code Snippets |
| 2 | Деплой FAQ schema fix | 🔴 КРИТИЧНО | Code Snippets |
| 3 | Исправить дубли H1 (5 страниц) | 🔴 КРИТИЧНО | WP Admin/Elementor |
| 4 | Добавить H1 на /toopinnad/ | 🟠 ВЫСОКО | WP Admin/Elementor |
| 5 | Рефакторинг H2/H3 структуры | 🟠 ВЫСОКО | WP Admin/Elementor |
| 6 | Снизить keyword stuffing | 🟡 СРЕДНЕ | WP Admin/Elementor |
| 7 | Улучшить meta descriptions | 🟡 СРЕДНЕ | Yoast SEO |
