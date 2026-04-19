#!/usr/bin/env node
/**
 * UserPromptSubmit Hook: Compact Report Injector + AUTOSEARCH Relay + Auto-Checkpoint
 *
 * 1. If AUTOSEARCH section exists in MEMORY.md → output it to stdout (VS Code injection).
 *    Does NOT clean it — worker overwrites it on next search; Claude Desktop reads it from MEMORY.md.
 *
 * 2. If pending compact report file exists → inject it to stdout (backup delivery).
 *    PENDING block in MEMORY.md is NOT cleaned here — Claude reads it natively and removes after display.
 *
 * 3. Context monitor: at 80% spawns checkpoint-worker.js (once per session) to save
 *    session summary to Ghost + capsule before compaction destroys context.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

const CLAUDE_DIR = path.join(os.homedir(), '.claude');
const PENDING_FILE = path.join(CLAUDE_DIR, 'hooks', '.pending-compact-report.txt');
const CACHE_FILE = path.join(CLAUDE_DIR, 'hooks', '.autosearch-cache.md');
const CHECKPOINT_WORKER = path.join(__dirname, 'checkpoint-worker.js');

let output = [];

// --- Hook input (transcript_path for THIS session, not latest-mtime JSONL) ---
let hookInput = {};
try {
    const raw = fs.readFileSync(0, 'utf8');
    if (raw && raw.trim()) hookInput = JSON.parse(raw);
} catch {}

// --- AUTOSEARCH relay (read from dedicated cache, not MEMORY.md) ---
try {
    const content = fs.readFileSync(CACHE_FILE, 'utf8').trim();
    if (content) {
        output.push(
            '[AUTOSEARCH] Vault/Ghost results from previous query — use DIRECTLY, skip manual search:',
            content,
            '→ If content is irrelevant to current task → then do manual vault/ghost search.'
        );
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
    // Prefer transcript_path from hook stdin — uniquely identifies THIS session,
    // avoids reading a parallel session's JSONL (which was causing 94% false alarms).
    let filePath = hookInput && hookInput.transcript_path;
    if (!filePath || !fs.existsSync(filePath)) {
        const projDir = path.join(CLAUDE_DIR, 'projects/C--Users-sorte--claude');
        const jsonls = fs.readdirSync(projDir)
            .filter(f => f.endsWith('.jsonl'))
            .map(f => ({ name: f, mtime: fs.statSync(path.join(projDir, f)).mtimeMs }))
            .sort((a, b) => b.mtime - a.mtime);
        filePath = jsonls.length ? path.join(projDir, jsonls[0].name) : null;
    }

    if (filePath && fs.existsSync(filePath)) {
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
                    // Opus 4.7 [1M context] = 1,000,000 tokens.
                    // Thresholds scaled down: Opus attention/recall degrades well before
                    // the hard limit (noticeable >200K of effective context), so warn early.
                    const CTX_LIMIT = 1000000;
                    const pct = Math.round(total * 100 / CTX_LIMIT);
                    if (pct >= 25) {
                        output.push(`[CONTEXT] Context at ${pct}% — /compact recommended NOW`);
                    } else if (pct >= 20) {
                        output.push('[CONTEXT] Context at ' + pct + '% — consider /compact or finishing current task');
                        // Auto-checkpoint: spawn worker ONCE per JSONL session
                        var flagFile = path.join(CLAUDE_DIR, 'hooks', '.checkpoint-' + path.basename(filePath, '.jsonl'));
                        if (!fs.existsSync(flagFile)) {
                            fs.writeFileSync(flagFile, new Date().toISOString(), 'utf8');
                            var child = spawn(process.execPath, [CHECKPOINT_WORKER, filePath], {
                                stdio: 'ignore',
                                windowsHide: true
                            });
                            child.unref();
                            output.push('[CHECKPOINT] Auto-saving session state — knowledge preserved in Ghost for next session');
                        }
                    } else if (pct >= 15) {
                        output.push(`[CONTEXT] Context at ${pct}% — approaching soft limit, plan accordingly`);
                    }
                    break;
                }
            } catch {}
        }
    }
} catch {}

// --- Creative recall: surface a random cold/archive entry from vault ---
try {
    const VAULT_DIR = 'C:/Users/sorte/ObsidianVault';
    const DECAY_RE = /<!--\s*decay:\S+\s+tier:(cold|archive)\s+rel:[\d.]+\s*-->/;
    const destinations = [
        '10-Projects/Studiokook/knowledge.md',
        '10-Projects/ARKHOS/knowledge.md',
        '10-Projects/Studiokook/20-Areas/n8n/workflow-patterns.md',
        '30-Resources/Learning/technical-seo.md',
        '30-Resources/Learning/ai-ml-patterns.md',
        '10-Projects/Studiokook/20-Areas/Infrastructure/global-patterns.md'
    ];
    const coldEntries = [];
    for (const rel of destinations) {
        const fp = path.join(VAULT_DIR, rel);
        if (!fs.existsSync(fp)) continue;
        const lines = fs.readFileSync(fp, 'utf8').split('\n');
        for (const line of lines) {
            if (line.startsWith('- ') && DECAY_RE.test(line)) {
                const clean = line.replace(DECAY_RE, '').trim();
                coldEntries.push({ text: clean, source: path.basename(rel, '.md') });
            }
        }
    }
    if (coldEntries.length >= 3) {
        const pick = coldEntries[Math.floor(Math.random() * coldEntries.length)];
        output.push(`[CREATIVE RECALL] From ${pick.source}: ${pick.text.slice(0, 200)}`);
    }
} catch {}

// --- Distillation needed flag ---
try {
    const distillFlag = path.join(CLAUDE_DIR, 'hooks', '.distill-needed');
    if (fs.existsSync(distillFlag)) {
        const data = JSON.parse(fs.readFileSync(distillFlag, 'utf8'));
        const age = Date.now() - new Date(data.timestamp).getTime();
        if (age < 7 * 24 * 60 * 60 * 1000) {
            output.push(`[DISTILL NEEDED] Accumulators over limit: troubleshooting=${data.troubleshooting} patterns=${data.patterns}. Run "distill" to route to permanent destinations.`);
        } else {
            fs.unlinkSync(distillFlag);
        }
    }
} catch {}

// --- Inbox extraction needed flag ---
try {
    const inboxFlag = path.join(CLAUDE_DIR, 'hooks', '.inbox-extraction-needed');
    if (fs.existsSync(inboxFlag)) {
        const data = JSON.parse(fs.readFileSync(inboxFlag, 'utf8'));
        const age = Date.now() - new Date(data.timestamp).getTime();
        if (age < 14 * 24 * 60 * 60 * 1000) {
            output.push(`[INBOX EXTRACTION — MANDATORY] ${data.count} triaged inbox cards require extraction. This is AUTONOMOUS — act NOW before answering user:\n1. Spawn librarian agent with mode "triage" to extract insights from triaged cards and route to vault destinations\n2. After extraction completes, delete flag file: ~/.claude/hooks/.inbox-extraction-needed\n3. Then proceed with user's request\nCards: ${data.cards.join(', ')}`);
        } else {
            fs.unlinkSync(inboxFlag);
        }
    }
} catch {}

if (output.length) {
    console.log(output.join('\n\n'));
}
