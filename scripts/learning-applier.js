#!/usr/bin/env node
/**
 * Learning Applier
 *
 * Processes learning-pending.json files and updates MEMORY.
 * Called by agent during session start when pending findings exist.
 *
 * Usage:
 *   node learning-applier.js                  # process all pending
 *   node learning-applier.js --dry-run        # preview without applying
 *   node learning-applier.js --project /path  # specify project dir
 *
 * Actions by confidence:
 *   >= 0.8  → append to MEMORY + write log
 *   0.5-0.79 → append to MEMORY with [UNCONFIRMED] + write log
 *   0.3-0.49 → write log only
 *   < 0.3   → ignore
 */

const fs = require('fs');
const path = require('path');

const CLAUDE_DIR = path.join(process.env.HOME || process.env.USERPROFILE, '.claude');

// ─── Paths ───────────────────────────────────────────────────────
const GLOBAL_PENDING = path.join(CLAUDE_DIR, 'tmp', 'learning-pending.json');
const GLOBAL_PATTERNS = path.join(CLAUDE_DIR, 'memory', 'global', 'patterns.md');
const GLOBAL_TROUBLESHOOTING = path.join(CLAUDE_DIR, 'memory', 'global', 'troubleshooting.md');
const LOG_DIR = path.join(CLAUDE_DIR, 'logs', 'self-learning');

// ─── CLI args ────────────────────────────────────────────────────
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const projectIdx = args.indexOf('--project');
const projectDir = projectIdx >= 0 ? args[projectIdx + 1] : process.cwd();

// ─── Helpers ─────────────────────────────────────────────────────

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function appendToFile(filePath, content) {
  ensureDir(path.dirname(filePath));
  if (fs.existsSync(filePath)) {
    fs.appendFileSync(filePath, '\n' + content);
  } else {
    fs.writeFileSync(filePath, content);
  }
}

function formatDate() {
  return new Date().toISOString().split('T')[0];
}

function formatFinding(finding) {
  const tag = finding.confidence >= 0.8 ? '' : ' [UNCONFIRMED]';
  const lines = [];

  switch (finding.category) {
    case 'errors':
      lines.push(`### Error Fix${tag}`);
      lines.push(`- **Error**: ${truncate(finding.error, 150)}`);
      if (finding.fix) lines.push(`- **Fix**: ${truncate(finding.fix, 150)}`);
      lines.push(`- **Confidence**: ${finding.confidence}`);
      break;

    case 'doc-mismatch':
      lines.push(`### Doc Mismatch${tag}`);
      lines.push(`- **Context**: ${truncate(finding.context, 150)}`);
      if (finding.alternative) lines.push(`- **Working alternative**: ${truncate(finding.alternative, 150)}`);
      lines.push(`- **Confidence**: ${finding.confidence}`);
      break;

    case 'new-knowledge':
      lines.push(`### New Knowledge${tag}`);
      lines.push(`- **Detail**: ${truncate(finding.context, 200)}`);
      lines.push(`- **Confidence**: ${finding.confidence}`);
      break;

    case 'success':
      lines.push(`### Success Pattern${tag}`);
      lines.push(`- **Streak**: ${finding.streakLength} consecutive successes`);
      lines.push(`- **Context**: ${truncate(finding.context, 150)}`);
      lines.push(`- **Confidence**: ${finding.confidence}`);
      break;
  }

  return lines.join('\n');
}

function truncate(str, maxLen) {
  if (!str) return '(none)';
  const s = String(str).replace(/\n/g, ' ').replace(/\s+/g, ' ');
  return s.length > maxLen ? s.substring(0, maxLen) + '...' : s;
}

// ─── Processing ──────────────────────────────────────────────────

