# Architecture Cleanup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement critical and important recommendations from architecture audit to improve security, maintainability, and performance of ~/.claude/ structure.

**Architecture:** Consolidate hook scripts to single location, secure credentials, remove node_modules, normalize paths in settings.json, reduce CLAUDE.md size.

**Tech Stack:** Node.js, SQLite (sql.js), PowerShell/Bash, Windows Credential Manager

---

## Phase 0: Critical Security Fixes

### Task 1: Secure Credentials

**Files:**
- Remove: `~/.claude/.credentials.json`
- Modify: `~/.claude/.gitignore`

**Step 1: Verify .gitignore already excludes credentials**

Run: `cat ~/.claude/.gitignore | grep -i cred`
Expected: Line containing `.credentials.json` or `*.credentials*`

**Step 2: Create backup of current credentials structure (NOT content)**

```bash
echo "credentials_backup_created: $(date)" > ~/.claude/docs/audit-2026-02-10/credentials-migration-log.txt
```

**Step 3: Document migration path for user**

The credentials file contains OAuth tokens for Claude. These are managed by Claude Code itself and regenerated on login. The file will be recreated by Claude Code when needed.

**Action for user:** Delete `.credentials.json` manually. Claude Code will prompt for re-authentication on next session. This is the safest approach as tokens are automatically refreshed.

**Step 4: Verify .gitignore**

Run: `cat ~/.claude/.gitignore`
Expected: Contains `.credentials.json` entry

**Step 5: Commit gitignore if needed**

```bash
cd ~/.claude && git add .gitignore && git commit -m "chore: ensure credentials excluded from git"
```

---

### Task 2: Remove node_modules from ~/.claude/

**Files:**
- Remove: `~/.claude/node_modules/`
- Modify: `~/.claude/package.json` (optional)

**Step 1: Check what sql.js is used for**

Run: `grep -r "sql.js\|sql\.js\|require.*sql" ~/.claude/*.js ~/.claude/**/*.js 2>/dev/null | head -20`
Expected: Find files using sql.js

**Step 2: Install sql.js globally or verify alternative**

Option A - Global install:
```bash
npm install -g sql.js
```

Option B - Keep minimal (preferred for sql.js):
sql.js is a special case - it's a WASM-based SQLite that needs local node_modules.

**Decision:** Move node_modules to `~/.claude/db/node_modules/` and update scripts to reference that path. This keeps npm deps isolated to db functionality.

**Step 3: Move node_modules**

```bash
mv ~/.claude/node_modules ~/.claude/db/
mv ~/.claude/package.json ~/.claude/db/
mv ~/.claude/package-lock.json ~/.claude/db/
```

**Step 4: Update scripts that require sql.js**

Files to check: `patterns/*.js`, `db/*.js`, `lifecycle/*.js`

Each file using `require('sql.js')` needs path update to `require('../db/node_modules/sql.js')` or relative path.

**Step 5: Add db/node_modules to .gitignore**

```bash
echo "db/node_modules/" >> ~/.claude/.gitignore
```

**Step 6: Commit**

```bash
git add -A && git commit -m "refactor: move node_modules to db/ directory"
```

---

### Task 3: Normalize Windows Paths in settings.json

**Files:**
- Modify: `~/.claude/settings.json`

**Step 1: Read current settings.json**

Run: `cat ~/.claude/settings.json`
Expected: Hardcoded paths like `C:\\Users\\sorte\\.claude\\...`

**Step 2: Create portable path version**

Replace all instances of `C:\\Users\\sorte\\.claude\\` with relative paths using `node` command:

```javascript
// In hook commands, use: node "${HOME}/.claude/..."
// Or use environment variable expansion
```

**Note:** Claude Code hooks on Windows may require absolute paths. Test with:
- `node %USERPROFILE%\\.claude\\...` (Windows cmd)
- `node $HOME/.claude/...` (Git Bash)

**Step 3: Update settings.json with portable paths**

Replace pattern:
- FROM: `"node C:\\Users\\sorte\\.claude\\memory\\session-init.js"`
- TO: `"node ~/.claude/memory/session-init.js"` (if Git Bash compatible)

Or use `$HOME` environment variable.

**Step 4: Test hook execution**

Run: `node ~/.claude/memory/session-init.js`
Expected: Script runs without path errors

**Step 5: Commit**

```bash
git add settings.json && git commit -m "refactor: use portable paths in settings.json"
```

---

## Phase 1: Consolidation

### Task 4: Consolidate Hook Scripts

**Files:**
- Create: `~/.claude/hooks/session-start/` directory
- Create: `~/.claude/hooks/session-end/` directory
- Create: `~/.claude/hooks/post-tool-use/` directory
- Create: `~/.claude/hooks/pre-tool-use/` directory
- Create: `~/.claude/hooks/stop/` directory
- Create: `~/.claude/hooks/pre-compact/` directory
- Move scripts from: `memory/`, `lifecycle/`, `scripts/`, `patterns/`, `security/`

**Current hook locations (from settings.json):**

