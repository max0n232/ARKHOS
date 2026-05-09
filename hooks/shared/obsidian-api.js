/**
 * Shared Obsidian vault API helpers.
 * Single source of truth for vault writes — all hooks use this module.
 */
const fs = require('fs');
const https = require('https');
const os = require('os');
const path = require('path');

const { VAULT_DIR } = require('./paths');

/**
 * Auto-link known hub terms in content with [[wikilinks]].
 * Only links terms that aren't already inside [[ ]].
 */
// Precompiled regexes — built once at module load, not on every call
const HUB_LINKS = [
    ['TranslatePress', 'translatepress'],
    ['Claude Code', 'claude'],
    ['Elementor', 'knowledge'],
    ['ARKHOS', '10-Projects/ARKHOS/_index'],
    ['Studiokook', '10-Projects/Studiokook/_index'],
    ['n8n', 'workflow-patterns'],
    ['PageSpeed', 'technical-seo'],
    ['Core Web Vitals', 'technical-seo'],
    ['Obsidian', 'obsidian'],
    ['QMD', 'qmd'],
    ['Ghost', 'ghost'],
].map(([term, target]) => ({
    re: new RegExp('(?<!\\[\\[)\\b(' + term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')\\b(?!\\]\\]|[^\\[]*\\]\\])', 'gi'),
    target,
    termLower: term.toLowerCase(),
}));

function autoWikilink(text) {
    for (const { re, target, termLower } of HUB_LINKS) {
        re.lastIndex = 0;
        text = text.replace(re, (match) => {
            return target === termLower ? '[[' + match + ']]' : '[[' + target + '|' + match + ']]';
        });
    }
    return text;
}

function obsidianApiKey() {
    try {
        const cfg = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.claude.json'), 'utf8'));
        return cfg.mcpServers?.obsidian?.env?.OBSIDIAN_API_KEY || '';
    } catch { return ''; }
}

/**
 * Append content to a vault file via Obsidian REST API.
 * Encodes path segments individually to preserve / separators.
 */
