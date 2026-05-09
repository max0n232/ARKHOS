#!/usr/bin/env node
/**
 * Ghost stop wrapper with sidecar-flag dedup.
 *
 * Why: Stop hook observed firing twice within ~10ms (raw session shows two
 * `_turn completed: <ts1>_` and `_turn completed: <ts2>_` blocks with diff
 * stat duplicated). Ghost's appendTurnDelimiter has no dedup at all.
 *
 * Fix: a turn-delimiter write within DEDUP_WINDOW_MS of the last one is a
 * harness double-fire — skip. Real consecutive turns are minutes apart, so
 * 4-second window is safe.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

const FLAG = path.join(os.homedir(), '.claude', 'hooks', '.ghost-last-stop');
const GHOST = 'C:/Users/sorte/.bun/install/global/node_modules/ghost/ghost';
const DEDUP_WINDOW_MS = 4000;

let stdinRaw = '';
try { stdinRaw = fs.readFileSync(0, 'utf8'); } catch {}

try {
  const last = JSON.parse(fs.readFileSync(FLAG, 'utf8'));
  if (Date.now() - last.ts < DEDUP_WINDOW_MS) {
    process.exit(0);
  }
} catch {}
try { fs.writeFileSync(FLAG, JSON.stringify({ ts: Date.now() })); } catch {}

const child = spawn('bash', [GHOST, 'stop'], { stdio: ['pipe', 'inherit', 'inherit'] });
child.stdin.write(stdinRaw);
child.stdin.end();
child.on('error', () => process.exit(0));
child.on('exit', code => process.exit(code || 0));
