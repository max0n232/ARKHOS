# ИНФРАСТРУКТУРА WP: studiokook.ee

**Версия документа:** 1.0
**Дата:** 13 февраля 2026
**Назначение:** Карта инфраструктуры для безопасного внесения изменений. Читать перед ЛЮБЫМИ правками.

---

## 1. СЕРВЕР И ХОСТИНГ

| Параметр | Значение |
|----------|---------|
| Хостинг | Zone.ee (shared hosting) |
| Панель | https://my.zone.eu/hosting/103930 |
| PHP | 8.2 |
| DocumentRoot | `/data01/virt103578/domeenid/www.studiokook.ee/htdocs` |
| FTP root | `/htdocs/` (chroot в корень домена) |
| FTP host | `studiokook.ee` (НЕ ftp.zone.ee) |
| FTP user | `d103930f913161` |
| SSL | Let's Encrypt R13, до 03.04.2026 |
| WAF | Отключен |
| SSH | Раздел есть в панели, но не настроен |
| WordPress | 6.9.1 |
| URL сайта | https://studiokook.ee |
| Permalink | `/%postname%/` |
| Язык WP-admin | `ru_RU` |

### FTP-структура корня

```
/htdocs/           ← DocumentRoot
  ├── wp-admin/
  ├── wp-content/
  ├── wp-includes/
  ├── robots.txt       ← Физический файл (заменён 13.02.2026)
  ├── sitemap_index.xml ← Генерируется Yoast SEO
  ├── wp-config.php
  ├── .htaccess
  ├── googlea8afd0d1a93c3611.html  ← верификация Google
  ├── yandex_9e06327fd9111e0c.html ← верификация Yandex
  ├── pinterest-2c34f.html         ← верификация Pinterest
  ├── it-api.php                   ← кастомный API endpoint (назначение: уточнить)
  ├── RUN_ONCE_check_hreflang.php  ← одноразовый скрипт проверки hreflang
  └── old/                         ← старые файлы (уточнить содержимое)
```

---

## 2. ТЕМА

| Параметр | Значение |
|----------|---------|
| Активная тема | **Astra** (бесплатная) |
| Child theme | Нет |
| Запасная тема | Twenty Twenty-Five |

**ВНИМАНИЕ:** Нет child theme. Обновление Astra может перезаписать кастомизации если они сделаны в файлах темы. Все кастомные CSS/JS должны идти через WPCode или Code Snippets.

---

## 3. ПЛАГИНЫ (29 установлено, 28 активных)

### Критические (влияют на контент и SEO)

| Плагин | Версия | Роль | Зависимости |
|--------|--------|------|-------------|
| **TranslatePress - Multilingual** | 2.7.4 | Мультиязычность (ET/RU/EN/FI) | TranslatePress - Business |
| **TranslatePress - Business** | 1.3.8 | Расширение TP: доп. языки, SEO Pack | Зависит от TranslatePress |
| **Yoast SEO** | 26.3 | SEO: title, meta, sitemap, Schema, hreflang | - |
| **Elementor** | 3.25.11 | Page builder: главная, материалы, фурнитура | Xpro Addons, AI Addons, Sticky Header, Unlimited Elements |
| **NextGEN Gallery** | 3.59.3 | Галереи фасадов и столешниц | NextGEN Pro, NGG Alt Text Updater, NGG MCP Abilities |
| **NextGEN Pro** | 3.31.2 | Pro-функции галереи | Зависит от NextGEN Gallery |

### Контактные формы

| Плагин | Версия | Роль |
|--------|--------|------|
| Contact Form 7 | 6.1.3 | Формы обратной связи |
| CF7 + Telegram | 0.10.0 | Пересылка заявок в Telegram |
| Drag & Drop File Upload for CF7 | 1.3.9.2 | Загрузка файлов через формы |
| Flamingo | 2.6 | Хранение заявок из CF7 в БД |

### Elementor экосистема

