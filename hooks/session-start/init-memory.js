#!/usr/bin/env node
/**
 * SessionStart Hook: Session Capsule Generator
 *
 * Creates session capsule with unique ID for trace-collector and pattern-detector.
 * Capsule stored at ~/.claude/memory/session/capsule.json
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const CLAUDE_DIR = path.join(process.env.HOME || process.env.USERPROFILE, '.claude');
const CAPSULE_PATH = path.join(CLAUDE_DIR, 'memory', 'session', 'capsule.json');

function detectProject(cwd) {
    return path.basename(cwd) || 'unknown';
}

function loadPreviousCapsule() {
    try {
        if (fs.existsSync(CAPSULE_PATH)) {
            return JSON.parse(fs.readFileSync(CAPSULE_PATH, 'utf-8'));
        }
    } catch (e) {}
    return null;
}

function main() {
    const cwd = process.cwd();
    const previous = loadPreviousCapsule();

    const capsule = {
        session_id: crypto.randomBytes(4).toString('hex'),
        started_at: new Date().toISOString(),
        project: detectProject(cwd),
        context: {
            current_task: null,
            files_accessed: previous?.context?.files_accessed?.slice(-10) || []
        },
        last_updated: new Date().toISOString(),
        previous_session: previous ? {
            id: previous.session_id,
            project: previous.project,
            ended: previous.last_updated
        } : null
    };

    try {
        fs.mkdirSync(path.dirname(CAPSULE_PATH), { recursive: true });
        fs.writeFileSync(CAPSULE_PATH, JSON.stringify(capsule, null, 2));
    } catch (e) {
        console.error(`Failed to save capsule: ${e.message}`);
    }

    const timeSince = previous?.last_updated
        ? (() => {
            const h = Math.floor((Date.now() - new Date(previous.last_updated)) / 3600000);
            return h >= 24 ? `${Math.floor(h / 24)}d ago` : h > 0 ? `${h}h ago` : 'recently';
        })()
        : 'first session';

    // QMD health check — warn if USERPROFILE fix is missing
    const qmdStore = path.join(process.env.HOME || process.env.USERPROFILE || '', 'AppData', 'Roaming', 'npm', 'node_modules', '@tobilu', 'qmd', 'dist', 'store.js');
    let qmdWarning = '';
    try {
        const src = fs.readFileSync(qmdStore, 'utf8');
        if (src.includes("process.env.HOME || \"/tmp\"") && !src.includes("USERPROFILE")) {
            qmdWarning = ' | ⚠️ QMD missing USERPROFILE fix — run: sed -i \'s/process.env.HOME || "\\/tmp"/process.env.HOME || process.env.USERPROFILE || "\\/tmp"/\' "' + qmdStore.replace(/\\/g, '/') + '"';
        }
    } catch {}

    console.log(JSON.stringify({
        session_id: capsule.session_id,
        project: capsule.project,
        previous: timeSince
    }) + qmdWarning);
}

main();
