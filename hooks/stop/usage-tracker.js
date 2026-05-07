#!/usr/bin/env node
/**
 * Usage Tracker (Stop hook)
 *
 * Captures two signals into patterns/usage-tracker.json:
 *  A) AUTOSEARCH hits — `qmd://vault/...` URIs from the most recent
 *     AUTOSEARCH section in MEMORY.md (existing behaviour).
 *  B) Direct vault Reads — `Read` tool calls from the session transcript
 *     where file_path resolves under ObsidianVault/. Incremental: only
 *     processes lines added since last Stop event for this session_id,
 *     so a single read isn't counted N times across a long session.
 *
 * Schema per path:
 *   { autosearch_count, last_autosearch, read_count, last_read }
 * `_meta.transcripts.<session_id>.last_line` tracks per-session offset.
 *
 * Consumer: ~/.claude/scripts/vault-stale-report.js (manual + librarian pre-flight).
 *
 * Silent on errors — usage tracking is non-critical.
 */

const fs = require('fs');
const path = require('path');
const { CLAUDE_DIR } = require('../shared/paths');

const MEMORY_FILE = path.join(CLAUDE_DIR, 'projects/C--Users-sorte--claude/memory/MEMORY.md');
const TRACKER = path.join(CLAUDE_DIR, 'patterns/usage-tracker.json');
const VAULT_ROOT = 'C:/Users/sorte/ObsidianVault/';
const VAULT_ROOT_LOWER = VAULT_ROOT.toLowerCase();
const EXCLUDES = [/^\.smart-env\//i, /^\.trash\//i, /^\.obsidian\//i, /^\.ai-sessions\//i, /^90-system\/qmd-cache\//i];

function normalizeVaultPath(absPath) {
  if (!absPath) return null;
  const fwd = absPath.split('\\').join('/');
  if (!fwd.toLowerCase().startsWith(VAULT_ROOT_LOWER)) return null;
  const rel = fwd.slice(VAULT_ROOT.length).toLowerCase();
  for (const re of EXCLUDES) if (re.test(rel)) return null;
  return rel;
}

function loadTracker() {
  try { return JSON.parse(fs.readFileSync(TRACKER, 'utf8')); } catch { return {}; }
}

function ensureEntry(t, k) {
  if (!t[k]) t[k] = {};
  // Migrate legacy shape
  if (t[k].count !== undefined && t[k].autosearch_count === undefined) {
    t[k].autosearch_count = t[k].count;
    delete t[k].count;
  }
  if (t[k].last !== undefined && t[k].last_autosearch === undefined) {
    t[k].last_autosearch = t[k].last;
    delete t[k].last;
  }
  return t[k];
}

function readStdinJson() {
  try { return JSON.parse(fs.readFileSync(0, 'utf8') || '{}'); } catch { return {}; }
}

function processAutoSearch(tracker, today) {
  let mem;
  try { mem = fs.readFileSync(MEMORY_FILE, 'utf8'); } catch { return; }
  const match = mem.match(/<!--AUTOSEARCH-START-->([\s\S]*?)<!--AUTOSEARCH-END-->/);
  if (!match) return;
  const entryMatch = match[1].match(/<!--AS-ENTRY-START-->([\s\S]*?)<!--AS-ENTRY-END-->/);
  const section = entryMatch ? entryMatch[1] : match[1];
  const re = /qmd:\/\/vault\/([^\s:]+)/g;
  let m;
  while ((m = re.exec(section)) !== null) {
    const k = m[1].toLowerCase();
    const e = ensureEntry(tracker, k);
    e.autosearch_count = (e.autosearch_count || 0) + 1;
    e.last_autosearch = today;
  }
}

function processTranscript(tracker, today, transcriptPath, sessionId) {
  if (!transcriptPath || !fs.existsSync(transcriptPath)) return;
  const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n');
  if (!tracker._meta) tracker._meta = { transcripts: {} };
  if (!tracker._meta.transcripts) tracker._meta.transcripts = {};
  const key = sessionId || transcriptPath;
  const prev = (tracker._meta.transcripts[key] && tracker._meta.transcripts[key].last_line) || 0;
  const seen = new Set();
  for (let i = prev; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    let ev;
    try { ev = JSON.parse(line); } catch { continue; }
    if (ev.type !== 'assistant' || !ev.message || !Array.isArray(ev.message.content)) continue;
    for (const c of ev.message.content) {
      if (!c || c.type !== 'tool_use' || c.name !== 'Read') continue;
      const fp = c.input && c.input.file_path;
      const k = normalizeVaultPath(fp);
      if (!k || seen.has(k)) continue;
      seen.add(k);
      const e = ensureEntry(tracker, k);
      e.read_count = (e.read_count || 0) + 1;
      e.last_read = today;
    }
  }
  tracker._meta.transcripts[key] = { last_line: lines.length };
}

function main() {
  const payload = readStdinJson();
  const tracker = loadTracker();
  const today = new Date().toISOString().split('T')[0];
  processAutoSearch(tracker, today);
  processTranscript(tracker, today, payload.transcript_path, payload.session_id);
  try { fs.writeFileSync(TRACKER, JSON.stringify(tracker, null, 2), 'utf8'); } catch {}
}

try { main(); } catch {}
