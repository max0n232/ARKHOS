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
const MEMORY_UNLOAD_WORKER = path.join(__dirname, 'memory-unload-worker.js');
const MEMORY_MD = path.join(CLAUDE_DIR, 'projects', 'C--Users-sorte--claude', 'memory', 'MEMORY.md');
const MEMORY_BYTE_LIMIT = 24985; // 24.4KB harness truncation (matches stack-auditor + worker)

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
// session-audit.js (PreCompact) writes a per-session report `.pending-report-${sessionId}.txt`.
// Read THIS session's file (sessionId from transcript_path, same derivation as the ctx monitor),
// inject it, then delete it. Fall back to the legacy shared file for reports written by older
// hook versions. Without the per-session read these files accumulated forever (orphan-rate 100%).
const HOOKS_DIR = path.join(CLAUDE_DIR, 'hooks');
try {
    const fp = (hookInput && hookInput.transcript_path) || '';
    const sid = fp ? path.basename(fp, '.jsonl') : '';
    const perSessionFile = sid ? path.join(HOOKS_DIR, `.pending-report-${sid}.txt`) : '';
    let reportFile = '';
    if (perSessionFile && fs.existsSync(perSessionFile)) reportFile = perSessionFile;
    else if (fs.existsSync(PENDING_FILE)) reportFile = PENDING_FILE; // legacy shared fallback

    if (reportFile) {
        const content = fs.readFileSync(reportFile, 'utf8').trim();
        fs.unlinkSync(reportFile);

        // PENDING block stays in MEMORY.md — Claude reads it natively
        // and removes it via Edit tool after displaying the report

        if (content) {
            output.unshift(
                `[COMPACT REPORT] Display this session compact report at the very start of your response, before answering the user. Output it verbatim as a code block:\n\n${content}`
            );
        }
    }
} catch {}

// --- Stale-sweep: drop orphaned per-session reports older than 6h ---
// A session that compacted but never resumed via UserPromptSubmit leaves its report
// undelivered. The per-session read above only clears THIS session — sweep the rest by age.
try {
    const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
    const now = Date.now();
    for (const name of fs.readdirSync(HOOKS_DIR)) {
        if (!name.startsWith('.pending-report-') || !name.endsWith('.txt')) continue;
        const fpath = path.join(HOOKS_DIR, name);
        try {
            if (now - fs.statSync(fpath).mtimeMs > SIX_HOURS_MS) fs.unlinkSync(fpath);
        } catch {}
    }
} catch {}

