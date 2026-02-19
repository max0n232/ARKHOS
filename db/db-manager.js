#!/usr/bin/env node
/**
 * Database Manager for Claude CLI
 *
 * Unified API for global.db, sessions.db, and project memory.db
 * No external dependencies - uses better-sqlite3 or sqlite3
 */

const fs = require('fs');
const path = require('path');

const CLAUDE_DIR = path.join(process.env.HOME || process.env.USERPROFILE, '.claude');
const DB_DIR = path.join(CLAUDE_DIR, 'db');
const GLOBAL_DB = path.join(DB_DIR, 'global.db');
const SESSIONS_DB = path.join(DB_DIR, 'sessions.db');

let Database;
try {
    Database = require('better-sqlite3');
} catch (e) {
    // Fallback message - user needs to install
    console.warn('better-sqlite3 not found. Run: npm install better-sqlite3');
    Database = null;
}

class DBManager {
    constructor() {
        this.connections = {};
        this.initialized = false;
    }

    /**
     * Initialize databases with schemas
     */
    init() {
        if (!Database) {
            console.error('SQLite not available');
            return false;
        }

        if (!fs.existsSync(DB_DIR)) {
            fs.mkdirSync(DB_DIR, { recursive: true });
        }

        // Initialize global.db
        const globalSchema = fs.readFileSync(path.join(DB_DIR, 'schema-global.sql'), 'utf-8');
        this.connections.global = new Database(GLOBAL_DB);
        this.connections.global.exec(globalSchema);

        // Initialize sessions.db
        const sessionsSchema = fs.readFileSync(path.join(DB_DIR, 'schema-sessions.sql'), 'utf-8');
        this.connections.sessions = new Database(SESSIONS_DB);
        this.connections.sessions.exec(sessionsSchema);

        this.initialized = true;
        return true;
    }

    /**
     * Get database connection
     */
    getDB(name) {
        if (!this.initialized) this.init();
        return this.connections[name];
    }

    /**
     * Connect to project memory.db
     */
    connectProject(projectPath) {
        const memoryDb = path.join(projectPath, 'knowledge', 'memory.db');
        if (fs.existsSync(memoryDb)) {
            this.connections.project = new Database(memoryDb);
            return true;
        }
        return false;
    }

    // ========== PATTERNS ==========

    /**
     * Add pattern to global.db
     */
    addPattern(pattern, category, sourceProject) {
        const db = this.getDB('global');
        const stmt = db.prepare(`
            INSERT INTO patterns (pattern, category, source_project, last_accessed)
            VALUES (?, ?, ?, datetime('now'))
        `);
        return stmt.run(pattern, category, sourceProject);
    }

    /**
     * Search patterns with hybrid scoring (FTS + frecency)
     */
    searchPatterns(query, limit = 10) {
        const db = this.getDB('global');
        const results = db.prepare(`
            SELECT p.*, bm25(patterns_fts) as fts_score
            FROM patterns_fts
            JOIN patterns p ON patterns_fts.rowid = p.id
            WHERE patterns_fts MATCH ?
            ORDER BY (bm25(patterns_fts) * 0.6 + p.frecency * 0.4) DESC
            LIMIT ?
        `).all(query, limit);
        return results;
    }

    /**
     * Update pattern frecency
     */
    touchPattern(id) {
        const db = this.getDB('global');
        const pattern = db.prepare('SELECT * FROM patterns WHERE id = ?').get(id);
        if (!pattern) return;

        const accessCount = pattern.access_count + 1;
        const frecency = this.calculateFrecency(accessCount, new Date().toISOString());

        db.prepare(`
            UPDATE patterns SET
                access_count = ?,
                last_accessed = datetime('now'),
                frecency = ?
            WHERE id = ?
        `).run(accessCount, frecency, id);
    }

    /**
     * Promote pattern if used across projects
     */
    checkPromotion(pattern, sourceProject) {
        const db = this.getDB('global');
        const existing = db.prepare(
            'SELECT source_project FROM patterns WHERE pattern = ?'
        ).get(pattern);

        if (existing && existing.source_project !== sourceProject) {
            db.prepare(`
                UPDATE patterns SET
                    category = 'cross-project',
                    access_count = access_count + 1,
                    frecency = MIN(1.0, frecency + 0.1)
                WHERE pattern = ?
            `).run(pattern);
            return true;
        }
        return false;
    }

    // ========== SESSIONS ==========

    /**
     * Start new session
     */
    startSession(sessionId, project) {
        const db = this.getDB('sessions');
        db.prepare(`
            INSERT INTO sessions (id, project, started_at)
            VALUES (?, ?, datetime('now'))
        `).run(sessionId, project);
        return sessionId;
    }

    /**
     * End session
     */
    endSession(sessionId, tokensUsed, summary) {
        const db = this.getDB('sessions');
        db.prepare(`
            UPDATE sessions SET
                ended_at = datetime('now'),
                tokens_used = ?,
                summary = ?
            WHERE id = ?
        `).run(tokensUsed, summary, sessionId);
    }

    /**
     * Log event
     */
    logEvent(sessionId, eventType, data) {
        const db = this.getDB('sessions');
        db.prepare(`
            INSERT INTO events (session_id, event_type, data)
            VALUES (?, ?, ?)
        `).run(sessionId, eventType, JSON.stringify(data));
    }

