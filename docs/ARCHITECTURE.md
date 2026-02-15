# Studiokook Architecture Decision Record

**Date:** 2026-01-29
**Status:** Accepted
**Project:** Studiokook (kitchen furniture business automation)

---

## Executive Summary

Принята гибридная архитектура: **CLI (мозг) + n8n (руки) + Python agents (AI workers)**

- **CLI (Claude Code):** Research, analysis, workflow design, decision making
- **n8n:** 24/7 automation, scheduling, webhooks, integrations
- **Python agents (FastAPI):** AI logic via Claude/OpenAI API, вызываются n8n

**Результат:** 10-15k tokens контекста (вместо 50k), автоматизация без участия CLI, масштабируемость.

---

## Context & Problem

### Задача
Автоматизация Studiokook (кухонная мебель на заказ, Таллин):
- SEO оптимизация (WordPress, Google APIs)
- SMM (Instagram: reels, stories, посты, карусели)
- Market research (конкуренты, тренды)
- Content generation (AI генерация + футажи + кастомные материалы)

### Проблемы рассмотренных подходов

**Монолитный ARKHOS CLI:**
- ❌ Грузит весь контекст (50k+ tokens)
- ❌ Trading, assistant, все domains загружаются даже когда не нужны
- ❌ Все MCP connectors активны одновременно
- ❌ Все skills грузятся

**Независимые CLI для каждого проекта:**
- ❌ Дублирование кода (DAL, auth, MCP setup)
- ❌ Раздельные knowledge bases (нет cross-project learning)
- ❌ N CLI = N maintenance effort

**Только n8n без CLI:**
- ❌ Нет AI reasoning для complex analysis
- ❌ Сложно делать research & planning
- ❌ Неудобно для debugging & iteration

---

## Decision: Hybrid Architecture

```
┌─────────────────────────────────────────┐
│  CLI (Claude Code) - BRAIN              │
│  - Development & research               │
│  - Workflow design                      │
│  - Decision making                      │
│  - Testing & debugging                  │
│  Token usage: 10-15k per session        │
└─────────────────────────────────────────┘
              ↓ Creates & configures
┌─────────────────────────────────────────┐
│  n8n - HANDS (24/7)                     │
│  - Workflow execution                   │
│  - Scheduling                           │
│  - Webhooks & integrations              │
│  - Monitoring                           │
│  Token usage: 0 (not an LLM)            │
└─────────────────────────────────────────┘
              ↓ Calls when needs AI
┌─────────────────────────────────────────┐
│  Python Agents - AI WORKERS             │
│  - FastAPI endpoints                    │
│  - Claude/OpenAI API calls              │
│  - Custom processing                    │
│  Token usage: Only when called          │
└─────────────────────────────────────────┘
```

### Roles & Responsibilities

| Component | Role | Examples |
|-----------|------|----------|
| **CLI** | Engineer & Brain | Market research, competitor deep analysis, workflow design, debugging, decision making |
| **n8n** | Executor & Automation | Daily Instagram posts, weekly SEO audits, competitor monitoring, analytics reports |
| **Agents** | AI Workers | Content generation (Claude), SEO analysis (Claude), image generation (API calls) |

---

## Project Structure

```
~/projects/studiokook/
├── CLAUDE.md                    # CLI instructions (Studiokook-specific)
├── agents/
│   ├── main.py                  # FastAPI app
│   ├── seo_agent.py             # SEO audit & analysis
│   ├── content_agent.py         # Instagram content generation
│   ├── competitor_agent.py      # Competitor monitoring
│   └── requirements.txt
│
├── n8n/
│   ├── workflows/
│   │   ├── instagram_daily.json
│   │   ├── seo_audit_weekly.json
│   │   ├── competitor_monitor.json
│   │   └── benchmark_monitoring.json
│   └── credentials/
│
├── knowledge/
│   ├── knowledge.db             # Studiokook-specific decisions, logs
│   └── templates/               # Content templates
│
└── scripts/
    ├── deploy_agent.sh          # Start FastAPI
    └── setup_n8n.sh             # Import workflows to n8n
```

---

## Tech Stack Monitoring Strategy

