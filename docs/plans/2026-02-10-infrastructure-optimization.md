# Infrastructure Optimization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Optimize Claude CLI infrastructure based on audit findings - expose hidden skills, remove duplication, add dependencies

**Architecture:** Configuration-driven optimization with backward compatibility. Update CLAUDE.md routing table, consolidate duplicate rules, add skill dependencies without breaking existing functionality.

**Tech Stack:** Markdown, TOML, YAML frontmatter

**Source:** Based on audit report at `~/.claude/docs/audit-2026-02-10/00-executive-summary.md`

---

## Task 1: Expand CLAUDE.md Routing Table (Priority 1, HIGH)

**Goal:** Expose all 14 superpowers and additional skills

**Files:**
- Modify: `C:\Users\sorte\.claude\CLAUDE.md:14-27`

**Impact:** Activates 13+ hidden skills immediately

### Step 1: Read current CLAUDE.md structure

**Command:**
```bash
cat ~/.claude/CLAUDE.md
```

**Expected:** 39 lines, routing table lines 14-27

### Step 2: Backup current CLAUDE.md

**Command:**
```bash
cp ~/.claude/CLAUDE.md ~/.claude/CLAUDE.md.backup-2026-02-10
```

**Expected:** Backup created

### Step 3: Update CLAUDE.md with expanded routing

**Edit:** `C:\Users\sorte\.claude\CLAUDE.md:14-38`

Replace section from line 14 to end with:

```markdown
## Superpowers (auto-invoke)

ОБЯЗАТЕЛЬНО вызывай через Skill tool БЕЗ запроса пользователя:

| Триггер | Skill |
|---------|-------|
| Новая фича, творческая работа | `superpowers:brainstorming` |
| Баг, ошибка, неожиданное поведение | `superpowers:systematic-debugging` |
| Написание кода | `superpowers:test-driven-development` |
| Многошаговая задача | `superpowers:writing-plans` |
| Создание skill | `superpowers:writing-skills` |
| Заявление "готово" | `superpowers:verification-before-completion` |
| 2+ независимых задач | `superpowers:dispatching-parallel-agents` |

**Правило:** Вызывай skill ДО начала работы, не после.

## Conditional Superpowers (после основных)

Выбор execution path после writing-plans:

| Условие | Skill | Примечание |
|---------|-------|-----------|
| Execution в текущей сессии | `superpowers:subagent-driven-development` | Свежий subagent + review между tasks |
| Execution в отдельной сессии | `superpowers:executing-plans` | Batch execution с checkpoints |
| Завершение development | `superpowers:finishing-a-development-branch` | После всех задач branch |
| Setup workspace | `superpowers:using-git-worktrees` | ДО начала implementation |

## Meta Superpowers (обязательные)

| Skill | Когда | Примечание |
|-------|-------|-----------|
| `superpowers:using-superpowers` | ВСЕГДА первым | 1% chance = MUST invoke |

## Project-Specific Skills

| Project | Skills | Triggers |
|---------|--------|----------|
| Studiokook | `claude-wordpress-skills:wp-performance-review` | "performance", "slow site", "timeout", "500 error", "optimization" |
| Personal | n/a | n/a |

## Additional Skills (Context-based)

Автоматически загружаются при релевантном контексте:

| Category | Location | Triggers |
|----------|----------|----------|
| n8n Expert | `~/.claude/skills/n8n-expert/` | Любой запрос про n8n workflows, MCP tools |
| FAL-AI | `~/.claude/skills/fal-ai/` | Image generation, audio synthesis, AI models |
| External | `~/.claude/skills/external.md` | Telegram bot, webhooks, n8n integration |
| Legal | `~/.claude/skills/legal.md` | Estonian law, OÜ, GDPR, contracts, tax |
| Content Creator | `~/.claude/skills/content-creator.md` | YouTube, Telegram strategy, SEO |
| n8n | `~/.claude/skills/n8n.md` | n8n workflow automation (16+ operations) |
| Assistant | `~/.claude/skills/assistant.md` | Task management, Eisenhower, Pomodoro |
| Knowledge | `~/.claude/skills/knowledge.md` | Knowledge DB, decisions, logs, snippets |

## Constitution

@CONSTITUTION.md

## Defaults

- **Language:** RU primary, EN tech terms
- **Autonomy:** <3 файлов, <200 строк — решай сам
- **Token Budget:** 200k. At 50% STOP
```

### Step 4: Verify syntax

