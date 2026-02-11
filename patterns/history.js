#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const CLAUDE_DIR = path.join(process.env.HOME || process.env.USERPROFILE, '.claude');
const TRACKER_DB = path.join(CLAUDE_DIR, 'patterns', 'tracker.db');

let initSqlJs;
try { initSqlJs = require('sql.js'); } catch (e) { process.exit(1); }

async function showHistory(limit = 20) {
    const SQL = await initSqlJs();
    const buffer = await fs.promises.readFile(TRACKER_DB);
    const db = new SQL.Database(buffer);

    const result = db.exec(`
        SELECT c.id, c.type, c.target, c.action, c.reason, c.auto_applied, c.approved_by, c.applied_at,
               (SELECT metric_value FROM correction_metrics WHERE correction_id = c.id AND metric_name = 'error_rate_before') as err_before,
               (SELECT metric_value FROM correction_metrics WHERE correction_id = c.id AND metric_name = 'error_rate_after') as err_after
        FROM applied_corrections c
        ORDER BY c.applied_at DESC
        LIMIT ${limit}
    `);

    if (!result.length || !result[0].values.length) {
        console.log('No corrections applied yet');
        db.close();
        return;
    }

    console.log(`\n# Pattern Tracker History\n`);

    for (const [id, type, target, action, reason, autoApplied, approvedBy, appliedAt, errBefore, errAfter] of result[0].values) {
        const date = appliedAt?.split('T')[0] || 'unknown';
        const applyType = autoApplied ? '[AUTO]' : '[MANUAL]';
        const targetName = path.basename(target || 'unknown');

        console.log(`## ${applyType} Correction ${id} - ${date}\n`);
        console.log(`**Type:** ${type}`);
        console.log(`**Target:** ${targetName}`);
        console.log(`**Approved by:** ${approvedBy}`);
        if (reason) console.log(`**Reason:** ${reason}`);

        if (errBefore !== null && errAfter !== null) {
            const improvement = ((errBefore - errAfter) / (errBefore || 1)) * 100;
            const effStatus = improvement > 5 ? 'IMPROVED' : improvement < -5 ? 'DEGRADED' : 'STABLE';
            console.log(`**Effectiveness:** ${effStatus} ${(errBefore * 100).toFixed(1)}% -> ${(errAfter * 100).toFixed(1)}%`);
        }
        console.log('');
    }

    db.close();
}

const limit = parseInt(process.argv[2]) || 20;
showHistory(limit).catch(e => console.error(e.message));
