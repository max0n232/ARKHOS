#!/usr/bin/env node
/**
 * Memory Consolidation — Episodic → Semantic memory transfer.
 *
 * GAP-1 from brain-architecture-gaps.md. Mimics hippocampal consolidation:
 * scans recent Ghost sessions (episodic), extracts recurring patterns via LLM,
 * appends distilled rules to vault pattern-library.md (semantic).
 *
 * Runs at SessionStart, throttled to once per INTERVAL_HOURS (24h).
 * Silent on empty days; logs to stdout when patterns added; Telegram alert on >0.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { CLAUDE_DIR, VAULT_DIR } = require('../shared/paths');
const { callWithFallback, sendTelegram } = require('../shared/obsidian-api');

const INTERVAL_HOURS = 24;
const LOOKBACK_DAYS = 7;
const MIN_NEW_SESSIONS = 3;
const MAX_SESSIONS_PER_RUN = 20;
const MAX_CHARS_PER_SESSION = 2500;
const STATE_FILE = path.join(CLAUDE_DIR, 'hooks', 'maintenance', '.memory-consolidation-state.json');
const PATTERN_LIB = path.join(VAULT_DIR, '10-Projects/ARKHOS/pattern-library.md');
const GHOST = 'bash "/c/Users/sorte/.bun/install/global/node_modules/ghost/ghost"';
const TG_CHAT = '804465999';

function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); }
  catch { return { lastRun: 0, processedSessions: [] }; }
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

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
  try {
    const raw = execSync(`${GHOST} show ${id}`, { encoding: 'utf8', timeout: 10000 });
    return raw.length > MAX_CHARS_PER_SESSION
      ? raw.slice(0, MAX_CHARS_PER_SESSION) + '\n[...truncated...]'
      : raw;
  } catch { return ''; }
}

const SYSTEM_PROMPT = `You are a memory consolidation agent for an AI development workspace.
Input: concatenated transcripts from recent coding sessions (episodic memory).
Task: identify RECURRING patterns — issues, fixes, decisions, or workflows that appear in MULTIPLE sessions.

Strict rules:
- Only output a pattern if it appears in >= 2 distinct sessions OR is a clear new architectural rule.
- Skip one-off events, conversational chatter, status reports.
- Skip patterns already trivially obvious (e.g. "user asked, agent answered").
- Each pattern must be actionable: someone reading it later should know WHEN it applies and WHAT to do.

Output STRICT JSON, no prose:
{"patterns":[{"title":"<5-10 word title>","frequency":<int>,"rule":"<1-2 sentence actionable rule>","trigger":"<when this applies>"}]}

If no patterns meet the bar, output: {"patterns":[]}`;

async function consolidate() {
  const state = loadState();
  const now = Date.now();
  const hoursSince = (now - state.lastRun) / 3600000;
  if (hoursSince < INTERVAL_HOURS && !process.argv.includes('--force')) return;

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
    saveState({ lastRun: now, processedSessions: [...processed, ...newOnes].slice(-200) });
    return;
  }

  let result;
  try {
    result = await callWithFallback(SYSTEM_PROMPT, corpus, 2048);
  } catch (e) {
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

  patterns = patterns.filter(p => p && p.title && p.rule);
  if (patterns.length === 0) {
    saveState({ lastRun: now, processedSessions: [...processed, ...newOnes].slice(-200) });
    return;
  }

  const today = new Date().toISOString().slice(0, 10);
  const existing = fs.existsSync(PATTERN_LIB) ? fs.readFileSync(PATTERN_LIB, 'utf8') : '';
  const existingLower = existing.toLowerCase();

  const fresh = patterns.filter(p => {
    const titleTerms = p.title.toLowerCase().match(/[a-zа-яё]{3,}/gi) || [];
    if (titleTerms.length < 2) return true;
    const hits = titleTerms.filter(t => existingLower.includes(t)).length;
    return hits / titleTerms.length < 0.7;
  });

  if (fresh.length === 0) {
    saveState({ lastRun: now, processedSessions: [...processed, ...newOnes].slice(-200) });
    return;
  }

  const block = [
    '',
    `## Consolidated ${today}`,
    `_Source: ${newOnes.length} sessions, model: ${result.model}_`,
    '',
    ...fresh.map(p => [
      `### ${p.title}`,
      `**Frequency:** ${p.frequency || '2+'}`,
      `**Trigger:** ${p.trigger || '—'}`,
      `**Rule:** ${p.rule}`,
      ''
    ].join('\n'))
  ].join('\n');

  fs.appendFileSync(PATTERN_LIB, block, 'utf8');

  saveState({ lastRun: now, processedSessions: [...processed, ...newOnes].slice(-200) });

  console.log(`[MEMORY-CONSOLIDATION] +${fresh.length} pattern(s) → pattern-library.md (${result.model})`);

  try {
    const titles = fresh.slice(0, 3).map(p => `• ${p.title}`).join('\n');
    await sendTelegram(TG_CHAT,
      `🧠 Memory consolidation\n+${fresh.length} pattern(s) from ${newOnes.length} sessions\n\n${titles}`);
  } catch {}
}

consolidate().catch(e => process.stderr.write(`[memory-consolidation] fatal: ${e.message}\n`));