| Event | Script | Current Location |
|-------|--------|-----------------|
| SessionStart | session-init.js | memory/ |
| SessionStart | session-scan.js | lifecycle/ |
| SessionEnd | session-cleanup.js | lifecycle/ |
| SessionEnd | auto-cleanup.js | scripts/ |
| PreToolUse (Bash) | validate-command.js | security/ |
| PreToolUse (Write\|Edit) | validate-file-access.js | security/ |
| PostToolUse | audit-log.js | security/ |
| PostToolUse | analyzer.js | patterns/ |
| Stop | detector.js | patterns/ |
| PreCompact | save-state.js | memory/ |
| PreCompact | reporter.js | patterns/ |
| SubagentStart | audit-log.js | security/ |

**Step 1: Create hooks directory structure**

```bash
mkdir -p ~/.claude/hooks/{session-start,session-end,post-tool-use,pre-tool-use,stop,pre-compact,subagent-start}
```

**Step 2: Move SessionStart hooks**

```bash
cp ~/.claude/memory/session-init.js ~/.claude/hooks/session-start/init-memory.js
cp ~/.claude/lifecycle/session-scan.js ~/.claude/hooks/session-start/scan-lifecycle.js
```

**Step 3: Move SessionEnd hooks**

```bash
cp ~/.claude/lifecycle/session-cleanup.js ~/.claude/hooks/session-end/cleanup.js
cp ~/.claude/scripts/auto-cleanup.js ~/.claude/hooks/session-end/auto-cleanup.js
```

**Step 4: Move PreToolUse hooks**

```bash
cp ~/.claude/security/validate-command.js ~/.claude/hooks/pre-tool-use/validate-bash.js
cp ~/.claude/security/validate-file-access.js ~/.claude/hooks/pre-tool-use/validate-file-access.js
```

**Step 5: Move PostToolUse hooks**

```bash
cp ~/.claude/security/audit-log.js ~/.claude/hooks/post-tool-use/audit-log.js
cp ~/.claude/patterns/analyzer.js ~/.claude/hooks/post-tool-use/pattern-analyzer.js
```

**Step 6: Move Stop hooks**

```bash
cp ~/.claude/patterns/detector.js ~/.claude/hooks/stop/pattern-detector.js
```

**Step 7: Move PreCompact hooks**

```bash
cp ~/.claude/memory/save-state.js ~/.claude/hooks/pre-compact/save-state.js
cp ~/.claude/patterns/reporter.js ~/.claude/hooks/pre-compact/pattern-reporter.js
```

**Step 8: Move SubagentStart hooks**

```bash
cp ~/.claude/security/audit-log.js ~/.claude/hooks/subagent-start/audit-log.js
```

**Step 9: Update settings.json with new paths**

Update all hook command paths to use `~/.claude/hooks/...` structure.

**Step 10: Test each hook**

Run each hook script manually to verify it works from new location.

**Step 11: Remove old copies (after verification)**

Keep originals until all hooks verified working.

**Step 12: Commit**

```bash
git add hooks/ settings.json && git commit -m "refactor: consolidate all hook scripts to hooks/ directory"
```

---

### Task 5: Consolidate Cleanup Logic

**Files:**
- Modify: `~/.claude/hooks/session-end/cleanup.js`
- Remove: `~/.claude/cleanup.ps1`
- Remove: `~/.claude/scripts/auto-cleanup.js` (after merging)

**Step 1: Analyze current cleanup scripts**

Read and compare:
- `lifecycle/session-cleanup.js`
- `scripts/auto-cleanup.js`
- `cleanup.ps1`

**Step 2: Merge functionality into single cleanup.js**

Create unified cleanup that:
1. Cleans temp files
2. Rotates logs
3. Updates lifecycle metadata
4. Reports session stats

**Step 3: Update SessionEnd hook to use single cleanup**

Remove duplicate hook entries in settings.json.

**Step 4: Delete redundant cleanup files**

```bash
rm ~/.claude/cleanup.ps1
rm ~/.claude/scripts/auto-cleanup.js
```

**Step 5: Commit**

```bash
git add -A && git commit -m "refactor: consolidate cleanup to single script"
```

---

### Task 6: Reduce CLAUDE.md Size

**Files:**
- Modify: `~/.claude/CLAUDE.md`
- Create: `~/.claude/docs/routing.md`
- Create: `~/.claude/docs/skills-reference.md`

**Current CLAUDE.md:** 78 lines, 3635 bytes (~1500 tokens)

**Target:** <50 lines, <2KB

**Step 1: Extract Projects table to docs/routing.md**

Move project routing details to separate file.

**Step 2: Extract Skills tables to docs/skills-reference.md**

Move detailed skill descriptions.

**Step 3: Simplify CLAUDE.md to essential routing only**

Keep:
- One-liner description
- Link to CONSTITUTION.md
- Link to docs/routing.md
- Link to docs/skills-reference.md
- Defaults section

**Step 4: Verify Claude still loads context properly**

Test in new session.

**Step 5: Commit**

