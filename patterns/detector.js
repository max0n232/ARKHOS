#!/usr/bin/env node
/**
 * Stop Hook: Pattern Detector
 *
 * Realtime detection of dangerous patterns:
 * - P1: Loop (same command failing repeatedly)
 * - P2: Budget burn (high call rate with errors)
 * - P3: Destructive (blocked commands repeated)
 */

const fs = require('fs');
const path = require('path');

const CLAUDE_DIR = path.join(process.env.HOME || process.env.USERPROFILE, '.claude');
const TRACKER_DB = path.join(CLAUDE_DIR, 'patterns', 'tracker.db');
const CAPSULE_PATH = path.join(CLAUDE_DIR, 'memory', 'session', 'capsule.json');

let initSqlJs;
try {
    initSqlJs = require('sql.js');
} catch (e) {
    process.exit(0);
}

async function loadCapsule() {
    try {
        const content = await fs.promises.readFile(CAPSULE_PATH, 'utf-8');
        return JSON.parse(content);
    } catch (e) {
        return null;
    }
}

function getConfig(db, key, defaultValue) {
    try {
        const result = db.exec(`SELECT value FROM config WHERE key = '${key}'`);
        if (result.length && result[0].values.length) {
            return parseFloat(result[0].values[0][0]);
        }
    } catch (e) {}
    return defaultValue;
}

// P1: Loop Detection
function detectLoop(db, sessionId) {
    const threshold = getConfig(db, 'loop_threshold', 3);

    const result = db.exec(`
        SELECT tool_input, COUNT(*) as cnt, MAX(error_output) as last_error
        FROM traces
        WHERE session_id = '${sessionId}' AND exit_code != 0
        GROUP BY tool_input
        HAVING cnt >= ${threshold}
        ORDER BY cnt DESC
        LIMIT 1
    `);

    if (result.length && result[0].values.length) {
        const [tool_input, cnt, last_error] = result[0].values[0];
        return {
            type: 'P1',
            severity: cnt >= 5 ? 'critical' : 'high',
            count: cnt,
            tool_input,
            last_error,
            message: `WARNING LOOP DETECTED: Command failed ${cnt} times.\n\nCommand: ${tool_input}\n\nSTOP. Analyze the error before repeating:\n${last_error || 'Unknown error'}`,
            forceStop: cnt >= 5
        };
    }
    return null;
}

// P2: Budget Burn Detection
function detectBudgetBurn(db, sessionId) {
    const callsThreshold = getConfig(db, 'budget_burn_calls', 20);
    const windowSec = getConfig(db, 'budget_burn_window_sec', 60);
    const errorRateThreshold = getConfig(db, 'budget_burn_error_rate', 0.5);

    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - windowSec;

    const result = db.exec(`
        SELECT
            COUNT(*) as total,
            SUM(CASE WHEN exit_code != 0 THEN 1 ELSE 0 END) as errors
        FROM traces
        WHERE session_id = '${sessionId}' AND timestamp > ${windowStart}
    `);

    if (result.length && result[0].values.length) {
        const [total, errors] = result[0].values[0];
        if (total >= callsThreshold) {
            const errorRate = errors / total;
            if (errorRate > errorRateThreshold) {
                return {
                    type: 'P2',
                    severity: 'high',
                    total,
                    errors,
                    errorRate,
                    message: `WARNING BUDGET BURN: ${total} tool calls in ${windowSec}s with ${Math.round(errorRate * 100)}% error rate.\n\nPause and analyze the approach.`
                };
            }
        }
    }
    return null;
}

// P3: Destructive Pattern Detection
function detectDestructive(db, sessionId) {
    const result = db.exec(`
        SELECT tool_input, COUNT(*) as cnt
        FROM traces
        WHERE session_id = '${sessionId}' AND tool_name = 'Bash' AND exit_code = -1
        GROUP BY tool_input
        HAVING cnt >= 2
        LIMIT 1
    `);

    if (result.length && result[0].values.length) {
        const [tool_input, cnt] = result[0].values[0];
        return {
            type: 'P3',
            severity: 'critical',
            count: cnt,
            tool_input,
            message: `CRITICAL DESTRUCTIVE PATTERN: Attempting blocked command repeatedly.\n\nCommand: ${tool_input}\n\nThis command is blocked by security. Find an alternative approach.`
        };
    }
    return null;
}

// Record detection to database
function recordDetection(db, sessionId, detection) {
    db.run(`
        INSERT INTO detections (session_id, pattern_type, severity, description, context)
        VALUES (?, ?, ?, ?, ?)
    `, [
        sessionId,
        detection.type,
        detection.severity,
        detection.message.split('\n')[0],
        JSON.stringify(detection)
    ]);
}

async function detect() {
    // Check if DB exists
    try {
        await fs.promises.access(TRACKER_DB);
    } catch (e) {
        process.exit(0);
    }

    const capsule = await loadCapsule();
    if (!capsule?.session_id) {
        process.exit(0);
    }

    try {
        const SQL = await initSqlJs();
        const buffer = await fs.promises.readFile(TRACKER_DB);
        const db = new SQL.Database(buffer);

        const sessionId = capsule.session_id;

        // Run detectors (critical first)
        const p3 = detectDestructive(db, sessionId);
        const p1 = detectLoop(db, sessionId);
        const p2 = detectBudgetBurn(db, sessionId);

        const detections = [p3, p1, p2].filter(d => d !== null);

        if (detections.length > 0) {
            // Record all detections
            for (const det of detections) {
                recordDetection(db, sessionId, det);
            }

            // Save database
            await fs.promises.writeFile(TRACKER_DB, Buffer.from(db.export()));

            // Output most severe warning
            const critical = detections.find(d => d.severity === 'critical');
            const warning = critical || detections[0];

            console.error(warning.message);

            db.close();

            // Force stop on critical with high repetition
            if (critical?.forceStop) {
                process.exit(1);
            }
        } else {
            db.close();
        }
    } catch (e) {
        // Silent fail
    }

    process.exit(0);
}

detect().catch(() => process.exit(0));
