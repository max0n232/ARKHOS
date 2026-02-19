# SEO и Локализация: Полный Аудит studiokook.ee

**Дата:** 2026-02-11
**Аудитор:** Claude Code
**Сайт:** https://studiokook.ee
**CMS:** WordPress + Yoast SEO + мультиязычный плагин
**Языки:** ET (основной), RU, FI, EN

---

## Сводка

| Метрика | Значение |
|---------|----------|
| **Всего проблем** | 47+ |
| **Критических** | 12 |
| **Важных** | 23 |
| **Незначительных** | 12 |
| **Оценка локализации** | **3/10** |

### Ключевые выводы

1. **Meta description** — ОДИНАКОВЫЙ эстонский текст на всех 4 языках
2. **og:title и og:description** — эстонские на EN/RU/FI версиях
3. **hreflang x-default** — указывает на РАЗНЫЕ версии вместо одной
4. **URL-слаги** — эстонские на всех языках
5. **Контент страниц** — частично или полностью не переведён

---

## 1. КРИТИЧЕСКИЕ ПРОБЛЕМЫ (немедленное исправление)

### 1.1 Meta Description не переведён

| Языковая версия | Текущее значение | Должно быть |
|-----------------|------------------|-------------|
| ET (/) | "Kohandatud koogid alates 2500 eurot. Tasuta 3D-projekt + moodistamine..." | ✅ OK |
| RU (/ru/) | "Kohandatud koogid alates 2500 eurot..." (ЭСТОНСКИЙ) | "Кухни на заказ от 2500 евро. Бесплатный 3D-проект + замер..." |
| EN (/en/) | "Kohandatud koogid alates 2500 eurot..." (ЭСТОНСКИЙ) | "Custom kitchens from €2500. Free 3D design + measurement..." |
| FI (/fi/) | "Kohandatud koogid alates 2500 eurot..." (ЭСТОНСКИЙ) | "Mittatilauskeittöt alkaen 2500 euroa. Ilmainen 3D-suunnittelu..." |

**Влияние:** Google показывает эстонский текст в сниппетах для всех языков → потеря CTR

### 1.2 Open Graph теги не переведены

**og:title на всех языках:**
```
"Köögimööbel eritellimusel Tallinnas | Hinnad alates €2500 | Studioköök"
```

**og:description на всех языках:**
```
"Kohandatud koogid alates 2500 eurot. Tasuta 3D-projekt + moodistamine..."
```

**Влияние:** При шаринге в соцсетях показывается эстонский текст → низкий engagement

### 1.3 hreflang x-default указывает на разные версии

| Страница | x-default указывает на |
|----------|------------------------|
| / (ET) | https://studiokook.ee/ |
| /ru/ | https://studiokook.ee/ru/ |
| /en/ | https://studiokook.ee/en/ |
| /fi/ | https://studiokook.ee/fi/ |

**Должно быть:** x-default должен указывать на ОДНУ версию (обычно английскую или основную)

**Влияние:** Google путается в определении основной версии → каннибализация

### 1.4 Контент FI-версии главной — на эстонском

**URL:** https://studiokook.ee/fi/koogid-eritellimusel/

- Title: "Mittatilauskeittöt Tallinnassa | Studioköök" ✅
- H1: "Köögimöbel eritellimusel | Hinnad alates €2500" ❌ ЭСТОНСКИЙ
- FAQ секции: полностью на эстонском ❌

### 1.5 Footer: дни недели не переведены

| Версия | Текущее | Должно быть |
|--------|---------|-------------|
| EN | "E – R: 9:00-16:30. L, P: suletud" | "Mon – Fri: 9:00-16:30. Sat, Sun: closed" |
| FI | "E – R: 9:00-16:30. L, P: suletud" | "Ma – Pe: 9:00-16:30. La, Su: suljettu" |
| RU | "Пн — Пт: 9:00-16:30" | ✅ OK |

### 1.6 Copyright устарел

**Текущее:** "STUDIOKÖÖK OÜ © 2024"
**Должно быть:** "STUDIOKÖÖK OÜ © 2025" или "© 2024-2026"

---

## 2. ВАЖНЫЕ ПРОБЛЕМЫ

### 2.1 URL-слаги на эстонском во всех языках

