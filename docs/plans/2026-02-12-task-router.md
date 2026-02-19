# Task Router Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a skill that automatically routes incoming requests to Solo/Subagent/Team execution modes.

**Architecture:** Task Router is a SKILL that reads registry.json for domain/role configuration, uses SKILL.md for decision logic, and integrates with existing Pattern Tracker for routing analytics. Works alongside existing Project Router (docs/routing.md).

**Tech Stack:** Markdown (SKILL.md), JSON (registry.json), JavaScript (Pattern Tracker integration)

---

## Phase 0: Minimal Configuration Changes

### Task 0.1: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md:5-11`

**Step 1: Read current file**

Already read. Current content has References section at lines 5-11.

**Step 2: Add skill references**

Add after line 11 (`@docs/skills-reference.md`):

```markdown
@skills/task-router/SKILL.md
@skills/task-router/registry.json
```

**Step 3: Verify change**

Run: `grep -n "task-router" CLAUDE.md`
Expected: Two lines with task-router references

**Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "chore: add task-router references to CLAUDE.md"
```

---

### Task 0.2: Update settings.json (add env variable)

**Files:**
- Modify: `settings.json:140-142`

**Step 1: Add CLAUDE_AUTOCOMPACT_PCT_OVERRIDE**

Current env section:
```json
"env": {
  "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
}
```

New env section:
```json
"env": {
  "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1",
  "CLAUDE_AUTOCOMPACT_PCT_OVERRIDE": "80"
}
```

**Step 2: Validate JSON**

Run: `node -e "JSON.parse(require('fs').readFileSync('settings.json', 'utf8')); console.log('Valid JSON')"`
Expected: "Valid JSON"

**Step 3: Commit**

```bash
git add settings.json
git commit -m "chore: add CLAUDE_AUTOCOMPACT_PCT_OVERRIDE to settings.json"
```

---

### Task 0.3: Add task-router to REGISTRY.md

**Files:**
- Modify: `skills/REGISTRY.md:8-11`

**Step 1: Add entry to Core section**

Add after line 11 (after knowledge row):

```markdown
| task-router | skills/task-router/ | Task mode routing (solo/subagent/team) |
```

**Step 2: Commit**

```bash
git add skills/REGISTRY.md
git commit -m "chore: register task-router in REGISTRY.md"
```

---

## Phase 1: Core Router Files

### Task 1.1: Create directory structure

**Files:**
- Create: `skills/task-router/` directory
- Create: `skills/task-router/templates/` directory

**Step 1: Create directories**

Run: `mkdir -p skills/task-router/templates`
Expected: No output, directories created

**Step 2: Verify**

Run: `ls -la skills/task-router/`
Expected: Empty directory with templates/ subdirectory

---

### Task 1.2: Create SKILL.md

**Files:**
- Create: `skills/task-router/SKILL.md`

**Step 1: Create the skill file**

```markdown
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
```

**Step 2: Verify file created**

Run: `head -20 skills/task-router/SKILL.md`
Expected: YAML frontmatter with name: task-router

**Step 3: Commit**

```bash
git add skills/task-router/SKILL.md
git commit -m "feat(task-router): add core SKILL.md with routing logic"
```

---

### Task 1.3: Create registry.json

**Files:**
- Create: `skills/task-router/registry.json`

**Step 1: Create the registry file**

```json
{
  "$schema": "task-router-registry-v1",
  "version": "1.0.0",

  "defaults": {
    "model": "opusplan",
    "max_teammates": 4,
    "team_timeout_min": 15,
    "teammate_timeout_min": 5,
    "effort": {
      "solo": "medium",
      "lead": "high",
      "teammate": "medium"
    }
  },

  "domains": {
    "n8n": {
      "description": "n8n workflow automation",
      "triggers": ["workflow", "n8n", "нода", "node", "webhook", "trigger"],
      "skills": ["skills/n8n.md", "skills/n8n-expert/"],
      "roles": {
        "analyzer": {
          "description": "Execution logs, error patterns, data flow",
          "tools": ["Read", "Grep", "Glob", "Bash"]
        },
        "debugger": {
          "description": "Code nodes, expressions, connections",
          "agent_ref": "agents/debugger.md",
          "tools": ["Read", "Grep", "Glob", "Bash"]
        },
        "optimizer": {
          "description": "Performance and architecture",
          "tools": ["Read", "Grep", "Glob"]
        },
        "builder": {
          "description": "New workflow creation",
          "tools": ["Read", "Grep", "Glob", "Bash"]
        }
      },
      "team_presets": {
        "debug": ["analyzer", "debugger"],
        "full_review": ["analyzer", "debugger", "optimizer"],
        "build": ["builder", "optimizer"]
      }
    },

    "code": {
      "description": "Code review, refactoring, development",
      "triggers": ["review", "аудит", "рефакторинг", "refactor", "код", "code", "баг", "bug"],
      "roles": {
        "security": {
          "description": "Vulnerabilities, injections, authentication",
          "tools": ["Read", "Grep", "Glob"]
        },
        "performance": {
          "description": "Bottlenecks, complexity, memory",
          "tools": ["Read", "Grep", "Glob"]
        },
        "quality": {
          "description": "Patterns, readability, DRY",
          "agent_ref": "agents/code-reviewer.md",
          "tools": ["Read", "Grep", "Glob"]
        },
        "debugger": {
          "description": "Root cause analysis",
          "agent_ref": "agents/debugger.md",
          "tools": ["Read", "Grep", "Glob", "Bash"]
        }
      },
      "team_presets": {
        "review": ["security", "performance", "quality"],
        "debug": ["debugger", "quality"],
        "full_audit": ["security", "performance", "quality", "debugger"]
      }
    },

    "research": {
      "description": "Research, docs, API exploration",
      "triggers": ["исследуй", "research", "сравни", "compare", "документация", "docs", "api"],
      "roles": {
        "searcher": {
          "description": "Information gathering",
          "agent_ref": "agents/researcher.md",
          "tools": ["Read", "Grep", "Glob"]
        },
        "analyst": {
          "description": "Analysis, comparison, pros/cons",
          "tools": ["Read", "Grep", "Glob"]
        },
        "critic": {
          "description": "Devil's advocate, risks, edge cases",
          "tools": ["Read", "Grep", "Glob"]
        }
      },
      "team_presets": {
        "explore": ["searcher", "analyst"],
        "deep_dive": ["searcher", "analyst", "critic"]
      }
    },

    "wordpress": {
      "description": "WordPress / Studiokook",
      "triggers": ["wordpress", "wp", "сайт", "studiokook", "SEO", "плагин"],
      "skills": ["claude-wordpress-skills"],
      "roles": {
        "developer": {
          "description": "PHP, Code Snippets, REST API",
          "tools": ["Read", "Grep", "Glob", "Bash"]
        },
        "seo": {
          "description": "SEO audit, meta tags, structure",
          "tools": ["Read", "Grep", "Glob"]
        }
      },
      "team_presets": {
        "audit": ["developer", "seo"]
      },
      "notes": "Respect rules/constitution.md → WordPress Specific section"
    }
  },

  "escalation_rules": {
    "retry_threshold": 3,
    "file_count_threshold": 5,
    "competing_hypotheses": true
  },

  "_meta": {
    "extensibility": "Add domains by pattern. Router picks up automatically.",
    "agent_ref": "Reference to existing agents/ file. If present — use as base prompt for teammate.",
    "pattern_tracker": "Routing decisions go to patterns/ pipeline via pattern-analyzer.js."
  }
}
```

**Step 2: Validate JSON**

Run: `node -e "JSON.parse(require('fs').readFileSync('skills/task-router/registry.json', 'utf8')); console.log('Valid JSON')"`
Expected: "Valid JSON"

**Step 3: Commit**

```bash
git add skills/task-router/registry.json
git commit -m "feat(task-router): add registry.json with 4 domains"
```

---

### Task 1.4: Create template files

**Files:**
- Create: `skills/task-router/templates/n8n-debug.md`
- Create: `skills/task-router/templates/code-review.md`
- Create: `skills/task-router/templates/research.md`
- Create: `skills/task-router/templates/_template.md`

**Step 1: Create n8n-debug.md**

```markdown
---
name: n8n-debug
domain: n8n
preset: debug
teammates: 2
---

