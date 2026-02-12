#!/usr/bin/env node
/**
 * Post-Mortem Analyzer (Phase 3)
 *
 * Analyzes session errors and applies auto-fixes:
 * - Reads tmp/post-mortem-pending.json
 * - Classifies findings with confidence scoring
 * - Cross-session analysis: boost, regression detection, priority scoring
 * - Patches SKILL.md (confidence ≥0.8)
 * - Writes to patterns/ (confidence ≥0.5)
 * - Appends to project KNOWLEDGE.md (confidence ≥0.7, project-specific)
 * - Git commits after auto-patch
 *
 * Limits (Context Protection):
 * - Max 5 findings processed
 * - Max 3 SKILL.md patches per session
 * - Max 50 lines per log file
 * - Max 500 tokens for previous logs (~2000 chars per file)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CLAUDE_DIR = path.join(process.env.HOME || process.env.USERPROFILE, '.claude');
const PENDING_FILE = path.join(CLAUDE_DIR, 'tmp', 'post-mortem-pending.json');
const LOGS_DIR = path.join(CLAUDE_DIR, 'logs', 'post-mortem');
const PATTERNS_DIR = path.join(CLAUDE_DIR, 'patterns');

// Project knowledge files for project-specific patterns
const PROJECT_KNOWLEDGE = {
    studiokook: path.join(CLAUDE_DIR, 'skills', 'wordpress', 'projects', 'studiokook', 'KNOWLEDGE.md')
};

// Protected files - NEVER modify
const PROTECTED_FILES = [
    'constitution.md',
    'settings.json',
    'hooks/',
    'agents/'
];

// Confidence thresholds
const THRESHOLD = {
    AUTO_FIX: 0.8,
    KNOWLEDGE: 0.7,
    PATTERN: 0.5,
    IGNORE: 0.3
};

// Limits
const LIMITS = {
    MAX_FINDINGS: 5,
    MAX_PATCHES: 3,
    MAX_LOG_LINES: 50,
    MAX_CHARS_PER_LOG: 2000,
    MAX_LINES_PER_LOG: 50
};

/**
 * Calculate base confidence from error patterns
 */
function calculateBaseConfidence(finding) {
    const { errorType, hasWorkaround, retryCount } = finding;

    // HTTP 4xx/5xx AND alternative worked
    if (/HTTP [45]\d{2}/.test(errorType) && hasWorkaround) {
        return 0.9;
    }

    // Workaround worked, error was fuzzy
    if (hasWorkaround && /timeout|partial|fuzzy/i.test(errorType)) {
        return 0.7;
    }

    // Pattern observed, no fix confirmed
    if (!hasWorkaround && retryCount > 0) {
        return 0.5;
    }

    // Anomaly without clear cause
    return 0.3;
}

/**
 * Load previous post-mortem logs for cross-session boost
 * Token limit: ~500 tokens = ~2000 chars = ~50 lines per file
 */
function loadPreviousLogs(maxFiles = 5) {
    const logs = [];

    try {
        if (!fs.existsSync(LOGS_DIR)) return logs;

        const files = fs.readdirSync(LOGS_DIR)
            .filter(f => f.endsWith('.md'))
            .sort()
            .slice(-maxFiles);

        for (const file of files) {
            let content = fs.readFileSync(path.join(LOGS_DIR, file), 'utf-8');

            // Truncate to token limit
            const lines = content.split('\n').slice(0, LIMITS.MAX_LINES_PER_LOG);
            content = lines.join('\n').substring(0, LIMITS.MAX_CHARS_PER_LOG);

            logs.push({ file, content });
        }
    } catch (e) {
        // Continue without previous logs
    }
    return logs;
}

/**
 * Calculate cross-session boost (+0.1 per match, max +0.3)
 */
function calculateCrossSessionBoost(finding, previousLogs) {
    let matches = 0;
    const searchTerms = [
        finding.errorType,
        finding.location,
        finding.original?.substring(0, 50)
    ].filter(Boolean);

    for (const log of previousLogs) {
        for (const term of searchTerms) {
            if (log.content.includes(term)) {
                matches++;
                break; // One match per log file
            }
        }
    }

    return Math.min(matches * 0.1, 0.3);
}

