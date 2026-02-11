#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const CLAUDE_DIR = path.join(process.env.HOME || process.env.USERPROFILE, '.claude');
const TRACKER_DB = path.join(CLAUDE_DIR, 'patterns', 'tracker.db');

let initSqlJs;
try { initSqlJs = require('sql.js'); } catch (e) { process.exit(1); }

function escapeSQL(str) {
    if (str === null || str === undefined) return 'NULL';
    return "'" + String(str).replace(/'/g, "''") + "'";
}

const CONFIG_DOCS = {
    loop_threshold: 'Failures before loop detection',
    budget_burn_calls: 'Calls threshold for budget burn',
    budget_burn_window_sec: 'Time window for budget burn',
    budget_burn_error_rate: 'Error rate threshold (0-1)',
    analysis_trigger_traces: 'Traces before analysis runs',
    auto_apply_max_severity: 'Max severity for auto-apply'
};

async function showConfig(db, key) {
    if (key) {
        const result = db.exec(`SELECT value FROM config WHERE key = ${escapeSQL(key)}`);
        if (result.length) {
            console.log(`${key} = ${result[0].values[0][0]}`);
            if (CONFIG_DOCS[key]) console.log(`  ${CONFIG_DOCS[key]}`);
        } else {
            console.log(`Key not found: ${key}`);
        }
    } else {
        console.log('\n# Pattern Tracker Configuration\n');
        const result = db.exec('SELECT key, value FROM config ORDER BY key');
        if (result.length) {
            for (const [k, v] of result[0].values) {
                console.log(`**${k}** = \`${v}\``);
                if (CONFIG_DOCS[k]) console.log(`  ${CONFIG_DOCS[k]}\n`);
            }
        }
    }
}

async function setConfig(db, key, value) {
    db.exec(`INSERT OR REPLACE INTO config (key, value, updated_at) VALUES (${escapeSQL(key)}, ${escapeSQL(value)}, datetime('now'))`);
    console.log(`Set ${key} = ${value}`);
}

async function config() {
    const SQL = await initSqlJs();
    const buffer = await fs.promises.readFile(TRACKER_DB);
    const db = new SQL.Database(buffer);

    const args = process.argv.slice(2);

    if (args.length === 0) {
        await showConfig(db, null);
    } else if (args.length === 1) {
        await showConfig(db, args[0]);
    } else {
        await setConfig(db, args[0], args[1]);
        await fs.promises.writeFile(TRACKER_DB, Buffer.from(db.export()));
    }

    db.close();
}

config().catch(e => console.error(e.message));
