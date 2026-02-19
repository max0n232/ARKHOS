---
name: wp-problem-solver
description: "MANDATORY before any WordPress PHP code changes. Enforces root cause analysis (5 Whys), checks existing snippets registry, proposes solutions before applying. Prevents code bloat and technical debt accumulation."
triggers:
  - "PHP snippet"
  - "add_action"
  - "add_filter"
  - "function fix"
  - "Code Snippets"
  - "workaround"
  - "костыль"
  - "исправить"
  - "fix WordPress"
---

# WP Problem Solver

## When to use

This skill MUST be invoked before:

- Creating any new PHP code/snippet for WordPress
- Adding hooks (add_action, add_filter)
- Fixing WordPress issues with code
- Modifying existing snippets

## Inputs required

1. **Problem description** — What symptom is the user seeing?
2. **Where it happens** — Page, admin, frontend, specific function?
3. **When it started** — After update? After change?

## Procedure

### 1) Root Cause Analysis (5 Whys)

Before ANY code change, complete the 5 Whys analysis:

```
SYMPTOM: [What does the user see?]
WHY 1: Why does this happen? → [Immediate cause]
WHY 2: Why does THAT happen? → [Deeper cause]
WHY 3: Why does THAT happen? → [Even deeper]
WHY 4: Why does THAT happen? → [Root level]
WHY 5: ROOT CAUSE → [Actual source of problem]
```

Read: `references/five-whys.md`

### 2) Check Existing Snippets

MANDATORY: Check `knowledge/snippets-registry.json` before creating new code.

Questions to answer:
- Is there already a snippet solving this?
- Can existing snippet be extended?
- Will new snippet conflict with existing?

If similar exists → modify, don't duplicate.

### 3) Solution Classification

Classify your proposed solution:

| Type | When to use | Lifecycle |
|------|-------------|-----------|
| **fix** | Addresses root cause | Permanent |
| **workaround** | Symptom treatment, root cause known but unfixable now | Temporary, needs cleanup_after date |
| **enhancement** | New functionality | Permanent |

Read: `references/solution-types.md`

### 4) Propose, Don't Apply

Present to user BEFORE writing code:

```markdown
## Analysis

**Root Cause:** [from 5 Whys]

**Existing Snippets Checked:** [list or "none related"]

## Proposed Solutions

### Option 1: [Name] (Recommended)
- Type: fix/workaround/enhancement
- Affects: [hooks, pages, functions]
- Trade-offs: [pros and cons]

### Option 2: [Alternative]
- Type: ...
- Trade-offs: ...

## My Recommendation

[Which option and why]

---
Awaiting your approval before implementation.
```

### 5) Registry Update

After creating snippet, update `knowledge/snippets-registry.json`:

```json
{
  "id": "unique-slug",
  "file": "filename.php",
  "title": "Human readable title",
  "status": "active",
  "purpose": "What problem does this solve?",
  "root_cause": "5 Whys result - the actual root cause",
  "solution_type": "fix|workaround|enhancement",
  "created": "YYYY-MM-DD",
  "cleanup_after": "YYYY-MM-DD or null",
  "dependencies": [],
  "affects": ["hooks", "pages"],
  "verified": false,
  "notes": ""
}
```

Use: `node .claude/snippets-manager.js add '{...}'`

### 6) Snippet Lifecycle Management

```
TEMPORARY → (cleanup_after date) → DEPRECATED → DELETE
ACTIVE → (not needed) → DEPRECATED → DELETE
```

Check expired: `node .claude/snippets-manager.js expired`
Check workarounds: `node .claude/snippets-manager.js workarounds`

## Verification

Before marking complete:

- [ ] 5 Whys analysis documented
- [ ] Existing snippets checked
- [ ] User approved the approach
- [ ] Registry updated
- [ ] If workaround: cleanup_after date set

## Prohibited Actions

- ❌ Creating snippet without checking existing
- ❌ Leaving temporary solutions active forever
- ❌ Applying fix without root cause analysis
- ❌ Adding code on top of code without understanding
- ❌ Using wp_update_post() — crashes site, use $wpdb->update()

## Failure Modes

- **"Quick fix" urge** — Stop. Run 5 Whys first.
- **Similar snippet exists** — Extend it, don't duplicate.
- **User wants it NOW** — Explain the risk of technical debt.