```bash
git add CLAUDE.md docs/ && git commit -m "refactor: reduce CLAUDE.md size, extract details to docs/"
```

---

## Phase 2: Optimization

### Task 7: Add Token Budget Monitoring

**Files:**
- Modify: `~/.claude/hooks/session-start/init-memory.js`

**Step 1: Add token counting to session init**

Estimate tokens loaded at session start and log warning if >5% of 200K.

**Step 2: Create baseline measurement**

Run session init and measure total context loaded.

**Step 3: Commit**

```bash
git add hooks/session-start/ && git commit -m "feat: add token budget monitoring to session init"
```

---

### Task 8: Move CONSTITUTION.md to rules/

**Files:**
- Move: `~/.claude/CONSTITUTION.md` → `~/.claude/rules/constitution.md`
- Modify: `~/.claude/CLAUDE.md` (update reference)

**Step 1: Move file**

```bash
mv ~/.claude/CONSTITUTION.md ~/.claude/rules/constitution.md
```

**Step 2: Update CLAUDE.md reference**

Change `@CONSTITUTION.md` to `@rules/constitution.md`

**Step 3: Commit**

```bash
git add CLAUDE.md rules/ && git commit -m "refactor: move CONSTITUTION.md to rules/"
```

---

### Task 9: Consolidate Small Directories

**Files:**
- Move: `~/.claude/plans/` → `~/.claude/docs/plans/`
- Move: `~/.claude/ARCHITECTURE.md` → `~/.claude/docs/`
- Move: `~/.claude/ARCHITECTURE-STATUS.md` → `~/.claude/docs/`
- Move: `~/.claude/SKILLS_REFERENCE.md` → `~/.claude/docs/`
- Move: `~/.claude/stats-cache.json` → `~/.claude/db/`

**Step 1: Move documentation files**

```bash
mv ~/.claude/ARCHITECTURE.md ~/.claude/docs/
mv ~/.claude/ARCHITECTURE-STATUS.md ~/.claude/docs/
mv ~/.claude/SKILLS_REFERENCE.md ~/.claude/docs/
```

**Step 2: Move stats cache**

```bash
mv ~/.claude/stats-cache.json ~/.claude/db/
```

**Step 3: Merge plans if exists**

```bash
# If plans/ has content, merge with docs/plans/
cp -r ~/.claude/plans/* ~/.claude/docs/plans/ 2>/dev/null
rm -r ~/.claude/plans 2>/dev/null
```

**Step 4: Commit**

```bash
git add -A && git commit -m "refactor: consolidate docs and move stats to db/"
```

---

### Task 10: Create SKILL.md for Pattern Tracker

**Files:**
- Create: `~/.claude/skills/pattern-tracker/SKILL.md`

**Step 1: Create skill directory**

```bash
mkdir -p ~/.claude/skills/pattern-tracker
```

**Step 2: Write SKILL.md**

```markdown
---
name: pattern-tracker
description: Pattern tracking and correction system. Use when analyzing errors, failures, loops, or optimizing agent behavior.
---

# Pattern Tracker

System for detecting, tracking, and correcting behavioral patterns.

## Commands

- `/pattern-stats` - View pattern statistics
- `/pattern-history` - View pattern history
- `/pattern-mark` - Mark a pattern
- `/pattern-corrections` - View corrections

## When to Use

- Debugging repeated failures
- Analyzing session behavior
- Improving agent effectiveness

## Files

- `patterns/analyzer.js` - Real-time pattern analysis
- `patterns/detector.js` - Pattern detection
- `patterns/reporter.js` - Pattern reporting
- `patterns/tracker.db` - SQLite database
```

**Step 3: Commit**

```bash
git add skills/pattern-tracker/ && git commit -m "feat: add SKILL.md for Pattern Tracker"
```

---

## Verification Checklist

After completing all tasks, verify:

| # | Check | Command |
|---|-------|---------|
| 1 | No .credentials.json in git | `git ls-files \| grep cred` |
| 2 | node_modules in db/ only | `ls ~/.claude/node_modules 2>/dev/null \|\| echo "OK"` |
| 3 | Hooks in hooks/ directory | `ls ~/.claude/hooks/` |
| 4 | settings.json has portable paths | `grep -c "C:\\\\" ~/.claude/settings.json` (should be 0) |
| 5 | CLAUDE.md < 50 lines | `wc -l ~/.claude/CLAUDE.md` |
| 6 | Single cleanup script | `ls ~/.claude/hooks/session-end/` |
| 7 | CONSTITUTION in rules/ | `ls ~/.claude/rules/constitution.md` |
| 8 | All hooks execute | Test each hook manually |

---

## Rollback Plan

If issues occur:

1. Git history preserves all changes: `git log --oneline`
2. Revert specific commit: `git revert <commit-hash>`
3. Credentials: Claude Code regenerates on login
4. settings.json backup: `.claude/` has git history

---

## Post-Implementation

After completing this plan:

1. Run full session to verify all hooks work
2. Check lifecycle management still functions
3. Verify Pattern Tracker still works
4. Document any issues in `docs/audit-2026-02-10/`
