#!/usr/bin/env node
/**
 * PreCompact Hook: Session Knowledge Auditor
 *
 * Reads the session transcript, calls Anthropic API (Sonnet) to extract
 * actionable knowledge, and writes to Obsidian vault files directly.
 *
 * Triggered: PreCompact (before context compression)
 * Input: stdin JSON with transcript_path
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const { CLAUDE_DIR, VAULT_DIR } = require('../shared/paths');
const { callWithFallback, appendToVault } = require('../shared/obsidian-api');

const INFRA_DIR = '10-Projects/Studiokook/20-Areas/Infrastructure';
const TROUBLESHOOTING = path.join(VAULT_DIR, INFRA_DIR, 'troubleshooting-current.md');
const PATTERNS = path.join(VAULT_DIR, INFRA_DIR, 'global-patterns.md');
const STATE_FILE = path.join(CLAUDE_DIR, 'hooks/pre-compact/.audit-state.json');
const MEMORY_FILE = path.join(CLAUDE_DIR, 'projects/C--Users-sorte--claude/memory/MEMORY.md');

// --- stdin reading (async, safe on Windows) ---

function readStdin() {
    return new Promise(resolve => {
        let data = '';
        const timer = setTimeout(() => resolve(data), 3000);
        process.stdin.setEncoding('utf8');
        process.stdin.on('data', chunk => data += chunk);
        process.stdin.on('end', () => { clearTimeout(timer); resolve(data); });
        process.stdin.on('error', () => { clearTimeout(timer); resolve(data); });
    });
}

// --- Transcript parsing ---

function stripAuditBlocks(text) {
    // Remove PENDING/compact audit report blocks that echo prior sessions —
    // they poison the LLM into confabulating the PREVIOUS session's narrative.
    // Matches "AUDIT HH:MM ... → vault: …" sandwiched by rules or code-fence markers.
    let cleaned = text.replace(/─{3,}[\s\S]*?AUDIT \d{2}:\d{2}[\s\S]*?→ vault:[^\n]*[\s\S]*?─{3,}/g, '[prior audit report stripped]');
    cleaned = cleaned.replace(/AUDIT \d{2}:\d{2}\n[\s\S]*?→ vault:[^\n]*/g, '[prior audit report stripped]');
    cleaned = cleaned.replace(/\[AUTOSEARCH\][\s\S]*?(?=\n(?:USER|ASSISTANT|TOOLS_USED):|$)/g, '[autosearch stripped]');
    cleaned = cleaned.replace(/\[COMPACT REPORT\][\s\S]*?(?=\n(?:USER|ASSISTANT|TOOLS_USED):|$)/g, '[compact report stripped]');
    return cleaned;
}

function extractTranscriptSummary(transcriptPath, fromLine = 0) {
    if (!transcriptPath || !fs.existsSync(transcriptPath)) return { text: '', totalLines: 0 };

    const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n').filter(l => l.trim());
    const newLines = lines.slice(fromLine);
    if (newLines.length < 5) return { text: '', totalLines: lines.length };

    const parts = [];
    for (const line of newLines) {
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
                    parts.push(`USER: ${stripAuditBlocks(text).slice(0, 300)}`);
                }
            } else if (role === 'assistant') {
                const text = content
                    .filter(c => c.type === 'text')
                    .map(c => c.text)
                    .join(' ')
                    .trim();
                const tools = content
                    .filter(c => c.type === 'tool_use')
                    .map(c => c.name)
                    .filter((v, i, a) => a.indexOf(v) === i);
                if (text) parts.push(`ASSISTANT: ${stripAuditBlocks(text).slice(0, 400)}`);
                if (tools.length) parts.push(`TOOLS_USED: ${tools.join(', ')}`);
            }
        } catch {}
    }

    const full = parts.join('\n');
    let sampled;
    if (full.length <= 12000) {
        sampled = full;
    } else {
        const head = full.slice(0, 2000);
        const tail = full.slice(-10000);
        sampled = head + '\n[...middle truncated...]\n' + tail;
    }
    return { text: sampled, totalLines: lines.length };
}

// --- Facts filtering ---

const JUNK_KEY_SUBSTRINGS = [
    'timestamp', 'source_file', 'source_line', 'error_source',
    'destination_path', 'flag_path', 'score_range',
    'column_type', 'hooks_runtime', 'runtime_components',
    'base_directory', 'hook_marker', 'md_path',
    'md_file_discipline', 'overflow_destination',
    'extraction_date', 'extraction_vault_path',
    'agent_error', 'log_error', 'error_log', 'error_time',
    'error_file', 'error_line', 'error_log_line',
    'primary_model', 'fallback_model', 'helper_path',
    'version', 'context_limit', 'model_date', 'vbs_path',
    'file_example', 'repo_path',
    // Generic atomic-data suffixes — single value without context = dead weight
    '_path', '_name', '_id', '_status', '_pattern', '_patter',
    'schtask', 'commit_pattern', 'model_name', 'workflow_name',
    'workflow_id', 'plugin_status', 'library_path', 'log_path',
    'notes_path', 'hook_path'
];

