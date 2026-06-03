#!/usr/bin/env node
/**
 * Memory Unload Worker — efferent SAFE-class action of the resource-homeostat loop.
 *
 * Spawned (detached) by compact-report-injector when MEMORY.md crosses the BYTE limit
 * (24.4KB harness truncation). Closes the maintenance loop for ONE contour: it AUTO-collapses
 * the SAFE class only — a multi-line `##` section whose detail is PROVEN to already live in a
 * data-home (project-facts.md / settings.json) — into a one-line pointer. Everything else
 * (index trimming, fact deletion, rules edits) is CRITICAL → never touched here, surfaced
 * for the human instead.
 *
 * Why a detached worker (mirrors checkpoint-worker): the collapse must not block the user's
 * prompt, and re-reading/rewriting MEMORY.md inline on UserPromptSubmit would add latency.
 *
 * SAFETY (canon):
 *   §1 backup  — full copy to ~/.claude/tmp/ (auto-GC) BEFORE any mutation.
 *   §4 idempotent — no SAFE candidate (already collapsed) → no-op.
 *   §7 race    — snapshot mtime+size at start; re-check immediately before write; if the file
 *                changed (another session / memory-line-guard wrote it) → ABORT + surface.
 *                Write is atomic (temp file + rename), never in-place.
 *   A2 provenance — collapse is FORMAT reorg, not knowledge write; but it edits an always-loaded
 *                file, so every collapse is recorded in the surface flag + ledger (what was
 *                folded, where its detail now lives) so the user always sees it.
 *
 * DATA-HOME VERIFICATION (must-fix — prevents data loss): a pointer line alone is NOT enough.
 * The worker confirms the data-home file actually contains distinctive tokens from the section's
 * detail before collapsing. No confirmation → skip + surface. Better to leave it bloated than
 * to fold away the only copy of a detail.
 *
 * Fail-OPEN on any own error (a buggy housekeeping worker must never disrupt the session).
 *
 * Invocation: spawned with no args (uses default MEMORY.md), OR `node memory-unload-worker.js <path>`
 * for testing against a fixture copy.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const CLAUDE_DIR = path.join(os.homedir(), '.claude');
const DEFAULT_MEMORY = path.join(CLAUDE_DIR, 'projects', 'C--Users-sorte--claude', 'memory', 'MEMORY.md');
const PROJECT_FACTS = path.join(CLAUDE_DIR, 'references', 'project-facts.md');
const SETTINGS = path.join(CLAUDE_DIR, 'settings.json');
const TMP_DIR = path.join(CLAUDE_DIR, 'tmp');
const LEDGER = path.join(CLAUDE_DIR, 'patterns', 'maintenance-ledger.json');
const SURFACE_FLAG = path.join(CLAUDE_DIR, 'hooks', '.memunload-surface.json');

const BYTE_LIMIT = 24985;           // 24.4KB harness truncation threshold (matches stack-auditor)
const MIN_BODY_LINES = 3;           // a "multi-line" section worth collapsing
const MIN_TOKEN_LEN = 6;            // distinctive token length for data-home verification
const VERIFY_TOKENS_REQUIRED = 3;   // ≥N distinctive tokens must be found in the data-home

// A pointer line names where the detail lives. We map the mention to a concrete data-home file.
const DATA_HOMES = [
  { re: /project-facts|references\//i, file: PROJECT_FACTS },
  { re: /settings\.json/i,            file: SETTINGS },
];

function nowIso() {
  // Date.now is unavailable in workflow scripts but FINE in a normal node worker process.
  return new Date().toISOString();
}

// Extract STRUCTURALLY-SPECIFIC tokens from detail text: IDs, hashes, version strings, key
// names, paths — NOT bare common vocabulary. (codex must-fix A: generic tokens like
// `settings.json`/`Docker`/`MEMORY.md` co-occur everywhere in the data-home and falsely
// "verify" a section whose UNIQUE fact was never migrated → data loss.) A token qualifies only
// if it contains a digit or is mixed-case-with-digits or is a multi-segment path/id — i.e. it
// looks like a concrete identifier, not an English word or a common filename.
const COMMON_FILENAME = /^(settings\.json|memory\.md|claude\.md|docker|github|readme|index|project-facts\.md|references|patterns|credentials|hooks|vault)$/i;
function structuralTokens(text) {
  const toks = new Set();
  // backticked literals (IDs, keys, paths) — strongest signal
  for (const m of text.match(/`([^`]{4,})`/g) || []) toks.add(m.replace(/`/g, '').trim());
  // bare long alphanumeric tokens
  for (const m of text.match(/[A-Za-z0-9_./-]{6,}/g) || []) {
    if (!/^https?:/.test(m)) toks.add(m);
  }
  // keep only structurally-specific tokens: must contain a digit (IDs/versions/hashes) OR be a
  // multi-segment path. Drop bare common words/filenames that carry no section-unique signal.
  return [...toks].filter(t => {
    if (t.length < MIN_TOKEN_LEN) return false;
    if (COMMON_FILENAME.test(t)) return false;
    const hasDigit = /[0-9]/.test(t);
    const isPath = t.includes('/') && t.split('/').length >= 2;
    const isKeyish = /_/.test(t) && /[a-z]/.test(t) && t.length >= 8; // env/key names like N8N_ENCRYPTION_KEY
    return hasDigit || isPath || isKeyish;
  });
}

// Verify the data-home REALLY holds THIS section's detail before collapsing (codex must-fix A).
// Two conditions, both required:
//  1) tokens must be UNIQUE to this section — present here, absent from the rest of MEMORY.md
//     (a token shared across sections is generic, not this section's migrated detail).
//  2) ≥ VERIFY_TOKENS_REQUIRED of those section-unique structural tokens must appear in the
//     data-home file. Otherwise the unique fact was never moved → DO NOT collapse.
function dataHomeHasContent(detailText, homeFile, restOfMemory) {
  let home;
  try { home = fs.readFileSync(homeFile, 'utf8'); } catch { return false; }
  const toks = structuralTokens(detailText);
  // keep only tokens that do NOT appear elsewhere in MEMORY.md (section-unique)
  const unique = toks.filter(t => !restOfMemory.includes(t));
  if (unique.length < VERIFY_TOKENS_REQUIRED) return false; // not enough unique signal → skip, surface
  let hits = 0;
  for (const t of unique) {
    if (home.includes(t)) { hits++; if (hits >= VERIFY_TOKENS_REQUIRED) return true; }
  }
  return false;
}

// Parse MEMORY.md into sections keyed by `## ` headings. Returns [{heading, start, end, body}].
// The Index section (## Index) and any heading we must never auto-touch are flagged critical.
function parseSections(lines) {
  const sections = [];
  let cur = null;
  for (let i = 0; i < lines.length; i++) {
    const h = lines[i].match(/^##\s+(.+)$/);
    if (h) {
      if (cur) { cur.end = i - 1; sections.push(cur); }
      cur = { heading: h[1].trim(), headingLine: i, start: i + 1, end: lines.length - 1 };
    }
  }
  if (cur) sections.push(cur);
  return sections;
}

// A section is a SAFE collapse candidate iff:
//  - not the Index (critical — navigation), not Meta/Hygiene rules
//  - has a pointer line naming a known data-home
//  - the data-home VERIFIABLY contains the section detail
//  - body is multi-line (collapsing a 1-liner saves nothing)
function findSafeCandidate(lines, sections) {
  for (const s of sections) {
    const heading = s.heading.toLowerCase();
    if (heading.startsWith('index')) continue;                 // navigation — critical
    if (heading.includes('hygiene') || heading.includes('meta')) continue; // rules-adjacent
    const body = lines.slice(s.start, s.end + 1);
    const contentLines = body.filter(l => l.trim());
    if (contentLines.length < MIN_BODY_LINES) continue;        // already compact
    const bodyText = body.join('\n');
    // find a data-home pointer
    const home = DATA_HOMES.find(d => d.re.test(bodyText));
    if (!home) continue;
    // rest of MEMORY.md = everything OUTSIDE this section (for section-uniqueness check, must-fix A)
    const restOfMemory = lines.slice(0, s.headingLine).concat(lines.slice(s.end + 1)).join('\n');
    // VERIFY the data-home really holds THIS section's unique detail (must-fix A: prevents data loss)
    if (!dataHomeHasContent(bodyText, home.file, restOfMemory)) continue;
    return { section: s, home: home.file, body, contentLines };
  }
  return null;
}

// Build the collapsed one-line pointer for a section (keeps heading + the existing pointer phrase).
function buildPointer(cand) {
  const homeName = path.basename(cand.home);
  // Reuse an existing pointer sentence if the body already has one ("→ ...").
  const ptr = cand.body.find(l => /→\s*`?(references|settings)/i.test(l));
  if (ptr) return ptr.trim();
  return `Детали → \`references/${homeName}\` (auto-collapsed ${nowIso().slice(0, 10)}).`;
}

function appendLedger(entry) {
  let arr = [];
  try { arr = JSON.parse(fs.readFileSync(LEDGER, 'utf8')); if (!Array.isArray(arr)) arr = []; } catch {}
  arr.push(entry);
  try {
    fs.mkdirSync(path.dirname(LEDGER), { recursive: true });
    // atomic-ish: write temp then rename (avoids partial ledger on crash / concurrent worker)
    const tmp = LEDGER + '.tmp-' + process.pid;
    fs.writeFileSync(tmp, JSON.stringify(arr, null, 2), 'utf8');
    fs.renameSync(tmp, LEDGER);
  } catch {}
}

function surface(msg) {
  try {
    fs.writeFileSync(SURFACE_FLAG, JSON.stringify({ ts: Date.now(), msg }), 'utf8');
  } catch {}
}

function main() {
  const MEMORY = process.argv[2] || DEFAULT_MEMORY;

  let stat0, raw;
  try {
    stat0 = fs.statSync(MEMORY);
    raw = fs.readFileSync(MEMORY, 'utf8');
  } catch { return; } // unreadable → fail-open

  const bytes = Buffer.byteLength(raw, 'utf8');
  if (bytes < BYTE_LIMIT) return; // §4 idempotent: under limit → nothing to do

  const lines = raw.split(/\r?\n/);
  const sections = parseSections(lines);
  const cand = findSafeCandidate(lines, sections);

  if (!cand) {
    // No SAFE candidate — the over-limit bloat is CRITICAL class (index, un-homed detail).
    surface(`MEMORY.md ${bytes}B over ${BYTE_LIMIT} but NO safe-collapse candidate ` +
      `(remaining bloat is critical-class: index / un-homed detail). Manual unload needed — ` +
      `move detail to a data-home, then it auto-collapses.`);
    return;
  }

  // --- §1 backup BEFORE mutation ---
  try {
    fs.mkdirSync(TMP_DIR, { recursive: true });
    const bak = path.join(TMP_DIR, `MEMORY.md.pre-unload-${Date.now()}.bak`);
    fs.writeFileSync(bak, raw, 'utf8');
  } catch { return; } // can't back up → do NOT mutate (fail-safe)

  // --- build new body: replace section body with the single pointer line ---
  const pointer = buildPointer(cand);
  const before = lines.slice(0, cand.section.start);
  const after = lines.slice(cand.section.end + 1);
  const newLines = [...before, pointer, '', ...after];
  const newRaw = newLines.join('\n');

  // --- §7 race-guard: re-check the file hasn't changed since we read it ---
  let stat1;
  try { stat1 = fs.statSync(MEMORY); } catch { return; }
  if (stat1.mtimeMs !== stat0.mtimeMs || stat1.size !== stat0.size) {
    surface(`MEMORY.md changed during unload (concurrent write) — ABORTED to avoid lost update. ` +
      `Will retry next session.`);
    return;
  }

  // --- atomic write (temp + rename), never in-place ---
  try {
    const tmp = MEMORY + '.tmp-' + process.pid;
    fs.writeFileSync(tmp, newRaw, 'utf8');
    fs.renameSync(tmp, MEMORY);
  } catch {
    surface('MEMORY.md unload write failed — left unchanged (backup in tmp/).');
    return;
  }

  const newBytes = Buffer.byteLength(newRaw, 'utf8');
  const homeName = path.basename(cand.home);
  const ledgerEntry = {
    ts: nowIso(),
    action: 'memory-collapse',
    section: cand.section.heading,
    dataHome: homeName,
    bytesBefore: bytes,
    bytesAfter: newBytes,
    saved: bytes - newBytes,
  };
  appendLedger(ledgerEntry);

  // Provenance surface (A2): always tell the user what was folded and where the detail lives.
  surface(`Auto-collapsed MEMORY.md section "${cand.section.heading}" → детали verified in ` +
    `${homeName} (${bytes}→${newBytes}B). Backup in tmp/. ` +
    (newBytes >= BYTE_LIMIT ? 'Still over limit — more collapse next session.' : 'Under limit ✅'));
}

try { main(); } catch { /* fail-open: housekeeping must never disrupt the session */ }
