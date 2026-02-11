# Plan: Studiokook.ee — Audit, Debug & Optimization

## ⚠️ KNOWN ISSUE: Background Agents Failing

**Проблема:** Background Task agents не запускаются (output files не создаются)
**Симптомы:**
- `run_in_background: true` возвращает "launched successfully"
- Но output файлы не существуют
- Агенты молча падают

**Обходное решение:** Выполнять задачи в текущей сессии БЕЗ background mode

**Дата:** 2026-02-10

---

## Overview

Комплексный аудит, дебаг и оптимизация WordPress сайта studiokook.ee с использованием 3 параллельных Agent Teams.

**Сайт:** studiokook.ee (кухонный бизнес, Tallinn)
**Stack:** WordPress + Elementor + TranslatePress (4 языка: ET, RU, EN, FI)
**Текущий SEO Score:** 6.2/10 (аудит от 2026-02-04)

---

## Agent Teams Structure

### 🔍 Team 1: AUDIT Agent
**Фокус:** SEO, контент, структура сайта

**Задачи:**
1. Проверить H1 теги на всех ключевых страницах (5 страниц × 4 языка)
2. Аудит meta descriptions (Yoast SEO)
3. Проверить hreflang tags в `<head>` (не только sitemap)
4. Валидация Schema.org разметки (LocalBusiness, Product, FAQPage)
5. Проверить canonical URLs для мультиязычных версий
6. Собрать данные из GSC за 28 дней

**Инструменты:**
- `skills/seo-aeo/SKILL.md`
- `skills/marketing/skills/seo-audit/SKILL.md`
- Google Search Console API
- REST API `/sk/v1/update-seo`

---

### 🐛 Team 2: DEBUG Agent
**Фокус:** Поиск и исправление проблем

**Критические issues:**
1. **n8n port mismatch:** workflow использует 8100, agents на 8001
2. **Telegram credential:** не настроена в SEO Audit workflow
3. **TranslatePress:** новые SEO strings не переведены
4. **Elementor:** возможные non-breaking spaces (\u00a0) и encoding issues

**Проверки:**
- REST API endpoints доступность (`/sk/v1/*`)
- TranslatePress dictionary status (untranslated strings)
- Seraphinite cache consistency
- NGG galleries image loading

**Инструменты:**
- `skills/wp-problem-solver/SKILL.md`
- `skills/wp-translatepress/SKILL.md`
- `knowledge/snippets-registry.json`
- REST API диагностика

---

### ⚡ Team 3: OPTIMIZATION Agent
**Фокус:** Производительность и скорость

**Текущее состояние:**
- Autoload: 119.68 KB (было 180.57 KB, -33%)
- Phase 1 & 2 завершены
- Phase 3 (lazy loading) готов к активации

**Задачи:**
1. Активировать universal lazy loading (534+ images → ~50-100)
2. Собрать Core Web Vitals baseline (LCP, FID, CLS)
3. Запустить WP-CLI doctor/profile
4. Проверить Query Monitor данные
5. Создать performance monitoring workflow в n8n

**Инструменты:**
- `skills/wp-performance/SKILL.md`
- REST API `/sk/v1/full-clear`
- PageSpeed Insights API
- WP-CLI commands

---

## Execution Plan (REVISED — No Background Agents)

### Phase 1: Sequential Execution in Current Session

**Порядок выполнения:**

1. **DEBUG (первый)** — исправить критические баги
   - [ ] Проверить n8n port mismatch (8100 vs 8001)
   - [ ] Найти credential issues
   - [ ] Проверить TRP untranslated strings

2. **AUDIT (второй)** — SEO проверки
   - [ ] H1 tags на 6 страницах (ET, RU, EN, FI)
   - [ ] Meta descriptions
   - [ ] Hreflang in `<head>`
   - [ ] Schema.org разметка

3. **OPTIMIZATION (третий)** — performance
   - [ ] Собрать CWV baseline через PageSpeed
   - [ ] Проверить готовность Phase 3 lazy loading
   - [ ] Подготовить activation план

### Phase 2: Consolidation

1. Собрать findings
2. Приоритизировать issues (Critical → High → Medium)
3. Создать unified action items

### Phase 3: Implementation

1. Исправить критические проблемы
2. Активировать оптимизации
3. Обновить n8n workflows

### Phase 4: Verification

1. Повторный SEO аудит (target: 8+/10)
2. Performance test (target: LCP <2.5s)
3. Все языковые версии работают

---

## Critical Files

| File | Purpose |
|------|---------|
| `C:\Users\sorte\Desktop\Studiokook\CLAUDE.md` | Project config |
| `C:\Users\sorte\Desktop\Studiokook\SEO_AUDIT_REPORT_2026.md` | Current audit |
| `C:\Users\sorte\Desktop\Studiokook\IMPLEMENTATION_PACKAGE.md` | Ready code |
| `C:\Users\sorte\Desktop\Studiokook\knowledge\snippets-registry.json` | Active snippets |
| `C:\Users\sorte\Desktop\Studiokook\n8n\workflows\seo_audit_weekly.json` | n8n workflow |
| `C:\Users\sorte\Desktop\Studiokook\skills\wp-performance\SKILL.md` | Performance skill |

---

## Credentials Required

- `wp_rest_api.json` — WordPress REST API
- `google_credentials.json` — GSC/GA4 OAuth
- `n8n_webhooks.json` — VPS webhooks

---

## Expected Outcomes

| Metric | Before | Target |
|--------|--------|--------|
| SEO Score | 6.2/10 | 8+/10 |
| LCP | Unknown | <2.5s |
| Autoload | 119 KB | <100 KB |
| Images initial | 534 | <100 |
| Hreflang | Sitemap only | In `<head>` |
| H1 tags | Missing | All pages |

---

## Verification

1. **SEO:** Запустить `/seo-aeo audit` на всех 4 языках
2. **Debug:** Проверить все REST endpoints отвечают 200
3. **Performance:** PageSpeed Insights score >80
4. **n8n:** SEO Audit workflow успешно выполняется
