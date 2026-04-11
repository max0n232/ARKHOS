#!/usr/bin/env node
/**
 * UserPromptSubmit Hook: Auto Knowledge Search (async)
 *
 * Reads prompt, spawns auto-search-worker.js in background (no wait).
 * Worker runs qmd vsearch (cross-lingual vector search) and writes results
 * to MEMORY.md AUTOSEARCH section — visible in the NEXT message's context.
 *
 * NOTE: No AUTOSEARCH cleanup here — worker handles its own section replacement.
 * compact-report-injector.js relays the section to stdout for VS Code.
 */

const path = require('path');
const { spawn } = require('child_process');

const WORKER = path.join(__dirname, 'auto-search-worker.js');
const MIN_LENGTH = 25;

const RECALL_PATTERNS = /помнишь|напомни|что мы решили|ранее|до этого|в прошлой сессии|мы обсуждали|мы делали|we discussed|remind me|you said|what did we decide|remember when|previously|last session|last time/i;

// Short follow-ups that imply recall ("продолжаем", "дальше") bypass MIN_LENGTH
const FOLLOWUP_PATTERNS = /^(продолж|дальше|что дальше|далее|next|continue|keep going|go on|ещё|еще|повтори)/i;

function readStdin() {
    return new Promise(resolve => {
        let data = '';
        const t = setTimeout(() => resolve(data), 2000);
        process.stdin.setEncoding('utf8');
        process.stdin.on('data', c => data += c);
        process.stdin.on('end', () => { clearTimeout(t); resolve(data); });
        process.stdin.on('error', () => { clearTimeout(t); resolve(data); });
    });
}

async function main() {
    const raw = await readStdin();
    let prompt = '';
    try { prompt = JSON.parse(raw).prompt || ''; } catch { return; }

    // Worker handles its own AUTOSEARCH cleanup before writing — no cleanup needed here.
    // Cleaning here would destroy AUTOSEARCH before the model sees it in MEMORY.md context.

    const trimmed = prompt.trim();
    const isFollowup = FOLLOWUP_PATTERNS.test(trimmed);
    if (trimmed.length < MIN_LENGTH && !isFollowup) return;

    const query = prompt.slice(0, 200).replace(/"/g, ' ').trim();
    const deep = (RECALL_PATTERNS.test(prompt) || isFollowup) ? 'deep' : '';

    // Spawn worker detached — exits immediately, worker runs in background
    // windowsHide prevents console popup on Windows; unref allows hook to exit without waiting
    const child = spawn(process.execPath, [WORKER, query, deep], {
        stdio: 'ignore',
        windowsHide: true
    });
    child.unref();

    console.log('[AUTO-SEARCH] background search started');
}

main().catch(() => {});
