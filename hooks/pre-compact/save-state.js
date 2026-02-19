#!/usr/bin/env node
/**
 * PreCompact hook - saves session state before context compaction
 */

const fs = require('fs');
const path = require('path');

const CAPSULE_DIR = path.join(__dirname, 'session');
const CAPSULE_FILE = path.join(CAPSULE_DIR, 'capsule.json');

function saveState() {
    try {
        // Ensure directory exists
        if (!fs.existsSync(CAPSULE_DIR)) {
            fs.mkdirSync(CAPSULE_DIR, { recursive: true });
        }

        // Read existing capsule or create new
        let capsule = {};
        if (fs.existsSync(CAPSULE_FILE)) {
            capsule = JSON.parse(fs.readFileSync(CAPSULE_FILE, 'utf8'));
        }

        // Update with current state
        capsule.last_compact = new Date().toISOString();
        capsule.compact_count = (capsule.compact_count || 0) + 1;

        // Save
        fs.writeFileSync(CAPSULE_FILE, JSON.stringify(capsule, null, 2));

        console.log('State saved before compact');
    } catch (error) {
        console.error('Failed to save state:', error.message);
    }
}

saveState();
