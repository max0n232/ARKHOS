#!/usr/bin/env node
/**
 * PreToolUse Hook: File Access Validator
 *
 * Validates file read/write operations against security rules.
 * Exit codes:
 *   0 - Allow
 *   2 - Block
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CLAUDE_DIR = path.join(process.env.HOME || process.env.USERPROFILE, '.claude');
const RULES_JSON_PATH = path.join(CLAUDE_DIR, 'security', 'rules.json');
const PROJECT_RULES_PATH = path.join(process.cwd(), '.claude', 'security.json');

/**
 * Load rules from JSON file
 */
function loadRules(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        }
    } catch (e) {
        // Silent fail
    }
    return null;
}

/**
 * Match file path against glob patterns
 */
function matchesGlob(filePath, patterns) {
    const normalizedPath = filePath.replace(/\\/g, '/').toLowerCase();

    for (const pattern of patterns || []) {
        const normalizedPattern = pattern.replace(/\\/g, '/').toLowerCase();

        // Convert glob to regex
        const regexPattern = normalizedPattern
            .replace(/\./g, '\\.')
            .replace(/\*\*/g, '___DOUBLE_STAR___')
            .replace(/\*/g, '[^/]*')
            .replace(/___DOUBLE_STAR___/g, '.*')
            .replace(/\?/g, '.');

        try {
            const regex = new RegExp(regexPattern);
            if (regex.test(normalizedPath)) {
                return { matched: true, pattern };
            }
        } catch (e) {
            // Invalid pattern
        }

        // Direct substring match for simple patterns
        const simplePattern = normalizedPattern.replace(/\*/g, '');
        if (simplePattern && normalizedPath.includes(simplePattern)) {
            return { matched: true, pattern };
        }
    }

    return { matched: false };
}

/**
 * Merge project rules into global rules
 */
function mergeRules(globalRules, projectRules) {
    if (!projectRules) return globalRules;

    const merged = JSON.parse(JSON.stringify(globalRules));

    if (projectRules.deny?.file_patterns) {
        merged.deny = merged.deny || {};
        merged.deny.file_patterns = [
            ...(merged.deny.file_patterns || []),
            ...projectRules.deny.file_patterns
        ];
    }

    if (projectRules.allow?.file_patterns) {
        merged.allow = merged.allow || {};
        merged.allow.file_patterns = [
            ...(merged.allow.file_patterns || []),
            ...projectRules.allow.file_patterns
        ];
    }

    return merged;
}

async function validate() {
    let input = '';
    for await (const chunk of process.stdin) {
        input += chunk;
    }

    let toolInput;
    try {
        const data = JSON.parse(input);
        toolInput = data.tool_input || data;
    } catch (e) {
        toolInput = {};
    }

    const filePath = toolInput.file_path || toolInput.path || '';
    if (!filePath) {
        process.exit(0);
    }

    // Load global rules
    let rules = loadRules(RULES_JSON_PATH) || { deny: {}, allow: {} };

    // Load and merge project rules
    const projectRules = loadRules(PROJECT_RULES_PATH);
    if (projectRules) {
        rules = mergeRules(rules, projectRules);
    }

    // Check deny patterns first
    const denied = matchesGlob(filePath, rules.deny?.file_patterns);
    if (denied.matched) {
        console.log(JSON.stringify({
            decision: 'block',
            reason: `File access blocked: ${denied.pattern}`
        }));
        process.exit(2);
    }

    // Check allow patterns
    const allowed = matchesGlob(filePath, rules.allow?.file_patterns);
    if (allowed.matched) {
        process.exit(0);
    }

    // Default: passthrough to Claude's native permission system
    process.exit(0);
}

validate().catch(() => process.exit(0));
