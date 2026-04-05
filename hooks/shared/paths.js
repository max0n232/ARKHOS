/**
 * Shared path constants for all hooks.
 * Single source of truth — no hardcoded paths in individual hooks.
 */
const path = require('path');

const CLAUDE_DIR = path.join(process.env.HOME || process.env.USERPROFILE, '.claude');
const QMD = '/c/Users/sorte/.bun/install/global/node_modules/@tobilu/qmd/bin/qmd';
const VAULT_DIR = 'C:/Users/sorte/ObsidianVault';
const CAPSULE_PATH = path.join(CLAUDE_DIR, 'memory', 'session', 'capsule.json');

module.exports = { CLAUDE_DIR, QMD, VAULT_DIR, CAPSULE_PATH };
