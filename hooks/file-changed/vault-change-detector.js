#!/usr/bin/env node
/**
 * FileChanged Hook: detect vault file modifications
 *
 * When files in ObsidianVault are changed during session,
 * outputs a reminder to check vault context.
 * Only triggers for vault paths, not general code edits.
 */

const fs = require('fs');

function readStdinSync() {
    const chunks = [];
    const buf = Buffer.alloc(1024);
    try {
        let bytesRead;
        while ((bytesRead = fs.readSync(0, buf, 0, 1024)) > 0) {
            chunks.push(buf.slice(0, bytesRead).toString());
        }
    } catch (e) {}
    return chunks.join('');
}

try {
    const raw = readStdinSync();
    const input = raw ? JSON.parse(raw) : {};
    const filePath = input.file_path || '';

    const isVault = filePath.includes('ObsidianVault');
    if (isVault) {
        const short = filePath.replace(/.*ObsidianVault[\\/]/, '');
        process.stdout.write(`[vault-change] Modified: ${short} — verify vault context is current\n`);
    }
} catch (e) {
    // silent — don't block on errors
}
