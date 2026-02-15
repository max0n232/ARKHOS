-- Supabase Schema для SEO переводов Studiokook
-- Выполнить в Supabase SQL Editor

-- Таблица переводов страниц
CREATE TABLE IF NOT EXISTS page_translations (
    id SERIAL PRIMARY KEY,
    page_id INTEGER NOT NULL UNIQUE,
    slug VARCHAR(255) NOT NULL,

    -- Оригинал (эстонский)
    title_et TEXT,
    content_et TEXT,
    meta_desc_et TEXT,

    -- Русский
    title_ru TEXT,
    content_ru TEXT,
    meta_desc_ru TEXT,

    -- Английский
    title_en TEXT,
    content_en TEXT,
    meta_desc_en TEXT,

    -- Финский
    title_fi TEXT,
    content_fi TEXT,
    meta_desc_fi TEXT,

    -- Alt-теги (JSON)
    alt_tags JSONB DEFAULT '{}',

    -- Метаданные
    status VARCHAR(50) DEFAULT 'pending', -- pending, translated, approved, published
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы
CREATE INDEX idx_page_translations_slug ON page_translations(slug);
CREATE INDEX idx_page_translations_status ON page_translations(status);

-- Таблица SEO аудита
CREATE TABLE IF NOT EXISTS seo_audit_log (
    id SERIAL PRIMARY KEY,
    page_url TEXT NOT NULL,
    language VARCHAR(10) NOT NULL,

    -- Проверки
    has_hreflang BOOLEAN DEFAULT FALSE,
    has_canonical BOOLEAN DEFAULT FALSE,
    title_language_match BOOLEAN DEFAULT FALSE,
    meta_language_match BOOLEAN DEFAULT FALSE,
    content_language_match BOOLEAN DEFAULT FALSE,

    -- Детали
    current_title TEXT,
    expected_title TEXT,
    current_meta TEXT,
    expected_meta TEXT,

    -- Результат
    score INTEGER DEFAULT 0, -- 0-100
    issues JSONB DEFAULT '[]',

    checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы
CREATE INDEX idx_seo_audit_url ON seo_audit_log(page_url);
CREATE INDEX idx_seo_audit_date ON seo_audit_log(checked_at);

-- Функция автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер
CREATE TRIGGER trigger_page_translations_updated
    BEFORE UPDATE ON page_translations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- View для быстрого просмотра статуса переводов
CREATE OR REPLACE VIEW translation_status AS
SELECT
    slug,
    page_id,
    CASE WHEN title_ru IS NOT NULL THEN '✅' ELSE '❌' END as ru,
    CASE WHEN title_en IS NOT NULL THEN '✅' ELSE '❌' END as en,
    CASE WHEN title_fi IS NOT NULL THEN '✅' ELSE '❌' END as fi,
    status,
    updated_at
FROM page_translations
ORDER BY updated_at DESC;

-- Пример вставки данных
INSERT INTO page_translations (page_id, slug, title_et, title_ru, title_en, title_fi, meta_desc_ru, meta_desc_en, meta_desc_fi, status)
VALUES
(8, 'home',
 'Köögimööbel eritellimusel Tallinnas',
 'Кухни на заказ в Таллинне | Кухонная мебель | Studioköök',
 'Custom Kitchens in Tallinn | Kitchen Furniture | Studioköök',
 'Mittatilauskeittöt Tallinnassa | Keittiökalusteet | Studioköök',
 'Кухни на заказ по индивидуальным размерам и проектам. Кухонная мебель в Таллинне, австрийская фурнитура. +372 55 525 143.',
 'Custom kitchens tailored to your specifications. Kitchen furniture in Tallinn with Austrian hardware. +372 55 525 143.',
 'Mittatilauskeittöt yksilöllisten mittojen mukaan. Keittiökalusteet Tallinnassa. +372 55 525 143.',
 'approved'
)
ON CONFLICT (page_id) DO UPDATE SET
    title_ru = EXCLUDED.title_ru,
    title_en = EXCLUDED.title_en,
    title_fi = EXCLUDED.title_fi,
    meta_desc_ru = EXCLUDED.meta_desc_ru,
    meta_desc_en = EXCLUDED.meta_desc_en,
    meta_desc_fi = EXCLUDED.meta_desc_fi,
    status = EXCLUDED.status;
