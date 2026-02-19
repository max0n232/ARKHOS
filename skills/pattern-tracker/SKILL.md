---
name: pattern-tracker
description: Pattern tracking and correction system. Use when analyzing errors, failures, loops, or optimizing agent behavior.
---

# Pattern Tracker

System for detecting, tracking, and correcting behavioral patterns in Claude sessions.

## Commands

- `/pattern-stats` - View pattern statistics
- `/pattern-history` - View pattern history
- `/pattern-mark` - Mark a pattern manually
- `/pattern-corrections` - View applied corrections
- `/pattern-config` - Configure pattern tracking

## When to Use

- Debugging repeated failures
- Analyzing session behavior
- Improving agent effectiveness
- Understanding common error patterns

## Architecture

- `patterns/analyzer.js` - Real-time pattern analysis (PostToolUse hook)
- `patterns/detector.js` - Pattern detection (Stop hook)
- `patterns/reporter.js` - Pattern reporting (PreCompact hook)
- `patterns/tracker.db` - SQLite database for pattern storage
- `patterns/applier.js` - Apply corrections based on patterns

## Additional Components

- `patterns/stats.js` - Statistics generation
- `patterns/history.js` - Pattern history viewing
- `patterns/mark.js` - Manual pattern marking
- `patterns/corrections.js` - Corrections management
- `patterns/config.js` - Configuration settings
- `patterns/approve.js` - Approval workflow
- `patterns/measure-effectiveness.js` - Effectiveness metrics
- `patterns/cleanup-db.js` - Database maintenance
- `patterns/init-db.js` - Database initialization

## Database Schema

Tracks patterns with: session_id, category, error_type, tool_name, occurrence_count, severity, status (active/resolved/suppressed)