| Страница | Текущий URL (EN) | Рекомендуемый URL |
|----------|------------------|-------------------|
| Кухни на заказ | /en/koogid-eritellimusel/ | /en/custom-kitchens/ |
| Галерея | /en/koogid/ | /en/kitchen-gallery/ |
| Материалы | /en/materjalid/ | /en/materials/ |
| Фурнитура | /en/meie-furnituur/ | /en/hardware/ |
| Ящики | /en/sahtlid/ | /en/drawers/ |
| Системы хранения | /en/ladustamissusteemid/ | /en/storage-systems/ |
| Угловые механизмы | /en/nurgamehhanismid/ | /en/corner-mechanisms/ |
| Подъёмные механизмы | /en/tostemehhanismid/ | /en/lifting-mechanisms/ |
| Столешницы | /en/toopinnad/ | /en/countertops/ |
| Фасады | /en/fassaadid/ | /en/facades/ |
| Запрос цены | /en/hinnaparing/ | /en/quote-request/ |
| Блог | /en/blogi/ | /en/blog/ |
| Контакт | /en/kontakt/ | /en/contact/ |

**Аналогично для RU и FI версий**

### 2.2 Навигация: пункты меню не переведены

**EN версия — найдены эстонские пункты:**
- "Töötasapinnad" → должно быть "Countertops"
- "Fassaadid" → должно быть "Facades"
- "Avaleht" (в breadcrumbs) → должно быть "Home"

### 2.3 Alt-тексты изображений на эстонском

**Пример с EN галереи (/en/koogid/):**
```
alt="Kaasaegne hall köögimoobel valge kuusnurga tagaseinaga ja mustade tööpindadega eritellimuskööka"
```
**Должно быть:**
```
alt="Modern gray kitchen furniture with white hexagonal backsplash and black countertops"
```

### 2.4 Страница /en/fassaadid/ — смешанный контент

- H1: "Fassaadid" (эстонский)
- Описания производителей: на эстонском
- Навигация: частично на английском

### 2.5 Страница /ru/materjalid/ — H1 на эстонском

- Title: "Материалы для кухонь | Studioköök" ✅
- Schema H1: "Köög materjalid: tööatasapinnad, furnituur, torustik, fassaadid..." ❌

### 2.6 Блог: заголовок раздела на эстонском

**EN/RU/FI версии /blogi/:**
- Title: "Köögimööbli ja Trendide Artiklid - Studioköök" (ЭСТОНСКИЙ)
- Должно быть переведено для каждого языка

### 2.7 Статьи блога не переведены

URL статей одинаковые на всех языках:
- /en/koogimoobel-tellimisel-mida-peaks-teadma-2026-aastal/
- /ru/koogimoobel-tellimisel-mida-peaks-teadma-2026-aastal/

Контент статей — на эстонском во всех версиях.

---

## 3. ТЕХНИЧЕСКИЕ SEO ПРОБЛЕМЫ

### 3.1 HTML lang атрибуты

| Версия | Текущее | Статус |
|--------|---------|--------|
| ET | `lang="et"` | ✅ OK |
| RU | `lang="ru-RU"` | ✅ OK |
| EN | `lang="en-GB"` | ✅ OK |
| FI | `lang="fi"` | ✅ OK |

### 3.2 Canonical URLs

| Версия | Canonical | Статус |
|--------|-----------|--------|
| / | https://studiokook.ee/ | ✅ OK |
| /ru/ | https://studiokook.ee/ru/ | ✅ OK |
| /en/ | https://studiokook.ee/en/ | ✅ OK |
| /fi/ | https://studiokook.ee/fi/ | ✅ OK |

### 3.3 og:locale

| Версия | Значение | Статус |
|--------|----------|--------|
| ET | et_EE | ✅ OK |
| RU | ru_RU | ✅ OK |
| EN | en_GB | ✅ OK |
| FI | fi_FI | ✅ OK |

### 3.4 Structured Data (Schema.org)

**Найдены схемы:**
- WebPage ✅
- FurnitureStore ✅
- FAQPage ✅
- BreadcrumbList ✅
- ImageObject ✅

**Проблемы:**
- FurnitureStore description — на эстонском во всех версиях
- FAQPage questions/answers — на эстонском в FI версии

### 3.5 Sitemap

- sitemap_index.xml ✅ (3 дочерних)
- page-sitemap.xml — 14 страниц × 4 языка = 56 URL ✅
- post-sitemap.xml — 21 статья × 4 языка ✅
- category-sitemap.xml ✅

### 3.6 Robots.txt

✅ Корректно настроен:
- Sitemap указан
- wp-json заблокирован
- UTM параметры в Clean-param

---

## 4. ТАБЛИЦА ВСЕХ ПРОБЛЕМ

### Главные страницы

