#!/usr/bin/env node
/**
 * PostToolUse Hook: Pattern Analyzer (Collector)
 *
 * Captures tool execution traces to tracker.db
 * CRITICAL: Must be lightweight (< 50ms), NO LLM calls
 */

const fs = require('fs');
const path = require('path');

const CLAUDE_DIR = path.join(process.env.HOME || process.env.USERPROFILE, '.claude');
const TRACKER_DB = path.join(CLAUDE_DIR, 'patterns', 'tracker.db');
const CAPSULE_PATH = path.join(CLAUDE_DIR, 'memory', 'session', 'capsule.json');

let initSqlJs;
try {
    initSqlJs = require('../db/node_modules/sql.js');
} catch (e) {
    process.exit(0);
}

async function loadCapsule() {
    try {
        await fs.promises.access(CAPSULE_PATH);
        const content = await fs.promises.readFile(CAPSULE_PATH, 'utf-8');
        return JSON.parse(content);
    } catch (e) {}
    return null;
}

function truncate(str, maxLen) {
    if (!str) return null;
    const s = String(str);
    return s.length > maxLen ? s.substring(0, maxLen) + '...' : s;
}

function extractExitCode(output) {
    if (!output) return 0;
    const str = String(output);
    if (str.includes('BLOCKED') || str.includes('denied by security')) return -1;
    // More comprehensive pattern matching for errors
    if (/error|exception|failed|enoent|eacces|fatal|syntaxerror|typeerror/i.test(str)) return 1;
    return 0;
}

async function analyze() {
    const startTime = Date.now();

    // Read input from stdin
    let input = '';
    for await (const chunk of process.stdin) {
        input += chunk;
    }

    let data;
    try {
        data = JSON.parse(input);
    } catch (e) {
        process.exit(0);
    }

    // Skip if no database
    if (!fs.existsSync(TRACKER_DB)) {
        process.exit(0);
    }

    // Load session context
    const capsule = await loadCapsule();
    const sessionId = capsule?.session_id || 'unknown';
    const project = capsule?.project || 'unknown';
    const tokenBudgetPct = capsule?.token_budget && capsule.token_budget.total > 0
        ? capsule.token_budget.used / capsule.token_budget.total
        : 0;

    const trace = {
        session_id: sessionId,
        timestamp: Math.floor(Date.now() / 1000),
        tool_name: data.tool_name || data.tool || 'unknown',
        tool_input: truncate(data.tool_input || data.command || data.file_path, 500),
        exit_code: data.exit_code !== undefined
            ? data.exit_code
            : extractExitCode(data.tool_output || data.output || data.stdout || data.stderr || ''),
        error_output: truncate(data.error_output || data.stderr, 1000),
        duration_ms: data.duration_ms || (Date.now() - startTime),
        token_budget_pct: tokenBudgetPct,
        project: project
    };

    try {
        const SQL = await initSqlJs();
        const buffer = await fs.promises.readFile(TRACKER_DB);
        const db = new SQL.Database(buffer);

        db.run(`
            INSERT INTO traces (
                session_id, timestamp, tool_name, tool_input,
                exit_code, error_output, duration_ms, token_budget_pct, project
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            trace.session_id,
            trace.timestamp,
            trace.tool_name,
            trace.tool_input,
            trace.exit_code,
            trace.error_output,
            trace.duration_ms,
            trace.token_budget_pct,
            trace.project
        ]);

        // Save database
        const newData = db.export();
        await fs.promises.writeFile(TRACKER_DB, Buffer.from(newData));
        db.close();
    } catch (e) {
        // Silent fail - don't block tool execution
    }

    process.exit(0);
}

analyze().catch(() => process.exit(0));
