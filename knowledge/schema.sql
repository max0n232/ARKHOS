-- Studiokook Knowledge Base Schema
-- Simple, focused schema for single project

PRAGMA foreign_keys = ON;

-- ============================================
-- DECISIONS
-- ============================================

CREATE TABLE IF NOT EXISTS decisions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    title TEXT NOT NULL,
    problem TEXT NOT NULL,
    decision TEXT NOT NULL,
    alternatives TEXT,
    consequences TEXT,
    status TEXT DEFAULT 'accepted' CHECK(status IN ('accepted', 'deprecated', 'superseded')),
    superseded_by INTEGER REFERENCES decisions(id),
    tags TEXT,
    last_accessed INTEGER
);

CREATE INDEX IF NOT EXISTS idx_decisions_date ON decisions(date DESC);
CREATE INDEX IF NOT EXISTS idx_decisions_status ON decisions(status);

-- Full-text search for decisions
CREATE VIRTUAL TABLE IF NOT EXISTS decisions_fts USING fts5(
    title, problem, decision, alternatives, consequences, tags,
    content=decisions,
    content_rowid=id
);

-- Triggers to keep FTS in sync
CREATE TRIGGER IF NOT EXISTS decisions_ai AFTER INSERT ON decisions BEGIN
    INSERT INTO decisions_fts(rowid, title, problem, decision, alternatives, consequences, tags)
    VALUES (new.id, new.title, new.problem, new.decision, new.alternatives, new.consequences, new.tags);
END;

CREATE TRIGGER IF NOT EXISTS decisions_ad AFTER DELETE ON decisions BEGIN
    DELETE FROM decisions_fts WHERE rowid = old.id;
END;

CREATE TRIGGER IF NOT EXISTS decisions_au AFTER UPDATE ON decisions BEGIN
    UPDATE decisions_fts SET
        title = new.title,
        problem = new.problem,
        decision = new.decision,
        alternatives = new.alternatives,
        consequences = new.consequences,
        tags = new.tags
    WHERE rowid = new.id;
END;

-- ============================================
-- WORK LOGS
-- ============================================

CREATE TABLE IF NOT EXISTS work_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    summary TEXT NOT NULL,
    details TEXT,
    tags TEXT,
    last_accessed INTEGER
);

CREATE INDEX IF NOT EXISTS idx_work_logs_date ON work_logs(date DESC);

-- Full-text search for work logs
CREATE VIRTUAL TABLE IF NOT EXISTS work_logs_fts USING fts5(
    summary, details, tags,
    content=work_logs,
    content_rowid=id
);

CREATE TRIGGER IF NOT EXISTS work_logs_ai AFTER INSERT ON work_logs BEGIN
    INSERT INTO work_logs_fts(rowid, summary, details, tags)
    VALUES (new.id, new.summary, new.details, new.tags);
END;

CREATE TRIGGER IF NOT EXISTS work_logs_ad AFTER DELETE ON work_logs BEGIN
    DELETE FROM work_logs_fts WHERE rowid = old.id;
END;

CREATE TRIGGER IF NOT EXISTS work_logs_au AFTER UPDATE ON work_logs BEGIN
    UPDATE work_logs_fts SET
        summary = new.summary,
        details = new.details,
        tags = new.tags
    WHERE rowid = new.id;
END;

-- ============================================
-- ERRORS & LEARNINGS
-- ============================================

CREATE TABLE IF NOT EXISTS errors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    solution TEXT,
    lesson TEXT,
    severity TEXT CHECK(severity IN ('low', 'medium', 'high', 'critical')),
    tags TEXT,
    last_accessed INTEGER
);

CREATE INDEX IF NOT EXISTS idx_errors_date ON errors(date DESC);
CREATE INDEX IF NOT EXISTS idx_errors_severity ON errors(severity);

-- ============================================
-- SNIPPETS (Reusable Code)
-- ============================================