function isJunkFact(fact) {
    if (!fact || !fact.key || !fact.value) return true;
    const key = String(fact.key).toLowerCase();
    const value = String(fact.value).trim();

    for (const pat of JUNK_KEY_SUBSTRINGS) {
        if (key.includes(pat)) return true;
    }
    // Too short to be meaningful config
    if (value.length < 20) return true;
    // Pure number / single enum token
    if (/^\d+$/.test(value)) return true;
    if (/^[A-Z][A-Z0-9_-]+$/.test(value)) return true;
    // Datetime-only value (e.g. "2026-04-18 15:05 UTC") — one-off event, not config
    if (/^\d{4}-\d{2}-\d{2}[\s\d:UTC+-]*$/.test(value)) return true;
    // Bare path (any absolute/relative path, no prose context) — no spaces, < 60 chars
    if (!/\s/.test(value) && value.length < 60 && /[/\\]/.test(value)) return true;
    // Starts with C:\Users\…\.claude — user-home artefact
    if (/^C:\\Users\\[^\\]+\\\.claude\\[^\s]+$/.test(value)) return true;
    // Vault-relative .md pointer — ENTIRE value is a path ending in .md, no prose
    if (/^[\w\-./]+\.md$/.test(value)) return true;
    // Repo-relative segment, short
    if (/^(hooks|scripts|agents|skills)\//.test(value) && value.length < 60) return true;
    // Single-token value without pipes/commas/colons (just a name or ID)
    if (!/[\s,|:;—–-]/.test(value) && value.length < 40) return true;
    return false;
}

// --- Facts upsert ---

function purgeJunkFactMarkers(lines) {
    // Self-heal: sweep existing fact markers, drop any whose key matches JUNK_KEY_SUBSTRINGS
    const out = [];
    let i = 0;
    let purged = 0;
    while (i < lines.length) {
        const m = lines[i].match(/^<!-- fact:([a-z0-9_]+) -->$/);
        if (m) {
            const key = m[1].toLowerCase();
            const junk = JUNK_KEY_SUBSTRINGS.some(p => key.includes(p));
            if (junk) {
                // Skip marker + blank lines + following content line
                i++;
                while (i < lines.length && lines[i].trim() === '') i++;
                if (i < lines.length && lines[i].startsWith('- ')) i++;
                purged++;
                continue;
            }
        }
        out.push(lines[i]);
        i++;
    }
    if (purged > 0) console.error(`Session audit: purged ${purged} existing junk fact(s) from MEMORY.md`);
    return out;
}

function upsertFacts(filePath, facts, today) {
    if (!facts || !facts.length) return;
    let content = '';
    try { content = fs.readFileSync(filePath, 'utf8'); } catch { content = ''; }

    const SECTION = '## Facts [machine-managed]';
    if (!content.includes(SECTION)) {
        content = content.trimEnd() + '\n\n' + SECTION + '\n<!-- managed by session-audit.js -->\n';
    }

    let lines = content.split('\n');
    lines = purgeJunkFactMarkers(lines);

    // Build set of existing fact values (normalized) for dedup
    const existingValues = new Set();
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('<!-- fact:')) {
            let j = i + 1;
            while (j < lines.length && lines[j].trim() === '') j++;
            if (j < lines.length && lines[j].startsWith('- ')) {
                const val = lines[j].slice(2).replace(/\s*\[verified:[^\]]+\]\s*$/, '').trim().toLowerCase();
                if (val) existingValues.add(val);
            }
        }
    }

    for (const fact of facts) {
        if (!fact || typeof fact !== 'object' || !fact.key || !fact.value) continue;
        const key = String(fact.key).replace(/[^a-z0-9_]/gi, '_').toLowerCase().slice(0, 40);
        const tag = `<!-- fact:${key} -->`;
        const newLine = `- ${fact.value} [verified:${today}]`;

        const tagIdx = lines.findIndex(l => l.trim() === tag);
        // Value dedup: if this value already exists under a different key, skip
        const normVal = String(fact.value).trim().toLowerCase();
        if (tagIdx < 0 && existingValues.has(normVal)) {
            console.error(`Session audit: skipped duplicate value for key ${key}`);
            continue;
        }
        if (tagIdx >= 0) {
            let nextIdx = tagIdx + 1;
            while (nextIdx < lines.length && lines[nextIdx].trim() === '') nextIdx++;
            if (nextIdx < lines.length && lines[nextIdx].startsWith('- ')) {
                lines[nextIdx] = newLine;
            } else {
                lines.splice(tagIdx + 1, 0, newLine);
            }
        } else {
            lines.push(tag);
            lines.push(newLine);
        }
    }

    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
}