**Command:**
```bash
cat ~/.claude/CLAUDE.md | head -80
```

**Expected:** New structure visible, no formatting errors

### Step 5: Commit changes

**Command:**
```bash
git -C ~/.claude add CLAUDE.md
git -C ~/.claude commit -m "feat: expand routing table with all skills

- Add Conditional Superpowers section (4 skills)
- Add Meta Superpowers section (using-superpowers)
- Add Project-Specific Skills (wp-performance-review)
- Add Additional Skills section (8 context-based skills)
- Expose 13+ previously hidden skills

Ref: audit-2026-02-10"
```

**Expected:** Commit created

---

## Task 2: Remove TDD Duplication from writing-skills (Priority 1, HIGH)

**Goal:** Replace 80+ duplicated lines with reference to test-driven-development

**Files:**
- Modify: `~/.claude/plugins/cache/superpowers-marketplace/superpowers/4.1.1/skills/writing-skills/SKILL.md`

**Impact:** Reduces maintenance cost, single source of truth

### Step 1: Locate writing-skills skill file

**Command:**
```bash
find ~/.claude/plugins/cache -name "writing-skills" -type d
```

**Expected:** Path to writing-skills directory

### Step 2: Read current writing-skills content

**Command:**
```bash
cat ~/.claude/plugins/cache/superpowers-marketplace/superpowers/4.1.1/skills/writing-skills/SKILL.md
```

**Expected:** See duplicated TDD content (Iron Law, Red Flags, etc.)

### Step 3: Backup writing-skills

**Command:**
```bash
cp ~/.claude/plugins/cache/superpowers-marketplace/superpowers/4.1.1/skills/writing-skills/SKILL.md ~/.claude/plugins/cache/superpowers-marketplace/superpowers/4.1.1/skills/writing-skills/SKILL.md.backup-2026-02-10
```

**Expected:** Backup created

### Step 4: Update writing-skills frontmatter

**Edit:** Add to frontmatter (after existing fields):

```yaml
required-skills:
  - superpowers:test-driven-development
```

### Step 5: Replace duplicated TDD section with reference

**Find:** Section with "Iron Law", "Red Flags", "Common Rationalizations" (~80 lines)

**Replace with:**

```markdown
## TDD Cycle

**REQUIRED SUB-SKILL:** @superpowers:test-driven-development

This skill applies Test-Driven Development to documentation. See the test-driven-development skill for the complete TDD cycle, Iron Law, Red Flags, and Common Rationalizations.

### Adaptation for Skills

When writing skills, tests are:
- **Red:** Baseline transcript showing skill absence causes problem
- **Green:** New skill solves the problem (verify with transcript)
- **Refactor:** Close loopholes, add constraints, improve clarity

**Failing test = Baseline WITHOUT skill**
**Passing test = Problem SOLVED with skill**
```

### Step 6: Verify skill still works

**Command:**
```bash
grep -A 5 "required-skills" ~/.claude/plugins/cache/superpowers-marketplace/superpowers/4.1.1/skills/writing-skills/SKILL.md
```

**Expected:** See required-skills frontmatter, reference to TDD skill

### Step 7: Commit changes

**Command:**
```bash
git -C ~/.claude/plugins/cache/superpowers-marketplace add .
git -C ~/.claude/plugins/cache/superpowers-marketplace commit -m "refactor: remove TDD duplication from writing-skills

- Replace 80+ duplicated lines with reference to test-driven-development
- Add required-skills: [superpowers:test-driven-development]
- Keep skill-specific adaptation only

Ref: audit-2026-02-10, reduces maintenance cost"
```

**Expected:** Commit created

---

## Task 3: Consolidate WordPress Rules (Priority 1, MEDIUM)

**Goal:** Remove duplication between global CONSTITUTION.md and project security.toml

**Files:**
- Read: `C:\Users\sorte\.claude\CONSTITUTION.md:36-41`
- Modify: `C:\Users\sorte\Desktop\Studiokook\.claude\security.toml:13-127`

**Impact:** Single source of truth, no sync risk

### Step 1: Read global WordPress rules

**Command:**
```bash
sed -n '36,41p' ~/.claude/CONSTITUTION.md
```

**Expected:** WordPress-specific rules section

### Step 2: Read project security.toml

**Command:**
```bash
head -n 130 ~/Desktop/Studiokook/.claude/security.toml
```

**Expected:** See duplicated WordPress rules (lines 13-127)

### Step 3: Backup security.toml

