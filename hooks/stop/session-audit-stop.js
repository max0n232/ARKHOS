#!/usr/bin/env node
/**
 * Stop Hook: Session Audit (end-of-session knowledge extraction)
 *
 * Runs session-audit at session end, not just at compaction.
 * Threshold: only runs if session has >= MIN_TURNS new turns since last audit.
 * Reuses the same session-audit.js logic and state file.
 *
 * Input: stdin JSON with { transcript_path, ... }
 */

const fs = require('fs');
const path = require('path');

const CLAUDE_DIR = path.join(process.env.HOME || process.env.USERPROFILE, '.claude');
const STATE_FILE = path.join(CLAUDE_DIR, 'hooks/pre-compact/.audit-state.json');
const AUDIT_SCRIPT = path.join(CLAUDE_DIR, 'hooks/pre-compact/session-audit.js');
const MIN_TURNS = 10;

function readStdin() {
    return new Promise(resolve => {
        let data = '';
        const timer = setTimeout(() => resolve(data), 2000);
        process.stdin.setEncoding('utf8');
        process.stdin.on('data', chunk => data += chunk);
        process.stdin.on('end', () => { clearTimeout(timer); resolve(data); });
        process.stdin.on('error', () => { clearTimeout(timer); resolve(data); });
    });
}

async function main() {
    const stdin = await readStdin();
    let transcriptPath = '';
    try { transcriptPath = JSON.parse(stdin).transcript_path || ''; } catch {}

    if (!transcriptPath || !fs.existsSync(transcriptPath)) {
        return;
    }

    // Check how many new turns since last audit
    let lastLine = 0;
    try {
        const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
        if (state.transcriptPath === transcriptPath) lastLine = state.lastLine || 0;
    } catch {}

    let totalLines = 0;
    try {
        const content = fs.readFileSync(transcriptPath, 'utf8');
        totalLines = content.split('\n').filter(l => l.trim()).length;
    } catch { return; }

    const newTurns = totalLines - lastLine;
    if (newTurns < MIN_TURNS) {
        process.stderr.write(`[session-audit-stop] ${newTurns} new turns < ${MIN_TURNS} threshold, skipping\n`);
        return;
    }

    // Run session-audit by spawning it with the same stdin
    process.stderr.write(`[session-audit-stop] ${newTurns} new turns, running audit...\n`);
    const { spawn } = require('child_process');
    const child = spawn('node', [AUDIT_SCRIPT], {
        stdio: ['pipe', 'inherit', 'inherit'],
        windowsHide: true
    });
    child.stdin.write(stdin);
    child.stdin.end();

    await new Promise((resolve) => {
        child.on('close', resolve);
        child.on('error', resolve);
    });
}

main().catch(err => process.stderr.write(`[session-audit-stop] ${err.message}\n`));
