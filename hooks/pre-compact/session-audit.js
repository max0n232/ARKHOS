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
    // Skill/system-prompt fragments echoed back by the assistant — rules, not actions
    cleaned = cleaned.replace(/### Skill:[\s\S]*?(?=\n(?:USER|ASSISTANT|TOOLS_USED):|$)/g, '[skill block stripped]');
    cleaned = cleaned.replace(/Output Critic[\s\S]*?(?=\n(?:USER|ASSISTANT|TOOLS_USED):|$)/g, '[critic block stripped]');
    cleaned = cleaned.replace(/CRITIC PHASE[\s\S]*?(?=\n(?:USER|ASSISTANT|TOOLS_USED):|$)/g, '[critic block stripped]');
    // CLAUDE.md / Constitution / rules quotes (markdown sections with rule-like headers)
    cleaned = cleaned.replace(/#{1,3}\s+(File Discipline|Core Tenets|Forbidden Operations|Quality Gates|Knowledge Routing|Escalation|Parallel Agents|Anti-Spiral Rule|Scaling Rules|Constitution|Code Style)[\s\S]*?(?=\n(?:USER|ASSISTANT|TOOLS_USED):|\n#{1,3}\s|$)/g, '[rules block stripped]');
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

// Keys where short values are legitimate (versions, ports, IDs, credentials refs)
const SHORT_VALUE_OK_KEY_PATTERNS = /(_version|_port|_id$|_ip$|_host$|_cred_?id|_key$|_token$|_schema$|_contract|_symbol)/i;

function isJunkFact(fact) {
    if (!fact || !fact.key || !fact.value) return true;
    const key = String(fact.key).toLowerCase();
    const value = String(fact.value).trim();

    for (const pat of JUNK_KEY_SUBSTRINGS) {
        if (key.includes(pat)) return true;
    }
    const shortValueAllowed = SHORT_VALUE_OK_KEY_PATTERNS.test(key);
    // Too short to be meaningful config — unless key explicitly declares it's a short-value type
    if (value.length < 20 && !shortValueAllowed) return true;
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
    // Single-token value without pipes/commas/colons (just a name or ID) — unless key allows short
    if (!/[\s,|:;—–-]/.test(value) && value.length < 40 && !shortValueAllowed) return true;
    return false;
}

// --- Pattern/error post-filtering ---
// LLM sometimes returns generic advice as "patterns" despite system prompt.
// Reject: prescriptive forms without concrete session context.
const GENERIC_PATTERN_REJECT = [
    /^(document|implement|use existing|leverage|consider|ensure|always|never|prioritize|avoid)\s/i,
    /^when\s+[\w\s]+,\s*(use|offer|verify|implement|consider|check|prefer|prioritize|avoid|ensure)\b/i,  // "When X, use Y" generic-advice form
    /^for\s+(new|better|improved)\s/i,
    /\bdedicated (log|reference|file|directory)\b/i,  // meta-advice about structure
];

function isGenericPattern(entry) {
    if (!entry || typeof entry !== 'string') return true;
    const t = entry.trim();
    if (t.length < 30) return true;
    for (const re of GENERIC_PATTERN_REJECT) {
        if (re.test(t)) return true;
    }
    return false;
}

function checkAutoMemoryGrowth(sessionId) {
    if (!sessionId) return null;
    try {
        const memDir = path.dirname(MEMORY_FILE);
        const newFiles = [];
        for (const f of fs.readdirSync(memDir)) {
            if (!f.endsWith('.md') || f === 'MEMORY.md' || f.includes('.bak')) continue;
            const fp = path.join(memDir, f);
            try {
                const content = fs.readFileSync(fp, 'utf8');
                const m = content.match(/^originSessionId:\s*([a-f0-9-]+)/m);
                if (m && m[1] === sessionId) {
                    const typeMatch = content.match(/^type:\s*(\w+)/m);
                    newFiles.push({ name: f, type: typeMatch ? typeMatch[1] : 'unknown' });
                }
            } catch {}
        }
        const flagPath = path.join(CLAUDE_DIR, 'hooks', '.auto-memory-routing-needed');
        if (newFiles.length > 0) {
            fs.writeFileSync(flagPath, JSON.stringify({
                sessionId, files: newFiles, timestamp: new Date().toISOString()
            }), 'utf8');
            return newFiles;
        } else if (fs.existsSync(flagPath)) {
            fs.unlinkSync(flagPath);
        }
    } catch {}
    return null;
}

function checkAccumulatorOverflow() {
    try {
        const tsLines = fs.existsSync(TROUBLESHOOTING) ? fs.readFileSync(TROUBLESHOOTING, 'utf8').split('\n').length : 0;
        const ptLines = fs.existsSync(PATTERNS) ? fs.readFileSync(PATTERNS, 'utf8').split('\n').length : 0;
        const THRESHOLD = 100;
        const flagPath = path.join(CLAUDE_DIR, 'hooks', '.distill-needed');
        if (tsLines > THRESHOLD || ptLines > THRESHOLD) {
            console.log(`[AUTO-DISTILL] Over threshold: troubleshooting=${tsLines} patterns=${ptLines} (limit=${THRESHOLD})`);
            fs.writeFileSync(flagPath, JSON.stringify({
                timestamp: new Date().toISOString(),
                troubleshooting: tsLines,
                patterns: ptLines
            }), 'utf8');
        } else if (fs.existsSync(flagPath)) {
            fs.unlinkSync(flagPath);
        }
    } catch {}
}

// Append facts to references/project-facts.md under a dated section.
// Never touches MEMORY.md — prevents index bloat past 200-line cap.
function appendNicheFacts(filePath, facts, today) {
    if (!facts?.length) return;
    let content = '';
    try { content = fs.readFileSync(filePath, 'utf8'); } catch {}
    const SECTION = `## Niche Project Facts (moved from MEMORY.md 2026-04-23)`;
    if (!content.includes(SECTION)) {
        content = (content.trimEnd() || '# Project Facts') + `\n\n${SECTION}\n\n`;
    }
    const auto = `\n<!-- auto-appended ${today} -->\n`;
    const block = auto + facts.map(f => `- ${f.value} <!-- fact:${String(f.key).slice(0,40)} verified:${today} -->`).join('\n') + '\n';
    // Dedup: skip values already present in the file
    const normalized = content.toLowerCase();
    const toAppend = facts.filter(f => !normalized.includes(String(f.value).trim().toLowerCase().slice(0, 60)));
    if (!toAppend.length) return;
    const appendBlock = auto + toAppend.map(f => `- ${f.value} <!-- fact:${String(f.key).slice(0,40)} verified:${today} -->`).join('\n') + '\n';
    try { fs.appendFileSync(filePath, appendBlock, 'utf8'); } catch (e) {
        console.error(`Session audit: niche append failed — ${e.message}`);
    }
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
    let sessionId = '';
    try {
        const parsed = JSON.parse(stdin);
        transcriptPath = parsed.transcript_path || '';
        sessionId = parsed.session_id || '';
    } catch {}

    const state = loadState();
    const fromLine = (state.transcriptPath === transcriptPath) ? (state.lastLine || 0) : 0;
    const { text: transcriptSummary, totalLines } = extractTranscriptSummary(transcriptPath, fromLine);

    // Accumulator check runs regardless of extraction — protects against silent overflow
    // when session has <5 new lines (early return skips the LLM path but flag still needed).
    checkAccumulatorOverflow();
    const newAutoMemFiles = checkAutoMemoryGrowth(sessionId);

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
  "summary": "ONE sentence ≤120 chars in Russian: what was accomplished this session (punchy, no filler like 'в рамках сессии', 'была проведена'). Start with verb.",
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
- patterns: REPEATABLE PROCESSES DISCOVERED OR APPLIED in THIS session's work (user+assistant turns).
  NEVER quote rules that were already in the system prompt, CLAUDE.md, skill definitions, or constitution.
  Bad patterns (REJECT these): "run critic phase after outputs", "MEMORY.md = facts, overflow → references/",
  "File Discipline", "YAGNI → DRY", "Parallel Agents merge policy" — these are pre-existing rules, not session patterns.
  Good patterns (ACCEPT): "use bash cp staging.md target.md to bypass mtime race on actively-rewritten files",
  "read transcript_path from stdin instead of latest-mtime when multiple parallel sessions exist".
  If nothing actionable was discovered this session → return empty array.
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

    // Filter generic/prescriptive "patterns" that slip past the system prompt.
    // Keep only specific, session-grounded patterns.
    if (extracted.patterns?.length) {
        const beforeCount = extracted.patterns.length;
        extracted.patterns = extracted.patterns.filter(p => !isGenericPattern(p));
        const dropped = beforeCount - extracted.patterns.length;
        if (dropped > 0) console.error(`Session audit: filtered ${dropped} generic pattern(s)`);
        counts.patterns = extracted.patterns.length;
        if (extracted.patterns.length) {
            const content = extracted.patterns.map(p => `- [${today}] ${p}`).join('\n');
            await appendToVault(PATTERNS, content);
        }
    }

    // Facts are NOT written to MEMORY.md (that's an index, not a landfill).
    // All extracted facts go to references/project-facts.md as on-demand journal.
    // MEMORY.md grows only via deliberate one-line index entries added by the user.
    let cleanFacts = [];
    if (extracted.facts?.length) {
        const verifiedFacts = extracted.facts.filter(f => !f.confidence || f.confidence !== 'low');
        cleanFacts = verifiedFacts.filter(f => !isJunkFact(f));
        const dropped = verifiedFacts.length - cleanFacts.length;
        if (dropped > 0) console.error(`Session audit: filtered ${dropped} junk fact(s)`);
        if (cleanFacts.length) {
            const REFERENCES_FILE = path.join(CLAUDE_DIR, 'references', 'project-facts.md');
            appendNicheFacts(REFERENCES_FILE, cleanFacts, today);
            console.error(`Session audit: routed ${cleanFacts.length} fact(s) → references/project-facts.md`);
        }
        counts.facts = cleanFacts.length;
    }
    extracted.facts = cleanFacts;

    saveState({ lastLine: totalLines, lastTimestamp: new Date().toISOString(), transcriptPath });

    // Re-run accumulator check AFTER append — post-extraction may have pushed over threshold.
    checkAccumulatorOverflow();
    const newAutoMemFilesPost = checkAutoMemoryGrowth(sessionId);

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
    const factsSummary = counts.facts ? `project-facts.md: facts(${counts.facts})` : '';
    parts.push('');
    parts.push(`  → vault: ${vaultSummary || 'none'} | ${factsSummary || 'no facts'}`);
    parts.push(line);

    const report = parts.join('\n');
    console.log(report);

    // Write pending report to a per-session file. MEMORY.md is cross-session shared,
    // so writing a PENDING block there leaks another session's report into this one.
    // compact-report-injector.js reads only `${sessionId}.txt` if session_id arrives in stdin.
    if (sessionId) {
        const pendingFile = path.join(CLAUDE_DIR, 'hooks', `.pending-report-${sessionId}.txt`);
        try { fs.writeFileSync(pendingFile, report, 'utf8'); } catch {}
    } else {
        process.stderr.write('[SessionAudit] no session_id in stdin — skipping pending-report write (would leak across sessions)\n');
    }

    // Sweep any legacy shared-file or MEMORY.md PENDING block that older hook versions wrote.
    try { fs.unlinkSync(path.join(CLAUDE_DIR, 'hooks', '.pending-compact-report.txt')); } catch {}
    try {
        let mem = fs.readFileSync(MEMORY_FILE, 'utf8');
        const cleaned = mem.replace(/<!--PENDING-START-->[\s\S]*?<!--PENDING-END-->\n?/g, '');
        if (cleaned !== mem) fs.writeFileSync(MEMORY_FILE, cleaned, 'utf8');
    } catch {}
}

main().catch(e => {
    console.error(`Session audit failed: ${e.message}`);
    process.exit(0);
});
