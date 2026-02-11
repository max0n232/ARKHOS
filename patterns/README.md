# Pattern Tracker

Automated behavioral pattern detection and correction system.

## Dependencies

- sql.js

## Architecture

- **analyzer.js** (PostToolUse hook): Captures tool execution traces
- **detector.js** (Stop hook): Realtime pattern detection (loops, budget burn)
- **reporter.js** (PreCompact hook): LLM-powered analysis and correction suggestions
- **applier.js**: Applies approved corrections to knowledge files

## Database

SQLite database: `tracker.db` (using sql.js - pure JavaScript)
Schema: `../db/schema-tracker.sql`

## Configuration

Stored in `config` table. Edit via `/pattern-config` command.

## Patterns

- **P1 Loop Detection**: Same command failing 3+ times
- **P2 Budget Burn**: >20 calls in 60s with >50% error rate
- **P3 Destructive Pattern**: Blocked command attempted 2+ times
- **P4 Success Pattern**: Series of successful operations

## Commands

- `/pattern-stats` - Show statistics
- `/pattern-corrections` - Review pending corrections
- `/analyze-patterns` - Force analysis run

## Status

- **Phase 1**: Collector + Loop Detection (MVP)
- Phase 2: Reporter + Applier
- Phase 3: Feedback Loop + Metrics
- Phase 4: Polish + Cleanup