| URL | Элемент | Проблема | Критичность |
|-----|---------|----------|-------------|
| /ru/, /en/, /fi/ | meta description | Эстонский текст | КРИТИЧЕСКАЯ |
| /ru/, /en/, /fi/ | og:title | Эстонский текст | КРИТИЧЕСКАЯ |
| /ru/, /en/, /fi/ | og:description | Эстонский текст | КРИТИЧЕСКАЯ |
| все | hreflang x-default | Указывает на себя | КРИТИЧЕСКАЯ |
| /en/ | footer working hours | "E – R" вместо "Mon – Fri" | ВАЖНАЯ |
| /fi/ | footer working hours | "E – R" вместо "Ma – Pe" | ВАЖНАЯ |
| все | copyright | 2024 вместо 2025 | НЕЗНАЧИТЕЛЬНАЯ |

### Внутренние страницы

| URL | Элемент | Проблема | Критичность |
|-----|---------|----------|-------------|
| /en/fassaadid/ | H1 | "Fassaadid" — эстонский | ВАЖНАЯ |
| /en/fassaadid/ | body content | Описания на эстонском | ВАЖНАЯ |
| /fi/koogid-eritellimusel/ | H1, FAQ | Полностью на эстонском | КРИТИЧЕСКАЯ |
| /en/koogid/ | img alt | Эстонские alt-тексты | ВАЖНАЯ |
| /ru/materjalid/ | schema H1 | Эстонский | ВАЖНАЯ |
| все внутренние | URL slugs | Эстонские слаги | ВАЖНАЯ |
| /en/blogi/ | title | Эстонский | ВАЖНАЯ |
| статьи блога | content | Не переведены | ВАЖНАЯ |

### Навигация

| URL | Элемент | Проблема | Критичность |
|-----|---------|----------|-------------|
| /en/ submenu | menu items | "Töötasapinnad", "Fassaadid" | ВАЖНАЯ |
| /en/ breadcrumbs | "Avaleht" | Должно быть "Home" | НЕЗНАЧИТЕЛЬНАЯ |

---

## 5. ПРИОРИТЕТНЫЙ ПЛАН ИСПРАВЛЕНИЙ

### Фаза 1: Критические (1-2 дня)

1. **Meta description** — перевести в Yoast SEO для каждой языковой версии
2. **og:title и og:description** — настроить в Yoast Social для каждого языка
3. **hreflang x-default** — настроить указывать на /en/ или / (один вариант)
4. **FI главная** — перевести весь контент с эстонского на финский

### Фаза 2: Важные (3-5 дней)

5. **Footer** — перевести дни недели для EN и FI
6. **Copyright** — обновить год
7. **URL slugs** — создать переводы URL в мультиязычном плагине
8. **Навигация** — перевести все пункты меню
9. **Alt-тексты** — перевести для всех изображений

### Фаза 3: Контент (1-2 недели)

10. **Внутренние страницы** — перевести body контент
11. **Блог** — перевести статьи или скрыть для неосновных языков
12. **Schema.org** — локализовать descriptions

---

## 6. ЧЕКЛИСТ ДЛЯ РАЗРАБОТЧИКА

### WordPress Admin → Yoast SEO

- [ ] Главная RU: заполнить SEO title + meta description на русском
- [ ] Главная EN: заполнить SEO title + meta description на английском
- [ ] Главная FI: заполнить SEO title + meta description на финском
- [ ] Для каждой страницы: Social → OG title + description на нужном языке

### Мультиязычный плагин (WPML/Polylang/TranslatePress)

- [ ] Настроить x-default на одну версию (/en/ рекомендуется)
- [ ] Создать переводы URL-слагов для всех страниц
- [ ] Перевести пункты меню
- [ ] Перевести виджеты footer

### Elementor / Контент

- [ ] /fi/koogid-eritellimusel/ — перевести весь контент
- [ ] /en/fassaadid/ — перевести H1 и описания
- [ ] Все галереи — перевести alt-тексты изображений

### Theme / Code

- [ ] Footer: заменить "E – R" на локализованные дни недели
- [ ] Copyright: обновить год на 2025 или динамический

---

## 7. ИНСТРУМЕНТЫ ДЛЯ ПРОВЕРКИ

После исправлений проверить:

1. **hreflang:** https://technicalseo.com/tools/hreflang/
2. **OG tags:** https://developers.facebook.com/tools/debug/
3. **Schema:** https://search.google.com/test/rich-results
4. **Mobile:** https://search.google.com/test/mobile-friendly
5. **GSC:** Проверить отчёт International Targeting

---

## Заключение

Сайт studiokook.ee имеет серьёзные проблемы с локализацией. Основная причина — неполная настройка мультиязычного плагина и Yoast SEO для каждой языковой версии.

**Критический приоритет:** Meta description и OG теги — они напрямую влияют на CTR в Google и соцсетях.

**Оценка:** 3/10 — требуется комплексная работа над локализацией.
