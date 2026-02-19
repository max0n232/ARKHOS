<?php
/**
 * SEO Enhancement: JSON-LD Schemas + FAQ sections
 * studiokook.ee - 2026-02-04
 * UPDATED: 2026-02-09 - Multilingual URL support
 *
 * SAFE: Uses wp_head hook only, NO wp_update_post()
 * Install via: Insert Headers and Footers plugin OR Code Snippets (header)
 */

// ========================================
// Helper: Check page by URL (multilingual)
// ========================================
function studiokook_is_page_multilang($base_slug) {
    $uri = $_SERVER['REQUEST_URI'];
    // Поддержка вложенных URL (/toopinnad/hpl-tootasapinnad/ и т.д.)
    // ET: /slug/ или /parent/slug/
    // RU/EN/FI: /ru/slug/ или /ru/parent/slug/
    $pattern = '#^/(ru/|en/|fi/)?([a-z-]+/)?' . preg_quote($base_slug, '#') . '/?(\?.*)?$#';
    return preg_match($pattern, $uri);
}

// ========================================
// 1. FAQPage Schema for HPL page
// ========================================
add_action('wp_head', function() {
    if (!studiokook_is_page_multilang('hpl-tootasapinnad')) return;
    ?>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Mis on HPL kompaktlaminaat?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "HPL (High Pressure Laminate) on kõrgsurvega pressitud laminaat, mis koosneb mitmest kihist kraft-paberist ja dekoratiivkihist. See on äärmiselt vastupidav, niiskuskindel ja kraapimiskindel materjal köögitöötasapindadeks. Paksus 12mm, maksimaalne mõõt 4200x1300mm."
      }
    },
    {
      "@type": "Question",
      "name": "Mille poolest erineb HPL tavalisest laminaadist?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "HPL kompaktlaminaat on läbini sama materjal (ei ole puitlaastplaadile kleebitud), seetõttu on see 100% niiskuskindel ja sobib ka vannituppa. Tavaline laminaat on puitlaastplaadile kleebitud dekoratiivkiht, mis niiskuse korral paisub."
      }
    },
    {
      "@type": "Question",
      "name": "Milliseid HPL brände te pakute?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Pakume kahe juhtiva Euroopa tootja HPL töötasapindu: Egger (11 dekoori) ja Fundermax (16 dekoori). Kokku 27 dekoori valikus, alates klassikalistest puiduimitatsioonidest kuni kaasaegsete ühevärviliste toonideni."
      }
    },
    {
      "@type": "Question",
      "name": "Kui vastupidav on HPL töötasapind?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "HPL kompaktlaminaat on üks vastupidavamaid köögitöötasapindu: kraapimiskindel, kuumakindel kuni 180°C, niiskuskindel, UV-kindel ja hügieeniline. Garantii 10+ aastat. Sobib nii kodu- kui ärikasutuseks."
      }
    },
    {
      "@type": "Question",
      "name": "Kui palju maksab HPL töötasapind?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "HPL kompaktlaminaat töötasapindade hind algab 150€/m² sõltuvalt dekoorist ja mõõtudest. Lõpphind sisaldab materjali, lõikust ja servade töötlust. Täpse hinnapakkumise saamiseks täitke meie hinnapäringu vorm."
      }
    }
  ]
}
</script>
<?php
});