/**
 * Detect regression: error in domain that previously worked
 * Returns true if domain had [AUTO-FIXED] entries but now has new errors
 */
function detectRegression(finding, previousLogs) {
    const domain = extractDomain(finding.location);
    if (!domain) return false;

    // Check if domain had successful fixes before
    for (const log of previousLogs) {
        if (log.content.includes('[AUTO-FIXED]') && log.content.includes(domain)) {
            // Domain was working, now has error = regression
            return true;
        }
    }

    return false;
}

/**
 * Extract domain from location (e.g., studiokook.ee, n8n, etc.)
 */
function extractDomain(location) {
    if (!location) return null;

    const domainPatterns = [
        /studiokook/i,
        /wordpress|wp/i,
        /n8n/i,
        /fal[-.]?ai/i
    ];

    for (const pattern of domainPatterns) {
        if (pattern.test(location)) {
            return pattern.source.replace(/[\\[\]|]/g, '');
        }
    }

    // Try to extract hostname
    const urlMatch = location.match(/(?:https?:\/\/)?([^\/]+)/);
    if (urlMatch) return urlMatch[1];

    return null;
}

/**
 * Calculate priority score based on frequency across sessions
 * Higher score = more frequent = higher priority
 */
function calculatePriorityScore(finding, previousLogs) {
    let occurrences = 0;
    const errorType = finding.errorType;

    for (const log of previousLogs) {
        // Count occurrences of same error type
        const matches = (log.content.match(new RegExp(errorType, 'gi')) || []).length;
        occurrences += matches;
    }

    // Priority tiers: 0-1 = low, 2-3 = medium, 4+ = high
    if (occurrences >= 4) return 'high';
    if (occurrences >= 2) return 'medium';
    return 'low';
}

/**
 * Detect project from finding location
 */
function detectProject(finding) {
    const location = finding.location || '';

    if (/studiokook/i.test(location)) return 'studiokook';
    // Add more projects as needed

    return null;
}

/**
 * Classify finding category
 */
function classifyFinding(finding) {
    if (finding.hasWorkaround && finding.docMethod) {
        return 'doc-fix';
    }
    if (finding.hasWorkaround && !finding.docMethod) {
        return 'new-pattern';
    }
    if (finding.wasWorking || finding.isRegression) {
        return 'regression';
    }
    return 'anomaly';
}

/**
 * Parse transcript for error patterns
 */
function parseTranscript(transcriptPath) {
    const findings = [];

    try {
        const content = fs.readFileSync(transcriptPath, 'utf-8');
        const lines = content.trim().split('\n').filter(Boolean);

        let currentError = null;
        let retryCount = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            try {
                const entry = JSON.parse(line);

                // Detect errors
                if (entry.status === 'error' || entry.error) {
                    const errorText = entry.error || JSON.stringify(entry);
                    currentError = {
                        index: i,
                        errorType: extractErrorType(errorText),
                        original: errorText.substring(0, 200),
                        location: extractLocation(entry),
                        retryCount: 0,
                        hasWorkaround: false
                    };
                    retryCount = 0;
                }

                // Detect retry
                if (currentError && /retry/i.test(line)) {
                    retryCount++;
                    currentError.retryCount = retryCount;
                }

                // Detect success after error (workaround)
                if (currentError && entry.status === 'success') {
                    currentError.hasWorkaround = true;
                    currentError.workaround = extractWorkaround(entry);
                    findings.push(currentError);
                    currentError = null;
                    retryCount = 0;
                }

            } catch (e) {
                // Non-JSON line, skip
            }
        }

        // Add unresolved error
        if (currentError) {
            findings.push(currentError);
        }

    } catch (e) {
        console.error(`Parse error: ${e.message}`);
    }

    return findings.slice(0, LIMITS.MAX_FINDINGS);
}

/**
 * Extract error type from error text
 */
