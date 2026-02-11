#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { applyCorrection } = require('./applier.js');

const CLAUDE_DIR = path.join(process.env.HOME || process.env.USERPROFILE, '.claude');
const TRACKER_DB = path.join(CLAUDE_DIR, 'patterns', 'tracker.db');

let initSqlJs;
try { initSqlJs = require('../db/node_modules/sql.js'); } catch (e) { process.exit(1); }

function escapeSQL(str) {
    if (str === null || str === undefined) return 'NULL';
    return "'" + String(str).replace(/'/g, "''") + "'";
}

async function approve(analysisId, correctionIndex) {
    const SQL = await initSqlJs();
    const buffer = await fs.promises.readFile(TRACKER_DB);
    const db = new SQL.Database(buffer);

    const result = db.exec(`SELECT corrections_json FROM analyses WHERE id = ${analysisId}`);
    if (!result.length) {
        console.log(`Analysis ${analysisId} not found`);
        db.close();
        return;
    }

    const corrections = JSON.parse(result[0].values[0][0] || '[]');
    const correction = corrections[correctionIndex];

    if (!correction) {
        console.log(`Correction ${correctionIndex} not found`);
        db.close();
        return;
    }

    console.log(`\nApproving correction ${correctionIndex}...`);
    console.log(`Type: ${correction.type}`);
    console.log(`Target: ${correction.target}\n`);

    const applyResult = await applyCorrection(correction);

    if (applyResult.success) {
        db.exec(`
            INSERT INTO applied_corrections (analysis_id, type, target, action, content, reason, auto_applied, approved_by, backup_path)
            VALUES (${analysisId}, ${escapeSQL(correction.type)}, ${escapeSQL(correction.target)}, ${escapeSQL(correction.action)}, ${escapeSQL(correction.content)}, ${escapeSQL(correction.reason)}, 0, 'user', ${escapeSQL(applyResult.backup)})
        `);
        await fs.promises.writeFile(TRACKER_DB, Buffer.from(db.export()));
        console.log(`[OK] Correction applied (${applyResult.action})`);
    } else {
        console.log(`[FAIL] Failed: ${applyResult.error}`);
    }

    db.close();
}

const args = process.argv.slice(2);
if (args.length < 2) {
    console.log('Usage: node approve.js <analysis_id> <correction_index>');
    process.exit(1);
}
approve(parseInt(args[0]), parseInt(args[1])).catch(e => console.error(e.message));
