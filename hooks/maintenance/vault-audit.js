#!/usr/bin/env node
/**
 * Vault Audit — Proactive graph health check at SessionStart.
 *
 * Runs at most once per INTERVAL_DAYS. Detects:
 * - New files since last run (incoming file alerting)
 * - Broken wikilinks
 * - Orphan files (0 incoming links)
 * - Cross-project graph health
 *
 * Outputs warnings to stdout (injected into session context).
 * Throttled: skips if last run < INTERVAL_DAYS ago.
 */

const fs = require('fs');
const path = require('path');
const { CLAUDE_DIR, VAULT_DIR } = require('../shared/paths');

const INTERVAL_DAYS = 1;
const STATE_FILE = path.join(CLAUDE_DIR, 'hooks', 'maintenance', '.vault-audit-state.json');
const SKIP = new Set(['.obsidian', '.smart-env', '.trash', 'node_modules', '.git']);
const SKIP_AUDIT = new Set(['40-Archive', '90-System']); // skip for link analysis, not for file counting

function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); }
  catch { return { lastRun: 0, knownFiles: {} }; }
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function walkVault() {
  const files = new Map();
  function walk(dir, depth) {
    if (depth > 6) return;
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (e.name.startsWith('.')) continue;
      const full = path.join(dir, e.name);
      const rel = path.relative(VAULT_DIR, full).replace(/\\/g, '/');
      if (e.isDirectory()) {
        if (SKIP.has(e.name)) continue;
        walk(full, depth + 1);
      } else if (e.name.endsWith('.md')) {
        try {
          const stats = fs.statSync(full);
          const topDir = rel.split('/')[0];
          const skipForLinks = SKIP_AUDIT.has(topDir);
          let links = [];
          if (!skipForLinks) {
            const content = fs.readFileSync(full, 'utf8');
            const re = /\[\[([^\]|]+?)(?:\|[^\]]*?)?\]\]/g;
            let m;
            while ((m = re.exec(content)) !== null) links.push(m[1].replace(/\\/g, '/'));
          }
          files.set(rel, { mtime: stats.mtimeMs, links, skipForLinks });
        } catch {}
      }
    }
  }
  walk(VAULT_DIR, 0);
  return files;
}

