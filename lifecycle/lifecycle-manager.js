#!/usr/bin/env node
/**
 * File Lifecycle Manager for Claude CLI
 *
 * Manages file TTL, LRU eviction, access tracking, and automatic cleanup.
 * No external dependencies - pure Node.js.
 */

const fs = require('fs');
const path = require('path');

const CLAUDE_DIR = path.join(process.env.HOME || process.env.USERPROFILE, '.claude');
const METADATA_PATH = path.join(CLAUDE_DIR, 'lifecycle', 'metadata.json');

const DEFAULT_CONFIG = {
    maxTotalSize: 2 * 1024 * 1024 * 1024,
    defaultTTL: {
        temp: 1,
        session: 7,
        debug: 3,
        user: 30,
        system: null
    },
    lru: {
        enabled: true,
        maxFiles: 1000,
        triggerThreshold: 1.5 * 1024 * 1024 * 1024
    },
    categories: {
        temp: {
            patterns: ['shell-snapshots/**', 'ide/*.lock', 'statsig/**', 'cache/**'],
            ttl_days: 1,
            priority: 'temp',
            deletable: true
        },
        session: {
            patterns: ['projects/**/*.jsonl', 'projects/**/subagents/**', 'projects/**/tool-results/**', 'session-env/**'],
            ttl_days: 7,
            priority: 'normal',
            deletable: true
        },
        debug: {
            patterns: ['debug/**', 'telemetry/**', 'security/audit/**'],
            ttl_days: 3,
            priority: 'normal',
            deletable: true
        },
        todos: {
            patterns: ['todos/**'],
            ttl_days: 14,
            priority: 'normal',
            deletable: true
        },
        projects: {
            patterns: ['projects/**'],
            ttl_days: 30,
            priority: 'normal',
            deletable: true
        },
        archive: {
            patterns: ['plans/archive/**'],
            ttl_days: 90,
            priority: 'normal',
            deletable: true,
            max_files: 20
        },
        user: {
            patterns: ['memory/**', 'knowledge/**', 'plans/**', 'history.jsonl'],
            ttl_days: 90,
            priority: 'normal',
            deletable: false,
            requires_confirmation: true
        },
        system: {
            patterns: ['settings.json', 'projects.json', 'CLAUDE.md', 'ARCHITECTURE.md', 'skills/**', 'security/**', 'lifecycle/**', 'n8n-hub/**', 'db/**'],
            ttl_days: null,
            priority: 'critical',
            deletable: false
        },
        plugins: {
            patterns: ['plugins/**'],
            ttl_days: null,
            priority: 'critical',
            deletable: false
        }
    }
};

class FileLifecycleManager {
    constructor() {
        this.claudeDir = CLAUDE_DIR;
        this.config = DEFAULT_CONFIG;
        this.metadata = this.loadMetadata();
    }

    loadMetadata() {
        try {
            if (fs.existsSync(METADATA_PATH)) {
                return JSON.parse(fs.readFileSync(METADATA_PATH, 'utf-8'));
            }
        } catch (e) {}
        return this.createEmptyMetadata();
    }

    createEmptyMetadata() {
        return {
            version: '1.0.0',
            lastScan: null,
            files: {},
            stats: { total_files: 0, total_size_bytes: 0, by_category: {}, cleanups: [] }
        };
    }

    saveMetadata() {
        try {
            const dir = path.dirname(METADATA_PATH);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(METADATA_PATH, JSON.stringify(this.metadata, null, 2));
        } catch (e) {
            console.error(`Save error: ${e.message}`);
        }
    }

    matchGlob(filePath, pattern) {
        const np = filePath.replace(/\\/g, '/');
        const regex = pattern
            .replace(/\./g, '\\.')           // Escape dots FIRST
            .replace(/\*\*/g, '<<<GLOB>>>')  // Temp placeholder for **
            .replace(/\*/g, '[^/]*')         // Single * = any except /
            .replace(/<<<GLOB>>>/g, '.*');   // ** = any including /
        return new RegExp(`^${regex}$`).test(np);
    }

    categorizeFile(relativePath) {
        for (const [category, config] of Object.entries(this.config.categories)) {
            for (const pattern of config.patterns) {
                if (this.matchGlob(relativePath, pattern)) {
                    return { category, ...config };
                }
            }
        }
        return { category: 'unknown', ttl_days: 30, priority: 'normal', deletable: true };
    }

