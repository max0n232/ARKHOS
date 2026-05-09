---
name: output-critic
description: >
  Mandatory after generating final outputs (prompts, code, content, config). Manual: "critique",
  "improve this", "проверь качество". Skip for conversational replies.
model: sonnet
---

# Output Critic — Universal Quality Protocol

## Purpose
After generating any final output, run a structured critic phase and deliver an improved v2.
This is NOT optional for final outputs. Skip only when user explicitly says: "quick", "draft", "rough version", "just sketch it".

---

## Phase Detection

Before critiquing, identify output type to apply the correct rubric:

| Output Type | Signals |
|---|---|
| `ai-prompt` | Prompt for Kling, NanoBanana, Flux, Midjourney, Stable Diffusion, Runway, etc. |
| `text-content` | Blog post, SEO article, social media post, caption, product description |
| `code` | Python, JS, bash script, n8n workflow JSON, any executable |
| `structured-data` | JSON config, YAML, workflow, API payload |
| `other` | Apply universal rubric only |

---

## Critic Execution Protocol

### Step 0 — Load context (MANDATORY before scoring)

Before ANY scoring, gather context for the output being evaluated:

1. **Identify project** — Studiokook? AiGeneration? Infrastructure?
2. **Load relevant context** — use Ghost deep_search or vault search for:
   - Strategy/brand voice if `text-content` or `ai-prompt`
   - Architecture decisions if `code` or `structured-data`
   - Page/component purpose if output targets a specific page
3. **Note what you know** — list 2-3 key context facts that will inform scoring
4. If context genuinely unavailable (e.g. no project, pure standalone task) — note "standalone, no project context" and proceed
5. If Ghost/vault search fails or times out — note "context unavailable: [reason]" and cap Context fit at 3/5 max (cannot confirm alignment without context)

**Do NOT score without context.** Do NOT assume facts about the project (languages, features, structure). Check first, score second.

### Step 1 — Score v1 output

Rate each dimension **1–5**. Be strict. 3 = acceptable but not impressive.
Scores MUST reference context from Step 0 — not generic assumptions.

#### Universal dimensions (apply to ALL types):

| Dimension | Question |
|---|---|
| **Completeness** | Is anything obviously missing that the task required? |
| **Clarity** | Is the output unambiguous and easy to parse/use? |
| **Goal alignment** | Does it actually solve what was asked, not just respond to it? |
| **Edge cases** | Are obvious failure modes or exceptions handled? |
| **Context fit** | Does it align with project strategy, past decisions, brand voice loaded in Step 0? Score against actual context, not assumptions. |

#### Type-specific dimensions:

**`ai-prompt`**
| Dimension | Question |
|---|---|
| **Subject specificity** | Is the main subject described with enough unique detail? |
| **Technical parameters** | Are style, lighting, camera, mood, ratio specified where relevant? |
| **Negative space** | Are unwanted elements explicitly excluded if needed? |
| **Model fit** | Is the prompt syntax appropriate for the target model? |

**`text-content`**
| Dimension | Question |
|---|---|
| **Hook strength** | Does the opening earn attention in 2 seconds? |
| **SEO/keyword density** | Are target terms present naturally (if SEO task)? |
| **CTA clarity** | Is the desired action obvious? |
| **Tone consistency** | Does tone match brand/audience throughout? |

**`code`**
| Dimension | Question |
|---|---|
| **Error handling** | Are failures caught and handled gracefully? |
| **Readability** | Would another developer understand this without comments? |
| **Security** | Are inputs sanitized, credentials not hardcoded? |
| **Efficiency** | Any obvious O(n^2) loops or redundant operations? |

**`structured-data`**
| Dimension | Question |
|---|---|
| **Schema validity** | Will this parse without errors? |
| **Required fields** | Are all mandatory fields present? |
| **Data types** | Are types correct (string vs int vs bool)? |
| **Idempotency** | Will running this twice cause problems? |

---

### Step 2 — Identify gaps

List only dimensions scored <= 3. For each:

GAP: [dimension name]
SCORE: [X/5]
ISSUE: [one sentence — what specifically is wrong]
FIX: [one sentence — what needs to change]

If ALL dimensions score 4–5 → state "No significant gaps found. v1 output is final." and stop.

---

### Step 3 — Generate v2

Apply all fixes from Step 2. Output the improved version in full — do not summarize or diff.

Label clearly:
## OUTPUT v2 (improved)
[full improved output here]

---

### Step 4 — Delta summary

After v2, one short paragraph: what changed and why it is better. Max 3 sentences.

---

## Output Format

---
CRITIC PHASE
Type: [detected type]

SCORES:
- Completeness: X/5
- Clarity: X/5
- Goal alignment: X/5
- Edge cases: X/5
[type-specific scores]

GAPS:
[gap blocks or "No significant gaps"]

---
OUTPUT v2
[improved output]

DELTA: [what changed]
---

---

## Hard rules

- Never inflate scores to seem polite. A weak prompt scores 2/5.
- Never assume facts about the project. If you didn't load it in Step 0 — you don't know it. "Нет мультиязычности" when the site has 4 languages = critic failure.
- v2 must be substantively different from v1 if gaps were found. Do not just rephrase.
- Keep v2 in the same format as v1 (if v1 was JSON, v2 is JSON; if v1 was a paragraph, v2 is a paragraph).
- v2 length ≤ 1.5× v1. Critic improves quality, not inflates volume.
- For ai-prompts: v2 must be in English regardless of conversation language.
- For code: v2 must be fully runnable, not pseudo-code.
- Language: commentary/gaps in RU (user's language), code/prompts in their native language.

## Skip conditions

Do NOT run critic on:
- Conversational replies, status reports, explanations, search results
- File reads, git commands, diagnostic output
- Responses where `stop_hook_active` is true (prevent recursion)
- Only run on **generation**: code/script written, text content produced, AI prompt, JSON/config, plan
