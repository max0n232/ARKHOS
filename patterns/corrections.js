#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const CLAUDE_DIR = path.join(process.env.HOME || process.env.USERPROFILE, '.claude');
const TRACKER_DB = path.join(CLAUDE_DIR, 'patterns', 'tracker.db');

let initSqlJs;
try { initSqlJs = require('sql.js'); } catch (e) { process.exit(1); }

async function showCorrections() {
    const SQL = await initSqlJs();
    const buffer = await fs.promises.readFile(TRACKER_DB);
    const db = new SQL.Database(buffer);

    const result = db.exec(`SELECT id, analysis_text, corrections_json, created_at FROM analyses ORDER BY created_at DESC LIMIT 1`);
    if (!result.length || !result[0].values.length) {
        console.log('No pending corrections');
        db.close();
        return;
    }

    const [id, analysis, correctionsJson, created] = result[0].values[0];
    const corrections = JSON.parse(correctionsJson || '[]');
    const pending = corrections.filter(c => c.severity === 'critical' || !c.auto_apply);

    if (!pending.length) {
        console.log('No pending corrections requiring approval');
        db.close();
        return;
    }

    console.log(`\n# Pending Corrections\n`);
    console.log(`Analysis ID: ${id}`);
    console.log(`Created: ${created}\n`);
    console.log(`${analysis}\n`);

    pending.forEach((c, i) => {
        const emoji = c.severity === 'critical' ? '[CRITICAL]' : c.severity === 'high' ? '[HIGH]' : '[INFO]';
        console.log(`## ${emoji} Correction ${i} (${c.severity})\n`);
        console.log(`**Type:** ${c.type}`);
        console.log(`**Target:** ${c.target}`);
        console.log(`**Reason:** ${c.reason}\n`);
        console.log('```');
        console.log(c.content);
        console.log('```\n');
        console.log(`To approve: \`/pattern-approve ${id} ${i}\`\n`);
    });

    db.close();
}

showCorrections().catch(e => console.error(e.message));