// ========================================
// 2. FAQPage Schema for Homepage
// ========================================
add_action('wp_head', function() {
    if (!studiokook_is_page_multilang('koogid-eritellimusel')) return;
    ?>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Kui kaua võtab köögi valmistamine?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Standardne eritellimusköök valmib 4-6 nädala jooksul pärast projekti kinnitamist. See hõlmab mõõtmist, 3D visualiseerimist, tootmist ja paigaldust. Kiirem teostus on võimalik kokkuleppel."
      }
    },
    {
      "@type": "Question",
      "name": "Kas pakute tasuta 3D visualiseerimist?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Jah! Iga projekti jaoks teeme tasuta 3D visualiseeringu, et näeksite täpselt, kuidas teie köök välja hakkab nägema. Saate näha materjale, värve ja paigutust enne tootmise alustamist."
      }
    },
    {
      "@type": "Question",
      "name": "Millised on köögimööbli hinnad?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Eritellimusköökide hind sõltub materjalidest, furnituurist ja köögi suurusest. Orienteeruvalt algavad hinnad 800€ jooksva meetri kohta. Täpse pakkumise saamiseks täitke meie hinnapäringu vorm või helistage +372 55 525 143."
      }
    },
    {
      "@type": "Question",
      "name": "Milliseid materjale kasutate?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Kasutame Austria tippkvaliteediga furnituri (Blum, Hettich) ja Euroopa parimaid materjale: HPL kompaktlaminaat (Egger, Fundermax), Fenix NTM nanotehnoloogia pinnad, graniit- ja kvartsitöötasapindu ning kvaliteetseid laminaatfassaade."
      }
    },
    {
      "@type": "Question",
      "name": "Kas paigaldate köögi ka?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Jah, pakume täisteenust: mõõtmine, projekteerimine, tootmine ja professionaalne paigaldus. Meie meeskond paigaldab köögi kokkulepitud ajal, minimaalne segadus teie kodus."
      }
    }
  ]
}
</script>
<?php
});


// ========================================
// 3. FAQPage Schema for Materials page
// ========================================
add_action('wp_head', function() {
    if (!studiokook_is_page_multilang('materjalid')) return;
    ?>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Milliseid töötasapinna materjale pakute?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Pakume nelja tüüpi töötasapindu: HPL kompaktlaminaat (Egger, Fundermax), tavaline laminaat, looduskivi (graniit, kvarts) ja Fenix NTM nanotech pinnad. Igal materjalil on oma eelised sõltuvalt kasutusest ja eelarvest."
      }
    },
    {
      "@type": "Question",
      "name": "Milline furnituur on parim köögile?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Kasutame Austria tippbrände Blum ja Hettich — need on maailma juhtivad köögifurnituuri tootjad. Blum TANDEMBOX sahtlid, AVENTOS tõstukid ja CLIP top hinged tagavad vaikse sulgemise ja pikaajalise vastupidavuse."
      }
    },
    {
      "@type": "Question",
      "name": "Kas materjalid on keskkonnasõbralikud?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Jah, kõik meie materjalid vastavad Euroopa keskkonnastandarditele. Egger toorainet pärineb säästvalt majandatud metsadest (PEFC sertifikaat). Blum furnituur on toodetud CO2-neutraalselt."
      }
    }
  ]
}
</script>
<?php
});


// ========================================
// 4. Product Schema for HPL page
// ========================================
add_action('wp_head', function() {
    if (!studiokook_is_page_multilang('hpl-tootasapinnad')) return;
    ?>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "HPL Kompaktlaminaat Töötasapinnad",
  "description": "Kõrgsurvega pressitud kompaktlaminaat töötasapinnad köögile. Egger ja Fundermax brändid, 27 dekoori valikus.",
  "brand": [
    {"@type": "Brand", "name": "Egger"},
    {"@type": "Brand", "name": "Fundermax"}
  ],
  "category": "Köögitöötasapinnad",
  "material": "High Pressure Laminate (HPL)",
  "offers": {
    "@type": "AggregateOffer",
    "priceCurrency": "EUR",
    "lowPrice": "150",
    "highPrice": "350",
    "unitCode": "MTK",
    "availability": "https://schema.org/InStock",
    "seller": {
      "@type": "Organization",
      "name": "Studioköök",
      "url": "https://studiokook.ee"
    }
  },
  "additionalProperty": [
    {"@type": "PropertyValue", "name": "Paksus", "value": "12 mm"},
    {"@type": "PropertyValue", "name": "Maksimaalne mõõt", "value": "4200 x 1300 mm"},
    {"@type": "PropertyValue", "name": "Dekooride arv", "value": "27 (11 Egger + 16 Fundermax)"},
    {"@type": "PropertyValue", "name": "Kraapimiskindlus", "value": "Jah"},
    {"@type": "PropertyValue", "name": "Niiskuskindlus", "value": "100%"},
    {"@type": "PropertyValue", "name": "Kuumakindlus", "value": "kuni 180°C"}
  ],
  "image": "https://studiokook.ee/wp-content/gallery/egger/F206_ST9.jpg"
}
</script>
<?php
});


