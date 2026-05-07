#!/usr/bin/env node
/**
 * Quirks Staleness Check — flags version-scoped quirks files when canonical
 * platform version (per MEMORY.md) drifts from the file's `version_scope`.
 *
 * Idempotent. Prepends/removes a banner inside the target file so the warning
 * is visible the next time auto-memory loads it. No state file, no DB.
 *
 * Consumer: Claude reads the banner via auto-memory load on next session.
 */

const fs = require('fs');
const path = require('path');
const { CLAUDE_DIR } = require('../shared/paths');

const MEMORY_DIR = path.join(CLAUDE_DIR, 'projects', 'C--Users-sorte--claude', 'memory');
const MEMORY_FILE = path.join(MEMORY_DIR, 'MEMORY.md');

const QUIRKS_TARGETS = [
  {
    file: path.join(MEMORY_DIR, 'reference_n8n_quirks.md'),
    platform: 'n8n',
    versionRegex: /n8n \*\*([\d.]+)\*\*/,
  },
  {
    file: path.join(MEMORY_DIR, 'reference_gemini_quirks.md'),
    platform: 'gemini-2.5-flash',
    versionRegex: /model `gemini-([\d.]+)-flash`/,
  },
];

const BANNER_OPEN = '<!-- quirks-staleness-banner -->';
const BANNER_CLOSE = '<!-- /quirks-staleness-banner -->';

function getCanonicalVersion(memoryText, regex) {
  const m = memoryText.match(regex);
  return m ? m[1] : null;
}

function getScope(fileText) {
  const fm = fileText.match(/^---\n([\s\S]*?)\n---/);
  if (!fm) return null;
  const m = fm[1].match(/^version_scope:\s*([\w.-]+)@([\w.-]+)\s*$/m);
  return m ? { platform: m[1], version: m[2] } : null;
}

function buildBanner(platform, scopedVersion, currentVersion) {
  return `${BANNER_OPEN}\n> [!warning] Quirks scoped to ${platform}@${scopedVersion} but MEMORY.md indicates current ${platform}@${currentVersion}. Verify entries before reuse — some may be stale.\n${BANNER_CLOSE}\n`;
}

function stripBanner(text) {
  const re = new RegExp(`${BANNER_OPEN}[\\s\\S]*?${BANNER_CLOSE}\\n?`);
  return text.replace(re, '');
}

function processFile(target, memoryText) {
  if (!fs.existsSync(target.file)) return null;
  const text = fs.readFileSync(target.file, 'utf8');
  const scope = getScope(text);
  const current = getCanonicalVersion(memoryText, target.versionRegex);
  if (!scope || !current) return null;

  const stripped = stripBanner(text);
  const stale = scope.version !== current;

  let next = stripped;
  if (stale) {
    const fmStart = stripped.indexOf('---');
    const fmEnd = stripped.indexOf('---', fmStart + 3);
    const insertPos = stripped.indexOf('\n', fmEnd + 3) + 1;
    next = stripped.slice(0, insertPos) + '\n' + buildBanner(target.platform, scope.version, current) + stripped.slice(insertPos);
  }

  if (next !== text) {
    fs.writeFileSync(target.file, next);
    return { file: path.basename(target.file), action: stale ? 'banner_added' : 'banner_removed', scope: scope.version, current };
  }
  return { file: path.basename(target.file), action: 'no_change', scope: scope.version, current };
}

function main() {
  if (!fs.existsSync(MEMORY_FILE)) return;
  const memText = fs.readFileSync(MEMORY_FILE, 'utf8');
  const results = QUIRKS_TARGETS.map(t => processFile(t, memText)).filter(Boolean);
  const stale = results.filter(r => r.action === 'banner_added');
  if (stale.length > 0) {
    console.log(`[QUIRKS-STALENESS] ${stale.length} file(s) scoped to outdated version:`);
    stale.forEach(r => console.log(`  ${r.file}: scoped ${r.scope} → current ${r.current}`));
  }
}

try { main(); } catch (e) { console.error('[QUIRKS-STALENESS] error:', e.message); }
