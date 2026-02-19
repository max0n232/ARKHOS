#!/usr/bin/env node
/**
 * SessionEnd Hook: Unified Cleanup
 *
 * Consolidates all cleanup functionality:
 * - Lifecycle-managed temp/expired files
 * - Age-based directory cleanup (debug, todos, shell-snapshots, plugins/cache, session-env)
 * - Garbage file removal (malformed filenames)
 * - LRU threshold enforcement
 */

const fs = require('fs');
const path = require('path');

const CLAUDE_DIR = path.join(process.env.USERPROFILE || process.env.HOME, '.claude');

// Age-based cleanup configuration (merged from auto-cleanup.js and cleanup.ps1)
const CLEANUP_CONFIG = {
  debug: { maxAgeDays: 7, dir: 'debug' },
  todos: { maxAgeDays: 30, dir: 'todos' },
  shellSnapshots: { maxAgeDays: 7, dir: 'shell-snapshots' },
  pluginCache: { maxAgeDays: 30, dir: 'plugins/cache' },
  sessionEnv: { maxAgeDays: 7, dir: 'session-env' }
};

// Load lifecycle-manager with fallback
let FileLifecycleManager;
try {
  FileLifecycleManager = require(path.join(CLAUDE_DIR, 'lifecycle', 'lifecycle-manager.js')).FileLifecycleManager;
} catch (err) {
  // Fallback: basic cleanup without lifecycle tracking
  FileLifecycleManager = class {
    constructor() {
      this.metadata = { stats: {} };
      this.config = { lru: { triggerThreshold: Infinity } };
    }
    cleanupTemp() { return { deleted: [], freed_bytes: 0 }; }
    cleanupExpired() { return { deleted: [], freed_bytes: 0 }; }
    cleanupLRU() { return { deleted: [], freed_bytes: 0 }; }
  };
}

/**
 * Calculate directory size recursively
 */
function getDirSize(dir) {
  let size = 0;
  try {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);
      size += stat.isDirectory() ? getDirSize(itemPath) : stat.size;
    }
  } catch (e) {
    // Directory inaccessible
  }
  return size;
}

/**
 * Clean files older than maxAgeDays in a directory
 */
function cleanOldFiles(name, config) {
  const targetDir = path.join(CLAUDE_DIR, config.dir);
  if (!fs.existsSync(targetDir)) return { deleted: 0, freed: 0 };

  const now = Date.now();
  const maxAge = config.maxAgeDays * 24 * 60 * 60 * 1000;
  let deleted = 0, freed = 0;

  try {
    const items = fs.readdirSync(targetDir);
    for (const item of items) {
      const itemPath = path.join(targetDir, item);
      try {
        const stat = fs.statSync(itemPath);
        if (now - stat.mtimeMs > maxAge) {
          freed += stat.isDirectory() ? getDirSize(itemPath) : stat.size;
          fs.rmSync(itemPath, { recursive: true, force: true });
          deleted++;
        }
      } catch (e) {
        // Skip inaccessible files
      }
    }
  } catch (e) {
    // Directory doesn't exist or inaccessible
  }
  return { deleted, freed };
}

/**
 * Remove garbage files with malformed names (Windows path artifacts)
 */
function cleanGarbageFiles() {
  let deleted = 0, freed = 0;
  try {
    const items = fs.readdirSync(CLAUDE_DIR);
    for (const item of items) {
      // Detect Windows path artifacts that shouldn't exist as filenames
      if (item.startsWith('C:') || item.startsWith('Users') || item === 'nul') {
        const itemPath = path.join(CLAUDE_DIR, item);
        try {
          const stat = fs.statSync(itemPath);
          freed += stat.isDirectory() ? getDirSize(itemPath) : stat.size;
          fs.rmSync(itemPath, { recursive: true, force: true });
          deleted++;
        } catch (e) {
          // Skip inaccessible
        }
      }
    }
  } catch (e) {
    // Directory inaccessible
  }
  return { deleted, freed };
}

/**
 * Main cleanup function
 */
async function sessionCleanup() {
  // Read stdin for hook input (required by Claude hooks protocol)
  let input = '';
  for await (const chunk of process.stdin) {
    input += chunk;
  }

  const result = {
    timestamp: new Date().toISOString(),
    cleanup: {
      lifecycle: { temp: 0, expired: 0, lru: 0 },
      ageBased: {},
      garbage: 0,
      freed_bytes: 0
    }
  };

  try {
    // 1. Lifecycle-managed cleanup (temp, expired, LRU)
    const manager = new FileLifecycleManager();

    const tempResult = manager.cleanupTemp({ skipConfirmation: true });
    result.cleanup.lifecycle.temp = tempResult.deleted?.length || 0;
    result.cleanup.freed_bytes += tempResult.freed_bytes || 0;

    const expiredResult = manager.cleanupExpired({ skipConfirmation: true });
    result.cleanup.lifecycle.expired = expiredResult.deleted?.length || 0;
    result.cleanup.freed_bytes += expiredResult.freed_bytes || 0;

    // Check LRU threshold
    const total = manager.metadata?.stats?.total_size_bytes || 0;
    if (total > (manager.config?.lru?.triggerThreshold || Infinity)) {
      const lruResult = manager.cleanupLRU({ skipConfirmation: true });
      result.cleanup.lifecycle.lru = lruResult.deleted?.length || 0;
      result.cleanup.freed_bytes += lruResult.freed_bytes || 0;
    }

    // 2. Age-based directory cleanup
    for (const [name, config] of Object.entries(CLEANUP_CONFIG)) {
      const ageResult = cleanOldFiles(name, config);
      if (ageResult.deleted > 0) {
        result.cleanup.ageBased[name] = ageResult.deleted;
        result.cleanup.freed_bytes += ageResult.freed;
      }
    }

    // 3. Garbage file cleanup
    const garbageResult = cleanGarbageFiles();
    result.cleanup.garbage = garbageResult.deleted;
    result.cleanup.freed_bytes += garbageResult.freed;

  } catch (e) {
    result.error = e.message;
  }

  // Output result as JSON for hook protocol
  console.log(JSON.stringify(result));
  process.exit(0);
}

sessionCleanup().catch(() => process.exit(0));
