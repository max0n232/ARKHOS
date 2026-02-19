# ТЗ: ИСПРАВЛЕНИЕ SEO-ОШИБОК studiokook.ee

**Версия:** 1.0
**Дата:** 2026-02-13
**Назначение:** Пошаговое техзадание для Claude Code CLI. Выполнять задачи последовательно.
**Обязательно:** Перед началом прочитать `skills/wordpress/projects/studiokook/INFRASTRUCTURE.md`

---

## ОБЯЗАТЕЛЬНАЯ ПРЕАМБУЛА ДЛЯ КАЖДОЙ СЕССИИ

```
Прочитай файл skills/wordpress/projects/studiokook/INFRASTRUCTURE.md
Прочитай файл skills/wordpress/SKILL.md
Прочитай файл skills/wordpress/projects/studiokook/KNOWLEDGE.md
```

CLI должен загрузить контекст инфраструктуры перед любой правкой. Если файлы не найдены -- СТОП, сообщить Max.

---

## ЗАДАЧА 1: ИСПРАВИТЬ ДУБЛИРОВАНИЕ HREFLANG

**Приоритет:** СРЕДНИЙ
**Риск:** НИЗКИЙ (изменения через плагин, не прямое редактирование)
**Затрагивает:** TranslatePress -> Yoast SEO -> все страницы

### Проблема

На каждой странице генерируются дублирующие hreflang-теги:
- `hreflang="ru-RU"` и `hreflang="ru"` -> один и тот же URL
- `hreflang="en-GB"` и `hreflang="en"` -> один и тот же URL

Google может путаться какой тег использовать.

### Диагностика

```bash
# Проверить текущие hreflang на главной
curl -s https://studiokook.ee/ | grep -i hreflang
```

Ожидаемый результат: по 2 тега на каждый язык (ru-RU + ru, en-GB + en).

### Исправление

Проблема генерируется **TranslatePress**. Варианты:

**Вариант A -- Через настройки TranslatePress (предпочтительный):**
1. WP-admin -> TranslatePress -> Settings -> General
2. Проверить конфигурацию языков -- возможно есть дублирующие записи
3. Если нет -- это поведение TranslatePress Business SEO Pack

**Вариант B -- Через Code Snippet (если A не работает):**
```php
// Название сниппета: "Fix duplicate hreflang tags"
// Назначение: Удаляет дублирующие hreflang (оставляет только ru, en, fi, et, x-default)
add_action('wp_head', function() {
    // Перехватываем вывод и убираем дубли
    ob_start(function($html) {
        // Убрать ru-RU (оставить ru)
        $html = preg_replace('/<link[^>]*hreflang="ru-RU"[^>]*>\s*\n?/i', '', $html);
        // Убрать en-GB (оставить en)
        $html = preg_replace('/<link[^>]*hreflang="en-GB"[^>]*>\s*\n?/i', '', $html);
        return $html;
    });
}, 1);
add_action('wp_footer', function() { ob_end_flush(); }, 999);
```

**ВАЖНО:** Использовать Code Snippets плагин. НЕ редактировать файлы темы.

### Верификация

```bash
# После применения -- проверить:
curl -s https://studiokook.ee/ | grep -i hreflang
curl -s https://studiokook.ee/ru/ | grep -i hreflang
curl -s https://studiokook.ee/en/ | grep -i hreflang
curl -s https://studiokook.ee/fi/ | grep -i hreflang
```

Ожидаемый результат на каждой странице -- ровно 5 тегов:
- `hreflang="x-default"` -> `https://studiokook.ee/...`
- `hreflang="et"` -> `https://studiokook.ee/...`
- `hreflang="ru"` -> `https://studiokook.ee/ru/...`
- `hreflang="en"` -> `https://studiokook.ee/en/...`
- `hreflang="fi"` -> `https://studiokook.ee/fi/...`

### Очистка кеша

```bash
curl "https://studiokook.ee/wp-json/sk/v1/clear-seraph" -H "Authorization: Basic $WP_AUTH"
```

---

## ЗАДАЧА 2: ИСПРАВИТЬ 404 НА /meie-toopinnad/

**Приоритет:** ВЫСОКИЙ
**Риск:** СРЕДНИЙ (затрагивает навигацию и внутреннюю перелинковку)
**Затрагивает:** Страница ID 2776, навигация, переводы

### Проблема

Страница `/meie-toopinnad/` (столешницы) возвращает 404. По инфраструктуре -- ID 2776, slug `toopinnad`.

### Диагностика

```bash
# 1. Проверить статус страницы через WP REST API
curl -s "https://studiokook.ee/wp-json/wp/v2/pages?slug=toopinnad"

# 2. Проверить также старый slug
curl -s "https://studiokook.ee/wp-json/wp/v2/pages?slug=meie-toopinnad"

# 3. Получить страницу по ID напрямую
curl -s "https://studiokook.ee/wp-json/wp/v2/pages/2776" -H "Authorization: Basic $WP_AUTH"
```

