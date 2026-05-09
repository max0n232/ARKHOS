#!/usr/bin/env node
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = 'C:/Users/sorte';
const claudeDir = path.join(root, '.claude');
const script = path.join(root, 'ObsidianVault', '10-Projects', 'ARKHOS', 'tools', 'check-drift.ps1');
const stateFile = path.join(claudeDir, 'hooks', 'maintenance', '.drift-check-state.json');
const intervalHours = 6;

function readState() {
  try { return JSON.parse(fs.readFileSync(stateFile, 'utf8')); }
  catch { return { lastRun: 0 }; }
}

function writeState(state) {
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
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
  writeState({ lastRun: now, lastOk: true, lastOutput: out.trim().slice(0, 1000) });
  process.stdout.write(out);
} catch (error) {
  const output = (error.stdout || error.stderr || error.message || String(error)).toString();
  writeState({ lastRun: now, lastOk: false, lastOutput: output.slice(0, 1000) });
  process.stdout.write(output);
  process.exit(error.status || 1);
}
