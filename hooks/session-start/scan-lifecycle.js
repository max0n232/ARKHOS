#!/usr/bin/env node
/**
 * SessionStart Hook: Periodic Scan
 *
 * Runs scan if needed (>24h since last) and warns about issues.
 */

const fs = require('fs');
const path = require('path');
const CLAUDE_DIR = path.join(process.env.HOME || process.env.USERPROFILE, '.claude');
const METADATA_PATH = path.join(CLAUDE_DIR, 'lifecycle', 'metadata.json');

function needsScan() {
    try {
        if (!fs.existsSync(METADATA_PATH)) return true;
        const meta = JSON.parse(fs.readFileSync(METADATA_PATH, 'utf-8'));
        if (!meta.lastScan) return true;
        const hours = (Date.now() - new Date(meta.lastScan).getTime()) / (1000 * 60 * 60);
        return hours > 24;
    } catch (e) {
        return true;
    }
}

async function sessionScan() {
    const result = { scan: false, warnings: [] };

    try {
        if (!needsScan()) {
            console.log(JSON.stringify(result));
            process.exit(0);
            return;
        }

        const { FileLifecycleManager } = require(path.join(CLAUDE_DIR, 'lifecycle', 'lifecycle-manager.js'));
        const manager = new FileLifecycleManager();
        const stats = manager.fullScan();
        result.scan = true;

        const gb = stats.total_size_bytes / (1024 ** 3);
        if (gb > 1.5) {
            result.warnings.push(`Size: ${gb.toFixed(2)}GB - consider cleanup`);
        }

        const expired = manager.getExpiredFiles();
        if (expired.length > 50) {
            result.warnings.push(`${expired.length} expired files pending`);
        }

    } catch (e) {
        result.error = e.message;
    }

    console.log(JSON.stringify(result));
    process.exit(0);
}

sessionScan().catch(() => process.exit(0));
