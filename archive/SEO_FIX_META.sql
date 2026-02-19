-- ============================================
-- SEO Fix: Yoast Meta Titles & Descriptions
-- studiokook.ee - 2026-02-04
-- ============================================
-- Execute in phpMyAdmin
-- Backup: SELECT * FROM wp_postmeta WHERE meta_key IN ('_yoast_wpseo_title','_yoast_wpseo_metadesc');
-- ============================================

-- =====================
-- PHASE 1: META TITLES (missing on 18 pages, fixing 11 navigation pages)
-- =====================

-- Homepage (ID 3133) - koogid-eritellimusel
INSERT INTO wp_postmeta (post_id, meta_key, meta_value) VALUES
(3133, '_yoast_wpseo_title', 'Köögimööbel eritellimusel Tallinnas %%sep%% %%sitename%%');

-- Contact (ID 2465)
INSERT INTO wp_postmeta (post_id, meta_key, meta_value) VALUES
(2465, '_yoast_wpseo_title', 'Kontakt ja asukoht %%sep%% %%sitename%%');

-- HPL (ID 6335)
INSERT INTO wp_postmeta (post_id, meta_key, meta_value) VALUES
(6335, '_yoast_wpseo_title', 'HPL kompaktlaminaat töötasapinnad – Egger ja Fundermax %%sep%% %%sitename%%');

-- Laminate (ID 2943)
INSERT INTO wp_postmeta (post_id, meta_key, meta_value) VALUES
(2943, '_yoast_wpseo_title', 'Laminaadist töötasapinnad köögile %%sep%% %%sitename%%');

-- Stone (ID 2951)
INSERT INTO wp_postmeta (post_id, meta_key, meta_value) VALUES
(2951, '_yoast_wpseo_title', 'Kividest töötasapinnad – graniit ja kvarts %%sep%% %%sitename%%');

-- Facades (ID 5800)
INSERT INTO wp_postmeta (post_id, meta_key, meta_value) VALUES
(5800, '_yoast_wpseo_title', 'Köögifassaadid – MDF, PVC, akrüül %%sep%% %%sitename%%');

-- Egger facades (ID 6309)
INSERT INTO wp_postmeta (post_id, meta_key, meta_value) VALUES
(6309, '_yoast_wpseo_title', 'Egger fassaadid – laminaat köögifassaadid %%sep%% %%sitename%%');

-- Fenix (ID 5804)
INSERT INTO wp_postmeta (post_id, meta_key, meta_value) VALUES
(5804, '_yoast_wpseo_title', 'Fenix NTM nanotech köögipinnad %%sep%% %%sitename%%');

-- Hardware (ID 2706)
INSERT INTO wp_postmeta (post_id, meta_key, meta_value) VALUES
(2706, '_yoast_wpseo_title', 'Köögifurnituur – Blum, Hettich, Kessebohmer %%sep%% %%sitename%%');

-- Drawers (ID 2619)
INSERT INTO wp_postmeta (post_id, meta_key, meta_value) VALUES
(2619, '_yoast_wpseo_title', 'Köögi sahtlisüsteemid – Blum ja Hettich %%sep%% %%sitename%%');

-- Corner mechanisms (ID 2651)
INSERT INTO wp_postmeta (post_id, meta_key, meta_value) VALUES
(2651, '_yoast_wpseo_title', 'Nurga lahendusmehhanismid köögile %%sep%% %%sitename%%');

-- Storage systems (ID 2674)
INSERT INTO wp_postmeta (post_id, meta_key, meta_value) VALUES
(2674, '_yoast_wpseo_title', 'Köögi ladustamissüsteemid %%sep%% %%sitename%%');


-- =====================
-- PHASE 2: META DESCRIPTIONS (missing on 3 pages, + improve 8 weak ones)
-- =====================

-- HPL (ID 6335) - MISSING
INSERT INTO wp_postmeta (post_id, meta_key, meta_value) VALUES
(6335, '_yoast_wpseo_metadesc', 'HPL kompaktlaminaat töötasapinnad: 11 Egger ja 16 Fundermax dekoori. Kraapimiskindel, niiskuskindel, 12mm paksus. Tasuta hinnapakkumine Tallinnas.');

-- Facades (ID 5800) - MISSING
INSERT INTO wp_postmeta (post_id, meta_key, meta_value) VALUES
(5800, '_yoast_wpseo_metadesc', 'Köögifassaadid eritellimusel: MDF, PVC, akrüül, laminaat. Lai värvivalik, matt ja läikiv viimistlus. Tasuta 3D visualiseerimine.');

