#!/usr/bin/env node
/**
 * StopFailure Hook: handles API errors during Stop hooks
 *
 * When output-critic prompt hook fails (API error, timeout, etc.),
 * this logs the failure so we know enforcement was skipped.
 * Writes to stderr (visible in logs) and appends to failure log.
 */

const fs = require('fs');
const path = require('path');

function readStdinSync() {
    const chunks = [];
    const buf = Buffer.alloc(1024);
    try {
        let bytesRead;
        while ((bytesRead = fs.readSync(0, buf, 0, 1024)) > 0) {
            chunks.push(buf.slice(0, bytesRead).toString());
        }
    } catch (e) {}
    return chunks.join('');
}

try {
    const raw = readStdinSync();
    const input = raw ? JSON.parse(raw) : {};

    const logDir = path.join(__dirname, '..', '..', 'logs');
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

    const logFile = path.join(logDir, 'stop-failures.log');
    const entry = {
        ts: new Date().toISOString(),
        session_id: input.session_id || 'unknown',
        error: input.error || 'unknown',
        hook_name: input.hook_name || 'unknown'
    };

    fs.appendFileSync(logFile, JSON.stringify(entry) + '\n');
    process.stderr.write(`[StopFailure] Hook failed: ${entry.hook_name} — ${entry.error}\n`);
} catch (e) {
    process.stderr.write(`[StopFailure] Handler error: ${e.message}\n`);
}
