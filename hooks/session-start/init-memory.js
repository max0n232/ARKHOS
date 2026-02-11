#!/usr/bin/env node
/**
 * SessionStart Hook: Session Initializer
 *
 * Initializes session state, loads previous context, checks token budget.
 * Runs at the start of every Claude Code session.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Configuration
const CLAUDE_DIR = path.join(process.env.HOME || process.env.USERPROFILE, '.claude');
const CAPSULE_PATH = path.join(CLAUDE_DIR, 'memory', 'session', 'capsule.json');
const GLOBAL_MEMORY = path.join(CLAUDE_DIR, 'memory', 'global');

// Token budget configuration
const TOKEN_BUDGET = 200000;
const WARNING_THRESHOLD = 0.05; // 5%

/**
 * Estimate token count from text (rough approximation: ~4 chars per token)
 */
function estimateTokens(text) {
    if (!text) return 0;
    return Math.ceil(text.length / 4);
}

// Track total tokens loaded during init
let totalTokensLoaded = 0;

/**
 * Generate session ID
 */
function generateSessionId() {
    return crypto.randomBytes(4).toString('hex');
}

/**
 * Detect current project from working directory
 */
function detectProject(cwd) {
    const projectsPath = path.join(CLAUDE_DIR, 'projects.json');

    try {
        if (fs.existsSync(projectsPath)) {
            const projects = JSON.parse(fs.readFileSync(projectsPath, 'utf-8'));

            for (const [name, config] of Object.entries(projects)) {
                const projectPath = config.path || config;
                if (cwd.toLowerCase().includes(projectPath.toLowerCase().replace(/\//g, path.sep))) {
                    return name;
                }
            }
        }
    } catch (e) {
        // Continue without project detection
    }

    // Fallback: extract from path
    const parts = cwd.split(path.sep);
    return parts[parts.length - 1] || 'unknown';
}

/**
 * Load previous session state
 */
function loadPreviousCapsule() {
    try {
        if (fs.existsSync(CAPSULE_PATH)) {
            const content = fs.readFileSync(CAPSULE_PATH, 'utf-8');
            totalTokensLoaded += estimateTokens(content);
            return JSON.parse(content);
        }
    } catch (e) {
        // Return empty capsule
    }

    return null;
}

/**
 * Load global memory files and track tokens
 */
function loadGlobalMemory() {
    const loaded = [];

    try {
        if (fs.existsSync(GLOBAL_MEMORY)) {
            const files = fs.readdirSync(GLOBAL_MEMORY);

            for (const file of files) {
                if (file.endsWith('.json') || file.endsWith('.md')) {
                    const filePath = path.join(GLOBAL_MEMORY, file);
                    try {
                        const content = fs.readFileSync(filePath, 'utf-8');
                        const tokens = estimateTokens(content);
                        totalTokensLoaded += tokens;
                        loaded.push({ file, tokens });
                    } catch (e) {
                        // Skip unreadable files
                    }
                }
            }
        }
    } catch (e) {
        // Continue without global memory
    }

    return loaded;
}

/**
 * Calculate time since last session
 */
function timeSinceLastSession(previous) {
    if (!previous?.last_updated) return null;

    const lastUpdate = new Date(previous.last_updated);
    const now = new Date();
    const diffMs = now - lastUpdate;

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} days ago`;
    if (hours > 0) return `${hours} hours ago`;
    return 'recently';
}

/**
 * Main initialization
 */
async function initSession() {
    const cwd = process.cwd();
    const previous = loadPreviousCapsule();
    const timeSince = timeSinceLastSession(previous);

    // Load global memory and track tokens
    const globalMemoryFiles = loadGlobalMemory();

    // Create new session state
    const capsule = {
        session_id: generateSessionId(),
        started_at: new Date().toISOString(),
        project: detectProject(cwd),
        context: {
            current_task: null,
            loaded_skills: [],
            active_credentials: [],
            files_accessed: previous?.context?.files_accessed?.slice(-10) || []
        },
        decisions_this_session: [],
        token_budget: {
            total: 200000,
            used: 0,
            thresholds: {
                notify: 60000,
                stop: 100000,
                emergency: 140000
            }
        },
        last_updated: new Date().toISOString(),
        previous_session: previous ? {
            id: previous.session_id,
            project: previous.project,
            last_task: previous.context?.current_task,
            ended: previous.last_updated
        } : null
    };

    // Save capsule
    try {
        fs.mkdirSync(path.dirname(CAPSULE_PATH), { recursive: true });
        fs.writeFileSync(CAPSULE_PATH, JSON.stringify(capsule, null, 2));
    } catch (e) {
        console.error(`Failed to save capsule: ${e.message}`);
    }

    // Output session info (shown to user via statusMessage)
    const output = {
        session_id: capsule.session_id,
        project: capsule.project,
        previous_session: timeSince ? `Last session: ${timeSince}` : 'First session',
        tokenEstimate: totalTokensLoaded,
        tokenBudgetPercent: ((totalTokensLoaded / TOKEN_BUDGET) * 100).toFixed(2)
    };

    // Check for project-specific context loader
    const projectContextLoader = path.join(cwd, '.claude', 'context-loader.js');
    if (fs.existsSync(projectContextLoader)) {
        output.project_context = 'Loading project context...';
        // Project loader will be called separately
    }

    // Token budget warning
    if (totalTokensLoaded > TOKEN_BUDGET * WARNING_THRESHOLD) {
        console.error(`Warning: Session init loaded ~${totalTokensLoaded} tokens (${(totalTokensLoaded / TOKEN_BUDGET * 100).toFixed(1)}% of budget)`);
        output.tokenWarning = true;
    }

    console.log(JSON.stringify(output));
    process.exit(0);
}

initSession().catch(err => {
    console.error(`Session init error: ${err.message}`);
    process.exit(0); // Don't block on init errors
});
