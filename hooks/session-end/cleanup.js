#!/usr/bin/env node
/**
 * SessionEnd Hook: Automatic Cleanup
 *
 * Cleans up temp files and expired files when session ends.
 */

const path = require('path');
const CLAUDE_DIR = path.join(process.env.HOME || process.env.USERPROFILE, '.claude');

// Load lifecycle-manager with fallback
let FileLifecycleManager;
try {
    FileLifecycleManager = require(path.join(CLAUDE_DIR, 'lifecycle', 'lifecycle-manager.js')).FileLifecycleManager;
} catch (err) {
    console.error('Warning: lifecycle-manager not available, using basic cleanup');
    // Fallback: basic cleanup without lifecycle tracking
    FileLifecycleManager = class {
        constructor() {}

        cleanupTemp() {
            console.log('Basic cleanup: lifecycle-manager unavailable');
            return { deleted: [], freed_bytes: 0 };
        }

        cleanupExpired() {
            return { deleted: [], freed_bytes: 0 };
        }

        cleanupLRU() {
            return { deleted: [], freed_bytes: 0 };
        }
    };
}

async function sessionCleanup() {
    let input = '';
    for await (const chunk of process.stdin) {
        input += chunk;
    }

    const result = {
        timestamp: new Date().toISOString(),
        cleanup: { temp: 0, expired: 0, freed_bytes: 0 }
    };

    try {
        const manager = new FileLifecycleManager();

        // Cleanup temp files
        const tempResult = manager.cleanupTemp({ skipConfirmation: true });
        result.cleanup.temp = tempResult.deleted.length;
        result.cleanup.freed_bytes += tempResult.freed_bytes;

        // Cleanup expired files
        const expiredResult = manager.cleanupExpired({ skipConfirmation: true });
        result.cleanup.expired = expiredResult.deleted.length;
        result.cleanup.freed_bytes += expiredResult.freed_bytes;

        // Check LRU threshold
        const total = manager.metadata.stats.total_size_bytes || 0;
        if (total > manager.config.lru.triggerThreshold) {
            const lruResult = manager.cleanupLRU({ skipConfirmation: true });
            result.cleanup.lru = lruResult.deleted.length;
            result.cleanup.freed_bytes += lruResult.freed_bytes;
        }

    } catch (e) {
        result.error = e.message;
    }

    console.log(JSON.stringify(result));
    process.exit(0);
}

sessionCleanup().catch(() => process.exit(0));
