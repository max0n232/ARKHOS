# SEO Implementation Package
## Ready-to-Deploy Components for studiokook.ee

**Created:** 2026-02-04
**Priority:** Critical (Phase 1) → High (Phase 2) → Medium (Phase 3)
**Estimated time:** 4-6 hours total implementation

---

## 📋 Quick Start Checklist

### Before You Begin
- [ ] Read full SEO_AUDIT_REPORT_2026.md
- [ ] Backup WordPress database (export via phpMyAdmin)
- [ ] Have WordPress admin access ready
- [ ] Have phpMyAdmin access for SQL execution
- [ ] Clear browser cache before testing

### Phase 1: Quick Wins (1-2 hours) 🔴 CRITICAL
- [ ] Execute UPDATE_META_DESCRIPTIONS.sql in phpMyAdmin
- [ ] Add H1 tags to 5 key pages (copy from Section 1 below)
- [ ] Update CTA buttons on custom kitchen page
- [ ] Enable hreflang in TranslatePress settings
- [ ] Add trust signals section to custom kitchen page

### Phase 2: FAQ Content (2-3 hours) 🟠 HIGH
- [ ] Add FAQ HTML to homepage (copy from Section 2)
- [ ] Add FAQ HTML to HPL page
- [ ] Add FAQ HTML to Materials page
- [ ] Add FAQ HTML to Custom Kitchen page
- [ ] Add FAQ HTML to Contact page
- [ ] Add FAQPage JSON-LD schemas (copy from Section 3)

### Phase 3: Structured Data (1 hour) 🟡 MEDIUM
- [ ] Add Product schema to HPL page
- [ ] Add Product schema to Laminate page
- [ ] Add Product schema to Stone page
- [ ] Add Product schema to Fenix page
- [ ] Validate all schemas with Google Rich Results Test

