#!/usr/bin/env node
/**
 * TaskCreated Hook: log task creation to session capsule
 *
 * When tasks are created (TodoWrite), appends to session capsule
 * so Ghost captures task planning in session history.
 */

const fs = require('fs');
const path = require('path');

function readStdinSync() {
    const chunks = [];
    const buf = Buffer.alloc(1024);
    try {
        let bytesRead;
        while ((bytesRead = fs.readSync(0, buf, 0, 1024)) > 0) {
            chunks.push(buf.slice(0, bytesRead).toString());
        }
    } catch (e) {}
    return chunks.join('');
}

try {
    const raw = readStdinSync();
    const input = raw ? JSON.parse(raw) : {};

    const capsulePath = path.join(__dirname, '..', '..', 'memory', 'session', 'capsule.json');
    if (!fs.existsSync(capsulePath)) return;

    const capsule = JSON.parse(fs.readFileSync(capsulePath, 'utf8'));
    if (!capsule.tasks) capsule.tasks = [];

    capsule.tasks.push({
        ts: new Date().toISOString(),
        task_count: input.task_count || 0,
        tasks_summary: input.tasks_summary || ''
    });

    fs.writeFileSync(capsulePath, JSON.stringify(capsule, null, 2));
} catch (e) {
    // silent
}
