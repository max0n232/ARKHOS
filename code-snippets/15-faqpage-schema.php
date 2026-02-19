<?php
/**
 * Snippet Name: FAQPage Schema
 * Description: Auto-generates FAQPage schema on pages with FAQ content. Detects Elementor FAQ widget or custom field 'studiokook_faq'. Multi-language support.
 * Version: 1.0
 *
 * ИНСТРУКЦИЯ:
 * 1. WP Admin → Code Snippets → Add New
 * 2. Название: "FAQPage Schema"
 * 3. Scope: "Only run on site front-end"
 *
 * ДЕТЕКЦИЯ FAQ:
 * - Elementor FAQ widget в Elementor data
 * - Custom field 'studiokook_faq' (массив вопросов/ответов)
 * - Fallback: H3 теги заканчивающиеся на "?" как вопросы
 */

add_action('wp_head', 'studiokook_faqpage_schema', 5);

function studiokook_faqpage_schema() {
    global $post;

    if (!is_singular(['page', 'post'])) {
        return;
    }

    if (!$post) {
        return;
    }

    // Определяем язык страницы
    $lang = get_page_language();

    // Пытаемся найти FAQ-контент
    $faqs = [];

    // 1. Проверяем custom field 'studiokook_faq'
    $custom_faq = get_post_meta($post->ID, 'studiokook_faq', true);
    if (!empty($custom_faq) && is_array($custom_faq)) {
        $faqs = $custom_faq;
    }

    // 2. Если не найдено, ищем Elementor FAQ widget
    if (empty($faqs)) {
        $faqs = studiokook_extract_elementor_faq($post->ID);
    }

    // 3. Fallback: ищем H3 теги с "?" как вопросы/ответы
    if (empty($faqs)) {
        $faqs = studiokook_extract_h3_faq($post);
    }

    // Если не найдено FAQ-контента, выходим
    if (empty($faqs) || count($faqs) === 0) {
        return;
    }

    // Формируем FAQPage schema
    $faq_items = [];
    foreach ($faqs as $faq) {
        $question = isset($faq['question']) ? $faq['question'] : '';
        $answer = isset($faq['answer']) ? $faq['answer'] : '';

        if (empty($question) || empty($answer)) {
            continue;
        }

        $faq_items[] = [
            '@type' => 'Question',
            'name' => sanitize_text_field($question),
            'acceptedAnswer' => [
                '@type' => 'Answer',
                'text' => wp_strip_all_tags($answer)
            ]
        ];
    }

    if (empty($faq_items)) {
        return;
    }

    $schema = [
        '@context' => 'https://schema.org',
        '@type' => 'FAQPage',
        'mainEntity' => $faq_items
    ];

    echo '<script type="application/ld+json">' . "\n";
    echo json_encode($schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    echo "\n</script>\n";
}

/**
 * Извлекаем FAQ из Elementor widget данных
 */
function studiokook_extract_elementor_faq($post_id) {
    $elementor_data = get_post_meta($post_id, '_elementor_data', true);
    if (empty($elementor_data)) {
        return [];
    }

    // Декодируем JSON если нужно
    if (is_string($elementor_data)) {
        $elementor_data = json_decode($elementor_data, true);
    }

    $faqs = [];
    studiokook_search_elementor_faq($elementor_data, $faqs);

    return $faqs;
}

/**
 * Рекурсивный поиск FAQ виджетов в Elementor структуре
 */
function studiokook_search_elementor_faq(&$data, &$faqs) {
    if (!is_array($data)) {
        return;
    }

    foreach ($data as $item) {
        if (!is_array($item)) {
            continue;
        }

        // Проверяем, это ли FAQ widget
        if (isset($item['widgetType']) && $item['widgetType'] === 'wp-widget-shortcode') {
            // Попытаемся извлечь FAQ из shortcode
            if (isset($item['settings']['shortcode'])) {
                // Здесь может быть shortcode с FAQ
            }
        }

        // Ищем в элементах Elementor
        if (isset($item['elements']) && is_array($item['elements'])) {
            studiokook_search_elementor_faq($item['elements'], $faqs);
        }

        // Для FAQ widget типа (если используется специальный плагин)
        if (isset($item['settings']['items']) && is_array($item['settings']['items'])) {
            foreach ($item['settings']['items'] as $faq_item) {
                if (isset($faq_item['item_question'], $faq_item['item_answer'])) {
                    $faqs[] = [
                        'question' => $faq_item['item_question'],
                        'answer' => $faq_item['item_answer']
                    ];
                }
            }
        }
    }
}

/**
 * Fallback: ищем H3 теги заканчивающиеся на "?" и следующие за ними параграфы
 */
function studiokook_extract_h3_faq($post) {
    if (empty($post->post_content)) {
        return [];
    }

    $faqs = [];
    $pattern = '/<h3[^>]*>([^<]*\?)<\/h3>\s*<p[^>]*>([^<]+(?:<[^/][^>]*>[^<]+)*)<\/p>/i';

    if (preg_match_all($pattern, $post->post_content, $matches, PREG_SET_ORDER)) {
        foreach ($matches as $match) {
            $faqs[] = [
                'question' => trim($match[1]),
                'answer' => trim(wp_strip_all_tags($match[2]))
            ];
        }
    }

    return $faqs;
}

/**
 * Вспомогательная функция: определяет язык текущей страницы
 */
function get_page_language() {
    $request_uri = $_SERVER['REQUEST_URI'];
    $lang = 'et'; // default

    if (preg_match('#^/(ru|en|fi)/#', $request_uri, $matches)) {
        $lang = $matches[1];
    }

    return $lang;
}
