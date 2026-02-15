# Studiokook

Кухонный бизнес, Tallinn, Estonia. WordPress: studiokook.ee

## Structure

```
Studiokook/
├── credentials/            ← API ключи (НЕ в git)
├── knowledge/              ← SQLite DB, schemas
├── n8n/                    ← Workflows (dev → prod → VPS)
├── skills/                 ← wp-*, seo-*
├── code-snippets/          ← PHP сниппеты для WP
├── deploy/                 ← Скрипты деплоя
├── docs/                   ← Документация, аудиты, планы
├── translations/           ← Переводы страниц
├── .claude/                ← Agents, hooks, memory
└── archive/                ← Старые файлы
```

## Credentials

Все в `credentials/` (.gitignore). Deploy-скрипты читают `wp-auth.env`.
Файлы: `wp-auth.env`, `n8n-api.env`, `meta-api.env`, `kieai-api.env`, `pinterest-api.env`, `google_*.json`, `zone_ee.json`

## Integrations

- **WP REST:** `curl -u "$WP_USER:$WP_APP_PASS" "studiokook.ee/wp-json/..."`
- **Custom API (sk/v1):** Elementor, TranslatePress, Deploy API, кэш — см. @docs/api-reference.md
- **n8n:** `https://n8n.studiokook.ee` (header `X-N8N-API-KEY`)
- **Meta:** FB Page `108709097229809`, IG `17841461511497185` (@_studiokook)
- **GSC:** `sc-domain:studiokook.ee` | **GA4:** `properties/441276059`

## Critical Rules

1. **NEVER** `wp_update_post()` — crashes site. Use `$wpdb->update()`
2. **PHP на сервер:** ТОЛЬКО через Deploy API (`/sk/v1/deploy-file`). Code Snippets REST API сломан (создаёт пустые записи)
3. **mu-plugin:** `studiokook-seo.php` = robots.txt + schemas + Deploy API. Обновлять через Deploy API
4. **Deploy-скрипты:** `deploy/` — Node.js, юзер запускает на своей машине (sandbox блокирует outbound)
5. **Credentials:** только по имени переменной, NEVER hardcode
6. **WP code changes:** сначала `/wp-problem-solver`
7. **TranslatePress:** см. `skills/wp-translatepress/SKILL.md`

## Languages

ET (primary), RU `/ru/`, EN `/en/`, FI `/fi/`

## Quick Actions

| Action | Skill |
|--------|-------|
| WP code changes | /wp-problem-solver |
| Elementor | skills/wp-elementor/SKILL.md |
| SEO/AEO audit | skills/seo-aeo/SKILL.md |
| SMM strategy | skills/seo-smm/SKILL.md |
| Translations | skills/wp-translatepress/SKILL.md |
| WP REST/Router | skills/wordpress-router/SKILL.md |

## SMM Funnel — Phase 1 (2026-02-15)

- n8n: Content Generator + Pinterest Pinner — imported, NOT activated
- mu-plugin: robots.txt (AI crawlers) + FAQPage/HowTo/Service/BreadcrumbList schemas + Deploy API
- TODO: credentials в n8n, Pinterest OAuth, тест → активация

## Style

RU primary, EN tech terms. Concise. No TODOs in code.
