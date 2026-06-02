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
// SSOT: use harness-native context_window.used_percentage from hook stdin — the SAME
// source as the status-line (settings.json statusLine: d.context_window.used_percentage).
// Previously this block computed its own % from JSONL usage tail / hardcoded 1M denominator,
// which (a) drifted from the status-line by a few pts (different snapshot/source) and
// (b) under-reported 5x on Sonnet 200K sessions. The agent then extrapolated that one-time
// stale number manually → false "context >50%" claims (feedback_verify_before_claiming).
try {
    const ctxPct = hookInput && hookInput.context_window && hookInput.context_window.used_percentage;
    if (ctxPct != null && isFinite(ctxPct)) {
        const pct = Math.round(ctxPct);
        if (pct >= 50) {
            output.push(`[CONTEXT] Context at ${pct}% — /compact recommended NOW`);
        } else if (pct >= 40) {
            output.push(`[CONTEXT] Context at ${pct}% — consider /compact or finishing current task`);
            // Auto-checkpoint: spawn worker ONCE per session (keyed on transcript basename)
            const fp = (hookInput && hookInput.transcript_path) || '';
            if (fp) {
                const flagFile = path.join(CLAUDE_DIR, 'hooks', '.checkpoint-' + path.basename(fp, '.jsonl'));
                if (!fs.existsSync(flagFile)) {
                    fs.writeFileSync(flagFile, new Date().toISOString(), 'utf8');
                    const child = spawn(process.execPath, [CHECKPOINT_WORKER, fp], {
                        stdio: 'ignore',
                        windowsHide: true
                    });
                    child.unref();
                    output.push('[CHECKPOINT] Auto-saving session state — knowledge preserved in Ghost for next session');
                }
            }
        } else if (pct >= 30) {
            output.push(`[CONTEXT] Context at ${pct}% — approaching soft limit, plan accordingly`);
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
            const parts = [];
            if (data.troubleshooting > 100 || data.patterns > 100) parts.push(`accumulators(troubleshooting=${data.troubleshooting} patterns=${data.patterns})`);
            if (data.vault?.orphanRate > 15) parts.push(`orphans(${data.vault.orphanRate}%)`);
            if (data.vault?.unindexedFolders > 3) parts.push(`unindexed-folders(${data.vault.unindexedFolders})`);
            if (data.vault?.staleTGDumps > 50) parts.push(`stale-TG-dumps(${data.vault.staleTGDumps})`);
            const detail = parts.length ? parts.join(' ') : `troubleshooting=${data.troubleshooting} patterns=${data.patterns}`;
            output.push(`[DISTILL NEEDED] Over threshold: ${detail}. Run "distill" to route via librarian (vault routing-map.md).`);
        } else {
            fs.unlinkSync(distillFlag);
        }
    }
} catch {}

// --- Auto-memory routing needed flag ---
try {
    const flag = path.join(CLAUDE_DIR, 'hooks', '.auto-memory-routing-needed');
    if (fs.existsSync(flag)) {
        const data = JSON.parse(fs.readFileSync(flag, 'utf8'));
        const age = Date.now() - new Date(data.timestamp).getTime();
        if (age >= 7 * 24 * 60 * 60 * 1000) {
            fs.unlinkSync(flag);
        } else {
            // Filter to files that still exist + still match recorded sessionId.
            // Routed/deleted/altered files become stale entries — drop them.
            // Files referenced in MEMORY.md index = already-routed (KEEP decision) — also drop.
            const memDir = path.join(CLAUDE_DIR, 'projects/c--Users-sorte--claude/memory');
            let memIndex = '';
            try { memIndex = fs.readFileSync(path.join(memDir, 'MEMORY.md'), 'utf8'); } catch {}
            const live = data.files.filter(f => {
                if (memIndex.includes(f.name)) return false;
                try {
                    const content = fs.readFileSync(path.join(memDir, f.name), 'utf8');
                    const m = content.match(/^originSessionId:\s*([a-f0-9-]+)/m);
                    return m && m[1] === data.sessionId;
                } catch { return false; }
            });
            if (live.length === 0) {
                fs.unlinkSync(flag);
            } else {
                const fileList = live.map(f => `${f.name} (${f.type})`).join(', ');
                output.push(`[AUTO-MEMORY ROUTING] ${live.length} new file(s) created in auto-memory this session: ${fileList}. Per CLAUDE.md routing: behavioral rules → keep as feedback_*.md, project/reference → migrate to vault. Run "distill" or invoke librarian to route.`);
                if (live.length !== data.files.length) {
                    fs.writeFileSync(flag, JSON.stringify({ ...data, files: live }), 'utf8');
                }
            }
        }
    }
} catch {}

// --- Stack auditor pending flag ---
try {
    const stackFlag = path.join(CLAUDE_DIR, 'hooks', '.stack-auditor-pending.flag');
    if (fs.existsSync(stackFlag)) {
        const data = JSON.parse(fs.readFileSync(stackFlag, 'utf8'));
        const age = Date.now() - new Date(data.timestamp).getTime();
        if (age < 14 * 24 * 60 * 60 * 1000) {
            const concerns = (data.concerns || []).slice(0, 5);
            const tail = concerns.length ? ` Concerns: ${concerns.join('; ')}.` : ' No concerns flagged.';
            output.push(`[STACK AUDIT ${data.date}] Weekly stack report ready → ${data.auditPath}.${tail} Read it when relevant; delete flag after acknowledging: ~/.claude/hooks/.stack-auditor-pending.flag`);
        } else {
            fs.unlinkSync(stackFlag);
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
