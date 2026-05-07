#!/usr/bin/env node
/**
 * Vault stale-files report.
 *
 * Reads patterns/usage-tracker.json and the live vault filesystem, lists
 * markdown files that have either:
 *   - never been read (no tracker entry), or
 *   - last_read older than the cutoff (default 30 days).
 *
 * Consumer: librarian agent during distill/vault-maintenance pre-flight.
 * Manual: `node ~/.claude/scripts/vault-stale-report.js [days] [limit]`
 *
 * Read-only. No writes. No telemetry of its own.
 */

const fs = require('fs');
const path = require('path');

const VAULT = 'C:/Users/sorte/ObsidianVault';
const TRACKER = 'C:/Users/sorte/.claude/patterns/usage-tracker.json';
const EXCLUDE_DIRS = new Set(['.obsidian', '.smart-env', '.trash', '.git', 'node_modules', '.ai-sessions']);
const EXCLUDE_PATH_RE = [/^90-system\/qmd-cache\//i];

const days = parseInt(process.argv[2], 10) || 30;
const limit = parseInt(process.argv[3], 10) || 50;

function listMd(dir, base = '') {
  const out = [];
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    if (EXCLUDE_DIRS.has(e.name)) continue;
    const full = path.join(dir, e.name);
    const rel = (base ? base + '/' : '') + e.name;
    if (e.isDirectory()) {
      out.push(...listMd(full, rel));
    } else if (e.name.toLowerCase().endsWith('.md')) {
      const k = rel.toLowerCase();
      if (EXCLUDE_PATH_RE.some(r => r.test(k))) continue;
      out.push(k);
    }
  }
  return out;
}

function loadTracker() {
  try { return JSON.parse(fs.readFileSync(TRACKER, 'utf8')); } catch { return {}; }
}

function lastSignal(entry) {
  if (!entry) return null;
  const dates = [entry.last_read, entry.last_autosearch, entry.last].filter(Boolean);
  return dates.length ? dates.sort().pop() : null;
}

function main() {
  const tracker = loadTracker();
  delete tracker._meta;
  const cutoff = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
  const files = listMd(VAULT);

  const stale = [];
  const neverRead = [];
  for (const f of files) {
    const last = lastSignal(tracker[f]);
    if (!last) neverRead.push(f);
    else if (last < cutoff) stale.push({ f, last });
  }
  stale.sort((a, b) => a.last.localeCompare(b.last));

  console.log(`vault stale-report (cutoff: ${cutoff}, days: ${days})`);
  console.log(`total .md files: ${files.length}`);
  console.log(`tracker entries: ${Object.keys(tracker).length}`);
  console.log(`never read: ${neverRead.length}`);
  console.log(`old (last_read < cutoff): ${stale.length}`);
  console.log('---');
  console.log('TOP NEVER-READ:');
  neverRead.slice(0, limit).forEach(f => console.log('  • ' + f));
  if (neverRead.length > limit) console.log(`  ... and ${neverRead.length - limit} more`);
  console.log('---');
  console.log('OLDEST READS:');
  stale.slice(0, limit).forEach(s => console.log('  ' + s.last + '  ' + s.f));
  if (stale.length > limit) console.log(`  ... and ${stale.length - limit} more`);
}

main();