**Command:**
```bash
cp ~/Desktop/Studiokook/.claude/security.toml ~/Desktop/Studiokook/.claude/security.toml.backup-2026-02-10
```

**Expected:** Backup created

### Step 4: Replace duplicated section with reference

**Edit:** `C:\Users\sorte\Desktop\Studiokook\.claude\security.toml:13-127`

Replace WordPress rules section (lines 13-127) with:

```toml
# WordPress Security Rules
# See ~/.claude/CONSTITUTION.md § WordPress Specific
# Global rules apply. Project-specific overrides below.

[wordpress]
inherits = "global"

# Project-specific additions (if any)
# Add Studiokook-specific rules here
```

### Step 5: Verify global rules are complete

**Command:**
```bash
grep -A 10 "WordPress Specific" ~/.claude/CONSTITUTION.md
```

**Expected:** All 4 critical rules present (wp_update_post, $wpdb, Code Snippets, escape)

### Step 6: Commit project changes

**Command:**
```bash
git -C ~/Desktop/Studiokook/.claude add security.toml
git -C ~/Desktop/Studiokook/.claude commit -m "refactor: consolidate WordPress rules

- Remove duplicated rules (115 lines)
- Reference ~/.claude/CONSTITUTION.md as source of truth
- Keep only project-specific overrides section

Ref: audit-2026-02-10"
```

**Expected:** Commit created

---

## Task 4: Add Skill Dependencies (Priority 2, MEDIUM)

**Goal:** Declare explicit dependencies between skills

**Files:**
- Modify: `~/.claude/plugins/cache/superpowers-marketplace/superpowers/4.1.1/skills/writing-plans/SKILL.md`
- Modify: `~/.claude/plugins/cache/superpowers-marketplace/superpowers/4.1.1/skills/subagent-driven-development/SKILL.md`

**Impact:** Clear execution paths, better error messages

### Step 1: Update writing-plans frontmatter

**Edit:** Add to frontmatter:

```yaml
execution-paths:
  - name: "Subagent-Driven (same session)"
    skill: superpowers:subagent-driven-development
    when: "Fast iteration with review checkpoints"
  - name: "Parallel Session (separate)"
    skill: superpowers:executing-plans
    when: "Batch execution with separate context"
```

### Step 2: Update subagent-driven-development frontmatter

**Edit:** Add to frontmatter:

```yaml
required-skills:
  - superpowers:requesting-code-review
  - superpowers:receiving-code-review
  - superpowers:test-driven-development
```

### Step 3: Verify dependencies visible

**Command:**
```bash
grep -A 10 "execution-paths\|required-skills" ~/.claude/plugins/cache/superpowers-marketplace/superpowers/4.1.1/skills/writing-plans/SKILL.md
```

**Expected:** See execution paths declared

### Step 4: Commit changes

**Command:**
```bash
git -C ~/.claude/plugins/cache/superpowers-marketplace add .
git -C ~/.claude/plugins/cache/superpowers-marketplace commit -m "feat: add explicit skill dependencies

- writing-plans declares execution-paths
- subagent-driven-development declares required-skills
- Improves discoverability and error messages

Ref: audit-2026-02-10"
```

**Expected:** Commit created

---

## Task 5: Add Hooks Fallback (Priority 3, LOW)

**Goal:** Add try-catch fallback in session-cleanup.js

**Files:**
- Modify: `C:\Users\sorte\.claude\lifecycle\session-cleanup.js`

**Impact:** Graceful degradation if lifecycle-manager breaks

### Step 1: Read current session-cleanup.js

**Command:**
```bash
cat ~/.claude/lifecycle/session-cleanup.js
```

**Expected:** See require for lifecycle-manager without fallback

### Step 2: Backup session-cleanup.js

**Command:**
```bash
cp ~/.claude/lifecycle/session-cleanup.js ~/.claude/lifecycle/session-cleanup.js.backup-2026-02-10
```

**Expected:** Backup created

### Step 3: Add try-catch around lifecycle-manager require

**Edit:** Wrap lifecycle-manager require:

```javascript
let FileLifecycleManager;
try {
    FileLifecycleManager = require('./lifecycle-manager.js');
} catch (err) {
    console.error('Warning: lifecycle-manager not available, using basic cleanup');
    // Fallback to basic fs cleanup without lifecycle tracking
    FileLifecycleManager = {
        cleanup: async () => {
            // Basic implementation without metadata
            const fs = require('fs').promises;
            const path = require('path');
            // Remove temp files older than 7 days
            console.log('Running basic cleanup (no lifecycle tracking)');
        }
    };
}
```