| Плагин | Версия | Роль |
|--------|--------|------|
| Elementor | 3.25.11 | Основной билдер |
| AI Addons for Elementor | 2.2.1 | AI-виджеты |
| Xpro Elementor Addons | 1.4.6.1 | Доп. виджеты |
| Xpro Elementor Theme Builder | 1.2.8.2 | Header/Footer конструктор |
| Unlimited Elements | 1.5.131 | Доп. виджеты HTML/CSS/JS |
| Sticky Header Effects | 1.7.3 | Sticky header при скролле |

### Утилиты

| Плагин | Версия | Роль |
|--------|--------|------|
| Site Kit от Google | 1.171.0 | GA + GSC в WP-admin |
| WPCode Lite | 2.3.1 | Сниппеты кода (header/footer) |
| Code Snippets | 3.9.4 | PHP-сниппеты |
| Better Search Replace | 1.4.10 | Поиск/замена в БД |
| Серафинит Акселератор | 2.22.14 (Premium) | Кеширование, оптимизация скорости |
| Диспетчер файлов WP | 8.0 | Файл-менеджер в WP-admin |
| WordPress Importer | 0.8.3 | Импорт контента |
| Kadence Blocks | 3.4.0 | Gutenberg-блоки |

### Кастомные / CLI-созданные

| Плагин | Версия | Роль | Статус |
|--------|--------|------|--------|
| Abilities API | 0.4.0 | Framework для AI abilities | Активен |
| MCP Adapter | 0.4.1 | MCP tools из Abilities API | Активен |
| NGG Alt Text Updater | 1.0 | Обновление alt через REST API | Активен |
| NGG Alt Text Updater v2 | 2.0 | То же, relaxed permissions | **НЕАКТИВЕН** |
| NGG MCP Abilities | 2.1.0 | MCP управление NGG | Активен |

### WPCode сниппеты (все НЕАКТИВНЫ)

| Название | Назначение |
|----------|-----------|
| 08-early-title-override.php | Перезапись title (отключен) |
| 02-fix-canonical-urls.php | Фикс canonical URL (отключен) |
| Focus_keywords | Фокусные ключевые слова (отключен) |
| facebook | Facebook интеграция (отключен) |

### Code Snippets (все НЕАКТИВНЫ)

| Название | Назначение |
|----------|-----------|
| SK hreflang x-default fix | Фикс x-default hreflang |
| Read Debug Option | Отладка |
| Write MU Plugin File | Запись MU plugin |
| Flush Rewrite Rules | Сброс permalink rules |

**ЗАМЕЧАНИЕ:** Все сниппеты отключены. Возможно были эксперименты CLI, которые потом откатили. Проверять перед активацией.

---

## 4. МУЛЬТИЯЗЫЧНОСТЬ (TranslatePress)

### Настройки

| Параметр | Значение |
|----------|---------|
| Плагин | TranslatePress Business 1.3.8 + Multilingual 2.7.4 |
| Основной язык | **Эстонский (et)** |
| Доп. языки | Русский (ru-RU), Английский (en-GB), Финский (fi) |
| URL-схема | `/` = ET, `/ru/` = RU, `/en/` = EN, `/fi/` = FI |
| Переводы | Хранятся в БД (таблица `wp_trp_*`) |
| Доступ к настройкам | Только администратор (текущий user `admin` не имеет доступа к настройкам TP!) |

### Как работают переводы

TranslatePress перехватывает HTML-вывод страницы и подставляет переводы из БД. Оригинальный контент — на эстонском (в WordPress posts/pages). Переводы хранятся отдельно в таблицах `wp_trp_*`.

**КРИТИЧЕСКИ ВАЖНО для CLI:**
- НЕ менять контент в WP-редакторе для перевода — это изменит оригинал (ET)
- Переводы редактируются ТОЛЬКО через TranslatePress visual editor или REST API
- Если CLI меняет HTML-структуру страницы, переводы могут "отвалиться" (TP привязывается к конкретным строкам)
- Галереи NextGEN генерируют HTML динамически — TP может не перехватить все элементы

### hreflang (текущая реализация)

Генерируется TranslatePress автоматически. На каждой странице:

