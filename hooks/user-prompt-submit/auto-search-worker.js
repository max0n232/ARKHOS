#!/usr/bin/env node
/**
 * Auto Search Worker (background process)
 *
 * Spawned detached by auto-search.js. Runs qmd vsearch (vector, cross-lingual)
 * and writes results to ~/.claude/hooks/.autosearch-cache.md (FIFO, 3 entries).
 * compact-report-injector.js reads this file and injects to stdout.
 * Query passed as process.argv[2].
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const { CLAUDE_DIR, QMD } = require('../shared/paths');
const CACHE_FILE = path.join(CLAUDE_DIR, 'hooks', '.autosearch-cache.md');

const query = process.argv[2] || '';
if (!query) process.exit(0);
const deepMode = process.argv[3] === 'deep';

function qmdSearch(collection) {
    const n = deepMode ? 5 : 3;
    const cmd = deepMode ? 'search' : 'vsearch';
    const r = spawnSync(
        'bash',
        ['-c', `"${QMD}" ${cmd} "${query.replace(/"/g, ' ')}" -c ${collection} -n ${n}`],
        { encoding: 'utf8', timeout: deepMode ? 5000 : 15000, stdio: 'pipe', windowsHide: true }
    );
    const out = (r.stdout || '').trim();
    if (!out || out === 'No results found.' || out.startsWith('Error')) return '';
    return out.replace(/^Context:.*$/gm, '').replace(/\n{3,}/g, '\n\n').trim();
}

const vault = qmdSearch('vault');
const ghost = qmdSearch('ghost-.claude');

if (!vault && !ghost) process.exit(0);

const ghostLimit = deepMode ? 3000 : 1500;
const vaultLimit = deepMode ? 1500 : 800;
const ts = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
const header = deepMode
    ? `## Recall [${ts}] "${query.slice(0, 60)}"`
    : `## Search [${ts}] "${query.slice(0, 60)}"`;

const ENTRY_S = '<!--AS-ENTRY-START-->';
const ENTRY_E = '<!--AS-ENTRY-END-->';
const MAX_ENTRIES = 3;

const entry = [ENTRY_S, header];
if (ghost) { entry.push('', '**Past sessions:**', ghost.slice(0, ghostLimit)); }
if (vault) { entry.push('', '**Vault:**', vault.slice(0, vaultLimit)); }
entry.push(ENTRY_E);

try {
    let cache = '';
    try { cache = fs.readFileSync(CACHE_FILE, 'utf8'); } catch {}

    const existingEntries = [];
    const entryRe = new RegExp(`${ENTRY_S}[\\s\\S]*?${ENTRY_E}`, 'g');
    let m;
    while ((m = entryRe.exec(cache)) !== null) {
        existingEntries.push(m[0]);
    }

    // Newest first, cap at MAX_ENTRIES (FIFO rotation)
    const allEntries = [entry.join('\n'), ...existingEntries].slice(0, MAX_ENTRIES);
    fs.writeFileSync(CACHE_FILE, allEntries.join('\n') + '\n', 'utf8');
} catch {}
