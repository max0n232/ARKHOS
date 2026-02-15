#!/usr/bin/env node
/**
 * Skill Router
 *
 * Routes user prompts to appropriate skills based on trigger patterns.
 * Reads _triggers.json and matches against user input.
 */

const fs = require('fs');
const path = require('path');

// Paths
const PROJECT_DIR = path.join(__dirname, '..');
const TRIGGERS_PATH = path.join(PROJECT_DIR, 'skills', '_triggers.json');
const CAPSULE_PATH = path.join(
    process.env.HOME || process.env.USERPROFILE,
    '.claude', 'memory', 'session', 'capsule.json'
);

/**
 * Load triggers configuration
 */
function loadTriggers() {
    try {
        if (fs.existsSync(TRIGGERS_PATH)) {
            return JSON.parse(fs.readFileSync(TRIGGERS_PATH, 'utf-8'));
        }
    } catch (e) {
        // Continue with defaults
    }

    // Default triggers if file doesn't exist
    return {
        skills: {
            'seo-audit': {
                triggers: ['SEO audit', 'SEO аудит', 'ranking', 'позиции', 'индексация'],
                priority: 1,
                path: 'skills/seo-aeo/SKILL.md'
            },
            'wordpress-router': {
                triggers: ['WordPress', 'WP', 'plugin', 'theme', 'плагин', 'тема'],
                priority: 2,
                routes_to: ['wp-rest-api', 'wp-performance', 'wp-abilities-api']
            },
            'marketing': {
                triggers: ['marketing', 'маркетинг', 'CRO', 'conversion', 'конверсия'],
                priority: 2,
                path: 'skills/marketing/CLAUDE.md'
            },
            'n8n': {
                triggers: ['n8n', 'workflow', 'automation', 'автоматизация'],
                priority: 2,
                path: null // Uses global n8n skill
            }
        }
    };
}

/**
 * Match prompt against triggers
 */
function matchSkill(prompt, triggers) {
    const lowerPrompt = prompt.toLowerCase();
    const matches = [];

    for (const [skillName, config] of Object.entries(triggers.skills || {})) {
        for (const trigger of config.triggers || []) {
            if (lowerPrompt.includes(trigger.toLowerCase())) {
                matches.push({
                    skill: skillName,
                    trigger: trigger,
                    priority: config.priority || 99,
                    path: config.path,
                    routes_to: config.routes_to
                });
                break; // One match per skill is enough
            }
        }
    }

    // Sort by priority (lower = higher priority)
    matches.sort((a, b) => a.priority - b.priority);

    return matches;
}

/**
 * Update capsule with loaded skills
 */
function updateCapsule(skills) {
    try {
        if (fs.existsSync(CAPSULE_PATH)) {
            const capsule = JSON.parse(fs.readFileSync(CAPSULE_PATH, 'utf-8'));
            capsule.context = capsule.context || {};
            capsule.context.loaded_skills = [
                ...new Set([
                    ...(capsule.context.loaded_skills || []),
                    ...skills
                ])
            ].slice(-10); // Keep last 10
            capsule.last_updated = new Date().toISOString();
            fs.writeFileSync(CAPSULE_PATH, JSON.stringify(capsule, null, 2));
        }
    } catch (e) {
        // Continue without update
    }
}

/**
 * Main routing logic
 */
async function routeSkill() {
    // Read prompt from stdin
    let input = '';
    for await (const chunk of process.stdin) {
        input += chunk;
    }

    let prompt = '';
    try {
        const data = JSON.parse(input);
        prompt = data.prompt || data.user_prompt || data.message || '';
    } catch (e) {
        prompt = input.trim();
    }

    if (!prompt) {
        process.exit(0);
    }

    // Load triggers and match
    const triggers = loadTriggers();
    const matches = matchSkill(prompt, triggers);

    if (matches.length === 0) {
        // No skill match - passthrough
        process.exit(0);
    }

    // Output matched skills
    const result = {
        matched_skills: matches.map(m => m.skill),
        primary_skill: matches[0]?.skill,
        skill_path: matches[0]?.path,
        routes_to: matches[0]?.routes_to,
        trigger_used: matches[0]?.trigger
    };

    // Update capsule with loaded skills
    updateCapsule(matches.map(m => m.skill));

    console.log(JSON.stringify(result));
    process.exit(0);
}

routeSkill().catch(err => {
    console.error(`Skill router error: ${err.message}`);
    process.exit(0);
});
