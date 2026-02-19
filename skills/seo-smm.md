# SEO & SMM Skill

**Роль:** SEO-специалист и SMM-менеджер для Studiokook

## Архитектура

```
/seo-smm (этот skill — точка входа)
├── skills/marketing/     ← 25 тактических skills (SEO audit, CRO, ads, copy)
├── skills/seo-aeo/       ← Answer Engine Optimization (AI поиск)
├── skills/fal-ai/        ← Визуальный контент (генерация, редакция, upscale)
├── skills/n8n-expert/    ← Автоматизация workflows
└── MCP: WordPress, n8n   ← Прямое управление сайтом и workflows
```

## SEO — Studiokook.ee

### Ключевые слова (ET + RU)
- ET: köök, köögimööbel, köögid Tallinnas, köögimööbel Eestis, köögi disain
- RU: кухня таллинн, кухонная мебель эстония, кухни на заказ
- EN: custom kitchen Estonia, kitchen furniture Tallinn

### Технический SEO
- **Audit:** `skills/marketing/seo-audit.md` → мета-теги, заголовки, скорость, ссылки
- **Schema.org:** `skills/marketing/schema-markup.md` → Product, LocalBusiness, FAQ, Review
- **Programmatic SEO:** `skills/marketing/programmatic-seo.md` → массовые лендинги
- **AEO:** `skills/seo-aeo/` → оптимизация для AI-поисковиков (Perplexity, ChatGPT)
- **Core Web Vitals:** wp-performance skill → LCP, FID, CLS

### On-page SEO чеклист
1. Title tag: ключевое слово + город + бренд (≤60 символов)
2. Meta description: CTA + уникальность (≤155 символов)
3. H1: один на страницу, содержит ключевое слово
4. Alt texts: описательные, с ключевыми словами (NGG alttext)
5. Internal links: ≥3 на страницу, анкоры с ключевыми словами
6. Schema.org: JSON-LD в header

### Инструменты
- Yoast SEO (WordPress)
- Google Search Console
- TranslatePress (ET/RU)
- WordPress MCP (прямое управление контентом)

## SMM — Social Media

### Instagram @studiokook.ee
- **Контент:** `skills/marketing/social-content.md`
- **Визуал:** `skills/fal-ai/` (генерация, редакция, upscale фото кухонь)
- **Видео:** Remotion / fal-generate → Reels, Stories
- Хэштеги: 15-20, mix EE/RU/EN
- Posting: 3-4 раза в неделю
- Stories: ежедневно (behind the scenes, процесс)

### Контент-план
- **Пн:** Проект недели (фото + описание)
- **Ср:** Совет/лайфхак (carousel)
- **Пт:** До/После или материал недели
- **Вс:** Stories poll / Q&A

### Форматы постов
```
📸 Проект: [описание]
✅ Материалы: [Egger F-series, Fenix...]
📐 Размеры: [...]
💰 Бюджет: от [X]€
📍 Tallinn

#köök #köögimööbel #köögid #tallinn #köögiideed
#кухня #кухнямечты #кухняназаказ #таллинн
```

## Рекламные кампании

### Paid Ads
- **Google Ads:** `skills/marketing/paid-ads.md`
  - Поисковые: köögimööbel, custom kitchen Tallinn
  - Display: ремаркетинг посетителей сайта
- **Meta Ads:** Instagram + Facebook
  - Radius: 50km от Tallinn
  - Аудитория: homeowners, 28-55, renovation interest
- **A/B тесты:** `skills/marketing/ab-test-setup.md`

### Конкурентный анализ
- `skills/marketing/competitor-alternatives.md` → страницы сравнения
- competitive-ads-extractor → мониторинг рекламы конкурентов

## CRO (Conversion Rate Optimization)

- `skills/marketing/page-cro.md` → оптимизация страниц каталога
- `skills/marketing/form-cro.md` → форма "Küsi pakkumist"
- `skills/marketing/popup-cro.md` → exit-intent, newsletter
- `skills/marketing/signup-flow-cro.md` → воронка от визита до заявки

## Email Marketing

- `skills/marketing/email-sequence.md`
- Welcome sequence (после заявки)
- Post-consultation follow-up
- Seasonal campaigns (весна/осень — ремонт)
- Re-engagement (холодные лиды)

## Copywriting

- `skills/marketing/copywriting.md` → лендинги, главная
- `skills/marketing/copy-editing.md` → редактура существующего
- content-research-writer → блог-посты, гайды по материалам

## Автоматизация (n8n)

Все workflows через `skills/n8n-expert/` + n8n MCP:

| Workflow | Триггер | Действие |
|----------|---------|----------|
| Новая заявка | CF7 webhook | → Telegram + email + CRM |
| Новый пост | Schedule | → Instagram + Facebook + Telegram |
| SEO отчёт | Weekly cron | → Google Analytics → Telegram |
| Фото проекта | Manual | → fal upscale → сайт + Instagram |
| Конкурент мониторинг | Weekly | → ad library → report |

## KPIs

| Метрика | Цель | Источник |
|---------|------|----------|
| Organic traffic | +20% / квартал | Search Console |
| Instagram followers | +100 / месяц | Meta Business |
| Conversion rate (заявки) | >2% | GA4 |
| Branded search | +30% / квартал | Search Console |
| Email open rate | >25% | Email platform |

## Quick Commands

**SEO Audit страницы:**
```
/seo-smm audit [URL]
→ Title, meta, H1-H6, alt texts, links, schema, speed
→ Использует: skills/marketing/seo-audit.md
```

**Instagram пост:**
```
/seo-smm post [тема]
→ Текст + хэштеги + CTA + рекомендация визуала
→ Использует: skills/marketing/social-content.md
```

**Генерация визуала:**
```
/seo-smm visual [описание]
→ Генерация/редакция изображения через fal-ai
→ Использует: skills/fal-ai/
```

**Контент-план на неделю:**
```
/seo-smm plan
→ 4 поста + stories план + email если есть повод
→ Использует: skills/marketing/content-strategy.md
```

**Meta description:**
```
/seo-smm meta [URL] [ET/RU]
→ 155-160 символов, с CTA и ключевыми словами
```
