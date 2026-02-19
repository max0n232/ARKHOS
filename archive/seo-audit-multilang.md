# SEO-Аудит: Мультиязычность studiokook.ee

**Дата:** 2025-02-07
**Версии:** ET (основной), RU, EN, FI

---

## КРИТИЧЕСКИЕ ПРОБЛЕМЫ

### 1. hreflang теги — ОТСУТСТВУЮТ ❌

**Статус:** Ни на одной странице нет hreflang тегов.

**Влияние:**
- Google не понимает связь между языковыми версиями
- Риск дублированного контента
- Неправильная выдача в поиске (русскому пользователю показывает ET)

**Исправление:** Добавить на ВСЕ страницы:
```html
<link rel="alternate" hreflang="et" href="https://studiokook.ee/" />
<link rel="alternate" hreflang="ru" href="https://studiokook.ee/ru/" />
<link rel="alternate" hreflang="en" href="https://studiokook.ee/en/" />
<link rel="alternate" hreflang="fi" href="https://studiokook.ee/fi/" />
<link rel="alternate" hreflang="x-default" href="https://studiokook.ee/" />
```

---

### 2. Title/Meta Description — НЕ ПЕРЕВЕДЕНЫ ❌

| Страница | Проблема |
|----------|----------|
| `/` (ET) | ✅ OK — на эстонском |
| `/ru/` | ❌ Title на **ЭСТОНСКОМ**: "Köögimööbel tellimustöö Tallinnas" |
| `/en/` | ❌ Title на **ЭСТОНСКОМ**: "Köögimööbel tellimustöö Tallinnas" |
| `/fi/` | ❌ Title на **ЭСТОНСКОМ**: "Köögimööbel tellimustöö Tallinnas" |

**Правильные Title:**
- **RU:** "Кухонная мебель на заказ в Таллинне | Studioköök"
- **EN:** "Custom Kitchen Furniture in Tallinn | Studioköök"
- **FI:** "Mittatilauskeittöt Tallinnassa | Studioköök"

**Правильные Meta Description:**
- **RU:** "Кухни на заказ по индивидуальным размерам. Австрийская фурнитура, 5 лет гарантии. Бесплатный 3D-дизайн. ☎ +372 55 525 143"
- **EN:** "Custom kitchens tailored to your specifications. Austrian hardware, 5-year warranty. Free 3D design. ☎ +372 55 525 143"
- **FI:** "Mittatilauskeittöt yksilöllisten mittojen mukaan. Itävaltalainen helat, 5 vuoden takuu. Ilmainen 3D-suunnittelu. ☎ +372 55 525 143"

---

### 3. URL Slugs — ЭСТОНСКИЕ НА ВСЕХ ВЕРСИЯХ ❌

| Текущий URL | Проблема | Правильный URL |
|-------------|----------|----------------|
| `/ru/kontakt/` | Slug на ET | `/ru/kontakty/` |
| `/en/kontakt/` | Slug на ET | `/en/contact/` |
| `/fi/kontakt/` | Slug на ET | `/fi/yhteystiedot/` |
| `/ru/koogid-eritellimusel/` | Slug на ET | `/ru/kuhni-na-zakaz/` |
| `/en/koogid-eritellimusel/` | Slug на ET | `/en/custom-kitchens/` |
| `/fi/koogid-eritellimusel/` | Slug на ET | `/fi/mittatilauskeittiot/` |
| `/ru/hinnaparing/` | Slug на ET | `/ru/raschet-stoimosti/` |
| `/en/hinnaparing/` | Slug на ET | `/en/price-quote/` |
| `/fi/hinnaparing/` | Slug на ET | `/fi/hintatiedustelu/` |

---

### 4. Canonical URL — УКАЗЫВАЕТ НА ЭСТОНСКУЮ ВЕРСИЮ ❌

**Проблема:** Все языковые версии имеют canonical на `https://studiokook.ee/` (без языкового префикса).

**Исправление:** Каждая версия должна иметь self-referencing canonical:
- `/ru/` → canonical = `https://studiokook.ee/ru/`
- `/en/` → canonical = `https://studiokook.ee/en/`
- `/fi/` → canonical = `https://studiokook.ee/fi/`