function extractErrorType(text) {
    const httpMatch = text.match(/HTTP [45]\d{2}/);
    if (httpMatch) return httpMatch[0];

    const patterns = [
        /timeout/i,
        /ECONNREFUSED/,
        /ENOTFOUND/,
        /permission denied/i,
        /not found/i,
        /exit.?code["\s:]+([1-9]+)/i
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) return match[0];
    }

    return 'unknown';
}

/**
 * Extract location (file/endpoint) from entry
 */
function extractLocation(entry) {
    if (entry.url) return entry.url;
    if (entry.path) return entry.path;
    if (entry.file) return entry.file;
    return null;
}

/**
 * Extract workaround info
 */
function extractWorkaround(entry) {
    return {
        method: entry.method || 'unknown',
        result: (entry.result || '').substring(0, 100)
    };
}

/**
 * Check if file/path is protected
 */
function isProtected(filePath) {
    for (const protected of PROTECTED_FILES) {
        if (filePath.includes(protected)) {
            return true;
        }
    }
    return false;
}

/**
 * Find relevant SKILL.md for a finding
 */
function findSkillMd(finding) {
    const location = finding.location || '';

    // Map locations to skills
    const skillMappings = [
        { pattern: /studiokook|wordpress|wp|trp/i, skill: 'skills/wordpress/SKILL.md' },
        { pattern: /n8n|workflow/i, skill: 'skills/n8n.md' },
        { pattern: /fal|image|audio/i, skill: 'skills/fal-ai/SKILL.md' }
    ];

    for (const mapping of skillMappings) {
        if (mapping.pattern.test(location) || mapping.pattern.test(finding.errorType)) {
            const skillPath = path.join(CLAUDE_DIR, mapping.skill);
            if (fs.existsSync(skillPath) && !isProtected(skillPath)) {
                return skillPath;
            }
        }
    }

    return null;
}

/**
 * Patch SKILL.md with finding (append only, no deletions)
 */
function patchSkillMd(skillPath, finding) {
    try {
        let content = fs.readFileSync(skillPath, 'utf-8');

        const patch = `
<!-- [AUTO-FIX ${new Date().toISOString().split('T')[0]}] -->
<!-- Error: ${finding.errorType} -->
<!-- Workaround: ${finding.workaround?.method || 'N/A'} -->
`;

        // Append to end of file
        content = content.trimEnd() + '\n' + patch;

        fs.writeFileSync(skillPath, content);
        return true;

    } catch (e) {
        console.error(`Patch error: ${e.message}`);
        return false;
    }
}

/**
 * Write finding to patterns/
 */
function writePattern(finding, confidence) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const isConfirmed = confidence >= THRESHOLD.AUTO_FIX;
    const status = isConfirmed ? 'confirmed' : '[UNCONFIRMED]';
    // Filename prefix determines TTL cleanup eligibility
    const prefix = isConfirmed ? '' : 'UNCONFIRMED-';
    const filename = `${prefix}${timestamp}-${finding.errorType.replace(/[^a-z0-9]/gi, '-')}.md`;
    const filepath = path.join(PATTERNS_DIR, filename);

    const content = `# ${status} Pattern: ${finding.errorType}

Date: ${new Date().toISOString()}
Confidence: ${confidence.toFixed(2)}
Category: ${classifyFinding(finding)}
Priority: ${finding.priority || 'low'}
${finding.isRegression ? 'Regression: YES\n' : ''}
## Problem
${finding.original || 'Unknown'}

## Location
${finding.location || 'Unknown'}

## Resolution
${finding.workaround ? JSON.stringify(finding.workaround, null, 2) : 'No workaround found'}

## Retries
${finding.retryCount}
`;

    try {
        fs.mkdirSync(PATTERNS_DIR, { recursive: true });
        fs.writeFileSync(filepath, content);
        return filename;
    } catch (e) {
        console.error(`Pattern write error: ${e.message}`);
        return null;
    }
}

/**
 * Append finding to project KNOWLEDGE.md
 * Only for project-specific findings with confidence ≥0.7
 */