function appendViaRestApi(vaultRelPath, content) {
    return new Promise((resolve, reject) => {
        const apiKey = obsidianApiKey();
        if (!apiKey) return reject(new Error('no obsidian key'));

        const body = Buffer.from(content, 'utf8');
        const encodedPath = vaultRelPath.split('/').map(encodeURIComponent).join('/');

        const req = https.request({
            hostname: 'localhost',
            port: 27124,
            path: '/vault/' + encodedPath,
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + apiKey,
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

/**
 * Append content to a vault file with REST API primary + file fallback.
 * Handles dedup by checking existing content for duplicates.
 *
 * @param {string} absolutePath - Full filesystem path to vault file
 * @param {string} content - Content to append
 * @param {object} [opts] - Options
 * @param {boolean} [opts.dedup=true] - Check for duplicates before writing
 * @param {boolean} [opts.createIfMissing=false] - Create file with skeleton if missing
 * @param {string} [opts.fileTitle] - Title for skeleton if creating new file
 */
async function appendToVault(absolutePath, content, opts = {}) {
    if (!content.trim()) return;

    const { dedup = true, createIfMissing = false, fileTitle } = opts;

    // Dedup: check existing content (exact + fuzzy keyword match)
    if (dedup) {
        try {
            const existing = fs.readFileSync(absolutePath, 'utf8');
            const lines = content.trim().split('\n');
            const newLines = lines.filter(line => {
                const core = line.replace(/^- \[\d{4}-\d{2}-\d{2}\] /, '').trim();
                if (!core) return false;
                // Exact match
                if (existing.includes(core)) return false;
                // Fuzzy: extract key terms (3+ chars), check if 60%+ already present
                const terms = core.toLowerCase().match(/[a-zа-яё]{3,}/gi) || [];
                if (terms.length >= 3) {
                    const existLower = existing.toLowerCase();
                    const hits = terms.filter(t => existLower.includes(t)).length;
                    if (hits / terms.length >= 0.6) return false;
                }
                return true;
            });
            if (newLines.length === 0) return;
            content = newLines.join('\n');
        } catch {} // file doesn't exist — proceed
    }

    // Auto-link: wrap known hub names in [[wikilinks]] if not already linked
    content = autoWikilink(content);

    const today = new Date().toISOString().slice(0, 10);
    const entry = '\n<!-- audit:' + today + ' -->\n' + content.trim() + '\n';

    // Try REST API first (keeps Obsidian sync)
    const relPath = absolutePath.replace(/\\/g, '/').replace(VAULT_DIR + '/', '');
    try {
        const status = await appendViaRestApi(relPath, entry);
        if (status >= 200 && status < 300) return;
    } catch {}

    // Fallback: direct file write
    try {
        if (!fs.existsSync(absolutePath) && createIfMissing) {
            const dir = path.dirname(absolutePath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            const title = fileTitle || path.basename(absolutePath, '.md');
            fs.writeFileSync(absolutePath, '---\ntags: [knowledge, auto-routed]\n---\n\n# ' + title + '\n', 'utf8');
        }
        fs.appendFileSync(absolutePath, entry, 'utf8');
    } catch (err) {
        process.stderr.write('[obsidian-api] DOUBLE FAIL for ' + absolutePath + ': ' + err.message + '\n');
    }
}

/**
 * Append to vault file by relative path (for router/pattern-analyzer).
 */
async function appendToVaultByRelPath(vaultRelPath, content, opts = {}) {
    if (!content.trim()) return;

    const { createIfMissing = true, fileTitle } = opts;

    // Try REST API first
    try {
        const status = await appendViaRestApi(vaultRelPath, content);
        if (status >= 200 && status < 300) return;
    } catch {}

    // Fallback: direct file write
    const absPath = path.join(VAULT_DIR, vaultRelPath);
    try {
        if (!fs.existsSync(absPath) && createIfMissing) {
            const dir = path.dirname(absPath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            const title = fileTitle || path.basename(absPath, '.md');
            fs.writeFileSync(absPath, '---\ntags: [knowledge, auto-routed]\n---\n\n# ' + title + '\n', 'utf8');
        }
        fs.appendFileSync(absPath, content, 'utf8');
    } catch (err) {
        process.stderr.write('[obsidian-api] DOUBLE FAIL for ' + vaultRelPath + ': ' + err.message + '\n');
    }
}

/**
 * Call Anthropic API with specified model.
 *
 * @param {string} model - Model ID (e.g. 'claude-haiku-4-5-20251001')
 * @param {string} systemPrompt
 * @param {string} userMessage
 * @param {number} [maxTokens=1500]
 */
function callAnthropic(model, systemPrompt, userMessage, maxTokens = 1500) {
    return new Promise((resolve, reject) => {
        const CLAUDE_DIR = path.join(os.homedir(), '.claude');
        let apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
            try { apiKey = fs.readFileSync(path.join(CLAUDE_DIR, 'credentials/anthropic-api.key'), 'utf8').trim(); } catch {}
        }
        if (!apiKey) return reject(new Error('ANTHROPIC_API_KEY not set'));

        const body = JSON.stringify({
            model,
            max_tokens: maxTokens,
            temperature: 0,
            system: systemPrompt,
            messages: [{ role: 'user', content: userMessage }]
        });

        const timeout = model.includes('sonnet') ? 90000 : 30000;

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
            res.setEncoding('utf8');
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    const text = parsed.content && parsed.content[0] && parsed.content[0].text;
                    if (!text) return reject(new Error('Empty API response: ' + data.slice(0, 200)));
                    resolve(text);
                } catch (e) { reject(new Error('API parse error: ' + e.message)); }
            });
        });

        req.on('error', reject);
        req.setTimeout(timeout, () => { req.destroy(); reject(new Error('API timeout')); });
        req.write(body);
        req.end();
    });
}


function callSonnet(systemPrompt, userMessage, maxTokens) {
    return callAnthropic('claude-sonnet-4-6', systemPrompt, userMessage, maxTokens || 2048);
}

/**
 * Call Google Gemini API. Free tier: gemini-2.5-flash.
 * Same interface as callAnthropic.
 */
function callGemini(systemPrompt, userMessage, maxTokens = 2048, model = 'gemini-2.5-flash') {
    return new Promise((resolve, reject) => {
        const CLAUDE_DIR = path.join(os.homedir(), '.claude');
        let apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            try { apiKey = fs.readFileSync(path.join(CLAUDE_DIR, 'credentials/gemini-api.key'), 'utf8').trim(); } catch {}
        }
        if (!apiKey) return reject(new Error('GEMINI_API_KEY not set'));

        const thinkingBudget = maxTokens >= 2048 ? 1024 : 0;
        const body = JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: 'user', parts: [{ text: userMessage }] }],
            generationConfig: {
                maxOutputTokens: maxTokens,
                temperature: 0,
                thinkingConfig: { thinkingBudget }
            }
        });

        const req = https.request({
            hostname: 'generativelanguage.googleapis.com',
            path: `/v1beta/models/${model}:generateContent?key=${apiKey}`,
            method: 'POST',
            headers: { 'content-type': 'application/json', 'content-length': Buffer.byteLength(body) }
        }, res => {
            res.setEncoding('utf8');
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.error) return reject(new Error(`Gemini API error: ${parsed.error.message || data.slice(0,200)}`));
                    const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (!text) return reject(new Error('Empty Gemini response: ' + data.slice(0, 300)));
                    resolve(text);
                } catch (e) { reject(new Error('Gemini parse error: ' + e.message)); }
            });
        });

        req.on('error', reject);
        req.setTimeout(45000, () => { req.destroy(); reject(new Error('Gemini timeout')); });
        req.write(body);
        req.end();
    });
}

