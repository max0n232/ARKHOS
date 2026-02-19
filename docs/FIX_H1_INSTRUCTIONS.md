# Инструкции: Исправление дублирующихся H1 тегов

**Дата:** 2026-02-09
**Приоритет:** КРИТИЧЕСКИЙ
**Время:** ~30 мин на все страницы

---

## Диагностика проблемы

На страницах Egger, Fenix, HPL обнаружены **3 H1 тега**:

```html
<!-- 1. Тема Astra (автоматически) -->
<h1 class="entry-title" itemprop="headline">Egger</h1>

<!-- 2. Кастомный SEO snippet (на сервере) -->
<h1 class="seo-h1" style="...">Egger</h1>

<!-- 3. Elementor контент -->
<h1>Egger fassaadimaterjalid</h1>
```

**Источники:**
1. **entry-title** — тема Astra выводит заголовок страницы как H1
2. **seo-h1** — snippet на сервере (не в локальных файлах)
3. **Elementor H1** — добавлен вручную в редакторе

---

## ПЛАН ИСПРАВЛЕНИЯ (3 шага)

### Шаг 1: Деплой snippet для скрытия entry-title

Файл: `code-snippets/12-fix-duplicate-h1.php`

1. WP Admin → Code Snippets → Add New
2. Вставить код из файла
3. Scope: "Only run on site front-end"
4. Активировать

### Шаг 2: Найти и отключить seo-h1 snippet

1. WP Admin → Code Snippets → All Snippets
2. Найти snippet который добавляет `<h1 class="seo-h1">`
3. **Деактивировать** или удалить его

### Шаг 3: Оставить один H1 в Elementor

После шагов 1-2 останется только H1 из Elementor контента.
Следуйте инструкциям ниже для каждой страницы.

---

## Проблема (детальный список)

На 5 страницах обнаружены дублирующиеся или отсутствующие H1 теги:

| Страница | URL | Проблема |
|----------|-----|----------|
| Töötasapinnad (главная) | /toopinnad/ | 0 H1 |
| HPL | /toopinnad/hpl-tootasapinnad/ | 2 H1 |
| Egger фасады | /fassaadid/egger-fassaadid/ | 2 H1 |
| Fenix фасады | /fassaadid/fenix/ | 2 H1 |
| Fassaadid (главная) | /fassaadid/ | Нет H2/H3 |

---

## Пошаговая инструкция

### Страница 1: /toopinnad/ (добавить H1)

1. WP Admin → Страницы → **Tööpinnad** → Редактировать с Elementor
2. В самом верху страницы добавить виджет **Heading**
3. Настройки виджета:
   - **Title:** `Köögitöötasapinnad`
   - **HTML Tag:** `H1`
   - **Alignment:** Center или Left
4. Сохранить

---

### Страница 2: /toopinnad/hpl-tootasapinnad/ (убрать дубль H1)

**Текущее состояние:**
```
H1: HPL kompaktlaminaat töötasapinnad  ← ОСТАВИТЬ
H1: HPL Kompaktlaminaat Töötasapinnad  ← ИЗМЕНИТЬ НА H2
H2: HPL kompaktlaminaat töötasapinnad  ← УБРАТЬ (дубль)
```

**Шаги:**
1. WP Admin → Страницы → **HPL kompaktlaminaat töötasapinnad** → Редактировать с Elementor
2. Найти ВСЕ виджеты Heading на странице (используй Navigator слева)
3. Для каждого Heading проверь HTML Tag:
   - **Первый H1** — оставить как есть
   - **Второй H1** — изменить на `H2`
   - **H2 с тем же текстом** — изменить текст или удалить виджет
4. **Целевая структура:**
   ```
   H1: HPL Kompaktlaminaat Töötasapinnad (1 штука)
   H2: Mis on HPL? (или другой уникальный текст)
   H2: HPL eelised
   H2: Egger HPL dekoorid
   H2: Fundermax HPL dekoorid
   H2: Korduma kippuvad küsimused
   ```
5. Сохранить

---

### Страница 3: /fassaadid/egger-fassaadid/ (убрать дубль H1)

