#!/usr/bin/env node
/**
 * Initialize Pattern Tracker database
 * Uses sql.js (pure JavaScript SQLite)
 */

const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

const CLAUDE_DIR = path.join(process.env.HOME || process.env.USERPROFILE, '.claude');
const DB_PATH = path.join(CLAUDE_DIR, 'patterns', 'tracker.db');
const SCHEMA_PATH = path.join(CLAUDE_DIR, 'db', 'schema-tracker.sql');

async function initTrackerDB() {
    try {
        // Create patterns directory
        const patternsDir = path.dirname(DB_PATH);
        if (!fs.existsSync(patternsDir)) {
            fs.mkdirSync(patternsDir, { recursive: true });
        }

        // Load schema
        const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');

        // Initialize sql.js
        const SQL = await initSqlJs();

        // Load existing DB or create new
        let db;
        if (fs.existsSync(DB_PATH)) {
            const buffer = fs.readFileSync(DB_PATH);
            db = new SQL.Database(buffer);
        } else {
            db = new SQL.Database();
        }

        // Execute schema
        db.run(schema);

        // Save to file
        const data = db.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(DB_PATH, buffer);

        db.close();

        console.log(`Tracker DB initialized: ${DB_PATH}`);
        return true;
    } catch (e) {
        console.error(`Failed to initialize tracker DB: ${e.message}`);
        return false;
    }
}

if (require.main === module) {
    initTrackerDB().then(success => process.exit(success ? 0 : 1));
}

module.exports = { initTrackerDB };
