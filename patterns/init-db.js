#!/usr/bin/env node
/**
 * Initialize Pattern Tracker database
 * Schema inlined — no external SQL file needed.
 * Run: node patterns/init-db.js
 */

const fs = require('fs');
const path = require('path');

const CLAUDE_DIR = path.join(process.env.HOME || process.env.USERPROFILE, '.claude');
const DB_PATH = path.join(CLAUDE_DIR, 'patterns', 'tracker.db');

const { Database } = require('./db-helper');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS traces (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    tool_name TEXT NOT NULL,
    tool_input TEXT,
    exit_code INTEGER DEFAULT 0,
    error_output TEXT,
    duration_ms INTEGER,
    token_budget_pct REAL DEFAULT 0,
    project TEXT DEFAULT 'unknown'
);

CREATE TABLE IF NOT EXISTS detections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    pattern_type TEXT NOT NULL,
    severity TEXT DEFAULT 'low',
    description TEXT,
    context TEXT,
    resolved INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS config (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_traces_session ON traces(session_id);
CREATE INDEX IF NOT EXISTS idx_traces_timestamp ON traces(timestamp);
CREATE INDEX IF NOT EXISTS idx_detections_session ON detections(session_id);
`;

function initTrackerDB() {
    try {
        if (!Database) {
            console.error('better-sqlite3 not available. Install: cd ~/.claude/db && npm install better-sqlite3');
            return false;
        }

        const patternsDir = path.dirname(DB_PATH);
        if (!fs.existsSync(patternsDir)) {
            fs.mkdirSync(patternsDir, { recursive: true });
        }

        const db = new Database(DB_PATH);
        db.pragma('journal_mode = WAL');
        db.pragma('foreign_keys = ON');
        db.exec(SCHEMA);

        const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
        db.close();

        console.log(`Tracker DB initialized: ${DB_PATH}`);
        console.log(`Tables: ${tables.map(t => t.name).join(', ')}`);
        return true;
    } catch (e) {
        console.error(`Failed to initialize tracker DB: ${e.message}`);
        return false;
    }
}

if (require.main === module) {
    const success = initTrackerDB();
    process.exit(success ? 0 : 1);
}

module.exports = { initTrackerDB };
