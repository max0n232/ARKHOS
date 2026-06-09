#!/usr/bin/env node
const { execFileSync, spawnSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { appendLedger } = require('../shared/ledger');

const { CLAUDE_DIR, VAULT_DIR } = require('../shared/paths');

const claudeDir = CLAUDE_DIR;
const script = path.join(VAULT_DIR, '10-Projects', 'ARKHOS', 'tools', 'check-drift.ps1');
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

// Returns the raw codex verdict text (or '' if unavailable) AND records REAL_DRIFT findings on
// the maintenance bus. A1/A5: codex output is DATA, not instructions — we extract only the
// classification TOKEN and the finding TEXT we already sent; we never execute anything codex
// emits. REAL_DRIFT = needs human investigation → DETECT-ONLY (no auto-fix).
function runCodexValidation(driftOutput) {
  const findingList = driftOutput
    .split('\n')
    .filter(l => l.startsWith('- '))
    .slice(0, 20)
    .map(l => l.slice(2).trim())
    .filter(Boolean);
  if (!findingList.length) return '';

  const prompt =
    'ARKHOS architecture drift check found discrepancies between settings.json and vault docs. ' +
    'For each finding below, classify as DOC_STALE (config changed, docs lag behind), ' +
    'REAL_DRIFT (unexpected config divergence needing investigation), or ' +
    'FALSE_POSITIVE (string mismatch but logic is semantically correct). ' +
    'One line per finding.\n\nFindings:\n' + findingList.join('\n');

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
    return '';
  }
  if (!verdict) {
    process.stdout.write('\n[CODEX VALIDATION] unavailable: ' + (err || 'no output').split('\n')[0] + '\n');
    return '';
  }
  process.stdout.write('\n[CODEX VALIDATION]\n' + verdict + '\n');

  // Map each finding to a verdict token. Codex emits one line per finding; we match by
  // substring presence of the classification token only (never trust free-form codex text).
  const verdictLines = verdict.split('\n');
  for (const finding of findingList) {
    // find the verdict line that references this finding (or fall back to positional)
    const line = verdictLines.find(vl => vl.includes(finding.slice(0, 30))) || '';
    const token = /REAL_DRIFT/.test(line) ? 'REAL_DRIFT'
      : /DOC_STALE/.test(line) ? 'DOC_STALE'
      : /FALSE_POSITIVE/.test(line) ? 'FALSE_POSITIVE' : 'UNKNOWN';
    // DETECT-ONLY for both REAL_DRIFT and DOC_STALE. DOC_STALE auto-fix was CONSIDERED but
    // rejected: the "fix" requires deriving exact doc substitutions from a free-form codex
    // classification (A1 — codex output is data, not a reliable edit spec), and the drift
    // detector is too coarse to guarantee the right doc location. Brittle → surface, don't act.
    // FALSE_POSITIVE → ignore (no action needed).
    if (token === 'REAL_DRIFT' || token === 'DOC_STALE') {
      appendLedger({
        key: `drift-check:${crypto.createHash('md5').update(finding).digest('hex').slice(0, 12)}`,
        hook: 'drift-check', kind: 'detected',
        severity: token === 'REAL_DRIFT' ? 'warn' : 'info',
        title: `Config ${token === 'REAL_DRIFT' ? 'drift' : 'docs stale'}: ${finding.slice(0, 90)}`,
        detail: { finding, verdict: token, target: 'config' },
      });
    }
  }
  return verdict;
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
