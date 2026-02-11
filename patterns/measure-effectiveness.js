#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const CLAUDE_DIR = path.join(process.env.HOME || process.env.USERPROFILE, '.claude');
const TRACKER_DB = path.join(CLAUDE_DIR, 'patterns', 'tracker.db');

let initSqlJs;
try { initSqlJs = require('sql.js'); } catch (e) { process.exit(1); }

async function getErrorRate(db, fromTs, toTs) {
    const result = db.exec(`
        SELECT CAST(SUM(CASE WHEN exit_code != 0 THEN 1 ELSE 0 END) AS REAL) / COUNT(*) as rate
        FROM traces WHERE timestamp BETWEEN ${fromTs} AND ${toTs}
    `);
    return result.length && result[0].values[0][0] !== null ? result[0].values[0][0] : 0;
}

async function measureEffectiveness() {
    const SQL = await initSqlJs();
    const buffer = await fs.promises.readFile(TRACKER_DB);
    const db = new SQL.Database(buffer);

    // Get corrections needing measurement
    const result = db.exec(`
        SELECT c.id, c.analysis_id, a.traces_to as applied_timestamp
        FROM applied_corrections c
        JOIN analyses a ON c.analysis_id = a.id
        WHERE c.id NOT IN (SELECT correction_id FROM correction_metrics WHERE metric_name = 'effectiveness_measured')
    `);

    if (!result.length || !result[0].values.length) {
        console.log('No corrections pending measurement');
        db.close();
        return;
    }

    const now = Math.floor(Date.now() / 1000);
    const windowSize = 7 * 24 * 60 * 60; // 7 days

    console.log(`\nMeasuring effectiveness for ${result[0].values.length} corrections...\n`);

    for (const [corrId, analysisId, appliedTs] of result[0].values) {
        if (now - appliedTs < 86400) {
            console.log(`[~] Correction ${corrId}: too recent, skipping`);
            continue;
        }

        const beforeStart = appliedTs - windowSize;
        const afterEnd = Math.min(appliedTs + windowSize, now);

        const errorBefore = await getErrorRate(db, beforeStart, appliedTs);
        const errorAfter = await getErrorRate(db, appliedTs, afterEnd);

        // Record metrics
        db.exec(`INSERT INTO correction_metrics (correction_id, metric_name, metric_value) VALUES (${corrId}, 'error_rate_before', ${errorBefore})`);
        db.exec(`INSERT INTO correction_metrics (correction_id, metric_name, metric_value) VALUES (${corrId}, 'error_rate_after', ${errorAfter})`);
        db.exec(`INSERT INTO correction_metrics (correction_id, metric_name, metric_value) VALUES (${corrId}, 'effectiveness_measured', 1)`);

        const improvement = ((errorBefore - errorAfter) / (errorBefore || 1)) * 100;
        const indicator = improvement > 5 ? '[+]' : improvement < -5 ? '[-]' : '[=]';

        console.log(`${indicator} Correction ${corrId}: ${(errorBefore * 100).toFixed(1)}% -> ${(errorAfter * 100).toFixed(1)}% (${improvement.toFixed(1)}% improvement)`);
    }

    await fs.promises.writeFile(TRACKER_DB, Buffer.from(db.export()));
    db.close();
    console.log('\n[+] Measurement complete');
}

measureEffectiveness().catch(e => console.error(e.message));