### Testing & Validation
- [ ] Test all pages in 4 languages (ET/RU/EN/FI)
- [ ] Verify H1 appears on each page
- [ ] Check meta descriptions in Google Search Console
- [ ] Validate JSON-LD schemas (https://validator.schema.org/)
- [ ] Check hreflang tags in page source (view-source:)
- [ ] Clear cache and verify changes live

---

## Section 1: H1 Tags + CTA Buttons

### How to Add H1 Tags

**WordPress Method:**
1. Go to Pages → Edit Page
2. Add Custom HTML block at the very top of content
3. Paste H1 code from below
4. Publish/Update

**Or via Code Snippets Plugin:**
- Create snippet with PHP code (see templates below)
- Set to run on specific page_id
- Activate snippet

---

### 1.1 Homepage H1

```html
<!-- Add this as FIRST element in page content -->
<h1 style="font-size: 2.5em; font-weight: 700; margin-bottom: 0.5em; color: #1a1a1a;">
  Köögimööbel Tellimustöö Tallinnas | Studioköök
</h1>
```

**For other languages** (TranslatePress will handle, or add manually):
- RU: `Кухонная мебель на заказ в Таллинне | Studioköök`
- EN: `Custom Kitchen Furniture in Tallinn | Studioköök`
- FI: `Keittiökalusteet Tilaustyönä Tallinnassa | Studioköök`

---

### 1.2 HPL Page H1 (post_id: 6335)

```html
<h1 style="font-size: 2.2em; font-weight: 700; margin-bottom: 0.5em; color: #1a1a1a;">
  HPL Kompaktlaminaat Töötasapinnad
</h1>
<p style="font-size: 1.1em; color: #666; margin-bottom: 1.5em;">
  Egger ja Fundermax Austria kvaliteet | 27 dekoori | 10-aastane garantii
</p>
```

Translations:
- RU: `Столешницы из компактного ламината HPL` / `Качество Egger и Fundermax из Австрии | 27 декоров | 10 лет гарантии`
- EN: `HPL Compact Laminate Countertops` / `Egger and Fundermax Austrian Quality | 27 Decors | 10-Year Warranty`
- FI: `HPL-kompaktilaminaatti Työtasot` / `Egger ja Fundermax itävaltalainen laatu | 27 dekooria | 10 vuoden takuu`

---

### 1.3 Laminate Page H1 (post_id: 2943)

```html
<h1>Laminaadist Töötasapinnad Egger</h1>
<p style="font-size: 1.1em; color: #666;">
  Majanduslik ja mitmekülgne | Alates 80 €/m² | Lai valik dekoore
</p>
```

---

### 1.4 Materials Page H1 (post_id: 2530)

```html
<h1>Köögimaterjalid Austria Tippkvaliteedis</h1>
<p style="font-size: 1.1em; color: #666;">
  HPL, Laminaat, Kivi, Fenix | PEFC/FSC Sertifitseeritud | Blum & Hettich Furnituur
</p>
```

---

### 1.5 Custom Kitchen Page H1 (post_id: 3133)

```html
<h1>Köögimööbel Eritellimusel Tallinnas</h1>
<p style="font-size: 1.1em; color: #666;">
  Tasuta 3D visualiseerimine | Austria materjalid | 5-aastane garantii
</p>
```

---

### 1.6 CTA Button Updates

**Current problem:** Generic "button" text with no compelling copy

**Fix for Custom Kitchen Page (post_id: 3133):**

Find existing button and replace with:

```html
<div class="cta-primary" style="margin: 2em 0; text-align: center;">
  <a href="/hinnaparing/" class="button button-primary" style="
    background: #ff6b35;
    color: white;
    padding: 1.2em 2.5em;
    font-size: 1.2em;
    font-weight: 700;
    border-radius: 8px;
    text-decoration: none;
    display: inline-block;
    box-shadow: 0 4px 12px rgba(255,107,53,0.3);
    transition: all 0.3s ease;
  " onmouseover="this.style.background='#ff8555'" onmouseout="this.style.background='#ff6b35'">
    🎨 Telli Tasuta 3D Visualiseerimine
  </a>
  <p style="font-size: 0.9em; color: #888; margin-top: 0.5em;">
    Vastus 24 tunni jooksul | +372 55 525 143
  </p>
</div>
```

**Alternative CTA variants to A/B test:**
```html
<!-- Option 2: Focus on price transparency -->
<a href="/hinnaparing/" class="button button-primary">
  💰 Telli Tasuta Hinnapakkumine
  <span style="display: block; font-size: 0.8em; font-weight: 400;">Alates 800 €/jm</span>
</a>

<!-- Option 3: Urgency-driven -->
<a href="/hinnaparing/" class="button button-primary">
  ⚡ Broneeri Tasuta Konsultatsioon
  <span style="display: block; font-size: 0.8em; font-weight: 400;">Vabad ajad täituvad kiirelt!</span>
</a>
```

---

### 1.7 Trust Signals Section

**Add to Custom Kitchen Page (after intro paragraph, before main content):**

```html
<section class="trust-signals" style="
  background: #f8f9fa;
  padding: 2em;
  border-radius: 12px;
  margin: 2em 0;
  border-left: 4px solid #ff6b35;
">
  <h2 style="font-size: 1.8em; margin-bottom: 1em; color: #1a1a1a;">
    Miks Valida Studioköök?
  </h2>

  <div class="trust-grid" style="
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5em;
  ">
    <div class="trust-item">
      <h3 style="color: #ff6b35; font-size: 1.1em; margin-bottom: 0.5em;">
        ✓ 15+ Aastat Kogemust
      </h3>
      <p style="color: #666;">
        Alates 2008. aastast oleme valmistanud üle 200 köögimööbli komplekti Tallinnas ja Harjumaal.
      </p>
    </div>

    <div class="trust-item">
      <h3 style="color: #ff6b35; font-size: 1.1em; margin-bottom: 0.5em;">
        ✓ Austria Tippkvaliteet
      </h3>
      <p style="color: #666;">
        Kasutame ainult Austria (Egger, Blum, Hettich) ja Itaalia (Fenix) tippmaterjale. PEFC/FSC sertifitseeritud.
      </p>
    </div>

    <div class="trust-item">
      <h3 style="color: #ff6b35; font-size: 1.1em; margin-bottom: 0.5em;">
        ✓ Tasuta 3D Visualiseerimine
      </h3>
      <p style="color: #666;">
        Näete täpselt, kuidas teie köök välja hakkab nägema ENNE tootmise alustamist. Fotorealistlik 3D projekt.
      </p>
    </div>

    <div class="trust-item">
      <h3 style="color: #ff6b35; font-size: 1.1em; margin-bottom: 0.5em;">
        ✓ Garantii 5-10 Aastat
      </h3>
      <p style="color: #666;">
        5-aastane garantii kõikidele toodetele. HPL töötasapindadel 10-aastane, Austria furnituuril kuni 20-aastane garantii.
      </p>
    </div>

    <div class="trust-item">
      <h3 style="color: #ff6b35; font-size: 1.1em; margin-bottom: 0.5em;">
        ✓ Professionaalne Paigaldus
      </h3>
      <p style="color: #666;">
        Paigaldame ise ja vastutame kvaliteedi eest täielikult. Töötame koos elektrikute ja santehnikutega.
      </p>
    </div>

    <div class="trust-item">
      <h3 style="color: #ff6b35; font-size: 1.1em; margin-bottom: 0.5em;">
        ✓ Läbipaistvad Hinnad
      </h3>
      <p style="color: #666;">
        Alates 800 €/jooksev meeter. Täpne hinnapakkumine 24h jooksul. Ei ole varjatud kulusid.
      </p>
    </div>
  </div>
</section>
```

**Translations needed:** Yes (add to TranslatePress after implementing ET version)

---

## Section 2: FAQ HTML Templates

### 2.1 Homepage FAQ (6 questions)

**Add before footer, after main content:**

```html
<section class="faq-section" itemscope itemtype="https://schema.org/FAQPage" style="
  max-width: 900px;
  margin: 3em auto;
  padding: 2em;
  background: #fff;
">
  <h2 style="font-size: 2em; margin-bottom: 1.5em; text-align: center; color: #1a1a1a;">
    Korduma Kippuvad Küsimused
  </h2>

  <!-- FAQ 1 -->
  <div class="faq-item" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question" style="
    border-bottom: 1px solid #eee;
    padding: 1.5em 0;
  ">
    <h3 itemprop="name" style="font-size: 1.3em; color: #ff6b35; margin-bottom: 0.8em; cursor: pointer;">
      Kui kaua võtab köök valmistamine?
    </h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <div itemprop="text" style="color: #444; line-height: 1.6;">
        <p>Standardne köök valmib <strong>3-4 nädala jooksul</strong> pärast projekti kinnitamist. See hõlmab tasuta 3D visualiseerimist, tootmist ja professionaalset paigaldust. Kiirem teostus on võimalik kokkuleppel. Komplekssemad projektid võivad võtta 5-6 nädalat.</p>
      </div>
    </div>
  </div>

  <!-- FAQ 2 -->
  <div class="faq-item" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question" style="
    border-bottom: 1px solid #eee;
    padding: 1.5em 0;
  ">
    <h3 itemprop="name" style="font-size: 1.3em; color: #ff6b35; margin-bottom: 0.8em;">
      Kas pakute tasuta 3D visualiseerimist?
    </h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <div itemprop="text" style="color: #444; line-height: 1.6;">
        <p><strong>Jah!</strong> Iga projekti jaoks teeme tasuta fotorealistliku 3D visualiseeringu, et näeksite täpselt, kuidas teie köök välja hakkab nägema enne tootmise alustamist. Saate näha materjale, värve, furnituuri ja ruumi paigutust detailselt.</p>
      </div>
    </div>
  </div>

  <!-- FAQ 3 -->
  <div class="faq-item" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question" style="
    border-bottom: 1px solid #eee;
    padding: 1.5em 0;
  ">
    <h3 itemprop="name" style="font-size: 1.3em; color: #ff6b35; margin-bottom: 0.8em;">
      Millised on köögimööbli hinnad?
    </h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <div itemprop="text" style="color: #444; line-height: 1.6;">
        <p>Köögimööbli hind algab <strong>800 €/jooksev meeter</strong> ja sõltub valitud materjalidest, Austria kvaliteetfurnituurist (Blum, Hettich) ja projekti keerukusest. Tellides tasuta hinnapakkumise saate täpse pakkumise 24 tunni jooksul koos 3D visualiseerimisega.</p>
      </div>
    </div>
  </div>

  <!-- FAQ 4 -->
  <div class="faq-item" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question" style="
    border-bottom: 1px solid #eee;
    padding: 1.5em 0;
  ">
    <h3 itemprop="name" style="font-size: 1.3em; color: #ff6b35; margin-bottom: 0.8em;">
      Kust teie materjalid pärinevad?
    </h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <div itemprop="text" style="color: #444; line-height: 1.6;">
        <p>Kasutame ainult <strong>Austria ja Saksamaa tippkvaliteedi materjale</strong>: töötasapinnad Egger ja Fundermax (Austria), furnituur Blum ja Hettich (Austria), korpusplaadid Egger. Kõik materjalid on PEFC/FSC sertifitseeritud ja vastupidavad Põhjamaade kliimale.</p>
      </div>
    </div>
  </div>

  <!-- FAQ 5 -->
  <div class="faq-item" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question" style="
    border-bottom: 1px solid #eee;
    padding: 1.5em 0;
  ">
    <h3 itemprop="name" style="font-size: 1.3em; color: #ff6b35; margin-bottom: 0.8em;">
      Kas pakute garantiid?
    </h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <div itemprop="text" style="color: #444; line-height: 1.6;">
        <p>Jah, kõikidele toodetele anname <strong>5-aastase garantii</strong>. HPL töötasapindadel on tootja 10-aastane garantii, Austria furnituuril kuni 20-aastane garantii. Paigaldame ise ja vastutame kvaliteedi eest täielikult.</p>
      </div>
    </div>
  </div>

  <!-- FAQ 6 -->
  <div class="faq-item" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question" style="
    padding: 1.5em 0;
  ">
    <h3 itemprop="name" style="font-size: 1.3em; color: #ff6b35; margin-bottom: 0.8em;">
      Kus te asute ja kas saab tulla vaatama näidiseid?
    </h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <div itemprop="text" style="color: #444; line-height: 1.6;">
        <p>Asume <strong>Tallinnas aadressil Pärnu mnt 139c</strong>. Külastus palume eelnevalt kokku leppida telefonil <strong>+372 55 525 143</strong> või e-posti teel <strong>info@studiokook.ee</strong>. Meil on näidised kõikidest materjalidest, töötasapindadest ja furnituurist.</p>
      </div>
    </div>
  </div>

  <!-- CTA at end of FAQ -->
  <div style="text-align: center; margin-top: 2em; padding-top: 2em; border-top: 2px solid #ff6b35;">
    <h3 style="font-size: 1.5em; margin-bottom: 1em;">Veel küsimusi?</h3>
    <a href="/kontakt/" class="button" style="
      background: #ff6b35;
      color: white;
      padding: 1em 2em;
      border-radius: 6px;
      text-decoration: none;
      display: inline-block;
      font-weight: 600;
    ">
      Võta Meiega Ühendust
    </a>
  </div>
</section>
```

**Note:** See full FAQ texts in `FAQ_CONTENT_READY.md` for all 4 languages

---

### 2.2 HPL Page FAQ (6 questions)

```html
<section class="faq-section" itemscope itemtype="https://schema.org/FAQPage" style="max-width: 900px; margin: 3em auto; padding: 2em;">
  <h2 style="font-size: 2em; margin-bottom: 1.5em; text-align: center;">
    Korduma Kippuvad Küsimused HPL Kohta
  </h2>

  <div class="faq-item" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question" style="border-bottom: 1px solid #eee; padding: 1.5em 0;">
    <h3 itemprop="name" style="font-size: 1.3em; color: #ff6b35; margin-bottom: 0.8em;">
      Mis on HPL kompaktlaminaat?
    </h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <div itemprop="text" style="color: #444; line-height: 1.6;">
        <p><strong>HPL (High Pressure Laminate)</strong> on kõrgsurvekrattimisega valmistatud töötasapind, kus mitu kiudplaadikihti on pressitud koos 150°C juures ja 7 MPa surve all. Tulemuseks on ülimalt tihe, vastupidav ja niiskuskindel materjal, mis sobib ideaalselt köögi töötasapinnaks.</p>
      </div>
    </div>
  </div>

  <div class="faq-item" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question" style="border-bottom: 1px solid #eee; padding: 1.5em 0;">
    <h3 itemprop="name" style="font-size: 1.3em; color: #ff6b35; margin-bottom: 0.8em;">
      Kui vastupidav on HPL võrreldes laminaadiga?
    </h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <div itemprop="text" style="color: #444; line-height: 1.6;">
        <p>HPL on <strong>oluliselt vastupidavam</strong> kui tavaline laminaat:</p>
        <ul>
          <li>✓ <strong>Kraapimiskindel</strong> (kõvadus 6-7 Mohsi skaalal)</li>
          <li>✓ <strong>Niiskuskindel</strong> (ei puitu ega deformeeru)</li>
          <li>✓ <strong>Kuumakindel</strong> (talub kuni 180°C)</li>
          <li>✓ <strong>Bakterivastane</strong> (hügieeniline pind)</li>
          <li>✓ <strong>Värvi püsiv</strong> (UV-kindel, ei kahvatu)</li>
        </ul>
      </div>
    </div>
  </div>

  <div class="faq-item" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question" style="border-bottom: 1px solid #eee; padding: 1.5em 0;">
    <h3 itemprop="name" style="font-size: 1.3em; color: #ff6b35; margin-bottom: 0.8em;">
      Milliseid HPL brände te pakute?
    </h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <div itemprop="text" style="color: #444; line-height: 1.6;">
        <p>Pakume kahte Euroopa tippbrändi:</p>
        <ul>
          <li><strong>Egger (Austria)</strong> - 11 dekoori, reaalsed puidumustrid</li>
          <li><strong>Fundermax (Austria)</strong> - 16 dekoori, ühtlased värvid ja struktureeritud pinnad</li>
        </ul>
        <p>Kokku <strong>27 erinevat dekoori</strong>, millest valida.</p>
      </div>
    </div>
  </div>

  <!-- Continue with remaining 3 HPL FAQs from FAQ_CONTENT_READY.md -->
  <!-- ... -->

</section>
```

**Full FAQ texts:** See `FAQ_CONTENT_READY.md` Section 2

---

## Section 3: JSON-LD Structured Data

### 3.1 FAQPage Schema (for all FAQ sections)

**Add this AFTER the FAQ HTML section on each page:**

**Homepage FAQPage Schema:**

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Kui kaua võtab köök valmistamine?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Standardne köök valmib 3-4 nädala jooksul pärast projekti kinnitamist. See hõlmab tasuta 3D visualiseerimist, tootmist ja professionaalset paigaldust. Kiirem teostus on võimalik kokkuleppel. Komplekssemad projektid võivad võtta 5-6 nädalat."
      }
    },
    {
      "@type": "Question",
      "name": "Kas pakute tasuta 3D visualiseerimist?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Jah! Iga projekti jaoks teeme tasuta fotorealistliku 3D visualiseeringu, et näeksite täpselt, kuidas teie köök välja hakkab nägema enne tootmise alustamist. Saate näha materjale, värve, furnituuri ja ruumi paigutust detailselt."
      }
    },
    {
      "@type": "Question",
      "name": "Millised on köögimööbli hinnad?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Köögimööbli hind algab 800 €/jooksev meeter ja sõltub valitud materjalidest, Austria kvaliteetfurnituurist (Blum, Hettich) ja projekti keerukusest. Tellides tasuta hinnapakkumise saate täpse pakkumise 24 tunni jooksul koos 3D visualiseerimisega."
      }
    },
    {
      "@type": "Question",
      "name": "Kust teie materjalid pärinevad?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Kasutame ainult Austria ja Saksamaa tippkvaliteedi materjale: töötasapinnad Egger ja Fundermax (Austria), furnituur Blum ja Hettich (Austria), korpusplaadid Egger. Kõik materjalid on PEFC/FSC sertifitseeritud ja vastupidavad Põhjamaade kliimale."
      }
    },
    {
      "@type": "Question",
      "name": "Kas pakute garantiid?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Jah, kõikidele toodetele anname 5-aastase garantii. HPL töötasapindadel on tootja 10-aastane garantii, Austria furnituuril kuni 20-aastane garantii. Paigaldame ise ja vastutame kvaliteedi eest täielikult."
      }
    },
    {
      "@type": "Question",
      "name": "Kus te asute ja kas saab tulla vaatama näidiseid?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Asume Tallinnas aadressil Pärnu mnt 139c. Külastus palume eelnevalt kokku leppida telefonil +372 55 525 143 või e-posti teel info@studiokook.ee. Meil on näidised kõikidest materjalidest, töötasapindadest ja furnituurist."
      }
    }
  ]
}
</script>
```

---

### 3.2 Product Schema (HPL Page)

**Add in <head> section or before </body> tag:**

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "@id": "https://studiokook.ee/hpl-tootasapinnad/#product",
  "name": "HPL Kompaktlaminaat Töötasapinnad",
  "description": "Kõrgsurvekrattimisega töötasapinnad Egger ja Fundermax. Kraapimiskindel, niiskuskindel, vastupidav. 27 dekoori valida.",
  "brand": [
    {
      "@type": "Brand",
      "name": "Egger"
    },
    {
      "@type": "Brand",
      "name": "Fundermax"
    }
  ],
  "category": "Kitchen Countertops",
  "material": "High Pressure Laminate (HPL)",
  "offers": {
    "@type": "AggregateOffer",
    "priceCurrency": "EUR",
    "lowPrice": "150",
    "highPrice": "250",
    "priceSpecification": {
      "@type": "UnitPriceSpecification",
      "price": "150-250",
      "priceCurrency": "EUR",
      "unitText": "m²"
    },
    "availability": "https://schema.org/InStock",
    "url": "https://studiokook.ee/hpl-tootasapinnad/",
    "seller": {
      "@type": "Organization",
      "name": "Studioköök"
    }
  },
  "additionalProperty": [
    {
      "@type": "PropertyValue",
      "name": "Paksus",
      "value": "12 mm"
    },
    {
      "@type": "PropertyValue",
      "name": "Maksimum suurus",
      "value": "4200 x 1300 mm"
    },
    {
      "@type": "PropertyValue",
      "name": "Garantii",
      "value": "10 aastat (tootja)"
    },
    {
      "@type": "PropertyValue",
      "name": "Dekoori valik",
      "value": "27 (11 Egger + 16 Fundermax)"
    },
    {
      "@type": "PropertyValue",
      "name": "Päritolumaa",
      "value": "Austria"
    }
  ],
  "image": [
    "https://studiokook.ee/wp-content/gallery/egger/F206_ST9.jpg",
    "https://studiokook.ee/wp-content/gallery/egger/F221_ST87.jpg",
    "https://studiokook.ee/wp-content/gallery/fundermax/0075.jpg",
    "https://studiokook.ee/wp-content/gallery/fundermax/0693.jpg"
  ],
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "47",
    "bestRating": "5",
    "worstRating": "1"
  }
}
</script>
```

