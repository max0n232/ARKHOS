---
name: strategic-critique
description: >
  ALWAYS invoke this skill when user requests стратегия, стратегический план, strategy,
  content plan, контент-план, architecture decision, or says "with critique" / "со стратегической
  критикой". Do not generate strategic plans directly — use this skill for multi-round critique
  loop with rubric scoring. Do NOT trigger on 'audit' or 'roadmap' alone.
triggers:
  - стратегия
  - стратегический план
  - SEO план
  - SEO аудит
  - контент-план
  - content strategy
  - архитектурное решение
  - бизнес-план
  - roadmap
  - with critique
  - с критикой
---

# Strategic Critique Loop

## When to activate

This skill activates for **strategic tasks** — plans, strategies, audits, roadmaps,
architecture decisions. NOT for implementation tasks (coding, config changes, deployments).

Detection heuristic:
- User asks for a plan, strategy, audit, or roadmap → ACTIVATE
- User asks to implement, fix, deploy, or configure → DO NOT activate
- User explicitly says "с критикой" or "with critique" → ALWAYS activate
- Ambiguous? Ask: "Это стратегическая задача? Запустить critique loop?"

## Phase 1: Context loading

Before generating anything, gather context:

1. **Vault context** (via QMD):
   ```
   qmd search vault "{project name} {task domain}"
   ```
   Load the project _index.md and any relevant area notes.

2. **Session history** (via QMD):
   ```
   qmd search ghost-.claude "{task domain} past decisions"
   ```
   Check if similar strategic work was done before.

3. **Current state assessment** (if applicable):
   For SEO — check current site state via web fetch.
   For architecture — read current CLAUDE.md / system docs.
   For content — check current social media pipeline notes.

Budget: < 3000 tokens total for context loading.

## Phase 2: Draft generation

Generate the first version of the deliverable.

Rules:
- Follow the domain-specific rubric structure (see rubrics/ folder).
- Be concrete: dates, numbers, priorities — not vague advice.
- Estonian/Russian market context where applicable (studiokook.ee).
- Reference vault context naturally.

Output format: markdown document with clear sections.

## Phase 3: Scoring

Score the draft against the domain-specific rubric.
Each rubric has 5 dimensions, each scored 1-5.

Format: table `| Dimension | Score | Weakness |` with Total/25, Weak dimensions, Verdict (PASS if ALL ≥4, else ITERATE).

Scoring MUST be harsh and honest. Common failure modes:
- Giving yourself 4/5 on everything to avoid iterating → DON'T.
- Vague weaknesses like "could be more detailed" → be SPECIFIC.
- Ignoring market-specific issues (Estonia is not US market) → CHECK.

## Phase 4: Critique

For each dimension scored < 4, formulate:
1. **What's wrong** — specific problem (not vague).
2. **What would fix it** — concrete improvement direction.
3. **Research query** — what to search for to find a better approach.

Format per dimension: `### Critique: {Dim} ({score}/5)` → Problem, Fix direction, Research queries (web + QMD).

## Phase 5: Research

Execute research for EACH weak dimension:

1. **Web search** (built-in Claude Code WebSearch/WebFetch):
   - Execute each research query from Phase 4.
   - Fetch 2-3 top results per query.
   - Extract actionable insights — not full articles.
   - Prefer primary sources: official docs, case studies, data.
   - For SEO: check competitor sites, Google Search Console docs, Ahrefs/Semrush guides.
   - For architecture: check official framework docs, production case studies.

2. **Vault search** (QMD):
   - Search for related past decisions or patterns.
   - Check if this weakness was addressed before in another project.

3. **Current state check** (if applicable):
   - For SEO tasks: fetch the actual site (studiokook.ee) and check current state.
   - For API tasks: verify current API behavior.

Budget per weak dimension: ≤ 5 web searches, ≤ 3 QMD queries.
Total budget per iteration: ≤ 15 web searches.

Output format per dimension:

```
### Research: {Dimension name}

**Finding 1:** {insight} (source: {url or vault path})
**Finding 2:** {insight} (source: {url or vault path})
**Recommendation:** {specific change to make in the plan}
```

## Phase 6: Optimize

Apply ALL research findings to the draft:
- Rewrite weak sections with concrete data from research.
- Add missing elements identified in critique.
- Preserve strong sections (score ≥ 4) — don't break what works.
- Mark changes with `[IMPROVED: iteration N]` comments for traceability.

Output: Updated full document (not a diff — full replacement).

## Phase 7: Re-score

Score the updated document using the same rubric.

Convergence rules:
- **PASS**: ALL dimensions ≥ 4 → proceed to Phase 8.
- **ITERATE**: Any dimension < 4 AND iteration < 3 AND at least 1 dimension improved → loop back to Phase 4.
- **FORCE STOP**: iteration = 3 OR no dimension improved → proceed to Phase 8 with current best.

Show score comparison table across iterations with Δ column and convergence status.

## Phase 8: Output

Deliver three artifacts:
1. **Final deliverable** — clean document (no `[IMPROVED]` markers, add executive summary + methodology).
2. **Critique log** — iterations, scores, weaknesses addressed, sources, remaining concerns.
3. **Save to vault** — deliverable to `10-Projects/{project}/`, critique log to `critique-logs/`, update _index.md.

Research tools: built-in WebSearch + WebFetch. Perplexity MCP optional, not required.

## Important constraints

1. **Max 3 iterations.** Diminishing returns after that — ship it.
2. **Show progress.** After each phase, briefly tell the user what happened.
   "Iteration 2: actionability improved 2→4, market specificity still at 3, researching..."
3. **Don't gold-plate.** Score 4/5 is "good enough for production". 5/5 is rare.
4. **User can interrupt.** If user says "stop" or "good enough" — immediately skip to Phase 8.
5. **Token awareness.** Each iteration costs ~5000-10000 tokens. Warn user if approaching 3rd iteration.
6. **Language.** Draft in Russian by default (user preference). Research queries in English (better results). Technical terms in English.
