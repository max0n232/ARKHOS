-- Pattern Tracker Database Schema
-- Captures tool execution traces and behavioral patterns

-- Raw traces from Collector
CREATE TABLE IF NOT EXISTS traces (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    tool_name TEXT NOT NULL,
    tool_input TEXT,
    exit_code INTEGER DEFAULT 0,
    error_output TEXT,
    duration_ms INTEGER,
    token_budget_pct REAL,
    project TEXT,
    routing_mode TEXT,
    routing_domain TEXT,
    routing_template TEXT,
    team_name TEXT,
    agent_role TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_traces_session ON traces(session_id);
CREATE INDEX IF NOT EXISTS idx_traces_timestamp ON traces(timestamp);
CREATE INDEX IF NOT EXISTS idx_traces_tool ON traces(tool_name, exit_code);

-- Detected patterns
CREATE TABLE IF NOT EXISTS detections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    pattern_type TEXT NOT NULL,
    severity TEXT NOT NULL,
    description TEXT NOT NULL,
    context TEXT,
    resolved INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_detections_session ON detections(session_id);
CREATE INDEX IF NOT EXISTS idx_detections_type ON detections(pattern_type);
CREATE INDEX IF NOT EXISTS idx_detections_resolved ON detections(resolved);

-- Analysis results from Reporter
CREATE TABLE IF NOT EXISTS analyses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    traces_from INTEGER,
    traces_to INTEGER,
    traces_count INTEGER,
    error_rate REAL,
    loops_detected INTEGER,
    analysis_text TEXT,
    corrections_json TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Applied corrections
CREATE TABLE IF NOT EXISTS applied_corrections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    analysis_id INTEGER REFERENCES analyses(id),
    type TEXT NOT NULL,
    target TEXT NOT NULL,
    action TEXT NOT NULL,
    content TEXT NOT NULL,
    reason TEXT,
    auto_applied INTEGER DEFAULT 0,
    approved_by TEXT,
    backup_path TEXT,
    applied_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_corrections_analysis ON applied_corrections(analysis_id);
CREATE INDEX IF NOT EXISTS idx_corrections_type ON applied_corrections(type);

-- Correction effectiveness metrics
CREATE TABLE IF NOT EXISTS correction_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    correction_id INTEGER REFERENCES applied_corrections(id),
    metric_name TEXT NOT NULL,
    metric_value REAL,
    measured_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_metrics_correction ON correction_metrics(correction_id);

-- Configuration KV store
CREATE TABLE IF NOT EXISTS config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Default configuration values
INSERT OR IGNORE INTO config VALUES ('loop_threshold', '3', datetime('now'));
INSERT OR IGNORE INTO config VALUES ('budget_burn_calls', '20', datetime('now'));
INSERT OR IGNORE INTO config VALUES ('budget_burn_window_sec', '60', datetime('now'));
INSERT OR IGNORE INTO config VALUES ('budget_burn_error_rate', '0.5', datetime('now'));
INSERT OR IGNORE INTO config VALUES ('analysis_trigger_traces', '50', datetime('now'));
INSERT OR IGNORE INTO config VALUES ('auto_apply_max_severity', 'high', datetime('now'));
INSERT OR IGNORE INTO config VALUES ('last_analysis_timestamp', '0', datetime('now'));
