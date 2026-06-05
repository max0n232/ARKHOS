#!/usr/bin/env node
/**
 * Stop Hook: Atlas Staleness — remind to refresh the ARKHOS Atlas L1 map.
 *
 * Narrow and complementary to the Stop prompt-hook CHECK 3/5 (changelog /
 * observation): those catch infra *edits* via the transcript. This catches
 * one thing they don't — the Atlas diagram being OLDER than its source files
 * (mtime comparison, deterministic, no LLM, no transcript parsing).
 *
 * If any Atlas source is newer than the generated diagram → print a reminder
 * to stdout (Stop-hook stdout surfaces to the user). Throttled per session.
 *
 * Sources mirror gen-atlas.js: atlas-health.json, settings.json, agents/*.md,
 * skills/REGISTRY.md, and the maintenance hooks dir (orphan detection input).
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { CLAUDE_DIR, VAULT_DIR } = require('../shared/paths');
const { appendLedger } = require('../shared/ledger');

// Two render targets share one source (atlas-health.json). The interactive
// Cytoscape graph (atlas-graph.json) is primary; the Excalidraw is a fallback.
// Staleness = the OLDER of the two render outputs vs sources (so a stale either
// triggers the reminder — both should be regenerated together via /atlas).
const ATLAS_GRAPH = path.join(VAULT_DIR, '10-Projects/ARKHOS/diagrams/atlas-graph.json');
const ATLAS_EXCALI = path.join(VAULT_DIR, '10-Projects/ARKHOS/diagrams/arkhos-atlas.excalidraw.md');
// ALL files the two generators write — the full backup/restore set (Law 1/8: restore must cover
// everything regen touches, else a partial failure desyncs unbacked outputs). gen-atlas-graph.js
// writes graph.json + atlas.html + atlas-brain.html; gen-atlas.js writes the excalidraw.md.
const ATLAS_HTML = path.join(VAULT_DIR, '10-Projects/ARKHOS/diagrams/atlas.html');
const ATLAS_BRAIN_HTML = path.join(VAULT_DIR, '10-Projects/ARKHOS/diagrams/atlas-brain.html');
const REGEN_OUTPUTS = [ATLAS_GRAPH, ATLAS_EXCALI, ATLAS_HTML, ATLAS_BRAIN_HTML];
const STATE_FILE = path.join(CLAUDE_DIR, 'hooks/stop/.atlas-staleness-state.json');
const THROTTLE_MS = 6 * 60 * 60 * 1000; // remind at most once per 6h

// GRAPH sources: the two interactive/Excalidraw renders are a PURE FUNCTION of these (no manual
// step) → safe to auto-regenerate. BRAIN sources: regenerating atlas-brain.html needs the heavy
// GLB pipeline (manual) → if one of THESE changed, we detect-only (never auto-run the brain build).
const GRAPH_SOURCES = [
  path.join(VAULT_DIR, '90-System/scripts/atlas-health.json'),
  path.join(VAULT_DIR, '90-System/scripts/gen-atlas.js'),
  path.join(VAULT_DIR, '90-System/scripts/gen-atlas-graph.js'),
  path.join(CLAUDE_DIR, 'settings.json'),
  path.join(CLAUDE_DIR, 'skills/REGISTRY.md'),
  path.join(CLAUDE_DIR, 'agents'),
  path.join(CLAUDE_DIR, 'hooks'), // orphan-detection input — adding/removing a hook changes computed health
];
const BRAIN_SOURCES = [
  path.join(VAULT_DIR, '90-System/scripts/atlas-brain/shell.html'),
  path.join(VAULT_DIR, '90-System/scripts/atlas-brain/brain.glb'),
  path.join(VAULT_DIR, '90-System/scripts/atlas-brain/generate.js'),
];
const SOURCES = [...GRAPH_SOURCES, ...BRAIN_SOURCES];
const GEN_GRAPH = path.join(VAULT_DIR, '90-System/scripts/gen-atlas-graph.js');
const GEN_EXCALI = path.join(VAULT_DIR, '90-System/scripts/gen-atlas.js');
const SCRIPTS_DIR = path.join(VAULT_DIR, '90-System/scripts');

// Recursively find the newest mtime under a path (file or dir). Covers nested
// hooks/ subdirs (session-start, maintenance, stop, …) so a new hook anywhere
// triggers the staleness check.
function mtime(p) {
  try {
    const st = fs.statSync(p);
    if (st.isDirectory()) {
      return fs.readdirSync(p).reduce((mx, f) => Math.max(mx, mtime(path.join(p, f))), st.mtimeMs);
    }
    return st.mtimeMs;
  } catch { return 0; }
}

function loadState() { try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); } catch { return {}; } }
function saveState(s) { try { fs.writeFileSync(STATE_FILE, JSON.stringify(s)); } catch {} }

// Back up ALL regen outputs to logs/rollback/ BEFORE regenerating (Law 1/8 — restore must cover
// every file the generators write, or a partial failure leaves unbacked outputs desynced).
// Returns the backup dir, or null if nothing to back up.
function backupRenders(now) {
  const dir = path.join(CLAUDE_DIR, 'logs', 'rollback', `atlas-${now}`);
  try { fs.mkdirSync(dir, { recursive: true }); } catch {}
  let any = false;
  for (const f of REGEN_OUTPUTS) {
    try { if (fs.existsSync(f)) { fs.copyFileSync(f, path.join(dir, path.basename(f))); any = true; } } catch {}
  }
  return any ? dir : null;
}
function restoreRenders(dir) {
  if (!dir) return;
  for (const f of REGEN_OUTPUTS) {
    const b = path.join(dir, path.basename(f));
    try { if (fs.existsSync(b)) fs.copyFileSync(b, f); } catch {}
  }
}

function main() {
  // Use the OLDER render output as the staleness yardstick. If neither exists,
  // Atlas was never generated — not this hook's job to nag about a first build.
  const gM = mtime(ATLAS_GRAPH), eM = mtime(ATLAS_EXCALI);
  if (!gM && !eM) return;
  const atlasM = Math.min(gM || Infinity, eM || Infinity);

  const newerGraph = GRAPH_SOURCES.filter(s => mtime(s) > atlasM).map(s => path.basename(s));
  const newerBrain = BRAIN_SOURCES.filter(s => mtime(s) > atlasM).map(s => path.basename(s));
  if (newerGraph.length === 0 && newerBrain.length === 0) return;

  const state = loadState();
  const now = Date.now();
  if (state.lastEmit && (now - state.lastEmit) < THROTTLE_MS) return;
  saveState({ lastEmit: now });

  // CLOSE THE LOOP: the graph/Excalidraw renders are pure functions of GRAPH_SOURCES → auto-regen.
  // A2 boundary: writes machine-GENERATED vault artifacts (not knowledge) — labeled target so the
  // user sees every autonomous vault write in the weekly report. Backup→regen→restore-on-failure.
  if (newerGraph.length > 0) {
    const backup = backupRenders(now);
    try {
      execFileSync('node', [GEN_GRAPH], { cwd: SCRIPTS_DIR, timeout: 60000, stdio: 'pipe' });
      execFileSync('node', [GEN_EXCALI], { cwd: SCRIPTS_DIR, timeout: 60000, stdio: 'pipe' });
      appendLedger({
        key: `atlas-staleness:graph-regen`, hook: 'atlas-staleness', kind: 'acted', severity: 'info',
        action: 'atlas-regen',
        title: `Atlas renders auto-regenerated (stale vs: ${newerGraph.join(', ')})`,
        detail: { sources: newerGraph, backup, target: 'vault-generated-artifact' },
      });
      console.log(`[ATLAS] auto-regenerated renders (was older than: ${newerGraph.join(', ')})`);
    } catch (e) {
      // Generator failed (process.exit(1) on bad input) → restore backup, downgrade to detect-only.
      restoreRenders(backup);
      appendLedger({
        key: `atlas-staleness:graph-regen-failed`, hook: 'atlas-staleness', kind: 'detected', severity: 'warn',
        title: `Atlas auto-regen FAILED — run /atlas manually`,
        detail: { error: (e.message || '').slice(0, 200), sources: newerGraph, restoredFrom: backup },
      });
      console.log(`[ATLAS STALE] auto-regen failed (${(e.message||'').split('\n')[0]}) — backup restored, run /atlas`);
    }
  }

  // DETECT-ONLY: brain render needs the heavy manual GLB pipeline — never auto-run it.
  if (newerBrain.length > 0) {
    appendLedger({
      key: `atlas-staleness:brain`, hook: 'atlas-staleness', kind: 'detected', severity: 'info',
      title: `Atlas BRAIN render stale (sources: ${newerBrain.join(', ')}) — rerun brain pipeline`,
      detail: { sources: newerBrain, target: 'vault-generated-artifact' },
    });
    console.log(`[ATLAS STALE] brain render older than: ${newerBrain.join(', ')} — rerun atlas-brain/generate.js (manual GLB pipeline).`);
  }
}

try { main(); } catch (e) { process.stderr.write(`atlas-staleness: ${e.message}\n`); }
