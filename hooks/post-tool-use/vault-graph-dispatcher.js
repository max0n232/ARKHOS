#!/usr/bin/env node
/**
 * Vault Graph Dispatcher — PostToolUse wrapper.
 *
 * Reads PostToolUse stdin payload, extracts file_path from Edit/Write/MultiEdit events,
 * and invokes vault-graph-builder.js with --file <path> for incremental wikilink injection.
 *
 * Skips non-vault paths and non-markdown files. Per-file cooldown handled by builder itself.
 */

const path = require('path');
const { spawn } = require('child_process');
const { VAULT_DIR } = require('../shared/paths');

const RELEVANT_TOOLS = new Set(['Edit', 'Write', 'MultiEdit']);

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (c) => (data += c));
    process.stdin.on('end', () => resolve(data));
    setTimeout(() => resolve(data), 1500);
  });
}

(async () => {
  const raw = await readStdin();
  if (!raw) return;
  let payload;
  try { payload = JSON.parse(raw); } catch { return; }

  const tool = payload.tool_name || payload.tool;
  if (!RELEVANT_TOOLS.has(tool)) return;

  const filePath = payload.tool_input?.file_path
    || payload.tool_input?.notebook_path
    || payload.tool_response?.file_path;
  if (!filePath || !filePath.toLowerCase().endsWith('.md')) return;

  const abs = path.resolve(filePath);
  const vaultNorm = path.resolve(VAULT_DIR);
  if (!abs.toLowerCase().startsWith(vaultNorm.toLowerCase())) return;

  const builder = path.join(__dirname, '..', 'maintenance', 'vault-graph-builder.js');
  const child = spawn(process.execPath, [builder, '--file', abs], {
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
  });
  child.unref();
})();