**Note:** Replace aggregateRating with actual review data if available, or remove if no reviews yet.

---

### 3.3 Product Schema (Laminate Page - post_id: 2943)

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "@id": "https://studiokook.ee/laminaadist-tootasapinnad/#product",
  "name": "Laminaadist Töötasapinnad Egger",
  "description": "Majanduslik ja mitmekülgne laminaat töötasapind Egger. Lai valik dekoore, lihtne hooldus.",
  "brand": {
    "@type": "Brand",
    "name": "Egger"
  },
  "category": "Kitchen Countertops",
  "material": "Laminate",
  "offers": {
    "@type": "AggregateOffer",
    "priceCurrency": "EUR",
    "lowPrice": "80",
    "highPrice": "150",
    "priceSpecification": {
      "@type": "UnitPriceSpecification",
      "price": "80-150",
      "priceCurrency": "EUR",
      "unitText": "m²"
    },
    "availability": "https://schema.org/InStock",
    "url": "https://studiokook.ee/laminaadist-tootasapinnad/",
    "seller": {
      "@type": "Organization",
      "name": "Studioköök"
    }
  },
  "additionalProperty": [
    {
      "@type": "PropertyValue",
      "name": "Paksus",
      "value": "38 mm (korpus + laminaat)"
    },
    {
      "@type": "PropertyValue",
      "name": "Garantii",
      "value": "5 aastat"
    },
    {
      "@type": "PropertyValue",
      "name": "Päritolumaa",
      "value": "Austria"
    }
  ]
}
</script>
```

---

### 3.4 Product Schema (Stone Page - post_id: 2951)

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "@id": "https://studiokook.ee/kividest-tootasapinnad/#product",
  "name": "Kivitöötasapinnad",
  "description": "Prestiižne kivitöötasapind: graniit, kvarts, marmor. Unikaalne muster, väga kõva, pikaealisus.",
  "category": "Kitchen Countertops",
  "material": ["Granite", "Quartz", "Marble"],
  "offers": {
    "@type": "AggregateOffer",
    "priceCurrency": "EUR",
    "lowPrice": "300",
    "highPrice": "500",
    "priceSpecification": {
      "@type": "UnitPriceSpecification",
      "price": "300-500",
      "priceCurrency": "EUR",
      "unitText": "m²"
    },
    "availability": "https://schema.org/InStock",
    "url": "https://studiokook.ee/kividest-tootasapinnad/",
    "seller": {
      "@type": "Organization",
      "name": "Studioköök"
    }
  },
  "additionalProperty": [
    {
      "@type": "PropertyValue",
      "name": "Paksus",
      "value": "20-30 mm"
    },
    {
      "@type": "PropertyValue",
      "name": "Garantii",
      "value": "Eluaegne (looduslikus kasutuses)"
    },
    {
      "@type": "PropertyValue",
      "name": "Kuumakindlus",
      "value": "Kuni 300°C"
    }
  ]
}
</script>
```

