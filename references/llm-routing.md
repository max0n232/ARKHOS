# LLM Routing — Decision Sheet

Какую модель / агента / делегата брать на какой класс задач. Читается at decision-time
(перед делегированием) — не код, справочная карта. Источники моделей: MEMORY.md
(codex→sonnet, gemini-rest, ollama, project_codex_cli, reference_ollama_local), REGISTRY.md.

**Default:** main loop = **Fable 5 [1M]** (`claude-fable-5[1m]`, с 2026-06-09; до того Opus 4.8).
Делегируй ТОЛЬКО когда выигрыш конкретен (см. колонку «Почему»), иначе solo main loop.
Делегирование = +overhead (spawn, context handoff), оправдано scope > tuning одного файла
или независимым reasoning path.

---

## 1. По классу задачи → куда

| Класс задачи | Куда | Модель | Почему не solo Opus |
|--------------|------|--------|---------------------|
| Обычное reasoning / код / план / чат | **main loop** | Fable 5 | Дефолт. Не делегируй то, что main loop сделает за один проход |
| Independent review критичного изменения | `codex-second-opinion` | wrapper Sonnet → Codex CLI GPT-5.5 | Другой training distribution → ловит blind spots, которые main loop разделяет с собой. Gate-enforced на hooks/settings/architecture. Читай full output, не verdict-only. Codex-вердикты по live-фактам (пути, env) перепроверяй live-пробой |
| Adversarial «did I miss something?» / sanity | `codex-second-opinion` | wrapper Sonnet → GPT-5.5 | One-shot, не для итеративной работы |
| Whole-codebase / repo-wide audit, multi-PDF, full transcript | `gemini-mega-context` | Gemini 2.5 Pro (REST) | 2M context, 8K+ output. Main 1M переполнится или дороже |
| Long-form output (большой README/FAQ/контент) | `gemini-mega-context` | Gemini 2.5 Pro | 8K+ output комфортнее чем у Opus |
| Image / video / audio analysis | `gemini-multimodal` | Gemini 2.5 (REST) | Нативный multimodal без Whisper/Vision pipeline |
| RU/ET/FI перевод-черновик, parse→JSON, reformat, OCR cleanup, short summary | `gemini-utility` | Gemini Flash (REST) | 1000 free req/day vs платные main-loop токены. Routine → экономь бюджет на reasoning |
| Codebase exploration / «найди паттерн» (read-only) | `researcher` | Haiku | Дёшево, fan-out, возвращает вывод не file-dumps |
| Vault distill / routing review / maintenance | `librarian` | Sonnet | Спец-промпт + write-доступ vault. Триггер «distill» |
| Ретроспектива / разбор ошибок сессии / incident | skill `post-mortem` | main loop | Структурный анализ → logs/post-mortem/. Триггер «post-mortem на X», НЕ inline debugging |
| Legal doc render / verify / review / tone (7-stage pipeline) | `legal-department` | main loop | Активный pipeline (project_legal_department). Versioned snippets + skeleton, Studiokook = active branch |
| Broad multi-location search, нужен только вывод | `Explore` | inherit | Читает excerpts, локализует код, не аудитит |
| Implementation-plan дизайн (архитектура, trade-offs) | `Plan` | inherit | Step-by-step план, critical files. Перед write hooks/agents |

## 2. Доменные специалисты (specificity wins — constitution § Parallel Agents)

| Домен (триггеры) | Агент / Skill | Модель |
|------------------|---------------|--------|
| EK/SU DC tuning, compose L/U/I kitchen | `sketchup-easykitchen-specialist` | Sonnet |
| WordPress REST модификация | `wp-specialist` (skill `wordpress`) — *project-scoped: Studiokook* | Sonnet |
| WordPress диагностика (read-only) | `wp-auditor` — *project-scoped: Studiokook* | Sonnet |
| TranslatePress переводы | `translator` (skill `wp-translatepress`) — *project-scoped: Studiokook* | Sonnet |

*project-scoped* = живут в `~/Desktop/Studiokook/.claude/` — видны ТОЛЬКО сессии, запущенной из
cwd Studiokook (CLAUDE.md § Projects). Из `~/.claude`-сессии их спавнить нельзя.
| n8n build / validation-fix / debug | skill `n8n-expert` | main loop |
| Vault search / write / route | skill `obsidian-router` | main loop |
| Кросс-проектный статус / weekly review | skill `assistant` | main loop |

Правило: matched по **intent** (читай описание агента), не по голому keyword. При конфликте
2+ агентов → constitution § Parallel Agents: specificity wins → write>read → свежесть данных →
**при равной уверенности спроси пользователя, не выбирай случайно**.

## 3. Локальные модели (Ollama, RTX 5070 8GB) — reference_ollama_local

| Когда | Модель | Зачем |
|-------|--------|-------|
| Privacy-sensitive chat, оффлайн | `arkhos-ru` (qwen3.5:9b) | Primary local chat, нет облака |
| Candid / без guardrails задачи | `arkhos-ru-free` (qwen3-abliterated:8b-v2) | Локально, не уходит наружу |
| Embeddings (memory-consolidation, RAG) | `nomic-embed-text` | Open WebUI RAG + hook embeddings |

Локальные = fallback/privacy, НЕ для качества reasoning (8B << Opus). Не брать на сложные задачи.

## 4. API-факты при делегировании (SSOT — детали НЕ здесь)

Только то, что влияет на сам выбор делегата. Полные gotchas — в canonical homes, не копировать:
- **Gemini quirks** (thinkingBudget:0, REST shape, free-tier лимиты) → MEMORY `reference_gemini_quirks`.
- **n8n quirks** → MEMORY `reference_n8n_quirks`.
- **codex-second-opinion** → MEMORY `feedback_codex_haiku` (model:sonnet wrapper, read full output).
- **Anthropic direct API** = balance 0 (n8n env + main) → top-up прежде чем звать api.anthropic.com.
- **Prompts EN, output RU** — инвариант всех LLM-процессов (`feedback_prompts_en_output_ru`).

## 5. Anti-patterns

- Делегировать routine, что Opus решит за один проход → лишний overhead.
- Брать gemini-utility на critical content с точным тоном → Opus + critic (Flash теряет нюанс).
- gemini-mega-context на focused query <50K → main loop дешевле и быстрее.
- Локальную 8B на сложный reasoning → деградация качества.
- Multi-turn iterative диалог через one-shot делегата (codex/gemini) → они one-shot, держи в main loop.
- Trust verdict-only от review-агента → всегда читай полный вывод.
