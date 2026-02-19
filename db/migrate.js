#!/usr/bin/env node
/**
 * Database Migration Script
 *
 * Migrates existing knowledge.db to new structure:
 * - .claude/knowledge.db → .claude/db/global.db + sessions.db
 * - Studiokook/knowledge.db → Studiokook/knowledge/memory.db (with FTS5)
 */

const fs = require('fs');
const path = require('path');

const CLAUDE_DIR = path.join(process.env.HOME || process.env.USERPROFILE, '.claude');
const DB_DIR = path.join(CLAUDE_DIR, 'db');
const OLD_GLOBAL_DB = path.join(CLAUDE_DIR, 'knowledge.db');
const STUDIOKOOK_DIR = 'C:\\Users\\sorte\\Desktop\\Studiokook';
const OLD_PROJECT_DB = path.join(STUDIOKOOK_DIR, 'knowledge', 'knowledge.db');
const NEW_PROJECT_DB = path.join(STUDIOKOOK_DIR, 'knowledge', 'memory.db');

let Database;
try {
    Database = require('better-sqlite3');
} catch (e) {
    console.error('better-sqlite3 not found. Run: npm install better-sqlite3');
    process.exit(1);
}

function migrateGlobalDB() {
    console.log('\n=== Migrating Global DB ===');

    if (!fs.existsSync(OLD_GLOBAL_DB)) {
        console.log('No old global DB found, skipping');
        return;
    }

    const oldDb = new Database(OLD_GLOBAL_DB, { readonly: true });
    const { DBManager } = require('./db-manager');
    const manager = new DBManager();
    manager.init();

    // Check what tables exist
    const tables = oldDb.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('Found tables:', tables.map(t => t.name));

    // Migrate patterns if exists
    if (tables.find(t => t.name === 'patterns')) {
        const patterns = oldDb.prepare('SELECT * FROM patterns').all();
        console.log(`Migrating ${patterns.length} patterns`);
        for (const p of patterns) {
            manager.addPattern(p.pattern, p.category || 'general', p.source_project || 'global');
        }
    }

    // Migrate sessions if exists
    if (tables.find(t => t.name === 'sessions')) {
        const sessions = oldDb.prepare('SELECT * FROM sessions').all();
        console.log(`Found ${sessions.length} sessions (will be recreated on use)`);
    }

    oldDb.close();
    manager.close();

    // Backup old DB
    const backupPath = OLD_GLOBAL_DB + '.backup';
    fs.renameSync(OLD_GLOBAL_DB, backupPath);
    console.log(`Old DB backed up to: ${backupPath}`);
}

function migrateProjectDB() {
    console.log('\n=== Migrating Project DB ===');

    if (!fs.existsSync(OLD_PROJECT_DB)) {
        console.log('No project DB found, creating new');
        createProjectDB();
        return;
    }

    // Copy to new location
    if (OLD_PROJECT_DB !== NEW_PROJECT_DB) {
        fs.copyFileSync(OLD_PROJECT_DB, NEW_PROJECT_DB);
        console.log(`Copied to: ${NEW_PROJECT_DB}`);
    }

    // Add FTS5 tables
    const db = new Database(NEW_PROJECT_DB);

    // Check existing tables
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('Existing tables:', tables.map(t => t.name));

    // Add frecency column if missing
    try {
        db.exec('ALTER TABLE decisions ADD COLUMN frecency REAL DEFAULT 0.5');
        console.log('Added frecency to decisions');
    } catch (e) {
        // Column already exists
    }

    try {
        db.exec('ALTER TABLE errors ADD COLUMN frecency REAL DEFAULT 0.5');
        console.log('Added frecency to errors');
    } catch (e) {
        // Column already exists
    }

    // Create FTS5 for decisions if not exists
    try {
        db.exec(`
            CREATE VIRTUAL TABLE IF NOT EXISTS decisions_fts USING fts5(
                decision,
                context,
                reasoning,
                content='decisions',
                content_rowid='id'
            );

            -- Populate FTS from existing data
            INSERT INTO decisions_fts(decisions_fts) VALUES('rebuild');
        `);
        console.log('Created decisions_fts');
    } catch (e) {
        console.log('decisions_fts:', e.message);
    }

    // Create FTS5 for errors if not exists
    try {
        db.exec(`
            CREATE VIRTUAL TABLE IF NOT EXISTS errors_fts USING fts5(
                error_message,
                solution,
                content='errors',
                content_rowid='id'
            );

            INSERT INTO errors_fts(errors_fts) VALUES('rebuild');
        `);
        console.log('Created errors_fts');
    } catch (e) {
        console.log('errors_fts:', e.message);
    }

    // Add new tables if missing
    db.exec(`
        -- SEO data
        CREATE TABLE IF NOT EXISTS seo_data (
            page_url TEXT PRIMARY KEY,
            title TEXT,
            meta_description TEXT,
            keywords TEXT,
            last_audit TEXT,
            score REAL
        );

        -- n8n workflows
        CREATE TABLE IF NOT EXISTS n8n_workflows (
            workflow_id TEXT PRIMARY KEY,
            name TEXT,
            environment TEXT,
            status TEXT,
            last_run TEXT,
            error_count INTEGER DEFAULT 0
        );

        -- Skill usage
        CREATE TABLE IF NOT EXISTS skill_usage (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            skill_name TEXT,
            session_id TEXT,
            success INTEGER,
            notes TEXT,
            used_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        -- Indexes
        CREATE INDEX IF NOT EXISTS idx_decisions_frecency ON decisions(frecency DESC);
        CREATE INDEX IF NOT EXISTS idx_errors_frecency ON errors(frecency DESC);
    `);

    console.log('Added new tables');

    db.close();

    // Backup old DB
    if (OLD_PROJECT_DB !== NEW_PROJECT_DB) {
        const backupPath = OLD_PROJECT_DB + '.backup';
        fs.renameSync(OLD_PROJECT_DB, backupPath);
        console.log(`Old DB backed up to: ${backupPath}`);
    }
}