function getProjectFromPath(p) {
  const m = p.match(/^10-Projects\/([^/]+)\//i);
  return m ? m[1] : null;
}

function analyzeGraphHealth(files) {
  const projectLinks = {};
  const projectFiles = {};
  for (const [rel, data] of files) {
    if (data.skipForLinks) continue;
    const project = getProjectFromPath(rel);
    if (!project) continue;
    if (!projectLinks[project]) projectLinks[project] = new Set();
    if (!projectFiles[project]) projectFiles[project] = 0;
    projectFiles[project]++;
    for (const link of data.links) {
      // Resolve relative links
      let resolved = link;
      if (!/^10-Projects\//i.test(link)) {
        const sourceDir = path.dirname(rel);
        resolved = path.posix.normalize(sourceDir + '/' + link);
      }
      const target = getProjectFromPath(resolved);
      if (target && target !== project) projectLinks[project].add(target);
    }
  }

  const projects = Object.keys(projectLinks);
  const report = [];
  for (const proj of projects) {
    const outgoing = projectLinks[proj];
    const incoming = new Set();
    for (const other of projects) {
      if (other !== proj && projectLinks[other]?.has(proj)) incoming.add(other);
    }
    const connections = new Set([...outgoing, ...incoming]).size;
    report.push({ name: proj, files: projectFiles[proj] || 0, connections });
  }
  return report;
}

function detectBrokenLinks(files) {
  const targetNames = new Set();
  const targetPaths = new Set();
  for (const [rel] of files) {
    targetPaths.add(rel.replace('.md', '').toLowerCase());
    targetNames.add(rel.replace('.md', '').split('/').pop().toLowerCase());
  }

  const broken = [];
  for (const [rel, data] of files) {
    if (data.skipForLinks) continue;
    for (const link of data.links) {
      const norm = link.toLowerCase();
      const nameOnly = norm.split('/').pop();
      // Skip heading links and concept links
      if (link.includes('#')) continue;
      if (targetPaths.has(norm) || targetNames.has(nameOnly)) continue;
      // Resolve relative
      const sourceDir = path.dirname(rel);
      const resolved = path.posix.normalize(sourceDir + '/' + norm).replace('.md', '');
      if (targetPaths.has(resolved)) continue;
      broken.push({ from: rel, link });
    }
  }
  return broken;
}

// Main
const state = loadState();
const now = Date.now();
const daysSince = (now - state.lastRun) / (1000 * 60 * 60 * 24);

if (daysSince < INTERVAL_DAYS && !process.argv.includes('--force')) {
  process.exit(0);
}

// Pull youtube-notes before scanning
try {
  const { execSync } = require('child_process');
  execSync('git pull --rebase --quiet origin main', {
    cwd: path.join(VAULT_DIR, 'youtube-notes'),
    timeout: 15000,
    stdio: 'ignore'
  });
} catch {}

const files = walkVault();
const output = [];

// 1. Detect new files since last run
const newFiles = [];
for (const [rel, data] of files) {
  if (!state.knownFiles[rel]) {
    newFiles.push(rel);
  }
}

if (newFiles.length > 0) {
  const byProject = {};
  for (const f of newFiles) {
    const proj = getProjectFromPath(f) || 'other';
    if (!byProject[proj]) byProject[proj] = [];
    byProject[proj].push(f.split('/').pop());
  }
  output.push(`> **${newFiles.length} new vault files** since last audit:`);
  for (const [proj, files] of Object.entries(byProject)) {
    if (files.length <= 3) {
      output.push(`>   ${proj}: ${files.join(', ')}`);
    } else {
      output.push(`>   ${proj}: ${files.slice(0, 3).join(', ')} +${files.length - 3} more`);
    }
  }
}

// 2. Graph health
const graphReport = analyzeGraphHealth(files);
const orphanProjects = graphReport.filter(p => p.connections < 2);
if (orphanProjects.length > 0) {
  output.push(`> ⚠ **Orphan projects**: ${orphanProjects.map(p => `${p.name} (${p.connections} connections)`).join(', ')}`);
}

// 3. Broken links (just count, don't list all)
const broken = detectBrokenLinks(files);
if (broken.length > 20) {
  output.push(`> ⚠ **${broken.length} broken wikilinks** in vault — run \`node ObsidianVault/90-System/scripts/vault-audit.js\` for details`);
}

// 3.5. Stack health — verify hook files referenced in settings.json exist
function checkStackHealth() {
  const missing = [];
  try {
    const settings = JSON.parse(fs.readFileSync(path.join(CLAUDE_DIR, 'settings.json'), 'utf8'));
    const hookGroups = settings.hooks || {};
    for (const group of Object.values(hookGroups)) {
      for (const entry of group) {
        for (const h of entry.hooks || []) {
          if (h.type !== 'command' || !h.command) continue;
          const m = h.command.match(/node\s+(\S+)/);
          if (m && !fs.existsSync(m[1])) missing.push(path.basename(m[1]));
        }
      }
    }
  } catch {}
  const sharedMods = ['hooks/shared/paths.js', 'hooks/shared/obsidian-api.js', 'patterns/db-helper.js'];
  for (const rel of sharedMods) {
    if (!fs.existsSync(path.join(CLAUDE_DIR, rel))) missing.push(rel);
  }
  return missing;
}

const missingStack = checkStackHealth();
if (missingStack.length > 0) {
  output.push(`> 🚨 **Stack health**: missing ${missingStack.length} referenced file(s): ${missingStack.join(', ')}`);
}

// 4. Auto-triage inbox files — classify, archive low-value, report high-value
const INBOX_DIRS = [
  '10-Projects/AiGeneration/claudeclaw-features/',
  'youtube-notes/'
];
const triage = { archived: 0, triaged: 0, highPri: [] };

for (const [rel] of files) {
  const inboxDir = INBOX_DIRS.find(d => rel.startsWith(d));
  if (!inboxDir || rel.endsWith('_index.md') || rel.endsWith('README.md')) continue;
  const full = path.join(VAULT_DIR, rel);
  try {
    let content = fs.readFileSync(full, 'utf8');
    const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!fmMatch) continue;
    const existingStatus = (fmMatch[1].match(/status:\s*(\w+)/) || [])[1] || '';
    if (existingStatus && existingStatus !== 'new') continue; // already processed

    const fm = fmMatch[1];
    const verdict = (fm.match(/verdict:\s*(\w+)/) || [])[1] || '';
    const priority = parseInt((fm.match(/priority_score:\s*(\d+)/) || [])[1] || '0');
    const isClaudeclaw = rel.startsWith('10-Projects/AiGeneration/claudeclaw-features/');

    let status;
    if (isClaudeclaw) {
      if (verdict === 'apply' && priority >= 7) {
        status = 'triaged';
        triage.triaged++;
        const title = (content.match(/^# (.+)/m) || [])[1] || rel.split('/').pop();
        triage.highPri.push(`${priority}/10 ${title}`);
      } else if (verdict === 'defer' && priority >= 6) {
        status = 'triaged';
        triage.triaged++;
      } else {
        status = 'archived';
        triage.archived++;
      }
    } else {
      // youtube-notes — mark triaged (insights need LLM extraction)
      status = 'triaged';
      triage.triaged++;
    }

    // Preserve line-ending style of source file
    const eol = content.includes('\r\n') ? '\r\n' : '\n';
    if (existingStatus === 'new') {
      content = content.replace(/status:\s*new/, 'status: ' + status);
    } else {
      content = content.replace(/^(---\r?\n[\s\S]*?)(---)/, '$1status: ' + status + eol + '$2');
    }
    fs.writeFileSync(full, content, 'utf8');

    // Archived files stay in vault — librarian handles cleanup on next triage pass
  } catch {}
}

if (triage.archived > 0 || triage.triaged > 0) {
  output.push(`> 📥 **Auto-triage**: ${triage.archived} archived, ${triage.triaged} triaged`);
}
if (triage.highPri.length > 0) {
  output.push(`> 🔥 **${triage.highPri.length} high-priority cards** need insight extraction:`);
  triage.highPri.slice(0, 5).forEach(h => output.push(`>   ${h}`));
  if (triage.highPri.length > 5) output.push(`>   +${triage.highPri.length - 5} more`);
  // Write pending flag for compact-report-injector to pick up
  const pendingPath = path.join(CLAUDE_DIR, 'hooks', '.inbox-extraction-needed');
  fs.writeFileSync(pendingPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    count: triage.highPri.length,
    cards: triage.highPri.slice(0, 10)
  }));
}

// Save state
const knownFiles = {};
for (const [rel, data] of files) {
  knownFiles[rel] = data.mtime;
}
saveState({ lastRun: now, knownFiles });

// Output
if (output.length > 0) {
  console.log('[VAULT-AUDIT] Periodic vault health check:');
  console.log(output.join('\n'));
} else {
  // Silent if all healthy
}
