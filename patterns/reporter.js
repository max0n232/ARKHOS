#!/usr/bin/env node
/**
 * PreCompact Hook: Pattern Reporter
 *
 * Analyzes traces via LLM, generates corrections
 * Currently uses MOCK analysis - real API integration later
 */

const fs = require('fs');
const path = require('path');

const CLAUDE_DIR = path.join(process.env.HOME || process.env.USERPROFILE, '.claude');
const TRACKER_DB = path.join(CLAUDE_DIR, 'patterns', 'tracker.db');
const PATTERNS_MD = path.join(CLAUDE_DIR, 'memory', 'global', 'patterns.md');
const TROUBLESHOOTING_MD = path.join(CLAUDE_DIR, 'memory', 'global', 'troubleshooting.md');

let initSqlJs;
try {
    initSqlJs = require('sql.js');
} catch (e) {
    process.exit(0);
}

function escapeSQL(str) {
    if (str === null || str === undefined) return 'NULL';
    return "'" + String(str).replace(/'/g, "''") + "'";
}

function getConfig(db, key, defaultValue) {
    try {
        const result = db.exec(`SELECT value FROM config WHERE key = ${escapeSQL(key)}`);
        if (result.length && result[0].values.length) {
            const val = result[0].values[0][0];
            return isNaN(val) ? val : parseFloat(val);
        }
    } catch (e) {}
    return defaultValue;
}

function setConfig(db, key, value) {
    db.exec(`INSERT OR REPLACE INTO config (key, value, updated_at)
             VALUES (${escapeSQL(key)}, ${escapeSQL(String(value))}, datetime('now'))`);
}

async function shouldAnalyze(db) {
    const lastTs = getConfig(db, 'last_analysis_timestamp', 0);
    const threshold = getConfig(db, 'analysis_trigger_traces', 50);

    const result = db.exec(`SELECT COUNT(*) FROM traces WHERE timestamp > ${lastTs}`);
    const newTraces = result.length ? result[0].values[0][0] : 0;

    return newTraces >= threshold;
}

function gatherData(db) {
    const lastTs = getConfig(db, 'last_analysis_timestamp', 0);
    const now = Math.floor(Date.now() / 1000);

    // Stats
    let result = db.exec(`
        SELECT COUNT(*) as total,
               SUM(CASE WHEN exit_code != 0 THEN 1 ELSE 0 END) as errors,
               AVG(duration_ms) as avg_duration
        FROM traces WHERE timestamp > ${lastTs}
    `);

    const [total, errors, avgDuration] = result.length ? result[0].values[0] : [0, 0, 0];
    const errorRate = total > 0 ? errors / total : 0;

    // Top errors
    result = db.exec(`
        SELECT tool_name, tool_input, error_output, COUNT(*) as cnt
        FROM traces
        WHERE timestamp > ${lastTs} AND exit_code != 0
        GROUP BY tool_name, tool_input, error_output
        ORDER BY cnt DESC
        LIMIT 10
    `);
    const topErrors = result.length ? result[0].values : [];

    // Detections
    result = db.exec(`
        SELECT pattern_type, severity, description, context
        FROM detections
        WHERE created_at > datetime(${lastTs}, 'unixepoch')
        ORDER BY CASE severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 ELSE 3 END
    `);
    const detections = result.length ? result[0].values : [];

    // Current patterns
    let currentPatterns = '';
    if (fs.existsSync(PATTERNS_MD)) {
        currentPatterns = fs.readFileSync(PATTERNS_MD, 'utf-8');
    }

    return {
        tracesFrom: lastTs,
        tracesTo: now,
        totalTraces: total,
        errorRate,
        avgDuration: avgDuration || 0,
        topErrors,
        detections,
        currentPatterns
    };
}

function formatPrompt(data) {
    const errorPct = (data.errorRate * 100).toFixed(1);

    let errorsText = data.topErrors.map((e, i) =>
        `${i + 1}. **${e[0]}**: \`${(e[1] || '').substring(0, 100)}\` (${e[3]}x)\n   Error: ${(e[2] || 'No output').substring(0, 200)}`
    ).join('\n');

    let detectionsText = data.detections.map(d =>
        `- **${d[0]}** (${d[1]}): ${d[2]}`
    ).join('\n');

    return `Проанализируй данные выполнения CLI-агента:

## Статистика
- Traces: ${data.totalTraces}, Error rate: ${errorPct}%, Avg duration: ${data.avgDuration.toFixed(0)}ms

## Топ ошибок
${errorsText || 'Нет ошибок'}

## Обнаруженные паттерны
${detectionsText || 'Нет паттернов'}

## Текущие правила (excerpt)
${data.currentPatterns.substring(0, 1000)}

Задача: определи root causes, предложи corrections в JSON формате.`;
}

/**
 * MOCK LLM Analysis
 * Returns structured corrections based on error patterns
 */
function runMockAnalysis(data) {
    const corrections = [];

    // Generate corrections based on detected patterns
    if (data.topErrors.length > 0) {
        const [tool, input, error] = data.topErrors[0];
        corrections.push({
            type: 'troubleshooting',
            target: TROUBLESHOOTING_MD,
            action: 'add',
            content: `## ${tool} errors\n\nIf \`${(input || '').substring(0, 50)}\` fails:\n1. Check prerequisites\n2. Verify command syntax\n3. Check error: ${(error || 'Unknown').substring(0, 100)}`,
            reason: `Repeated ${tool} failures detected`,
            severity: 'medium',
            auto_apply: true
        });
    }

    // Add pattern for loop detection
    if (data.detections.some(d => d[0] === 'P1')) {
        corrections.push({
            type: 'pattern',
            target: PATTERNS_MD,
            action: 'add',
            content: `## Loop Prevention\n\nBefore repeating a failed command:\n1. Analyze the error message\n2. Try a different approach\n3. Ask for help if stuck 3+ times`,
            reason: 'Loop detection triggered multiple times',
            severity: 'high',
            auto_apply: true
        });
    }

    return {
        analysis: `Mock analysis: ${data.totalTraces} traces, ${(data.errorRate * 100).toFixed(1)}% error rate. Found ${data.topErrors.length} error patterns and ${data.detections.length} detections.`,
        corrections
    };
}

function saveAnalysis(db, data, result) {
    const correctionsJson = JSON.stringify(result.corrections);

    db.exec(`
        INSERT INTO analyses (traces_from, traces_to, traces_count, error_rate, loops_detected, analysis_text, corrections_json)
        VALUES (
            ${data.tracesFrom},
            ${data.tracesTo},
            ${data.totalTraces},
            ${data.errorRate},
            ${data.detections.filter(d => d[0] === 'P1').length},
            ${escapeSQL(result.analysis)},
            ${escapeSQL(correctionsJson)}
        )
    `);

    // Get last insert ID
    const idResult = db.exec('SELECT last_insert_rowid()');
    return idResult.length ? idResult[0].values[0][0] : null;
}

async function report(forceRun = false) {
    try {
        await fs.promises.access(TRACKER_DB);
    } catch (e) {
        console.log('No tracker database found');
        process.exit(0);
    }

    const SQL = await initSqlJs();
    const buffer = await fs.promises.readFile(TRACKER_DB);
    const db = new SQL.Database(buffer);

    // Check if analysis needed
    if (!forceRun && !await shouldAnalyze(db)) {
        console.log('Not enough new traces for analysis');
        db.close();
        process.exit(0);
    }

    console.log('Gathering analysis data...');
    const data = gatherData(db);

    if (data.totalTraces === 0) {
        console.log('No traces to analyze');
        db.close();
        process.exit(0);
    }

    console.log(`Analyzing ${data.totalTraces} traces...`);

    // Format prompt (for future real LLM)
    const prompt = formatPrompt(data);

    // Run mock analysis
    const result = runMockAnalysis(data);

    // Save analysis
    const analysisId = saveAnalysis(db, data, result);
    console.log(`Analysis saved: ID ${analysisId}`);

    // Update last analysis timestamp
    setConfig(db, 'last_analysis_timestamp', data.tracesTo);

    // Save database
    await fs.promises.writeFile(TRACKER_DB, Buffer.from(db.export()));
    db.close();

    console.log(`\nAnalysis complete\n${result.analysis}\n\nCorrections: ${result.corrections.length} proposed`);

    // Output corrections for applier
    if (result.corrections.length > 0) {
        console.log('\nProposed corrections:');
        result.corrections.forEach((c, i) => {
            console.log(`${i + 1}. [${c.severity}] ${c.type}: ${c.reason}`);
        });
    }

    process.exit(0);
}

// CLI interface
const args = process.argv.slice(2);
const forceRun = args.includes('--force') || args.includes('-f');

report(forceRun).catch(e => {
    console.error(`Reporter error: ${e.message}`);
    process.exit(1);
});
