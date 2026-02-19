#!/usr/bin/env node
/**
 * PreToolUse Hook: Command Validator
 *
 * Validates Bash commands against security rules before execution.
 * Exit codes:
 *   0 - Allow (command is safe)
 *   1 - Error (validation failed)
 *   2 - Block (command is denied)
 */

const fs = require('fs');
const path = require('path');

// Configuration paths
const CLAUDE_DIR = path.join(process.env.HOME || process.env.USERPROFILE, '.claude');
const RULES_JSON_PATH = path.join(CLAUDE_DIR, 'security', 'rules.json');
const PROJECT_RULES_PATH = path.join(process.cwd(), '.claude', 'security.json');

/**
 * Load rules from JSON file
 */
function loadRules(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf-8');
            return JSON.parse(content);
        }
    } catch (e) {
        console.error(`Warning: Could not load rules from ${filePath}: ${e.message}`);
    }
    return null;
}

/**
 * Check if command matches any pattern
 */
function matchesPattern(command, patterns, isRegex = false) {
    for (const pattern of patterns || []) {
        if (isRegex) {
            try {
                const regex = new RegExp(pattern, 'i');
                if (regex.test(command)) return { matched: true, pattern };
            } catch (e) {
                // Invalid regex, skip
            }
        } else {
            if (command === pattern || command.startsWith(pattern + ' ')) {
                return { matched: true, pattern };
            }
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

    // Merge deny rules
    if (projectRules.deny) {
        if (projectRules.deny.commands) {
            merged.deny.commands = [
                ...(merged.deny.commands || []),
                ...projectRules.deny.commands
            ];
        }
        if (projectRules.deny.commands_regex) {
            merged.deny.commands_regex = [
                ...(merged.deny.commands_regex || []),
                ...projectRules.deny.commands_regex
            ];
        }
        if (projectRules.deny.file_patterns) {
            merged.deny.file_patterns = [
                ...(merged.deny.file_patterns || []),
                ...projectRules.deny.file_patterns
            ];
        }
    }

    // Merge allow rules
    if (projectRules.allow) {
        if (projectRules.allow.commands) {
            merged.allow.commands = [
                ...(merged.allow.commands || []),
                ...projectRules.allow.commands
            ];
        }
        if (projectRules.allow.commands_regex) {
            merged.allow.commands_regex = [
                ...(merged.allow.commands_regex || []),
                ...projectRules.allow.commands_regex
            ];
        }
    }

    return merged;
}

/**
 * Main validation logic
 */
async function validate() {
    // Read input from stdin (Claude Code sends JSON)
    let input = '';
    for await (const chunk of process.stdin) {
        input += chunk;
    }

    let toolInput;
    try {
        const data = JSON.parse(input);
        toolInput = data.tool_input || data;
    } catch (e) {
        // Not JSON, treat as raw command
        toolInput = { command: input.trim() };
    }

    const command = toolInput.command || '';
    if (!command) {
        // No command to validate
        process.exit(0);
    }

    // Load global rules
    let rules = loadRules(RULES_JSON_PATH) || { deny: {}, allow: {}, passthrough: {} };

    // Load and merge project-specific rules
    const projectRules = loadRules(PROJECT_RULES_PATH);
    if (projectRules) {
        rules = mergeRules(rules, projectRules);
    }

    // 1. Check passthrough (skip validation)
    const passthrough = matchesPattern(command.split(' ')[0], rules.passthrough?.commands);
    if (passthrough.matched) {
        process.exit(0);
    }

    // 2. Check deny rules - exact match
    let denied = matchesPattern(command, rules.deny?.commands);
    if (denied.matched) {
        console.log(JSON.stringify({
            decision: 'block',
            reason: `Command blocked by security rule: ${denied.pattern}`
        }));
        process.exit(2);
    }

    // 3. Check deny rules - regex match
    denied = matchesPattern(command, rules.deny?.commands_regex, true);
    if (denied.matched) {
        console.log(JSON.stringify({
            decision: 'block',
            reason: `Command blocked by security pattern: ${denied.pattern}`
        }));
        process.exit(2);
    }

    // 4. Check allow rules - exact match
    let allowed = matchesPattern(command, rules.allow?.commands);
    if (allowed.matched) {
        process.exit(0);
    }

    // 5. Check allow rules - regex match
    allowed = matchesPattern(command, rules.allow?.commands_regex, true);
    if (allowed.matched) {
        process.exit(0);
    }

    // 6. Default: passthrough to Claude's native permission system
    process.exit(0);
}

validate().catch(err => {
    console.error(`Validation error: ${err.message}`);
    process.exit(1);
});
