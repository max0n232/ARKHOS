#!/usr/bin/env node
/**
 * Pattern Analyzer — Proactive Knowledge Base Intelligence
 *
 * Analyzes routed video insights for patterns: convergence, gaps,
 * actionable items, staleness, optimization opportunities.
 * Actions: Telegram (critical), Obsidian tasks (medium), state flags (low).
 *
 * Called by video-insight-router.js after successful routing batch.
 */

const fs = require('fs');
const path = require('path');

const { VAULT_DIR } = require('../hooks/shared/paths');
const { callSonnet, sendTelegram, appendToVaultByRelPath } = require('../hooks/shared/obsidian-api');

const CHAT_ID = '804465999';
const COOLDOWN_DAYS = 7;
const MAX_TELEGRAM = 3;
const MAX_TASKS = 5;
const FLAG_EXPIRY_DAYS = 14;
const TASKS_PATH = '00-Inbox/proactive-tasks.md';

// --- Dedup for tasks ---

function isTaskDuplicate(message) {
    const absPath = path.join(VAULT_DIR, TASKS_PATH);
    if (!fs.existsSync(absPath)) return false;
    const existing = fs.readFileSync(absPath, 'utf8');
    // Compare core message without date/domain metadata
    const core = message.replace(/\s+/g, ' ').trim().slice(0, 80);
    return existing.includes(core);
}

// --- Obsidian task creation ---

async function createTask(message, domain) {
    if (isTaskDuplicate(message)) return;

    const today = new Date().toISOString().slice(0, 10);
    const task = `\n- [ ] [PROACTIVE] ${message} <!-- pattern domain:${domain} date:${today} -->\n`;

    await appendToVaultByRelPath(TASKS_PATH, task, {
        createIfMissing: true,
        fileTitle: 'Proactive Tasks'
    });
}

// --- Vault stats collection ---

function collectVaultStats(routingMap) {
    const stats = {};
    const destRegex = /\|\s*\d+\s*\|[^|]+\|\s*`([^`]+)`\s*\|/g;
    let match;

    while ((match = destRegex.exec(routingMap)) !== null) {
        const relPath = match[1];
        if (relPath === 'MEMORY.md') continue;
        const absPath = path.join(VAULT_DIR, relPath);

        try {
            const content = fs.readFileSync(absPath, 'utf8');
            const stat = fs.statSync(absPath);
            const sourceCount = (content.match(/<!-- source: YT-/g) || []).length;
            const lineCount = content.split('\n').length;

            stats[relPath] = {
                lines: lineCount,
                videoSources: sourceCount,
                lastModified: stat.mtime.toISOString().slice(0, 10),
                exists: true
            };
        } catch {
            stats[relPath] = { lines: 0, videoSources: 0, lastModified: 'never', exists: false };
        }
    }
    return stats;
}

// --- Anti-spam ---

function isOnCooldown(notifiedPatterns, key) {
    const lastDate = notifiedPatterns[key];
    if (!lastDate) return false;
    const daysSince = (Date.now() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24);
    return daysSince < COOLDOWN_DAYS;
}

function expireFlags(flags) {
    const now = Date.now();
    return flags.filter(f => {
        const age = (now - new Date(f.date).getTime()) / (1000 * 60 * 60 * 24);
        return age < FLAG_EXPIRY_DAYS;
    });
}

// --- Main export ---

async function analyzeAndAct(routingMap, routedResults, state) {
    const analysis = state.analysis || {
        lastAnalysisRun: null,
        notifiedPatterns: {},
        pendingFlags: [],
        stats: { totalVideosProcessed: 0, insightsPerDomain: {} }
    };

    const vaultStats = collectVaultStats(routingMap);

    analysis.stats.totalVideosProcessed += routedResults.length;
    for (const result of routedResults) {
        for (const [dest, count] of Object.entries(result.destinations || {})) {
            analysis.stats.insightsPerDomain[dest] = (analysis.stats.insightsPerDomain[dest] || 0) + count;
        }
    }

    const systemPrompt = `You are a proactive AI systems architect. You analyze newly extracted video insights and compare them against the user's CURRENT system to generate specific, actionable recommendations.

Your job is NOT to report statistics. Your job is to answer: "What from these videos should the user implement, integrate, or avoid — and WHY?"

