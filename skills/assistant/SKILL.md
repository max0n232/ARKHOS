---
name: assistant
description: >
  ALWAYS invoke this skill when user asks "что делать", "приоритеты", "статус проектов",
  "weekly review", "monthly review", "что сделано", "progress", or "health check систем".
  Do not answer project coordination questions directly — use this skill to check both
  Studiokook and AiGeneration project contexts first. Do NOT trigger on "review" alone.
  Do NOT trigger on 'review' alone — that may be output-critic (quality review) or
  code-review (PR review). Only trigger when context is clearly about project coordination.
---

# Project Coordinator

Helps decide what to do when working across Studiokook and AiGeneration.

Project details live in each project's `CLAUDE.md` — read them there, not here.

## Priority Order

When choosing what to work on:

1. **Broken** — n8n workflow errors, site down, 500s → fix now
2. **Revenue** — Studiokook SEO, pages that drive orders → same day
3. **Growth** — AiGeneration automation, new content formats → this week
4. **Maintenance** — plugin updates, translation gaps, cleanup → when free

## Health Check

Run periodically or when asked:

```
Studiokook:
☐ studiokook.ee loads in all 4 languages (ET, RU, EN, FI)
☐ n8n workflows active: Analytics, SEO, AEO
☐ No console errors on key pages
☐ Translation coverage — no untranslated strings

AiGeneration:
☐ Content pipeline running (n8n cron workflows)
☐ Kie.ai credits available
☐ Pinterest token not expired
☐ Brand voice files current
```

## Anti-Patterns

- Switching between projects mid-task — finish one thing first
- Ignoring failing n8n workflows — small errors snowball
- Doing manually what should be automated — 3+ times = automate
