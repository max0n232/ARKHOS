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
            const result = spawnSync('bash', ['-c', 'qmd update && qmd embed'], {
                stdio: 'ignore',
                timeout: 120000
            });
            if (result.status === 0) {
                log('QMD reindexed');
            } else {
                log('QMD reindex failed (run: qmd update && qmd embed)');
            }
        }
    }

    log(`Done — ${archived} session(s) ${DRY_RUN ? 'would be' : ''} archived`);
}

main();
