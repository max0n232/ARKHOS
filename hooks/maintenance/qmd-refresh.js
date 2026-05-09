#!/usr/bin/env node
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const base = 'C:/Users/sorte/.claude/hooks/maintenance';
const qmd = 'C:/Users/sorte/AppData/Roaming/npm/node_modules/@tobilu/qmd/dist/cli/qmd.js';
const stateFile = path.join(base, '.qmd-refresh-state.json');
const lockFile = path.join(base, '.qmd-refresh.lock');
const logFile = 'C:/Users/sorte/.claude/logs/qmd-refresh.log';

function log(line) {
  fs.appendFileSync(logFile, `${new Date().toISOString()} ${line}\n`);
}

function writeState(state) {
  fs.writeFileSync(stateFile, JSON.stringify({ ...state, updatedAt: new Date().toISOString() }, null, 2));
}

if (fs.existsSync(lockFile)) {
  const ageMs = Date.now() - fs.statSync(lockFile).mtimeMs;
  if (ageMs < 60 * 60 * 1000) {
    log('skip existing lock');
    process.exit(0);
  }
}

fs.writeFileSync(lockFile, String(process.pid));
log('refresh start');

try {
  const update = execFileSync('node', [qmd, 'update'], { encoding: 'utf8', timeout: 10 * 60 * 1000 });
  const needsEmbed = /need vectors/i.test(update) || !/0\s+updated|already up to date|no changes/i.test(update);
  let embed = '';
  if (needsEmbed) {
    embed = execFileSync('node', [qmd, 'embed'], { encoding: 'utf8', timeout: 30 * 60 * 1000 });
  }
  writeState({ ok: true, embed: needsEmbed, update: update.slice(-2000), embedOutput: embed.slice(-2000) });
  log(`refresh ok embed=${needsEmbed}`);
} catch (error) {
  const output = (error.stdout || error.stderr || error.message || String(error)).toString();
  writeState({ ok: false, error: output.slice(0, 2000) });
  log(`refresh fail ${output.slice(0, 500).replace(/\s+/g, ' ')}`);
  process.exit(error.status || 1);
} finally {
  try { fs.unlinkSync(lockFile); } catch {}
}