// ========================================
// 5. Product Schema for Laminate page
// ========================================
add_action('wp_head', function() {
    if (!studiokook_is_page_multilang('laminaadist-tootasapinnad')) return;
    ?>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Laminaadist Töötasapinnad",
  "description": "Kvaliteetsed laminaattöötasapinnad köögile. Niiskus- ja kuumuskindlad, lai dekoorivalik.",
  "brand": {"@type": "Brand", "name": "Egger"},
  "category": "Köögitöötasapinnad",
  "material": "Laminaat",
  "offers": {
    "@type": "AggregateOffer",
    "priceCurrency": "EUR",
    "lowPrice": "50",
    "highPrice": "150",
    "unitCode": "MTK",
    "availability": "https://schema.org/InStock",
    "seller": {"@type": "Organization", "name": "Studioköök"}
  }
}
</script>
<?php
});


// ========================================
// 6. Product Schema for Stone page
// ========================================
add_action('wp_head', function() {
    if (!studiokook_is_page_multilang('kividest-tootasapinnad')) return;
    ?>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Kividest Töötasapinnad",
  "description": "Looduskivist töötasapinnad: graniit ja kvarts. Kõrgeim vastupidavus ja luksuslik välimus.",
  "category": "Köögitöötasapinnad",
  "material": "Looduskivi",
  "offers": {
    "@type": "AggregateOffer",
    "priceCurrency": "EUR",
    "lowPrice": "200",
    "highPrice": "500",
    "unitCode": "MTK",
    "availability": "https://schema.org/InStock",
    "seller": {"@type": "Organization", "name": "Studioköök"}
  }
}
</script>
<?php
});


// ========================================
// 7. Product Schema for Fenix page
// ========================================
add_action('wp_head', function() {
    if (!studiokook_is_page_multilang('fenix')) return;
    ?>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Fenix NTM Nanotech Pinnad",
  "description": "Fenix NTM nanotehnoloogia pinnad köögile: iseparanev, sõrmejäljevaba, antibakteriaalne. Itaalia tippkvaliteet.",
  "brand": {"@type": "Brand", "name": "Fenix"},
  "category": "Köögipinnad",
  "material": "Fenix NTM (nanotech)",
  "offers": {
    "@type": "AggregateOffer",
    "priceCurrency": "EUR",
    "lowPrice": "200",
    "highPrice": "400",
    "unitCode": "MTK",
    "availability": "https://schema.org/InStock",
    "seller": {"@type": "Organization", "name": "Studioköök"}
  },
  "additionalProperty": [
    {"@type": "PropertyValue", "name": "Iseparanev", "value": "Jah (termiline parandus)"},
    {"@type": "PropertyValue", "name": "Sõrmejäljevaba", "value": "Jah"},
    {"@type": "PropertyValue", "name": "Antibakteriaalne", "value": "Jah"},
    {"@type": "PropertyValue", "name": "Päritolu", "value": "Itaalia"}
  ]
}
</script>
<?php
});


// ========================================
// 8. FAQPage Schema for Contact page
// ========================================
add_action('wp_head', function() {
    if (!studiokook_is_page_multilang('kontakt')) return;
    ?>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Kus asub Studioköök?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Studioköök asub Tallinnas aadressil Pärnu mnt 139c, 11317. Meil on showroom, kus saate näha materjale ja valmis kööginäidiseid."
      }
    },
    {
      "@type": "Question",
      "name": "Millised on lahtiolekuajad?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Oleme avatud esmaspäevast reedeni kell 09:00-18:00. Nädalavahetusel eelneva kokkuleppega. Helistage +372 55 525 143 või kirjutage maksim@studiokook.ee."
      }
    },
    {
      "@type": "Question",
      "name": "Kuidas alustada köögiprojekti?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "1) Täitke hinnapäringu vorm meie veebilehel või helistage. 2) Meie disainer tuleb tasuta mõõtmisele. 3) Saate 3D visualiseeringu ja hinnapakkumise. 4) Kinnitamisel alustame tootmist."
      }
    }
  ]
}
</script>
<?php
});
