#!/usr/bin/env node
/**
 * Stop Hook: Session Reflection — per-session quality journal
 *
 * Ported from ClaudeClaw GAP-5 (hooks/session-reflection.cjs), adapted for
 * ARKHOS: stdin transcript_path (not "latest jsonl" guess), Windows paths,
 * git activity from ~/.claude (not VPS repo).
 *
 * Distinct from session-audit (knowledge extraction) and stop-analytics
 * (tool traces): this writes user/assistant/error/correction COUNTS +
 * quality indicators per session to vault reflection-log.md.
 *
 * No LLM call — pure heuristic.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { CLAUDE_DIR, VAULT_DIR } = require('../shared/paths');

const REFLECTION_LOG = path.join(VAULT_DIR, '10-Projects/ARKHOS/reflection-log.md');
const GOALS_FILE = path.join(VAULT_DIR, '10-Projects/ARKHOS/active-goals.md');
const STATE_FILE = path.join(CLAUDE_DIR, 'hooks/stop/.session-reflection-state.json');
const MIN_TURNS = 5; // skip trivial sessions

function readStdinSync() {
  const chunks = [];
  const buf = Buffer.alloc(1024);
  try {
    let n;
    while ((n = fs.readSync(0, buf, 0, 1024)) > 0) chunks.push(buf.slice(0, n).toString());
  } catch {}
  return chunks.join('');
}

function loadState() { try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); } catch { return {}; } }
function saveState(s) { try { fs.writeFileSync(STATE_FILE, JSON.stringify(s)); } catch {} }

const stdin = readStdinSync();
let stdinData = {};
try { stdinData = JSON.parse(stdin); } catch {}
const transcriptPath = stdinData.transcript_path;
const sessionId = stdinData.session_id;
if (!transcriptPath || !fs.existsSync(transcriptPath)) process.exit(0);

// One reflection entry per session — skip if already logged
const state = loadState();
if (sessionId && state.lastSessionId === sessionId) process.exit(0);

function analyzeTranscript(file) {
  let userMsgs = 0, assistantMsgs = 0, toolCalls = 0, errors = 0, corrections = 0;
  let preloadFires = 0;
  const preloadFiles = new Map(); // file → count
  let preloadKeywordHits = 0; // user prompts containing preload triggers
  const correctionRe = /\b(нет[,\s]+не\s+так|неправильно|не\s+то|wrong|incorrect|not\s+what|stop[,\s]|стоп[,\s]|откати)\b|\bошиб(ка|ку|ки|ся|ался|лся)\b/i;
  const preloadRe = /\[CAUSAL PRELOAD\]/;
  const preloadFileRe = /### [^→]+→ ([\w./-]+\.md)/g;
  // Mirror of pre-task-loader.js triggers — keeps metric meaningful even if
  // hook silently fails (false negatives detectable when keyword present but no fire).
  const triggerRe = /\b(EasyKitchen|set_attribute|redraw_with_undo|FACADE\d?|DRAWER|BLEND\d?|PANEL_V|d10[1-6]|d20[1-4]|k14[3-7]|lenz|ANIMATECUSTOM|onclick=|\.skp\b|d106|facade\s*gap|t4_corners?|parent!\w+|mm!\w+|CHOOSE\s*\(|RotZ|_x_formula|_y_formula|formulaunits|EkExport|\.bom|cutlist|save_as|distill|дистилляц|librarian|routing[-\s]?map|topic[-\s]file|accumulator|folder[-\s]MOC|zero[-\s]point|нулев[ауы].*точк)/i;

  const lines = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean);
  for (const l of lines) {
    try {
      const e = JSON.parse(l);
      if (e.type === 'user') userMsgs++;
      if (e.type === 'assistant') assistantMsgs++;
      const c = e.message?.content;
      if (Array.isArray(c)) {
        for (const b of c) {
          if (b.type === 'tool_use') toolCalls++;
          if (b.type === 'tool_result' && b.is_error) errors++;
        }
      }
      if (e.type === 'user' && c) {
        const text = typeof c === 'string' ? c : c.map(b => b.text || '').join(' ');
        const isReminder = text.startsWith('<system-reminder') || text.startsWith('<task-notification') ||
            text.startsWith('<local-command') || text.startsWith('<command-');
        // Preload context lives inside system-reminder hook output blocks
        if (preloadRe.test(text)) {
          preloadFires++;
          let m;
          while ((m = preloadFileRe.exec(text)) !== null) {
            preloadFiles.set(m[1], (preloadFiles.get(m[1]) || 0) + 1);
          }
        }
        if (isReminder) continue;
        if (correctionRe.test(text)) corrections++;
        if (triggerRe.test(text)) preloadKeywordHits++;
      }
    } catch {}
  }
  return { userMsgs, assistantMsgs, toolCalls, errors, corrections, preloadFires, preloadFiles, preloadKeywordHits };
}

function getGoalsTouchedToday() {
  try {
    if (!fs.existsSync(GOALS_FILE)) return [];
    const content = fs.readFileSync(GOALS_FILE, 'utf8');
    const today = new Date().toISOString().slice(0, 10);
    const re = /\[goal:: (.+?)\].*?\[touched:: (.+?)\]/g;
    const out = [];
    let m;
    while ((m = re.exec(content)) !== null) {
      if (m[2].trim() === today) out.push(m[1].trim());
    }
    return out;
  } catch { return []; }
}

function getCommits() {
  try {
    const log = execSync('git -C "' + CLAUDE_DIR + '" log --oneline --since="6 hours ago"',
      { encoding: 'utf8', timeout: 3000 }).trim();
    return log ? log.split('\n') : [];
  } catch { return []; }
}

const stats = analyzeTranscript(transcriptPath);
if (stats.userMsgs + stats.assistantMsgs < MIN_TURNS) process.exit(0);

const commits = getCommits();
const goalsTouched = getGoalsTouchedToday();
const now = new Date().toISOString().slice(0, 16);

const out = [`\n## ${now}`, ''];
out.push(`**Session:** ${stats.userMsgs} user, ${stats.assistantMsgs} assistant, ${stats.toolCalls} tool calls`);
if (stats.errors > 0) out.push(`**Errors:** ${stats.errors}`);
if (stats.corrections > 0) out.push(`**Corrections:** ${stats.corrections}`);
if (commits.length > 0) {
  out.push(`**Commits (~6h):** ${commits.length}`);
  commits.forEach(c => out.push(`- ${c}`));
}
if (goalsTouched.length > 0) out.push(`**Goals progressed:** ${goalsTouched.join(', ')}`);

// Knowledge usage telemetry (pre-task-loader effectiveness)
if (stats.preloadKeywordHits > 0 || stats.preloadFires > 0) {
  const filesList = [...stats.preloadFiles.entries()]
    .map(([f, n]) => `${path.basename(f)}${n > 1 ? `(${n}x)` : ''}`).join(', ');
  out.push(`**Knowledge:** preload fired ${stats.preloadFires} time(s)${filesList ? ` — ${filesList}` : ''}, ${stats.preloadKeywordHits} keyword-hit(s) in user prompts`);
}

const ind = [];
if (stats.errors === 0) ind.push('✅ no errors');
else if (stats.errors > 2) ind.push(`⚠️ ${stats.errors} errors`);
if (stats.corrections === 0) ind.push('✅ no corrections');
else if (stats.corrections > 1) ind.push(`⚠️ ${stats.corrections} corrections`);
if (commits.length > 0) ind.push(`✅ ${commits.length} commits`);
else if (stats.toolCalls > 10) ind.push('⚠️ work without commits');
// Trigger gap: keywords present but loader didn't fire — adjust pre-task-loader.js RULES
if (stats.preloadKeywordHits >= 2 && stats.preloadFires === 0) {
  ind.push(`⚠️ preload missed (${stats.preloadKeywordHits} keyword-hits, 0 fires) — review pre-task-loader RULES`);
}
out.push(`**Quality:** ${ind.join(', ')}`);
out.push('');

try {
  if (!fs.existsSync(REFLECTION_LOG)) {
    const dir = path.dirname(REFLECTION_LOG);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(REFLECTION_LOG, `---\ntype: reflection-log\ntags: [arkhos, reflection, quality]\ncreated: ${now.slice(0, 10)}\n---\n\n# Reflection Log\n\nАвтоматический журнал рефлексии после каждой сессии.\n`);
  }
  fs.appendFileSync(REFLECTION_LOG, out.join('\n'));
  if (sessionId) saveState({ lastSessionId: sessionId, lastEmit: Date.now() });
  console.log(`[REFLECTION] ${stats.userMsgs}/${stats.assistantMsgs} msgs, ${stats.errors} errors, ${commits.length} commits, preload ${stats.preloadFires}/${stats.preloadKeywordHits}`);
} catch (e) {
  console.error(`[REFLECTION] failed: ${e.message}`);
}
