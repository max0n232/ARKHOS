#!/usr/bin/env node
/**
 * UserPromptSubmit Hook: Compact Report Injector + AUTOSEARCH Relay
 *
 * 1. If AUTOSEARCH section exists in MEMORY.md → output it to stdout (VS Code injection).
 *    Does NOT clean it — worker overwrites it on next search; Claude Desktop reads it from MEMORY.md.
 *
 * 2. If pending compact report file exists → inject it to stdout (backup delivery).
 *    PENDING block in MEMORY.md is NOT cleaned here — Claude reads it natively and removes after display.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const CLAUDE_DIR = path.join(os.homedir(), '.claude');
const PENDING_FILE = path.join(CLAUDE_DIR, 'hooks', '.pending-compact-report.txt');
const MEMORY_FILE = path.join(CLAUDE_DIR, 'projects/C--Users-sorte--claude/memory/MEMORY.md');

const AUTOSEARCH_RE = /<!--AUTOSEARCH-START-->([\s\S]*?)<!--AUTOSEARCH-END-->/;
// PENDING_RE no longer used here — Claude removes block via Edit tool

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

        // PENDING block stays in MEMORY.md — Claude reads it natively
        // and removes it via Edit tool after displaying the report

        if (content) {
            output.unshift(
                `[COMPACT REPORT] Display this session compact report at the very start of your response, before answering the user. Output it verbatim as a code block:\n\n${content}`
            );
        }
    } catch {}
}

// --- Context usage monitor ---
try {
    const projDir = path.join(CLAUDE_DIR, 'projects/C--Users-sorte--claude');
    const jsonls = fs.readdirSync(projDir)
        .filter(f => f.endsWith('.jsonl'))
        .map(f => ({ name: f, mtime: fs.statSync(path.join(projDir, f)).mtimeMs }))
        .sort((a, b) => b.mtime - a.mtime);

    if (jsonls.length) {
        const filePath = path.join(projDir, jsonls[0].name);
        const stat = fs.statSync(filePath);
        const readSize = Math.min(stat.size, 8192);
        const buf = Buffer.alloc(readSize);
        const fd = fs.openSync(filePath, 'r');
        fs.readSync(fd, buf, 0, readSize, Math.max(0, stat.size - readSize));
        fs.closeSync(fd);
        const tail = buf.toString('utf8');
        const lines = tail.split('\n').filter(l => l.trim());
        for (let i = lines.length - 1; i >= 0; i--) {
            try {
                const obj = JSON.parse(lines[i]);
                const usage = obj.usage || obj.message?.usage;
                if (usage && usage.input_tokens) {
                    const total = (usage.input_tokens || 0) +
                        (usage.cache_creation_input_tokens || 0) +
                        (usage.cache_read_input_tokens || 0);
                    const pct = Math.round(total / 2000);
                    if (pct >= 90) {
                        output.push(`[CONTEXT] Context at ${pct}% — /compact recommended NOW`);
                    } else if (pct >= 80) {
                        output.push(`[CONTEXT] Context at ${pct}% — consider /compact or finishing current task`);
                    } else if (pct >= 70) {
                        output.push(`[CONTEXT] Context at ${pct}% — approaching limit, plan accordingly`);
                    }
                    break;
                }
            } catch {}
        }
    }
} catch {}

if (output.length) {
    console.log(output.join('\n\n'));
}
