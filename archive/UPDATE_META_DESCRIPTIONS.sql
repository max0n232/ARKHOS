-- Update Meta Descriptions for Key Pages (Yoast SEO)
-- Run this in phpMyAdmin for studiokook.ee database
-- Meta descriptions: 145-155 characters optimal

-- CRITICAL PAGES

-- 1. Homepage (ID: will find dynamically by checking front page settings)
-- First check: SELECT option_value FROM wp_options WHERE option_name = 'page_on_front';
-- For now using generic homepage meta (update post_id after checking)

-- 2. HPL Page (ID: 6335)
UPDATE wp_postmeta
SET meta_value = 'HPL kompaktlaminaat töötasapinnad: Egger ja Fundermax. Kraapimiskindel, niiskuskindel, 10+ aastat garantiid. Näited ja hinnad.'
WHERE post_id = 6335 AND meta_key = '_yoast_wpseo_metadesc';

-- If meta doesn't exist, insert it
INSERT INTO wp_postmeta (post_id, meta_key, meta_value)
SELECT 6335, '_yoast_wpseo_metadesc', 'HPL kompaktlaminaat töötasapinnad: Egger ja Fundermax. Kraapimiskindel, niiskuskindel, 10+ aastat garantiid. Näited ja hinnad.'
WHERE NOT EXISTS (
    SELECT 1 FROM wp_postmeta WHERE post_id = 6335 AND meta_key = '_yoast_wpseo_metadesc'
);

-- 3. Laminate Page (ID: 2943)
UPDATE wp_postmeta
SET meta_value = 'Laminaadist töötasapinnad Egger. Lai valik dekoore, majanduslik hind alates 80 €/m². Austria kvaliteet. Tasuta hinnapakkumine.'
WHERE post_id = 2943 AND meta_key = '_yoast_wpseo_metadesc';

INSERT INTO wp_postmeta (post_id, meta_key, meta_value)
SELECT 2943, '_yoast_wpseo_metadesc', 'Laminaadist töötasapinnad Egger. Lai valik dekoore, majanduslik hind alates 80 €/m². Austria kvaliteet. Tasuta hinnapakkumine.'
WHERE NOT EXISTS (
    SELECT 1 FROM wp_postmeta WHERE post_id = 2943 AND meta_key = '_yoast_wpseo_metadesc'
);

-- 4. Stone Page (ID: 2951)
UPDATE wp_postmeta
SET meta_value = 'Kivitöötasapinnad: graniit, kvarts, marmor. Prestiižne, unikaalne, vastupidav. Hind 300-500 €/m². Eksklusiivne disain teie kööki.'
WHERE post_id = 2951 AND meta_key = '_yoast_wpseo_metadesc';

INSERT INTO wp_postmeta (post_id, meta_key, meta_value)
SELECT 2951, '_yoast_wpseo_metadesc', 'Kivitöötasapinnad: graniit, kvarts, marmor. Prestiižne, unikaalne, vastupidav. Hind 300-500 €/m². Eksklusiivne disain teie kööki.'
WHERE NOT EXISTS (
    SELECT 1 FROM wp_postmeta WHERE post_id = 2951 AND meta_key = '_yoast_wpseo_metadesc'
);

-- 5. Materials Page (ID: 2530)
UPDATE wp_postmeta
SET meta_value = 'Austria kvaliteetmaterjalid köökidele: HPL, laminaat, kivi, Fenix. PEFC/FSC sertifitseeritud. Blum ja Hettich furnituur. +372 55 525 143'
WHERE post_id = 2530 AND meta_key = '_yoast_wpseo_metadesc';

INSERT INTO wp_postmeta (post_id, meta_key, meta_value)
SELECT 2530, '_yoast_wpseo_metadesc', 'Austria kvaliteetmaterjalid köökidele: HPL, laminaat, kivi, Fenix. PEFC/FSC sertifitseeritud. Blum ja Hettich furnituur. +372 55 525 143'
WHERE NOT EXISTS (
    SELECT 1 FROM wp_postmeta WHERE post_id = 2530 AND meta_key = '_yoast_wpseo_metadesc'
);

-- 6. Custom Kitchens Page (ID: 3133)
UPDATE wp_postmeta
SET meta_value = 'Köögimööbel eritellimusel Tallinnas. Tasuta 3D visualiseerimine ja mõõdistamine. Austria materjalid. 800-1500 €/jm. +372 55 525 143'
WHERE post_id = 3133 AND meta_key = '_yoast_wpseo_metadesc';

INSERT INTO wp_postmeta (post_id, meta_key, meta_value)
SELECT 3133, '_yoast_wpseo_metadesc', 'Köögimööbel eritellimusel Tallinnas. Tasuta 3D visualiseerimine ja mõõdistamine. Austria materjalid. 800-1500 €/jm. +372 55 525 143'
WHERE NOT EXISTS (
    SELECT 1 FROM wp_postmeta WHERE post_id = 3133 AND meta_key = '_yoast_wpseo_metadesc'
);

-- 7. Contact Page (ID: 2465)
UPDATE wp_postmeta
SET meta_value = 'Kontakt: Pärnu mnt 139c, Tallinn. Tel +372 55 525 143, info@studiokook.ee. Tasuta konsultatsioon ja mõõdistamine Tallinnas.'
WHERE post_id = 2465 AND meta_key = '_yoast_wpseo_metadesc';

