# Studiokook: Quick Reference

**Last Updated:** 2026-01-29

---

## Architecture (одной строкой)

**CLI (мозг) + n8n (руки/24-7) + Python agents (AI workers)**

---

## Key Decisions

| # | Decision | Reasoning |
|---|----------|-----------|
| 1 | **Hybrid architecture** | CLI грузит только Studiokook (10-15k tokens), n8n автоматизирует 24/7, agents предоставляют AI |
| 2 | **Monitor benchmark labs** | VBench, GenAI-Arena, LMSYS вместо дорогого self-testing |
| 3 | **Start with SEO audit** | Foundational, clear ROI, validates full stack |

---

## Project Structure

```
~/projects/studiokook/
├── agents/              # FastAPI (SEO, content, competitor)
├── n8n/workflows/       # Automation (Instagram, SEO, monitoring)
└── knowledge/           # Decisions, logs, templates
```

---

## Workflows Pipeline

### Development (CLI)
```bash
$ cd ~/projects/studiokook
$ claude "Analyze competitor Instagram strategy"
# Claude: research, analysis, recommendations
```

### Production (n8n 24/7)
```
Daily 9 AM → Generate Instagram post
Weekly Monday 10 AM → SEO audit all pages
Daily 3 AM → Monitor competitors
Weekly Friday 9 AM → Benchmark labs check
```

---

## Tech Stack Monitoring

**Sources:**
- Video: VBench
- Images: GenAI-Arena
- LLMs: LMSYS
- SEO: G2

**Automation:**
- n8n checks daily
- Claude reviews weekly (Friday 16:00)
- Alerts via Telegram if significant changes

---

## First Implementation

**SEO Audit Workflow:**
1. n8n → WordPress (get pages)
2. n8n → Python agent (analyze SEO)
3. Agent → Claude API (recommendations)
4. n8n → Google Sheets (report)
5. n8n → Telegram (alerts if issues)

**Status:** Ready to implement

---

## Benefits

✅ 10-15k tokens (not 50k)
✅ 24/7 automation
✅ Scalable (add projects easily)
✅ No self-benchmarking costs
✅ Knowledge retention

---

## Next Actions

- [ ] Setup n8n
- [ ] Create SEO agent (FastAPI)
- [ ] Design SEO workflow
- [ ] Test end-to-end
- [ ] Deploy

---

**Full details:** See STUDIOKOOK_ARCHITECTURE.md
