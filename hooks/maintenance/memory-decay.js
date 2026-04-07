#!/usr/bin/env node
/**
 * Memory Decay — Linear Ebbinghaus-inspired aging for vault knowledge files.
 *
 * Scans vault destination files from routing-map, applies linear decay
 * to entries based on their audit date. Entries that fall below the
 * archive threshold get marked for review.
 *
 * Decay formula: relevance = max(FLOOR, 1.0 - days * RATE)
 * Tiers: active (0-7d) → warm (8-21d) → cold (22-60d) → archive (60d+)
 *
 * Touch: reading/referencing an entry promotes it one tier (graduated recall).
 * Nothing is ever deleted — decay only reduces visibility.
 *
 * Throttled: runs at most once per RUN_INTERVAL_DAYS.
 * Called from SessionStart hook (ghost-cleanup.js chain) or standalone.
 *
 * Usage: node memory-decay.js [--dry-run] [--force] [--stats]
 */

const fs = require('fs');
const path = require('path');

const { CLAUDE_DIR, VAULT_DIR } = require('../shared/paths');

const RATE = 0.015;
const FLOOR = 0.1;
const RUN_INTERVAL_DAYS = 3;

const TIERS = {
    active:  { min: 0,  max: 7,  label: 'active' },
    warm:    { min: 8,  max: 21, label: 'warm' },
    cold:    { min: 22, max: 60, label: 'cold' },
    archive: { min: 61, max: Infinity, label: 'archive' }
};

const STAMP_FILE = path.join(CLAUDE_DIR, 'hooks', 'maintenance', '.last-decay');
const LOG_FILE = path.join(CLAUDE_DIR, 'logs', 'memory-decay.log');

// Vault destinations from routing-map (rows 1-11, 13-17 — files that accumulate entries)
const DESTINATIONS = [
    '10-Projects/Studiokook/20-Areas/WordPress/windows-gotchas.md',
    '10-Projects/Studiokook/20-Areas/WordPress/translatepress.md',
    '30-Resources/API-Reference/studiokook-examples.md',
    '10-Projects/Studiokook/knowledge.md',
    '10-Projects/Studiokook/infrastructure.md',
    '10-Projects/Studiokook/seo-strategy.md',
    '30-Resources/Learning/technical-seo.md',
    '10-Projects/Studiokook/20-Areas/n8n/workflow-patterns.md',
    '10-Projects/Studiokook/20-Areas/n8n/mcp-tools.md',
    '10-Projects/Studiokook/20-Areas/WordPress/translation-verify.md',
    '10-Projects/Studiokook/20-Areas/WordPress/problem-solving.md',
    '10-Projects/ARKHOS/knowledge.md',
    '30-Resources/Learning/ai-ml-patterns.md',
    '10-Projects/Studiokook/20-Areas/Infrastructure/troubleshooting-current.md',
    '10-Projects/Studiokook/20-Areas/Infrastructure/global-patterns.md'
];

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const FORCE = args.includes('--force');
const STATS = args.includes('--stats');

function log(msg) {
    const ts = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const line = `[${ts}] ${msg}`;
    if (STATS || DRY_RUN) console.log(line);
    try {
        fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
        fs.appendFileSync(LOG_FILE, line + '\n');
    } catch (_) {}
}

function isDue() {
    if (FORCE) return true;
    try {
        if (!fs.existsSync(STAMP_FILE)) return true;
        const lastRun = new Date(fs.readFileSync(STAMP_FILE, 'utf-8').trim());
        const daysSince = (Date.now() - lastRun.getTime()) / (24 * 60 * 60 * 1000);
        return daysSince >= RUN_INTERVAL_DAYS;
    } catch (_) {
        return true;
    }
}

function updateStamp() {
    try { fs.writeFileSync(STAMP_FILE, new Date().toISOString()); } catch {}
}

function getTier(days) {
    if (days <= TIERS.active.max) return 'active';
    if (days <= TIERS.warm.max) return 'warm';
    if (days <= TIERS.cold.max) return 'cold';
    return 'archive';
}

function calcRelevance(days) {
    return Math.max(FLOOR, +(1.0 - days * RATE).toFixed(3));
}

/**
 * Extract a fallback date from YAML frontmatter (updated or created field).
 */
function extractFrontmatterDate(content) {
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!fmMatch) return null;
    const fm = fmMatch[1];
    const updated = fm.match(/updated:\s*(\d{4}-\d{2}-\d{2})/);
    if (updated) return updated[1];
    const created = fm.match(/(?:date|created):\s*(\d{4}-\d{2}-\d{2})/);
    return created ? created[1] : null;
}

/**
 * Parse entries from a vault file. Entries are lines starting with "- "
 * possibly prefixed with audit date markers <!-- audit:YYYY-MM-DD -->
 * or inline dates [YYYY-MM-DD].
 *
 * Also recognizes section headers like "## Distilled YYYY-MM-DD" as date context.
 */
