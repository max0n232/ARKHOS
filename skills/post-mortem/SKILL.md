---
name: post-mortem
description: >
  Trigger: post-mortem, ретроспектива, "что пошло не так", "разбор ошибок", "debug session".
  Systematic session review + knowledge routing.
---

# Post-Mortem

Analyze the PROCESS of task execution, not the result.

**Core principle:** Every workaround is a documentation bug. Every retry pattern is a learning opportunity.

## Architecture

```
Stop hook (stop-analytics.js — merged traces + patterns + usage)
    ↓ parse transcript, detect errors/retries
    ↓ write to tracker.db (patterns table)
    ↓
[post-mortem skill] ← YOU ARE HERE
    ↓ analyzes session context
    ↓ classifies findings with confidence
    ↓ routes via Knowledge Routing
    ↓ writes logs/post-mortem/
```

## When to Execute

**RUN when:**
- Errors or retries detected in current session
- After verification-before-completion passes

**SKIP when:**
- Task was trivial (<3 tool calls, no errors)
- No errors or retries in session

## The Analysis

Scan current session for:

1. **Errors and Retries** — failed commands, retry count, working workaround
2. **Doc Mismatches** — SKILL.md method X failed, method Y worked
3. **New Patterns** — undocumented approach that succeeded
4. **Anomalies** — >3 retries same command, approach pivots, drift

## Confidence Scoring

```
base_confidence =
  0.9  HTTP 4xx/5xx AND alternative worked same session
  0.7  workaround worked, error was fuzzy (timeout, partial)
  0.5  pattern observed, no fix confirmed
  0.3  anomaly without clear cause

cross_session_boost = +0.1 per match in previous post-mortem logs (max +0.3)
final = min(base + boost, 1.0)
```

### Action Thresholds

| Confidence | Action |
|------------|--------|
| ≥0.8 | Route via Knowledge Routing: Skill / MEMORY / patterns |
| 0.5–0.79 | Log + MEMORY.md with `[UNCONFIRMED]` tag |
| 0.3–0.49 | Log only |
| <0.3 | Ignore |

## Classification

| Category | Condition | Action | Min Confidence |
|----------|-----------|--------|----------------|
| **doc-fix** | SKILL.md method failed, alt worked | Patch SKILL.md | ≥0.8 |
| **new-workflow** | Undocumented approach succeeded | Route via Knowledge Routing | ≥0.5 |
| **regression** | Previously working method fails | Log + notify | any |
| **false-pattern** | Pattern unreliable | Mark in log | ≥0.5 |

## Output Format

Write to `logs/post-mortem/YYYY-MM-DD-{summary}.md`:

```markdown
# Post-Mortem: {task summary}
Date: {date}

## Findings

### [{AUTO-FIXED|UNCONFIRMED}] {category}: {location} (confidence: X.X)
- Problem: {what failed}
- Resolution: {what worked}
- Evidence: {HTTP codes, error messages}
- Action: {patched/logged}
```

## Limits (Context Protection)

| Component | Limit |
|-----------|-------|
| Post-mortem log | ≤50 lines |
| Patterns per session | ≤5 |
| SKILL.md patches | ≤3 |
| Previous logs read | ≤5 files |

If >5 findings: top 5 by confidence, rest in `[DEFERRED]`.

## What NOT to Do

- Do NOT modify constitution.md, settings.json, hooks/, agents/
- Do NOT spawn subagents
- Do NOT block session (graceful fail)
- Do NOT create new skills without user approval (Scaling Rules)

## Knowledge Routing

Route each finding to the RIGHT storage layer. Wrong layer = dead weight.

### Decision Tree

```
Finding identified → ask:

1. ACTIONABLE checklist/workflow?
   → YES → Patch existing SKILL.md (ask user before creating new)

2. REFERENCE FACT (ID, config, API)?
   → YES → MEMORY.md (always in session context)

3. HISTORICAL analysis (root cause, timeline)?
   → YES → logs/post-mortem/

4. DETECTION RULE read by hook/script?
   → YES → patterns/ (only if something reads it programmatically)
   → NO → DON'T STORE (dead weight)
```

### Routing Table

| Learning Type | Storage | Why |
|---------------|---------|-----|
| Checklist / procedure | Skill | Auto-triggered, prevents recurrence |
| API key / ID / config | MEMORY.md | Always in context |
| Incident analysis | logs/post-mortem/ | Historical reference |
| Detection rule for hook | patterns/ | Hook reads it programmatically |
| Anything else | DON'T STORE | If nothing reads it, it's waste |

## After Analysis

1. Write log to `logs/post-mortem/` if findings exist
2. Route each finding through decision tree above
3. If confidence ≥0.8 AND actionable → patch existing Skill
4. If confidence ≥0.8 AND reference fact → update MEMORY.md
5. AVOID writing to patterns/ unless a hook reads it
