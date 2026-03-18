#!/usr/bin/env node
/**
 * Shared DB Helper for Pattern Tracker
 *
 * Centralizes better-sqlite3 connection to tracker.db.
 * All hooks and pattern scripts use this module.
 *
 * better-sqlite3 is synchronous and auto-persists to disk.
 * No manual buffer read/write needed (unlike sql.js).
 */

const path = require('path');
const fs = require('fs');

const CLAUDE_DIR = path.join(process.env.HOME || process.env.USERPROFILE, '.claude');
const TRACKER_DB = path.join(CLAUDE_DIR, 'patterns', 'tracker.db');
const BETTER_SQLITE3_PATH = path.join(CLAUDE_DIR, 'db', 'node_modules', 'better-sqlite3');

let Database;
try {
    Database = require(BETTER_SQLITE3_PATH);
} catch (e) {
    // If better-sqlite3 not available, exports will return null
    Database = null;
}

/**
 * Get an open database connection.
 * Returns null if DB or driver not available.
 * Caller MUST call db.close() when done.
 */
function getDb() {
    if (!Database) return null;
    if (!fs.existsSync(TRACKER_DB)) return null;

    try {
        const db = new Database(TRACKER_DB);
        db.pragma('journal_mode = WAL');
        db.pragma('busy_timeout = 3000');
        return db;
    } catch (e) {
        return null;
    }
}

/**
 * Get config value from DB.
 */
function getConfig(db, key, defaultValue) {
    try {
        const row = db.prepare('SELECT value FROM config WHERE key = ?').get(key);
        if (row) {
            const val = row.value;
            return isNaN(val) ? val : parseFloat(val);
        }
    } catch (e) {}
    return defaultValue;
}

/**
 * Set config value in DB.
 */
function setConfig(db, key, value) {
    db.prepare(
        "INSERT OR REPLACE INTO config (key, value, updated_at) VALUES (?, ?, datetime('now'))"
    ).run(key, String(value));
}

/**
 * Truncate string to max length.
 */
function truncate(str, maxLen = 200) {
    if (!str) return null;
    const s = String(str);
    return s.length > maxLen ? s.substring(0, maxLen) + '...' : s;
}

/**
 * Load session capsule.
 */
function loadCapsule() {
    const capsulePath = path.join(CLAUDE_DIR, 'memory', 'session', 'capsule.json');
    try {
        if (fs.existsSync(capsulePath)) {
            return JSON.parse(fs.readFileSync(capsulePath, 'utf8'));
        }
    } catch (e) {}
    return null;
}

module.exports = {
    getDb,
    getConfig,
    setConfig,
    truncate,
    loadCapsule,
    CLAUDE_DIR,
    TRACKER_DB,
    Database
};
