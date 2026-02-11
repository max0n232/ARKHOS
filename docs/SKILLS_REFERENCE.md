# Skills Quick Reference

Все skills загружены в `~/.claude/skills/`

## Core Skills (собственные)

| Skill | Команда | Описание |
|-------|---------|----------|
| **SEO & SMM** | `/seo-smm` | SEO, Instagram, реклама, CRO, контент для Studiokook |
| **Trading** | `/trading` | Risk management, trade journal analysis |
| **Legal** | `/legal` | Estonian law, OÜ/FIE, contracts, GDPR |
| **Content Creator** | `/content-creator` | YouTube scripts, Telegram channel strategy |
| **Assistant** | `/assistant` | Task management, planning, productivity |
| **Knowledge** | `/knowledge` | DAL integration, auto-save decisions/logs/snippets |
| **External** | `/external` | Telegram Bot, n8n webhooks, integrations |
| **n8n** | `/n8n` | n8n MCP tools, workflow automation |

## Marketing Skills (`skills/marketing/`)

Источник: [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills)

| Skill | Файл | Применение для Studiokook |
|-------|------|---------------------------|
| SEO Audit | `seo-audit.md` | Аудит studiokook.ee |
| Schema Markup | `schema-markup.md` | Product, LocalBusiness, FAQ |
| Programmatic SEO | `programmatic-seo.md` | Лендинги по городам/продуктам |
| Social Content | `social-content.md` | Instagram/LinkedIn посты |
| Copywriting | `copywriting.md` | Тексты для сайта и рекламы |
| Copy Editing | `copy-editing.md` | Редактура существующего |
| Email Sequence | `email-sequence.md` | Drip-кампании |
| Paid Ads | `paid-ads.md` | Google/Meta/LinkedIn реклама |
| Content Strategy | `content-strategy.md` | Контент-план |
| Analytics Tracking | `analytics-tracking.md` | GA4, UTM, события |
| A/B Test Setup | `ab-test-setup.md` | Тестирование вариантов |
| Page CRO | `page-cro.md` | Конверсия страниц |
| Form CRO | `form-cro.md` | Конверсия форм |
| Popup CRO | `popup-cro.md` | Exit-intent, баннеры |
| Competitor Alternatives | `competitor-alternatives.md` | Страницы сравнения |
| Marketing Ideas | `marketing-ideas.md` | 140+ идей |
| Marketing Psychology | `marketing-psychology.md` | Поведенческие триггеры |
| Launch Strategy | `launch-strategy.md` | Запуск коллекций |
| Pricing Strategy | `pricing-strategy.md` | Ценообразование |
| Referral Program | `referral-program.md` | Реферальная программа |
| Free Tool Strategy | `free-tool-strategy.md` | Калькулятор кухни |

## SEO-AEO Skills (`skills/seo-aeo/`)

Источник: [sanity-io/agent-toolkit](https://github.com/sanity-io/agent-toolkit)

- Answer Engine Optimization (Perplexity, ChatGPT)
- Metadata/Open Graph
- JSON-LD structured data
- EEAT principles

## Visual Content Skills (`skills/fal-ai/`)

Источник: [fal-ai-community/skills](https://github.com/fal-ai-community/skills)

| Skill | Применение |
|-------|-----------|
| fal-generate | Генерация фото/видео кухонь (FLUX, Veo3) |
| fal-image-edit | Удаление фона, стиль-трансфер |
| fal-upscale | Upscale фото до print quality |
| fal-audio | Озвучка для YouTube |

## n8n Expert Skills (`skills/n8n-expert/`)

Источник: [czlonkowski/n8n-skills](https://github.com/czlonkowski/n8n-skills)

| Skill | Применение |
|-------|-----------|
| n8n-workflow-patterns | 5 проверенных паттернов |
| n8n-mcp-tools-expert | Правильная работа с MCP |
| n8n-expression-syntax | Выражения и переменные |
| n8n-node-configuration | Конфигурация нод |
| n8n-validation-expert | Дебаг ошибок |
| n8n-code-javascript | JS в Code нодах |
| n8n-code-python | Python в Code нодах |

## WordPress Skills (`skills/wp-*/`)

Предустановлены через Claude Code skills marketplace:
- `wordpress-router` — маршрутизация по типу проекта
- `wp-plugin-development` — разработка плагинов
- `wp-performance` — оптимизация производительности
- `wp-rest-api` — REST API endpoints
- `wp-block-themes` — блочные темы

## MCP Integrations

| MCP | Инструменты |
|-----|-------------|
| **WordPress** | Abilities API (ngg-gallery/query, page management) |
| **n8n** | Workflows CRUD, templates, validation, execution |
| **Playwright** | Browser automation, scraping |

## DAL (Data Access Layer)

```python
from data_access_layer import dal

dal.decisions.add(title=..., decision=..., reasoning=...)
dal.logs.add(summary=..., details=..., project="Studiokook")
dal.snippets.add(name=..., code=..., language="python")
dal.errors.add(title=..., solution=..., lesson=...)
dal.decisions.search("query")
```

## Telegram

```bash
python scripts/telegram_notify.py --send "Сообщение"
```

## Инфраструктура Studiokook

```
CLAUDE CODE (/seo-smm)
    │
    ├── WordPress MCP ──→ studiokook.ee
    │     ├── Контент (страницы, галереи)
    │     ├── SEO (Yoast, schema, meta)
    │     └── TranslatePress (ET/RU)
    │
    ├── n8n MCP ──→ Автоматизация
    │     ├── CF7 → Telegram (заявки)
    │     ├── Schedule → Instagram (посты)
    │     ├── Cron → Analytics report
    │     └── Webhook → CRM sync
    │
    ├── fal-ai ──→ Визуал
    │     ├── Генерация фото кухонь
    │     ├── Upscale для сайта
    │     └── Видео для Reels
    │
    └── Telegram Bot ──→ Уведомления
          ├── Заявки
          ├── SEO отчёты
          └── Статус workflows
```