CREATE TABLE IF NOT EXISTS snippets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    code TEXT NOT NULL,
    language TEXT,
    tags TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    last_accessed INTEGER
);

CREATE INDEX IF NOT EXISTS idx_snippets_name ON snippets(name);

-- ============================================
-- TECH STACK (for benchmark monitoring)
-- ============================================

CREATE TABLE IF NOT EXISTS tech_stack (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,              -- 'video_generation', 'image_generation', 'llm', 'seo_tools'
    tool_name TEXT NOT NULL,
    version TEXT,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'testing', 'backup', 'deprecated')),
    added_date INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    last_evaluated INTEGER,
    evaluation_score REAL,                -- 1-10
    notes TEXT,
    UNIQUE(category, tool_name)
);

CREATE INDEX IF NOT EXISTS idx_tech_stack_category ON tech_stack(category, status);

-- ============================================
-- BENCHMARK MONITORING
-- ============================================

CREATE TABLE IF NOT EXISTS benchmark_sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,           -- 'VBench', 'LMSYS', 'GenAI-Arena'
    category TEXT NOT NULL,              -- 'video_generation', 'llm', 'image_generation'
    url TEXT,
    api_endpoint TEXT,
    update_frequency TEXT,               -- 'daily', 'weekly', 'monthly'
    last_checked INTEGER,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'paused'))
);

CREATE TABLE IF NOT EXISTS benchmark_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL,                -- 'VBench'
    model_name TEXT NOT NULL,
    category TEXT NOT NULL,
    score REAL,
    rank INTEGER,
    metrics TEXT,                        -- JSON: {"quality": 9.1, "temporal": 8.9}
    recorded_date INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_benchmark_results ON benchmark_results(source, model_name, recorded_date DESC);

CREATE TABLE IF NOT EXISTS benchmark_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alert_date INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    source TEXT NOT NULL,
    message TEXT NOT NULL,
    model_name TEXT,
    score_change REAL,
    claude_analysis TEXT,
    action_taken TEXT,
    status TEXT DEFAULT 'new' CHECK(status IN ('new', 'reviewed', 'completed'))
);

CREATE INDEX IF NOT EXISTS idx_benchmark_alerts ON benchmark_alerts(status, alert_date DESC);

-- ============================================
-- SEO AUDIT HISTORY
-- ============================================

CREATE TABLE IF NOT EXISTS seo_audits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    audit_date INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    url TEXT NOT NULL,
    score REAL,                          -- Overall SEO score (1-100)
    issues TEXT,                         -- JSON array of issues
    recommendations TEXT,                -- Claude recommendations
    metadata TEXT                        -- JSON: title, description, h1, etc.
);

CREATE INDEX IF NOT EXISTS idx_seo_audits ON seo_audits(url, audit_date DESC);

-- ============================================
-- CONTENT PERFORMANCE (Instagram, etc.)
-- ============================================

CREATE TABLE IF NOT EXISTS content_performance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    platform TEXT NOT NULL,              -- 'instagram', 'facebook', 'website'
    content_type TEXT,                   -- 'post', 'reel', 'story', 'blog'
    content_id TEXT,                     -- Platform-specific ID
    published_date INTEGER,
    caption TEXT,
    hashtags TEXT,                       -- JSON array
    metrics TEXT,                        -- JSON: likes, comments, shares, views
    recorded_date INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_content_performance ON content_performance(platform, published_date DESC);

-- ============================================
-- METADATA
-- ============================================

CREATE TABLE IF NOT EXISTS metadata (
    key TEXT PRIMARY KEY,
    value TEXT
);

-- Schema version
INSERT OR REPLACE INTO metadata (key, value) VALUES ('schema_version', '1.0');
INSERT OR REPLACE INTO metadata (key, value) VALUES ('project_name', 'Studiokook');
INSERT OR REPLACE INTO metadata (key, value) VALUES ('created_at', strftime('%s', 'now'));
