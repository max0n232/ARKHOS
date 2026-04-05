#!/usr/bin/env node
/**
 * Video Insight Router
 *
 * Scans youtube-notes/ for processed (but unrouted) video notes,
 * classifies extracted insights against routing-map.md via Sonnet,
 * and appends them to destination vault files.
 *
 * Triggered: auto-pull.bat (after successful git pull, every ~15 min)
 * Idempotent: skips files with routed: true in frontmatter
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const { CLAUDE_DIR, VAULT_DIR } = require('../hooks/shared/paths');
const { callSonnet, appendToVaultByRelPath } = require('../hooks/shared/obsidian-api');

const YOUTUBE_DIR = path.join(VAULT_DIR, 'youtube-notes');
const ROUTING_MAP = path.join(VAULT_DIR, '90-System/routing-map.md');
const STATE_FILE = path.join(CLAUDE_DIR, 'scripts/.router-state.json');

// --- File scanning ---

function findUnroutedFiles() {
    const results = [];
    const categories = fs.readdirSync(YOUTUBE_DIR).filter(f => {
        const full = path.join(YOUTUBE_DIR, f);
        return fs.statSync(full).isDirectory() && !f.startsWith('.');
    });

    for (const cat of categories) {
        const dir = path.join(YOUTUBE_DIR, cat);
        const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
        for (const file of files) {
            const filePath = path.join(dir, file);
            const content = fs.readFileSync(filePath, 'utf8');
            if (content.includes('processed: true') && !content.includes('routed: true')) {
                if (content.includes('## Extracted Insights')) {
                    results.push({ filePath, fileName: file, category: cat, content });
                }
            }
        }
    }
    return results;
}

function extractInsightsSection(content) {
    const marker = '## Extracted Insights';
    const idx = content.indexOf(marker);
    if (idx === -1) return '';
    return content.slice(idx + marker.length).trim();
}

// --- Deduplication ---

function isDuplicate(destPath, insightTitle) {
    const absPath = path.join(VAULT_DIR, destPath);
    if (!fs.existsSync(absPath)) return false;
    const existing = fs.readFileSync(absPath, 'utf8');
    return existing.includes(insightTitle);
}

// --- Git commit for routed files ---

function commitRoutedFiles() {
    const gitOpts = { cwd: YOUTUBE_DIR, stdio: 'pipe', timeout: 15000, windowsHide: true };
    const add = spawnSync('git', ['add', '-A'], gitOpts);
    if (add.status !== 0) return;

    spawnSync('git', ['commit', '-m', 'chore: mark routed video notes'], gitOpts);
}

// --- Main ---

async function main() {
    if (!fs.existsSync(ROUTING_MAP)) {
        console.error('ABORT: routing-map.md not found at ' + ROUTING_MAP);
        process.exit(1);
    }
    const routingMap = fs.readFileSync(ROUTING_MAP, 'utf8');

    const files = findUnroutedFiles();
    if (!files.length) {
        console.log('Video router: no unrouted files found');
        return;
    }

    console.log('Video router: found ' + files.length + ' unrouted file(s)');

    const systemPrompt = `You are a knowledge router for a technical architect who builds:
- ARKHOS: Claude Code CLI with hooks, skills, MCP integrations, Ghost session memory
- Studiokook: WordPress client site (Elementor, TranslatePress, n8n automation, SEO)
- AiGeneration: AI content generation tools and prompts
- SocialMedia: SMM strategy across Instagram, Telegram, Threads
- Trading: algorithmic trading, bots, market analysis

You receive extracted insights from a YouTube video and a routing table with keyword-based destinations.

Rules:
- Match by content domain (keywords in the insight vs keywords in routing table)
- Use the most specific match when multiple rows apply
- RELEVANCE FILTER: Skip insights that are generic advice, not actionable for the user's projects, or targeted at a different audience
- CONSOLIDATION: If multiple insights describe the same concept, keep only the single most specific/actionable version
- If no row matches well, set destination to "SKIP"
- Return ONLY valid JSON array, no markdown fences, no explanation

Output format (JSON array):
[{"title": "### TYPE: Title exactly as given", "destination": "vault/relative/path.md", "summary": "1-2 line condensed version"}]

Only include HIGH or MEDIUM relevance insights. Skip LOW relevance entirely.
Keep summaries concise (2-4 bullet points max). Strip verbose explanations. Preserve TYPE prefix (PATTERN/GOTCHA/FACT/EXAMPLE).`;

    let totalRouted = 0;
    const routedFiles = [];
    const routedResults = [];
    const errors = [];

    for (const file of files) {
        const insights = extractInsightsSection(file.content);
        if (!insights) continue;

        const userMsg = `ROUTING TABLE:\n${routingMap}\n\nINSIGHTS FROM VIDEO (${file.fileName}):\n${insights}`;

        try {
            const response = await callSonnet(systemPrompt, userMsg, 4096);
            let jsonStr = response.trim();
            if (jsonStr.startsWith('```')) {
                jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
            }
            const routed = JSON.parse(jsonStr);

            if (!Array.isArray(routed)) {
                errors.push({ file: file.fileName, error: 'API returned non-array' });
                continue;
            }

            // Cross-insight dedup: group by destination, fuzzy-match titles
            const consolidated = {};
            for (const item of routed) {
                if (!item.destination || item.destination === 'SKIP') continue;
                const key = item.destination;
                if (!consolidated[key]) consolidated[key] = [];

                const isDupInBatch = consolidated[key].some(existing => {
                    const existCore = existing.title.replace(/^###\s+(PATTERN|GOTCHA|FACT|EXAMPLE)[:\s\u2014-]*/i, '').toLowerCase();
                    const newCore = item.title.replace(/^###\s+(PATTERN|GOTCHA|FACT|EXAMPLE)[:\s\u2014-]*/i, '').toLowerCase();
                    const existWords = new Set(existCore.split(/\s+/).filter(w => w.length > 2));
                    const newWords = newCore.split(/\s+/).filter(w => w.length > 2);
                    if (!newWords.length) return false;
                    const overlap = newWords.filter(w => existWords.has(w)).length;
                    return overlap / Math.max(existWords.size, newWords.length) > 0.6;
                });

                if (!isDupInBatch) {
                    consolidated[key].push(item);
                }
            }
            const dedupedRouted = Object.values(consolidated).flat();

            let fileRouted = 0;
            const destinations = {};

            for (const item of dedupedRouted) {
                if (isDuplicate(item.destination, item.title)) continue;

                if (!destinations[item.destination]) destinations[item.destination] = [];
                destinations[item.destination].push(item);
            }

            // Batch append per destination
            for (const [dest, items] of Object.entries(destinations)) {
                const block = items.map(item => {
                    return `\n<!-- source: ${file.fileName} -->\n${item.title}\n${item.summary}\n`;
                }).join('');

                await appendToVaultByRelPath(dest, block);
                fileRouted += items.length;
            }

            // Mark as routed in frontmatter
            if (fileRouted > 0) {
                const updated = file.content.replace('processed: true', 'processed: true\nrouted: true');
                fs.writeFileSync(file.filePath, updated, 'utf8');
                totalRouted += fileRouted;
                routedFiles.push(file.fileName);
                const destCounts = {};
                for (const [d, items] of Object.entries(destinations)) destCounts[d] = items.length;
                routedResults.push({ fileName: file.fileName, insightCount: fileRouted, destinations: destCounts, insightsText: insights.slice(0, 3000) });
                console.log('  ' + file.fileName + ': ' + fileRouted + ' insights routed to ' + Object.keys(destinations).length + ' destinations');
            }
        } catch (e) {
            errors.push({ file: file.fileName, error: e.message });
            console.error('  ERROR ' + file.fileName + ': ' + e.message);
        }
    }

    // Commit routed files so git pull --rebase doesn't fail next time
    if (routedFiles.length > 0) {
        commitRoutedFiles();
        console.log('Video router: committed routed file changes');
    }

    // Load existing state (preserve analysis section)
    let state = {};
    try { state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); } catch {}

    state.lastRun = new Date().toISOString();
    state.filesRouted = routedFiles;
    state.totalInsightsRouted = totalRouted;
    state.lastErrors = errors.map(e => e.file + ': ' + e.error);

    console.log('Video router: ' + totalRouted + ' insights routed from ' + routedFiles.length + ' file(s)');
    if (errors.length) console.log('  Errors: ' + errors.length);

    // Pattern analysis (Sonnet-powered, after routing)
    if (totalRouted > 0) {
        try {
            const { analyzeAndAct } = require('./pattern-analyzer');
            await analyzeAndAct(routingMap, routedResults, state);
        } catch (e) {
            console.log('  Pattern analysis error: ' + e.message);
        }
    }

    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
}

main().catch(e => {
    console.error('Video router fatal: ' + e.message);
    process.exit(1);
});
