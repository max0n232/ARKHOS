#!/usr/bin/env node
/**
 * Stop Hook: Pattern Detector
 *
 * Realtime detection of patterns:
 * - P1: Loop (same command failing repeatedly)
 * - P2: Budget burn (high call rate with errors)
 * - P3: Destructive (blocked commands repeated)
 * - P4: Success (5+ consecutive successful operations)
 *
 * Uses better-sqlite3 (sync, native) with prepared statements.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const { getDb, getConfig, loadCapsule } = require('../../patterns/db-helper');
const { VAULT_DIR } = require('../shared/paths');

const GLOBAL_PATTERNS = path.join(
    VAULT_DIR,
    '10-Projects/Studiokook/20-Areas/Infrastructure/global-patterns.md'
);

// Sanitize output (remove ANSI escape codes and control characters)
function sanitizeOutput(str) {
    if (!str) return '';
    return String(str).replace(/[\x00-\x1F\x7F]/g, '');
}

// Short deterministic fingerprint for dedup keys
function fingerprint(input) {
    return crypto.createHash('md5').update(String(input)).digest('hex').slice(0, 8);
}

/**
 * Route a detection to global-patterns.md with counter-based dedup.
 * Tag format: <!-- pattern:TYPE key:HASH -->
 * Line under tag: - [YYYY-MM-DD] TYPE: description [count:N]
 * Existing lines get counter incremented and date refreshed.
 */
function routeToVault(detection) {
    const fp = fingerprint(detection.tool_input || detection.type + (detection.total || 0));
    const tag = `<!-- pattern:${detection.type} key:${fp} -->`;
    const today = new Date().toISOString().slice(0, 10);

    const snippet = (detection.tool_input || detection.message.split('\n')[0])
        .replace(/\s+/g, ' ')
        .slice(0, 120);

    let content = '';
    try { content = fs.readFileSync(GLOBAL_PATTERNS, 'utf8'); } catch { content = ''; }

    const SECTION = '## Detections [machine-managed]';
    if (!content.includes(SECTION)) {
        content = content.trimEnd() + '\n\n' + SECTION + '\n<!-- managed by pattern-detector.js -->\n';
    }

    const lines = content.split('\n');
    const tagIdx = lines.findIndex(l => l.trim() === tag);

    if (tagIdx >= 0) {
        const nextIdx = tagIdx + 1;
        if (nextIdx < lines.length && lines[nextIdx].startsWith('- ')) {
            const existing = lines[nextIdx];
            const countMatch = existing.match(/\[count:(\d+)\]/);
            const n = countMatch ? parseInt(countMatch[1]) + 1 : 2;
            lines[nextIdx] = `- [${today}] ${detection.type} ${detection.severity}: ${snippet} [count:${n}]`;
        }
    } else {
        lines.push(tag);
        lines.push(`- [${today}] ${detection.type} ${detection.severity}: ${snippet} [count:1]`);
    }

    try {
        fs.mkdirSync(path.dirname(GLOBAL_PATTERNS), { recursive: true });
        fs.writeFileSync(GLOBAL_PATTERNS, lines.join('\n'), 'utf8');
    } catch {}
}

// P1: Loop Detection
function detectLoop(db, sessionId) {
    const threshold = getConfig(db, 'loop_threshold', 3);

    const row = db.prepare(`
        SELECT tool_input, COUNT(*) as cnt, MAX(error_output) as last_error
        FROM traces
        WHERE session_id = ? AND exit_code != 0
        GROUP BY tool_input
        HAVING cnt >= ?
        ORDER BY cnt DESC
        LIMIT 1
    `).get(sessionId, threshold);

    if (row) {
        return {
            type: 'P1',
            severity: row.cnt >= 5 ? 'critical' : 'high',
            count: row.cnt,
            tool_input: sanitizeOutput(row.tool_input),
            last_error: sanitizeOutput(row.last_error),
            message: `WARNING LOOP DETECTED: Command failed ${row.cnt} times.\n\nCommand: ${sanitizeOutput(row.tool_input)}\n\nSTOP. Analyze the error before repeating:\n${sanitizeOutput(row.last_error) || 'Unknown error'}`,
            forceStop: row.cnt >= 5
        };
    }
    return null;
}

