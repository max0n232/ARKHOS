-- Project Memory Database Schema
-- Studiokook-specific data with FTS5 and frecency

-- Decisions (architectural)
CREATE TABLE IF NOT EXISTS decisions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    decision TEXT NOT NULL,
    context TEXT,
    reasoning TEXT,
    status TEXT DEFAULT 'active',      -- 'active', 'deprecated', 'superseded'
    frecency REAL DEFAULT 0.5,
    access_count INTEGER DEFAULT 0,
    last_accessed TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- FTS5 for decision search
CREATE VIRTUAL TABLE IF NOT EXISTS decisions_fts USING fts5(
    decision,
    context,
    reasoning,
    content='decisions',
    content_rowid='id'
);

-- Sync triggers for decisions
CREATE TRIGGER IF NOT EXISTS decisions_ai AFTER INSERT ON decisions BEGIN
    INSERT INTO decisions_fts(rowid, decision, context, reasoning)
    VALUES (new.id, new.decision, new.context, new.reasoning);
END;

CREATE TRIGGER IF NOT EXISTS decisions_ad AFTER DELETE ON decisions BEGIN
    INSERT INTO decisions_fts(decisions_fts, rowid, decision, context, reasoning)
    VALUES ('delete', old.id, old.decision, old.context, old.reasoning);
END;

CREATE TRIGGER IF NOT EXISTS decisions_au AFTER UPDATE ON decisions BEGIN
    INSERT INTO decisions_fts(decisions_fts, rowid, decision, context, reasoning)
    VALUES ('delete', old.id, old.decision, old.context, old.reasoning);
    INSERT INTO decisions_fts(rowid, decision, context, reasoning)
    VALUES (new.id, new.decision, new.context, new.reasoning);
END;

-- Errors and solutions
CREATE TABLE IF NOT EXISTS errors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    error_message TEXT NOT NULL,
    solution TEXT,
    category TEXT,                      -- 'php', 'js', 'wordpress', 'n8n', 'seo'
    times_occurred INTEGER DEFAULT 1,
    last_occurred TEXT,
    frecency REAL DEFAULT 0.5,
    access_count INTEGER DEFAULT 0
);

-- FTS5 for error search
CREATE VIRTUAL TABLE IF NOT EXISTS errors_fts USING fts5(
    error_message,
    solution,
    content='errors',
    content_rowid='id'
);

-- Sync triggers for errors
CREATE TRIGGER IF NOT EXISTS errors_ai AFTER INSERT ON errors BEGIN
    INSERT INTO errors_fts(rowid, error_message, solution)
    VALUES (new.id, new.error_message, new.solution);
END;

CREATE TRIGGER IF NOT EXISTS errors_ad AFTER DELETE ON errors BEGIN
    INSERT INTO errors_fts(errors_fts, rowid, error_message, solution)
    VALUES ('delete', old.id, old.error_message, old.solution);
END;

CREATE TRIGGER IF NOT EXISTS errors_au AFTER UPDATE ON errors BEGIN
    INSERT INTO errors_fts(errors_fts, rowid, error_message, solution)
    VALUES ('delete', old.id, old.error_message, old.solution);
    INSERT INTO errors_fts(rowid, error_message, solution)
    VALUES (new.id, new.error_message, new.solution);
END;

-- Work logs
CREATE TABLE IF NOT EXISTS work_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT,
    description TEXT,
    files_modified TEXT,                -- JSON array
    status TEXT,                        -- 'completed', 'in_progress', 'blocked'
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Links (URLs, resources)
CREATE TABLE IF NOT EXISTS links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL UNIQUE,
    title TEXT,
    category TEXT,                      -- 'documentation', 'tutorial', 'api', 'tool'
    notes TEXT,
    access_count INTEGER DEFAULT 0,
    last_accessed TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- SEO data (studiokook.ee pages)
CREATE TABLE IF NOT EXISTS seo_data (
    page_url TEXT PRIMARY KEY,
    language TEXT,                      -- 'et', 'ru', 'en', 'fi'
    title TEXT,
    meta_description TEXT,
    h1 TEXT,
    keywords TEXT,                      -- JSON array
    internal_links INTEGER,
    external_links INTEGER,
    word_count INTEGER,
    last_audit TEXT,
    score REAL,                         -- 0-100
    issues TEXT                         -- JSON array
);