-- Fenix (ID 5804) - MISSING
INSERT INTO wp_postmeta (post_id, meta_key, meta_value) VALUES
(5804, '_yoast_wpseo_metadesc', 'Fenix NTM nanotech pinnad köögile: iseparanev, sõrmejäljevaba, antibakteriaalne. Itaalia tippkvaliteet. Vaata dekoore ja telli.');

-- koogid-eritellimusel (ID 3133) - EXISTS but generic, IMPROVE
UPDATE wp_postmeta SET meta_value = 'Köögimööbel eritellimusel Tallinnas: Austria furnituur, 3D visualiseerimine, isiklik lähenemine. Tasuta projekt ja hinnapakkumine %%sep%% ☎ +37255525143'
WHERE post_id = 3133 AND meta_key = '_yoast_wpseo_metadesc';

-- Materials (ID 2530) - EXISTS but weak, IMPROVE
UPDATE wp_postmeta SET meta_value = 'Köögimaterjalid: HPL, laminaat, graniit, kvarts, Fenix NTM. Austria tippfurnituur Blum ja Hettich. Kõik ühest kohast, tasuta konsultatsioon.'
WHERE post_id = 2530 AND meta_key = '_yoast_wpseo_metadesc';

-- Laminate (ID 2943) - EXISTS but generic
UPDATE wp_postmeta SET meta_value = 'Laminaadist töötasapinnad köögile: niiskus- ja kuumuskindlad, lai dekoorivalik. Egger kvaliteet. Telli koos paigaldusega Tallinnas.'
WHERE post_id = 2943 AND meta_key = '_yoast_wpseo_metadesc';

-- Stone (ID 2951) - EXISTS but off-topic
UPDATE wp_postmeta SET meta_value = 'Kividest töötasapinnad: graniit ja kvarts. Kõrgeim vastupidavus, luksuslik välimus. Mõõtmine ja paigaldus Tallinnas. Küsi hinnapakkumist.'
WHERE post_id = 2951 AND meta_key = '_yoast_wpseo_metadesc';

-- Hardware (ID 2706) - EXISTS but too long
UPDATE wp_postmeta SET meta_value = 'Köögifurnituur: Blum ja Hettich hinged, sahtlid, tõstemehhanismid. Austria tippkvaliteet, vaikne sulgemine, 15+ aastat garantiid.'
WHERE post_id = 2706 AND meta_key = '_yoast_wpseo_metadesc';

-- Contact (ID 2465) - EXISTS, slightly improve
UPDATE wp_postmeta SET meta_value = 'Studioköök Tallinnas: Pärnu mnt 139c. ☎ +37255525143. E-R 09–18. Tasuta konsultatsioon ja 3D köögiprojekt. Tule kohale või kirjuta!'
WHERE post_id = 2465 AND meta_key = '_yoast_wpseo_metadesc';


-- =====================
-- PHASE 3: EGGER FACADES + minor pages
-- =====================

-- Egger facades (ID 6309)
INSERT INTO wp_postmeta (post_id, meta_key, meta_value) VALUES
(6309, '_yoast_wpseo_metadesc', 'Egger laminaatfassaadid köögile: vastupidav, kerge hooldada, suur dekoorivalik. Puidu, kivi ja ühevärvilised dekoorid.');

-- Drawers (ID 2619)
INSERT INTO wp_postmeta (post_id, meta_key, meta_value) VALUES
(2619, '_yoast_wpseo_metadesc', 'Köögi sahtlisüsteemid: Blum TANDEMBOX ja Hettich ArciTech. Vaikne sulgemine, täisväljavedu, kuni 65kg kandejõud.');

-- Corner mechanisms (ID 2651)
INSERT INTO wp_postmeta (post_id, meta_key, meta_value) VALUES
(2651, '_yoast_wpseo_metadesc', 'Nurga lahendusmehhanismid köögile: Kessebohmer LeMans, Magic Corner. Kasutage iga sentimeeter nurgakapist ära.');

-- Storage (ID 2674)
INSERT INTO wp_postmeta (post_id, meta_key, meta_value) VALUES
(2674, '_yoast_wpseo_metadesc', 'Köögi ladustamissüsteemid: kõrg- ja alumised tõstukid, pudeliriiulid, prügisorteerijad. Blum ja Kessebohmer kvaliteet.');
