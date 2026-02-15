# Studiokook Automation

**Business:** Kitchen furniture manufacturing (custom kitchens, Tallinn, Estonia)
**Website:** studiokook.ee

---

## What This Is

Automation system for Studiokook using:
- **CLI (Claude Code):** Research, analysis, workflow design, decisions
- **n8n:** 24/7 automation (SEO, Instagram, monitoring)
- **Python agents (FastAPI):** AI logic (Claude API)

---

## Project Structure

```
Studiokook/
├── agents/              # Python FastAPI (SEO, content, competitors)
├── n8n/workflows/       # n8n automation workflows (JSON)
├── knowledge/           # SQLite database (decisions, logs, benchmarks)
├── skills/              # Skill definitions (n8n, seo-smm, content-creator)
├── credentials/         # API credentials (Google, etc.)
├── docs/                # Architecture & documentation
└── scripts/             # Utility scripts
```

---

## Quick Start

### 1. Setup Python Environment

```bash
cd Studiokook
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r agents/requirements.txt
```

### 2. Start Agents

```bash
cd agents
uvicorn main:app --reload --port 8001
```

### 3. Setup n8n

- Import workflows from `n8n/workflows/`
- Configure credentials
- Test workflows

### 4. CLI Usage

```bash
cd Studiokook
claude  # Loads Studiokook context only
```

---

## Current Workflows

### Implemented
- (None yet - starting with SEO Audit)

### Planned
1. **SEO Audit** (weekly, Monday 10 AM)
2. **Instagram Content** (daily, 9 AM)
3. **Benchmark Monitoring** (daily, 9 AM)
4. **Competitor Monitoring** (daily, 3 AM)

---

## Key Decisions

See `knowledge/knowledge.db` or `docs/ARCHITECTURE.md`

1. **CLI + n8n hybrid architecture**
2. **Monitor benchmark labs instead of self-testing**
3. **Start with SEO Audit workflow**

---

## Documentation

- **Architecture:** `docs/ARCHITECTURE.md` (detailed ADR)
- **Quick Reference:** `docs/SUMMARY.md`
- **Skills:** `skills/*.md` (n8n, seo-smm, content-creator)

---

## Skills Available

- `/n8n` - n8n workflow automation
- `/seo-smm` - SEO & Instagram strategy
- `/content-creator` - Content creation patterns
- `/knowledge` - Database operations

---

## Next Steps

- [ ] Create SEO agent (FastAPI)
- [ ] Design SEO audit n8n workflow
- [ ] Setup n8n instance
- [ ] Test end-to-end
- [ ] Deploy

---

**Last Updated:** 2026-01-29
