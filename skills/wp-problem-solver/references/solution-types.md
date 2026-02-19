# Solution Types Classification

## Overview

Every code change must be classified. This determines lifecycle and cleanup requirements.

## Types

### FIX

**Definition:** Addresses the ROOT CAUSE of the problem.

**Characteristics:**
- Eliminates the source, not just symptoms
- Permanent solution (no cleanup_after)
- Should not require future revisiting

**Examples:**
- Fixing N+1 query with proper JOIN
- Adding missing dependency to wp_enqueue_script
- Correcting incorrect hook priority

**Registry entry:**
```json
{
  "solution_type": "fix",
  "status": "active",
  "cleanup_after": null
}
```

### WORKAROUND

**Definition:** Treats symptoms because root cause cannot be fixed now.

**Characteristics:**
- Root cause is known but:
  - Fixing requires more time/resources
  - Depends on third-party (plugin update, hosting)
  - Needs client approval for bigger change
- MUST have cleanup_after date
- Should be tracked for future fix

**Examples:**
- Adding CSS !important because theme update broke layout (waiting for proper child theme)
- Caching API response because API is slow (waiting for async implementation)
- Disabling feature because of plugin conflict (waiting for plugin update)

**Registry entry:**
```json
{
  "solution_type": "workaround",
  "status": "temporary",
  "cleanup_after": "2026-03-15",
  "notes": "Remove after theme child migration"
}
```

### ENHANCEMENT

**Definition:** New functionality, not fixing a problem.

**Characteristics:**
- No existing problem being solved
- Adding new feature or capability
- Permanent unless explicitly deprecated

**Examples:**
- Adding new schema markup
- Creating custom REST endpoint
- Implementing new shortcode

**Registry entry:**
```json
{
  "solution_type": "enhancement",
  "status": "active",
  "cleanup_after": null
}
```

## Decision Tree

```
Is there a problem to solve?
├── NO → ENHANCEMENT
└── YES
    └── Do you know the root cause?
        ├── NO → STOP. Do 5 Whys first.
        └── YES
            └── Can you fix root cause now?
                ├── YES → FIX
                └── NO → WORKAROUND (set cleanup_after!)
```

## Lifecycle

```
┌─────────────┐
│ ENHANCEMENT │──────────────────────────────┐
└─────────────┘                              │
                                             ▼
┌─────────────┐                        ┌──────────┐
│    FIX      │───────────────────────►│  ACTIVE  │
└─────────────┘                        └────┬─────┘
                                            │
                                     (no longer needed)
                                            │
                                            ▼
┌─────────────┐   (cleanup_after)    ┌────────────┐
│ WORKAROUND  │─────────────────────►│ DEPRECATED │
└─────────────┘                      └─────┬──────┘
      │                                    │
      │                              (verified safe)
      │                                    │
      │                                    ▼
      │                              ┌──────────┐
      └─────(fixed properly)────────►│ DELETED  │
                                     └──────────┘
```

## Workaround Tracking

Check workarounds regularly:

```bash
# List active workarounds
node .claude/snippets-manager.js workarounds

# Check expired items
node .claude/snippets-manager.js expired
```

When workaround expires:
1. Check if root cause can now be fixed
2. If yes → create proper FIX, deprecate workaround
3. If no → extend cleanup_after, document why

## Anti-Patterns

### Permanent Workarounds

```json
{
  "solution_type": "workaround",
  "cleanup_after": null  // ❌ WRONG
}
```

Every workaround MUST have cleanup date.

### Mislabeled Fixes

```json
{
  "solution_type": "fix",
  "notes": "Added !important to override theme"  // ❌ This is workaround
}
```

If it doesn't address root cause, it's not a fix.

### Missing Root Cause

```json
{
  "purpose": "Fixes the button color",
  "root_cause": ""  // ❌ INCOMPLETE
}
```

No root cause = no understanding = future problems.