/**
 * Call LLM with primary → fallback chain. Pattern for all scripts: try free tier first,
 * fall back to paid only on explicit failure (quota/rate/network).
 *
 * @param {string} systemPrompt
 * @param {string} userMessage
 * @param {number} [maxTokens=2048]
 * @param {object} [opts]
 * @param {('gemini'|'sonnet')} [opts.primary='gemini']
 * @param {('sonnet'|'gemini'|null)} [opts.fallback='sonnet']
 * @returns {Promise<{text:string, model:string}>}
 */
async function callWithFallback(systemPrompt, userMessage, maxTokens, opts = {}) {
    const primary = opts.primary || 'gemini';
    const fallback = opts.fallback === undefined ? 'sonnet' : opts.fallback;
    const callers = {
        gemini: () => callGemini(systemPrompt, userMessage, maxTokens),
        sonnet: () => callSonnet(systemPrompt, userMessage, maxTokens)
    };
    try {
        const text = await callers[primary]();
        return { text, model: primary };
    } catch (err) {
        if (!fallback) throw err;
        process.stderr.write(`[llm-fallback] ${primary} failed: ${err.message} → trying ${fallback}\n`);
        const text = await callers[fallback]();
        return { text, model: fallback };
    }
}

/**
 * Get Gemini embedding for a text snippet (free tier, 1500 RPD).
 * Returns a 768-dim vector. Used for semantic dedup of memory patterns.
 */
function callGeminiEmbedding(text, model = 'gemini-embedding-001') {
    return new Promise((resolve, reject) => {
        const CLAUDE_DIR = path.join(os.homedir(), '.claude');
        let apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            try { apiKey = fs.readFileSync(path.join(CLAUDE_DIR, 'credentials/gemini-api.key'), 'utf8').trim(); } catch {}
        }
        if (!apiKey) return reject(new Error('GEMINI_API_KEY not set'));

        const body = JSON.stringify({
            content: { parts: [{ text: text.slice(0, 8000) }] }
        });

        const req = https.request({
            hostname: 'generativelanguage.googleapis.com',
            path: `/v1beta/models/${model}:embedContent?key=${apiKey}`,
            method: 'POST',
            headers: { 'content-type': 'application/json', 'content-length': Buffer.byteLength(body) }
        }, res => {
            res.setEncoding('utf8');
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.error) return reject(new Error(`Embedding error: ${parsed.error.message || data.slice(0,200)}`));
                    const vec = parsed.embedding?.values;
                    if (!Array.isArray(vec)) return reject(new Error('Empty embedding response: ' + data.slice(0, 200)));
                    resolve(vec);
                } catch (e) { reject(new Error('Embedding parse error: ' + e.message)); }
            });
        });

        req.on('error', reject);
        req.setTimeout(15000, () => { req.destroy(); reject(new Error('Embedding timeout')); });
        req.write(body);
        req.end();
    });
}

/**
 * Get Telegram bot token from env or credentials file.
 */
function getTelegramToken() {
    const CLAUDE_DIR = path.join(os.homedir(), '.claude');
    let token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
        try { token = fs.readFileSync(path.join(CLAUDE_DIR, 'credentials/telegram-bot.token'), 'utf8').trim(); } catch {}
    }
    return token;
}

/**
 * Send a Telegram message.
 */
function sendTelegram(chatId, message) {
    return new Promise((resolve, reject) => {
        const token = getTelegramToken();
        if (!token) return reject(new Error('No telegram token'));

        const body = JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'Markdown' });

        const req = https.request({
            hostname: 'api.telegram.org',
            path: '/bot' + token + '/sendMessage',
            method: 'POST',
            headers: { 'content-type': 'application/json', 'content-length': Buffer.byteLength(body) }
        }, res => {
            res.setEncoding('utf8');
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(res.statusCode));
        });
        req.on('error', reject);
        req.setTimeout(10000, () => { req.destroy(); reject(new Error('Telegram timeout')); });
        req.write(body);
        req.end();
    });
}

module.exports = {
    obsidianApiKey,
    appendViaRestApi,
    appendToVault,
    appendToVaultByRelPath,
    callAnthropic,
    callSonnet,
    callGemini,
    callGeminiEmbedding,
    callWithFallback,
    getTelegramToken,
    sendTelegram
};