### Возможные причины и исправления

**A. Страница в черновиках:**
-> Опубликовать через WP-admin или REST API

**B. Slug был изменён:**
-> Проверить текущий slug, обновить меню и внутренние ссылки

**C. Permalink сломан:**
```bash
# Сбросить permalink rules
curl "https://studiokook.ee/wp-json/sk/v1/flush-rewrite" -H "Authorization: Basic $WP_AUTH"
```

**D. Страница удалена:**
-> Создать заново или восстановить из корзины

### Верификация

```bash
curl -I https://studiokook.ee/toopinnad/
# Должно быть: HTTP/2 200
# Проверить все языки:
curl -I https://studiokook.ee/ru/toopinnad/
curl -I https://studiokook.ee/en/toopinnad/
curl -I https://studiokook.ee/fi/toopinnad/
```

### Пост-действия

1. Проверить меню -- ссылка на столешницы актуальна?
2. Проверить внутренние ссылки с других страниц
3. Очистить кеш Серафинита

---

## ЗАДАЧА 3: УБРАТЬ CSS-ХАК И ИСПРАВИТЬ ДУБЛИРОВАНИЕ МАРКИРОВОК В RU-ГАЛЕРЕЕ

**Приоритет:** СРЕДНИЙ
**Риск:** ВЫСОКИЙ (TranslatePress + NextGEN = точка конфликта)
**Затрагивает:** NextGEN Gallery <-> TranslatePress <-> все языки

### Проблема

1. CLI ранее добавил CSS-хак для скрытия мусорных переводов в RU-галерее фасадов
2. После этого маркировки стали дублироваться ВО ВСЕХ языковых версиях
3. Корневая причина: TranslatePress перехватывает текст из NGG, при изменении HTML-структуры TP теряет привязку

### План исправления

**Шаг 1: Найти и удалить CSS-хак**

```bash
# Поиск CSS-хака в Code Snippets
curl -s "https://studiokook.ee/wp-json/code-snippets/v1/" | node -e "
  process.stdin.resume(); let d='';
  process.stdin.on('data',c=>d+=c);
  process.stdin.on('end',()=>{
    const snippets = JSON.parse(d);
    snippets.forEach(s => {
      if (s.code && (s.code.includes('display:none') || s.code.includes('visibility:hidden') || s.code.includes('.ngg-'))) {
        console.log('FOUND CSS hack:', s.id, s.name, s.active);
      }
    });
  })
"

# Также проверить WPCode
# WP-admin -> WPCode -> All Snippets -> искать CSS-хак
```

**Шаг 2: Деактивировать CSS-хак** (через Code Snippets API или WP-admin)

**Шаг 3: Исправить переводы в TranslatePress**

```bash
# Найти мусорные переводы для галерей
curl -s "https://studiokook.ee/wp-json/sk/v1/trp-search?q=F186"
curl -s "https://studiokook.ee/wp-json/sk/v1/trp-search?q=H1113"
# Если находятся переводы с мусором -- удалить/обновить через trp-update-by-id
```

**Шаг 4: Для маркировок EGGER -- оставить БЕЗ перевода**

Коды декоров (F186_ST9, H1113_ST10 и т.д.) -- интернациональные, перевод не нужен. Если TP пытается их переводить -- нужно добавить пустой перевод со status=2 чтобы TP их не трогал.

### Верификация

Проверить страницу `/fassaadid/egger-fassaadid/` на ВСЕХ 4 языках:
- ET: коды не дублируются
- RU: коды не дублируются, нет мусорного текста
- EN: коды не дублируются
- FI: коды не дублируются

### Очистка кеша

```bash
curl "https://studiokook.ee/wp-json/sk/v1/clear-seraph" -H "Authorization: Basic $WP_AUTH"
```

---

## ЗАДАЧА 4: ИСПРАВИТЬ СМЕШЕНИЕ ЯЗЫКОВ НА СТРАНИЦЕ EGGER RU

**Приоритет:** СРЕДНИЙ
**Риск:** НИЗКИЙ
**Затрагивает:** TranslatePress переводы

### Проблема

На RU-версии страницы EGGER (и дочерних) часть текста остаётся на эстонском.

### Диагностика

```bash
# Получить непереведённые строки
curl -s "https://studiokook.ee/wp-json/sk/v1/trp-untranslated"

# Поиск конкретных эстонских фраз на странице
curl -s "https://studiokook.ee/wp-json/sk/v1/trp-search?q=fassaad"
curl -s "https://studiokook.ee/wp-json/sk/v1/trp-search?q=Egger"
```

### Исправление

Для каждой непереведённой строки:

```bash
# Используй Node.js скрипт из-за UTF-8 (см. SKILL.md секция "Common Workflows")
# trp-add с lang='ru' -- пишет в таблицу et_ru_ru
```

