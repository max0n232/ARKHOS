#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const CLAUDE_DIR = path.join(process.env.HOME || process.env.USERPROFILE, '.claude');
const TRACKER_DB = path.join(CLAUDE_DIR, 'patterns', 'tracker.db');
const CAPSULE_PATH = path.join(CLAUDE_DIR, 'memory', 'session', 'capsule.json');

let initSqlJs;
try { initSqlJs = require('sql.js'); } catch (e) { process.exit(1); }

function escapeSQL(str) {
    if (str === null || str === undefined) return 'NULL';
    return "'" + String(str).replace(/'/g, "''") + "'";
}

async function loadCapsule() {
    try {
        const content = await fs.promises.readFile(CAPSULE_PATH, 'utf-8');
        return JSON.parse(content);
    } catch (e) { return null; }
}

async function markPattern(type, description) {
    if (!['good', 'bad'].includes(type)) {
        console.log('Type must be "good" or "bad"');
        return;
    }

    const capsule = await loadCapsule();
    const sessionId = capsule?.session_id || 'unknown';

    const SQL = await initSqlJs();
    const buffer = await fs.promises.readFile(TRACKER_DB);
    const db = new SQL.Database(buffer);

    db.exec(`
        INSERT INTO detections (session_id, pattern_type, severity, description, context)
        VALUES (
            ${escapeSQL(sessionId)},
            ${escapeSQL(type === 'good' ? 'P4' : 'USER_BAD')},
            ${escapeSQL(type === 'good' ? 'low' : 'medium')},
            ${escapeSQL(description)},
            ${escapeSQL(JSON.stringify({ type: 'user_feedback', feedback: type }))}
        )
    `);

    await fs.promises.writeFile(TRACKER_DB, Buffer.from(db.export()));
    db.close();

    const emoji = type === 'good' ? '[+]' : '[!]';
    console.log(`${emoji} Feedback recorded: ${description}`);
}

const args = process.argv.slice(2);
if (args.length < 2) {
    console.log('Usage: node mark.js good|bad "description"');
    process.exit(1);
}
markPattern(args[0], args.slice(1).join(' ')).catch(e => console.error(e.message));