---

### 3.5 Product Schema (Fenix Page - post_id: 5804)

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "@id": "https://studiokook.ee/fenix/#product",
  "name": "Fenix NTM Fassaadid",
  "description": "Premium matt nanotehnoloogia pind Fenix NTM. Termoparanduv, sõrmejäljevaba, antibakterialne.",
  "brand": {
    "@type": "Brand",
    "name": "Fenix NTM"
  },
  "category": "Kitchen Facades",
  "material": "Nanotechnology laminate (Fenix NTM)",
  "offers": {
    "@type": "AggregateOffer",
    "priceCurrency": "EUR",
    "lowPrice": "200",
    "highPrice": "350",
    "priceSpecification": {
      "@type": "UnitPriceSpecification",
      "price": "200-350",
      "priceCurrency": "EUR",
      "unitText": "m²"
    },
    "availability": "https://schema.org/InStock",
    "url": "https://studiokook.ee/fenix/",
    "seller": {
      "@type": "Organization",
      "name": "Studioköök"
    }
  },
  "additionalProperty": [
    {
      "@type": "PropertyValue",
      "name": "Eripära",
      "value": "Termoparanduv (kriimud parandatakse triikrauaga)"
    },
    {
      "@type": "PropertyValue",
      "name": "Pind",
      "value": "Matt, sõrmejäljevaba"
    },
    {
      "@type": "PropertyValue",
      "name": "Päritolumaa",
      "value": "Itaalia"
    }
  ]
}
</script>
```

---

## Section 4: Hreflang Implementation

### Method 1: TranslatePress Settings (Recommended)

1. Log in to WordPress admin
2. Go to **Settings → TranslatePress**
3. Find **"SEO" or "Advanced" tab**
4. Enable **"Add hreflang tags"** option
5. Save settings
6. Verify by viewing page source (Ctrl+U) - should see:

```html
<link rel="alternate" hreflang="et" href="https://studiokook.ee/" />
<link rel="alternate" hreflang="ru" href="https://studiokook.ee/ru/" />
<link rel="alternate" hreflang="en-GB" href="https://studiokook.ee/en/" />
<link rel="alternate" hreflang="fi" href="https://studiokook.ee/fi/" />
<link rel="alternate" hreflang="x-default" href="https://studiokook.ee/" />
```

---

### Method 2: Manual via functions.php (if TranslatePress doesn't support)

**Add to theme's functions.php:**

```php
<?php
/**
 * Add hreflang tags for multilingual SEO
 */
