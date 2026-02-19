-- Fix 9 Egger decors: replace base64 JSON meta_data with PHP serialize format
-- Run in phpMyAdmin on studiokook.ee database
-- SAFE: only updates meta_data field, no structural changes

UPDATE wp_ngg_pictures SET meta_data = 'a:15:{s:5:"width";i:849;s:6:"height";i:849;s:4:"file";s:12:"F206_ST9.jpg";s:8:"aperture";i:0;s:6:"credit";s:15:"eamf.ee / Egger";s:6:"camera";s:0:"";s:17:"created_timestamp";i:1770195384;s:9:"copyright";s:5:"Egger";s:12:"focal_length";i:0;s:3:"iso";i:0;s:13:"shutter_speed";i:0;s:5:"flash";i:0;s:5:"title";s:8:"F206 ST9";s:8:"keywords";s:33:"HPL, Egger, compact laminat, F206";s:9:"thumbnail";a:2:{s:5:"width";i:160;s:6:"height";i:160;}}' WHERE pid = 1388;

UPDATE wp_ngg_pictures SET meta_data = 'a:15:{s:5:"width";i:849;s:6:"height";i:849;s:4:"file";s:13:"F221_ST87.jpg";s:8:"aperture";i:0;s:6:"credit";s:15:"eamf.ee / Egger";s:6:"camera";s:0:"";s:17:"created_timestamp";i:1770195384;s:9:"copyright";s:5:"Egger";s:12:"focal_length";i:0;s:3:"iso";i:0;s:13:"shutter_speed";i:0;s:5:"flash";i:0;s:5:"title";s:9:"F221 ST87";s:8:"keywords";s:33:"HPL, Egger, compact laminat, F221";s:9:"thumbnail";a:2:{s:5:"width";i:160;s:6:"height";i:160;}}' WHERE pid = 1389;

UPDATE wp_ngg_pictures SET meta_data = 'a:15:{s:5:"width";i:849;s:6:"height";i:849;s:4:"file";s:13:"F244_ST76.jpg";s:8:"aperture";i:0;s:6:"credit";s:15:"eamf.ee / Egger";s:6:"camera";s:0:"";s:17:"created_timestamp";i:1770195384;s:9:"copyright";s:5:"Egger";s:12:"focal_length";i:0;s:3:"iso";i:0;s:13:"shutter_speed";i:0;s:5:"flash";i:0;s:5:"title";s:9:"F244 ST76";s:8:"keywords";s:33:"HPL, Egger, compact laminat, F244";s:9:"thumbnail";a:2:{s:5:"width";i:160;s:6:"height";i:160;}}' WHERE pid = 1390;

UPDATE wp_ngg_pictures SET meta_data = 'a:15:{s:5:"width";i:849;s:6:"height";i:849;s:4:"file";s:13:"F267_ST76.jpg";s:8:"aperture";i:0;s:6:"credit";s:15:"eamf.ee / Egger";s:6:"camera";s:0:"";s:17:"created_timestamp";i:1770195384;s:9:"copyright";s:5:"Egger";s:12:"focal_length";i:0;s:3:"iso";i:0;s:13:"shutter_speed";i:0;s:5:"flash";i:0;s:5:"title";s:9:"F267 ST76";s:8:"keywords";s:33:"HPL, Egger, compact laminat, F267";s:9:"thumbnail";a:2:{s:5:"width";i:160;s:6:"height";i:160;}}' WHERE pid = 1391;

UPDATE wp_ngg_pictures SET meta_data = 'a:15:{s:5:"width";i:849;s:6:"height";i:849;s:4:"file";s:13:"F311_ST87.jpg";s:8:"aperture";i:0;s:6:"credit";s:15:"eamf.ee / Egger";s:6:"camera";s:0:"";s:17:"created_timestamp";i:1770195384;s:9:"copyright";s:5:"Egger";s:12:"focal_length";i:0;s:3:"iso";i:0;s:13:"shutter_speed";i:0;s:5:"flash";i:0;s:5:"title";s:9:"F311 ST87";s:8:"keywords";s:33:"HPL, Egger, compact laminat, F311";s:9:"thumbnail";a:2:{s:5:"width";i:160;s:6:"height";i:160;}}' WHERE pid = 1392;

UPDATE wp_ngg_pictures SET meta_data = 'a:15:{s:5:"width";i:849;s:6:"height";i:849;s:4:"file";s:14:"H1318_ST10.jpg";s:8:"aperture";i:0;s:6:"credit";s:15:"eamf.ee / Egger";s:6:"camera";s:0:"";s:17:"created_timestamp";i:1770195384;s:9:"copyright";s:5:"Egger";s:12:"focal_length";i:0;s:3:"iso";i:0;s:13:"shutter_speed";i:0;s:5:"flash";i:0;s:5:"title";s:10:"H1318 ST10";s:8:"keywords";s:34:"HPL, Egger, compact laminat, H1318";s:9:"thumbnail";a:2:{s:5:"width";i:160;s:6:"height";i:160;}}' WHERE pid = 1393;

UPDATE wp_ngg_pictures SET meta_data = 'a:15:{s:5:"width";i:849;s:6:"height";i:849;s:4:"file";s:14:"H1330_ST10.jpg";s:8:"aperture";i:0;s:6:"credit";s:15:"eamf.ee / Egger";s:6:"camera";s:0:"";s:17:"created_timestamp";i:1770195384;s:9:"copyright";s:5:"Egger";s:12:"focal_length";i:0;s:3:"iso";i:0;s:13:"shutter_speed";i:0;s:5:"flash";i:0;s:5:"title";s:10:"H1330 ST10";s:8:"keywords";s:34:"HPL, Egger, compact laminat, H1330";s:9:"thumbnail";a:2:{s:5:"width";i:160;s:6:"height";i:160;}}' WHERE pid = 1394;

UPDATE wp_ngg_pictures SET meta_data = 'a:15:{s:5:"width";i:849;s:6:"height";i:849;s:4:"file";s:14:"U7081_ST76.jpg";s:8:"aperture";i:0;s:6:"credit";s:15:"eamf.ee / Egger";s:6:"camera";s:0:"";s:17:"created_timestamp";i:1770195384;s:9:"copyright";s:5:"Egger";s:12:"focal_length";i:0;s:3:"iso";i:0;s:13:"shutter_speed";i:0;s:5:"flash";i:0;s:5:"title";s:10:"U7081 ST76";s:8:"keywords";s:34:"HPL, Egger, compact laminat, U7081";s:9:"thumbnail";a:2:{s:5:"width";i:160;s:6:"height";i:160;}}' WHERE pid = 1395;

UPDATE wp_ngg_pictures SET meta_data = 'a:15:{s:5:"width";i:849;s:6:"height";i:849;s:4:"file";s:13:"U999_ST76.jpg";s:8:"aperture";i:0;s:6:"credit";s:15:"eamf.ee / Egger";s:6:"camera";s:0:"";s:17:"created_timestamp";i:1770195384;s:9:"copyright";s:5:"Egger";s:12:"focal_length";i:0;s:3:"iso";i:0;s:13:"shutter_speed";i:0;s:5:"flash";i:0;s:5:"title";s:9:"U999 ST76";s:8:"keywords";s:33:"HPL, Egger, compact laminat, U999";s:9:"thumbnail";a:2:{s:5:"width";i:160;s:6:"height";i:160;}}' WHERE pid = 1396;

-- Also clean NGG cache
DELETE FROM wp_options WHERE option_name LIKE '%ngg%transient%';
