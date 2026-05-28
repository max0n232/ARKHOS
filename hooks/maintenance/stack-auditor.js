#!/usr/bin/env node
/**
 * Stack Auditor — weekly metric-driven proactivity report.
 *
 * Complement to memory-consolidation (LLM-pattern-driven). This hook is
 * metric-driven: scans logs/transcripts/vault frontmatter/embeddings to
 * surface stack drift the user would otherwise have to ask about.
 *
 * 6 active checks + 1 stub (VPS rsync, pending P-NEW-E):
 *   1. Hook activity   — stdout markers in transcripts (caller=unknown in llm-calls)
 *   2. Skill firing    — Skill tool_use entries in transcripts
 *   3. MCP + gemini    — mcp__* tool_use + 3 gemini subagent overlap heuristic
 *   4. Vault stale     — frontmatter last_verified >30d
 *   5. Feedback dedup  — pairwise cosine on Ollama/Gemini embeddings >0.85
 *   6. MEMORY.md size  — warn at 180, error at 200 (truncation threshold)
 *   7. VPS rsync       — deferred (stub line)
 *
 * Outputs: vault audit md + Telegram digest + flag file picked up by
 * compact-report-injector on next UserPromptSubmit.
 *
 * Throttle: 7d. Lock against parallel SessionStart instances. --force/--dry-run.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { CLAUDE_DIR, VAULT_DIR } = require('../shared/paths');
const { callOllamaEmbedding, callGeminiEmbedding, sendTelegram } = require('../shared/obsidian-api');

const INTERVAL_DAYS = 7;
const LOOKBACK_DAYS = 7;
const SIM_THRESHOLD = 0.85;
const MEM_WARN = 180;
const MEM_LIMIT = 200;
const STALE_DAYS = 30;
const LOCK_TTL_MS = 5 * 60 * 1000;
const TG_CHAT = '804465999';

const STATE_FILE = path.join(CLAUDE_DIR, 'hooks', 'maintenance', '.stack-auditor-state.json');
const FLAG_FILE = path.join(CLAUDE_DIR, 'hooks', '.stack-auditor-pending.flag');
const AUDIT_DIR = path.join(VAULT_DIR, '10-Projects/ARKHOS/audits');
const MEMORY_MD = path.join(CLAUDE_DIR, 'projects', 'C--Users-sorte--claude', 'memory', 'MEMORY.md');
const FEEDBACK_DIR = path.join(CLAUDE_DIR, 'projects', 'C--Users-sorte--claude', 'memory');
const TRANSCRIPT_DIR = path.join(CLAUDE_DIR, 'projects', 'C--Users-sorte--claude');
const AGENTS_DIR = path.join(CLAUDE_DIR, 'agents');

const SKILL_NAMES = ['assistant', 'diagram', 'n8n-expert', 'obsidian-router',
  'output-critic', 'post-mortem', 'strategic-critique'];
const HOOK_MARKERS = {
  '[VAULT-AUDIT]': 'vault-audit',
  '[HEALTH]': 'health-check',
  '[MEMORY-CONSOLIDATION]': 'memory-consolidation',
  '[GHOST-CLEANUP]': 'ghost-cleanup',
  '[OBSERVATION': 'observation-watch',
  '[QMD-REFRESH]': 'qmd-refresh',
  '[N8N-MONITOR]': 'n8n-monitor',
  '[DRIFT]': 'drift-check',
  '[MEMORY-DECAY]': 'memory-decay',
};

const DRY_RUN = process.argv.includes('--dry-run');
const FORCE = process.argv.includes('--force');

function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); }
  catch { return { lastRun: 0, embeddings: {} }; }
}
function saveState(s) { fs.writeFileSync(STATE_FILE, JSON.stringify(s, null, 2)); }

function tryAcquireLock() {
  const lockFile = path.join(CLAUDE_DIR, 'hooks', 'maintenance', '.stack-auditor.lock');
  const payload = JSON.stringify({ pid: process.pid, started: Date.now() });
  try { fs.writeFileSync(lockFile, payload, { flag: 'wx' }); return lockFile; }
  catch (e) {
    if (e.code !== 'EEXIST') throw e;
    try {
      const cur = JSON.parse(fs.readFileSync(lockFile, 'utf8'));
      if (Date.now() - cur.started > LOCK_TTL_MS) {
        fs.unlinkSync(lockFile);
        fs.writeFileSync(lockFile, payload, { flag: 'wx' });
        return lockFile;
      }
    } catch {}
    return null;
  }
}
function releaseLock(f) { if (f) { try { fs.unlinkSync(f); } catch {} } }

function cosine(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

// Single pass over recent transcripts — feeds checks #1, #2, #3.
function walkTranscripts() {
  const cutoff = Date.now() - LOOKBACK_DAYS * 86400000;
  const hookCounts = {}; const skillCounts = {}; const mcpServers = {};
  let files = [];
  try {
    files = fs.readdirSync(TRANSCRIPT_DIR)
      .filter(f => f.endsWith('.jsonl'))
      .map(f => ({ name: f, path: path.join(TRANSCRIPT_DIR, f) }))
      .filter(f => { try { return fs.statSync(f.path).mtimeMs > cutoff; } catch { return false; } });
  } catch { return { hookCounts, skillCounts, mcpServers, files: 0 }; }

  for (const f of files) {
    let raw;
    try { raw = fs.readFileSync(f.path, 'utf8'); } catch { continue; }
    for (const line of raw.split('\n')) {
      if (!line.trim()) continue;
      let obj; try { obj = JSON.parse(line); } catch { continue; }
      const content = obj.message?.content;
      if (!Array.isArray(content)) continue;
      for (const block of content) {
        if (block.type === 'text' && block.text) {
          for (const [marker, hookName] of Object.entries(HOOK_MARKERS)) {
            if (block.text.includes(marker)) hookCounts[hookName] = (hookCounts[hookName] || 0) + 1;
          }
        } else if (block.type === 'tool_use') {
          if (block.name === 'Skill') {
            const s = block.input?.skill;
            if (s) skillCounts[s] = (skillCounts[s] || 0) + 1;
          } else if (block.name && block.name.startsWith('mcp__')) {
            const server = block.name.split('__')[1];
            if (server) mcpServers[server] = (mcpServers[server] || 0) + 1;
          }
        }
      }
    }
  }
  return { hookCounts, skillCounts, mcpServers, files: files.length };
}

function checkVaultStale() {
  const stale = [];
  const cutoff = Date.now() - STALE_DAYS * 86400000;
  function walk(dir, depth) {
    if (depth > 4) return;
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (e.name.startsWith('.') || e.name === 'node_modules') continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) { walk(full, depth + 1); continue; }
      if (!e.name.endsWith('.md')) continue;
      try {
        const head = fs.readFileSync(full, 'utf8').slice(0, 800);
        const m = head.match(/^last_verified:\s*([0-9-]+)/m);
        if (!m) continue;
        const ts = Date.parse(m[1]);
        if (Number.isFinite(ts) && ts < cutoff) {
          stale.push(path.relative(VAULT_DIR, full).replace(/\\/g, '/'));
        }
      } catch {}
    }
  }
  walk(path.join(VAULT_DIR, '10-Projects'), 0);
  return stale;
}

async function checkFeedbackDedup(state) {
  let names = [];
  try { names = fs.readdirSync(FEEDBACK_DIR).filter(n => n.startsWith('feedback_') && n.endsWith('.md')); }
  catch { return { skipped: true, reason: 'feedback dir read error', dups: [] }; }
  const cache = state.embeddings || {};
  const vecs = {};
  let quotaExhausted = false;
  for (const n of names) {
    let body;
    try { body = fs.readFileSync(path.join(FEEDBACK_DIR, n), 'utf8'); } catch { continue; }
    const stripped = body.replace(/^---[\s\S]*?---/, '').slice(0, 4000).trim();
    if (!stripped) continue;
    const hash = crypto.createHash('md5').update(stripped).digest('hex').slice(0, 12);
    const key = `nomic:${hash}`;
    if (cache[key]) { vecs[n] = cache[key]; continue; }
    if (quotaExhausted) continue;
    try {
      const v = await callOllamaEmbedding(stripped);
      cache[key] = v; vecs[n] = v;
    } catch {
      try {
        const v = await callGeminiEmbedding(stripped);
        cache[`gem:${hash}`] = v; vecs[n] = v;
      } catch (ge) {
        if (/quota|429|RESOURCE_EXHAUSTED/i.test(ge.message || '')) quotaExhausted = true;
      }
    }
  }
  state.embeddings = cache;
  const dups = []; const keys = Object.keys(vecs);
  for (let i = 0; i < keys.length; i++) {
    for (let j = i + 1; j < keys.length; j++) {
      const sim = cosine(vecs[keys[i]], vecs[keys[j]]);
      if (sim >= SIM_THRESHOLD) dups.push({ a: keys[i], b: keys[j], sim: +sim.toFixed(3) });
    }
  }
  return { skipped: false, dups, quotaExhausted, scanned: Object.keys(vecs).length };
}

function checkMemorySize() {
  try {
    const lines = fs.readFileSync(MEMORY_MD, 'utf8').split('\n').length;
    return { lines, warn: lines >= MEM_WARN, over: lines >= MEM_LIMIT };
  } catch { return { lines: 0, warn: false, over: false, error: 'unreadable' }; }
}

function checkGeminiTrio() {
  const trio = ['gemini-mega-context.md', 'gemini-multimodal.md', 'gemini-utility.md'];
  const sizes = {};
  for (const n of trio) {
    try { sizes[n] = fs.statSync(path.join(AGENTS_DIR, n)).size; } catch { sizes[n] = 0; }
  }
  return sizes;
}

function composeReport(r) {
  const date = new Date().toISOString().slice(0, 10);
  const concerns = [];
  if (r.memory.over) concerns.push(`MEMORY.md ${r.memory.lines} lines OVER ${MEM_LIMIT}`);
  else if (r.memory.warn) concerns.push(`MEMORY.md ${r.memory.lines}/${MEM_LIMIT}`);
  if (r.stale.length) concerns.push(`${r.stale.length} stale vault entries`);
  if (r.dedup.dups.length) concerns.push(`${r.dedup.dups.length} feedback dup pair(s)`);
  const skillsZero = SKILL_NAMES.filter(s => !r.transcript.skillCounts[s]);
  if (skillsZero.length) concerns.push(`${skillsZero.length} skill(s) zero fire 7d`);

  const fm = [
    '---',
    'type: audit',
    'generated_by: stack-auditor',
    `date: ${date}`,
    `top_concerns: [${concerns.map(c => `"${c}"`).join(', ')}]`,
    '---',
    ''
  ].join('\n');

  const body = [
    `# Stack Audit ${date}`, '',
    `_Lookback: ${LOOKBACK_DAYS}d. Transcripts scanned: ${r.transcript.files}._`, '',
    '## 1. Hook activity (transcript markers)',
    ...Object.entries(r.transcript.hookCounts).sort((a,b)=>b[1]-a[1]).map(([h,c]) => `- ${h}: ${c}`),
    Object.keys(r.transcript.hookCounts).length === 0 ? '_(no hook markers seen)_' : '',
    '## 2. Skill firing rate',
    ...SKILL_NAMES.map(s => `- ${s}: ${r.transcript.skillCounts[s] || 0}${(r.transcript.skillCounts[s]||0)===0?' ⚠ zero':''}`),
    '',
    '## 3. MCP utilization + gemini trio',
    ...Object.entries(r.transcript.mcpServers).sort((a,b)=>b[1]-a[1]).map(([s,c]) => `- ${s}: ${c}`),
    '',
    'Gemini subagent file sizes (overlap heuristic — review if all <3KB or near-identical):',
    ...Object.entries(r.geminiTrio).map(([n,s]) => `- ${n}: ${s}B`),
    '',
    `## 4. Vault stale (last_verified > ${STALE_DAYS}d)`,
    r.stale.length ? r.stale.slice(0, 20).map(s => `- ${s}`).join('\n') + (r.stale.length > 20 ? `\n- _+${r.stale.length - 20} more_` : '') : '_(none)_',
    '',
    '## 5. Feedback semantic duplicates',
    r.dedup.skipped ? `_(skipped: ${r.dedup.reason})_` :
      r.dedup.dups.length ? r.dedup.dups.map(d => `- ${d.a} ↔ ${d.b} (${d.sim})`).join('\n')
        : `_(${r.dedup.scanned} scanned, no pairs ≥${SIM_THRESHOLD})_`,
    r.dedup.quotaExhausted ? '_(Gemini quota exhausted mid-scan)_' : '',
    '',
    '## 6. MEMORY.md size',
    `${r.memory.lines}/${MEM_LIMIT} lines` + (r.memory.over ? ' 🚨 OVER' : r.memory.warn ? ' ⚠ warn' : ' ✅'),
    '',
    '## 7. VPS rsync diff',
    '_(deferred — pending P-NEW-E VPS sync design)_',
    ''
  ].filter(Boolean).join('\n');

  return { fm, body, concerns, date };
}

function digestForTelegram(r, concerns, date) {
  const lines = [`📊 Stack Audit ${date}`];
  if (concerns.length) {
    lines.push('Top concerns:');
    concerns.slice(0, 5).forEach(c => lines.push(`• ${c}`));
  } else {
    lines.push('No concerns — stack healthy.');
  }
  lines.push(`Vault: 10-Projects/ARKHOS/audits/${date}.md`);
  return lines.join('\n');
}

(async () => {
  const state = loadState();
  const now = Date.now();
  const days = (now - state.lastRun) / 86400000;
  if (!FORCE && days < INTERVAL_DAYS) process.exit(0);

  const lock = tryAcquireLock();
  if (!lock) { console.log('[STACK-AUDITOR] another instance holds lock, skip'); process.exit(0); }
  process.on('exit', () => releaseLock(lock));

  try {
    const transcript = walkTranscripts();
    const stale = checkVaultStale();
    const dedup = await checkFeedbackDedup(state);
    const memory = checkMemorySize();
    const geminiTrio = checkGeminiTrio();
    const results = { transcript, stale, dedup, memory, geminiTrio };
    const { fm, body, concerns, date } = composeReport(results);
    const md = fm + body;
    const auditPath = path.join(AUDIT_DIR, `${date}.md`);

    if (DRY_RUN) {
      console.log('[STACK-AUDITOR] --dry-run, would write:', auditPath);
      console.log('--- digest ---'); console.log(digestForTelegram(results, concerns, date));
      console.log('--- markdown ---'); console.log(md);
      releaseLock(lock);
      process.exit(0);
    }

    try { fs.mkdirSync(AUDIT_DIR, { recursive: true }); } catch {}
    fs.writeFileSync(auditPath, md, 'utf8');
    fs.writeFileSync(FLAG_FILE, JSON.stringify({
      timestamp: new Date().toISOString(),
      auditPath: auditPath.replace(/\\/g, '/'),
      date, concerns,
    }), 'utf8');
    try { await sendTelegram(TG_CHAT, digestForTelegram(results, concerns, date)); } catch {}

    saveState({ ...state, lastRun: now });
    console.log(`[STACK-AUDITOR] report → ${auditPath} (${concerns.length} concern(s))`);
  } catch (e) {
    console.error('[STACK-AUDITOR] error:', e.message);
  } finally {
    releaseLock(lock);
  }
})();
