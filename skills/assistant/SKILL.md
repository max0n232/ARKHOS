---
name: assistant
description: "Cross-project coordinator for Studiokook and AiGeneration. Use when user asks what to work on, needs to prioritize between projects, requests a weekly review, or wants a health check of their systems. Also triggers on 'что делать', 'приоритеты', 'обзор', 'review'."
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
