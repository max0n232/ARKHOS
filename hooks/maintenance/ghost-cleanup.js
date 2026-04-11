#!/usr/bin/env node
/**
 * Ghost Session Cleanup — Weekly Maintenance
 *
 * Archives completed Ghost sessions older than RETENTION_DAYS.
 * Throttled: runs at most once per RUN_INTERVAL_DAYS (checked via last-run stamp).
 * Called from SessionStart hook — skips silently if not due yet.
 *
 * Usage: node ghost-cleanup.js [--dry-run] [--days=N] [--force]
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const RETENTION_DAYS = 30;
const RUN_INTERVAL_DAYS = 7;

const CLAUDE_DIR = path.join(process.env.USERPROFILE || process.env.HOME, '.claude');
const COMPLETED_DIR = path.join(CLAUDE_DIR, '.ai-sessions', 'completed');
const ARCHIVE_DIR = path.join(CLAUDE_DIR, '.ai-sessions', 'archive');
const STAMP_FILE = path.join(CLAUDE_DIR, '.ai-sessions', '.last-cleanup');
const LOG_FILE = path.join(CLAUDE_DIR, 'logs', 'ghost-cleanup.log');

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const FORCE = args.includes('--force');
const customDays = args.find(a => a.startsWith('--days='));
const retentionDays = customDays ? parseInt(customDays.split('=')[1]) : RETENTION_DAYS;

function log(msg) {
    const ts = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const line = `[${ts}] ${msg}`;
    console.log(line);
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
    fs.writeFileSync(STAMP_FILE, new Date().toISOString());
}

function main() {
    if (!isDue()) {
        // Silent skip — not due yet
        return;
    }

    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    log(`Ghost cleanup — archiving sessions older than ${retentionDays}d (cutoff: ${cutoffDate.toISOString().slice(0, 10)})`);
    if (DRY_RUN) log('DRY RUN — no files will be moved');

    if (!fs.existsSync(COMPLETED_DIR)) {
        log('No completed/ dir — nothing to do');
        if (!DRY_RUN) updateStamp();
        return;
    }

    fs.mkdirSync(ARCHIVE_DIR, { recursive: true });

    const files = fs.readdirSync(COMPLETED_DIR).filter(f => f.endsWith('.md'));
    const toArchive = [];

    for (const file of files) {
        const filePath = path.join(COMPLETED_DIR, file);
        const stat = fs.statSync(filePath);
        if (stat.mtimeMs < cutoffDate.getTime()) {
            toArchive.push({ file, filePath, modified: stat.mtime });
        }
    }

    if (toArchive.length === 0) {
        log(`Nothing to archive (${files.length} sessions all within ${retentionDays}d window)`);
        if (!DRY_RUN) updateStamp();
        return;
    }

    log(`Found ${toArchive.length}/${files.length} session(s) to archive`);

    let archived = 0;
    for (const { file, filePath, modified } of toArchive) {
        const destPath = path.join(ARCHIVE_DIR, file);
        if (!DRY_RUN) {
            try {
                fs.copyFileSync(filePath, destPath);
                fs.unlinkSync(filePath);
                archived++;
                log(`  Archived: ${file} (${modified.toISOString().slice(0, 10)})`);
            } catch (e) {
                log(`  ERROR: ${file} — ${e.message}`);
            }
        } else {
            log(`  Would archive: ${file} (${modified.toISOString().slice(0, 10)})`);
            archived++;
        }
    }

    if (!DRY_RUN) {
        updateStamp();
        if (archived > 0) {
            // Fire-and-forget: avoid WAL contention with QMD MCP server at startup
            const { spawn } = require("child_process");
            const child = spawn("bash", ["-c", "sleep 5 && qmd update && qmd embed"], {
                stdio: "ignore",
                detached: false,
                windowsHide: true
            });
            child.unref();
            log("QMD reindex scheduled (background, 5s delay)");
        }
    }

    log(`Done — ${archived} session(s) ${DRY_RUN ? 'would be' : ''} archived`);



    // --- Stale checkpoint flags cleanup ---
    try {
        const hooksDir = path.join(CLAUDE_DIR, 'hooks');
        const flagAge = 7 * 24 * 60 * 60 * 1000;
        const flags = fs.readdirSync(hooksDir).filter(f => f.startsWith('.checkpoint-') && !f.endsWith('.md'));
        let cleaned = 0;
        for (const flag of flags) {
            const fp = path.join(hooksDir, flag);
            if (Date.now() - fs.statSync(fp).mtimeMs > flagAge) {
                fs.unlinkSync(fp);
                cleaned++;
            }
        }
        if (cleaned > 0) log('Cleaned ' + cleaned + ' stale checkpoint flag(s)');
    } catch {}
    // --- Age-based cleanup: remove sessions >90 days with no insights ---
    // Before purging, write a digest line (first user prompt + date) to the
    // vault digest file so basic session trails survive in QMD search.
    if (!DRY_RUN && fs.existsSync(ARCHIVE_DIR)) {
        const ageCutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        const archiveFiles = fs.readdirSync(ARCHIVE_DIR).filter(f => f.endsWith('.md'));
        const VAULT_DIR = path.join(process.env.USERPROFILE || process.env.HOME, 'ObsidianVault');
        const DIGEST_FILE = path.join(VAULT_DIR, '10-Projects/ARKHOS/ghost-archive-digest.md');
        const digestLines = [];
        let purged = 0;
        for (const file of archiveFiles) {
            const filePath = path.join(ARCHIVE_DIR, file);
            try {
                const stat = fs.statSync(filePath);
                if (stat.mtimeMs >= ageCutoff.getTime()) continue;
                const content = fs.readFileSync(filePath, 'utf8');
                const hasInsights = /## Decisions|## Mistakes|## Knowledge|## Strategy/i.test(content)
                    && content.length > 500;
                if (!hasInsights) {
                    // Extract first user prompt as digest signal
                    const firstPrompt = (content.match(/^> \[[^\]]+\][^\n]*\n([^\n]+)/m) || [])[1]
                        || content.split('\n').find(l => l.trim() && !l.startsWith('#') && !l.startsWith('---'))
                        || '';
                    const date = stat.mtime.toISOString().slice(0, 10);
                    const snippet = firstPrompt.replace(/\s+/g, ' ').slice(0, 160);
                    if (snippet) digestLines.push(`- [${date}] ${file.replace('.md', '')}: ${snippet}`);
                    fs.unlinkSync(filePath);
                    purged++;
                }
            } catch {}
        }
        if (digestLines.length > 0) {
            try {
                fs.mkdirSync(path.dirname(DIGEST_FILE), { recursive: true });
                const header = fs.existsSync(DIGEST_FILE) ? '' : '# Ghost Archive Digest\n\nSessions purged at 90d with no formal insights — first-prompt trail only.\n\n';
                fs.appendFileSync(DIGEST_FILE, header + digestLines.join('\n') + '\n', 'utf8');
                log(`Digest: wrote ${digestLines.length} trail(s) to ${path.basename(DIGEST_FILE)}`);
            } catch (e) {
                log(`Digest write failed: ${e.message}`);
            }
        }
        if (purged > 0) log(`Purged ${purged} empty archived session(s) older than 90d`);
    }
}

main();