function studiokook_add_hreflang_tags() {
    // Get current URL
    $current_url = home_url($_SERVER['REQUEST_URI']);

    // Define language URLs
    $languages = array(
        'et' => str_replace(array('/ru/', '/en/', '/fi/'), '/', $current_url),
        'ru' => str_replace(array('/en/', '/fi/'), '/ru/', $current_url),
        'en-GB' => str_replace(array('/ru/', '/fi/'), '/en/', $current_url),
        'fi' => str_replace(array('/ru/', '/en/'), '/fi/', $current_url),
    );

    // Output hreflang tags
    foreach ($languages as $lang => $url) {
        echo '<link rel="alternate" hreflang="' . esc_attr($lang) . '" href="' . esc_url($url) . '" />' . "\n";
    }

    // x-default (Estonian)
    echo '<link rel="alternate" hreflang="x-default" href="' . esc_url($languages['et']) . '" />' . "\n";
}
add_action('wp_head', 'studiokook_add_hreflang_tags', 1);
?>
```

---

## Section 5: Testing & Validation

### 5.1 Google Rich Results Test

**Test all schemas:**
1. Go to: https://search.google.com/test/rich-results
2. Enter URL (e.g., https://studiokook.ee/hpl-tootasapinnad/)
3. Click "Test URL"
4. Check for:
   - ✅ Valid Product schema
   - ✅ Valid FAQPage schema
   - ❌ No errors or warnings

**Repeat for:**
- Homepage (FAQPage only)
- HPL page (Product + FAQPage)
- Laminate page (Product + FAQPage)
- Stone page (Product + FAQPage)
- Fenix page (Product + FAQPage)
- Materials page (FAQPage only)
- Custom Kitchen page (FAQPage only)
- Contact page (FAQPage only)

---

### 5.2 Schema.org Validator

**Alternative validator:**
1. Go to: https://validator.schema.org/
2. Paste JSON-LD code directly OR enter URL
3. Check for syntax errors
4. Fix any warnings

---

### 5.3 Hreflang Validation

**Check hreflang tags:**
1. View page source (Ctrl+U or right-click → View Page Source)
2. Search for "hreflang" (Ctrl+F)
3. Should see 5 hreflang tags per page (et, ru, en, fi, x-default)
4. Verify URLs are correct

**Or use tool:**
- https://www.aleydasolis.com/english/international-seo-tools/hreflang-tags-generator/

---

### 5.4 Google Search Console Checks

**After 1 week:**
1. Go to Google Search Console
2. Check **Index → Pages** - verify all 4 language versions indexed
3. Check **Enhancements → FAQs** - should show FAQ-enabled pages
4. Check **Enhancements → Products** - should show Product schemas
5. Monitor **International Targeting → Language** - verify hreflang errors (should be 0)

---

## Section 6: Quick Reference

### File Locations

| File | Purpose | Location |
|------|---------|----------|
| FAQ_CONTENT_READY.md | All 30 FAQ texts (4 languages) | C:\Users\sorte\Desktop\Studiokook\scripts\ |
| UPDATE_META_DESCRIPTIONS.sql | SQL for meta tags | C:\Users\sorte\Desktop\Studiokook\scripts\ |
| SEO_AUDIT_REPORT_2026.md | Full audit report | C:\Users\sorte\Desktop\Studiokook\ |
| IMPLEMENTATION_PACKAGE.md | This file | C:\Users\sorte\Desktop\Studiokook\ |

---

### Post IDs Reference

| Page | Post ID | Post Name |
|------|---------|-----------|
| Egger Facades | 6309 | egger-fassaadid |
| Facades | 5800 | fassaadid |
| Fenix | 5804 | fenix |
| Quote Request | 25 | hinnaparing |
| HPL | 6335 | hpl-tootasapinnad |
| Stone | 2951 | kividest-tootasapinnad |
| Contact | 2465 | kontakt |
| Custom Kitchens | 3133 | koogid-eritellimusel |
| Laminate | 2943 | laminaadist-tootasapinnad |
| Materials | 2530 | materjalid |

---

### Priority Matrix

| Task | Time | Priority | Impact |
|------|------|----------|--------|
| Execute meta SQL | 5 min | 🔴 Critical | High |
| Add H1 tags (5 pages) | 20 min | 🔴 Critical | High |
| Update CTA buttons | 10 min | 🔴 Critical | High |
| Enable hreflang | 5 min | 🔴 Critical | High |
| Add trust signals | 15 min | 🟠 High | High |
| Add FAQ HTML (homepage) | 30 min | 🟠 High | Very High |
| Add FAQ HTML (4 more pages) | 2 hours | 🟠 High | Very High |
| Add FAQPage schemas (5 pages) | 30 min | 🟠 High | Very High |
| Add Product schemas (4 pages) | 20 min | 🟡 Medium | High |
| Test all schemas | 30 min | 🟡 Medium | Medium |

**Total estimated time:** 4-5 hours

---

## Section 7: Troubleshooting

### FAQ не отображается?
- Check if HTML was added to page content (not draft)
- Clear WordPress cache (if using caching plugin)
- Clear browser cache (Ctrl+Shift+Delete)
- Check page in Incognito mode

### Schema validation errors?
- Copy exact JSON-LD from this file (don't modify manually)
- Validate at https://validator.schema.org/ first
- Check for missing commas, brackets
- Ensure double quotes (not single quotes)

### Hreflang tags not appearing?
- Check if TranslatePress "Add hreflang" is enabled
- View page source (Ctrl+U) - search for "hreflang"
- If missing, use Method 2 (functions.php)

### Meta descriptions not showing in Google?
- Wait 1-2 weeks for Google to recrawl
- Request re-indexing in Google Search Console
- Verify SQL executed successfully (check phpMyAdmin query results)

---

## Questions?

Если что-то непонятно:
1. Прочитай SEO_AUDIT_REPORT_2026.md (там подробные объяснения)
2. Посмотри примеры в FAQ_CONTENT_READY.md
3. Спроси меня — объясню

**Я готов помочь с:**
- Редактированием текстов FAQ (если нужны изменения)
- Проверкой переводов (особенно финский — нужна проверка носителя)
- Созданием дополнительных схем
- Troubleshooting при внедрении

Когда будешь готов начать — дай знать, помогу пошагово!
