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
const { CLAUDE_DIR, VAULT_DIR } = require('../shared/paths');

// Two render targets share one source (atlas-health.json). The interactive
// Cytoscape graph (atlas-graph.json) is primary; the Excalidraw is a fallback.
// Staleness = the OLDER of the two render outputs vs sources (so a stale either
// triggers the reminder — both should be regenerated together via /atlas).
const ATLAS_GRAPH = path.join(VAULT_DIR, '10-Projects/ARKHOS/diagrams/atlas-graph.json');
const ATLAS_EXCALI = path.join(VAULT_DIR, '10-Projects/ARKHOS/diagrams/arkhos-atlas.excalidraw.md');
const STATE_FILE = path.join(CLAUDE_DIR, 'hooks/stop/.atlas-staleness-state.json');
const THROTTLE_MS = 6 * 60 * 60 * 1000; // remind at most once per 6h

const SOURCES = [
  path.join(VAULT_DIR, '90-System/scripts/atlas-health.json'),
  path.join(VAULT_DIR, '90-System/scripts/gen-atlas.js'),
  path.join(VAULT_DIR, '90-System/scripts/gen-atlas-graph.js'),
  // Metaphor render template — editing it means the generated brain .html is stale until /atlas.
  path.join(VAULT_DIR, '10-Projects/ARKHOS/diagrams/atlas-brain.template.html'),
  path.join(CLAUDE_DIR, 'settings.json'),
  path.join(CLAUDE_DIR, 'skills/REGISTRY.md'),
  path.join(CLAUDE_DIR, 'agents'),
  path.join(CLAUDE_DIR, 'hooks'), // orphan-detection input — adding/removing a hook changes computed health
];

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

function main() {
  // Use the OLDER render output as the staleness yardstick. If neither exists,
  // Atlas was never generated — not this hook's job to nag about a first build.
  const gM = mtime(ATLAS_GRAPH), eM = mtime(ATLAS_EXCALI);
  if (!gM && !eM) return;
  const atlasM = Math.min(gM || Infinity, eM || Infinity);

  const newer = SOURCES.filter(s => mtime(s) > atlasM)
    .map(s => path.basename(s));
  if (newer.length === 0) return;

  const state = loadState();
  const now = Date.now();
  if (state.lastEmit && (now - state.lastEmit) < THROTTLE_MS) return;

  saveState({ lastEmit: now });
  console.log(
    `[ATLAS STALE] ARKHOS Atlas is older than: ${newer.join(', ')}. ` +
    `Architecture changed since last map refresh — run \`/atlas\` to regenerate both renders ` +
    `(interactive atlas.html via gen-atlas-graph.js + Excalidraw fallback via gen-atlas.js). ` +
    `If a node's status changed on a remote (VPS/OAuth/n8n), also update atlas-health.json.overrides + verified date.`
  );
}

try { main(); } catch (e) { process.stderr.write(`atlas-staleness: ${e.message}\n`); }
