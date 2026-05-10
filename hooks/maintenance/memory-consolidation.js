#!/usr/bin/env node
/**
 * Memory Consolidation — Episodic → Semantic memory transfer.
 *
 * Mimics hippocampal consolidation: scans recent Ghost sessions (episodic),
 * extracts recurring patterns via LLM, appends distilled rules to vault
 * pattern-library.md (semantic).
 *
 * Three modes:
 *   default     — daily extract new patterns (tail-biased session reads,
 *                 semantic dedup via Gemini embeddings, frequency >= 2 gate)
 *   --reorg     — weekly reorganize whole pattern-library (cluster, merge
 *                 near-duplicates, mark obsolete). Backup to logs/rollback/
 *   --anti      — extract anti-patterns from sessions with failure markers
 *                 to anti-patterns.md (separate vault file)
 *
 * Throttle: default 24h, --reorg 7d, --anti 24h. Override with --force.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');
const { CLAUDE_DIR, VAULT_DIR } = require('../shared/paths');
const { callWithFallback, callGeminiEmbedding, callOllamaEmbedding, sendTelegram } = require('../shared/obsidian-api');

const INTERVAL_HOURS = 24;
const REORG_INTERVAL_DAYS = 7;
const LOOKBACK_DAYS = 7;
const MIN_NEW_SESSIONS = 3;
const MAX_SESSIONS_PER_RUN = 40;
const MAX_CHARS_PER_SESSION = 8000;
const SESSION_TAIL_RATIO = 0.85;
const SIMILARITY_THRESHOLD = 0.83;
const ANTI_FAILURE_MARKERS = /mistake|fail(ed|ure|ing)?|error(s|ed)?|broken|bug|traceback|wrong|costyl|костыл|ошибк|сломал|регресс|rollback|не\s+(работ|срабат|удал|получ|удач|выш)|didn'?t\s+work|не\s+вышло|strike\s*\d|❌|🚫/i;

const STATE_FILE = path.join(CLAUDE_DIR, 'hooks', 'maintenance', '.memory-consolidation-state.json');
const PATTERN_LIB = path.join(VAULT_DIR, '10-Projects/ARKHOS/pattern-library.md');
const ANTI_LIB = path.join(VAULT_DIR, '10-Projects/ARKHOS/anti-patterns.md');
const ROLLBACK_DIR = path.join(CLAUDE_DIR, 'logs', 'rollback');
const GHOST = 'bash "/c/Users/sorte/.bun/install/global/node_modules/ghost/ghost"';
const TG_CHAT = '804465999';

// ─── State ────────────────────────────────────────────────────────────────

// Bumped to 2 when embeddings switched from gemini-3072 to nomic-768 (2026-05-10).
// Mismatched cache keys would silently fail cosine (length guard → 0), still correct
// but stale 3072-dim vectors stick forever. Flush once on version bump.
const CACHE_VERSION = 2;

function loadState() {
  let s;
  try { s = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); }
  catch { s = { lastRun: 0, lastReorg: 0, lastAnti: 0, processedSessions: [], embeddings: {}, cacheVersion: CACHE_VERSION }; }
  if (s.cacheVersion !== CACHE_VERSION) {
    process.stderr.write(`[memory-consolidation] embedding cache flushed (v${s.cacheVersion || 1} → v${CACHE_VERSION}, model space changed)\n`);
    s.embeddings = {};
    s.cacheVersion = CACHE_VERSION;
  }
  return s;
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// ─── Ghost session reader (tail-biased) ───────────────────────────────────

function listRecentSessions() {
  let raw;
  try { raw = execSync(`${GHOST} log`, { encoding: 'utf8', timeout: 10000 }); }
  catch { return []; }
  const ids = [];
  const cutoff = new Date(Date.now() - LOOKBACK_DAYS * 86400000);
  for (const line of raw.split('\n')) {
    const m = line.match(/^(\d{4}-\d{2}-\d{2})-([a-f0-9]+)/);
    if (!m) continue;
    const sessionDate = new Date(m[1]);
    if (sessionDate < cutoff) continue;
    ids.push(`${m[1]}-${m[2]}`);
  }
  return ids;
}

function readSession(id) {
  let raw;
  try { raw = execSync(`${GHOST} show ${id}`, { encoding: 'utf8', timeout: 10000 }); }
  catch { return ''; }
  if (raw.length <= MAX_CHARS_PER_SESSION) return raw;

  // Tail-biased: keep last 85% (decisions/post-mortems live there) + small head for context.
  const tailLen = Math.floor(MAX_CHARS_PER_SESSION * SESSION_TAIL_RATIO);
  const headLen = MAX_CHARS_PER_SESSION - tailLen - 30;
  const head = raw.slice(0, headLen);
  const tail = raw.slice(-tailLen);
  // Trim to nearest line boundary so we don't break mid-token.
  const headCut = head.lastIndexOf('\n');
  const tailCut = tail.indexOf('\n');
  const headPart = headCut > 0 ? head.slice(0, headCut) : head;
  const tailPart = tailCut > 0 ? tail.slice(tailCut + 1) : tail;
  return `${headPart}\n[...mid truncated...]\n${tailPart}`;
}

// ─── Embeddings + cosine ──────────────────────────────────────────────────

function cosine(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

function patternKey(p) {
  return crypto.createHash('md5').update(`${p.title}|${p.rule}`).digest('hex').slice(0, 12);
}

// Cache keys are namespaced by model: nomic vectors are 768-dim, gemini 3072-dim.
// Cosine guard rejects mismatched lengths (sim=0), so mixing without namespace would
// silently disable dedup for the cross-model entries.
async function getEmbedding(text, cache) {
  const hash = crypto.createHash('md5').update(text).digest('hex').slice(0, 12);
  const ollamaKey = `nomic:${hash}`;
  if (cache[ollamaKey]) return cache[ollamaKey];
  try {
    const vec = await callOllamaEmbedding(text);
    cache[ollamaKey] = vec;
    return vec;
  } catch (e) {
    process.stderr.write(`[memory-consolidation] WARN ollama embed failed: ${e.message} → gemini fallback\n`);
    const geminiKey = `gemini:${hash}`;
    if (cache[geminiKey]) return cache[geminiKey];
    try {
      const vec = await callGeminiEmbedding(text);
      cache[geminiKey] = vec;
      return vec;
    } catch (e2) {
      process.stderr.write(`[memory-consolidation] embed failed (both): ${e2.message}\n`);
      return null;
    }
  }
}

// Parse pattern-library.md into structured patterns ({ title, rule, frequency, trigger }).
function parseExistingPatterns(content) {
  const patterns = [];
  const sections = content.split(/^### /m).slice(1);
  for (const s of sections) {
    const title = s.split('\n')[0].trim();
    const rule = (s.match(/\*\*Rule:\*\*\s*([^\n]+)/) || [])[1] || '';
    if (title && rule) patterns.push({ title, rule });
  }
  return patterns;
}

// ─── Mode 1: standard consolidation ───────────────────────────────────────

const SYSTEM_PROMPT_EXTRACT = `You are a memory consolidation agent for an AI development workspace.
Input: concatenated transcripts from recent coding sessions (episodic memory).
Task: identify RECURRING patterns — issues, fixes, decisions, or workflows that appear in MULTIPLE sessions.

Strict rules:
- HARD GATE: only output a pattern with frequency >= 2 (count distinct sessions where it appears). Single-occurrence items WILL be discarded by a downstream filter — do not waste output budget on them.
- Skip one-off events, conversational chatter, status reports.
- Skip patterns already trivially obvious (e.g. "user asked, agent answered").
- Each pattern must be actionable: someone reading it later should know WHEN it applies and WHAT to do.
- The frequency field MUST be an integer count, not a string or "2+" placeholder.

Output STRICT JSON, no prose:
{"patterns":[{"title":"<5-10 word title>","frequency":<int>,"rule":"<1-2 sentence actionable rule>","trigger":"<when this applies>"}]}

If no patterns meet the bar, output: {"patterns":[]}`;

async function consolidate({ force }) {
  const state = loadState();
  const now = Date.now();
  if (!force && (now - state.lastRun) / 3600000 < INTERVAL_HOURS) return;

  const recent = listRecentSessions();
  const processed = new Set(state.processedSessions);
  const newOnes = recent.filter(id => !processed.has(id)).slice(0, MAX_SESSIONS_PER_RUN);

  if (newOnes.length < MIN_NEW_SESSIONS) {
    saveState({ ...state, lastRun: now });
    return;
  }

  const corpus = newOnes
    .map(id => `=== SESSION ${id} ===\n${readSession(id)}`)
    .filter(s => s.length > 200)
    .join('\n\n');

  if (corpus.length < 1000) {
    saveState({ ...state, lastRun: now, processedSessions: [...processed, ...newOnes].slice(-200) });
    return;
  }

  let result;
  try { result = await callWithFallback(SYSTEM_PROMPT_EXTRACT, corpus, 4096); }
  catch (e) {
    process.stderr.write(`[memory-consolidation] LLM failed: ${e.message}\n`);
    return;
  }

  let patterns = [];
  try {
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) patterns = JSON.parse(jsonMatch[0]).patterns || [];
  } catch (e) {
    process.stderr.write(`[memory-consolidation] parse failed: ${e.message}\n`);
    return;
  }

  patterns = patterns.filter(p => p && p.title && p.rule && Number(p.frequency) >= 2);
  if (patterns.length === 0) {
    saveState({ ...state, lastRun: now, processedSessions: [...processed, ...newOnes].slice(-200) });
    return;
  }

  // Semantic dedup against existing pattern-library entries.
  const cache = state.embeddings || {};
  const existing = fs.existsSync(PATTERN_LIB) ? fs.readFileSync(PATTERN_LIB, 'utf8') : '';
  const existingPatterns = parseExistingPatterns(existing);

  const existingVecs = [];
  for (const ep of existingPatterns) {
    const vec = await getEmbedding(`${ep.title}. ${ep.rule}`, cache);
    if (vec) existingVecs.push({ ep, vec });
  }

  const fresh = [];
  for (const p of patterns) {
    const vec = await getEmbedding(`${p.title}. ${p.rule}`, cache);
    if (!vec) {
      // embedding failed → fall back to surface dedup so we don't drop the pattern
      const titleTerms = p.title.toLowerCase().match(/[a-zа-яё]{3,}/gi) || [];
      const hits = titleTerms.filter(t => existing.toLowerCase().includes(t)).length;
      if (titleTerms.length < 2 || hits / titleTerms.length < 0.7) fresh.push(p);
      continue;
    }
    let maxSim = 0;
    for (const { vec: ev } of existingVecs) {
      const sim = cosine(vec, ev);
      if (sim > maxSim) maxSim = sim;
    }
    if (maxSim < SIMILARITY_THRESHOLD) fresh.push(p);
  }

  state.embeddings = cache;

  if (fresh.length === 0) {
    saveState({ ...state, lastRun: now, processedSessions: [...processed, ...newOnes].slice(-200) });
    return;
  }

  const today = new Date().toISOString().slice(0, 10);
  const block = [
    '',
    `## Consolidated ${today}`,
    `_Source: ${newOnes.length} sessions, model: ${result.model}, dedup: semantic_`,
    '',
    ...fresh.map(p => [
      `### ${p.title}`,
      `**Frequency:** ${p.frequency}`,
      `**Trigger:** ${p.trigger || '—'}`,
      `**Rule:** ${p.rule}`,
      ''
    ].join('\n'))
  ].join('\n');

  fs.appendFileSync(PATTERN_LIB, block, 'utf8');

  saveState({ ...state, lastRun: now, processedSessions: [...processed, ...newOnes].slice(-200) });

  console.log(`[MEMORY-CONSOLIDATION] +${fresh.length} pattern(s) → pattern-library.md (${result.model}, semantic dedup)`);

  try {
    const titles = fresh.slice(0, 3).map(p => `• ${p.title}`).join('\n');
    await sendTelegram(TG_CHAT,
      `🧠 Memory consolidation\n+${fresh.length} pattern(s) from ${newOnes.length} sessions\n\n${titles}`);
  } catch {}
}

// ─── Mode 2: reorganization (weekly) ──────────────────────────────────────

const SYSTEM_PROMPT_REORG = `You are reorganizing a pattern library accumulated across many AI coding sessions.

Goals (in priority order):
1. MERGE near-duplicates: combine entries that say the same thing in different words. Keep richest formulation.
2. RESOLVE contradictions: if entries conflict, keep the most recent / most specific one. Note the override in a "Supersedes:" field.
3. CLUSTER by theme: group related patterns under H2 sections (e.g. ## n8n, ## EasyKitchen, ## Hooks, ## Vault, ## General).
4. MARK obsolete: entries referring to dead infrastructure, retired tools, or superseded approaches → move to a "## Obsolete" section at the bottom with a one-line note why.
5. PRESERVE all unique knowledge — never discard a learning, only consolidate.

Format (preserve exactly):
### <Title>
**Frequency:** <int>
**Trigger:** <when applies>
**Rule:** <actionable rule>

Output: the FULL reorganized markdown content of the library. No commentary, no diff, no JSON wrapper. Start directly with the first H2 heading.`;

async function reorganize({ force }) {
  const state = loadState();
  const now = Date.now();
  if (!force && (now - state.lastReorg) / 86400000 < REORG_INTERVAL_DAYS) {
    console.log(`[MEMORY-CONSOLIDATION] reorg throttled (last ${Math.round((now - state.lastReorg) / 86400000)}d ago, interval ${REORG_INTERVAL_DAYS}d)`);
    return;
  }

  if (!fs.existsSync(PATTERN_LIB)) {
    console.log('[MEMORY-CONSOLIDATION] reorg: pattern-library.md missing, skip');
    return;
  }

  const original = fs.readFileSync(PATTERN_LIB, 'utf8');
  if (original.length < 2000) {
    console.log('[MEMORY-CONSOLIDATION] reorg: library too small, skip');
    saveState({ ...state, lastReorg: now });
    return;
  }

  // Backup before destructive write.
  if (!fs.existsSync(ROLLBACK_DIR)) fs.mkdirSync(ROLLBACK_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backupPath = path.join(ROLLBACK_DIR, `pattern-library-${stamp}.md`);
  fs.writeFileSync(backupPath, original, 'utf8');

  let result;
  try {
    // Reorg is reasoning-heavy: prefer Sonnet, fall back to Gemini if no credit/no key.
    result = await callWithFallback(SYSTEM_PROMPT_REORG, original, 8192, { primary: 'sonnet', fallback: 'gemini' });
  } catch (e) {
    process.stderr.write(`[memory-consolidation] reorg LLM failed: ${e.message}\n`);
    return;
  }

  const reorganized = result.text.trim();
  if (reorganized.length < original.length * 0.4) {
    process.stderr.write(`[memory-consolidation] reorg: output suspiciously short (${reorganized.length} vs ${original.length}), aborting write\n`);
    return;
  }

  // Prepend header so future readers know this file was reorganized.
  const today = new Date().toISOString().slice(0, 10);
  const header = `# Pattern Library\n\n_Last reorganized: ${today} (model: ${result.model}, original size: ${original.length}B → ${reorganized.length}B). Backup: \`logs/rollback/pattern-library-${stamp}.md\`_\n\n`;
  const finalContent = header + (reorganized.startsWith('# ') ? reorganized.replace(/^#\s+[^\n]+\n+/, '') : reorganized);

  fs.writeFileSync(PATTERN_LIB, finalContent, 'utf8');

  // Invalidate embedding cache — patterns changed.
  saveState({ ...state, lastReorg: now, embeddings: {} });

  const reduction = ((1 - reorganized.length / original.length) * 100).toFixed(1);
  console.log(`[MEMORY-CONSOLIDATION] reorganized: ${original.length}B → ${reorganized.length}B (-${reduction}%, ${result.model})`);

  try {
    await sendTelegram(TG_CHAT,
      `🧠 Pattern library reorganized\n${original.length}B → ${reorganized.length}B (-${reduction}%)\nModel: ${result.model}\nBackup: logs/rollback/pattern-library-${stamp}.md`);
  } catch {}
}

// ─── Mode 3: anti-pattern extraction ──────────────────────────────────────

const SYSTEM_PROMPT_ANTI = `You are extracting ANTI-PATTERNS from AI coding session transcripts — things that DID NOT WORK or caused harm.

Input: concatenated session transcripts containing failure markers (mistakes, errors, regressions, rollbacks, dead-end approaches).

Task: identify recurring FAILURE patterns. What approaches were tried, why they broke, what should be avoided.

Strict rules:
- HARD GATE: only output anti-patterns observed in >= 2 distinct sessions OR with explicit user-stated rule against them.
- Skip one-off bugs that were trivial typos.
- Skip transient infra issues (network blips, restart fixed it).
- Each entry must explain: WHAT was tried, WHY it failed, WHAT to do instead.

Output STRICT JSON:
{"antipatterns":[{"title":"<5-10 word title>","frequency":<int>,"what_tried":"<approach>","why_failed":"<root cause>","do_instead":"<correct approach>"}]}

If none meet the bar, output: {"antipatterns":[]}`;

async function antiPatterns({ force }) {
  const state = loadState();
  const now = Date.now();
  if (!force && (now - state.lastAnti) / 3600000 < INTERVAL_HOURS) return;

  const recent = listRecentSessions();
  if (recent.length === 0) return;

  // Filter to sessions containing failure markers — scan FULL session (markers
  // may live in truncated middle), then read truncated version for LLM corpus.
  const failed = [];
  for (const id of recent.slice(0, MAX_SESSIONS_PER_RUN)) {
    let fullRaw;
    try { fullRaw = execSync(`${GHOST} show ${id}`, { encoding: 'utf8', timeout: 10000 }); }
    catch { continue; }
    if (!ANTI_FAILURE_MARKERS.test(fullRaw)) continue;
    const content = fullRaw.length > MAX_CHARS_PER_SESSION ? readSession(id) : fullRaw;
    failed.push({ id, content });
  }

  if (failed.length < 2) {
    saveState({ ...state, lastAnti: now });
    console.log(`[MEMORY-CONSOLIDATION] anti: only ${failed.length} sessions with failure markers, skip`);
    return;
  }

  const corpus = failed.map(s => `=== SESSION ${s.id} ===\n${s.content}`).join('\n\n');

  let result;
  try {
    // Anti-pattern extraction needs nuanced interpretation — prefer Sonnet.
    result = await callWithFallback(SYSTEM_PROMPT_ANTI, corpus, 4096, { primary: 'sonnet', fallback: 'gemini' });
  } catch (e) {
    process.stderr.write(`[memory-consolidation] anti LLM failed: ${e.message}\n`);
    return;
  }

  let items = [];
  try {
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) items = JSON.parse(jsonMatch[0]).antipatterns || [];
  } catch (e) {
    process.stderr.write(`[memory-consolidation] anti parse failed: ${e.message}\n`);
    return;
  }

  const rawCount = items.length;
  items = items.filter(p => p && p.title && p.what_tried && p.do_instead && Number(p.frequency) >= 2);
  if (items.length === 0) {
    console.log(`[MEMORY-CONSOLIDATION] anti: ${failed.length} failed sessions → ${rawCount} raw items → 0 passed gate (model: ${result.model})`);
    saveState({ ...state, lastAnti: now });
    return;
  }

  // Surface dedup against existing anti-patterns.md
  const existing = fs.existsSync(ANTI_LIB) ? fs.readFileSync(ANTI_LIB, 'utf8') : '';
  const existingLower = existing.toLowerCase();
  const fresh = items.filter(p => {
    const terms = p.title.toLowerCase().match(/[a-zа-яё]{3,}/gi) || [];
    if (terms.length < 2) return true;
    const hits = terms.filter(t => existingLower.includes(t)).length;
    return hits / terms.length < 0.7;
  });

  if (fresh.length === 0) {
    console.log(`[MEMORY-CONSOLIDATION] anti: ${items.length} items but all dup against existing (model: ${result.model})`);
    saveState({ ...state, lastAnti: now });
    return;
  }

  const today = new Date().toISOString().slice(0, 10);

  // Initialize file if missing.
  if (!existing) {
    fs.writeFileSync(ANTI_LIB,
      `---\ntags: [knowledge, anti-patterns, ARKHOS]\n---\n\n# Anti-Patterns\n\n_Things that did NOT work. Do not repeat. Auto-extracted from failure-marker sessions by memory-consolidation.js --anti._\n`,
      'utf8');
  }

  const block = [
    '',
    `## Anti-patterns ${today}`,
    `_Source: ${failed.length} sessions with failure markers, model: ${result.model}_`,
    '',
    ...fresh.map(p => [
      `### ❌ ${p.title}`,
      `**Frequency:** ${p.frequency}`,
      `**What was tried:** ${p.what_tried}`,
      `**Why it failed:** ${p.why_failed || '—'}`,
      `**Do instead:** ${p.do_instead}`,
      ''
    ].join('\n'))
  ].join('\n');

  fs.appendFileSync(ANTI_LIB, block, 'utf8');
  saveState({ ...state, lastAnti: now });

  console.log(`[MEMORY-CONSOLIDATION] +${fresh.length} anti-pattern(s) → anti-patterns.md (${result.model})`);

  try {
    const titles = fresh.slice(0, 3).map(p => `• ${p.title}`).join('\n');
    await sendTelegram(TG_CHAT,
      `🚫 Anti-patterns extracted\n+${fresh.length} from ${failed.length} sessions\n\n${titles}`);
  } catch {}
}

// ─── Dispatcher ───────────────────────────────────────────────────────────

const argv = process.argv.slice(2);
const force = argv.includes('--force');
const mode = argv.find(a => ['--reorg', '--anti', '--consolidate'].includes(a)) || '--consolidate';

const runners = {
  '--consolidate': consolidate,
  '--reorg': reorganize,
  '--anti': antiPatterns,
};

runners[mode]({ force }).catch(e => process.stderr.write(`[memory-consolidation] fatal (${mode}): ${e.message}\n`));