// --- State management ---

function loadState() {
    try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); } catch { return { lastLine: 0 }; }
}

function saveState(state) {
    try { fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8'); } catch {}
}

// --- Main ---

async function main() {
    const stdin = await readStdin();

    let transcriptPath = '';
    try { transcriptPath = JSON.parse(stdin).transcript_path || ''; } catch {}

    const state = loadState();
    const fromLine = (state.transcriptPath === transcriptPath) ? (state.lastLine || 0) : 0;
    const { text: transcriptSummary, totalLines } = extractTranscriptSummary(transcriptPath, fromLine);

    if (!transcriptSummary) {
        console.log('Session audit: no new content since last run');
        return;
    }

    console.log(`Session audit: processing ${totalLines - fromLine} new turns...`);

    const systemPrompt = `You are a strict technical knowledge extractor. CRITICAL RULES:
1. Extract ONLY facts explicitly stated in the transcript. NEVER infer, guess, or fabricate.
2. If you are not 100% certain something was mentioned — DO NOT include it.
3. If a category has nothing — return an empty array. Empty is better than wrong.
4. Respond with valid JSON only, no prose.
5. NEVER invent file paths, test counts, module names, or vault paths not in the transcript.
6. The transcript may quote PRIOR audit reports (strings like "воспроизведение 11 задач", "Plan A/B", "18 триажных карточек", "COMPACT REPORT"). These describe OLD sessions — DO NOT treat them as this session's work. Summarize only the CURRENT USER/ASSISTANT turns.
7. If transcript has no substantive actions, return summary: "Session idle — no substantive work" and empty arrays.`;

    const userMessage = `Extract knowledge from this Claude Code session transcript:

${transcriptSummary}

Return JSON:
{
  "summary": "1-2 sentences in Russian: what was accomplished this session (tasks done, not process)",
  "errors": ["PROBLEM → ROOT CAUSE → SOLUTION, one line, English only"],
  "facts": [{"key": "snake_case_id", "value": "concrete fact with value", "confidence": "high|medium"}],
  "patterns": ["repeatable solutions or process improvements (steps, not vague), English only"]
}

Rules:
- Only items ACTUALLY present in the transcript
- ALL text in Russian (summary, errors, patterns) — user reads Russian
- facts: value in Russian, key always snake_case English
- facts: ONLY system config that someone would need to look up later:
  * API endpoints, credentials IDs, server IPs, port numbers
  * Software versions, dependency versions
  * File paths for config/infrastructure (NOT temp output dirs)
  * Service URLs, webhook paths
  NEVER include as facts: task outputs, line counts, test results, temp dirs, one-time debug findings, project status, key lengths, file sizes
  NEVER re-extract facts that already exist (obsidian_vault_path, n8n_version etc) — only NEW discoveries
  key must be stable snake_case (e.g. n8n_version, vps_ip, telegram_cred_id)
  When in doubt — DO NOT add a fact. 0 facts is better than 1 wrong fact.
- errors: only real problems investigated or solved
- patterns: established repeatable processes
- Do NOT extract decisions — they are handled by a separate system (Ghost)`;

    let extracted;
    try {
        const { text: response, model: llmModel } = await callWithFallback(systemPrompt, userMessage, 1500);
        if (llmModel !== 'gemini') console.error(`Session audit: used fallback model ${llmModel}`);
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('no JSON in response');
        extracted = JSON.parse(jsonMatch[0]);
    } catch (e) {
        console.error(`Session audit: API error — ${e.message}`);
        return;
    }

    const counts = {
        errors: extracted.errors?.length || 0,
        patterns: extracted.patterns?.length || 0,
        facts: extracted.facts?.length || 0
    };
    console.log(`Session audit: extracted errors=${counts.errors} patterns=${counts.patterns} facts=${counts.facts}`);

    const today = new Date().toISOString().slice(0, 10);

    if (extracted.errors?.length) {
        const content = extracted.errors.map(e => `- [${today}] ${e}`).join('\n');
        await appendToVault(TROUBLESHOOTING, content);
    }

    if (extracted.patterns?.length) {
        const content = extracted.patterns.map(p => `- [${today}] ${p}`).join('\n');
        await appendToVault(PATTERNS, content);
    }

    let cleanFacts = [];
    if (extracted.facts?.length) {
        const verifiedFacts = extracted.facts.filter(f => !f.confidence || f.confidence !== 'low');
        cleanFacts = verifiedFacts.filter(f => !isJunkFact(f));
        const dropped = verifiedFacts.length - cleanFacts.length;
        if (dropped > 0) console.error(`Session audit: filtered ${dropped} junk fact(s)`);
        if (cleanFacts.length) upsertFacts(MEMORY_FILE, cleanFacts, today);
        counts.facts = cleanFacts.length;
    }
    // Replace extracted.facts so display shows the filtered set (consistent with header count)
    extracted.facts = cleanFacts;

    saveState({ lastLine: totalLines, lastTimestamp: new Date().toISOString(), transcriptPath });

    // P1: Auto-distillation trigger — check accumulator sizes
    try {
        const tsLines = fs.existsSync(TROUBLESHOOTING) ? fs.readFileSync(TROUBLESHOOTING, 'utf8').split('\n').length : 0;
        const ptLines = fs.existsSync(PATTERNS) ? fs.readFileSync(PATTERNS, 'utf8').split('\n').length : 0;
        const factsCount = fs.existsSync(MEMORY_FILE)
            ? (fs.readFileSync(MEMORY_FILE, 'utf8').match(/<!-- fact:/g) || []).length
            : 0;
        const THRESHOLD = 100;
        const FACTS_THRESHOLD = 60;
        const flagPath = path.join(CLAUDE_DIR, 'hooks', '.distill-needed');
        if (tsLines > THRESHOLD || ptLines > THRESHOLD || factsCount > FACTS_THRESHOLD) {
            console.log(`[AUTO-DISTILL] Over threshold: troubleshooting=${tsLines} patterns=${ptLines} facts=${factsCount} (limits=${THRESHOLD}/${THRESHOLD}/${FACTS_THRESHOLD})`);
            console.log('[AUTO-DISTILL] Run "distill" in next session to synthesize entries');
            fs.writeFileSync(flagPath, JSON.stringify({
                timestamp: new Date().toISOString(),
                troubleshooting: tsLines,
                patterns: ptLines,
                facts: factsCount
            }), 'utf8');
        } else if (fs.existsSync(flagPath)) {
            fs.unlinkSync(flagPath);
        }
    } catch {}

    // Formatted report
    const time = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    const line = '─'.repeat(52);
    const parts = [`\n${line}`, `  AUDIT ${time}`];

    if (extracted.summary) parts.push(`  ${extracted.summary}`);

    if (extracted.errors?.length) {
        parts.push('');
        extracted.errors.forEach(e => parts.push(`  ! ${e}`));
    }
    if (extracted.patterns?.length) {
        parts.push('');
        extracted.patterns.forEach(p => parts.push(`  ~ ${p}`));
    }
    if (extracted.facts?.length) {
        parts.push('');
        extracted.facts.forEach(f => parts.push(`  # ${f.key}: ${f.value}`));
    }

    const vaultSummary = [
        counts.errors && `errors(${counts.errors})`,
        counts.patterns && `patterns(${counts.patterns})`
    ].filter(Boolean).join(' ');
    const factsSummary = counts.facts ? `MEMORY.md: facts(${counts.facts})` : '';
    parts.push('');
    parts.push(`  → vault: ${vaultSummary || 'none'} | ${factsSummary || 'no facts'}`);
    parts.push(line);

    const report = parts.join('\n');
    console.log(report);

    // Write pending report — two delivery mechanisms:
    // 1. File → UserPromptSubmit hook (works in VS Code)
    // 2. MEMORY.md → always in context (works in Claude Desktop)
    const PENDING_FILE = path.join(CLAUDE_DIR, 'hooks', '.pending-compact-report.txt');
    try { fs.writeFileSync(PENDING_FILE, report, 'utf8'); } catch {}

    // Write to MEMORY.md as pending section (platform-independent delivery)
    try {
        let mem = '';
        try { mem = fs.readFileSync(MEMORY_FILE, 'utf8'); } catch { mem = ''; }

        const pendingMatch = mem.match(/<!--PENDING-TS:(\d+)-->/);
        if (pendingMatch) {
            const pendingAge = Date.now() - parseInt(pendingMatch[1]);
            if (pendingAge > 3600000) {
                process.stderr.write('[SessionAudit] Removing stale pending block (>1h old)\n');
            }
        }
        mem = mem.replace(/<!--PENDING-START-->[\s\S]*?<!--PENDING-END-->\n?/g, '');

        const pendingBlock = [
            `<!--PENDING-START--><!--PENDING-TS:${Date.now()}-->`,
            '## ⚠️ COMPACT REPORT — ВЫВЕСТИ В ЧАТ И УДАЛИТЬ',
            '',
            'Выведи этот отчёт дословно в начале своего ответа (code block), затем удали весь блок',
            'от PENDING-START до PENDING-END из MEMORY.md через Edit tool.',
            '',
            '```',
            report.trim(),
            '```',
            '<!--PENDING-END-->',
            ''
        ].join('\n');

        fs.writeFileSync(MEMORY_FILE, pendingBlock + mem, 'utf8');
    } catch {}
}

main().catch(e => {
    console.error(`Session audit failed: ${e.message}`);
    process.exit(0);
});