# n8n Debug Team

## Spawn
1. **analyzer** — collects execution logs, error patterns, data flow
2. **debugger** — checks Code nodes, expressions, connections

## Coordination
- Lead in Delegate mode (Shift+Tab)
- Teammates exchange findings via mailbox
- analyzer:findings → blocks → debugger:verify_fix
- Parallel work during investigation phase

## Context for each teammate
- Workflow number/name
- Problem description from user
- Reference to n8n skills (skills/n8n.md, skills/n8n-expert/)
```

**Step 2: Create code-review.md**

```markdown
---
name: code-review
domain: code
preset: review
teammates: 3
---

# Code Review Team

## Spawn
1. **security** — OWASP, injections, auth
2. **performance** — O(n), memory, bottlenecks
3. **quality** — DRY, patterns, readability (uses agents/code-reviewer.md)

## Coordination
- Each reviewer works independently
- Lead collects findings, removes duplicates
- Output: unified report by severity (CRITICAL → WARNING → INFO)

## Constitution compliance
- Format from agents/code-reviewer.md: severity + file:line + fix suggestion
```

**Step 3: Create research.md**

```markdown
---
name: research
domain: research
preset: explore
teammates: 2
---

# Research Team

## Spawn
1. **searcher** — data collection (uses agents/researcher.md)
2. **analyst** — analysis, comparison, conclusions