// P2: Budget Burn Detection
function detectBudgetBurn(db, sessionId) {
    const callsThreshold = getConfig(db, 'budget_burn_calls', 20);
    const windowSec = getConfig(db, 'budget_burn_window_sec', 60);
    const errorRateThreshold = getConfig(db, 'budget_burn_error_rate', 0.5);

    const windowStart = Math.floor(Date.now() / 1000) - windowSec;

    const row = db.prepare(`
        SELECT
            COUNT(*) as total,
            SUM(CASE WHEN exit_code != 0 THEN 1 ELSE 0 END) as errors
        FROM traces
        WHERE session_id = ? AND timestamp > ?
    `).get(sessionId, windowStart);

    if (row && row.total >= callsThreshold) {
        const errorRate = row.errors / row.total;
        if (errorRate > errorRateThreshold) {
            return {
                type: 'P2',
                severity: 'high',
                total: row.total,
                errors: row.errors,
                errorRate,
                message: `WARNING BUDGET BURN: ${row.total} tool calls in ${windowSec}s with ${Math.round(errorRate * 100)}% error rate.\n\nPause and analyze the approach.`
            };
        }
    }
    return null;
}

// P3: Destructive Pattern Detection
function detectDestructive(db, sessionId) {
    const row = db.prepare(`
        SELECT tool_input, COUNT(*) as cnt
        FROM traces
        WHERE session_id = ? AND tool_name = 'Bash' AND exit_code = -1
        GROUP BY tool_input
        HAVING cnt >= 2
        LIMIT 1
    `).get(sessionId);

    if (row) {
        return {
            type: 'P3',
            severity: 'critical',
            count: row.cnt,
            tool_input: sanitizeOutput(row.tool_input),
            message: `CRITICAL DESTRUCTIVE PATTERN: Attempting blocked command repeatedly.\n\nCommand: ${sanitizeOutput(row.tool_input)}\n\nThis command is blocked by security. Find an alternative approach.`
        };
    }
    return null;
}

// P4: Success Pattern Detection (5+ consecutive successes)
function detectSuccessPatterns(db, sessionId) {
    const rows = db.prepare(`
        SELECT exit_code
        FROM traces
        WHERE session_id = ?
        ORDER BY timestamp DESC
        LIMIT 10
    `).all(sessionId);

    let streak = 0;
    for (const row of rows) {
        if (row.exit_code === 0) streak++;
        else break;
    }

    if (streak >= 5) {
        db.prepare(`
            INSERT INTO detections (session_id, pattern_type, severity, description, context)
            VALUES (?, 'P4', 'low', ?, ?)
        `).run(
            sessionId,
            `Success pattern: ${streak} consecutive successful operations`,
            JSON.stringify({ type: 'success_streak', count: streak })
        );
        return { type: 'P4', count: streak };
    }
    return null;
}

// Record detection to database
function recordDetection(db, sessionId, detection) {
    const description = detection.message.split('\n')[0];
    db.prepare(`
        INSERT INTO detections (session_id, pattern_type, severity, description, context)
        VALUES (?, ?, ?, ?, ?)
    `).run(sessionId, detection.type, detection.severity, description, JSON.stringify(detection));
}

function main() {
    const db = getDb();
    if (!db) process.exit(0);

    const capsule = loadCapsule();
    if (!capsule?.session_id) {
        db.close();
        process.exit(0);
    }

    // Validate session_id format (alphanumeric, dash, underscore only)
    if (!/^[a-zA-Z0-9_-]+$/.test(capsule.session_id)) {
        db.close();
        process.exit(0);
    }

    try {
        const sessionId = capsule.session_id;

        // Run detectors (critical first)
        const p3 = detectDestructive(db, sessionId);
        const p1 = detectLoop(db, sessionId);
        const p2 = detectBudgetBurn(db, sessionId);
        const p4 = detectSuccessPatterns(db, sessionId);

        const detections = [p3, p1, p2].filter(d => d !== null);

        if (detections.length > 0) {
            for (const det of detections) {
                recordDetection(db, sessionId, det);
                try { routeToVault(det); } catch (_) {}
            }

            // Output most severe warning to stdout so Claude sees it
            const critical = detections.find(d => d.severity === 'critical');
            const warning = critical || detections[0];
            process.stdout.write(warning.message + '\n');

            db.close();

            // Force stop on critical with high repetition
            if (critical?.forceStop) {
                process.exit(1);
            }
        } else {
            db.close();
        }
    } catch (e) {
        try { db.close(); } catch (_) {}
    }

    process.exit(0);
}

main();
