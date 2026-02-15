# Fix Lazy Loading для Elementor

## Проблема

Snippet #85 активирован, но `loading="lazy"` не появляется в HTML.

**Причина:** Фильтр `the_content` не срабатывает для Elementor-rendered контента. Elementor использует свой hook: `elementor/frontend/the_content`.

**Проверено:**
```bash
curl -s "https://studiokook.ee/toopinnad/" | grep -c 'loading="lazy"'
# Output: 0 (должно быть ~534)
```

**Snippet #85 status:**
- ID: 85
- Name: Universal Image Lazy Loading
- Active: 1 ✓
- Priority: 999 ✓
- Code: правильный ✓

**Но:** Hook `the_content` пропускает Elementor galleries.

---

## Решение

Добавить hook `elementor/frontend/the_content` к существующему snippet.

### Шаг 1: Открыть Snippet #85

1. https://studiokook.ee/wp-admin
2. **Snippets → All Snippets**
3. Найти: **Universal Image Lazy Loading**
4. Нажать **Edit**

### Шаг 2: Заменить код

**Старый код (строка 2):**
```php
add_filter('the_content', 'studiokook_add_lazy_loading_universal', 999);
```

**Новый код (строки 2-3):**
```php
add_filter('elementor/frontend/the_content', 'studiokook_add_lazy_loading_universal', 999);
add_filter('the_content', 'studiokook_add_lazy_loading_universal', 999);
```

**Полный код snippet #85 (после изменения):**

```php
// Universal browser-native lazy loading for all images
add_filter('elementor/frontend/the_content', 'studiokook_add_lazy_loading_universal', 999);
add_filter('the_content', 'studiokook_add_lazy_loading_universal', 999);

function studiokook_add_lazy_loading_universal($content) {
    if (strpos($content, '<img') === false) {
        return $content;
    }

    $content = preg_replace_callback(
        '/<img([^>]*)>/i',
        function($matches) {
            $img_tag = $matches[0];
            $attributes = $matches[1];

            if (stripos($attributes, 'loading=') !== false) {
                return $img_tag;
            }

            return str_replace('<img' . $attributes . '>', '<img' . $attributes . ' loading="lazy">', $img_tag);
        },
        $content
    );

    return $content;
}
```

### Шаг 3: Save Changes

Snippet уже активен, поэтому изменения применятся сразу после сохранения.

---

## Шаг 4: Проверить

### Очистить кеш
- Seraphinite Accelerator → Settings → Clear cache

### Проверить HTML
```bash
curl -s "https://studiokook.ee/toopinnad/" | grep -c 'loading="lazy"'
```

**Ожидается:** ~534 (число thumbnails)

**Или вручную:**
1. Открыть https://studiokook.ee/toopinnad/
2. View Page Source (Ctrl+U)
3. Найти (Ctrl+F): `loading="lazy"`
4. Должно быть много совпадений ✓

### Проверить Network
1. DevTools (F12) → Network tab
2. Обновить страницу
3. Прокрутить вниз → изображения грузятся по мере скролла ✓

---

## Почему это работает?

### WordPress Content Flow (Elementor)

```
User Request
    ↓
WordPress Core
    ↓
Elementor Frontend
    ↓
elementor/frontend/the_content filter ← OUR HOOK (priority 999)
    ↓
HTML Output → Browser
```

### Standard WordPress (без Elementor)

```
User Request
    ↓
WordPress Core
    ↓
the_content filter ← OUR HOOK (priority 999)
    ↓
HTML Output → Browser
```

**Решение:** Хукаемся в оба места, чтобы покрыть все случаи.

---

## Если не поможет

### Альтернатива: Output Buffer

Если hook всё ещё не работает (очень редко), можно использовать output buffering:

```php
// Capture ALL HTML output
add_action('template_redirect', function() {
    ob_start(function($html) {
        // Add loading="lazy" to all <img> tags
        return preg_replace_callback(
            '/<img([^>]*)>/i',
            function($matches) {
                if (stripos($matches[1], 'loading=') !== false) {
                    return $matches[0];
                }
                return str_replace('<img' . $matches[1] . '>', '<img' . $matches[1] . ' loading="lazy">', $matches[0]);
            },
            $html
        );
    });
}, 1);
```

**Риск:** Выше (перехватывает весь HTML output), но гарантированно работает.

---

## Технические детали

### Elementor Hooks Priority

Elementor использует:
- `elementor/frontend/the_content` (priority ~10-100)
- Our filter: priority 999 (runs LAST)

### Hook Coverage

| Hook | Covers |
|------|--------|
| `elementor/frontend/the_content` | Elementor pages, widgets, galleries |
| `the_content` | Standard WP posts, WP Gallery, non-Elementor content |

Together: 100% coverage ✓

---

## Rollback

Если возникнут проблемы:
1. **Snippets → All Snippets**
2. Найти: **Universal Image Lazy Loading**
3. **Deactivate**

Или вернуть старый код (убрать строку с `elementor/frontend/the_content`).

---

**Время:** 1-2 минуты
**Риск:** Очень низкий (добавляем один hook)
**Эффект:** Lazy loading заработает ✓
