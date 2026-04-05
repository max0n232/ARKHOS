#!/usr/bin/env node
/**
 * Background worker: Auto-checkpoint at 80% context.
 *
 * Spawned by compact-report-injector.js when context first reaches 80%.
 * Reads JSONL transcript tail, calls Sonnet for compressed summary,
 * saves to Ghost (survives across sessions) + capsule file (post-compact delivery).
 *
 * argv[2]: path to session JSONL file
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { CLAUDE_DIR } = require('../shared/paths');
const { callSonnet } = require('../shared/obsidian-api');

const GHOST = '/c/Users/sorte/.bun/install/global/node_modules/ghost/ghost';
const CAPSULE_FILE = path.join(CLAUDE_DIR, 'hooks', '.checkpoint-capsule.md');

const jsonlPath = process.argv[2];
if (!jsonlPath || !fs.existsSync(jsonlPath)) process.exit(0);

function extractTranscript(filePath) {
    const stat = fs.statSync(filePath);
    const readSize = Math.min(stat.size, 65536);
    const buf = Buffer.alloc(readSize);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buf, 0, readSize, Math.max(0, stat.size - readSize));
    fs.closeSync(fd);

    const lines = buf.toString('utf8').split('\n').filter(l => l.trim());
    const parts = [];

    for (const line of lines) {
        try {
            const obj = JSON.parse(line);
            const msg = obj.message || {};
            const role = msg.role;
            const content = Array.isArray(msg.content) ? msg.content : [];

            if (role === 'user') {
                const text = content
                    .filter(c => c.type === 'text')
                    .map(c => c.text)
                    .join(' ')
                    .trim();
                if (text && !text.startsWith('<system-reminder')) {
                    parts.push('USER: ' + text.slice(0, 200));
                }
            } else if (role === 'assistant') {
                const text = content
                    .filter(c => c.type === 'text')
                    .map(c => c.text)
                    .join(' ')
                    .trim();
                const tools = content
                    .filter(c => c.type === 'tool_use')
                    .map(c => c.name);
                if (text) parts.push('ASSISTANT: ' + text.slice(0, 300));
                if (tools.length) parts.push('TOOLS: ' + [...new Set(tools)].join(', '));
            }
        } catch {}
    }

    const full = parts.join('\n');
    if (full.length <= 10000) return full;
    return full.slice(0, 2000) + '\n[...truncated...]\n' + full.slice(-8000);
}

async function main() {
    const transcript = extractTranscript(jsonlPath);
    if (!transcript || transcript.length < 100) {
        process.stderr.write('[checkpoint] transcript too short, skipping\n');
        return;
    }

    const summary = await callSonnet(
        'You compress Claude Code session transcripts into concise checkpoint summaries.\nOutput 3-6 bullet points in Russian:\n- What was done (completed tasks)\n- Key decisions made\n- Current state (what is in progress)\n- Next steps (if mentioned)\n- Any errors/blockers encountered\nMax 600 chars. No preamble, just bullets starting with "- ".',
        transcript,
        500
    );

    if (!summary || summary.length < 20) {
        process.stderr.write('[checkpoint] empty summary from API\n');
        return;
    }

    const oneLine = summary.replace(/\n/g, ' | ').replace(/"/g, "'").slice(0, 350);

    try {
        execSync('bash "' + GHOST + '" knowledge "Auto-checkpoint 80%: ' + oneLine + '"', {
            timeout: 8000,
            windowsHide: true,
            stdio: 'pipe'
        });
    } catch (e) {
        process.stderr.write('[checkpoint] ghost save failed: ' + e.message + '\n');
    }

    try {
        fs.writeFileSync(CAPSULE_FILE, [
            '## Session Checkpoint (auto, 80% context)',
            '_' + new Date().toISOString().slice(0, 16) + '_',
            '',
            summary.trim(),
            ''
        ].join('\n'), 'utf8');
    } catch {}

    process.stderr.write('[checkpoint] saved to Ghost + capsule\n');
}

main().catch(e => {
    process.stderr.write('[checkpoint] failed: ' + e.message + '\n');
});
