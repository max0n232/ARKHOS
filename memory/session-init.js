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
            return JSON.parse(fs.readFileSync(CAPSULE_PATH, 'utf-8'));
        }
    } catch (e) {
        // Return empty capsule
    }

    return null;
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
        previous_session: timeSince ? `Last session: ${timeSince}` : 'First session'
    };

    // Check for project-specific context loader
    const projectContextLoader = path.join(cwd, '.claude', 'context-loader.js');
    if (fs.existsSync(projectContextLoader)) {
        output.project_context = 'Loading project context...';
        // Project loader will be called separately
    }

    console.log(JSON.stringify(output));
    process.exit(0);
}

initSession().catch(err => {
    console.error(`Session init error: ${err.message}`);
    process.exit(0); // Don't block on init errors
});
