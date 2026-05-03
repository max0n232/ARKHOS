#!/usr/bin/env node
/**
 * Auto-Librarian: scheduled spawn of `claude -p` that invokes the librarian
 * agent. Closes the proactivity gap where .inbox-extraction-needed or
 * .distill-needed flags would otherwise wait for a human-triggered session.
 *
 * Triggered: Windows Task Scheduler via auto-librarian-hidden.vbs (cadence: every 6h)
 *
 * Handlers (checked in priority order, at most one spawn per tick):
 *   1. inbox  — flag .inbox-extraction-needed → librarian triage mode
 *   2. distill — flag .distill-needed → librarian distill mode
 *
 * Guards (applied per-flag):
 *   - Flag must exist AND be >= MIN_AGE_HOURS old (avoid racing active sessions)
 *   - Last auto-run must be >= MIN_INTERVAL_HOURS ago (prevents quota burn)
 *   - On failure, flag is NOT removed — next cycle will retry
 *   - On success, the spawned librarian is expected to remove the flag itself
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const CLAUDE_DIR = path.join(os.homedir(), '.claude');
const LAST_RUN = path.join(CLAUDE_DIR, 'hooks', '.auto-librarian-last-run.json');
const LOG = path.join(CLAUDE_DIR, 'logs', 'auto-librarian.log');

const MIN_AGE_HOURS = 6;
const MIN_INTERVAL_HOURS = 12;
const CLAUDE_TIMEOUT_MS = 10 * 60 * 1000;

const HANDLERS = [
    {
        name: 'inbox',
        flag: path.join(CLAUDE_DIR, 'hooks', '.inbox-extraction-needed'),
        buildPrompt: (flagPath) =>
            `Invoke the librarian agent via the Agent tool with subagent_type='librarian' and prompt='triage — extract insights from all triaged cards in 00-Inbox/ and route to permanent destinations per 90-System/routing-map.md'. After the agent returns, delete the file ${flagPath.replace(/\\/g, '/')}. Do not ask for permission. No conversation. Execute and exit.`
    },
    {
        name: 'distill',
        flag: path.join(CLAUDE_DIR, 'hooks', '.distill-needed'),
        buildPrompt: (flagPath) =>
            `Invoke the librarian agent via the Agent tool with subagent_type='librarian' and prompt='distill — route entries from troubleshooting-current and global-patterns to permanent destinations per 90-System/routing-map.md. Log any outdated deletions to logs/librarian-deletions.log.'. After the agent returns, delete the file ${flagPath.replace(/\\/g, '/')}. Do not ask for permission. No conversation. Execute and exit.`
    }
];

function log(msg) {
    const line = `[${new Date().toISOString()}] ${msg}\n`;
    process.stderr.write(line);
    try {
        fs.mkdirSync(path.dirname(LOG), { recursive: true });
        fs.appendFileSync(LOG, line);
    } catch {}
}

function exit(code, reason) {
    log(`exit=${code} reason=${reason}`);
    process.exit(code);
}

function readLastRun() {
    try { return JSON.parse(fs.readFileSync(LAST_RUN, 'utf8')).ts || 0; } catch { return 0; }
}

function pickHandler() {
    for (const h of HANDLERS) {
        if (!fs.existsSync(h.flag)) continue;
        let flagData;
        try { flagData = JSON.parse(fs.readFileSync(h.flag, 'utf8')); }
        catch (e) { log(`[${h.name}] flag unreadable: ${e.message}`); continue; }
        const ageHours = (Date.now() - new Date(flagData.timestamp).getTime()) / 3600000;
        if (ageHours < MIN_AGE_HOURS) {
            log(`[${h.name}] flag too young (${ageHours.toFixed(1)}h < ${MIN_AGE_HOURS}h)`);
            continue;
        }
        return { handler: h, flagData, ageHours };
    }
    return null;
}

const pick = pickHandler();
if (!pick) exit(0, 'no actionable flags');

const hoursSinceLastRun = (Date.now() - readLastRun()) / 3600000;
if (hoursSinceLastRun < MIN_INTERVAL_HOURS) {
    exit(0, `last run ${hoursSinceLastRun.toFixed(1)}h ago, quota cooldown`);
}

const { handler, flagData, ageHours } = pick;
log(`triggering librarian [${handler.name}] (flag age=${ageHours.toFixed(1)}h, meta=${JSON.stringify(flagData).slice(0, 120)})`);

const r = spawnSync('claude', ['--print', '--dangerously-skip-permissions', handler.buildPrompt(handler.flag)], {
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: CLAUDE_TIMEOUT_MS,
    windowsHide: true,
    encoding: 'utf8'
});

try {
    fs.writeFileSync(LAST_RUN, JSON.stringify({
        ts: Date.now(),
        mode: handler.name,
        exit: r.status,
        signal: r.signal || null
    }));
} catch {}

if (r.stdout) log(`[${handler.name}] stdout (tail 800): ${String(r.stdout).slice(-800)}`);
if (r.stderr) log(`[${handler.name}] stderr (tail 400): ${String(r.stderr).slice(-400)}`);

if (r.status === 0) exit(0, `[${handler.name}] claude -p returned 0`);
exit(r.status || 1, `[${handler.name}] claude -p failed (signal=${r.signal || 'none'})`);
