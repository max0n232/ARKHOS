#!/usr/bin/env node
const { execFileSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = 'C:/Users/sorte';
const claudeDir = path.join(root, '.claude');
const script = path.join(root, 'ObsidianVault', '10-Projects', 'ARKHOS', 'tools', 'check-drift.ps1');
const stateFile = path.join(claudeDir, 'hooks', 'maintenance', '.drift-check-state.json');
const intervalHours = 6;
const codexIntervalHours = 24;

function readState() {
  try { return JSON.parse(fs.readFileSync(stateFile, 'utf8')); }
  catch { return { lastRun: 0, lastCodexRun: 0 }; }
}

function writeState(state) {
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
}

function runCodexValidation(driftOutput) {
  const findings = driftOutput
    .split('\n')
    .filter(l => l.startsWith('- '))
    .slice(0, 20)
    .map(l => l.slice(2).trim())
    .join('\n');
  if (!findings) return;

  const prompt =
    'ARKHOS architecture drift check found discrepancies between settings.json and vault docs. ' +
    'For each finding below, classify as DOC_STALE (config changed, docs lag behind), ' +
    'REAL_DRIFT (unexpected config divergence needing investigation), or ' +
    'FALSE_POSITIVE (string mismatch but logic is semantically correct). ' +
    'One line per finding.\n\nFindings:\n' + findings;

  // Pass prompt via stdin to avoid shell injection and argument-splitting on Windows.
  // 'codex exec -' reads prompt from stdin when first arg is '-'.
  const result = spawnSync('cmd', ['/c', 'codex', 'exec', '-'], {
    input: prompt,
    encoding: 'utf8',
    shell: false,
    timeout: 75000,
  });

  const verdict = (result.stdout || '').trim();
  const err = (result.stderr || '').trim();

  if (result.error && result.error.code === 'ETIMEDOUT') {
    process.stdout.write('\n[CODEX VALIDATION] timeout after 75s\n');
  } else if (verdict) {
    process.stdout.write('\n[CODEX VALIDATION]\n' + verdict + '\n');
  } else {
    process.stdout.write('\n[CODEX VALIDATION] unavailable: ' + (err || 'no output').split('\n')[0] + '\n');
  }
}

const force = process.argv.includes('--force');
const now = Date.now();
const state = readState();
if (!force && now - state.lastRun < intervalHours * 3600 * 1000) {
  process.exit(0);
}

try {
  const out = execFileSync('powershell', [
    '-NoProfile',
    '-ExecutionPolicy',
    'Bypass',
    '-File',
    script,
  ], { encoding: 'utf8', timeout: 30000 });
  writeState({ ...state, lastRun: now, lastOk: true, lastOutput: out.trim().slice(0, 1000) });
  process.stdout.write(out);
} catch (error) {
  const output = (error.stdout || error.stderr || error.message || String(error)).toString();
  const codexDue = (now - (state.lastCodexRun || 0)) >= codexIntervalHours * 3600 * 1000;
  writeState({ ...state, lastRun: now, lastOk: false, lastOutput: output.slice(0, 1000) });
  process.stdout.write(output);
  if (output.includes('[DRIFT] FAIL') && (force || codexDue)) {
    runCodexValidation(output);
    writeState({ ...state, lastRun: now, lastOk: false, lastCodexRun: now, lastOutput: output.slice(0, 1000) });
  }
  process.exit(error.status || 1);
}