function appendToProjectKnowledge(finding, confidence) {
    const project = detectProject(finding);
    if (!project || !PROJECT_KNOWLEDGE[project]) return false;

    const knowledgePath = PROJECT_KNOWLEDGE[project];
    if (!fs.existsSync(knowledgePath)) return false;

    const date = new Date().toISOString().split('T')[0];
    const entry = `
### ${date}: ${finding.errorType}
- **Location:** ${finding.location || 'unknown'}
- **Problem:** ${finding.original?.substring(0, 100) || 'Unknown'}
- **Resolution:** ${finding.workaround?.method || 'Pending'}
- **Confidence:** ${confidence.toFixed(2)}
`;

    try {
        let content = fs.readFileSync(knowledgePath, 'utf-8');

        // Find "## Patterns" section and append
        const patternsMarker = '## Patterns (Project-Specific)';
        const markerIndex = content.indexOf(patternsMarker);

        if (markerIndex !== -1) {
            // Insert after the marker and any existing content
            const afterMarker = content.substring(markerIndex + patternsMarker.length);
            const nextSection = afterMarker.indexOf('\n## ');

            if (nextSection !== -1) {
                // Insert before next section
                const insertPoint = markerIndex + patternsMarker.length + nextSection;
                content = content.substring(0, insertPoint) + entry + content.substring(insertPoint);
            } else {
                // Append at end
                content = content.trimEnd() + entry + '\n';
            }
        } else {
            // No patterns section, append at end
            content = content.trimEnd() + '\n\n## Patterns (Project-Specific)\n' + entry;
        }

        fs.writeFileSync(knowledgePath, content);
        return true;
    } catch (e) {
        console.error(`Knowledge append error: ${e.message}`);
        return false;
    }
}

/**
 * Write post-mortem log
 */
function writeLog(sessionId, findings, results) {
    const date = new Date().toISOString().split('T')[0];
    const filename = `${date}-${sessionId}.md`;
    const filepath = path.join(LOGS_DIR, filename);

    const lines = [
        `# Post-Mortem: ${sessionId}`,
        `Date: ${new Date().toISOString()}`,
        '',
        '## Findings',
        ''
    ];

    for (const { finding, confidence, action, status } of results) {
        const statusLabel = status === 'patched' ? '[AUTO-FIXED]' :
                           status === 'pattern' ? '[UNCONFIRMED]' :
                           '[LOGGED]';

        // Add regression/priority tags
        const tags = [];
        if (finding.isRegression) tags.push('REGRESSION');
        if (finding.priority === 'high') tags.push('HIGH-PRIORITY');
        const tagStr = tags.length > 0 ? ` [${tags.join(', ')}]` : '';

        lines.push(`### ${statusLabel}${tagStr} ${classifyFinding(finding)}: ${finding.location || 'unknown'} (confidence: ${confidence.toFixed(2)})`);
        lines.push(`- Problem: ${finding.original?.substring(0, 100) || 'Unknown'}`);
        lines.push(`- Resolution: ${finding.workaround?.method || 'None'}`);
        lines.push(`- Priority: ${finding.priority || 'low'}`);
        lines.push(`- Action: ${action}`);
        lines.push('');
    }

    // Count regressions and high-priority
    const regressions = results.filter(r => r.finding.isRegression).length;
    const highPriority = results.filter(r => r.finding.priority === 'high').length;

    lines.push('## Stats');
    lines.push(`- Errors: ${findings.length}`);
    lines.push(`- Patched: ${results.filter(r => r.status === 'patched').length}`);
    lines.push(`- Patterns: ${results.filter(r => r.status === 'pattern').length}`);
    if (regressions > 0) lines.push(`- Regressions: ${regressions}`);
    if (highPriority > 0) lines.push(`- High Priority: ${highPriority}`);

    // Truncate to limit
    const content = lines.slice(0, LIMITS.MAX_LOG_LINES).join('\n');

    try {
        fs.mkdirSync(LOGS_DIR, { recursive: true });
        fs.writeFileSync(filepath, content);
        return filename;
    } catch (e) {
        console.error(`Log write error: ${e.message}`);
        return null;
    }
}

/**
 * Git commit after auto-patches
 */
