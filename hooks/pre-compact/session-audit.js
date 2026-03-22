#!/usr/bin/env node
/**
 * PreCompact Hook: Session Knowledge Auditor
 *
 * Reads the session transcript, calls Anthropic API (Haiku) to extract
 * actionable knowledge, and writes to Obsidian vault files directly.
 * Replaces the unreliable type:"prompt" PreCompact hook.
 *
 * Triggered: PreCompact (before context compression)
 * Input: stdin JSON with transcript_path
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const os = require('os');

const CLAUDE_DIR = path.join(os.homedir(), '.claude');
const VAULT_DIR = 'C:/Users/sorte/ObsidianVault';
const INFRA_DIR = '10-Projects/Studiokook/20-Areas/Infrastructure';
const TROUBLESHOOTING = path.join(VAULT_DIR, INFRA_DIR, 'troubleshooting-current.md');
const PATTERNS = path.join(VAULT_DIR, INFRA_DIR, 'global-patterns.md');
const DECISIONS = path.join(VAULT_DIR, INFRA_DIR, 'decisions-log.md');
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

    return { text: parts.join('\n').slice(-8000), totalLines: lines.length };
}

// --- Anthropic API ---

function callHaiku(systemPrompt, userMessage) {
    return new Promise((resolve, reject) => {
        let apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
            try {
                const keyFile = path.join(CLAUDE_DIR, 'credentials/anthropic-api.key');
                apiKey = fs.readFileSync(keyFile, 'utf8').trim();
            } catch {}
        }
        if (!apiKey) return reject(new Error('ANTHROPIC_API_KEY not set'));

        const body = JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 1024,
            system: systemPrompt,
            messages: [{ role: 'user', content: userMessage }]
        });

        const req = https.request({
            hostname: 'api.anthropic.com',
            path: '/v1/messages',
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json',
                'content-length': Buffer.byteLength(body)
            }
        }, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const text = JSON.parse(data).content?.[0]?.text || '';
                    resolve(text);
                } catch (e) { reject(new Error(`API parse error: ${e.message}`)); }
            });
        });

        req.on('error', reject);
        req.setTimeout(30000, () => { req.destroy(); reject(new Error('API timeout')); });
        req.write(body);
        req.end();
    });
}

// --- Obsidian REST API (primary) + file fallback ---

function obsidianApiKey() {
    try {
        const cfg = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.claude.json'), 'utf8'));
        return cfg.mcpServers?.obsidian?.env?.OBSIDIAN_API_KEY || '';
    } catch { return ''; }
}

function appendViaRestApi(vaultRelPath, content) {
    return new Promise((resolve, reject) => {
        const apiKey = obsidianApiKey();
        if (!apiKey) return reject(new Error('no obsidian key'));

        const body = Buffer.from(content, 'utf8');
        const req = https.request({
            hostname: 'localhost',
            port: 27124,
            path: `/vault/${encodeURIComponent(vaultRelPath)}`,
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'text/markdown',
                'Content-Length': body.length
            },
            rejectUnauthorized: false
        }, res => {
            res.resume();
            res.on('end', () => resolve(res.statusCode));
        });

        req.on('error', reject);
        req.setTimeout(5000, () => { req.destroy(); reject(new Error('obsidian timeout')); });
        req.write(body);
        req.end();
    });
}

async function appendToVault(absolutePath, content) {
    if (!content.trim()) return;
    const today = new Date().toISOString().slice(0, 10);
    const entry = `\n<!-- audit:${today} -->\n${content.trim()}\n`;

    // Try REST API first (keeps Obsidian sync)
    const relPath = absolutePath.replace(/\\/g, '/').replace(VAULT_DIR + '/', '');
    try {
        await appendViaRestApi(relPath, entry);
        return;
    } catch {}

    // Fallback: direct file write
    fs.appendFileSync(absolutePath, entry, 'utf8');
}

function appendToFile(filePath, content) {
    if (!content.trim()) return;
    const today = new Date().toISOString().slice(0, 10);
    fs.appendFileSync(filePath, `\n<!-- audit:${today} -->\n${content.trim()}\n`, 'utf8');
}

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

    // Reset lastLine if transcript path changed (new session)
    const fromLine = (state.transcriptPath === transcriptPath) ? (state.lastLine || 0) : 0;

    // Diagnostic: log each invocation to detect organic vs manual compaction
    const LOG_FILE = path.join(__dirname, 'pre-compact-calls.log');
    try { fs.appendFileSync(LOG_FILE, JSON.stringify({ ts: new Date().toISOString(), script: 'session-audit', hasTranscript: !!transcriptPath, fromLine, newSession: state.transcriptPath !== transcriptPath }) + '\n'); } catch {}
    const { text: transcriptSummary, totalLines } = extractTranscriptSummary(transcriptPath, fromLine);

    if (!transcriptSummary) {
        console.log('Session audit: no new content since last run');
        return;
    }

    console.log(`Session audit: processing ${totalLines - state.lastLine} new turns...`);

    const systemPrompt = `You are a technical knowledge extractor for a software development session.
Extract ONLY concrete, actionable knowledge. Respond with valid JSON only, no prose.
If a category has nothing meaningful, return an empty array.`;

    const userMessage = `Extract knowledge from this Claude Code session transcript:

${transcriptSummary}

Return JSON:
{
  "summary": "1-2 sentences in Russian: what was accomplished this session (tasks done, not process)",
  "decisions": ["architectural/technical decisions made — include WHY (write in English)"],
  "errors": ["PROBLEM → ROOT CAUSE → SOLUTION, one line, English only"],
  "facts": [{"key": "snake_case_id", "value": "concrete fact with value"}],
  "patterns": ["repeatable solutions or process improvements (steps, not vague), English only"]
}

Rules:
- Only items ACTUALLY present in the transcript
- summary: in Russian, focus on outcomes, not steps taken
- decisions/errors/patterns: in English only — these are stored in technical vault
- facts: key must be stable snake_case (e.g. n8n_version, wp_version, telegram_cred_id, vps_ip); value is the concrete fact string
- errors: only real problems investigated or solved
- decisions: explicit technical choices with reasoning
- patterns: established repeatable processes`;

    let extracted;
    try {
        const response = await callHaiku(systemPrompt, userMessage);
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('no JSON in response');
        extracted = JSON.parse(jsonMatch[0]);
    } catch (e) {
        console.error(`Session audit: API error — ${e.message}`);
        return;
    }

    const counts = {
        decisions: extracted.decisions?.length || 0,
        errors: extracted.errors?.length || 0,
        patterns: extracted.patterns?.length || 0,
        facts: extracted.facts?.length || 0
    };
    console.log(`Session audit: extracted decisions=${counts.decisions} errors=${counts.errors} patterns=${counts.patterns} facts=${counts.facts}`);

    const today = new Date().toISOString().slice(0, 10);
    let written = 0;

    if (extracted.errors?.length) {
        const content = extracted.errors.map(e => `- [${today}] ${e}`).join('\n');
        await appendToVault(TROUBLESHOOTING, content);
        written += extracted.errors.length;
    }

    if (extracted.patterns?.length) {
        const content = extracted.patterns.map(p => `- [${today}] ${p}`).join('\n');
        await appendToVault(PATTERNS, content);
        written += extracted.patterns.length;
    }

    if (extracted.decisions?.length) {
        const content = extracted.decisions.map(d => `- [${today}] ${d}`).join('\n');
        await appendToVault(DECISIONS, content);
        written += extracted.decisions.length;
    }

    if (extracted.facts?.length) {
        upsertFacts(MEMORY_FILE, extracted.facts, today);
        written += extracted.facts.length;
    }

    saveState({ lastLine: totalLines, lastTimestamp: new Date().toISOString(), transcriptPath });

    // Formatted report
    const time = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    const line = '─'.repeat(52);
    const parts = [`\n${line}`, `  AUDIT ${time}`];

    if (extracted.summary) parts.push(`  ${extracted.summary}`);

    if (extracted.decisions?.length) {
        parts.push('');
        extracted.decisions.forEach(d => parts.push(`  ✓ ${d}`));
    }
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
        counts.decisions && `decisions(${counts.decisions})`,
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

        // Remove any existing pending section
        mem = mem.replace(/<!--PENDING-START-->[\s\S]*?<!--PENDING-END-->\n?/g, '');

        const pendingBlock = [
            '<!--PENDING-START-->',
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
    // Non-blocking — PreCompact must proceed regardless
    console.error(`Session audit failed: ${e.message}`);
    process.exit(0);
});