```html
<link rel="alternate" hreflang="x-default" href="https://studiokook.ee/..." />
<link rel="alternate" hreflang="et" href="https://studiokook.ee/..." />
<link rel="alternate" hreflang="ru-RU" href="https://studiokook.ee/ru/..." />
<link rel="alternate" hreflang="fi" href="https://studiokook.ee/fi/..." />
<link rel="alternate" hreflang="en-GB" href="https://studiokook.ee/en/..." />
<link rel="alternate" hreflang="ru" href="https://studiokook.ee/ru/..." />
<link rel="alternate" hreflang="en" href="https://studiokook.ee/en/..." />
```

**ПРОБЛЕМА:** Дублирование — `ru-RU` и `ru` указывают на один URL, `en-GB` и `en` — тоже. Google может путаться. Нужно оставить только один вариант для каждого языка.

---

## 5. SEO (Yoast SEO)

| Параметр | Значение |
|----------|---------|
| Плагин | Yoast SEO 26.3 (бесплатный) |
| Sitemap | https://studiokook.ee/sitemap_index.xml (авто) |
| Schema | WebPage, BreadcrumbList, WebSite (авто), FurnitureStore (кастом) |
| Title separator | `|` |
| Search engine visibility | **НЕ заблокировано** (blog_public = 1) |
| Site Kit | Подключен (Google Analytics + Search Console) |

### Schema.org FurnitureStore (кастом, на странице /kontakt/)

```json
{
  "@type": "FurnitureStore",
  "name": "Studiokook",
  "description": "Kohandatud koogimööbel Tallinnas...",
  "url": "https://studiokook.ee",
  "telephone": "+372 55 525 143",
  "email": "maksim@studiokook.ee",
  "address": {
    "streetAddress": "Paldiski mnt 21",
    "addressLocality": "Tallinn",
    "postalCode": "11317",
    "addressCountry": "EE"
  },
  "geo": { "latitude": 59.4028, "longitude": 24.7066 },
  "openingHours": "Mon-Fri 09:00-18:00",
  "priceRange": "$$$"
}
```

**ЗАМЕЧАНИЕ:** Email `maksim@studiokook.ee`, но на сайте отображается `julia@studiokook.ee`. Уточнить актуальный.

### FAQPage Schema

Присутствует на странице `/kontakt/`. Генерируется автоматически (вероятно через Yoast или кастомный блок).

---

## 6. СТРАНИЦЫ (30 шт)

### Опубликованные страницы

| ID | Slug | Название | Builder | Примечание |
|----|------|---------|---------|-----------|
| 8 | `/` (avaleht) | Главная | Elementor | Главная страница сайта |
| - | `/koogid/` | Галерея кухонь | Elementor | Портфолио |
| - | `/koogid-eritellimusel/` | Кухни на заказ | Gutenberg | Основная коммерческая |
| - | `/valmistamine/` | Производство | Elementor | О процессе |
| 2530 | `/materjalid/` | Материалы | Elementor | Обзор материалов |
| 2706 | `/meie-furnituur/` | Фурнитура | Elementor | BLUM фурнитура |
| 2776 | `/meie-toopinnad/` (toopinnad) | Столешницы | Elementor | **404! Страница не найдена** |
| - | `/kontakt/` | Контакты | Gutenberg | + Schema FurnitureStore + FAQ |
| - | `/blogi/` | Блог | - | Архив записей |
| - | `/hinnaparing/` | Ценовой запрос | - | Форма |
| - | `/koogimoobli-valmistamine/` | Изготовление мебели | - | Доп. страница |

### Фасады (новые страницы)

| ID | Slug | Название | Builder | Примечание |
|----|------|---------|---------|-----------|
| 5800 | `/fassaadid/` | Фасады | Gutenberg | Родительская страница |
| 6309 | `/fassaadid/egger-fassaadid/` | EGGER фасады | Gutenberg | Каталог декоров EGGER |
| 5802 | `/fassaadid/egger/` | Egger (столешницы?) | Gutenberg | Уточнить отличие от 6309 |
| - | `/fassaadid/fenix/` | Fenix | Gutenberg | Фасады Fenix NTM |

