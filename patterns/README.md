# Pattern Tracker

Automated behavioral pattern detection and correction system.

## Status

- Phase 1: Collector + Loop Detection (MVP)
- Phase 2: Reporter + Applier
- Phase 3: Feedback Loop + Metrics
- Phase 4: Polish + Cleanup

**Fully Implemented**

## Commands

| Command | Description |
|---------|-------------|
| `/pattern-stats` | Show statistics |
| `/pattern-corrections` | Review pending corrections |
| `/pattern-approve <id> <idx>` | Approve correction |
| `/pattern-mark good\|bad "desc"` | Manual feedback |
| `/pattern-config [key] [value]` | Configuration |
| `/pattern-history [limit]` | Correction history |
| `/analyze-patterns` | Force analysis |

## Patterns

- **P1**: Loop (3+ same failures)
- **P2**: Budget burn (>20 calls, >50% errors)
- **P3**: Destructive (2+ blocked attempts)
- **P4**: Success (5+ consecutive successes)

## Dependencies

- sql.js

## Files

```
patterns/
  tracker.db           # SQLite database
  analyzer.js          # PostToolUse hook
  detector.js          # Stop hook (P1-P4)
  reporter.js          # PreCompact hook
  applier.js           # Apply corrections
  stats.js             # Statistics
  corrections.js       # Pending corrections
  approve.js           # Approve correction
  mark.js              # Manual feedback
  config.js            # Configuration
  history.js           # History viewer
  cleanup-db.js        # TTL cleanup
  measure-effectiveness.js
```

## Database

SQLite database: `tracker.db` (using sql.js - pure JavaScript)
Schema: `../db/schema-tracker.sql`

## Configuration

Stored in `config` table. Edit via `/pattern-config` command.