---

## ВЫСОКИЙ ПРИОРИТЕТ

### 5. Alt-теги изображений — ВСЕ НА ЭСТОНСКОМ ⚠️

**Пример текущего alt:**
> "Moodne eritellimuskööк siniste ja puidust kappidega, mustast marmornimitatsioonist töötasapinnaga"

**Нужно перевести для каждой версии:**
- **RU:** "Современная кухня на заказ с синими и деревянными шкафами, столешница из чёрного мрамора"
- **EN:** "Modern custom kitchen with blue and wooden cabinets, black marble countertop"
- **FI:** "Moderni mittatilaueskeittiö sinisillä ja puukaapeilla, musta marmoripöytälevy"

---

### 6. Schema.org — ЧАСТИЧНЫЕ ПРОБЛЕМЫ ⚠️

| Версия | inLanguage | Проблема |
|--------|------------|----------|
| `/` | et | ✅ OK |
| `/ru/` | ru-RU | ✅ OK |
| `/en/` | en-GB | ✅ OK |
| `/fi/` | fi | ✅ OK |

**НО:** Контент в schema (name, description) на эстонском для всех версий.

---

### 7. Контент страниц — СМЕШАННЫЕ ЯЗЫКИ ⚠️

| Страница | Основной контент | Проблемы |
|----------|------------------|----------|
| `/ru/koogid-eritellimusel/` | RU | ✅ Title/meta на RU |
| `/en/koogid-eritellimusel/` | Смешанный EN+ET | ⚠️ Часть текста на ET |
| `/fi/koogid-eritellimusel/` | ET | ❌ Контент на эстонском! |
| `/ru/kontakt/` | ET | ❌ Контент на эстонском! |
| `/en/kontakt/` | ET | ❌ Контент на эстонском! |
| `/fi/kontakt/` | Смешанный FI+ET | ⚠️ Meta на FI, title на ET |

---

## СРЕДНИЙ ПРИОРИТЕТ

### 8. H1 теги — НЕ ВИДНЫ / НЕ ПЕРЕВЕДЕНЫ

Elementor-структура скрывает H1. Нужно проверить в исходном коде страниц.

---

## ПЛАН ИСПРАВЛЕНИЙ

### Фаза 1: Критическое (1-2 дня)

1. **Добавить hreflang** — Code Snippets PHP
2. **Исправить canonical** — Yoast SEO настройки
3. **Перевести Title/Meta** — Yoast SEO для каждой страницы

### Фаза 2: Высокий приоритет (3-5 дней)

4. **Изменить URL slugs** — WPML/Polylang настройки + редиректы 301
5. **Перевести alt-теги** — Media Library для каждого языка
6. **Исправить schema** — Code Snippets или Yoast настройки

### Фаза 3: Контент (5-10 дней)

7. **Перевести страницу Контакты** — RU, EN, FI версии
8. **Проверить и исправить смешанный контент** — все страницы
9. **Перевести FAQ секции** — все языки

---

## КОД: hreflang snippet

```php
<?php
/**
 * Add hreflang tags for multilingual SEO
 * Добавить в Code Snippets
 */
add_action('wp_head', 'studiokook_hreflang_tags');

function studiokook_hreflang_tags() {
    $languages = [
        'et' => '',
        'ru' => '/ru',
        'en' => '/en',
        'fi' => '/fi'
    ];

    $current_path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $current_path = preg_replace('#^/(ru|en|fi)#', '', $current_path);

    foreach ($languages as $lang => $prefix) {
        $url = 'https://studiokook.ee' . $prefix . $current_path;
        echo '<link rel="alternate" hreflang="' . $lang . '" href="' . esc_url($url) . '" />' . "\n";
    }

    // x-default
    echo '<link rel="alternate" hreflang="x-default" href="https://studiokook.ee' . $current_path . '" />' . "\n";
}
```

---

## МЕТРИКИ УСПЕХА

После исправлений проверить через:
- [ ] Google Search Console → International Targeting
- [ ] hreflang Tags Testing Tool
- [ ] Ahrefs/Semrush Site Audit
- [ ] Google Rich Results Test (schema)
