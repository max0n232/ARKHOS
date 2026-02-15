-- Add translations for new HPL page texts (ET → RU/EN/FI)
-- Run in phpMyAdmin on studiokook.ee database
-- SAFE: only inserts missing translations

-- ========================================
-- ET → RU (Russian)
-- ========================================

-- 1. New paragraph about formats
INSERT INTO wp_trp_dictionary_et_ru_ru (original, translated, status)
VALUES (
  'Egger kompaktlaminaat töötasapinnad on saadaval kahes formaadis: <strong>4100 &times; 920 mm</strong> ja <strong>4100 &times; 650 mm</strong>, paksusega <strong>12 mm</strong>. Kõik plaadid on varustatud 1&times;1 mm faasiga ümberümbermise, mis võimaldab kohest paigaldust ilma ABS-servata.',
  'Столешницы из компактного ламината Egger доступны в двух форматах: <strong>4100 × 920 мм</strong> и <strong>4100 × 650 мм</strong>, толщиной <strong>12 мм</strong>. Все плиты оснащены фаской 1×1 мм по периметру, что позволяет осуществлять монтаж без ABS-кромки.',
  2
);

-- 2. Egger decor list
INSERT INTO wp_trp_dictionary_et_ru_ru (original, translated, status)
VALUES ('F206, F221, F244, F267, F311, F8001, H1318, H1330, U7081, U999, W1101', 'F206, F221, F244, F267, F311, F8001, H1318, H1330, U7081, U999, W1101', 2);

-- 3. "11 HPL dekoori"
INSERT INTO wp_trp_dictionary_et_ru_ru (original, translated, status)
VALUES ('11 HPL dekoori', '11 HPL декоров', 2);

-- 4. Fundermax decor list
INSERT INTO wp_trp_dictionary_et_ru_ru (original, translated, status)
VALUES ('0026, 0027, 0075, 0077, 0080, 0344, 0386, 0394, 0426, 0427, 0428, 0497, 0581, 0585, 0670, 0693', '0026, 0027, 0075, 0077, 0080, 0344, 0386, 0394, 0426, 0427, 0428, 0497, 0581, 0585, 0670, 0693', 2);

-- 5. "16 HPL dekoori"
INSERT INTO wp_trp_dictionary_et_ru_ru (original, translated, status)
VALUES ('16 HPL dekoori', '16 HPL декоров', 2);

-- 6. Table format
INSERT INTO wp_trp_dictionary_et_ru_ru (original, translated, status)
VALUES ('4100 &times; 920 mm / 4100 &times; 650 mm', '4100 × 920 мм / 4100 × 650 мм', 2);

-- 7. Edge with pre-install
INSERT INTO wp_trp_dictionary_et_ru_ru (original, translated, status)
VALUES ('Faas 1&times;1 mm (eelpaigaldatud)', 'Фаска 1×1 мм (предустановлена)', 2);

-- 8. Depth comparison
INSERT INTO wp_trp_dictionary_et_ru_ru (original, translated, status)
VALUES ('650 / 920 mm', '650 / 920 мм', 2);

-- 9. Edge simple
INSERT INTO wp_trp_dictionary_et_ru_ru (original, translated, status)
VALUES ('Faas 1&times;1 mm', 'Фаска 1×1 мм', 2);

-- ========================================
-- ET → EN (English)
-- ========================================

-- 1. New paragraph
INSERT INTO wp_trp_dictionary_et_en_us (original, translated, status)
VALUES (
  'Egger kompaktlaminaat töötasapinnad on saadaval kahes formaadis: <strong>4100 &times; 920 mm</strong> ja <strong>4100 &times; 650 mm</strong>, paksusega <strong>12 mm</strong>. Kõik plaadid on varustatud 1&times;1 mm faasiga ümberümbermise, mis võimaldab kohest paigaldust ilma ABS-servata.',
  'Egger compact laminate countertops are available in two formats: <strong>4100 × 920 mm</strong> and <strong>4100 × 650 mm</strong>, with a thickness of <strong>12 mm</strong>. All boards feature a 1×1 mm bevel around the perimeter, allowing immediate installation without ABS edging.',
  2
);

-- 2. Decor lists (same)
INSERT INTO wp_trp_dictionary_et_en_us (original, translated, status)
VALUES ('F206, F221, F244, F267, F311, F8001, H1318, H1330, U7081, U999, W1101', 'F206, F221, F244, F267, F311, F8001, H1318, H1330, U7081, U999, W1101', 2);

