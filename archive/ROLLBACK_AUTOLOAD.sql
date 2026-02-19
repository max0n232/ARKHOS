-- ROLLBACK SCRIPT для автозагрузки options
-- Создано: 2026-02-02
-- В случае проблем после оптимизации выполнить эти команды

-- ========================================
-- RESTORE TRANSIENTS TO AUTOLOAD
-- ========================================

-- Если сайт сломался после отключения autoload для transients:
UPDATE wp_options SET autoload = 'yes'
WHERE option_name IN (
    '_transient_health-check-site-status-result',
    '_transient_trp_active_taxonomies_slugs',
    '_transient_update_plugins',
    '_transient_update_themes',
    '_wpforms_transient_wpforms_/data01/virt103578/domeenid/www.studiokook.ee/htdocs/wp-content/uploads/wpforms/cache/.htaccess_file',
    '_wpforms_transient_wpforms_htaccess_file',
    'ngg_transient_groups'
);

-- ========================================
-- RESTORE SERAPHINITE TO AUTOLOAD
-- ========================================

-- Если Seraphinite Accelerator не работает:
UPDATE wp_options SET autoload = 'yes'
WHERE option_name IN (
    'seraph_accel_Data',
    'seraph_accel_Lic',
    'seraph_accel_RmtCfg',
    'seraph_accel_Sett',
    'seraph_accel_State'
);

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Проверить текущий autoload status:
SELECT option_name, autoload
FROM wp_options
WHERE option_name LIKE '%transient%'
   OR option_name LIKE 'seraph_accel_%'
ORDER BY autoload DESC, option_name;

-- Проверить total autoload size:
SELECT
    COUNT(*) as options_count,
    ROUND(SUM(LENGTH(option_value))/1024, 2) as total_kb,
    ROUND(SUM(LENGTH(option_value))/1024/1024, 2) as total_mb
FROM wp_options
WHERE autoload = 'yes';

-- ========================================
-- FULL ROLLBACK (если всё сломалось)
-- ========================================

-- Восстановить все изменённые options:
UPDATE wp_options SET autoload = 'yes'
WHERE option_name IN (
    -- Transients
    '_transient_health-check-site-status-result',
    '_transient_trp_active_taxonomies_slugs',
    '_transient_update_plugins',
    '_transient_update_themes',
    '_wpforms_transient_wpforms_/data01/virt103578/domeenid/www.studiokook.ee/htdocs/wp-content/uploads/wpforms/cache/.htaccess_file',
    '_wpforms_transient_wpforms_htaccess_file',
    'ngg_transient_groups',
    -- Seraphinite
    'seraph_accel_Data',
    'seraph_accel_Lic',
    'seraph_accel_RmtCfg',
    'seraph_accel_Sett',
    'seraph_accel_State'
);

-- После rollback очистить кэши:
-- Выполнить через WP-CLI или Code Snippet:
-- wp_cache_flush();
-- delete_transient('all');