### Problem
AI tools evolve rapidly (Kling AI, Runway, Flux, Midjourney, etc.). Self-benchmarking is:
- Expensive (API calls for all models)
- Subjective (manual quality evaluation)
- Incomplete (1 test prompt != comprehensive benchmark)
- Lacks expertise

### Decision
**Monitor professional benchmark labs instead of self-testing**

| Category | Benchmark Source | Metrics | Update Frequency |
|----------|-----------------|---------|------------------|
| **Video Generation** | VBench | Quality, temporal coherence | Monthly |
| **Image Generation** | GenAI-Arena (Hugging Face) | User Elo ratings | Weekly |
| **LLMs** | LMSYS Chatbot Arena | Elo, creative writing | Weekly |
| **SEO Tools** | G2, Capterra | User ratings, features | Monthly |
| **AI News** | AI Breakfast, Ben's Bites, TheRundown | - | Daily |

### Automation

```
n8n Daily Monitoring (9 AM):
├── Fetch VBench leaderboard
├── Fetch GenAI-Arena Elo rankings
├── Fetch LMSYS leaderboard
├── Scrape G2 SEO tool ratings
├── Parse AI news RSS feeds
    ↓
Compare vs tech_stack database
    ↓
IF significant change (score diff >3, Elo >20):
    ↓ Call Claude agent
Analyze relevance for Studiokook
    ↓
Alert via Telegram + log to Google Sheets
```

**Weekly CLI Review (Friday 16:00):**
- Claude reads benchmark_alerts
- Groups by priority (HIGH/MEDIUM/LOW)
- Recommends actions (TEST/EVALUATE/MONITOR)
- Saves decision to knowledge base

---

## First Implementation: SEO Audit Workflow

### Why SEO First?
- Foundational (impacts all content & visibility)
- Clear ROI (better rankings = more clients)
- Validates full architecture (CLI design → n8n execution → agent AI logic)
- Existing integrations (WordPress, Google APIs)

### Components

**1. SEO Agent (Python/FastAPI)**
```python
@app.post("/seo/audit")
async def audit_page(url: str):
    """Claude analyzes page SEO"""
    # Fetch page HTML
    # Send to Claude with SEO analysis prompt
    # Return: score, issues, recommendations
```

**2. n8n Workflow**
```
[Schedule: Every Monday 10 AM]
    ↓
[WordPress] Get all pages
    ↓
[Loop] Process each page
    ↓
[HTTP Request] POST /seo/audit
    ↓
[Google Sheets] Update SEO report
    ↓
[IF] critical issues
    ↓
[Telegram] Alert
```

**3. CLI Usage**
- Design workflow
- Test agent
- Analyze results
- Improve prompts
- Make decisions

---

## Benefits

✅ **Minimal context:** 10-15k tokens (CLI loads only Studiokook)
✅ **24/7 automation:** n8n runs workflows without CLI
✅ **Scalability:** New project = new folder + agents + workflows
✅ **Separation of concerns:** CLI thinks, n8n executes, agents provide AI
✅ **Cost-effective:** No self-benchmarking, monitor labs instead
✅ **Knowledge retention:** All decisions in knowledge.db

---

## Consequences & Trade-offs

### To Implement
- [ ] Setup n8n instance
- [ ] Create Python agents (FastAPI)
- [ ] Design workflows
- [ ] Setup benchmark monitoring
- [ ] Create knowledge.db for Studiokook

### Ongoing Effort
- Weekly benchmark review (30 min)
- Workflow maintenance when APIs change
- Agent prompt optimization

### Risks
- n8n dependency (mitigation: workflows are JSON, portable)
- API rate limits (mitigation: intelligent scheduling)
- Benchmark labs availability (mitigation: multiple sources)

---

## Next Steps

1. **Setup Studiokook project structure**
2. **Create SEO agent (FastAPI)**
3. **Design SEO audit n8n workflow**
4. **Test end-to-end**
5. **Setup benchmark monitoring**
6. **Iterate based on results**

---

## Related Decisions

- Decision ID 1769251433: CLI Architecture
- Decision ID 1769251434: Tech Stack Monitoring Strategy
- Decision ID 1769251435: First Implementation (SEO Audit)

---

## References

- ARKHOS: C:\Users\sorte\Desktop\.claude
- n8n MCP: Available via claude-code
- Benchmark sources: VBench, GenAI-Arena, LMSYS, G2