-- n8n workflows
CREATE TABLE IF NOT EXISTS n8n_workflows (
    workflow_id TEXT PRIMARY KEY,
    name TEXT,
    environment TEXT,                   -- 'dev', 'prod'
    status TEXT,                        -- 'active', 'inactive', 'error'
    last_run TEXT,
    last_success TEXT,
    error_count INTEGER DEFAULT 0,
    nodes TEXT,                         -- JSON array of node types
    triggers TEXT                       -- JSON array of trigger types
);

-- Skill usage (project-level)
CREATE TABLE IF NOT EXISTS skill_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    skill_name TEXT,
    session_id TEXT,
    success INTEGER,                    -- 0 or 1
    duration_ms INTEGER,
    notes TEXT,
    used_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- WordPress content
CREATE TABLE IF NOT EXISTS wp_content (
    post_id INTEGER PRIMARY KEY,
    post_type TEXT,                     -- 'page', 'post', 'product'
    title TEXT,
    slug TEXT,
    language TEXT,
    status TEXT,                        -- 'publish', 'draft', 'private'
    last_modified TEXT,
    seo_score REAL
);

-- Solutions / Successful approaches (added 2026-02-10)
CREATE TABLE IF NOT EXISTS solutions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Problem identification
    problem TEXT NOT NULL,              -- What was the problem
    context TEXT,                       -- Environment/conditions (WP, TranslatePress, etc.)
    category TEXT,                      -- 'wordpress', 'translatepress', 'seo', 'n8n', 'php', 'api'

    -- Solution details
    approach TEXT NOT NULL,             -- What approach worked
    code_snippet TEXT,                  -- Working code if applicable
    api_endpoint TEXT,                  -- API endpoint used

    -- Failed attempts (learning)
    failed_approaches TEXT,             -- JSON array of what didn't work

    -- Metadata
    success_count INTEGER DEFAULT 1,    -- How many times this solution worked
    last_used TEXT,
    frecency REAL DEFAULT 0.5,
    tags TEXT,                          -- JSON array for quick filtering

    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- FTS5 for solution search
CREATE VIRTUAL TABLE IF NOT EXISTS solutions_fts USING fts5(
    problem,
    context,
    approach,
    tags,
    content='solutions',
    content_rowid='id'
);

-- Sync triggers for solutions
CREATE TRIGGER IF NOT EXISTS solutions_ai AFTER INSERT ON solutions BEGIN
    INSERT INTO solutions_fts(rowid, problem, context, approach, tags)
    VALUES (new.id, new.problem, new.context, new.approach, new.tags);
END;

CREATE TRIGGER IF NOT EXISTS solutions_ad AFTER DELETE ON solutions BEGIN
    INSERT INTO solutions_fts(solutions_fts, rowid, problem, context, approach, tags)
    VALUES ('delete', old.id, old.problem, old.context, old.approach, old.tags);
END;

CREATE TRIGGER IF NOT EXISTS solutions_au AFTER UPDATE ON solutions BEGIN
    INSERT INTO solutions_fts(solutions_fts, rowid, problem, context, approach, tags)
    VALUES ('delete', old.id, old.problem, old.context, old.approach, old.tags);
    INSERT INTO solutions_fts(rowid, problem, context, approach, tags)
    VALUES (new.id, new.problem, new.context, new.approach, new.tags);
END;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_decisions_frecency ON decisions(frecency DESC);
CREATE INDEX IF NOT EXISTS idx_decisions_status ON decisions(status);
CREATE INDEX IF NOT EXISTS idx_errors_frecency ON errors(frecency DESC);
CREATE INDEX IF NOT EXISTS idx_errors_category ON errors(category);
CREATE INDEX IF NOT EXISTS idx_work_logs_session ON work_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_work_logs_status ON work_logs(status);
CREATE INDEX IF NOT EXISTS idx_seo_data_language ON seo_data(language);
CREATE INDEX IF NOT EXISTS idx_seo_data_score ON seo_data(score);
CREATE INDEX IF NOT EXISTS idx_n8n_environment ON n8n_workflows(environment);
CREATE INDEX IF NOT EXISTS idx_skill_usage_skill ON skill_usage(skill_name);
CREATE INDEX IF NOT EXISTS idx_wp_content_type ON wp_content(post_type);
CREATE INDEX IF NOT EXISTS idx_solutions_category ON solutions(category);
CREATE INDEX IF NOT EXISTS idx_solutions_frecency ON solutions(frecency DESC);
CREATE INDEX IF NOT EXISTS idx_solutions_last_used ON solutions(last_used DESC);
