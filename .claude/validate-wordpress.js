#!/usr/bin/env node
/**
 * WordPress Safety Validator
 *
 * Checks PHP code for dangerous WordPress patterns before write/edit.
 * Specifically blocks wp_update_post() in Code Snippets.
 */

const fs = require('fs');
const path = require('path');

// Dangerous patterns for WordPress/PHP
const DANGEROUS_PATTERNS = [
    {
        pattern: /wp_update_post\s*\(/gi,
        message: 'wp_update_post() is forbidden! Use $wpdb->update() instead.',
        severity: 'block'
    },
    {
        pattern: /\$_GET\s*\[/gi,
        message: 'Direct $_GET access is insecure. Use sanitize functions.',
        severity: 'warn'
    },
    {
        pattern: /\$_POST\s*\[/gi,
        message: 'Direct $_POST access is insecure. Use sanitize functions.',
        severity: 'warn'
    },
    {
        pattern: /eval\s*\(/gi,
        message: 'eval() is dangerous and should never be used.',
        severity: 'block'
    },
    {
        pattern: /exec\s*\(/gi,
        message: 'exec() can execute arbitrary commands.',
        severity: 'block'
    },
    {
        pattern: /shell_exec\s*\(/gi,
        message: 'shell_exec() can execute arbitrary commands.',
        severity: 'block'
    },
    {
        pattern: /system\s*\(/gi,
        message: 'system() can execute arbitrary commands.',
        severity: 'block'
    },
    {
        pattern: /passthru\s*\(/gi,
        message: 'passthru() can execute arbitrary commands.',
        severity: 'block'
    },
    {
        pattern: /update_option\s*\(\s*['"](?!_transient)/gi,
        message: 'update_option() can break site config. Verify option name.',
        severity: 'warn'
    }
];

// File patterns to check (WordPress/PHP related)
const PHP_PATTERNS = [
    '*.php',
    '**/code-snippets/**',
    '**/snippets/**'
];

/**
 * Check if file path matches PHP patterns
 */
function isPHPFile(filePath) {
    const normalized = filePath.replace(/\\/g, '/').toLowerCase();
    return normalized.endsWith('.php') ||
           normalized.includes('code-snippets') ||
           normalized.includes('snippets');
}

/**
 * Validate content for dangerous patterns
 */
function validateContent(content, filePath) {
    const issues = [];

    for (const rule of DANGEROUS_PATTERNS) {
        const matches = content.match(rule.pattern);
        if (matches) {
            issues.push({
                pattern: rule.pattern.source,
                message: rule.message,
                severity: rule.severity,
                occurrences: matches.length
            });
        }
    }

    return issues;
}

/**
 * Main validation
 */
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
    const content = toolInput.content || toolInput.new_string || '';

    // Only check PHP-related files
    if (!isPHPFile(filePath)) {
        process.exit(0);
    }

    // Validate content
    const issues = validateContent(content, filePath);

    if (issues.length === 0) {
        process.exit(0);
    }

    // Check for blocking issues
    const blockers = issues.filter(i => i.severity === 'block');
    const warnings = issues.filter(i => i.severity === 'warn');

    if (blockers.length > 0) {
        console.log(JSON.stringify({
            decision: 'block',
            reason: blockers[0].message,
            all_issues: issues
        }));
        process.exit(2);
    }

    // Warnings don't block, just log
    if (warnings.length > 0) {
        console.log(JSON.stringify({
            decision: 'allow',
            warnings: warnings.map(w => w.message)
        }));
    }

    process.exit(0);
}

validate().catch(err => {
    console.error(`WordPress validator error: ${err.message}`);
    process.exit(0);
});
