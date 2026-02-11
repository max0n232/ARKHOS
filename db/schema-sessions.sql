-- Sessions Database Schema
-- Session tracking, events, capsules

-- Sessions
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    project TEXT,
    started_at TEXT,
    ended_at TEXT,
    tokens_used INTEGER DEFAULT 0,
    skills_loaded TEXT,         -- JSON array
    summary TEXT
);

-- FTS5 for session search
CREATE VIRTUAL TABLE IF NOT EXISTS sessions_fts USING fts5(
    summary,
    project,
    content='sessions',
    content_rowid='rowid'
);

-- Events timeline
CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT,
    event_type TEXT,            -- 'tool_use', 'skill_load', 'error', 'decision'
    data TEXT,                  -- JSON
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(id)
);

-- Capsules (session state snapshots)
CREATE TABLE IF NOT EXISTS capsules (
    session_id TEXT PRIMARY KEY,
    state TEXT,                 -- JSON (capsule.json content)
    created_at TEXT,
    updated_at TEXT,
    FOREIGN KEY (session_id) REFERENCES sessions(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sessions_project ON sessions(project);
CREATE INDEX IF NOT EXISTS idx_sessions_started ON sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_session ON events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp DESC);
