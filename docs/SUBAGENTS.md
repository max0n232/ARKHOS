# Studiokook Subagents

**Created:** 2026-01-29
**Purpose:** Persistent context between Claude Code sessions

---

## Why Subagents?

Claude Code **doesn't remember** conversation history between sessions. Each new session starts fresh.

**Problem:** Manual context loading is slow and error-prone.
**Solution:** Subagents automatically load project state.

---

## Available Subagents

### 1. studiokook-context (Context Loader)

**Auto-invoked at every session start** - no manual action needed.

**Purpose:** Load project state and return summary
**Model:** Haiku (fast, <1 second)
**Tools:** Read, Grep, Glob (read-only)
**Permissions:** `dontAsk` (no prompts)

**What it does:**
1. Reads `SESSION_STATE.md`
2. Queries `knowledge.db` for:
   - Last 3 decisions
   - Last 3 work logs
3. Returns concise summary:
   - Current status
   - Recent decisions
   - Recent work
   - Architecture overview
   - Next actions

**Example output:**
```markdown
# Studiokook Context

## Current Status
Setup complete + Subagents configured

## Recent Decisions
1. CLI Architecture: Hybrid Model (CLI + n8n)
2. Tech Monitoring: Benchmark Labs
3. First Project: SEO Audit

## Recent Work
1. Project setup complete
2. Subagents created

## Architecture
- CLI (brain): Research, design, decisions
- n8n (hands): 24/7 automation
- Python agents: AI workers

## Next Actions
1. Setup Python venv
2. Create SEO agent
```

**Configuration:** `.claude/agents/studiokook-context.md`

---

### 2. seo-auditor (SEO Specialist)

**Invoke explicitly when needed:** "Use seo-auditor to analyze studiokook.ee"

**Purpose:** SEO analysis and recommendations
**Model:** Sonnet (capable analysis)
**Tools:** Read, Bash, Grep, Glob
**Skills:** Preloaded with `seo-smm` skill (Studiokook keywords, strategy)

**What it does:**
1. Fetches page (curl)
2. Analyzes SEO elements:
   - Title, meta description
   - H1-H6 structure
   - Image alt tags
   - Internal links
   - Keywords (Estonian)
   - Local SEO
   - Mobile-friendly
3. Provides actionable recommendations
4. Saves results to `knowledge.db`

**Output format:**
- Score (X/100)
- Critical issues (must fix)
- Warnings (should fix)
- Suggestions (nice to have)
- Keyword analysis
- Recommendations

**Configuration:** `.claude/agents/seo-auditor.md`

---

## How It Works

### Session Start (Automatic)

```
1. You: cd C:\Users\sorte\Desktop\Studiokook && claude
2. Claude Code: Loads CLAUDE.md
3. CLAUDE.md instructs: "Use studiokook-context subagent"
4. Claude: Auto-invokes studiokook-context (Haiku, <1s)
5. Subagent: Reads SESSION_STATE.md + knowledge.db
6. Subagent: Returns summary to Claude
7. Claude: "Here's where we left off: [summary]"
8. You: Continue working with full context
```

**No manual steps!** Context loads automatically.

---

### Manual Subagent Use

```bash
# Explicitly invoke subagent
"Use seo-auditor to analyze studiokook.ee/koogid"

# Claude delegates to seo-auditor subagent
# Subagent runs analysis
# Returns recommendations to Claude
# Claude presents results to you
```

---

## Benefits vs Alternatives

| Feature | Subagents | Memory MCP | Manual Reading |
|---------|-----------|------------|----------------|
| **Auto-load context** | ✅ YES | ✅ YES | ❌ NO |
| **Speed** | ✅ Fast (Haiku) | ⚠️ Varies | ❌ Slow |
| **Control** | ✅ Full (we own code) | ⚠️ Limited | ✅ Full |
| **Customizable** | ✅ Markdown files | ❌ Config only | ✅ Full |
| **Project-specific** | ✅ .claude/agents/ | ❌ Global | ✅ Yes |
| **Version control** | ✅ Git-friendly | ❌ No | ✅ Yes |
| **Offline** | ✅ Works offline | ❌ Needs service | ✅ Yes |

---

## Creating New Subagents

### Via CLI (Interactive)

```bash
cd C:\Users\sorte\Desktop\Studiokook
claude

# In Claude Code
/agents
# Choose "Create new agent" → "Project-level"
# Follow prompts
```

### Manually (Markdown File)

Create `.claude/agents/your-agent.md`:

```markdown
---
name: your-agent
description: When to use this agent (be specific!)
tools: Read, Grep, Glob
model: haiku
---

You are [role]. When invoked:
1. [Step 1]
2. [Step 2]
3. [Return results]
```

**Fields:**
- `name`: Unique ID (lowercase, dashes)
- `description`: When Claude should delegate (critical!)
- `tools`: Which tools allowed (default: all)
- `model`: haiku/sonnet/opus/inherit
- `permissionMode`: default/dontAsk/acceptEdits/bypassPermissions

---

## Best Practices

### When to Create Subagent

✅ **DO create subagent for:**
- Session start context loading
- Specialized analysis (SEO, security, performance)
- High-volume operations (test runs, log analysis)
- Read-only research (codebase exploration)

❌ **DON'T create subagent for:**
- Interactive workflows (use main conversation)
- One-time tasks (just ask Claude)
- Simple operations (built-in tools sufficient)

### Model Selection

- **Haiku:** Fast, cheap, simple tasks (context loading, file search)
- **Sonnet:** Balanced, most use cases (analysis, recommendations)
- **Opus:** Complex reasoning, critical tasks (architecture decisions)
- **Inherit:** Match main conversation model

### Tools Restriction

Principle: **Least privilege** - only tools needed for the task.

```yaml
# Read-only agent
tools: Read, Grep, Glob

# Analysis with bash
tools: Read, Bash, Grep, Glob

# Can modify (use carefully)
tools: Read, Edit, Write, Bash
```

---

## Debugging Subagents

### Check if loaded

```bash
/agents
# Shows all available subagents
```

### View execution

Subagent output is shown in conversation. Look for:
```
[Subagent: studiokook-context]
Reading SESSION_STATE.md...
Querying knowledge.db...
```

### Transcripts

Located in: `~/.claude/projects/{project}/{sessionId}/subagents/agent-{agentId}.jsonl`

---

## Next Steps

1. **Test context loading:** Close and reopen Studiokook project
2. **Verify auto-invoke:** Check if studiokook-context runs automatically
3. **Test SEO auditor:** "Use seo-auditor to analyze studiokook.ee"
4. **Create more subagents** as needed:
   - `instagram-analyzer` - Instagram content analysis
   - `competitor-monitor` - Competitor tracking
   - `content-generator` - Blog post generation

---

**Related Docs:**
- `CLAUDE.md` - Session start protocol
- `SESSION_STATE.md` - Current project state
- `.claude/agents/` - Subagent definitions