function createProjectDB() {
    const knowledgeDir = path.join(STUDIOKOOK_DIR, 'knowledge');
    if (!fs.existsSync(knowledgeDir)) {
        fs.mkdirSync(knowledgeDir, { recursive: true });
    }

    const db = new Database(NEW_PROJECT_DB);

    db.exec(`
        -- Decisions (architectural)
        CREATE TABLE IF NOT EXISTS decisions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            decision TEXT NOT NULL,
            context TEXT,
            reasoning TEXT,
            status TEXT DEFAULT 'active',
            frecency REAL DEFAULT 0.5,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE VIRTUAL TABLE IF NOT EXISTS decisions_fts USING fts5(
            decision, context, reasoning, content='decisions', content_rowid='id'
        );

        -- Errors and solutions
        CREATE TABLE IF NOT EXISTS errors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            error_message TEXT NOT NULL,
            solution TEXT,
            category TEXT,
            times_occurred INTEGER DEFAULT 1,
            last_occurred TEXT,
            frecency REAL DEFAULT 0.5
        );

        CREATE VIRTUAL TABLE IF NOT EXISTS errors_fts USING fts5(
            error_message, solution, content='errors', content_rowid='id'
        );

        -- Work logs
        CREATE TABLE IF NOT EXISTS work_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT,
            description TEXT,
            files_modified TEXT,
            status TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        -- Links
        CREATE TABLE IF NOT EXISTS links (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            url TEXT NOT NULL,
            title TEXT,
            category TEXT,
            notes TEXT,
            access_count INTEGER DEFAULT 0,
            last_accessed TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        -- SEO data
        CREATE TABLE IF NOT EXISTS seo_data (
            page_url TEXT PRIMARY KEY,
            title TEXT,
            meta_description TEXT,
            keywords TEXT,
            last_audit TEXT,
            score REAL
        );

        -- n8n workflows
        CREATE TABLE IF NOT EXISTS n8n_workflows (
            workflow_id TEXT PRIMARY KEY,
            name TEXT,
            environment TEXT,
            status TEXT,
            last_run TEXT,
            error_count INTEGER DEFAULT 0
        );

        -- Skill usage
        CREATE TABLE IF NOT EXISTS skill_usage (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            skill_name TEXT,
            session_id TEXT,
            success INTEGER,
            notes TEXT,
            used_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        -- Indexes
        CREATE INDEX IF NOT EXISTS idx_decisions_frecency ON decisions(frecency DESC);
        CREATE INDEX IF NOT EXISTS idx_errors_frecency ON errors(frecency DESC);
        CREATE INDEX IF NOT EXISTS idx_work_logs_session ON work_logs(session_id);
    `);

    console.log('Created new project DB with full schema');
    db.close();
}

function main() {
    console.log('=== Database Migration ===');
    console.log('Date:', new Date().toISOString());

    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');

    if (dryRun) {
        console.log('\n[DRY RUN - no changes will be made]\n');

        console.log('Would migrate:');
        console.log(`  ${OLD_GLOBAL_DB} → ${DB_DIR}/global.db + sessions.db`);
        console.log(`  ${OLD_PROJECT_DB} → ${NEW_PROJECT_DB}`);

        if (fs.existsSync(OLD_GLOBAL_DB)) {
            const db = new Database(OLD_GLOBAL_DB, { readonly: true });
            const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
            console.log('\nGlobal DB tables:', tables.map(t => t.name));
            db.close();
        }

        if (fs.existsSync(OLD_PROJECT_DB)) {
            const db = new Database(OLD_PROJECT_DB, { readonly: true });
            const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
            console.log('Project DB tables:', tables.map(t => t.name));
            db.close();
        }

        return;
    }

    // Ensure DB dir exists
    if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
    }

    migrateGlobalDB();
    migrateProjectDB();

    console.log('\n=== Migration Complete ===');
}

main();