function parseEntries(content) {
    const lines = content.split('\n');
    const entries = [];
    let currentAuditDate = null;
    const frontmatterDate = extractFrontmatterDate(content);

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Track audit date markers
        const auditMatch = line.match(/<!--\s*audit:(\d{4}-\d{2}-\d{2})\s*-->/);
        if (auditMatch) {
            currentAuditDate = auditMatch[1];
            continue;
        }

        // Track section headers with dates (e.g. "## Distilled 2026-04-05")
        const sectionDate = line.match(/^##\s+.*(\d{4}-\d{2}-\d{2})/);
        if (sectionDate) {
            currentAuditDate = sectionDate[1];
            continue;
        }

        // Parse entry lines (- or - [PATTERN] or - [YYYY-MM-DD])
        if (line.startsWith('- ')) {
            // Try to extract inline date [YYYY-MM-DD] — strict: year 202X-203X, not [PATTERN] etc.
            const inlineDate = line.match(/\[(20[23]\d-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01]))\]/);
            // Try to extract decay marker <!-- decay:YYYY-MM-DD tier:X rel:Y -->
            const decayMatch = line.match(/<!--\s*decay:(\d{4}-\d{2}-\d{2})\s+tier:(\w+)\s+rel:([\d.]+)\s*-->/);

            const date = inlineDate ? inlineDate[1]
                       : decayMatch ? decayMatch[1]
                       : currentAuditDate
                       || frontmatterDate
                       || null;

            entries.push({
                lineIndex: i,
                text: line,
                date,
                existingDecay: decayMatch ? {
                    date: decayMatch[1],
                    tier: decayMatch[2],
                    rel: parseFloat(decayMatch[3])
                } : null
            });
        }
    }

    return { lines, entries };
}

/**
 * Process a single vault file: calculate decay, update tier markers.
 * Returns stats about the file.
 */
function processFile(filePath) {
    if (!fs.existsSync(filePath)) return null;

    const content = fs.readFileSync(filePath, 'utf8');
    const { lines, entries } = parseEntries(content);

    if (entries.length === 0) return null;

    const today = new Date();
    const stats = { total: 0, active: 0, warm: 0, cold: 0, archive: 0, noDate: 0 };
    let modified = false;

    for (const entry of entries) {
        stats.total++;

        if (!entry.date) {
            stats.noDate++;
            continue;
        }

        const entryDate = new Date(entry.date);
        const days = Math.floor((today - entryDate) / (24 * 60 * 60 * 1000));
        const tier = getTier(days);
        const rel = calcRelevance(days);
        stats[tier]++;

        // Build/update decay marker
        const decayMarker = `<!-- decay:${entry.date} tier:${tier} rel:${rel} -->`;

        // Strip existing decay marker from line
        let cleanLine = entry.text.replace(/\s*<!--\s*decay:\S+\s+tier:\w+\s+rel:[\d.]+\s*-->/, '');

        // Only add marker for cold/archive entries (don't clutter active/warm)
        let newLine;
        if (tier === 'cold' || tier === 'archive') {
            newLine = cleanLine + ' ' + decayMarker;
        } else {
            newLine = cleanLine;
        }

        if (lines[entry.lineIndex] !== newLine) {
            lines[entry.lineIndex] = newLine;
            modified = true;
        }
    }

    if (modified && !DRY_RUN) {
        fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
    }

    return stats;
}

function main() {
    if (!isDue()) return;

    log('Memory decay scan starting...');

    const totalStats = { files: 0, total: 0, active: 0, warm: 0, cold: 0, archive: 0, noDate: 0 };

    for (const relPath of DESTINATIONS) {
        const absPath = path.join(VAULT_DIR, relPath);
        const stats = processFile(absPath);
        if (!stats) continue;

        totalStats.files++;
        for (const key of ['total', 'active', 'warm', 'cold', 'archive', 'noDate']) {
            totalStats[key] += stats[key];
        }

        if (STATS) {
            const parts = relPath.split('/');
            const name = parts.length > 2
                ? parts[parts.length - 2] + '/' + path.basename(relPath, '.md')
                : path.basename(relPath, '.md');
            log(`  ${name}: ${stats.total} entries (A:${stats.active} W:${stats.warm} C:${stats.cold} X:${stats.archive}${stats.noDate ? ' ?:' + stats.noDate : ''})`);
        }
    }

    log(`Decay complete: ${totalStats.files} files, ${totalStats.total} entries`);
    log(`  Active:${totalStats.active} Warm:${totalStats.warm} Cold:${totalStats.cold} Archive:${totalStats.archive}${totalStats.noDate ? ' NoDate:' + totalStats.noDate : ''}`);

    if (totalStats.archive > 20) {
        log(`  WARNING: ${totalStats.archive} entries in archive tier — consider running distillation`);
    }



    // --- Vault hygiene: detect and remove empty orphan files ---
    try {
        const rootFiles = fs.readdirSync(VAULT_DIR)
            .filter(f => f.endsWith('.md') && f !== 'MOC-Главный.md' && f !== 'CLAUDE.md');
        const orphans = [];
        for (const file of rootFiles) {
            const fp = path.join(VAULT_DIR, file);
            try {
                const stat = fs.statSync(fp);
                if (stat.size === 0) {
                    orphans.push({ file, reason: 'empty' });
                    if (!DRY_RUN) fs.unlinkSync(fp);
                } else {
                    // Check if duplicate exists in PARA structure
                    const name = file;
                    const paraHit = ['10-Projects', '30-Resources', '40-Archive'].some(dir => {
                        try {
                            const found = require('child_process').execSync(
                                'find "' + path.join(VAULT_DIR, dir) + '" -name "' + name.replace(/"/g, '') + '" -type f 2>/dev/null',
                                { encoding: 'utf8', timeout: 3000 }
                            ).trim();
                            return found.length > 0;
                        } catch { return false; }
                    });
                    if (paraHit) orphans.push({ file, reason: 'duplicate (exists in PARA)' });
                }
            } catch {}
        }
        if (orphans.length > 0) {
            const deleted = orphans.filter(o => o.reason === 'empty').length;
            const dupes = orphans.filter(o => o.reason !== 'empty');
            if (deleted > 0) log('Vault hygiene: deleted ' + deleted + ' empty root files');
            if (dupes.length > 0) {
                log('Vault orphans (need manual review): ' + dupes.map(o => o.file).join(', '));
            }
        }
    } catch (e) {
        log('Vault hygiene error: ' + e.message);
    }
    if (!DRY_RUN) updateStamp();
}

main();
