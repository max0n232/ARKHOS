# Технический SEO-аудит studiokook.ee
**Дата:** 2026-02-14
**Проверено:** 24 страницы (ET) + 66 проверок переводов (RU/EN/FI)
**Обновлено:** 2026-02-14 — все фазы 1-4 выполнены

---

## 1. ~~CRITICAL — Hreflang дубли (ВСЕ страницы)~~ ✅ ИСПРАВЛЕНО

На каждой странице было 7 hreflang-тегов вместо 5. Дубли `ru-RU` и `en-GB` убраны через TranslatePress → Settings → Advanced → "Удалить повторяющийся hreflang" → "Удалить локаль страны". Теперь 5 тегов: `x-default`, `et`, `ru`, `en`, `fi`.

---

## 2. ~~HIGH — Непереведённые H1/контент~~ ✅ ИСПРАВЛЕНО

Все H1 переведены через TranslatePress visual editor:
- /fassaadid/fenix/ → RU "Фасадные материалы Fenix", EN "Fenix facade materials", FI "Fenix-julkisivumateriaalit"
- /fassaadid/egger-fassaadid/ → FI "Egger-julkisivumateriaalit"
- /kontakt/ → EN "Contact details", FI "Yhteystiedot"
- /toopinnad/ → H1 добавлен в Elementor: ET "Töötasapinnad", RU "Столешницы", EN "Countertops", FI "Työtasot"
- /egger/kivi/ → RU "Камень", EN "Stone", FI "Kivi"
- /egger/puit/ → RU "Дерево", EN "Wood", FI "Puu"
- /egger/monokroom/ → RU "Монохром", EN "Monochrome", FI "Yksivärinen"
- /toopinnad/hpl-tootasapinnad/ → EN "HPL compact laminate worktops", FI "HPL-kompaktilaminaatti työtasot"

---

## 3. ~~HIGH — Отсутствуют meta description~~ ✅ ИСПРАВЛЕНО

Meta description добавлены через /wp-json/sk/v1/update-seo API:
- /egger/ (5802) — title + desc добавлены
- /egger/kivi/ (6291) — title + desc добавлены
- /egger/puit/ (6293) — title + desc добавлены
- /egger/monokroom/ (6295) — title + desc добавлены

---

## 4. ~~MEDIUM — Title проблемы~~ ✅ ИСПРАВЛЕНО

- /materjalid/ (2530) — title укорочен до ~60 символов
- /egger/, /egger/kivi/, /egger/puit/ — title расширены с описательными ключевыми словами

---

## 5. ~~MEDIUM — Отсутствует H1~~ ✅ ИСПРАВЛЕНО

/toopinnad/ — H1 "Töötasapinnad" добавлен через Elementor API. Переводы автоматически подхвачены TranslatePress.

---

## 6. ~~MEDIUM — Кириллица в URL блог-постов~~ ✅ ИСПРАВЛЕНО

Slug обновлены через WP REST API:
- Post 3972: `kulluslikud-ja-erksad-varvilised-koogid-kas-need-on-tellimist-vaart`
- Post 3895: `koogi-disainitrendid-aastal-2026`
301-редиректы настроены в Code Snippets (ID 260).

---

## 7. ~~MEDIUM — Дублирующие FAQPage schemas~~ ✅ ИСПРАВЛЕНО

Два источника FAQPage на /koogid-eritellimusel/:
1. "SEO Schemas Output" (snippet 102) — читал из post_meta `_seo_faq_schema`
2. "SK FAQ Schema by Page" (snippet 206) — читал из `sk_faq_data` option

Решение: добавил page 3133 в skip-лист snippet 102 (`!in_array($post_id, [8, 3133])`). FAQ данные в snippet 206 обновлены — 8 дедуплицированных вопросов. Теперь 1 FAQPage schema на странице.

---

## 8. ~~LOW — Meta description слишком длинный~~ ✅ ИСПРАВЛЕНО

- /valmistamine/ (3010) — desc укорочен до ~120 символов
- /meie-furnituur/ (2706) — desc укорочен до ~130 символов

---

## 9. ОК — Что работает хорошо

- ✅ FurnitureStore schema на всех страницах
- ✅ FAQPage schema на главной и /koogid-eritellimusel/ (теперь 1 штука)
- ✅ Service schema на /valmistamine/ и /koogid-eritellimusel/
- ✅ Canonical URLs корректны
- ✅ robots.txt настроен, Sitemap указан
- ✅ Основные страницы хорошо переведены
- ✅ Hreflang — 5 тегов без дублей
- ✅ Все H1 переведены на все языки
- ✅ Все коммерческие страницы имеют meta description и правильные title

---

## План исправлений — СТАТУС

### Фаза 1 — CRITICAL (hreflang) ✅ DONE
### Фаза 2 — Переводы H1 ✅ DONE
### Фаза 2b — H1 на /toopinnad/ ✅ DONE
### Фаза 3 — Meta description + titles ✅ DONE
### Фаза 4 — URL и schema ✅ DONE

### Фаза 5 — Product/Service schema (PENDING)
14. Добавить Product schema на коммерческие страницы материалов
