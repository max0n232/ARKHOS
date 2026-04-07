#!/usr/bin/env node
/**
 * Usage Tracker (stop hook)
 *
 * After each Claude response, reads AUTOSEARCH section from MEMORY.md,
 * extracts matched vault file paths, increments usage counts in
 * patterns/usage-tracker.json. This provides the feedback signal
 * for knowledge decay/promotion in the Proactive Learning Loop.
 */

const fs = require('fs');
const path = require('path');

const { CLAUDE_DIR } = require('../shared/paths');
const MEMORY_FILE = path.join(CLAUDE_DIR, 'projects/C--Users-sorte--claude/memory/MEMORY.md');
const TRACKER = path.join(CLAUDE_DIR, 'patterns/usage-tracker.json');

try {
    const mem = fs.readFileSync(MEMORY_FILE, 'utf8');

    // Extract AUTOSEARCH section
    const match = mem.match(/<!--AUTOSEARCH-START-->([\s\S]*?)<!--AUTOSEARCH-END-->/);
    if (!match) process.exit(0);

    const section = match[1];

    // Extract vault file paths from qmd:// URIs
    const paths = [];
    const re = /qmd:\/\/vault\/([^\s:]+)/g;
    let m;
    while ((m = re.exec(section)) !== null) {
        paths.push(m[1]);
    }

    if (paths.length === 0) process.exit(0);

    // Read existing tracker
    let tracker = {};
    try { tracker = JSON.parse(fs.readFileSync(TRACKER, 'utf8')); } catch {}

    // Increment counts
    const today = new Date().toISOString().split('T')[0];
    for (const p of paths) {
        if (!tracker[p]) tracker[p] = { count: 0, last: '' };
        tracker[p].count++;
        tracker[p].last = today;
    }

    fs.writeFileSync(TRACKER, JSON.stringify(tracker, null, 2), 'utf8');
} catch {
    // Silent fail — usage tracking is non-critical
}
