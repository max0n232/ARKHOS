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
const { callSonnet, appendToVault } = require('../shared/obsidian-api');

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
                    parts.push(`USER: ${text.slice(0, 300)}`);
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
                if (text) parts.push(`ASSISTANT: ${text.slice(0, 400)}`);
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

// --- Facts upsert ---

function upsertFacts(filePath, facts, today) {
    if (!facts || !facts.length) return;
    let content = '';
    try { content = fs.readFileSync(filePath, 'utf8'); } catch { content = ''; }

    const SECTION = '## Facts [machine-managed]';
    if (!content.includes(SECTION)) {
        content = content.trimEnd() + '\n\n' + SECTION + '\n<!-- managed by session-audit.js -->\n';
    }

    const lines = content.split('\n');

    for (const fact of facts) {
        if (!fact || typeof fact !== 'object' || !fact.key || !fact.value) continue;
        const key = String(fact.key).replace(/[^a-z0-9_]/gi, '_').toLowerCase().slice(0, 40);
        const tag = `<!-- fact:${key} -->`;
        const newLine = `- ${fact.value} [verified:${today}]`;

        const tagIdx = lines.findIndex(l => l.trim() === tag);
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
5. NEVER invent file paths, test counts, module names, or vault paths not in the transcript.`;

    const userMessage = `Extract knowledge from this Claude Code session transcript:

${transcriptSummary}

Return JSON:
{
  "summary": "1-2 sentences in Russian: what was accomplished this session (tasks done, not process)",
  "errors": ["PROBLEM → ROOT CAUSE → SOLUTION, one line, English only"],
  "facts": [{"key": "snake_case_id", "value": "concrete fact with value"}],
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
        const response = await callSonnet(systemPrompt, userMessage, 1500);
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

    if (extracted.facts?.length) {
        upsertFacts(MEMORY_FILE, extracted.facts, today);
    }

    saveState({ lastLine: totalLines, lastTimestamp: new Date().toISOString(), transcriptPath });

    // P1: Auto-distillation trigger — check accumulator sizes
    try {
        const tsLines = fs.existsSync(TROUBLESHOOTING) ? fs.readFileSync(TROUBLESHOOTING, 'utf8').split('\n').length : 0;
        const ptLines = fs.existsSync(PATTERNS) ? fs.readFileSync(PATTERNS, 'utf8').split('\n').length : 0;
        const THRESHOLD = 100;
        if (tsLines > THRESHOLD || ptLines > THRESHOLD) {
            console.log(`[AUTO-DISTILL] Accumulators over threshold: troubleshooting=${tsLines} patterns=${ptLines} (limit=${THRESHOLD})`);
            console.log('[AUTO-DISTILL] Run "distill" in next session to route entries to permanent destinations');
            // Write flag for compact-report-injector to surface
            const flagPath = path.join(CLAUDE_DIR, 'hooks', '.distill-needed');
            fs.writeFileSync(flagPath, JSON.stringify({
                timestamp: new Date().toISOString(),
                troubleshooting: tsLines,
                patterns: ptLines
            }), 'utf8');
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
