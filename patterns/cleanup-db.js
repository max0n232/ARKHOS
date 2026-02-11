#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const CLAUDE_DIR = path.join(process.env.HOME || process.env.USERPROFILE, '.claude');
const TRACKER_DB = path.join(CLAUDE_DIR, 'patterns', 'tracker.db');
const TTL_DAYS = 30;

let initSqlJs;
try { initSqlJs = require('sql.js'); } catch (e) { process.exit(1); }

async function cleanup() {
    const SQL = await initSqlJs();
    const buffer = await fs.promises.readFile(TRACKER_DB);
    const db = new SQL.Database(buffer);

    const now = Math.floor(Date.now() / 1000);
    const cutoff = now - (TTL_DAYS * 24 * 60 * 60);

    console.log(`\n# Pattern Tracker Cleanup\n`);
    console.log(`TTL: ${TTL_DAYS} days`);

    // Count before
    const beforeTraces = db.exec('SELECT COUNT(*) FROM traces')[0].values[0][0];
    const beforeDetections = db.exec('SELECT COUNT(*) FROM detections WHERE resolved = 1')[0].values[0][0];

    // Delete old traces
    db.exec(`DELETE FROM traces WHERE timestamp < ${cutoff}`);

    // Archive resolved detections older than 7 days
    const archiveCutoff = now - (7 * 24 * 60 * 60);
    db.exec(`DELETE FROM detections WHERE resolved = 1 AND created_at < datetime(${archiveCutoff}, 'unixepoch')`);

    // Count after
    const afterTraces = db.exec('SELECT COUNT(*) FROM traces')[0].values[0][0];
    const afterDetections = db.exec('SELECT COUNT(*) FROM detections WHERE resolved = 1')[0].values[0][0];

    await fs.promises.writeFile(TRACKER_DB, Buffer.from(db.export()));

    const newSize = (await fs.promises.stat(TRACKER_DB)).size;

    db.close();

    console.log(`Deleted: ${beforeTraces - afterTraces} traces, ${beforeDetections - afterDetections} detections`);
    console.log(`Database size: ${(newSize / 1024).toFixed(1)} KB`);
    console.log(`Cleanup complete`);
}

cleanup().catch(e => console.error(e.message));
