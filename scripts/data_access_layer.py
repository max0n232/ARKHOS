#!/usr/bin/env python3
"""
ARKHOS Data Access Layer (DAL)
Minimal implementation for knowledge base
"""

import sqlite3
import os
import json
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional

# Database path
DB_PATH = Path.home() / ".claude" / "knowledge" / "knowledge.db"
DB_PATH.parent.mkdir(parents=True, exist_ok=True)


class Database:
    """SQLite database connection manager"""

    def __init__(self, db_path: str = str(DB_PATH)):
        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        """Initialize database with schema"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("PRAGMA foreign_keys = ON")

            # Projects table
            conn.execute("""
                CREATE TABLE IF NOT EXISTS projects (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT UNIQUE NOT NULL,
                    description TEXT,
                    created_at INTEGER DEFAULT (strftime('%s','now'))
                )
            """)

            # Decisions table
            conn.execute("""
                CREATE TABLE IF NOT EXISTS decisions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    project_id INTEGER,
                    date INTEGER DEFAULT (strftime('%s','now')),
                    title TEXT NOT NULL,
                    problem TEXT,
                    decision TEXT NOT NULL,
                    alternatives TEXT,
                    consequences TEXT,
                    status TEXT DEFAULT 'accepted',
                    FOREIGN KEY (project_id) REFERENCES projects(id)
                )
            """)

            # Decisions FTS5
            conn.execute("""
                CREATE VIRTUAL TABLE IF NOT EXISTS decisions_fts USING fts5(
                    title, problem, decision, alternatives, consequences,
                    content=decisions,
                    content_rowid=id
                )
            """)

            # Logs table
            conn.execute("""
                CREATE TABLE IF NOT EXISTS logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    project_id INTEGER,
                    date INTEGER DEFAULT (strftime('%s','now')),
                    summary TEXT NOT NULL,
                    details TEXT,
                    FOREIGN KEY (project_id) REFERENCES projects(id)
                )
            """)

            # Logs FTS5
            conn.execute("""
                CREATE VIRTUAL TABLE IF NOT EXISTS logs_fts USING fts5(
                    summary, details,
                    content=logs,
                    content_rowid=id
                )
            """)

            # Snippets table
            conn.execute("""
                CREATE TABLE IF NOT EXISTS snippets (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    code TEXT NOT NULL,
                    language TEXT,
                    description TEXT,
                    created_at INTEGER DEFAULT (strftime('%s','now'))
                )
            """)

            # Snippets FTS5
            conn.execute("""
                CREATE VIRTUAL TABLE IF NOT EXISTS snippets_fts USING fts5(
                    name, code, description,
                    content=snippets,
                    content_rowid=id
                )
            """)

            # Errors table
            conn.execute("""
                CREATE TABLE IF NOT EXISTS errors (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    error_text TEXT,
                    solution TEXT,
                    lesson TEXT,
                    created_at INTEGER DEFAULT (strftime('%s','now'))
                )
            """)

            # Errors FTS5
            conn.execute("""
                CREATE VIRTUAL TABLE IF NOT EXISTS errors_fts USING fts5(
                    title, error_text, solution, lesson,
                    content=errors,
                    content_rowid=id
                )
            """)

            # Tags table (many-to-many)
            conn.execute("""
                CREATE TABLE IF NOT EXISTS tags (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT UNIQUE NOT NULL
                )
            """)

            conn.execute("""
                CREATE TABLE IF NOT EXISTS decision_tags (
                    decision_id INTEGER,
                    tag_id INTEGER,
                    PRIMARY KEY (decision_id, tag_id),
                    FOREIGN KEY (decision_id) REFERENCES decisions(id) ON DELETE CASCADE,
                    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
                )
            """)

            conn.execute("""
                CREATE TABLE IF NOT EXISTS log_tags (
                    log_id INTEGER,
                    tag_id INTEGER,
                    PRIMARY KEY (log_id, tag_id),
                    FOREIGN KEY (log_id) REFERENCES logs(id) ON DELETE CASCADE,
                    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
                )
            """)

            conn.execute("""
                CREATE TABLE IF NOT EXISTS snippet_tags (
                    snippet_id INTEGER,
                    tag_id INTEGER,
                    PRIMARY KEY (snippet_id, tag_id),
                    FOREIGN KEY (snippet_id) REFERENCES snippets(id) ON DELETE CASCADE,
                    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
                )
            """)

            conn.commit()

    def get_connection(self):
        """Get database connection"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        return conn


