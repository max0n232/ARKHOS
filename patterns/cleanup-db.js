#!/usr/bin/env node
/**
 * Pattern Tracker DB Cleanup (legacy)
 *
 * NOTE: This script is superseded by scripts/data-janitor.js
 * which runs automatically at SessionStart with configurable retention.
 * Kept for manual one-off cleanup.
 *
 * Uses better-sqlite3 via db-helper.js
 */

const fs = require('fs');
const { getDb, TRACKER_DB } = require('./db-helper');

const TTL_DAYS = 30;

function cleanup() {
    const db = getDb();
    if (!db) {
        console.log('No tracker database found.');
        return;
    }

    try {
        const now = Math.floor(Date.now() / 1000);
        const cutoff = now - (TTL_DAYS * 24 * 60 * 60);

        console.log(`\n# Pattern Tracker Cleanup\n`);
        console.log(`TTL: ${TTL_DAYS} days`);
        console.log(`NOTE: Use scripts/data-janitor.js for configurable retention.\n`);

        // Count before
        const beforeTraces = db.prepare('SELECT COUNT(*) as c FROM traces').get().c;
        const beforeDetections = db.prepare('SELECT COUNT(*) as c FROM detections WHERE resolved = 1').get().c;

        // Delete old traces
        db.prepare('DELETE FROM traces WHERE timestamp < ?').run(cutoff);

        // Archive resolved detections older than 7 days
        const archiveCutoff = now - (7 * 24 * 60 * 60);
        db.prepare("DELETE FROM detections WHERE resolved = 1 AND created_at < datetime(?, 'unixepoch')").run(archiveCutoff);

        // Count after
        const afterTraces = db.prepare('SELECT COUNT(*) as c FROM traces').get().c;
        const afterDetections = db.prepare('SELECT COUNT(*) as c FROM detections WHERE resolved = 1').get().c;

        // VACUUM
        db.exec('VACUUM');

        const newSize = fs.statSync(TRACKER_DB).size;

        db.close();

        console.log(`Deleted: ${beforeTraces - afterTraces} traces, ${beforeDetections - afterDetections} detections`);
        console.log(`Database size: ${(newSize / 1024).toFixed(1)} KB`);
        console.log(`Cleanup complete`);
    } catch (e) {
        try { db.close(); } catch (_) {}
        throw e;
    }
}

try {
    cleanup();
} catch (e) {
    console.error(e.message);
}
