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
const os = require('os');
const { spawnSync } = require('child_process');

const CLAUDE_DIR = path.join(os.homedir(), '.claude');
const MEMORY_FILE = path.join(CLAUDE_DIR, 'projects/C--Users-sorte--claude/memory/MEMORY.md');
const QMD = '/c/Users/sorte/.bun/install/global/node_modules/@tobilu/qmd/bin/qmd';
const MARKER_S = '<!--AUTOSEARCH-START-->';
const MARKER_E = '<!--AUTOSEARCH-END-->';

const query = process.argv[2] || '';
if (!query) process.exit(0);

function vsearch(collection) {
    const r = spawnSync(
        'bash',
        ['-c', `"${QMD}" vsearch "${query.replace(/"/g, ' ')}" -c ${collection} -n 3`],
        { encoding: 'utf8', timeout: 15000, stdio: 'pipe' }
    );
    const out = (r.stdout || '').trim();
    if (!out || out === 'No results found.' || out.startsWith('Error')) return '';
    return out.replace(/^Context:.*$/gm, '').replace(/\n{3,}/g, '\n\n').trim();
}

const vault = vsearch('vault');
const ghost = vsearch('ghost-.claude');

if (!vault && !ghost) process.exit(0);

const lines = [MARKER_S, '## Relevant context (from previous message search)'];
if (ghost) { lines.push('', '**Past sessions:**', ghost.slice(0, 1500)); }
if (vault) { lines.push('', '**Vault:**', vault.slice(0, 800)); }
lines.push(MARKER_E, '');

try {
    let mem = '';
    try { mem = fs.readFileSync(MEMORY_FILE, 'utf8'); } catch {}
    const cleaned = mem.replace(new RegExp(`${MARKER_S}[\\s\\S]*?${MARKER_E}\\n?`), '');
    fs.writeFileSync(MEMORY_FILE, lines.join('\n') + cleaned, 'utf8');
} catch {}
