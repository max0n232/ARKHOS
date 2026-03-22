#!/usr/bin/env node
/**
 * PreCompact Hook: Ghost Session Finalizer
 *
 * Finalizes the current Ghost session by moving it from active/ to completed/
 * and triggering QMD reindex. Workaround for SessionEnd not being a valid
 * Claude Code hook event.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const CLAUDE_DIR = path.join(process.env.USERPROFILE || process.env.HOME, '.claude');
const SESSIONS_DIR = path.join(CLAUDE_DIR, '.ai-sessions');
const ACTIVE_DIR = path.join(SESSIONS_DIR, 'active');
const COMPLETED_DIR = path.join(SESSIONS_DIR, 'completed');
const CURRENT_ID_FILE = path.join(ACTIVE_DIR, 'current-id');

function main() {
    // Diagnostic: log each invocation
    const LOG_FILE = path.join(CLAUDE_DIR, 'hooks/pre-compact/pre-compact-calls.log');
    try { fs.appendFileSync(LOG_FILE, JSON.stringify({ ts: new Date().toISOString(), script: 'ghost-finalize' }) + '\n'); } catch {}

    // Read current session ID
    if (!fs.existsSync(CURRENT_ID_FILE)) {
        return;
    }
    const sessionId = fs.readFileSync(CURRENT_ID_FILE, 'utf-8').trim();
    if (!sessionId) return;

    const activeFile = path.join(ACTIVE_DIR, `${sessionId}.md`);
    if (!fs.existsSync(activeFile)) {
        return;
    }

    // Move session to completed/
    try {
        fs.mkdirSync(COMPLETED_DIR, { recursive: true });
        const completedFile = path.join(COMPLETED_DIR, `${sessionId}.md`);
        fs.copyFileSync(activeFile, completedFile);
        fs.unlinkSync(activeFile);
        console.log(`Ghost: finalized session ${sessionId}`);
    } catch (e) {
        console.error(`Ghost: failed to move session ${sessionId}: ${e.message}`);
        return;
    }

    // Reindex QMD via bash using full path (qmd sh script, not .exe shim)
    const QMD = '/c/Users/sorte/.bun/install/global/node_modules/@tobilu/qmd/bin/qmd';
    const result = spawnSync('bash', ['-c', `"${QMD}" update && "${QMD}" embed`], {
        stdio: 'pipe',
        timeout: 90000
    });
    if (result.status === 0) {
        console.log('Ghost: QMD reindexed');
    } else {
        const reason = result.error ? result.error.message : `exit ${result.status}`;
        const stderr = result.stderr ? result.stderr.toString().trim() : '';
        const stdout = result.stdout ? result.stdout.toString().trim() : '';
        const detail = stderr || stdout || '(no output)';
        console.log(`Ghost: QMD reindex failed (${reason}): ${detail.slice(0, 300)}`);
    }
}

main();