INSERT INTO wp_trp_dictionary_et_en_us (original, translated, status)
VALUES ('0026, 0027, 0075, 0077, 0080, 0344, 0386, 0394, 0426, 0427, 0428, 0497, 0581, 0585, 0670, 0693', '0026, 0027, 0075, 0077, 0080, 0344, 0386, 0394, 0426, 0427, 0428, 0497, 0581, 0585, 0670, 0693', 2);

-- 3. Counts
INSERT INTO wp_trp_dictionary_et_en_us (original, translated, status)
VALUES ('11 HPL dekoori', '11 HPL decors', 2);

INSERT INTO wp_trp_dictionary_et_en_us (original, translated, status)
VALUES ('16 HPL dekoori', '16 HPL decors', 2);

-- 4. Technical specs
INSERT INTO wp_trp_dictionary_et_en_us (original, translated, status)
VALUES ('4100 &times; 920 mm / 4100 &times; 650 mm', '4100 × 920 mm / 4100 × 650 mm', 2);

INSERT INTO wp_trp_dictionary_et_en_us (original, translated, status)
VALUES ('Faas 1&times;1 mm (eelpaigaldatud)', 'Bevel 1×1 mm (pre-installed)', 2);

INSERT INTO wp_trp_dictionary_et_en_us (original, translated, status)
VALUES ('650 / 920 mm', '650 / 920 mm', 2);

INSERT INTO wp_trp_dictionary_et_en_us (original, translated, status)
VALUES ('Faas 1&times;1 mm', 'Bevel 1×1 mm', 2);

-- ========================================
-- ET → FI (Finnish)
-- ========================================

-- 1. New paragraph
INSERT INTO wp_trp_dictionary_et_fi (original, translated, status)
VALUES (
  'Egger kompaktlaminaat töötasapinnad on saadaval kahes formaadis: <strong>4100 &times; 920 mm</strong> ja <strong>4100 &times; 650 mm</strong>, paksusega <strong>12 mm</strong>. Kõik plaadid on varustatud 1&times;1 mm faasiga ümberümbermise, mis võimaldab kohest paigaldust ilma ABS-servata.',
  'Egger-kompaktilaminaattityötasot ovat saatavilla kahdessa koossa: <strong>4100 × 920 mm</strong> ja <strong>4100 × 650 mm</strong>, paksuus <strong>12 mm</strong>. Kaikissa levyissä on 1×1 mm viiste reunojen ympäri, mikä mahdollistaa välittömän asennuksen ilman ABS-reunanauhaa.',
  2
);

-- 2. Decor lists (same)
INSERT INTO wp_trp_dictionary_et_fi (original, translated, status)
VALUES ('F206, F221, F244, F267, F311, F8001, H1318, H1330, U7081, U999, W1101', 'F206, F221, F244, F267, F311, F8001, H1318, H1330, U7081, U999, W1101', 2);

INSERT INTO wp_trp_dictionary_et_fi (original, translated, status)
VALUES ('0026, 0027, 0075, 0077, 0080, 0344, 0386, 0394, 0426, 0427, 0428, 0497, 0581, 0585, 0670, 0693', '0026, 0027, 0075, 0077, 0080, 0344, 0386, 0394, 0426, 0427, 0428, 0497, 0581, 0585, 0670, 0693', 2);

-- 3. Counts
INSERT INTO wp_trp_dictionary_et_fi (original, translated, status)
VALUES ('11 HPL dekoori', '11 HPL-dekooria', 2);

INSERT INTO wp_trp_dictionary_et_fi (original, translated, status)
VALUES ('16 HPL dekoori', '16 HPL-dekooria', 2);

-- 4. Technical specs
INSERT INTO wp_trp_dictionary_et_fi (original, translated, status)
VALUES ('4100 &times; 920 mm / 4100 &times; 650 mm', '4100 × 920 mm / 4100 × 650 mm', 2);

INSERT INTO wp_trp_dictionary_et_fi (original, translated, status)
VALUES ('Faas 1&times;1 mm (eelpaigaldatud)', 'Viiste 1×1 mm (esiasennettu)', 2);

INSERT INTO wp_trp_dictionary_et_fi (original, translated, status)
VALUES ('650 / 920 mm', '650 / 920 mm', 2);

INSERT INTO wp_trp_dictionary_et_fi (original, translated, status)
VALUES ('Faas 1&times;1 mm', 'Viiste 1×1 mm', 2);