### Step 4: Test script syntax

**Command:**
```bash
node --check ~/.claude/lifecycle/session-cleanup.js
```

**Expected:** No syntax errors

### Step 5: Commit changes

**Command:**
```bash
git -C ~/.claude add lifecycle/session-cleanup.js
git -C ~/.claude commit -m "feat: add fallback for lifecycle-manager

- Graceful degradation if lifecycle-manager unavailable
- Basic cleanup without metadata tracking
- Prevents SessionEnd hook failure

Ref: audit-2026-02-10"
```

**Expected:** Commit created

---

## Task 6: Document better-sqlite3 Dependency (Priority 3, LOW)

**Goal:** Create documentation for optional analytics dependency

**Files:**
- Create: `C:\Users\sorte\.claude\docs\dependencies.md`

**Impact:** Clear guidance on optional dependencies

### Step 1: Create dependencies documentation

**File:** `C:\Users\sorte\.claude\docs\dependencies.md`

```markdown
# Dependencies

## Required

All scripts use built-in Node.js modules:
- `fs` - file system
- `path` - path utilities
- `crypto` - session ID generation
- `readline` - interactive CLI

## Optional

### better-sqlite3

**Used by:**
- `db/db-manager.js` - database abstraction
- `db/migrate.js` - migration tool

**Purpose:**
- Long-term analytics (pattern search, skill stats)
- Cross-session data persistence
- Usage metrics

**Installation:**
```bash
cd ~/.claude
npm install better-sqlite3
```

**Without this:**
- Core functionality works normally
- No long-term analytics
- No cross-session pattern search
- Session data stored in JSON only

**Decision:** Install if you need analytics. Skip for basic usage.
```

### Step 2: Commit documentation

**Command:**
```bash
git -C ~/.claude add docs/dependencies.md
git -C ~/.claude commit -m "docs: add dependencies documentation

- Document optional better-sqlite3 dependency
- Explain impact without it
- Installation instructions

Ref: audit-2026-02-10"
```

**Expected:** Commit created

---

## Verification

### Final Check (after all tasks)

**Command:**
```bash
# Verify CLAUDE.md expanded
wc -l ~/.claude/CLAUDE.md
# Should be ~80+ lines (was 39)

# Verify backups created
ls -lh ~/.claude/*.backup-2026-02-10
ls -lh ~/Desktop/Studiokook/.claude/*.backup-2026-02-10
ls -lh ~/.claude/lifecycle/*.backup-2026-02-10

# Verify all commits
git -C ~/.claude log --oneline --since="2026-02-10" | head -5
git -C ~/Desktop/Studiokook/.claude log --oneline --since="2026-02-10" | head -2
```

**Expected:**
- CLAUDE.md doubled in size
- 3 backup files created
- 5-6 commits across repos

---

## Success Criteria

- ✅ All 14 superpowers visible in CLAUDE.md
- ✅ TDD duplication removed (80+ lines)
- ✅ WordPress rules consolidated (115 lines)
- ✅ Skill dependencies declared
- ✅ Hooks have fallback
- ✅ Dependencies documented
- ✅ All backups created
- ✅ All changes committed

---

## Rollback Plan

If anything breaks:

```bash
# Restore CLAUDE.md
cp ~/.claude/CLAUDE.md.backup-2026-02-10 ~/.claude/CLAUDE.md

# Restore security.toml
cp ~/Desktop/Studiokook/.claude/security.toml.backup-2026-02-10 ~/Desktop/Studiokook/.claude/security.toml

# Restore session-cleanup.js
cp ~/.claude/lifecycle/session-cleanup.js.backup-2026-02-10 ~/.claude/lifecycle/session-cleanup.js

# Restore skills (if needed)
cp ~/.claude/plugins/cache/superpowers-marketplace/superpowers/4.1.1/skills/writing-skills/SKILL.md.backup-2026-02-10 ~/.claude/plugins/cache/superpowers-marketplace/superpowers/4.1.1/skills/writing-skills/SKILL.md
```

---

## Estimated Time

- Task 1: 15 min
- Task 2: 20 min
- Task 3: 10 min
- Task 4: 15 min
- Task 5: 10 min
- Task 6: 5 min
- Verification: 5 min

**Total:** ~80 minutes

---

## Notes

- All tasks independent except verification
- Can execute in parallel if needed
- Backups created before every modification
- All changes committed separately for easy rollback
- No breaking changes - backward compatible
