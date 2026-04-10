#!/usr/bin/env node
/**
 * vault-lint.js — Domain compile + lint for Obsidian vault.
 * Inspired by Karpathy's LLM Knowledge Base concept.
 *
 * Usage:
 *   node scripts/vault-lint.js --domain "n8n"           # compile + lint one domain
 *   node scripts/vault-lint.js --scan                    # auto-detect top-3 domains
 *   node scripts/vault-lint.js --domain "SEO" --lint-only
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { spawnSync } = require('child_process');
const { VAULT_DIR, QMD, CLAUDE_DIR } = require('../hooks/shared/paths');
const { callSonnet, appendToVaultByRelPath } = require('../hooks/shared/obsidian-api');

const ROUTING_MAP = path.join(VAULT_DIR, '90-System/routing-map.md');
const WIKI_DIR = path.join(VAULT_DIR, 'Wiki');
const STATE_FILE = path.join(WIKI_DIR, '.compile-state.json');
const MAX_NOTES = 15;
const MAX_CONTENT_CHARS = 60000; // ~15K tokens

// --- Gemini API (primary, free) ---
function callGemini(systemPrompt, userMessage, maxTokens = 4096) {
    return new Promise((resolve, reject) => {
        let apiKey;
        try { apiKey = fs.readFileSync(path.join(CLAUDE_DIR, 'credentials/gemini-api.key'), 'utf8').trim(); } catch {}
        if (!apiKey) apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return reject(new Error('No Gemini API key'));

        const body = JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: 'user', parts: [{ text: userMessage }] }],
            generationConfig: { maxOutputTokens: maxTokens, temperature: 0.3, thinkingConfig: { thinkingBudget: 1024 } }
        });

        const req = https.request({
            hostname: 'generativelanguage.googleapis.com',
            path: `/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
            method: 'POST',
            headers: { 'content-type': 'application/json', 'content-length': Buffer.byteLength(body) }
        }, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    const parts = parsed.candidates?.[0]?.content?.parts || [];
                    // Gemini thinking model: skip thinking parts, take text parts
                    const textParts = parts.filter(p => p.text && !p.thought);
                    const text = textParts.map(p => p.text).join('\n');
                    if (!text) return reject(new Error('Empty Gemini response: ' + data.slice(0, 300)));
                    resolve(text);
                } catch (e) { reject(new Error('Gemini parse error: ' + e.message)); }
            });
        });

        req.on('error', reject);
        req.setTimeout(120000, () => { req.destroy(); reject(new Error('Gemini timeout')); });
        req.write(body);
        req.end();
    });
}

// --- LLM call with fallback: Gemini (free) → Sonnet ---
async function callLLM(systemPrompt, userMessage, maxTokens = 4096) {
    try {
        return await callGemini(systemPrompt, userMessage, maxTokens);
    } catch (err) {
        console.log(`  ⚠ Gemini failed (${err.message}), trying Sonnet...`);
        return callSonnet(systemPrompt, userMessage, maxTokens);
    }
}

// --- CLI ---
const args = process.argv.slice(2);
const domainArg = args.includes('--domain') ? args[args.indexOf('--domain') + 1] : null;
const scanMode = args.includes('--scan');
const lintOnly = args.includes('--lint-only');
const force = args.includes('--force');

if (!domainArg && !scanMode) {
    console.log('Usage: node vault-lint.js --domain "n8n" | --scan [--lint-only] [--force]');
    process.exit(0);
}

// --- Parse routing-map.md ---
function parseRoutingMap() {
    const content = fs.readFileSync(ROUTING_MAP, 'utf8');
    const rows = [];
    for (const line of content.split('\n')) {
        // Split by | but rejoin wikilink-internal pipes first
        // Strategy: find row number, then extract columns manually
        if (!line.startsWith('|')) continue;
        const numMatch = line.match(/^\|\s*(\d+)\s*\|/);
        if (!numMatch) continue;
        const num = parseInt(numMatch[1]);
        if (isNaN(num)) continue;

        // Remove leading "| N |" and trailing "|", then split on " | " outside wikilinks
        const rest = line.slice(numMatch[0].length).replace(/\|\s*$/, '');
        // Find last two " | " separators for destination and description
        const lastPipe = rest.lastIndexOf(' | ');
        if (lastPipe < 0) continue;
        const beforeLast = rest.slice(0, lastPipe);
        const description = rest.slice(lastPipe + 3).trim();
        const secondLastPipe = beforeLast.lastIndexOf(' | ');
        if (secondLastPipe < 0) continue;
        const rawKeywords = beforeLast.slice(0, secondLastPipe).trim();
        const destination = beforeLast.slice(secondLastPipe + 3).trim().replace(/`/g, '');

        // Strip wikilinks: [[target|display]] → display, [[target]] → target
        const keywords = rawKeywords
            .replace(/\[\[[^\]|]+\|([^\]]+)\]\]/g, '$1')
            .replace(/\[\[([^\]]+)\]\]/g, '$1');

        rows.push({ id: num, keywords, destination, description });
    }
    return rows;
}

// --- QMD search ---
function qmdSearch(query, limit = MAX_NOTES) {
    try {
        const cleanQuery = query.replace(/\[\[[^\]]+\]\]/g, '').replace(/"/g, ' ').trim();
        const cmd = `"${QMD}" search "${cleanQuery}" -c vault -n ${limit}`;
        const r = spawnSync('bash', ['-c', cmd], {
            encoding: 'utf8', timeout: 15000, stdio: 'pipe', windowsHide: true
        });
        const out = r.stdout || '';
        const results = [];
        let current = null;
        for (const line of out.split('\n')) {
            const fileMatch = line.match(/^qmd:\/\/vault\/(.+?)(?::\d+)?\s+#/);
            if (fileMatch) {
                if (current) results.push(current);
                current = { file: fileMatch[1], content: '' };
                continue;
            }
            const scoreMatch = line.match(/^Score:\s+(\d+)%/);
            if (scoreMatch && current) {
                current.score = parseInt(scoreMatch[1]);
                continue;
            }
            if (current && line.startsWith('@@ ')) continue;
            if (current && line.startsWith('Title:')) continue;
            if (current && line.startsWith('Context:')) continue;
            if (current && line.trim()) {
                current.content += line + '\n';
            }
        }
        if (current) results.push(current);
        return results.filter(r => (r.score || 0) >= 50);
    } catch (err) {
        console.error(`[qmd] search failed: ${err.message}`);
        return [];
    }
}

// --- Read vault files ---
function readNoteContent(relPath) {
    try {
        const abs = path.join(VAULT_DIR, relPath);
        return fs.readFileSync(abs, 'utf8');
    } catch { return ''; }
}

// --- Compile state ---
function loadState() {
    try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); } catch { return {}; }
}
function saveState(state) {
    if (!fs.existsSync(WIKI_DIR)) fs.mkdirSync(WIKI_DIR, { recursive: true });
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
}

function getSourceMtimes(files) {
    const mtimes = {};
    for (const f of files) {
        try {
            const abs = path.join(VAULT_DIR, f);
            mtimes[f] = fs.statSync(abs).mtimeMs;
        } catch { mtimes[f] = 0; }
    }
    return mtimes;
}

function sourcesChanged(domainKey, files, state) {
    if (force) return true;
    const prev = state[domainKey];
    if (!prev) return true;
    const current = getSourceMtimes(files);
    for (const f of files) {
        if ((current[f] || 0) !== (prev[f] || 0)) return true;
    }
    return false;
}

// --- Build domain label for filename ---
function domainSlug(keywords) {
    const first = keywords.split(',')[0].trim().toLowerCase()
        .replace(/[^a-zа-яё0-9]+/gi, '-').replace(/^-|-$/g, '');
    return first.slice(0, 40) || 'unknown';
}

// --- LLM compile + lint ---
async function compileDomain(domain, noteContents, lintOnlyMode) {
    const systemPrompt = `You are a knowledge compiler and auditor for an Obsidian vault.
You receive notes from a specific domain and must:
${lintOnlyMode ? '' : `1. COMPILE: Write a structured wiki overview page in Russian with:
   - Title (## heading)
   - Key concepts organized by sub-topic
   - [[wikilinks]] to source notes where relevant (use note filenames without extension)
   - Practical insights, not just summaries
`}
${lintOnlyMode ? '1' : '2'}. LINT: Find and report:
   - CONTRADICTIONS: where two notes say opposite things (cite both)
   - GAPS: topics mentioned but never explained
   - STALE: information that looks outdated (old dates, deprecated tools)
   - CONNECTIONS: non-obvious links between notes that aren't currently connected

Format your response as:
${lintOnlyMode ? '' : `## {Domain Title}

{compiled overview with [[wikilinks]]}

---
`}
## Lint Report

### Contradictions
{list or "None found"}

### Gaps
{list or "None found"}

### Stale
{list or "None found"}

### Suggested Connections
{list of [[note1]] ↔ [[note2]] with reason}`;

    const userMsg = `Domain: ${domain.keywords}
Description: ${domain.description}
Destination: ${domain.destination}

Source notes (${noteContents.length}):

${noteContents.map(n => `--- ${n.file} ---\n${n.content.slice(0, Math.floor(MAX_CONTENT_CHARS / noteContents.length))}\n`).join('\n')}`;

    return callLLM(systemPrompt, userMsg, 8192);
}

// --- Process one domain ---
async function processDomain(domain) {
    const slug = domainSlug(domain.keywords);
    console.log(`\n📋 Domain #${domain.id}: ${domain.keywords.slice(0, 60)}...`);

    // Search vault for relevant notes — strip wikilinks and take first 3 keyword groups
    const searchTerms = domain.keywords
        .replace(/\[\[[^\]]+\]\]/g, '')
        .split(',').slice(0, 3).map(s => s.trim()).filter(Boolean).join(' ');
    const results = qmdSearch(searchTerms);

    if (results.length < 3) {
        console.log(`  ⏭ Skipped — only ${results.length} notes found (min 3)`);
        return null;
    }

    const files = results.map(r => r.file);

    // Check compile state
    const state = loadState();
    if (!sourcesChanged(slug, files, state)) {
        console.log(`  ⏭ Skipped — sources unchanged since last compile`);
        return null;
    }

    console.log(`  📄 Found ${results.length} notes, reading content...`);

    // Read full content of found notes
    const noteContents = results.slice(0, MAX_NOTES).map(r => ({
        file: r.file,
        content: readNoteContent(r.file)
    })).filter(n => n.content.length > 50);

    if (noteContents.length < 3) {
        console.log(`  ⏭ Skipped — only ${noteContents.length} notes with content`);
        return null;
    }

    console.log(`  🤖 Compiling${lintOnly ? ' (lint-only)' : ''} with Sonnet...`);

    try {
        const result = await compileDomain(domain, noteContents, lintOnly);
        const today = new Date().toISOString().slice(0, 10);
        const wikiFile = `Wiki/${slug}.md`;

        const frontmatter = `---
tags: [wiki, compiled, ${slug}]
domain: "${domain.keywords.split(',')[0].trim()}"
sources: ${noteContents.length}
compiled: ${today}
---

`;
        const fullContent = frontmatter + result;

        // Write to vault
        if (!fs.existsSync(WIKI_DIR)) fs.mkdirSync(WIKI_DIR, { recursive: true });
        const outPath = path.join(WIKI_DIR, `${slug}.md`);
        fs.writeFileSync(outPath, fullContent, 'utf8');
        console.log(`  ✅ Written: ${wikiFile}`);

        // Update compile state
        state[slug] = getSourceMtimes(files);
        saveState(state);

        return { slug, file: wikiFile, sources: noteContents.length };
    } catch (err) {
        console.error(`  ❌ Compile failed: ${err.message}`);
        // Retry once
        try {
            console.log(`  🔄 Retrying...`);
            const result = await compileDomain(domain, noteContents, lintOnly);
            const today = new Date().toISOString().slice(0, 10);
            const outPath = path.join(WIKI_DIR, `${slug}.md`);
            const frontmatter = `---\ntags: [wiki, compiled, ${slug}]\ndomain: "${domain.keywords.split(',')[0].trim()}"\nsources: ${noteContents.length}\ncompiled: ${today}\n---\n\n`;
            fs.writeFileSync(outPath, frontmatter + result, 'utf8');
            console.log(`  ✅ Written on retry: Wiki/${slug}.md`);
            const state2 = loadState();
            state2[slug] = getSourceMtimes(files);
            saveState(state2);
            return { slug, file: `Wiki/${slug}.md`, sources: noteContents.length };
        } catch (err2) {
            console.error(`  ❌ Retry failed: ${err2.message}`);
            return null;
        }
    }
}

// --- Update INDEX.md ---
function updateIndex(compiled) {
    const indexPath = path.join(WIKI_DIR, 'INDEX.md');
    const today = new Date().toISOString().slice(0, 10);
    let existing = '';
    try { existing = fs.readFileSync(indexPath, 'utf8'); } catch {}

    // Parse existing entries to preserve manually added ones
    const existingEntries = new Map();
    for (const line of existing.split('\n')) {
        const m = line.match(/^- \[\[([^\]]+)\]\]/);
        if (m) existingEntries.set(m[1], line);
    }

    // Add/update compiled entries
    for (const c of compiled) {
        existingEntries.set(c.slug, `- [[${c.slug}]] — ${c.sources} sources, compiled ${today}`);
    }

    const entries = Array.from(existingEntries.values()).sort();
    const content = `---
tags: [wiki, index]
updated: ${today}
---

# Wiki Index

Compiled knowledge pages. Auto-updated by vault-lint.js.

${entries.join('\n')}
`;
    fs.writeFileSync(indexPath, content, 'utf8');
    console.log(`\n📚 INDEX.md updated (${entries.length} entries)`);
}

// --- Scan mode: find top domains by note count ---
function findTopDomains(domains, topN = 3) {
    const counts = domains.map(d => {
        const terms = d.keywords.split(',').slice(0, 2).map(s => s.trim()).join(' ');
        const results = qmdSearch(terms, 20);
        return { domain: d, count: results.length };
    });
    counts.sort((a, b) => b.count - a.count);
    return counts.slice(0, topN).filter(c => c.count >= 3).map(c => c.domain);
}

// --- Main ---
async function main() {
    console.log('🔍 Vault Lint — Karpathy-style domain compile + lint\n');

    const domains = parseRoutingMap();
    console.log(`Loaded ${domains.length} domains from routing-map.md`);

    let targetDomains;

    if (scanMode) {
        console.log('Scanning for top domains by note count...');
        targetDomains = findTopDomains(domains);
        console.log(`Selected: ${targetDomains.map(d => d.keywords.split(',')[0].trim()).join(', ')}`);
    } else {
        // Match domain arg against keywords
        const needle = domainArg.toLowerCase();
        targetDomains = domains.filter(d => d.keywords.toLowerCase().includes(needle));
        if (targetDomains.length === 0) {
            console.error(`No domain matching "${domainArg}" in routing-map.md`);
            process.exit(1);
        }
    }

    const compiled = [];
    for (const domain of targetDomains) {
        const result = await processDomain(domain);
        if (result) compiled.push(result);
    }

    if (compiled.length > 0) {
        updateIndex(compiled);
    }

    console.log(`\n✨ Done. ${compiled.length} domain(s) compiled.`);
}

main().catch(err => {
    console.error('Fatal:', err.message);
    process.exit(1);
});
