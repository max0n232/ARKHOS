# Global Skills Registry

Updated: 2026-05-03

## Core (~/.claude/skills/)

| Skill | Priority | Status | Description |
|-------|----------|--------|-------------|
| assistant | P1 | ACTIVE | Cross-project coordinator, priority routing |
| post-mortem | P3 | ACTIVE | Session error analysis, knowledge routing (Stop hook) |
| n8n-expert | P2 | ACTIVE | n8n workflows, nodes, expressions, validation, debug |
| output-critic | P2 | ACTIVE | Universal output quality gate — auto-critic after generation tasks |
| obsidian-router | P2 | ACTIVE | Routes vault ops between QMD (search) and Nexus/REST API (CRUD) |
| strategic-critique | P2 | ACTIVE | Self-critique loop for strategic tasks (plans, SEO, architecture, content) |

## Agents (~/.claude/agents/)

| Agent | Priority | Status | Description |
|-------|----------|--------|-------------|
| researcher | P2 | ACTIVE | Codebase exploration (Haiku, read-only) |
| translator | P2 | ACTIVE | TranslatePress translations (Sonnet) |
| wp-auditor | P2 | ACTIVE | WordPress diagnostics, read-only (Sonnet) |
| wp-specialist | P1 | ACTIVE | WordPress REST API modifications (Sonnet) |
| librarian | P2 | ACTIVE | Vault librarian — distillation, routing review, maintenance (Sonnet) |
| sketchup-easykitchen-specialist | P1 | ACTIVE | EasyKitchen DC tuning + L/U/I-shape kitchen composition (Sonnet) |
| codex-second-opinion | P2 | ACTIVE | Cross-check via OpenAI Codex CLI (GPT-5) — independent review (Sonnet) |
| gemini-mega-context | P2 | ACTIVE | Large-context delegate (2M ctx, Gemini 2.5 Pro) — repo audit, transcripts (Sonnet) |
| gemini-multimodal | P2 | ACTIVE | Native multimodal — image/video/audio analysis via Gemini (Sonnet) |
| gemini-utility | P3 | ACTIVE | Routine cost-saving delegate — Flash translations, parsing, formatting (Sonnet) |

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
| "найди" / "поиск" | obsidian-router | используется для vault-операций |
| "помнишь" / "last session" | auto-search hook, ghost | обрабатывается auto-search worker (deep mode), не skill |
| "second opinion" / "cross-check" | codex-second-opinion | независимая проверка через GPT-5 Codex |
| "проанализируй всю кодовую базу" / "большой контекст" | gemini-mega-context | 2M ctx делегат |
| "переведи" / "tõlgi" / "format JSON" | gemini-utility | routine Flash-делегат |

**При росте skills >15** — пересмотреть матрицу, искать "мёртвые" триггеры (покрываются двумя skills одинаково).

## Lifecycle

```
ACTIVE → [1 month unused] → REVIEW → [keep/delete] → ACTIVE or DELETE
```

P4 skills = first candidates for review.
