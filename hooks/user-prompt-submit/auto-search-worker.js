#!/usr/bin/env node
/**
 * Auto Search Worker (background process)
 *
 * Spawned detached by auto-search.js. Runs qmd vsearch (vector, cross-lingual)
 * and writes results to MEMORY.md AUTOSEARCH section.
 * Query passed as process.argv[2].
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const { CLAUDE_DIR, QMD } = require('../shared/paths');
const MEMORY_FILE = path.join(CLAUDE_DIR, 'projects/C--Users-sorte--claude/memory/MEMORY.md');
const MARKER_S = '<!--AUTOSEARCH-START-->';
const MARKER_E = '<!--AUTOSEARCH-END-->';

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
    let mem = '';
    try { mem = fs.readFileSync(MEMORY_FILE, 'utf8'); } catch {}

    // Extract existing AUTOSEARCH block and its entries
    const blockMatch = mem.match(new RegExp(`${MARKER_S}([\\s\\S]*?)${MARKER_E}\\n?`));
    const existingEntries = [];
    if (blockMatch) {
        const entryRe = new RegExp(`${ENTRY_S}[\\s\\S]*?${ENTRY_E}`, 'g');
        let m;
        while ((m = entryRe.exec(blockMatch[1])) !== null) {
            existingEntries.push(m[0]);
        }
    }

    // Newest first, cap at MAX_ENTRIES (FIFO rotation)
    const allEntries = [entry.join('\n'), ...existingEntries].slice(0, MAX_ENTRIES);
    const block = [MARKER_S, ...allEntries, MARKER_E, ''].join('\n');

    const cleaned = mem.replace(new RegExp(`${MARKER_S}[\\s\\S]*?${MARKER_E}\\n?`), '');
    fs.writeFileSync(MEMORY_FILE, block + cleaned, 'utf8');
} catch {}
