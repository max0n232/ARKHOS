---
name: post-mortem
description: Use after verification-before-completion when task is done - analyzes session PROCESS for errors, workarounds, doc mismatches; uses confidence scoring for auto-actions; triggered by Stop hook when errors detected
---

# Post-Mortem

## Overview

Analyze the PROCESS of task execution, not the result. Two-layer architecture: hook triggers, skill analyzes.

**Core principle:** Every workaround is a documentation bug. Every retry pattern is a learning opportunity.

## Architecture

```
Stop hook (post-mortem-trigger.js)
    ↓ reads $CLAUDE_TRANSCRIPT_PATH
    ↓ counts errors/retries
    ↓ if findings → writes tmp/post-mortem-pending.json
    ↓
[verification-before-completion] Phase 3
    ↓ if pending.json exists
    ↓
[post-mortem skill] ← YOU ARE HERE
    ↓ analyzes session context + pending.json
    ↓ classifies findings with confidence
    ↓ writes logs/post-mortem/
    ↓ (Phase 2+) patches SKILL.md, writes patterns/
```

## When to Execute

**RUN when:**
- `tmp/post-mortem-pending.json` exists (hook detected findings)
- After verification-before-completion passes

**SKIP when:**
- No pending.json (hook determined no findings)
- Task was trivial (<3 tool calls, no errors)

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
| ≥0.8 | Auto-patch SKILL.md, write to patterns/ |
| 0.5–0.79 | Write to patterns/ with `[UNCONFIRMED]` |
| 0.3–0.49 | Log only, no patterns/ |
| <0.3 | Ignore |

## Classification

| Category | Condition | Action | Min Confidence |
|----------|-----------|--------|----------------|
| **doc-fix** | SKILL.md method failed, alt worked | Patch SKILL.md | ≥0.8 |
| **new-pattern** | Undocumented approach succeeded | Write patterns/ | ≥0.5 |
| **regression** | Previously working method fails | TODO + notify | any |
| **false-pattern** | Pattern unreliable | Mark in tracker | ≥0.5 |

## Output Format

Write to `logs/post-mortem/YYYY-MM-DD-{session-id}.md`:

```markdown
# Post-Mortem: {task summary}
Date: {date}
Task: {description}
Session: {id from pending.json}

## Findings

### [{AUTO-FIXED|UNCONFIRMED|NEEDS-REVIEW}] {category}: {location} (confidence: X.X)
- Problem: {what failed}
- Resolution: {what worked}
- Evidence: {HTTP codes, error messages}
- Action: {patched/logged/TODO}

## Stats
- Errors: N
- Retries: N
- Workarounds: N
- Docs patched: N (confidence ≥0.8)
- Patterns added: N (M confirmed, K unconfirmed)
- TODOs: N
```

## Limits (Context Protection)

| Component | Limit |
|-----------|-------|
| This skill | ≤80 lines active |
| Post-mortem log | ≤50 lines |
| Patterns per session | ≤5 |
| SKILL.md patches | ≤3 |
| Previous logs read | ≤5 files |

If >5 findings: top 5 by confidence, rest in `[DEFERRED]`.

## What NOT to Do

- Do NOT modify constitution.md, settings.json, hooks/, agents/
- Do NOT spawn subagents
- Do NOT block session (graceful fail)
- Do NOT duplicate verification
- Do NOT extract skills (only errors + fixes)

## After Analysis

1. Delete `tmp/post-mortem-pending.json`
2. If findings: write log to `logs/post-mortem/`
3. If confidence ≥0.8 AND doc-fix: patch SKILL.md (Phase 2)
4. If confidence ≥0.5: write to patterns/

## Phase Status

**Phase 1 (MVP):** Analysis + logging + confidence scoring ✅
**Phase 2:** Auto-patch SKILL.md, write patterns/ ✅
**Phase 3:** Cross-session analysis, confidence boost ✅
**Phase 4:** Consolidation `/post-mortem-consolidate`

## Scripts

| Script | Location | Purpose |
|--------|----------|---------|
| post-mortem-trigger.js | scripts/ | Stop hook: detects errors, creates pending.json |
| post-mortem-analyzer.js | scripts/ | Skill: processes pending, patches SKILL.md, writes patterns/ |

## Integration

**Automatic flow:**
1. Stop hook runs `post-mortem-trigger.js`
2. If errors found → creates `tmp/post-mortem-pending.json`
3. Next session: skill invokes `post-mortem-analyzer.js`
4. Analyzer patches SKILL.md (≥0.8), writes patterns/ (≥0.5), logs results

**Manual invocation:**
```bash
node ~/.claude/scripts/post-mortem-analyzer.js
```
