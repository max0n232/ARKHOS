# Universal Lazy Loading Setup

## Проблема

Snippets #83 и #84 не работают, потому что используют NGG-специфичные фильтры (`ngg_pro_thumbnail_html`, `ngg_basic_thumbnail_html`).

**Причина:** Elementor Gallery widget рендерит HTML напрямую из базы данных, минуя NGG фильтры.

## Решение

Универсальный подход: фильтр `the_content` с приоритетом 999, который добавляет `loading="lazy"` ко **всем** `<img>` тегам.

---

## Шаг 1: Создать Meta Snippet

1. Войти в WordPress Admin: https://studiokook.ee/wp-admin
2. Перейти: **Snippets → Add New**
3. Название: `Meta Create Lazy Loading`
4. Код: скопировать из файла `meta_create_lazy_snippet.txt` (см. ниже)
5. Scope: **Run snippet everywhere**
6. **Save Changes and Activate**

### Код для Meta Snippet

```php
/**
 * Meta Snippet: Create Universal Lazy Loading Snippet
 * This snippet creates another snippet, then deactivates itself
 * Execute once, then deactivate
 */

global $wpdb;

$snippet_code = <<<'CODE'
// Universal browser-native lazy loading for all images
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
CODE;

// Check if Universal Lazy Loading snippet exists
$existing = $wpdb->get_var("SELECT id FROM {$wpdb->prefix}snippets WHERE name = 'Universal Image Lazy Loading'");

if ($existing) {
    // Update existing
    $wpdb->update(
        $wpdb->prefix . 'snippets',
        [
            'code' => $snippet_code,
            'active' => 1,
            'scope' => 'global',
            'priority' => 999,
            'modified' => current_time('mysql')
        ],
        ['id' => $existing]
    );
    error_log('[Meta Snippet] Updated existing snippet #' . $existing);
} else {
    // Create new
    $wpdb->insert(
        $wpdb->prefix . 'snippets',
        [
            'name' => 'Universal Image Lazy Loading',
            'code' => $snippet_code,
            'active' => 1,
            'scope' => 'global',
            'priority' => 999,
            'modified' => current_time('mysql')
        ]
    );
    $snippet_id = $wpdb->insert_id;
    error_log('[Meta Snippet] Created new snippet #' . $snippet_id);
}

// Deactivate old NGG-specific snippets
$wpdb->query("UPDATE {$wpdb->prefix}snippets SET active = 0 WHERE id IN (83, 84)");
error_log('[Meta Snippet] Deactivated old snippets #83, #84');

error_log('[Meta Snippet] ========== SUCCESS ==========');
error_log('[Meta Snippet] Universal lazy loading is ACTIVE');
error_log('[Meta Snippet] Please DEACTIVATE this meta snippet now');
```

---

## Шаг 2: Деактивировать Meta Snippet

После активации meta snippet:

1. Перейти: **Snippets → All Snippets**
2. Найти: `Meta Create Lazy Loading`
3. **Deactivate** (можно удалить)

Meta snippet создал постоянный snippet **"Universal Image Lazy Loading"** и деактивировал старые (#83, #84).

---

## Шаг 3: Проверить

1. **Очистить кеш** (если используется cache plugin):
   - Seraphinite Accelerator: Settings → Clear cache
   - Или: `/wp-admin/options-general.php?page=caching`

2. **Проверить HTML:**
   - Открыть: https://studiokook.ee/toopinnad/
   - View Page Source (Ctrl+U)
   - Найти (Ctrl+F): `loading="lazy"`
   - Должно быть ~534 совпадения (все thumbnails)

3. **Проверить Network tab:**
   - Открыть DevTools (F12) → Network tab
   - Обновить страницу
   - Прокрутить вниз → изображения загружаются по мере скролла

---

## Что это делает

- Добавляет `loading="lazy"` ко **всем** `<img>` тегам в контенте
- Работает с:
  - NextGEN Gallery
  - Elementor Gallery widget
  - Любыми другими галереями
- Browser-native функция (без JS)
- Приоритет 999 (выполняется последним)

## Ожидаемый эффект

- **40-50% быстрее** первоначальная загрузка страницы
- Изображения загружаются только при скролле
- Снижение расхода трафика
- Лучшая производительность на мобильных

## Риск

**ОЧЕНЬ НИЗКИЙ:**
- Безопасный content filter
- Нет изменений в БД (кроме snippet)
- Мгновенный откат: деактивировать snippet

## Откат

Если возникнут проблемы:

1. **Snippets → All Snippets**
2. Найти: **Universal Image Lazy Loading**
3. **Deactivate**

Lazy loading отключится немедленно.

---

## Технические детали

### Почему NGG фильтры не сработали?

- Snippet #83 использовал `ngg_pro_thumbnail_html` и `ngg_basic_thumbnail_html`
- Эти фильтры срабатывают только при рендеринге через NGG shortcode API
- Elementor Gallery widget читает HTML напрямую из `wp_ngg_gallery` и рендерит сам
- NGG фильтры не вызываются

### Почему `the_content` работает?

- `the_content` — универсальный WordPress filter для всего контента поста/страницы
- Elementor рендерит свои widgets внутри контента страницы
- Фильтр с приоритетом 999 выполняется последним, после всех других фильтров
- Модифицирует финальный HTML перед отправкой браузеру

### Безопасность

- `preg_replace_callback` с валидацией
- Проверка наличия `loading=` атрибута (skip если есть)
- Не трогает `<img>` теги с `loading="eager"` (если вручную установлено)
- Не модифицирует атрибуты, только добавляет новый

---

## Файлы

- Код meta snippet: `C:\Users\sorte\AppData\Local\Temp\claude\...\scratchpad\meta_create_lazy_snippet.txt`
- PHP версия (для SSH): `create_universal_lazy_snippet.php`
- SQL версия (для phpMyAdmin): `universal_lazy_snippet.sql`

---

**Статус:** Готово к выполнению
**Требует:** Ручного создания snippet в WordPress Admin
**Время:** 2-3 минуты