### Столешницы (новые страницы)

| ID | Slug | Название | Builder |
|----|------|---------|---------|
| 6291 | Дочерняя | Kivi (камень) | Gutenberg |
| 6295 | Дочерняя | Monokroom | Gutenberg |
| 6293 | Дочерняя | Puit (дерево) | Gutenberg |
| 6335 | Дочерняя | HPL kompaktlaminaat | Gutenberg |

### Elementor-страницы (доп. фурнитура)

| ID | Slug | Название | Builder |
|----|------|---------|---------|
| 2651 | `/nurgamehhanismid/` | Угловые механизмы | Elementor |
| 2619 | `/sahtlid/` | Ящики | Elementor |
| 536 | `/tostemehhanismid/` | Подъёмные механизмы | Elementor |
| - | `/ladustamissusteemid/` | Системы хранения | Elementor |
| - | `/kividest-tootasapinnad/` | Каменные столешницы | Elementor |

### Черновики

| ID | Название | Примечание |
|----|---------|-----------|
| 5974 | Elementor #5974 | Без названия, Elementor |
| 6351 | Elementor #6351 | Без названия, Elementor |
| 6310 | F -- Kivi | Черновик подстраницы фасадов |
| 6312 | H -- Puit | Черновик подстраницы фасадов |
| 6314 | U -- Monokroom | Черновик подстраницы фасадов |

---

## 7. ГАЛЕРЕИ (NextGEN Gallery)

### Список галерей

| ID | Название | Контент | Используется на |
|----|---------|---------|----------------|
| 1 | Egger F-series (worktops) | Столешницы F-серия | Страница столешниц |
| 2 | Egger H-series (worktops) | Столешницы H-серия | Страница столешниц |
| 6 | Toopind Tehnostone | Столешницы Technistone | Каменные столешницы |
| 7 | koogid gallery | Фото готовых кухонь | /koogid/ |
| 8 | Fenix | Фасады Fenix NTM | /fassaadid/fenix/ |
| 9 | Egger H-series | Фасады H-серия | /fassaadid/egger-fassaadid/ |
| 10 | Egger F-series | Фасады F-серия | /fassaadid/egger-fassaadid/ |
| 11 | Egger U-series | Фасады U-серия | /fassaadid/egger-fassaadid/ |
| 14 | Egger | Общая EGGER галерея | Уточнить |
| 16 | Fundermax HPL | HPL декоры Fundermax | /fassaadid/ или столешницы |

### Alt-тексты в галереях

Формат: `{КОД}_{ТЕКСТУРА}` (например `F186_ST9`, `H1113_ST10`)

**ПРОБЛЕМА:** Alt-тексты содержат только технические коды, без описательных названий. Для SEO нужно: `F186 Бетон Чикаго светло-серый -- фасад EGGER для кухни`.

### Известная проблема: дублирование маркировок в RU-версии

**Причина:** CLI добавил CSS-хак для скрытия некорректного контента в RU-галерее. После этого маркировки стали дублироваться во ВСЕХ языковых версиях.

**Корневая проблема:** TranslatePress перехватывает текст из галереи NGG. Если исходный текст (ET) изменён или HTML-структура поменялась, TP теряет привязку перевода и подставляет "мусор" (куски текста из других мест).

**Правильное решение:**
1. Убрать CSS-хак
2. В TranslatePress visual editor найти и удалить некорректные переводы для галереи
3. Заново перевести (или оставить коды без перевода -- они интернациональные)

---

## 8. КЕШИРОВАНИЕ

| Параметр | Значение |
|----------|---------|
| Плагин | Серафинит Акселератор 2.22.14 (Premium) |
| Тип | Page cache + оптимизация ресурсов |
| Конфигурация | Файл `.htaccess` + `seraph-accel-img-compr-redir.conf` |

**ВАЖНО при правках:** После изменений на сайте нужно очистить кеш Серафинита, иначе посетители будут видеть старую версию. Способы:
- WP-admin -> Серафинит -> Настройки -> Очистить кеш
- Добавить `?nocache=1` к URL для обхода кеша при проверке