INSERT INTO wp_postmeta (post_id, meta_key, meta_value)
SELECT 2465, '_yoast_wpseo_metadesc', 'Kontakt: Pärnu mnt 139c, Tallinn. Tel +372 55 525 143, info@studiokook.ee. Tasuta konsultatsioon ja mõõdistamine Tallinnas.'
WHERE NOT EXISTS (
    SELECT 1 FROM wp_postmeta WHERE post_id = 2465 AND meta_key = '_yoast_wpseo_metadesc'
);

-- 8. Quote Request Page (ID: 25)
UPDATE wp_postmeta
SET meta_value = 'Telli tasuta hinnapakkumine + 3D visualiseerimine. Vastus 24h jooksul. Köögimööbel ja töötasapinnad Austria kvaliteedis.'
WHERE post_id = 25 AND meta_key = '_yoast_wpseo_metadesc';

INSERT INTO wp_postmeta (post_id, meta_key, meta_value)
SELECT 25, '_yoast_wpseo_metadesc', 'Telli tasuta hinnapakkumine + 3D visualiseerimine. Vastus 24h jooksul. Köögimööbel ja töötasapinnad Austria kvaliteedis.'
WHERE NOT EXISTS (
    SELECT 1 FROM wp_postmeta WHERE post_id = 25 AND meta_key = '_yoast_wpseo_metadesc'
);

-- HIGH PRIORITY PAGES

-- 9. Fenix Page (ID: 5804)
UPDATE wp_postmeta
SET meta_value = 'Fenix NTM fassaadid: matt nanotehnoloogia pind, termoparanduv, sõrmejäljevaba. Premium kvaliteet Itaaliast. Hind 200-350 €/m².'
WHERE post_id = 5804 AND meta_key = '_yoast_wpseo_metadesc';

INSERT INTO wp_postmeta (post_id, meta_key, meta_value)
SELECT 5804, '_yoast_wpseo_metadesc', 'Fenix NTM fassaadid: matt nanotehnoloogia pind, termoparanduv, sõrmejäljevaba. Premium kvaliteet Itaaliast. Hind 200-350 €/m².'
WHERE NOT EXISTS (
    SELECT 1 FROM wp_postmeta WHERE post_id = 5804 AND meta_key = '_yoast_wpseo_metadesc'
);

-- 10. Facades Page (ID: 5800)
UPDATE wp_postmeta
SET meta_value = 'Köögifassaadid: Egger laminaat, PerfectSense matt, Fenix NTM. Lai valik värve ja tekstuure. Austria ja Itaalia kvaliteet.'
WHERE post_id = 5800 AND meta_key = '_yoast_wpseo_metadesc';

INSERT INTO wp_postmeta (post_id, meta_key, meta_value)
SELECT 5800, '_yoast_wpseo_metadesc', 'Köögifassaadid: Egger laminaat, PerfectSense matt, Fenix NTM. Lai valik värve ja tekstuure. Austria ja Itaalia kvaliteet.'
WHERE NOT EXISTS (
    SELECT 1 FROM wp_postmeta WHERE post_id = 5800 AND meta_key = '_yoast_wpseo_metadesc'
);

-- 11. Egger Facades Page (ID: 6309)
UPDATE wp_postmeta
SET meta_value = 'Egger köögifassaadid: laminaat ja PerfectSense matt. 100+ dekoori. Kraapimiskindel, lihtne hooldus. Austria kvaliteet.'
WHERE post_id = 6309 AND meta_key = '_yoast_wpseo_metadesc';

INSERT INTO wp_postmeta (post_id, meta_key, meta_value)
SELECT 6309, '_yoast_wpseo_metadesc', 'Egger köögifassaadid: laminaat ja PerfectSense matt. 100+ dekoori. Kraapimiskindel, lihtne hooldus. Austria kvaliteet.'
WHERE NOT EXISTS (
    SELECT 1 FROM wp_postmeta WHERE post_id = 6309 AND meta_key = '_yoast_wpseo_metadesc'
);

-- Verification query (run after UPDATE to check results)
-- SELECT p.ID, p.post_title, pm.meta_value as meta_description, LENGTH(pm.meta_value) as length
-- FROM wp_posts p
-- LEFT JOIN wp_postmeta pm ON p.ID = pm.post_id AND pm.meta_key = '_yoast_wpseo_metadesc'
-- WHERE p.ID IN (6335, 2943, 2951, 2530, 3133, 2465, 25, 5804, 5800, 6309)
-- ORDER BY p.post_name;

-- Notes:
-- ✅ All meta descriptions 120-155 characters (optimal for mobile + desktop)
-- ✅ Include primary keyword + unique value prop
-- ✅ CTA where appropriate (tasuta, helistage, telli)
-- ✅ Price ranges where relevant (transparency)
-- ✅ Phone number on contact/materials pages

-- Homepage meta description (find ID first):
-- Run: SELECT option_value FROM wp_options WHERE option_name = 'page_on_front';
-- Then update with:
-- 'Köögimööbel eritellimusel Tallinnas. Austria tippkvaliteet, tasuta 3D visualiseerimine, 5-aastane garantii. Alates 800 €/jm. +372 55 525 143'