    scanDirectory(dir, baseDir = dir) {
        const files = [];
        try {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    if (!['node_modules', '.git'].includes(entry.name)) {
                        files.push(...this.scanDirectory(fullPath, baseDir));
                    }
                } else {
                    const stats = fs.statSync(fullPath);
                    files.push({
                        path: path.relative(baseDir, fullPath).replace(/\\/g, '/'),
                        fullPath,
                        size: stats.size,
                        created: stats.birthtime,
                        modified: stats.mtime,
                        accessed: stats.atime
                    });
                }
            }
        } catch (e) {}
        return files;
    }

    fullScan() {
        const files = this.scanDirectory(this.claudeDir);
        const now = new Date();
        const newFiles = {};
        const stats = { total_files: 0, total_size_bytes: 0, by_category: {} };

        for (const file of files) {
            const catInfo = this.categorizeFile(file.path);
            const existing = this.metadata.files[file.path];

            let expires_at = null;
            if (catInfo.ttl_days !== null) {
                expires_at = new Date(file.created.getTime() + catInfo.ttl_days * 24 * 60 * 60 * 1000);
            }

            const accessCount = existing?.access_count || 0;
            const lastAccessed = existing?.last_accessed || file.accessed.toISOString();
            const frecency = this.calculateFrecency(accessCount, lastAccessed);
            const autoPriority = this.frecencyToPriority(frecency, catInfo.priority);

            newFiles[file.path] = {
                created_at: file.created.toISOString(),
                last_accessed: lastAccessed,
                access_count: accessCount,
                size_bytes: file.size,
                ttl_days: catInfo.ttl_days,
                expires_at: expires_at?.toISOString() || null,
                priority: catInfo.priority,
                category: catInfo.category,
                deletable: catInfo.deletable,
                requires_confirmation: catInfo.requires_confirmation || false,
                frecency: frecency,
                auto_priority: autoPriority
            };

            stats.total_files++;
            stats.total_size_bytes += file.size;
            if (!stats.by_category[catInfo.category]) {
                stats.by_category[catInfo.category] = { count: 0, size: 0 };
            }
            stats.by_category[catInfo.category].count++;
            stats.by_category[catInfo.category].size += file.size;
        }

        this.metadata.files = newFiles;
        this.metadata.stats = { ...this.metadata.stats, ...stats };
        this.metadata.lastScan = now.toISOString();
        this.saveMetadata();
        return stats;
    }

    recordAccess(relativePath) {
        if (this.metadata.files[relativePath]) {
            const meta = this.metadata.files[relativePath];
            meta.last_accessed = new Date().toISOString();
            meta.access_count++;
            meta.frecency = this.calculateFrecency(meta.access_count, meta.last_accessed);
            meta.auto_priority = this.frecencyToPriority(meta.frecency, meta.priority);
            this.saveMetadata();
            this.syncToDatabase(relativePath, meta);
        }
    }

    /**
     * Sync file access to database for cross-session tracking
     */
    syncToDatabase(relativePath, meta) {
        try {
            const dbManagerPath = path.join(this.claudeDir, 'db', 'db-manager.js');
            if (fs.existsSync(dbManagerPath)) {
                const { manager } = require(dbManagerPath);
                const sessionId = process.env.CLAUDE_SESSION_ID;
                if (sessionId && manager.initialized) {
                    manager.logEvent(sessionId, 'file_access', {
                        path: relativePath,
                        frecency: meta.frecency,
                        category: meta.category
                    });
                }
            }
        } catch (e) {
            // Database not available or not initialized - silently skip
        }
    }

    /**
     * Calculate frecency score (0-1)
     * Based on GitHub Copilot and Dropbox ML approaches
     */
    calculateFrecency(accessCount, lastAccessed) {
        const now = Date.now();
        const lastAccessedMs = new Date(lastAccessed).getTime();
        const daysSinceAccess = (now - lastAccessedMs) / (24 * 60 * 60 * 1000);

        // Recency score: 1.0 if accessed today, 0 if 30+ days ago
        const recencyScore = Math.max(0, 30 - daysSinceAccess) / 30;

        // Frequency score: normalized, cap at 100 accesses
        const frequencyScore = Math.min(accessCount, 100) / 100;

        // Weighted combination: recency is more important (60/40)
        return (recencyScore * 0.6) + (frequencyScore * 0.4);
    }

    /**
     * Convert frecency to auto-priority
     */
    frecencyToPriority(frecency, basePriority) {
        // System/critical files stay critical regardless of frecency
        if (basePriority === 'critical') return 'critical';

        // Auto-assign based on frecency
        if (frecency > 0.7) return 'high';      // Very active - protect
        if (frecency > 0.4) return 'normal';    // Moderate - follow TTL
        if (frecency > 0.2) return 'low';       // Infrequent - candidate for cleanup
        return 'temp';                           // Rarely used - first to delete
    }

    getExpiredFiles() {
        const now = new Date();
        return Object.entries(this.metadata.files)
            .filter(([_, meta]) => meta.expires_at && meta.deletable && new Date(meta.expires_at) < now)
            .map(([path, meta]) => ({ path, ...meta }))
            .sort((a, b) => a.expires_at.localeCompare(b.expires_at));
    }

    getLRUCandidates(count = 100) {
        return Object.entries(this.metadata.files)
            .filter(([_, meta]) => meta.deletable && meta.priority !== 'critical' && meta.auto_priority !== 'high')
            .map(([path, meta]) => ({ path, ...meta, score: meta.frecency || this.lruScore(meta) }))
            .sort((a, b) => a.score - b.score)  // Lower frecency = first to delete
            .slice(0, count);
    }

    lruScore(meta) {
        // Fallback for files without frecency
        const now = Date.now();
        const lastAccessed = new Date(meta.last_accessed).getTime();
        const daysSince = (now - lastAccessed) / (24 * 60 * 60 * 1000);
        const priorityMult = { temp: 0.1, normal: 1, critical: 1000 }[meta.priority] || 1;
        return ((meta.access_count || 1) * 0.3 + Math.max(0, 30 - daysSince) * 0.7) * priorityMult;
    }

    deleteFiles(files, options = {}) {
        const { dryRun = false, skipConfirmation = false, trigger = 'manual' } = options;
        const results = { deleted: [], skipped: [], errors: [], freed_bytes: 0 };

        for (const file of files) {
            const filePath = typeof file === 'string' ? file : file.path;
            const meta = this.metadata.files[filePath];

            if (!meta) { results.skipped.push({ path: filePath, reason: 'not_tracked' }); continue; }
            if (meta.priority === 'critical') { results.skipped.push({ path: filePath, reason: 'critical' }); continue; }
            if (!meta.deletable) { results.skipped.push({ path: filePath, reason: 'not_deletable' }); continue; }
            if (meta.requires_confirmation && !skipConfirmation) { results.skipped.push({ path: filePath, reason: 'needs_confirm' }); continue; }

            if (dryRun) {
                results.deleted.push({ path: filePath, size: meta.size_bytes });
                results.freed_bytes += meta.size_bytes;
                continue;
            }

            try {
                fs.unlinkSync(path.join(this.claudeDir, filePath));
                results.deleted.push({ path: filePath, size: meta.size_bytes });
                results.freed_bytes += meta.size_bytes;
                delete this.metadata.files[filePath];
            } catch (e) {
                results.errors.push({ path: filePath, error: e.message });
            }
        }

        if (!dryRun && results.deleted.length > 0) {
            this.metadata.stats.cleanups = (this.metadata.stats.cleanups || []).slice(-99);
            this.metadata.stats.cleanups.push({
                timestamp: new Date().toISOString(),
                trigger,
                deleted_count: results.deleted.length,
                freed_bytes: results.freed_bytes
            });
            this.saveMetadata();
        }
        return results;
    }

    cleanupExpired(options = {}) {
        return this.deleteFiles(this.getExpiredFiles(), { ...options, trigger: 'ttl_expired' });
    }

    cleanupTemp(options = {}) {
        const temp = Object.entries(this.metadata.files)
            .filter(([_, m]) => m.category === 'temp' && m.deletable)
            .map(([p, m]) => ({ path: p, ...m }));
        return this.deleteFiles(temp, { ...options, trigger: 'temp_cleanup' });
    }

    cleanupLRU(options = {}) {
        const total = this.metadata.stats.total_size_bytes || 0;
        if (total < this.config.lru.triggerThreshold) {
            return { deleted: [], skipped: [], errors: [], freed_bytes: 0, reason: 'under_threshold' };
        }
        const target = this.config.lru.triggerThreshold * 0.8;
        const toFree = total - target;
        const candidates = this.getLRUCandidates(500);
        const toDelete = [];
        let acc = 0;
        for (const c of candidates) {
            if (acc >= toFree) break;
            toDelete.push(c);
            acc += c.size_bytes;
        }
        return this.deleteFiles(toDelete, { ...options, trigger: 'lru_eviction' });
    }

    /**
     * Cleanup archive files exceeding max_files limit
     * Uses frecency to decide which to keep
     */
    cleanupArchive(options = {}) {
        const archiveConfig = this.config.categories.archive;
        if (!archiveConfig || !archiveConfig.max_files) {
            return { deleted: [], skipped: [], errors: [], freed_bytes: 0, reason: 'no_limit' };
        }

        const archiveFiles = Object.entries(this.metadata.files)
            .filter(([_, m]) => m.category === 'archive')
            .map(([p, m]) => ({ path: p, ...m }))
            .sort((a, b) => (b.frecency || 0) - (a.frecency || 0));

        if (archiveFiles.length <= archiveConfig.max_files) {
            return { deleted: [], skipped: [], errors: [], freed_bytes: 0, reason: 'under_limit', current: archiveFiles.length, max: archiveConfig.max_files };
        }

        const toDelete = archiveFiles.slice(archiveConfig.max_files);
        return this.deleteFiles(toDelete, { ...options, trigger: 'archive_limit' });
    }

    getReport() {
        const expired = this.getExpiredFiles();
        const lru = this.getLRUCandidates(10);
        return {
            lastScan: this.metadata.lastScan,
            stats: this.metadata.stats,
            expired: { count: expired.length, size: expired.reduce((s, f) => s + f.size_bytes, 0) },
            lru_candidates: lru.length,
            recent_cleanups: (this.metadata.stats.cleanups || []).slice(-5)
        };
    }
}

