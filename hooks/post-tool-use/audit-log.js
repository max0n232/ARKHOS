#!/usr/bin/env node
/**
 * PostToolUse Hook: Audit Logger
 *
 * Logs all tool usage to daily JSONL files for security auditing.
 * Runs after every tool execution.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CLAUDE_DIR = path.join(process.env.HOME || process.env.USERPROFILE, '.claude');
const AUDIT_DIR = path.join(CLAUDE_DIR, 'security', 'audit');

/**
 * Get today's date in YYYY-MM-DD format
 */
function getDateString() {
    const now = new Date();
    return now.toISOString().split('T')[0];
}

/**
 * Ensure audit directory exists
 */
function ensureAuditDir() {
    if (!fs.existsSync(AUDIT_DIR)) {
        fs.mkdirSync(AUDIT_DIR, { recursive: true });
    }
}

/**
 * Mask sensitive values in objects
 */
function maskSensitive(obj) {
    if (!obj || typeof obj !== 'object') return obj;

    const sensitiveKeys = [
        'password', 'secret', 'token', 'key', 'auth',
        'credential', 'api_key', 'apikey', 'bearer'
    ];

    const masked = Array.isArray(obj) ? [...obj] : { ...obj };

    for (const key of Object.keys(masked)) {
        const lowerKey = key.toLowerCase();
        const isSensitive = sensitiveKeys.some(s => lowerKey.includes(s));

        if (isSensitive && typeof masked[key] === 'string') {
            masked[key] = '***MASKED***';
        } else if (typeof masked[key] === 'object') {
            masked[key] = maskSensitive(masked[key]);
        }
    }

    return masked;
}

/**
 * Main audit logging
 */
async function auditLog() {
    // Read input from stdin
    let input = '';
    for await (const chunk of process.stdin) {
        input += chunk;
    }

    let data;
    try {
        data = JSON.parse(input);
    } catch (e) {
        // Not JSON, create minimal entry
        data = { raw_input: input.trim() };
    }

    // Create audit entry
    const entry = {
        timestamp: new Date().toISOString(),
        session_id: process.env.CLAUDE_SESSION_ID || 'unknown',
        tool: data.tool_name || data.tool || 'unknown',
        input: maskSensitive(data.tool_input || data.input || {}),
        output_summary: data.tool_output
            ? (typeof data.tool_output === 'string'
                ? data.tool_output.substring(0, 200)
                : JSON.stringify(data.tool_output).substring(0, 200))
            : null,
        success: data.success !== false,
        duration_ms: data.duration_ms || null,
        working_dir: process.cwd()
    };

    // Write to audit file
    try {
        ensureAuditDir();
        const auditFile = path.join(AUDIT_DIR, `${getDateString()}.jsonl`);
        fs.appendFileSync(auditFile, JSON.stringify(entry) + '\n');
    } catch (e) {
        console.error(`Audit log error: ${e.message}`);
    }

    // Always allow (audit is passive)
    process.exit(0);
}

auditLog().catch(err => {
    console.error(`Audit error: ${err.message}`);
    process.exit(0); // Don't block on audit errors
});