function gitCommit(patchedFiles) {
    if (patchedFiles.length === 0) return false;

    try {
        const files = patchedFiles.join(' ');
        execSync(`git add ${files}`, { cwd: CLAUDE_DIR, stdio: 'pipe' });

        const message = `[post-mortem] auto-fix: ${patchedFiles.length} patches`;
        execSync(`git commit -m "${message}"`, { cwd: CLAUDE_DIR, stdio: 'pipe' });

        return true;
    } catch (e) {
        // Git commit may fail if no changes or not a repo
        return false;
    }
}

/**
 * Main analysis
 */
async function analyze() {
    // Check for pending file
    if (!fs.existsSync(PENDING_FILE)) {
        console.log('No pending post-mortem');
        process.exit(0);
    }

    const pending = JSON.parse(fs.readFileSync(PENDING_FILE, 'utf-8'));
    console.log(`Analyzing session: ${pending.sessionId}`);

    // Parse transcript
    const findings = parseTranscript(pending.transcriptPath);
    if (findings.length === 0) {
        console.log('No actionable findings');
        fs.unlinkSync(PENDING_FILE);
        process.exit(0);
    }

    // Load previous logs for cross-session boost
    const previousLogs = loadPreviousLogs();

    // Process findings
    const results = [];
    const patchedFiles = [];
    let patchCount = 0;

    for (const finding of findings) {
        const baseConfidence = calculateBaseConfidence(finding);
        const boost = calculateCrossSessionBoost(finding, previousLogs);
        const confidence = Math.min(baseConfidence + boost, 1.0);

        // Phase 3: Detect regression and calculate priority
        const isRegression = detectRegression(finding, previousLogs);
        const priority = calculatePriorityScore(finding, previousLogs);

        // Boost confidence for regressions (+0.1)
        const adjustedConfidence = isRegression ? Math.min(confidence + 0.1, 1.0) : confidence;

        // Tag finding with metadata
        finding.isRegression = isRegression;
        finding.priority = priority;

        let action = 'ignored';
        let status = 'ignored';

        // Auto-fix (confidence ≥0.8)
        if (adjustedConfidence >= THRESHOLD.AUTO_FIX && patchCount < LIMITS.MAX_PATCHES) {
            const skillPath = findSkillMd(finding);
            if (skillPath && patchSkillMd(skillPath, finding)) {
                action = `patched ${path.basename(skillPath)}`;
                status = 'patched';
                patchedFiles.push(skillPath);
                patchCount++;
            }
        }

        // Write pattern (confidence ≥0.5)
        if (adjustedConfidence >= THRESHOLD.PATTERN) {
            const patternFile = writePattern(finding, adjustedConfidence);
            if (patternFile) {
                action = action === 'ignored' ? `pattern: ${patternFile}` : `${action}, pattern: ${patternFile}`;
                status = status === 'ignored' ? 'pattern' : status;
            }
        }

        // Append to project knowledge (confidence ≥0.7, project-specific)
        if (adjustedConfidence >= THRESHOLD.KNOWLEDGE && detectProject(finding)) {
            if (appendToProjectKnowledge(finding, adjustedConfidence)) {
                action = `${action}, knowledge`;
            }
        }

        // Log only (confidence ≥0.3)
        if (adjustedConfidence >= THRESHOLD.IGNORE) {
            status = status === 'ignored' ? 'logged' : status;
            action = action === 'ignored' ? 'logged' : action;
        }

        results.push({ finding, confidence: adjustedConfidence, action, status });
    }

    // Write log
    const logFile = writeLog(pending.sessionId, findings, results);

    // Git commit
    const committed = gitCommit(patchedFiles);

    // Cleanup
    fs.unlinkSync(PENDING_FILE);

    // Summary
    console.log(`\nPost-Mortem Complete`);
    console.log(`- Findings: ${findings.length}`);
    console.log(`- Patched: ${patchedFiles.length}`);
    console.log(`- Patterns: ${results.filter(r => r.status === 'pattern').length}`);
    console.log(`- Log: ${logFile}`);
    if (committed) console.log(`- Committed: ${patchedFiles.length} files`);
}

// Run
analyze().catch(e => {
    console.error(`Analysis error: ${e.message}`);
    process.exit(1);
});
