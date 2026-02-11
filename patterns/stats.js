#!/usr/bin/env node
/**
 * Pattern Stats Command
 * Shows error rate, top errors, loops, budget usage
 */

const fs = require('fs');
const path = require('path');

const CLAUDE_DIR = path.join(process.env.HOME || process.env.USERPROFILE, '.claude');
const TRACKER_DB = path.join(CLAUDE_DIR, 'patterns', 'tracker.db');

let initSqlJs;
try {
    initSqlJs = require('../db/node_modules/sql.js');
} catch (e) {
    console.log('sql.js not installed. Run: npm install sql.js');
    process.exit(1);
}

function formatPct(num) {
    return (num * 100).toFixed(1) + '%';
}

function formatDuration(ms) {
    if (!ms) return 'N/A';
    if (ms < 1000) return ms + 'ms';
    return (ms / 1000).toFixed(1) + 's';
}

async function getStats() {
    if (!fs.existsSync(TRACKER_DB)) {
        console.log('No tracker database found. Run a few commands first.');
        return;
    }

    const SQL = await initSqlJs();
    const buffer = await fs.promises.readFile(TRACKER_DB);
    const db = new SQL.Database(buffer);

    // Overall stats
    let result = db.exec(`
        SELECT
            COUNT(*) as total_traces,
            SUM(CASE WHEN exit_code != 0 THEN 1 ELSE 0 END) as errors,
            AVG(duration_ms) as avg_duration,
            AVG(token_budget_pct) as avg_budget
        FROM traces
    `);

    if (!result.length || !result[0].values.length) {
        console.log('No traces recorded yet.');
        db.close();
        return;
    }

    const [total, errors, avgDuration, avgBudget] = result[0].values[0];
    const errorRate = total > 0 ? errors / total : 0;

    console.log(`\n# Pattern Tracker Stats\n`);
    console.log(`**Total Traces:** ${total}`);
    console.log(`**Error Rate:** ${formatPct(errorRate)} (${errors} errors)`);
    console.log(`**Avg Duration:** ${formatDuration(avgDuration)}`);
    console.log(`**Avg Token Budget Used:** ${formatPct(avgBudget || 0)}\n`);

    // Top errors
    result = db.exec(`
        SELECT tool_name, tool_input, COUNT(*) as cnt, MAX(error_output) as last_error
        FROM traces
        WHERE exit_code != 0
        GROUP BY tool_name, tool_input
        ORDER BY cnt DESC
        LIMIT 5
    `);

    if (result.length && result[0].values.length) {
        console.log(`## Top Errors\n`);
        result[0].values.forEach(([tool, input, cnt, lastError], i) => {
            const truncInput = input && input.length > 50 ? input.substring(0, 50) + '...' : input;
            console.log(`${i + 1}. **${tool}**: \`${truncInput || 'N/A'}\` (${cnt}x)`);
            if (lastError) {
                const preview = lastError.substring(0, 100);
                console.log(`   Error: ${preview}${lastError.length > 100 ? '...' : ''}`);
            }
        });
        console.log('');
    }

    // Detections
    result = db.exec(`
        SELECT pattern_type, severity, COUNT(*) as cnt
        FROM detections
        WHERE resolved = 0
        GROUP BY pattern_type, severity
        ORDER BY
            CASE severity
                WHEN 'critical' THEN 1
                WHEN 'high' THEN 2
                WHEN 'medium' THEN 3
                ELSE 4
            END
    `);

    if (result.length && result[0].values.length) {
        console.log(`## Detections\n`);
        result[0].values.forEach(([type, severity, cnt]) => {
            const indicator = severity === 'critical' ? '[!]' : severity === 'high' ? '[*]' : '[~]';
            console.log(`${indicator} **${type}** (${severity}): ${cnt} unresolved`);
        });
        console.log('');
    }

    // Recent sessions
    result = db.exec(`
        SELECT session_id, COUNT(*) as trace_count,
               SUM(CASE WHEN exit_code != 0 THEN 1 ELSE 0 END) as errors,
               MIN(timestamp) as first_trace,
               MAX(timestamp) as last_trace
        FROM traces
        GROUP BY session_id
        ORDER BY last_trace DESC
        LIMIT 5
    `);

    if (result.length && result[0].values.length) {
        console.log(`## Recent Sessions\n`);
        result[0].values.forEach(([sessId, traceCount, sessErrors, firstTrace, lastTrace]) => {
            const duration = (lastTrace - firstTrace) * 1000;
            const sessErrorRate = traceCount > 0 ? sessErrors / traceCount : 0;
            const shortId = sessId && sessId.length > 20 ? sessId.substring(0, 20) + '...' : sessId;
            console.log(`- **${shortId}**: ${traceCount} traces, ${formatPct(sessErrorRate)} errors, ${formatDuration(duration)}`);
        });
    }

    db.close();
}

if (require.main === module) {
    getStats().catch(e => {
        console.error(`Error: ${e.message}`);
        process.exit(1);
    });
}

module.exports = { getStats };
