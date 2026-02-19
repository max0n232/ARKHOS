#!/usr/bin/env node
/**
 * WordPress Changes Validator - PreToolUse Hook
 *
 * Enforces the WordPress Problem-Solving Protocol:
 * 1. Requires 5 Whys analysis before PHP changes
 * 2. Checks for existing snippets
 * 3. Blocks premature fixes
 *
 * Exit codes:
 * - 0: Allow
 * - 2: Block (message sent to Claude)
 */

const fs = require('fs');
const path = require('path');

const STUDIOKOOK_DIR = 'C:\\Users\\sorte\\Desktop\\Studiokook';
const REGISTRY_PATH = path.join(STUDIOKOOK_DIR, 'knowledge', 'snippets-registry.json');
const SESSION_STATE_PATH = path.join(STUDIOKOOK_DIR, '.claude', 'session-state.json');

// Patterns that indicate PHP/WordPress code changes
const PHP_PATTERNS = [
    /\.php$/i,
    /add_action\s*\(/,
    /add_filter\s*\(/,
    /function\s+\w+\s*\(/,
    /\$wpdb/,
    /wp_query/i,
    /get_post/,
    /update_option/,
    /add_shortcode/
];

// Keywords that indicate 5 Whys analysis was done
const ANALYSIS_KEYWORDS = [
    'root cause',
    'корневая причина',
    'why 1',
    'why 2',
    'почему',
    '5 whys',
    'причина проблемы',
    'анализ причин'
];

function loadRegistry() {
    try {
        if (fs.existsSync(REGISTRY_PATH)) {
            return JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf-8'));
        }
    } catch (e) {}
    return { snippets: [] };
}

function loadSessionState() {
    try {
        if (fs.existsSync(SESSION_STATE_PATH)) {
            return JSON.parse(fs.readFileSync(SESSION_STATE_PATH, 'utf-8'));
        }
    } catch (e) {}
    return { analysis_done: false, snippets_checked: false, user_approved: false };
}

function saveSessionState(state) {
    try {
        const dir = path.dirname(SESSION_STATE_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(SESSION_STATE_PATH, JSON.stringify(state, null, 2));
    } catch (e) {}
}

function isPHPChange(toolInput) {
    const content = JSON.stringify(toolInput).toLowerCase();
    return PHP_PATTERNS.some(pattern => {
        if (pattern instanceof RegExp) {
            return pattern.test(content);
        }
        return content.includes(pattern.toLowerCase());
    });
}

function hasAnalysisInContext(toolInput) {
    const content = JSON.stringify(toolInput).toLowerCase();
    return ANALYSIS_KEYWORDS.some(keyword => content.includes(keyword.toLowerCase()));
}

function findSimilarSnippets(purpose, registry) {
    if (!purpose || !registry.snippets) return [];

    const words = purpose.toLowerCase().split(/\s+/);
    return registry.snippets.filter(snippet => {
        if (snippet.status === 'deleted') return false;
        const snippetText = `${snippet.purpose} ${snippet.title} ${snippet.root_cause}`.toLowerCase();
        return words.some(word => word.length > 3 && snippetText.includes(word));
    });
}

function main() {
    // Read input from Claude Code
    let input = '';
    try {
        input = fs.readFileSync(0, 'utf-8');
    } catch (e) {
        process.exit(0); // Allow if can't read input
    }

    let toolInput;
    try {
        toolInput = JSON.parse(input);
    } catch (e) {
        process.exit(0); // Allow if can't parse
    }

    const toolName = toolInput.tool_name || '';
    const content = toolInput.tool_input || {};

    // Only validate Write/Edit tools with PHP content
    if (!['Write', 'Edit'].includes(toolName)) {
        process.exit(0);
    }

    if (!isPHPChange(content)) {
        process.exit(0);
    }

    // Load state
    const registry = loadRegistry();
    const sessionState = loadSessionState();

    // Check 1: Was 5 Whys analysis done?
    if (!sessionState.analysis_done && !hasAnalysisInContext(content)) {
        console.error(`BLOCKED: Use /wp-problem-solver skill first.
Run 5 Whys analysis before PHP changes. See: skills/wp-problem-solver/SKILL.md`);
        process.exit(2);
    }

    // Check 2: Were existing snippets checked?
    if (!sessionState.snippets_checked && registry.snippets.length > 0) {
        const similar = findSimilarSnippets(content.content || '', registry);
        if (similar.length > 0) {
            const ids = similar.slice(0, 3).map(s => s.id).join(', ');
            console.error(`BLOCKED: Similar snippets exist: ${ids}
Check knowledge/snippets-registry.json before creating new code.`);
            process.exit(2);
        }
    }

    // All checks passed
    process.exit(0);
}

// Output for Claude Code hooks
const output = {
    hookSpecificOutput: {
        permissionDecision: 'allow'
    }
};

try {
    main();
} catch (e) {
    // On any error, allow the operation
    console.log(JSON.stringify(output));
    process.exit(0);
}