module.exports = { FileLifecycleManager, DEFAULT_CONFIG };

if (require.main === module) {
    const args = process.argv.slice(2);
    const cmd = args[0];
    const manager = new FileLifecycleManager();

    const formatBytes = (b) => {
        const u = ['B', 'KB', 'MB', 'GB'];
        let s = b, i = 0;
        while (s >= 1024 && i < 3) { s /= 1024; i++; }
        return `${s.toFixed(2)} ${u[i]}`;
    };

    switch (cmd) {
        case 'scan':
            console.log('Scanning...');
            const stats = manager.fullScan();
            console.log(`Files: ${stats.total_files}, Size: ${formatBytes(stats.total_size_bytes)}`);
            for (const [cat, s] of Object.entries(stats.by_category)) {
                console.log(`  ${cat}: ${s.count} files (${formatBytes(s.size)})`);
            }
            break;
        case 'report':
            console.log(JSON.stringify(manager.getReport(), null, 2));
            break;
        case 'cleanup':
            const mode = args[1] || 'expired';
            const dryRun = args.includes('--dry-run');
            let result;
            if (mode === 'expired') result = manager.cleanupExpired({ dryRun });
            else if (mode === 'temp') result = manager.cleanupTemp({ dryRun });
            else if (mode === 'lru') result = manager.cleanupLRU({ dryRun });
            else if (mode === 'archive') result = manager.cleanupArchive({ dryRun });
            else if (mode === 'all') {
                result = {
                    expired: manager.cleanupExpired({ dryRun }),
                    temp: manager.cleanupTemp({ dryRun }),
                    lru: manager.cleanupLRU({ dryRun }),
                    archive: manager.cleanupArchive({ dryRun })
                };
            }
            console.log(JSON.stringify(result, null, 2));
            break;
        default:
            console.log('Usage: node lifecycle-manager.js <scan|report|cleanup [mode]> [--dry-run]');
            console.log('Modes: expired, temp, lru, archive, all');
    }
}
