#!/usr/bin/env node
/**
 * Claude Clean - Interactive Cleanup Command
 *
 * Usage: node cleanup.js [--expired|--temp|--lru|--all] [--dry-run] [--force]
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const CLAUDE_DIR = path.join(process.env.HOME || process.env.USERPROFILE, '.claude');
const c = { r: '\x1b[0m', b: '\x1b[1m', g: '\x1b[32m', y: '\x1b[33m', c: '\x1b[36m', d: '\x1b[2m' };

const formatBytes = (b) => {
    const u = ['B', 'KB', 'MB', 'GB'];
    let s = b, i = 0;
    while (s >= 1024 && i < 3) { s /= 1024; i++; }
    return `${s.toFixed(2)} ${u[i]}`;
};

const ask = (q) => new Promise(res => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(q, a => { rl.close(); res(a.toLowerCase().startsWith('y')); });
});

async function main() {
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run') || args.includes('-n');
    const force = args.includes('--force') || args.includes('-f');
    let mode = 'interactive';
    if (args.includes('--expired')) mode = 'expired';
    if (args.includes('--temp')) mode = 'temp';
    if (args.includes('--lru')) mode = 'lru';
    if (args.includes('--all')) mode = 'all';
    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
${c.b}Claude Clean${c.r} - File Lifecycle Management

${c.c}Usage:${c.r} node cleanup.js [options]

${c.c}Modes:${c.r}
  --expired    Clean expired files (TTL)
  --temp       Clean temporary files
  --lru        Clean least recently used
  --all        Full cleanup

${c.c}Options:${c.r}
  -n, --dry-run   Preview only
  -f, --force     Skip confirmations
  -h, --help      Show help
`);
        return;
    }

    let manager;
    try {
        const { FileLifecycleManager } = require(path.join(CLAUDE_DIR, 'lifecycle', 'lifecycle-manager.js'));
        manager = new FileLifecycleManager();
    } catch (e) {
        console.log(`${c.y}Run scan first: node lifecycle-manager.js scan${c.r}`);
        return;
    }

    if (!manager.metadata.lastScan) {
        console.log(`${c.c}Scanning...${c.r}`);
        manager.fullScan();
    }

    // Status
    console.log(`\n${c.b}=== Claude Directory ===${c.r}`);
    console.log(`Files: ${manager.metadata.stats.total_files}`);
    console.log(`Size: ${formatBytes(manager.metadata.stats.total_size_bytes)}`);
    console.log(`Last scan: ${manager.metadata.lastScan}\n`);

    for (const [cat, s] of Object.entries(manager.metadata.stats.by_category || {})) {
        console.log(`  ${cat}: ${s.count} files (${formatBytes(s.size)})`);
    }

    const expired = manager.getExpiredFiles();
    const temp = Object.entries(manager.metadata.files)
        .filter(([_, m]) => m.category === 'temp' && m.deletable)
        .map(([p, m]) => ({ path: p, ...m }));

    console.log(`\n${c.y}Expired: ${expired.length} (${formatBytes(expired.reduce((s, f) => s + f.size_bytes, 0))})${c.r}`);
    console.log(`${c.y}Temp: ${temp.length} (${formatBytes(temp.reduce((s, f) => s + f.size_bytes, 0))})${c.r}\n`);

    // Interactive
    if (mode === 'interactive' && !force) {
        console.log(`${c.c}What to clean?${c.r}`);
        console.log('1. Expired files');
        console.log('2. Temp files');
        console.log('3. Both');
        console.log('4. Full cleanup (+ LRU)');
        console.log('5. Cancel\n');

        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        const choice = await new Promise(res => rl.question('Choice [1-5]: ', a => { rl.close(); res(a); }));

        switch (choice) {
            case '1': mode = 'expired'; break;
            case '2': mode = 'temp'; break;
            case '3': mode = 'both'; break;
            case '4': mode = 'all'; break;
            default: console.log('Cancelled.'); return;
        }
    }

    const results = { expired: null, temp: null, lru: null };
    let totalDeleted = 0, totalFreed = 0;

    const doCleanup = async (files, label) => {
        if (files.length === 0) {
            console.log(`${c.d}No ${label} files${c.r}`);
            return { deleted: [], freed_bytes: 0 };
        }
        if (!force && !dryRun) {
            const ok = await ask(`Delete ${files.length} ${label} files (${formatBytes(files.reduce((s, f) => s + f.size_bytes, 0))})? [y/N]: `);
            if (!ok) { console.log(`${c.y}Skipped ${label}${c.r}`); return { deleted: [], freed_bytes: 0 }; }
        }
        const r = manager.deleteFiles(files, { dryRun, skipConfirmation: true });
        if (r.deleted.length > 0) {
            console.log(`${c.g}${dryRun ? 'Would delete' : 'Deleted'} ${r.deleted.length} ${label} (${formatBytes(r.freed_bytes)})${c.r}`);
        }
        return r;
    };

    if (['expired', 'both', 'all'].includes(mode)) {
        results.expired = await doCleanup(expired, 'expired');
        totalDeleted += results.expired.deleted.length;
        totalFreed += results.expired.freed_bytes;
    }
    if (['temp', 'both', 'all'].includes(mode)) {
        results.temp = await doCleanup(temp, 'temp');
        totalDeleted += results.temp.deleted.length;
        totalFreed += results.temp.freed_bytes;
    }
    if (mode === 'all') {
        const lru = manager.getLRUCandidates(50);
        results.lru = await doCleanup(lru, 'LRU');
        totalDeleted += results.lru.deleted.length;
        totalFreed += results.lru.freed_bytes;
    }

    console.log(`\n${c.b}=== Summary ===${c.r}`);
    console.log(`${totalDeleted} files, ${dryRun ? 'would free' : 'freed'} ${formatBytes(totalFreed)}`);
    if (dryRun) console.log(`${c.y}(Dry run - nothing deleted)${c.r}`);
}

main().catch(e => console.error(e.message));