function processPendingFile(pendingPath, scope) {
  if (!fs.existsSync(pendingPath)) return null;

  let pending;
  try {
    pending = JSON.parse(fs.readFileSync(pendingPath, 'utf8'));
  } catch (e) {
    console.error(`Failed to parse ${pendingPath}: ${e.message}`);
    return null;
  }

  if (!pending.findings || pending.findings.length === 0) {
    // Clean up empty pending
    if (!dryRun) fs.unlinkSync(pendingPath);
    return null;
  }

  const result = {
    scope,
    sessionId: pending.sessionId,
    applied: 0,
    logged: 0,
    ignored: 0,
    entries: []
  };

  // Determine target files based on scope
  let patternsFile, troubleshootingFile;

  if (scope === 'global') {
    patternsFile = GLOBAL_PATTERNS;
    troubleshootingFile = GLOBAL_TROUBLESHOOTING;
  } else {
    // Project scope — write to project MEMORY
    const projectMemoryDir = path.join(projectDir, '.claude', 'agent-memory');

    // Find existing memory files or use default
    let memoryFile;
    try {
      const dirs = fs.readdirSync(projectMemoryDir);
      if (dirs.length > 0) {
        memoryFile = path.join(projectMemoryDir, dirs[0], 'MEMORY.md');
      }
    } catch (e) {}

    if (!memoryFile) {
      memoryFile = path.join(projectMemoryDir, 'learnings', 'MEMORY.md');
    }

    patternsFile = memoryFile;
    troubleshootingFile = memoryFile;
  }

  // Process each finding
  for (const finding of pending.findings) {
    const confidence = finding.confidence || 0;

    if (confidence < 0.3) {
      result.ignored++;
      continue;
    }

    const formatted = formatFinding(finding);

    if (confidence >= 0.5) {
      // Apply to MEMORY
      const targetFile = (finding.category === 'errors' || finding.category === 'doc-mismatch')
        ? troubleshootingFile
        : patternsFile;

      if (!dryRun) {
        const header = `\n## Self-Learning (${formatDate()}, session: ${pending.sessionId})\n`;
        appendToFile(targetFile, header + formatted);
      }

      result.applied++;
      result.entries.push({ action: 'applied', target: targetFile, finding: formatted });
    } else {
      result.logged++;
      result.entries.push({ action: 'logged', finding: formatted });
    }
  }

  // Write log
  const logContent = generateLog(pending, result);
  if (!dryRun) {
    ensureDir(LOG_DIR);
    const logFile = path.join(LOG_DIR, `${formatDate()}-${pending.sessionId || 'unknown'}.md`);
    fs.writeFileSync(logFile, logContent);
  }

  // Delete pending file
  if (!dryRun) {
    try {
      fs.unlinkSync(pendingPath);
    } catch (e) {
      console.error(`Failed to delete ${pendingPath}: ${e.message}`);
    }
  }

  return result;
}

function generateLog(pending, result) {
  const lines = [
    `# Self-Learning Log`,
    ``,
    `- **Date**: ${formatDate()}`,
    `- **Session**: ${pending.sessionId || 'unknown'}`,
    `- **Scope**: ${result.scope}`,
    `- **Project**: ${pending.project || 'unknown'}`,
    `- **Findings**: ${pending.findings.length} total`,
    `- **Applied**: ${result.applied} (to MEMORY)`,
    `- **Logged**: ${result.logged} (below threshold)`,
    `- **Ignored**: ${result.ignored} (confidence < 0.3)`,
    ``
  ];

  if (pending.stats) {
    lines.push(`## Stats`);
    lines.push(`- Errors: ${pending.stats.errors || 0}`);
    lines.push(`- Doc mismatches: ${pending.stats.docMismatches || 0}`);
    lines.push(`- New knowledge: ${pending.stats.newKnowledge || 0}`);
    lines.push(`- Success patterns: ${pending.stats.successes || 0}`);
    lines.push(``);
  }

  lines.push(`## Findings`);
  lines.push(``);

  for (const entry of result.entries) {
    lines.push(`### [${entry.action.toUpperCase()}]${entry.target ? ` → ${entry.target}` : ''}`);
    lines.push(entry.finding);
    lines.push(``);
  }

  return lines.join('\n');
}

// ─── Main ────────────────────────────────────────────────────────

function main() {
  console.log(dryRun ? '[DRY RUN] Preview mode — no files will be modified' : '[APPLY] Processing pending learnings...');

  const results = [];

  // Process global pending
  const globalResult = processPendingFile(GLOBAL_PENDING, 'global');
  if (globalResult) results.push(globalResult);

  // Process project pending
  const projectPending = path.join(projectDir, '.claude', 'tmp', 'learning-pending.json');
  const projectResult = processPendingFile(projectPending, 'project');
  if (projectResult) results.push(projectResult);

  if (results.length === 0) {
    console.log('No pending learnings found.');
    process.exit(0);
  }

  // Summary
  const totalApplied = results.reduce((sum, r) => sum + r.applied, 0);
  const totalLogged = results.reduce((sum, r) => sum + r.logged, 0);
  const totalIgnored = results.reduce((sum, r) => sum + r.ignored, 0);

  console.log(`\nSummary:`);
  console.log(`  Applied to MEMORY: ${totalApplied}`);
  console.log(`  Logged only: ${totalLogged}`);
  console.log(`  Ignored: ${totalIgnored}`);

  for (const r of results) {
    console.log(`\n  [${r.scope}] Session ${r.sessionId}:`);
    for (const entry of r.entries) {
      console.log(`    ${entry.action}: ${entry.finding.split('\n')[0]}`);
    }
  }

  if (dryRun) {
    console.log('\n[DRY RUN] No changes made. Remove --dry-run to apply.');
  } else {
    console.log('\nDone. Learnings applied to MEMORY files.');
  }

  process.exit(0);
}

main();
