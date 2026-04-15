# Global Skills Registry

Updated: 2026-04-15

## Core (~/.claude/skills/)

| Skill | Priority | Status | Description |
|-------|----------|--------|-------------|
| assistant | P1 | ACTIVE | Cross-project coordinator, priority routing |
| post-mortem | P3 | ACTIVE | Session error analysis, knowledge routing (Stop hook) |
| n8n-expert | P2 | ACTIVE | n8n workflows, nodes, expressions, validation, debug |
| output-critic | P2 | ACTIVE | Universal output quality gate — auto-critic after generation tasks |
| obsidian-router | P2 | ACTIVE | Routes vault ops between QMD (search) and Nexus/REST API (CRUD) |
| strategic-critique | P2 | ACTIVE | Self-critique loop for strategic tasks (plans, SEO, architecture, content) |
| legal | P2 | ACTIVE | Legal router: research (find law/case law), review (contract analysis), draft (clauses/letters) |
| direct-response-copy | P2 | ACTIVE | Marketing/sales copy — landing pages, headlines, CTAs, emails; classical frameworks (Schwartz, Hopkins, Ogilvy) + modern techniques |

## Agents (~/.claude/agents/)

| Agent | Priority | Status | Description |
|-------|----------|--------|-------------|
| researcher | P2 | ACTIVE | Codebase exploration (Haiku, read-only) |
| translator | P2 | ACTIVE | TranslatePress translations (Sonnet) |
| wp-auditor | P2 | ACTIVE | WordPress diagnostics, read-only (Sonnet) |
| wp-specialist | P1 | ACTIVE | WordPress REST API modifications (Sonnet) |
| librarian | P2 | ACTIVE | Vault librarian — distillation, routing review, maintenance (Sonnet) |

## Studiokook (~/Desktop/Studiokook/.claude/skills/)

| Skill | Priority | Status | Description |
|-------|----------|--------|-------------|
| wordpress | P1 | ACTIVE | Main WP skill — pages, plugins, Code Snippets, sk/v1 API |
| wp-problem-solver | P1 | ACTIVE | 5 Whys + safe edit + cache clear + rollback |
| wp-deploy-verify | P1 | ACTIVE | Post-deployment verification |
| wp-elementor | P1 | ACTIVE | Elementor REST API content editing |
| wp-translatepress | P2 | ACTIVE | TranslatePress multilingual (ET/RU/EN/FI) |
| seo-aeo | P2 | ACTIVE | SEO/AEO optimization, EEAT, structured data |

## AiGeneration (~/Desktop/AiGeneration/.claude/skills/)

| Skill | Priority | Status | Description |
|-------|----------|--------|-------------|
| content-creator | P2 | ACTIVE | YouTube/Telegram content strategy + templates |
| smm-context | P2 | ACTIVE | Social media accounts + integrations |
| visual-style | P2 | ACTIVE | Studiokook visual DNA + AI prompt rules |
| kling-prompt-engineer | P2 | ACTIVE | Kling AI video prompt methodology |

## Trigger Overlaps (конфликтные зоны)

Проверяй при добавлении/правке skill. При совпадении — приоритет по specificity (первый матч).

| Ambiguous trigger | Skills матча | Правило выбора |
|-------------------|--------------|----------------|
| "review" | assistant, output-critic, post-mortem | "review" один → output-critic; "review проектов" → assistant; "review сессии/ошибок" → post-mortem |
| "критика" / "critique" | output-critic, strategic-critique | strategic-critique только для: стратегия/архитектура/контент-план. Иначе output-critic |
| "стратегия" / "strategy" | strategic-critique, assistant | assistant для: статус/приоритеты. strategic-critique для: критика плана/архитектуры |
| "автоматизация" | n8n-expert, update-config | n8n-expert для workflow-движка. update-config для hooks/behaviors |
| "найди" / "поиск" | obsidian-router, legal | legal триггеры (закон/договор/VÕS) имеют приоритет. Иначе obsidian-router |
| "copy" / "написать текст" | direct-response-copy, content-creator | direct-response-copy для: landing/CTA/email/sales. content-creator для: YouTube/Telegram серий |
| "помнишь" / "last session" | auto-search hook, ghost | обрабатывается auto-search worker (deep mode), не skill |

**При росте skills >15** — пересмотреть матрицу, искать "мёртвые" триггеры (покрываются двумя skills одинаково).

## Lifecycle

```
ACTIVE → [1 month unused] → REVIEW → [keep/delete] → ACTIVE or DELETE
```

P4 skills = first candidates for review.
