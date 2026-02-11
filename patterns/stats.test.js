#!/usr/bin/env node
/**
 * Tests for Pattern Stats Command
 * TDD: Write tests first, watch them fail, then implement
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const CLAUDE_DIR = path.join(process.env.HOME || process.env.USERPROFILE, '.claude');
const TRACKER_DB = path.join(CLAUDE_DIR, 'patterns', 'tracker.db');
const STATS_PATH = path.join(CLAUDE_DIR, 'patterns', 'stats.js');

let initSqlJs;
try {
    initSqlJs = require('sql.js');
} catch (e) {
    console.error('sql.js not installed');
    process.exit(1);
}

function runStats() {
    return new Promise((resolve, reject) => {
        const child = spawn('node', [STATS_PATH], {
            stdio: ['pipe', 'pipe', 'pipe']
        });

        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (data) => stdout += data);
        child.stderr.on('data', (data) => stderr += data);

        child.on('close', (code) => {
            resolve({ code, stdout, stderr });
        });

        child.on('error', reject);
    });
}

async function test(name, fn) {
    try {
        await fn();
        console.log(`PASS: ${name}`);
        return true;
    } catch (e) {
        console.log(`FAIL: ${name}`);
        console.log(`  Error: ${e.message}`);
        return false;
    }
}

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

async function insertTestTrace(db, trace) {
    db.run(`
        INSERT INTO traces (session_id, timestamp, tool_name, tool_input, exit_code, error_output, duration_ms, token_budget_pct, project)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
        trace.session_id || 'test-session',
        trace.timestamp || Math.floor(Date.now() / 1000),
        trace.tool_name || 'Bash',
        trace.tool_input || 'echo test',
        trace.exit_code || 0,
        trace.error_output || null,
        trace.duration_ms || 100,
        trace.token_budget_pct || 0.1,
        trace.project || 'test-project'
    ]);
}

async function insertTestDetection(db, detection) {
    db.run(`
        INSERT INTO detections (session_id, pattern_type, severity, description, resolved)
        VALUES (?, ?, ?, ?, ?)
    `, [
        detection.session_id || 'test-session',
        detection.pattern_type || 'SAME_ERROR_LOOP',
        detection.severity || 'high',
        detection.description || 'Test detection',
        detection.resolved || 0
    ]);
}

async function runTests() {
    console.log('=== Pattern Stats Tests ===\n');

    let passed = 0;
    let failed = 0;

    // Test 1: Stats shows total traces count
    if (await test('shows total traces count', async () => {
        const result = await runStats();
        assert(result.code === 0, `Expected exit code 0, got ${result.code}`);
        assert(result.stdout.includes('Total Traces'), `Expected 'Total Traces' in output`);
    })) passed++; else failed++;

    // Test 2: Stats shows error rate
    if (await test('shows error rate', async () => {
        const result = await runStats();
        assert(result.stdout.includes('Error Rate'), `Expected 'Error Rate' in output`);
        assert(result.stdout.includes('%'), `Expected percentage sign in output`);
    })) passed++; else failed++;

    // Test 3: Stats shows average duration
    if (await test('shows average duration', async () => {
        const result = await runStats();
        assert(result.stdout.includes('Avg Duration'), `Expected 'Avg Duration' in output`);
    })) passed++; else failed++;

    // Test 4: Stats shows token budget usage
    if (await test('shows token budget usage', async () => {
        const result = await runStats();
        assert(result.stdout.includes('Token Budget'), `Expected 'Token Budget' in output`);
    })) passed++; else failed++;

    // Test 5: Stats shows top errors section when errors exist
    if (await test('shows top errors when present', async () => {
        // First check if there are any errors in DB
        const SQL = await initSqlJs();
        const buffer = fs.readFileSync(TRACKER_DB);
        const db = new SQL.Database(buffer);

        // Insert a test error trace
        insertTestTrace(db, {
            tool_name: 'Bash',
            tool_input: 'npm test',
            exit_code: 1,
            error_output: 'Test failed: expected true'
        });

        const data = db.export();
        fs.writeFileSync(TRACKER_DB, Buffer.from(data));
        db.close();

        const result = await runStats();
        assert(result.stdout.includes('Top Errors'), `Expected 'Top Errors' section in output`);
    })) passed++; else failed++;

    // Test 6: Stats shows detections section when present
    if (await test('shows detections when present', async () => {
        const SQL = await initSqlJs();
        const buffer = fs.readFileSync(TRACKER_DB);
        const db = new SQL.Database(buffer);

        // Insert a test detection
        insertTestDetection(db, {
            pattern_type: 'SAME_ERROR_LOOP',
            severity: 'high',
            description: 'Same error repeated 3 times'
        });

        const data = db.export();
        fs.writeFileSync(TRACKER_DB, Buffer.from(data));
        db.close();

        const result = await runStats();
        assert(result.stdout.includes('Detections'), `Expected 'Detections' section in output`);
    })) passed++; else failed++;

    // Test 7: Stats shows recent sessions
    if (await test('shows recent sessions', async () => {
        const result = await runStats();
        assert(result.stdout.includes('Recent Sessions'), `Expected 'Recent Sessions' section in output`);
    })) passed++; else failed++;

    // Test 8: Stats handles missing database gracefully
    if (await test('handles missing database gracefully', async () => {
        const backupPath = TRACKER_DB + '.backup';
        fs.renameSync(TRACKER_DB, backupPath);

        try {
            const result = await runStats();
            assert(result.code === 0, `Expected exit code 0, got ${result.code}`);
            assert(result.stdout.includes('No tracker database'), `Expected 'No tracker database' message`);
        } finally {
            fs.renameSync(backupPath, TRACKER_DB);
        }
    })) passed++; else failed++;

    // Test 9: Stats can be required as module
    if (await test('exports getStats function', async () => {
        const stats = require(STATS_PATH);
        assert(typeof stats.getStats === 'function', `Expected getStats to be a function`);
    })) passed++; else failed++;

    console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
    process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(e => {
    console.error('Test runner error:', e);
    process.exit(1);
});