CURRENT SYSTEM (user's stack):
- ARKHOS: Claude Code (Opus) with custom hooks, skills, MCP integrations, Ghost session memory
- Studiokook: WordPress client site (Elementor, TranslatePress, n8n automation, SEO)
- AiGeneration: AI content generation tools and prompts
- SocialMedia: SMM strategy across Instagram, Telegram, Threads
- Trading: algorithmic trading project (early stage)
- n8n 2.37 (VPS) — workflow automation, YouTube pipeline, SEO audits
- Obsidian vault (PARA) — knowledge base with QMD semantic search
- Ghost — session memory across conversations
- Telegram bot (ARKHOS) — notifications
- Video pipeline: Telegram → n8n → Claude Sonnet extraction → GitHub → Obsidian → Router → Vault

Return ONLY valid JSON array (no markdown fences). Each item:
{"type": "actionable|optimization|security|gap|convergence|staleness", "domain": "relevant_file.md", "message": "specific recommendation in Russian with WHY and HOW", "severity": "critical|medium|low"}

Detection types:
- actionable: specific tool/technique from video worth implementing NOW (name the tool, explain fit)
- optimization: cross-domain opportunity (video insight improves existing system component)
- security: API keys, credentials, access patterns that need attention
- gap: video reveals capability the user lacks and should consider
- convergence: multiple videos point to same direction — signal to prioritize
- staleness: domain not updated despite new relevant insights

CRITICAL RULES:
- Compare video content against CURRENT SYSTEM — recommend only what fits
- If a tool from video duplicates existing functionality, say "don't implement, you already have X"
- Be specific: name tools, APIs, techniques from the video content
- Max 5 items. Empty [] if nothing worth acting on.`;

    const insightsContent = routedResults.map(r =>
        '=== ' + r.fileName + ' ===\n' + (r.insightsText || 'no text available')
    ).join('\n\n');

    const userMsg = `VAULT STATS:\n${JSON.stringify(vaultStats, null, 2)}\n\nEXTRACTED INSIGHTS CONTENT:\n${insightsContent}\n\nALREADY NOTIFIED (skip these):\n${JSON.stringify(analysis.notifiedPatterns)}`;

    let patterns;
    try {
        const response = await callSonnet(systemPrompt, userMsg);
        let jsonStr = response.trim();
        if (jsonStr.startsWith('```')) jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
        patterns = JSON.parse(jsonStr);
        if (!Array.isArray(patterns)) patterns = [];
    } catch (e) {
        console.log('  Pattern analysis skipped: ' + e.message);
        state.analysis = analysis;
        return;
    }

    if (!patterns.length) {
        console.log('  Pattern analysis: no significant patterns detected');
        analysis.lastAnalysisRun = new Date().toISOString();
        state.analysis = analysis;
        return;
    }

    let telegramCount = 0;
    let taskCount = 0;
    analysis.pendingFlags = expireFlags(analysis.pendingFlags);

    for (const p of patterns) {
        const key = p.type + ':' + p.domain;

        if (isOnCooldown(analysis.notifiedPatterns, key)) continue;

        if (p.severity === 'critical' && telegramCount < MAX_TELEGRAM) {
            try {
                const msg = `📊 *VAULT INSIGHT* [${p.type}]\n\n${p.message}\n\n_Domain: ${p.domain}_\n_Videos: ${analysis.stats.totalVideosProcessed} processed_`;
                await sendTelegram(CHAT_ID, msg);
                analysis.notifiedPatterns[key] = new Date().toISOString().slice(0, 10);
                telegramCount++;
                console.log('  Telegram: ' + p.type + ' → ' + p.domain);
            } catch (e) {
                console.log('  Telegram failed: ' + e.message);
                analysis.notifiedPatterns[key] = new Date().toISOString().slice(0, 10);
            }
        } else if (p.severity === 'medium' && taskCount < MAX_TASKS) {
            try {
                await createTask(p.message, p.domain);
                analysis.notifiedPatterns[key] = new Date().toISOString().slice(0, 10);
                taskCount++;
                console.log('  Task: ' + p.type + ' → ' + p.domain);
            } catch (e) {
                console.log('  Task failed: ' + e.message);
            }
        } else if (p.severity === 'low') {
            analysis.pendingFlags.push({
                type: p.type, domain: p.domain, message: p.message,
                date: new Date().toISOString().slice(0, 10)
            });
        }
    }

    if (analysis.pendingFlags.length >= 3 && telegramCount < MAX_TELEGRAM) {
        const digest = analysis.pendingFlags.map(f => '• ' + f.message).join('\n');
        try {
            await sendTelegram(CHAT_ID, `📋 *VAULT DIGEST* (${analysis.pendingFlags.length} items)\n\n${digest}`);
            analysis.pendingFlags = [];
            console.log('  Telegram digest sent');
        } catch {}
    }

    analysis.lastAnalysisRun = new Date().toISOString();
    state.analysis = analysis;

    console.log('  Pattern analysis: ' + telegramCount + ' notifications, ' + taskCount + ' tasks, ' + analysis.pendingFlags.length + ' flags');
}

module.exports = { analyzeAndAct };