**Текущее состояние:**
```
H1: Egger           ← ОСТАВИТЬ, но изменить текст
H1: Egger           ← ИЗМЕНИТЬ НА H2
H2: Egger fassaadimaterjalid  ← OK
```

**Шаги:**
1. WP Admin → Страницы → **Egger** (в разделе Fassaadid) → Редактировать с Elementor
2. Найти два виджета H1 "Egger"
3. **Первый H1:**
   - Изменить текст на: `Egger Fassaadid — Laminaat ja PerfectSense Matt`
   - HTML Tag: `H1`
4. **Второй H1:**
   - Изменить HTML Tag на: `H2`
   - Можно изменить текст на: `Egger materjalide ülevaade`
5. **Целевая структура:**
   ```
   H1: Egger Fassaadid — Laminaat ja PerfectSense Matt
   H2: Materjalide ülevaade
   H2: F-series (kivi dekoorid)
   H2: H-series (puit dekoorid)
   H2: U-series (monokroom)
   ```
6. Сохранить

---

### Страница 4: /fassaadid/fenix/ (убрать дубль H1 и H2)

**Текущее состояние:**
```
H1: Fenix                    ← ИЗМЕНИТЬ текст
H1: Fenix NTM Fassaadid      ← ИЗМЕНИТЬ НА H2
H2: Fenix                    ← ИЗМЕНИТЬ текст (дубль!)
H3: FENIX-i eelised          ← OK
```

**Шаги:**
1. WP Admin → Страницы → **Fenix** → Редактировать с Elementor
2. **Первый H1 "Fenix":**
   - Изменить текст на: `Fenix NTM Fassaadid — Itaalia Nanotehnoloogia`
   - HTML Tag: `H1`
3. **Второй H1 "Fenix NTM Fassaadid":**
   - Изменить HTML Tag на: `H2`
   - Текст можно оставить или изменить на: `Fenix NTM omadused`
4. **H2 "Fenix":**
   - Изменить текст на: `Fenix materjali kirjeldus` (или удалить, если дублирует)
5. **Целевая структура:**
   ```
   H1: Fenix NTM Fassaadid — Itaalia Nanotehnoloogia
   H2: Fenix NTM omadused
     H3: FENIX-i eelised
   H2: Värvipalett (34 tooni)
   H2: Tehniline info
   ```
6. Сохранить

---

### Страница 5: /fassaadid/ (добавить структуру)

**Текущее состояние:**
```
H1: Fassaadid  ← OK
(нет H2/H3)
```

**Шаги:**
1. WP Admin → Страницы → **Fassaadid** → Редактировать с Elementor
2. После H1 добавить секцию с H2 заголовками:
   ```
   H2: Meie fassaadimaterjalid
   (краткое описание Egger и Fenix)

   H2: Egger laminaat
   (ссылка на подстраницу)

   H2: Fenix NTM
   (ссылка на подстраницу)
   ```
3. Сохранить

---

## Как найти все H1 на странице в Elementor

1. Открыть страницу в Elementor
2. Слева внизу нажать **Navigator** (иконка слоёв)
3. В Navigator искать виджеты "Heading"
4. Кликнуть на каждый Heading
5. Справа в панели настроек проверить **HTML Tag**

---

## Проверка после исправлений

### Способ 1: DevTools
1. Открыть страницу в Chrome
2. F12 → Console
3. Ввести: `document.querySelectorAll('h1').length`
4. Должно быть: `1`

### Способ 2: Командная строка
```bash
curl -s https://studiokook.ee/toopinnad/hpl-tootasapinnad/ | grep -o "<h1" | wc -l
# Ожидается: 1
```

### Способ 3: SEO-плагин
- Yoast SEO показывает предупреждение если H1 отсутствует или дублируется

---

## Важно

- После изменений **очистить кэш** (если используется LiteSpeed Cache или другой плагин)
- Проверить страницу в **режиме инкогнито**
- НЕ НУЖНО изменять переводы — TranslatePress автоматически подтянет изменённые тексты

---

## Контакт

При вопросах — вернуться к Claude CLI для уточнений.
