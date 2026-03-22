#!/usr/bin/env node
/**
 * UserPromptSubmit Hook: Compact Report Injector + AUTOSEARCH Relay
 *
 * 1. If AUTOSEARCH section exists in MEMORY.md → output it to stdout (VS Code injection).
 *    Does NOT clean it — worker overwrites it on next search; Claude Desktop reads it from MEMORY.md.
 *
 * 2. If pending compact report file exists → inject it to stdout and clean MEMORY.md PENDING section.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const CLAUDE_DIR = path.join(os.homedir(), '.claude');
const PENDING_FILE = path.join(CLAUDE_DIR, 'hooks', '.pending-compact-report.txt');
const MEMORY_FILE = path.join(CLAUDE_DIR, 'projects/C--Users-sorte--claude/memory/MEMORY.md');

const AUTOSEARCH_RE = /<!--AUTOSEARCH-START-->([\s\S]*?)<!--AUTOSEARCH-END-->/;
const PENDING_RE = /<!--PENDING-START-->[\s\S]*?<!--PENDING-END-->\n?/g;

let output = [];

// --- AUTOSEARCH relay ---
try {
    const mem = fs.readFileSync(MEMORY_FILE, 'utf8');
    const match = mem.match(AUTOSEARCH_RE);
    if (match) {
        const content = match[1].trim();
        if (content) {
            output.push(
                '[AUTOSEARCH] Vault/Ghost results from previous query — use DIRECTLY, skip manual search:',
                content,
                '→ If content is irrelevant to current task → then do manual vault/ghost search.'
            );
        }
    }
} catch {}

// --- Compact report injection ---
if (fs.existsSync(PENDING_FILE)) {
    try {
        const content = fs.readFileSync(PENDING_FILE, 'utf8').trim();
        fs.unlinkSync(PENDING_FILE);

        // Clean PENDING section from MEMORY.md
        try {
            let mem = fs.readFileSync(MEMORY_FILE, 'utf8');
            const cleaned = mem.replace(PENDING_RE, '');
            if (cleaned !== mem) fs.writeFileSync(MEMORY_FILE, cleaned, 'utf8');
        } catch {}

        if (content) {
            output.unshift(
                `[COMPACT REPORT] Display this session compact report at the very start of your response, before answering the user. Output it verbatim as a code block:\n\n${content}`
            );
        }
    } catch {}
}

if (output.length) {
    console.log(output.join('\n\n'));
}