**КРИТИЧЕСКИ ВАЖНО (из SKILL.md):**
- `trp-search` и `trp-untranslated` возвращают данные ТОЛЬКО из EN-таблицы
- Для RU переводов использовать ТОЛЬКО `trp-add` с `lang: 'ru'`
- ID в EN-таблице != ID в RU-таблице
- После добавления -- ОБЯЗАТЕЛЬНО визуально проверить страницу

### Верификация

Открыть в браузере: `https://studiokook.ee/ru/fassaadid/egger-fassaadid/`
Весь текст должен быть на русском (кроме кодов декоров).

---

## ЗАДАЧА 5: ОБНОВИТЬ EMAIL В SCHEMA.ORG

**Приоритет:** НИЗКИЙ
**Риск:** НИЗКИЙ
**Затрагивает:** Yoast SEO Schema на /kontakt/

### Проблема

В Schema FurnitureStore: `maksim@studiokook.ee`
На сайте: `julia@studiokook.ee`

### Действие

**Уточнить у Max актуальный email.** После подтверждения:

Если кастомный JSON-LD вставлен через Elementor HTML-виджет на `/kontakt/`:

```bash
# Найти Schema блок
curl -s "https://studiokook.ee/wp-json/sk/v1/elementor/2465" -H "Authorization: Basic $WP_AUTH"
```

Заменить email через `elementor/{id}/replace` или через WP-admin.

---

## ЗАДАЧА 6: ОПТИМИЗИРОВАТЬ TITLE "MEIE FURNITUUR"

**Приоритет:** НИЗКИЙ
**Риск:** НИЗКИЙ

### Текущий title

"Meie furnituur | Studiokook" -- не содержит ключевых слов.

### Рекомендуемый

ET: `BLUM furnituur koogimööblile | Studiokook Tallinn`
RU: `Фурнитура BLUM для кухонной мебели | Studiokook Таллинн`
EN: `BLUM Kitchen Hardware & Fittings | Studiokook Tallinn`

### Исправление

```bash
curl -X POST "https://studiokook.ee/wp-json/sk/v1/update-seo" \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $WP_AUTH" \
  -d '{"page_id": 2706, "title": "BLUM furnituur koogimööblile | Studiokook Tallinn", "description": "BLUM tostemehhanismid, sahtlid, nurga- ja ladustamissüsteemid koogimööblile. Austria kvaliteet-furnituur Studioköögist Tallinnas."}'
```

Аналогично для RU и EN через TranslatePress -- переводы мета-тегов.

---

## ЗАДАЧА 7: УЛУЧШИТЬ ALT-ТЕКСТЫ ГАЛЕРЕЙ

**Приоритет:** НИЗКИЙ
**Риск:** СРЕДНИЙ (затрагивает TranslatePress)

### Проблема

Alt-тексты содержат только коды: `F186_ST9`. Для SEO нужно: `F186 Betoon Chicago helehall -- Egger koogifassaad`.

### Исправление

Использовать NGG Alt Text Updater API (плагин уже установлен):

```bash
# Получить текущие alt-тексты
curl -s "https://studiokook.ee/wp-json/ngg/v1/galleries" -H "Authorization: Basic $WP_AUTH"

# Обновить alt
curl -X POST "https://studiokook.ee/wp-json/ngg-fix/v1/alt" \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $WP_AUTH" \
  -d '{"image_id": XXX, "alt": "F186 Betoon Chicago helehall -- Egger koogifassaad"}'
```

**ВНИМАНИЕ:** После изменения alt-текстов проверить все 4 языка! TranslatePress может перехватить новые строки и создать мусорные переводы.

---

## ЗАДАЧА 8: ОБНОВЛЕНИЕ ПЛАГИНОВ (20 ожидают)

**Приоритет:** СРЕДНИЙ
**Риск:** ВЫСОКИЙ

### Правила

1. **Elementor 3.25 -> 3.35 НЕ обновлять** -- major update, может сломать совместимость с Xpro/AI Addons
2. Обновлять по одному, проверяя сайт после каждого
3. Начинать с безопасных (утилиты), заканчивать критическими (SEO, переводы)

### Порядок обновления

**Безопасные (утилиты):**
Better Search Replace, WordPress Importer, WP File Manager, Disable Admin Notices, Kadence Blocks

**Средний риск (формы, медиа):**
Contact Form 7 -> CF7 Telegram -> Flamingo -> Drag & Drop Upload

**Высокий риск (SEO, переводы, галереи):**
Yoast SEO -> TranslatePress -> NextGEN Gallery

**НЕ обновлять без тестирования:**
Elementor (major), Xpro Theme Builder, Xpro Addons

### Верификация после каждого обновления

```bash
# Проверить что сайт работает
curl -I https://studiokook.ee/
curl -I https://studiokook.ee/ru/
# Проверить что API работает
curl -s "https://studiokook.ee/wp-json/sk/v1/list-plugins"
```
