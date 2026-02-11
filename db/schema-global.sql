-- Global Database Schema
-- Shared patterns, skill stats, preferences across all projects

-- Patterns (cross-project knowledge)
CREATE TABLE IF NOT EXISTS patterns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pattern TEXT NOT NULL,
    category TEXT,              -- 'error', 'solution', 'architecture', 'cross-project'
    source_project TEXT,        -- original project
    frecency REAL DEFAULT 0.5,
    access_count INTEGER DEFAULT 0,
    last_accessed TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- FTS5 for pattern search
CREATE VIRTUAL TABLE IF NOT EXISTS patterns_fts USING fts5(
    pattern,
    category,
    content='patterns',
    content_rowid='id'
);

-- Triggers to keep FTS in sync
CREATE TRIGGER IF NOT EXISTS patterns_ai AFTER INSERT ON patterns BEGIN
    INSERT INTO patterns_fts(rowid, pattern, category)
    VALUES (new.id, new.pattern, new.category);
END;

CREATE TRIGGER IF NOT EXISTS patterns_ad AFTER DELETE ON patterns BEGIN
    INSERT INTO patterns_fts(patterns_fts, rowid, pattern, category)
    VALUES ('delete', old.id, old.pattern, old.category);
END;

CREATE TRIGGER IF NOT EXISTS patterns_au AFTER UPDATE ON patterns BEGIN
    INSERT INTO patterns_fts(patterns_fts, rowid, pattern, category)
    VALUES ('delete', old.id, old.pattern, old.category);
    INSERT INTO patterns_fts(rowid, pattern, category)
    VALUES (new.id, new.pattern, new.category);
END;

-- Skill statistics
CREATE TABLE IF NOT EXISTS skill_stats (
    skill_name TEXT PRIMARY KEY,
    total_uses INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    avg_duration_ms INTEGER,
    last_used TEXT,
    frecency REAL DEFAULT 0.5
);

-- User preferences
CREATE TABLE IF NOT EXISTS preferences (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_patterns_category ON patterns(category);
CREATE INDEX IF NOT EXISTS idx_patterns_frecency ON patterns(frecency DESC);
CREATE INDEX IF NOT EXISTS idx_skill_stats_frecency ON skill_stats(frecency DESC);