class DecisionsDAO:
    """Data Access Object for decisions"""

    def __init__(self, db: Database):
        self.db = db

    def add(self, title: str, decision: str, problem: str = None,
            alternatives: str = None, consequences: str = None,
            project: str = None, tags: List[str] = None) -> int:
        """Add a new decision"""
        with self.db.get_connection() as conn:
            # Get or create project
            project_id = None
            if project:
                cursor = conn.execute("SELECT id FROM projects WHERE name = ?", (project,))
                row = cursor.fetchone()
                if row:
                    project_id = row['id']
                else:
                    cursor = conn.execute("INSERT INTO projects (name) VALUES (?)", (project,))
                    project_id = cursor.lastrowid

            # Insert decision
            cursor = conn.execute("""
                INSERT INTO decisions (project_id, title, problem, decision, alternatives, consequences)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (project_id, title, problem, decision, alternatives, consequences))

            decision_id = cursor.lastrowid

            # Update FTS
            conn.execute("""
                INSERT INTO decisions_fts (rowid, title, problem, decision, alternatives, consequences)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (decision_id, title, problem, decision, alternatives, consequences))

            # Add tags
            if tags:
                for tag_name in tags:
                    cursor = conn.execute("SELECT id FROM tags WHERE name = ?", (tag_name,))
                    row = cursor.fetchone()
                    if row:
                        tag_id = row['id']
                    else:
                        cursor = conn.execute("INSERT INTO tags (name) VALUES (?)", (tag_name,))
                        tag_id = cursor.lastrowid

                    conn.execute("INSERT OR IGNORE INTO decision_tags (decision_id, tag_id) VALUES (?, ?)",
                                 (decision_id, tag_id))

            conn.commit()
            return decision_id

    def search(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Search decisions using FTS5"""
        with self.db.get_connection() as conn:
            cursor = conn.execute("""
                SELECT d.*, p.name as project_name
                FROM decisions d
                LEFT JOIN projects p ON d.project_id = p.id
                WHERE d.id IN (
                    SELECT rowid FROM decisions_fts WHERE decisions_fts MATCH ?
                )
                ORDER BY d.date DESC
                LIMIT ?
            """, (query, limit))

            return [dict(row) for row in cursor.fetchall()]

    def get(self, decision_id: int) -> Optional[Dict[str, Any]]:
        """Get decision by ID"""
        with self.db.get_connection() as conn:
            cursor = conn.execute("""
                SELECT d.*, p.name as project_name
                FROM decisions d
                LEFT JOIN projects p ON d.project_id = p.id
                WHERE d.id = ?
            """, (decision_id,))

            row = cursor.fetchone()
            return dict(row) if row else None


class LogsDAO:
    """Data Access Object for logs"""

    def __init__(self, db: Database):
        self.db = db

    def add(self, summary: str, details: str = None, project: str = None,
            tags: List[str] = None) -> int:
        """Add a new log entry"""
        with self.db.get_connection() as conn:
            # Get or create project
            project_id = None
            if project:
                cursor = conn.execute("SELECT id FROM projects WHERE name = ?", (project,))
                row = cursor.fetchone()
                if row:
                    project_id = row['id']
                else:
                    cursor = conn.execute("INSERT INTO projects (name) VALUES (?)", (project,))
                    project_id = cursor.lastrowid

            # Insert log
            cursor = conn.execute("""
                INSERT INTO logs (project_id, summary, details)
                VALUES (?, ?, ?)
            """, (project_id, summary, details))

            log_id = cursor.lastrowid

            # Update FTS
            conn.execute("""
                INSERT INTO logs_fts (rowid, summary, details)
                VALUES (?, ?, ?)
            """, (log_id, summary, details))

            # Add tags
            if tags:
                for tag_name in tags:
                    cursor = conn.execute("SELECT id FROM tags WHERE name = ?", (tag_name,))
                    row = cursor.fetchone()
                    if row:
                        tag_id = row['id']
                    else:
                        cursor = conn.execute("INSERT INTO tags (name) VALUES (?)", (tag_name,))
                        tag_id = cursor.lastrowid

                    conn.execute("INSERT OR IGNORE INTO log_tags (log_id, tag_id) VALUES (?, ?)",
                                 (log_id, tag_id))

            conn.commit()
            return log_id

    def search(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Search logs using FTS5"""
        with self.db.get_connection() as conn:
            cursor = conn.execute("""
                SELECT l.*, p.name as project_name
                FROM logs l
                LEFT JOIN projects p ON l.project_id = p.id
                WHERE l.id IN (
                    SELECT rowid FROM logs_fts WHERE logs_fts MATCH ?
                )
                ORDER BY l.date DESC
                LIMIT ?
            """, (query, limit))

            return [dict(row) for row in cursor.fetchall()]


class SnippetsDAO:
    """Data Access Object for code snippets"""

    def __init__(self, db: Database):
        self.db = db

    def add(self, name: str, code: str, language: str = None,
            description: str = None, tags: List[str] = None) -> int:
        """Add a new snippet"""
        with self.db.get_connection() as conn:
            cursor = conn.execute("""
                INSERT INTO snippets (name, code, language, description)
                VALUES (?, ?, ?, ?)
            """, (name, code, language, description))

            snippet_id = cursor.lastrowid

            # Update FTS
            conn.execute("""
                INSERT INTO snippets_fts (rowid, name, code, description)
                VALUES (?, ?, ?, ?)
            """, (snippet_id, name, code, description))

            # Add tags
            if tags:
                for tag_name in tags:
                    cursor = conn.execute("SELECT id FROM tags WHERE name = ?", (tag_name,))
                    row = cursor.fetchone()
                    if row:
                        tag_id = row['id']
                    else:
                        cursor = conn.execute("INSERT INTO tags (name) VALUES (?)", (tag_name,))
                        tag_id = cursor.lastrowid

                    conn.execute("INSERT OR IGNORE INTO snippet_tags (snippet_id, tag_id) VALUES (?, ?)",
                                 (snippet_id, tag_id))

            conn.commit()
            return snippet_id

    def search(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Search snippets using FTS5"""
        with self.db.get_connection() as conn:
            cursor = conn.execute("""
                SELECT * FROM snippets
                WHERE id IN (
                    SELECT rowid FROM snippets_fts WHERE snippets_fts MATCH ?
                )
                ORDER BY created_at DESC
                LIMIT ?
            """, (query, limit))

            return [dict(row) for row in cursor.fetchall()]


class ErrorsDAO:
    """Data Access Object for errors and lessons"""

    def __init__(self, db: Database):
        self.db = db

    def add(self, title: str, error_text: str = None, solution: str = None,
            lesson: str = None) -> int:
        """Add a new error/lesson"""
        with self.db.get_connection() as conn:
            cursor = conn.execute("""
                INSERT INTO errors (title, error_text, solution, lesson)
                VALUES (?, ?, ?, ?)
            """, (title, error_text, solution, lesson))

            error_id = cursor.lastrowid

            # Update FTS
            conn.execute("""
                INSERT INTO errors_fts (rowid, title, error_text, solution, lesson)
                VALUES (?, ?, ?, ?, ?)
            """, (error_id, title, error_text, solution, lesson))

            conn.commit()
            return error_id

    def search(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Search errors using FTS5"""
        with self.db.get_connection() as conn:
            cursor = conn.execute("""
                SELECT * FROM errors
                WHERE id IN (
                    SELECT rowid FROM errors_fts WHERE errors_fts MATCH ?
                )
                ORDER BY created_at DESC
                LIMIT ?
            """, (query, limit))

            return [dict(row) for row in cursor.fetchall()]


class DAL:
    """Main Data Access Layer interface"""

    def __init__(self, db_path: str = str(DB_PATH)):
        self.db = Database(db_path)
        self.decisions = DecisionsDAO(self.db)
        self.logs = LogsDAO(self.db)
        self.snippets = SnippetsDAO(self.db)
        self.errors = ErrorsDAO(self.db)


# Global instance
dal = DAL()


if __name__ == "__main__":
    print("ARKHOS Data Access Layer")
    print(f"Database: {DB_PATH}")
    print("\nUsage:")
    print("  from data_access_layer import dal")
    print("  dal.decisions.add(title=..., decision=..., ...)")
    print("  dal.logs.add(summary=..., ...)")
    print("  dal.snippets.add(name=..., code=..., ...)")
    print("  dal.errors.add(title=..., solution=..., ...)")
    print("\nDatabase initialized successfully.")
