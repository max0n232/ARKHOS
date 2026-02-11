const fs = require('fs');
const path = require('path');

const CLAUDE_DIR = path.join(process.env.USERPROFILE || process.env.HOME, '.claude');

const CONFIG = {
  debug: { maxAgeDays: 30, dir: 'debug' },
  todos: { maxAgeDays: 60, dir: 'todos' },
  shellSnapshots: { maxAgeDays: 7, dir: 'shell-snapshots' },
  pluginCache: { maxAgeDays: 30, dir: 'plugins/cache' }
};

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
          freed += stat.isDirectory()
            ? getDirSize(itemPath)
            : stat.size;
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

function getDirSize(dir) {
  let size = 0;
  try {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);
      size += stat.isDirectory() ? getDirSize(itemPath) : stat.size;
    }
  } catch (e) {}
  return size;
}

function cleanGarbageFiles() {
  let deleted = 0, freed = 0;
  try {
    const items = fs.readdirSync(CLAUDE_DIR);
    for (const item of items) {
      if (item.startsWith('C:') || item.startsWith('Users') || item === 'nul') {
        const itemPath = path.join(CLAUDE_DIR, item);
        try {
          const stat = fs.statSync(itemPath);
          freed += stat.size;
          fs.rmSync(itemPath, { force: true });
          deleted++;
        } catch (e) {}
      }
    }
  } catch (e) {}
  return { deleted, freed };
}

// Run cleanup
let totalDeleted = 0, totalFreed = 0;

// Clean garbage files first
const garbageResult = cleanGarbageFiles();
if (garbageResult.deleted > 0) {
  console.log(`[cleanup] garbage: deleted ${garbageResult.deleted} files (${(garbageResult.freed/1024).toFixed(1)}KB)`);
  totalDeleted += garbageResult.deleted;
  totalFreed += garbageResult.freed;
}

// Clean old files by category
for (const [name, config] of Object.entries(CONFIG)) {
  const result = cleanOldFiles(name, config);
  totalDeleted += result.deleted;
  totalFreed += result.freed;
  if (result.deleted > 0) {
    console.log(`[cleanup] ${name}: deleted ${result.deleted} items (${(result.freed/1024).toFixed(1)}KB)`);
  }
}

if (totalDeleted > 0) {
  console.log(`[cleanup] Total: ${totalDeleted} items, ${(totalFreed/1024/1024).toFixed(2)}MB freed`);
} else {
  console.log('[cleanup] Nothing to clean');
}
