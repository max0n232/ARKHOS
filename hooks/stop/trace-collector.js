#!/usr/bin/env node
/**
 * Stop Hook: Trace Collector
 *
 * Workaround for Claude Code PostToolUse bug (#6305).
 * Parses transcript JSONL at Stop time, extracts tool_use/tool_result pairs,
 * batch-inserts into traces table.
 *
 * Incremental: tracks last processed line per session via config table.
 * Runs in parallel with pattern-detector Stop hook.
 *
 * Input: stdin JSON with { session_id, transcript_path, ... }
 * Output: stderr only (trace count)
 */

const fs = require('fs');
const { getDb, getConfig, setConfig, loadCapsule, truncate } = require('../../patterns/db-helper');

function readStdinSync() {
    const chunks = [];
    const buf = Buffer.alloc(1024);
    try {
        let bytesRead;
        while ((bytesRead = fs.readSync(0, buf, 0, 1024)) > 0) {
            chunks.push(buf.slice(0, bytesRead).toString());
        }
    } catch (e) {}
    return chunks.join('');
}

function stringify(val) {
    if (val == null) return null;
    if (typeof val === 'string') return val;
    try { return JSON.stringify(val); } catch { return String(val); }
}

function extractExitCode(output, isError) {
    if (isError) return 1;
    if (!output) return 0;
    const str = typeof output === 'string' ? output : stringify(output);
    if (/BLOCKED|denied by security/i.test(str)) return -1;
    if (/\b(ENOENT|EACCES|EPERM|FATAL|SyntaxError|TypeError|ReferenceError)\b/.test(str)) return 1;
    if (/exit.?code["\s:]+[1-9]/i.test(str)) return 1;
    if (/\bCommand failed\b/i.test(str)) return 1;
    return 0;
}

function extractToolResultContent(block) {
    const content = block.content;
    if (content == null) return '';
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) {
        return content.map(c => {
            if (typeof c === 'string') return c;
            if (c.type === 'text') return c.text || '';
            return '';
        }).filter(Boolean).join('\n');
    }
    return stringify(content);
}

function main() {
    // 1. Read stdin JSON
    const raw = readStdinSync();
    if (!raw.trim()) process.exit(0);

    let stdinData;
    try { stdinData = JSON.parse(raw); } catch { process.exit(0); }

    const transcriptPath = stdinData.transcript_path;
    if (!transcriptPath || !fs.existsSync(transcriptPath)) process.exit(0);

    // 2. Open DB
    const db = getDb();
    if (!db) process.exit(0);

    try {
        const capsule = loadCapsule();
        const sessionId = stdinData.session_id || capsule?.session_id || 'unknown';
        const project = capsule?.project || 'unknown';

        // 3. Get offset for incremental processing
        const offsetKey = `trace_offset_${sessionId}`;
        const lastOffset = parseInt(getConfig(db, offsetKey, 0)) || 0;

        // 4. Read transcript lines
        const content = fs.readFileSync(transcriptPath, 'utf8');
        const lines = content.trim().split('\n').filter(Boolean);

        if (lines.length <= lastOffset) {
            db.close();
            process.exit(0);
        }

        // 5. Parse tool_use / tool_result pairs from new lines
        // tool_use appears in assistant messages, tool_result in the next user message
        const pendingToolUses = new Map(); // tool_use_id → { name, input, lineIndex }
        const traces = [];

        for (let i = lastOffset; i < lines.length; i++) {
            let msg;
            try { msg = JSON.parse(lines[i]); } catch { continue; }

            // Claude Code transcript format: tool data is in msg.message.content
            const inner = msg.message || msg;
            const blocks = inner.content;
            if (!Array.isArray(blocks)) continue;

            for (const block of blocks) {
                // Collect tool_use entries
                if (block.type === 'tool_use' && block.id) {
                    pendingToolUses.set(block.id, {
                        name: block.name || 'unknown',
                        input: block.input,
                        lineIndex: i
                    });
                }

                // Match tool_result to its tool_use
                if (block.type === 'tool_result' && block.tool_use_id) {
                    const use = pendingToolUses.get(block.tool_use_id);
                    if (use) {
                        const outputStr = extractToolResultContent(block);
                        const isError = block.is_error === true;
                        traces.push({
                            tool_name: use.name,
                            tool_input: stringify(use.input),
                            exit_code: extractExitCode(outputStr, isError),
                            error_output: isError ? outputStr : null,
                            lineIndex: use.lineIndex
                        });
                        pendingToolUses.delete(block.tool_use_id);
                    }
                }
            }
        }

        // 6. Batch insert traces (transaction for performance)
        if (traces.length > 0) {
            const stmt = db.prepare(`
                INSERT INTO traces (
                    session_id, timestamp, tool_name, tool_input,
                    exit_code, error_output, duration_ms, token_budget_pct, project
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            const now = Math.floor(Date.now() / 1000);
            const tokenBudgetPct = capsule?.token_budget?.total > 0
                ? capsule.token_budget.used / capsule.token_budget.total
                : 0;

            const insertAll = db.transaction(() => {
                for (const t of traces) {
                    stmt.run(
                        sessionId,
                        now,
                        t.tool_name,
                        truncate(t.tool_input, 500),
                        t.exit_code,
                        truncate(t.error_output, 1000),
                        null,
                        tokenBudgetPct,
                        project
                    );
                }
            });
            insertAll();
        }

        // 7. Update offset
        setConfig(db, offsetKey, lines.length);

        // 8. Rotation: delete traces and detections older than 7 days
        const cutoff = Math.floor(Date.now() / 1000) - 7 * 24 * 3600;
        try {
            db.prepare('DELETE FROM traces WHERE timestamp < ?').run(cutoff);
            db.prepare('DELETE FROM detections WHERE timestamp < ?').run(cutoff);
            db.pragma('wal_checkpoint(TRUNCATE)');
        } catch (_) {}

        db.close();

        if (traces.length > 0) {
            process.stderr.write(`[TraceCollector] ${traces.length} traces from transcript\n`);
        }
    } catch (e) {
        try { db.close(); } catch (_) {}
        process.stderr.write(`[TraceCollector] Error: ${e.message.substring(0, 80)}\n`);
    }

    process.exit(0);
}

main();