// --- Context usage monitor ---
// SSOT: use harness-native context_window.used_percentage from hook stdin — the SAME
// source as the status-line (settings.json statusLine: d.context_window.used_percentage).
// Previously this block computed its own % from JSONL usage tail / hardcoded 1M denominator,
// which (a) drifted from the status-line by a few pts (different snapshot/source) and
// (b) under-reported 5x on Sonnet 200K sessions. The agent then extrapolated that one-time
// stale number manually → false "context >50%" claims (feedback_verify_before_claiming).
// This is Loop A of the resource-homeostat (hypothalamus / canon token-budget): the SOFT
// loop. SSOT = used_percentage (same as status-line). At >=50% it emits the canonical
// "STOP and report" advisory (CLAUDE.md Token Budget rule), NOT just "/compact". Band-throttled
// (.homeostat-token-<session> records highest band announced) so it fires ONCE per crossing
// UP into a band, never every prompt — the old code re-emitted the 50% nudge on every turn.
// SOFT = advisory only, never blocks (the user's own train of thought must not be gated mid-task).
try {
    const ctxPct = hookInput && hookInput.context_window && hookInput.context_window.used_percentage;
    const fp = (hookInput && hookInput.transcript_path) || '';
    if (ctxPct != null && isFinite(ctxPct)) {
        const pct = Math.round(ctxPct);
        // Highest band already announced this session (band-throttle, mirrors .checkpoint-* flags).
        const sid = fp ? path.basename(fp, '.jsonl') : 'nosession';
        const bandFlag = path.join(CLAUDE_DIR, 'hooks', '.homeostat-token-' + sid);
        let lastBand = 0;
        try { lastBand = JSON.parse(fs.readFileSync(bandFlag, 'utf8')).band || 0; } catch {}

        const band = pct >= 50 ? 50 : pct >= 40 ? 40 : pct >= 30 ? 30 : 0;
        if (band > lastBand) {
            if (band === 50) {
                output.push(`[TOKEN BUDGET] Context at ${pct}% — per CLAUDE.md (200k / STOP at 50%): STOP, summarize progress, and report to the user before continuing. /compact when ready.`);
            } else if (band === 40) {
                output.push(`[TOKEN BUDGET] Context at ${pct}% — approaching the 50% set-point. Wrap up the current task; plan to STOP-and-report soon.`);
                // Auto-checkpoint: spawn worker ONCE per session (keyed on transcript basename)
                if (fp) {
                    const flagFile = path.join(CLAUDE_DIR, 'hooks', '.checkpoint-' + sid);
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
            } else if (band === 30) {
                output.push(`[TOKEN BUDGET] Context at ${pct}% — approaching soft limit, plan accordingly.`);
            }
            try { fs.writeFileSync(bandFlag, JSON.stringify({ band, ts: new Date().toISOString() }), 'utf8'); } catch {}
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

// --- Resource-homeostat efferent: MEMORY.md auto-unload (SAFE collapse) ---
// Closes the maintenance loop for the MEMORY.md contour: when the file crosses the BYTE limit
// (real harness truncation metric, not lines), spawn the unload worker ONCE per session to
// auto-collapse SAFE sections (detail proven in a data-home). Worker is detached + fail-open;
// it never blocks the prompt and never touches critical-class content (index/facts/rules).
try {
    let memBytes = 0;
    try { memBytes = Buffer.byteLength(fs.readFileSync(MEMORY_MD, 'utf8'), 'utf8'); } catch {}
    const fp = (hookInput && hookInput.transcript_path) || '';
    // codex E-2: a missing transcript_path must NOT collapse to a shared 'nosession' flag that
    // permanently blocks all future spawns. No real session id → skip spawning this turn (the
    // next turn with a real id will handle it); never write a sticky shared flag.
    const sid = fp ? path.basename(fp, '.jsonl') : null;
    if (memBytes >= MEMORY_BYTE_LIMIT && sid) {
        const flagFile = path.join(CLAUDE_DIR, 'hooks', '.memunload-' + sid);
        if (!fs.existsSync(flagFile)) {
            // codex E-3: spawn FIRST; only write the once-per-session flag if spawn succeeded.
            // A throwing spawn must not leave a flag that silently suppresses all retries.
            try {
                const child = spawn(process.execPath, [MEMORY_UNLOAD_WORKER], { stdio: 'ignore', windowsHide: true });
                child.unref();
                fs.writeFileSync(flagFile, new Date().toISOString(), 'utf8');
            } catch {
                output.push('[MEMORY UNLOAD] MEMORY.md over byte limit but auto-unload worker failed to spawn — collapse a section manually (move detail to a data-home → pointer).');
            }
        }
    }
} catch {}

// --- Memory-unload surface flag (what the worker collapsed / why it couldn't) ---
try {
    const muFlag = path.join(CLAUDE_DIR, 'hooks', '.memunload-surface.json');
    if (fs.existsSync(muFlag)) {
        const data = JSON.parse(fs.readFileSync(muFlag, 'utf8'));
        const age = Date.now() - (data.ts || 0);
        if (age < 24 * 60 * 60 * 1000) {
            output.push(`[MEMORY UNLOAD] ${data.msg}`);
        } else {
            fs.unlinkSync(muFlag);
        }
    }
} catch {}

// --- Auto-consolidate surface flag (critical-path drift awaiting deliberate commit) ---
try {
    const surfFlag = path.join(CLAUDE_DIR, 'hooks', '.consolidate-surface.json');
    if (fs.existsSync(surfFlag)) {
        const data = JSON.parse(fs.readFileSync(surfFlag, 'utf8'));
        const age = Date.now() - (data.ts || 0);
        if (age < 24 * 60 * 60 * 1000) {
            output.push(`[CONSOLIDATE] ${data.msg} — commit deliberately (codex-gate applies to critical-path).`);
        } else {
            fs.unlinkSync(surfFlag);
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