## Coordination
- searcher collects → sends findings via mailbox
- analyst processes and forms final report
- For deep_dive preset: add **critic** (devil's advocate)
```

**Step 4: Create _template.md**

```markdown
---
name: {domain}-{task_type}
domain: {domain}
preset: {preset_name}
teammates: 2
---

# {Domain} {Task Type} Team

## Spawn
1. **{role_1}** — {description}
2. **{role_2}** — {description}

## Coordination
{coordination rules}

## Context
{what to pass to each teammate}
```

**Step 5: Commit**

```bash
git add skills/task-router/templates/
git commit -m "feat(task-router): add 3 team templates + base template"
```

---

### Task 1.5: Update agents frontmatter

**Files:**
- Modify: `agents/code-reviewer.md:1-7`
- Modify: `agents/debugger.md:1-7`
- Modify: `agents/researcher.md:1-7`

**Step 1: Update code-reviewer.md**

Add after line 6 (`permissionMode: default`), before closing `---`:

```yaml
domain: code
role: quality
team_eligible: true
```

Final frontmatter:
```yaml
---
name: code-reviewer
description: Proactive code review agent. Use for reviewing code quality, security, and best practices.
tools: Read, Grep, Glob
model: sonnet
permissionMode: default
domain: code
role: quality
team_eligible: true
---
```

**Step 2: Update debugger.md**

Add after `permissionMode: default`:

```yaml
domain: code
role: debugger
team_eligible: true
```

**Step 3: Update researcher.md**

Add after `permissionMode: default`:

```yaml
domain: research
role: searcher
team_eligible: true
```

**Step 4: Commit**

```bash
git add agents/
git commit -m "feat(agents): add team_eligible frontmatter to all agents"
```

---

## Phase 2: Pattern Tracker Integration

### Task 2.1: Extend tracker.db schema

**Files:**
- Modify: `patterns/init-db.js`

**Step 1: Read current schema**

Need to check current init-db.js to understand existing schema.

**Step 2: Add routing columns**

Add to traces table creation (additive, no breaking changes):

```sql
routing_mode TEXT,      -- solo|subagent|team
routing_domain TEXT,    -- n8n|code|research|wordpress
routing_template TEXT,  -- n8n-debug|code-review|...
team_name TEXT,         -- team name (if team mode)
agent_role TEXT         -- lead|teammate-1|... (if team)
```

**Step 3: Commit**

```bash
git add patterns/init-db.js
git commit -m "feat(patterns): add routing columns to traces schema"
```

---

### Task 2.2: Extend pattern-analyzer.js

**Files:**
- Modify: `hooks/post-tool-use/pattern-analyzer.js`

**Step 1: Add routing data to trace**

After line 87 (project field), add routing extraction:

```javascript
// Routing data (if present in input)
routing_mode: data.routing?.mode || null,
routing_domain: data.routing?.domain || null,
routing_template: data.routing?.template || null,
team_name: data.routing?.team_name || null,
agent_role: data.routing?.agent_role || null
```

**Step 2: Update INSERT statement**

Extend INSERT to include new columns.

**Step 3: Commit**

```bash
git add hooks/post-tool-use/pattern-analyzer.js
git commit -m "feat(pattern-analyzer): capture routing data in traces"
```

---

### Task 2.3: Add P5 pattern to detector.js

**Files:**
- Modify: `patterns/detector.js`

**Step 1: Add P5: Routing Mismatch detection**

After P4 function (around line 178), add:

```javascript
// P5: Routing Mismatch Detection
// Team spawned but task solved <2 min → should have been solo
// Solo failed >3 times → should have been team
function detectRoutingMismatch(db, sessionId) {
    // Check if team was used for simple tasks
    const teamResult = db.exec(`
        SELECT routing_template, COUNT(*) as ops,
               (MAX(timestamp) - MIN(timestamp)) as duration_sec
        FROM traces
        WHERE session_id = ${escapeSQL(sessionId)}
          AND routing_mode = 'team'
        GROUP BY routing_template
        HAVING duration_sec < 120 AND ops < 5
    `);

    if (teamResult.length && teamResult[0].values.length) {
        const [template, ops, duration] = teamResult[0].values[0];
        return {
            type: 'P5',
            subtype: 'team_overuse',
            severity: 'low',
            template: template,
            duration_sec: duration,
            message: `ROUTING MISMATCH: Team "${template}" used for task that completed in ${duration}s. Consider solo next time.`
        };
    }

    return null;
}
```

**Step 2: Add P5 to detection loop**

Add to detectors call around line 225.

**Step 3: Commit**

```bash
git add patterns/detector.js
git commit -m "feat(detector): add P5 routing mismatch pattern"
```

---

### Task 2.4: Update reporter.js for routing analytics

**Files:**
- Modify: `patterns/reporter.js`

**Step 1: Add routing stats section**

Add function to report routing mode distribution and efficiency.

**Step 2: Commit**

```bash
git add patterns/reporter.js
git commit -m "feat(reporter): add routing mode analytics"
```

---

## Phase 3: Verification

### Task 3.1: Verify all files exist

**Step 1: Check structure**

Run: `find skills/task-router -type f | sort`
Expected:
```
skills/task-router/SKILL.md
skills/task-router/registry.json
skills/task-router/templates/_template.md
skills/task-router/templates/code-review.md
skills/task-router/templates/n8n-debug.md
skills/task-router/templates/research.md
```

**Step 2: Verify agents have new fields**

Run: `grep -l "team_eligible" agents/*.md | wc -l`
Expected: 3

---

### Task 3.2: Verify JSON validity

**Step 1: Validate registry.json**

Run: `node -e "JSON.parse(require('fs').readFileSync('skills/task-router/registry.json', 'utf8')); console.log('Valid')"`
Expected: "Valid"

**Step 2: Validate settings.json**

Run: `node -e "JSON.parse(require('fs').readFileSync('settings.json', 'utf8')); console.log('Valid')"`
Expected: "Valid"

---

### Task 3.3: Final commit

**Step 1: Check status**

Run: `git status`
Expected: All changes committed

**Step 2: Create summary commit if needed**

```bash
git add -A
git commit -m "feat(task-router): complete Phase 0-2 implementation

- Add task-router skill with SKILL.md and registry.json
- Add 4 domains: n8n, code, research, wordpress
- Add 3 team templates + base template
- Extend agents/ with team_eligible frontmatter
- Integrate with Pattern Tracker (schema + P5 pattern)
- Update CLAUDE.md and settings.json

Refs: task-router-spec-v2.md"
```

---

## Checklist (constitution.md compliance)

- [ ] No .env modifications
- [ ] No hardcoded secrets
- [ ] Additive changes only — nothing deleted
- [ ] settings.json → only +1 env variable
- [ ] CLAUDE.md → only +2 lines
- [ ] agents/ → existing fields untouched
- [ ] hooks/ → no new hooks added
- [ ] rules/ → not modified
- [ ] Escalation rule respected: >3 files → plan first ✓