    /**
     * Save capsule state
     */
    saveCapsule(sessionId, state) {
        const db = this.getDB('sessions');
        const existing = db.prepare('SELECT 1 FROM capsules WHERE session_id = ?').get(sessionId);

        if (existing) {
            db.prepare(`
                UPDATE capsules SET
                    state = ?,
                    updated_at = datetime('now')
                WHERE session_id = ?
            `).run(JSON.stringify(state), sessionId);
        } else {
            db.prepare(`
                INSERT INTO capsules (session_id, state, created_at, updated_at)
                VALUES (?, ?, datetime('now'), datetime('now'))
            `).run(sessionId, JSON.stringify(state));
        }
    }

    /**
     * Get recent sessions
     */
    getRecentSessions(limit = 10) {
        const db = this.getDB('sessions');
        return db.prepare(`
            SELECT * FROM sessions
            ORDER BY started_at DESC
            LIMIT ?
        `).all(limit);
    }

    // ========== SKILLS ==========

    /**
     * Record skill usage
     */
    recordSkillUse(skillName, success, durationMs) {
        const db = this.getDB('global');
        const existing = db.prepare('SELECT * FROM skill_stats WHERE skill_name = ?').get(skillName);

        if (existing) {
            const totalUses = existing.total_uses + 1;
            const successCount = existing.success_count + (success ? 1 : 0);
            const avgDuration = Math.round(
                (existing.avg_duration_ms * existing.total_uses + durationMs) / totalUses
            );
            const frecency = this.calculateFrecency(totalUses, new Date().toISOString());

            db.prepare(`
                UPDATE skill_stats SET
                    total_uses = ?,
                    success_count = ?,
                    avg_duration_ms = ?,
                    last_used = datetime('now'),
                    frecency = ?
                WHERE skill_name = ?
            `).run(totalUses, successCount, avgDuration, frecency, skillName);
        } else {
            db.prepare(`
                INSERT INTO skill_stats (skill_name, total_uses, success_count, avg_duration_ms, last_used, frecency)
                VALUES (?, 1, ?, ?, datetime('now'), 0.5)
            `).run(skillName, success ? 1 : 0, durationMs);
        }
    }

    /**
     * Get top skills
     */
    getTopSkills(limit = 10) {
        const db = this.getDB('global');
        return db.prepare(`
            SELECT * FROM skill_stats
            ORDER BY frecency DESC
            LIMIT ?
        `).all(limit);
    }

    // ========== PREFERENCES ==========

    /**
     * Get preference
     */
    getPref(key) {
        const db = this.getDB('global');
        const row = db.prepare('SELECT value FROM preferences WHERE key = ?').get(key);
        return row ? JSON.parse(row.value) : null;
    }

    /**
     * Set preference
     */
    setPref(key, value) {
        const db = this.getDB('global');
        db.prepare(`
            INSERT OR REPLACE INTO preferences (key, value, updated_at)
            VALUES (?, ?, datetime('now'))
        `).run(key, JSON.stringify(value));
    }

    // ========== UTILITY ==========

    /**
     * Calculate frecency score (0-1)
     */
    calculateFrecency(accessCount, lastAccessed) {
        const now = Date.now();
        const lastAccessedMs = new Date(lastAccessed).getTime();
        const daysSinceAccess = (now - lastAccessedMs) / (24 * 60 * 60 * 1000);

        const recencyScore = Math.max(0, 30 - daysSinceAccess) / 30;
        const frequencyScore = Math.min(accessCount, 100) / 100;

        return (recencyScore * 0.6) + (frequencyScore * 0.4);
    }

    /**
     * Update frecency for any table/row
     */
    updateFrecency(table, id, frecency) {
        const db = this.getDB('global');
        try {
            db.prepare(`UPDATE ${table} SET frecency = ? WHERE id = ?`).run(frecency, id);
        } catch (e) {
            // Table might not have frecency column
        }
    }

    /**
     * Close all connections
     */
    close() {
        for (const conn of Object.values(this.connections)) {
            if (conn && conn.close) conn.close();
        }
        this.connections = {};
        this.initialized = false;
    }

    /**
     * Get statistics
     */
    getStats() {
        const global = this.getDB('global');
        const sessions = this.getDB('sessions');

        return {
            patterns: global.prepare('SELECT COUNT(*) as count FROM patterns').get().count,
            skills: global.prepare('SELECT COUNT(*) as count FROM skill_stats').get().count,
            sessions: sessions.prepare('SELECT COUNT(*) as count FROM sessions').get().count,
            events: sessions.prepare('SELECT COUNT(*) as count FROM events').get().count
        };
    }
}

// Singleton instance
const manager = new DBManager();

module.exports = { DBManager, manager };

// CLI interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const cmd = args[0];

    try {
        manager.init();
    } catch (e) {
        console.error('Init error:', e.message);
        console.log('Install: npm install better-sqlite3');
        process.exit(1);
    }

    switch (cmd) {
        case 'init':
            console.log('Databases initialized');
            console.log('Stats:', manager.getStats());
            break;

        case 'stats':
            console.log(JSON.stringify(manager.getStats(), null, 2));
            break;

        case 'search':
            const query = args[1];
            if (!query) {
                console.log('Usage: node db-manager.js search <query>');
                break;
            }
            const results = manager.searchPatterns(query);
            console.log(JSON.stringify(results, null, 2));
            break;

        case 'add-pattern':
            const pattern = args[1];
            const category = args[2] || 'general';
            const project = args[3] || 'global';
            if (!pattern) {
                console.log('Usage: node db-manager.js add-pattern <pattern> [category] [project]');
                break;
            }
            manager.addPattern(pattern, category, project);
            console.log('Pattern added');
            break;

        default:
            console.log(`
Database Manager CLI

Commands:
  init              Initialize databases
  stats             Show statistics
  search <query>    Search patterns
  add-pattern <p>   Add pattern
            `);
    }

    manager.close();
}
