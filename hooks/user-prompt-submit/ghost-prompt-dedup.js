#!/usr/bin/env node
/**
 * Ghost prompt wrapper with sidecar-flag dedup.
 *
 * Why: Claude Code harness occasionally fires UserPromptSubmit chain twice
 * (race observed in raw session files: same `## Prompt N <!-- ph:HASH -->`
 * block written twice consecutively). Ghost's own appendPrompt dedup only
 * compares against LAST hash and races when both forks read empty file
 * (first prompt of session) or when both reach readFileSync before either
 * has flushed appendFileSync.
 *
 * Fix: forward stdin to `ghost prompt` only if the prompt-hash differs from
 * the last-seen hash within DEDUP_WINDOW_MS. Otherwise no-op.
 *
 * Side effect: identical prompts re-sent <3s apart are dropped. Acceptable
 * tradeoff — humans don't repeat the exact same prompt that fast.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { spawn } = require('child_process');

const FLAG = path.join(os.homedir(), '.claude', 'hooks', '.ghost-last-prompt');
const GHOST = 'C:/Users/sorte/.bun/install/global/node_modules/ghost/ghost';
const DEDUP_WINDOW_MS = 3000;

let stdinRaw = '';
try { stdinRaw = fs.readFileSync(0, 'utf8'); } catch {}

let promptHash = '';
try {
  const input = JSON.parse(stdinRaw);
  if (input && typeof input.prompt === 'string') {
    promptHash = crypto.createHash('sha256').update(input.prompt).digest('hex').slice(0, 16);
  }
} catch {}

if (promptHash) {
  try {
    const last = JSON.parse(fs.readFileSync(FLAG, 'utf8'));
    if (last.hash === promptHash && Date.now() - last.ts < DEDUP_WINDOW_MS) {
      process.exit(0);
    }
  } catch {}
  try { fs.writeFileSync(FLAG, JSON.stringify({ hash: promptHash, ts: Date.now() })); } catch {}
}

const child = spawn('bash', [GHOST, 'prompt'], { stdio: ['pipe', 'inherit', 'inherit'] });
child.stdin.write(stdinRaw);
child.stdin.end();
child.on('error', () => process.exit(0));
child.on('exit', code => process.exit(code || 0));
