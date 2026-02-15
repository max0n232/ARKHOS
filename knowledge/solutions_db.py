"""
Solutions Database Helper
Records and retrieves successful approaches for future reference.
"""
import sqlite3
import json
from datetime import datetime
from pathlib import Path

DB_PATH = Path(__file__).parent / "memory.db"


def get_connection():
    return sqlite3.connect(DB_PATH)


def record_solution(
    problem: str,
    approach: str,
    context: str = None,
    category: str = None,
    code_snippet: str = None,
    api_endpoint: str = None,
    failed_approaches: list = None,
    tags: list = None
) -> int:
    """Record a successful solution to the database."""
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO solutions
        (problem, approach, context, category, code_snippet, api_endpoint,
         failed_approaches, tags, last_used)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        problem,
        approach,
        context,
        category,
        code_snippet,
        api_endpoint,
        json.dumps(failed_approaches) if failed_approaches else None,
        json.dumps(tags) if tags else None,
        datetime.now().isoformat()
    ))

    solution_id = cur.lastrowid
    conn.commit()
    conn.close()

    return solution_id


def find_solution(query: str, category: str = None, limit: int = 5) -> list:
    """Search for existing solutions using FTS5."""
    conn = get_connection()
    cur = conn.cursor()

    if category:
        cur.execute("""
            SELECT s.id, s.problem, s.approach, s.context, s.category,
                   s.code_snippet, s.api_endpoint, s.failed_approaches,
                   s.success_count, s.tags
            FROM solutions s
            JOIN solutions_fts fts ON s.id = fts.rowid
            WHERE solutions_fts MATCH ? AND s.category = ?
            ORDER BY s.frecency DESC, s.success_count DESC
            LIMIT ?
        """, (query, category, limit))
    else:
        cur.execute("""
            SELECT s.id, s.problem, s.approach, s.context, s.category,
                   s.code_snippet, s.api_endpoint, s.failed_approaches,
                   s.success_count, s.tags
            FROM solutions s
            JOIN solutions_fts fts ON s.id = fts.rowid
            WHERE solutions_fts MATCH ?
            ORDER BY s.frecency DESC, s.success_count DESC
            LIMIT ?
        """, (query, limit))

    results = []
    for row in cur.fetchall():
        results.append({
            "id": row[0],
            "problem": row[1],
            "approach": row[2],
            "context": row[3],
            "category": row[4],
            "code_snippet": row[5],
            "api_endpoint": row[6],
            "failed_approaches": json.loads(row[7]) if row[7] else [],
            "success_count": row[8],
            "tags": json.loads(row[9]) if row[9] else []
        })

    conn.close()
    return results


def mark_solution_used(solution_id: int):
    """Increment success count and update frecency when solution is reused."""
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        UPDATE solutions
        SET success_count = success_count + 1,
            last_used = ?,
            frecency = MIN(1.0, frecency + 0.1),
            updated_at = ?
        WHERE id = ?
    """, (datetime.now().isoformat(), datetime.now().isoformat(), solution_id))

    conn.commit()
    conn.close()


def list_solutions_by_category(category: str = None, limit: int = 20) -> list:
    """List recent solutions, optionally filtered by category."""
    conn = get_connection()
    cur = conn.cursor()

    if category:
        cur.execute("""
            SELECT id, problem, approach, category, success_count, last_used
            FROM solutions
            WHERE category = ?
            ORDER BY last_used DESC
            LIMIT ?
        """, (category, limit))
    else:
        cur.execute("""
            SELECT id, problem, approach, category, success_count, last_used
            FROM solutions
            ORDER BY last_used DESC
            LIMIT ?
        """, (limit,))

    results = []
    for row in cur.fetchall():
        results.append({
            "id": row[0],
            "problem": row[1],
            "approach": row[2],
            "category": row[3],
            "success_count": row[4],
            "last_used": row[5]
        })

    conn.close()
    return results


if __name__ == "__main__":
    # Test: record a solution
    solution_id = record_solution(
        problem="Test problem",
        approach="Test approach",
        category="test",
        tags=["test", "demo"]
    )
    print(f"Recorded solution ID: {solution_id}")

    # Test: find it
    results = find_solution("test")
    print(f"Found {len(results)} solutions")

    # Cleanup test
    conn = get_connection()
    conn.execute("DELETE FROM solutions WHERE category = 'test'")
    conn.commit()
    conn.close()
    print("Test cleanup done")
