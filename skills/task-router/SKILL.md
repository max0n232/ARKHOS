---
name: task-router
description: >
  Automatic task routing to solo/subagent/team mode.
  Read on every request to determine optimal execution mode.
  Respects existing project routing (docs/routing.md).
triggers:
  - every incoming user request (implicit)
---

# Task Router

## Principle

After project routing (docs/routing.md) determines context,
evaluate optimal execution mode across 3 axes:

### Axis 1: Decomposability
- Can the task be split into 2+ INDEPENDENT subtasks?
- Can subtasks run in PARALLEL?
- No → Solo. Yes → continue.

### Axis 2: Inter-executor Communication
- Do executors need to exchange findings?
- Is discussion/verification needed?
- No → Subagent(s). Yes → Team.

### Axis 3: Token Justification
- Team = ~3-5x tokens vs Solo
- Subagent = ~1.5-2x vs Solo
- If task can be solved Solo in <5 min → DO NOT escalate

## Decision Matrix

| Signal | Mode | Example |
|---|---|---|
| Simple action, 1 file/object | Solo | "add email field" |
| Focused subtask, result returns | Subagent | "find API documentation" |
| "Audit/review/check" + >1 file | Team (2-3) | "check workflow #142" |
| "Debug" + complex system | Team (2-3) | "why chatbot crashes" |
| "Create from scratch" + complex | Team (2-4) | "create RSS workflow" |
| "Compare/research/find best" | Team (2-3) | "compare cache approaches" |
| "Optimize" | Depends on scope | 1 file=Solo, system=Team |

## Using Existing agents/

When choosing Subagent — use existing agents/:
- agents/code-reviewer.md → code review tasks
- agents/debugger.md → debugging
- agents/researcher.md → codebase exploration

When choosing Team — agents with team_eligible: true can become teammates.
Additional roles (not covered by agents/) are in registry.json.

## Mid-execution Escalation

If Solo proves harder than expected:
- >3 failed attempts → suggest Team escalation
- Task affects >5 files/modules → consider Team
- Competing hypotheses → Team with different angles

Respect constitution.md rule:
">3 files or >200 lines → ask or plan first"

## Token Guardrails

1. **Default model:** opusplan (Opus for planning, Sonnet for execution)
2. **Solo tasks:** Sonnet (effort: medium) — unless deep reasoning required
3. **Team Lead:** Opus (effort: high), Teammates: Sonnet (effort: medium)
4. **Max teammates:** 4 (hard limit, optimal 2-3)
5. **Team timeout:** 15 min total, 5 min per teammate
6. **Budget:** Respect Token Budget from CLAUDE.md (200k, stop at 50%)

BLOCKS:
- DO NOT spawn team for tasks <2 min solo
- DO NOT spawn team if request = 1 file/object
- DO NOT spawn >4 teammates EVER
- Lead ALWAYS in Delegate mode for teams

## Registry

Read skills/task-router/registry.json for:
- Registered domains and roles
- Team presets (ready configurations)
- Thresholds and limits

## Logging

Record every routing decision to patterns/ via existing
pattern-analyzer.js pipeline. Record format:

  routing_decision: {mode, teammates_count, domain, template, reason}

Pattern Tracker (patterns/detector.js) analyzes this data
for threshold optimization.