---

## 9. КОНТАКТНЫЕ ДАННЫЕ (актуальные)

| Параметр | На сайте | В Schema |
|----------|---------|---------|
| Телефон | +372 55 525 143 | +372 55 525 143 |
| Email | julia@studiokook.ee | maksim@studiokook.ee |
| Адрес | Paldiski mnt 21, Tallinn | Paldiski mnt 21, 11317 Tallinn |

**РАСХОЖДЕНИЕ:** Email на сайте и в Schema не совпадают. Уточнить актуальный.

---

## 10. ПРАВИЛА ДЛЯ CLI / АВТОМАТИЗАЦИИ

### Перед ЛЮБОЙ правкой:

1. **Прочитай этот документ** -- определи какие системы затрагиваются
2. **Проверь зависимости** -- изменение в одном месте может сломать другое
3. **Не используй CSS-хаки** вместо исправления данных
4. **Проверь все языковые версии** после изменения (ET, RU, EN, FI)
5. **Очисти кеш** Серафинита после правок
6. **Не трогай TranslatePress переводы** через прямое редактирование БД -- используй visual editor или REST API

### Карта зависимостей

```
Elementor -> Astra theme -> Xpro Theme Builder (header/footer)
         -> AI Addons, Xpro Addons, Unlimited Elements (виджеты)
         -> Sticky Header Effects (поведение header)

NextGEN Gallery -> NextGEN Pro (pro-функции)
              -> NGG MCP Abilities (API управление)
              -> NGG Alt Text Updater (alt тексты через API)
              -> TranslatePress (перевод подписей!) <- ТОЧКА КОНФЛИКТА

TranslatePress -> Yoast SEO (hreflang генерация)
              -> Elementor (перевод виджетов)
              -> NextGEN Gallery (перевод подписей) <- ТОЧКА КОНФЛИКТА
              -> Contact Form 7 (перевод форм)

Yoast SEO -> TranslatePress (sitemap + hreflang)
          -> Site Kit (GSC данные)

Contact Form 7 -> CF7 Telegram (уведомления)
              -> Drag & Drop Upload (файлы)
              -> Flamingo (хранение заявок)
```

### Опасные операции

| Операция | Риск | Что делать |
|----------|------|-----------|
| Изменение HTML-структуры страницы | Переводы TP отвалятся | Заново привязать в TP visual editor |
| Обновление Elementor | Несовместимость с Xpro/AI Addons | Сначала проверить совместимость |
| Правка галереи NGG | Дублирование/мусор в переводах | Проверить все 4 языка после |
| Правка robots.txt | Блокировка индексации | Валидация через fix_robots.py |
| Обновление TranslatePress | Потеря переводов | Бэкап БД перед обновлением |

---

## 11. ИЗВЕСТНЫЕ ПРОБЛЕМЫ

| # | Проблема | Приоритет | Статус |
|---|---------|-----------|--------|
| 1 | robots.txt блокировал краулеров | КРИТИЧНО | Исправлено 13.02.2026 |
| 2 | Дублирование hreflang (ru-RU + ru, en-GB + en) | СРЕДНИЙ | Открыто |
| 3 | `/meie-toopinnad/` возвращает 404 | ВЫСОКИЙ | Открыто |
| 4 | Дублирование маркировок в RU-галерее фасадов | СРЕДНИЙ | Открыто (CSS-хак) |
| 5 | Смешение языков на странице EGGER RU | СРЕДНИЙ | Открыто |
| 6 | Email расхождение (julia vs maksim) | НИЗКИЙ | Уточнить |
| 7 | 20 плагинов требуют обновления | СРЕДНИЙ | Открыто |
| 8 | Elementor 3.25 -> 3.35 major update warning | ВЫСОКИЙ | Не обновлять без тестирования |
| 9 | Alt-тексты галерей только коды, без названий | НИЗКИЙ | Открыто |
| 10 | Title "Meie furnituur" не оптимизирован | НИЗКИЙ | Открыто |
