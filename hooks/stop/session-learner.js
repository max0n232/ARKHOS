#!/usr/bin/env node
/**
 * Stop Hook: Session Learner
 *
 * Unified self-learning hook. Reads transcript, extracts patterns
 * in 4 categories, writes findings to tmp/learning-pending.json.
 *
 * Categories:
 *   1. errors       — failed commands + what fixed them
 *   2. doc-mismatch — documented method failed, alt method worked
 *   3. new-knowledge — new APIs, paths, gotchas discovered
 *   4. success       — effective approaches worth remembering
 *
 * Dual scope:
 *   - Global findings → ~/.claude/tmp/learning-pending.json
 *   - Project findings → {project}/.claude/tmp/learning-pending.json
 *
 * Constraints:
 *   - No LLM calls (budget safety)
 *   - stdout: 0 bytes (no context pollution)
 *   - stderr: ≤200 bytes (signal only)
 *   - timeout: 10s
 *   - Max 5 findings per category
 *   - Graceful fail on all errors (exit 0)
 */

const fs = require('fs');
const path = require('path');

const CLAUDE_DIR = path.join(process.env.HOME || process.env.USERPROFILE, '.claude');
const TMP_DIR = path.join(CLAUDE_DIR, 'tmp');
const CAPSULE_PATH = path.join(CLAUDE_DIR, 'memory', 'session', 'capsule.json');

const MIN_MESSAGES = 5;
const MAX_FINDINGS_PER_CATEGORY = 5;
const MAX_TOTAL_FINDINGS = 15;

// ─── Error patterns ──────────────────────────────────────────────
const ERROR_INDICATORS = [
  /exit.?code["\s:]+[1-9]/i,
  /"error"/i,
  /"status":\s*(4\d{2}|5\d{2})/,
  /failed/i,
  /timed?\s*out/i,
  /exception/i,
  /ENOENT|EACCES|EPERM/i,
  /command not found/i,
  /syntax\s*error/i
];

// ─── Success after error indicators ──────────────────────────────
const SUCCESS_INDICATORS = [
  /exit.?code["\s:]+0/i,
  /"status":\s*200/,
  /success/i,
  /completed/i,
  /created/i,
  /updated/i
];

// ─── Doc-mismatch patterns ───────────────────────────────────────
const DOC_MISMATCH_SIGNALS = [
  /instead\s+(use|try|of)/i,
  /doesn'?t\s+work/i,
  /actually\s+(need|require|use)/i,
  /workaround/i,
  /the\s+correct\s+(way|method|approach)/i,
  /turns?\s+out/i,
  /documentation.*wrong/i,
  /not\s+POST.*GET|not\s+GET.*POST/i
];

// ─── New knowledge patterns ──────────────────────────────────────
const KNOWLEDGE_SIGNALS = [
  /discovered\s+that/i,
  /learned\s+that/i,
  /gotcha/i,
  /important.*note/i,
  /remember\s+to/i,
  /must\s+use/i,
  /never\s+use/i,
  /always\s+use/i,
  /API.*endpoint/i,
  /SSH.*access/i,
  /credential/i
];

// ─── Project-specific patterns (heuristic) ───────────────────────
const PROJECT_SPECIFIC_SIGNALS = [
  /wp_|wordpress|elementor|translatepress|trp_/i,
  /studiokook/i,
  /htdocs|domeenid/i,
  /ssh.*virt\d+/i,
  /code.?snippet/i,
  /mu-plugin/i
];

// ─── Helpers ─────────────────────────────────────────────────────

function loadCapsule() {
  try {
    if (fs.existsSync(CAPSULE_PATH)) {
      return JSON.parse(fs.readFileSync(CAPSULE_PATH, 'utf8'));
    }
  } catch (e) {}
  return null;
}

function truncate(str, maxLen = 200) {
  if (!str) return '';
  const s = String(str);
  return s.length > maxLen ? s.substring(0, maxLen) + '...' : s;
}

function matchesAny(text, patterns) {
  return patterns.some(p => p.test(text));
}

function calculateConfidence(finding) {
  let base = 0.3;

  // Error with verified fix = high confidence
  if (finding.category === 'errors' && finding.fix) base = 0.8;
  // Doc mismatch with working alternative = high
  else if (finding.category === 'doc-mismatch' && finding.alternative) base = 0.7;
  // New knowledge with specific details = medium-high
  else if (finding.category === 'new-knowledge') base = 0.6;
  // Success pattern = medium
  else if (finding.category === 'success') base = 0.5;

  return Math.min(base, 0.9);
}

function isProjectSpecific(text) {
  return matchesAny(text, PROJECT_SPECIFIC_SIGNALS);
}

// ─── Transcript Parsing ──────────────────────────────────────────

function parseTranscript(transcriptPath) {
  const content = fs.readFileSync(transcriptPath, 'utf8');
  const lines = content.trim().split('\n').filter(Boolean);

  if (lines.length < MIN_MESSAGES) return null;

  const messages = [];
  for (const line of lines) {
    try {
      messages.push(JSON.parse(line));
    } catch (e) {
      // Skip non-JSON lines
    }
  }

  return messages;
}

// ─── Pattern Extractors ──────────────────────────────────────────

function extractErrors(messages) {
  const findings = [];
  const errorWindows = []; // Track error→fix sequences

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const text = JSON.stringify(msg);

    if (matchesAny(text, ERROR_INDICATORS)) {
      // Look ahead for fix (next 3 messages)
      let fix = null;
      for (let j = i + 1; j < Math.min(i + 4, messages.length); j++) {
        const nextText = JSON.stringify(messages[j]);
        if (matchesAny(nextText, SUCCESS_INDICATORS) && !matchesAny(nextText, ERROR_INDICATORS)) {
          fix = truncate(nextText, 300);
          break;
        }
      }

      findings.push({
        category: 'errors',
        error: truncate(text, 300),
        fix: fix,
        messageIndex: i
      });

      if (findings.length >= MAX_FINDINGS_PER_CATEGORY) break;
    }
  }

  return findings;
}

function extractDocMismatches(messages) {
  const findings = [];

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const text = JSON.stringify(msg);

    if (matchesAny(text, DOC_MISMATCH_SIGNALS)) {
      // Look for the alternative that worked
      let alternative = null;
      for (let j = i; j < Math.min(i + 3, messages.length); j++) {
        const nextText = JSON.stringify(messages[j]);
        if (matchesAny(nextText, SUCCESS_INDICATORS)) {
          alternative = truncate(nextText, 300);
          break;
        }
      }

      findings.push({
        category: 'doc-mismatch',
        context: truncate(text, 300),
        alternative: alternative,
        messageIndex: i
      });

      if (findings.length >= MAX_FINDINGS_PER_CATEGORY) break;
    }
  }

  return findings;
}

function extractNewKnowledge(messages) {
  const findings = [];

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const text = JSON.stringify(msg);

    if (matchesAny(text, KNOWLEDGE_SIGNALS)) {
      findings.push({
        category: 'new-knowledge',
        context: truncate(text, 400),
        messageIndex: i
      });

      if (findings.length >= MAX_FINDINGS_PER_CATEGORY) break;
    }
  }

  return findings;
}

function extractSuccessPatterns(messages) {
  const findings = [];
  let consecutiveSuccesses = 0;
  let streakStart = -1;

  for (let i = 0; i < messages.length; i++) {
    const text = JSON.stringify(messages[i]);

    if (matchesAny(text, SUCCESS_INDICATORS) && !matchesAny(text, ERROR_INDICATORS)) {
      if (consecutiveSuccesses === 0) streakStart = i;
      consecutiveSuccesses++;
    } else if (matchesAny(text, ERROR_INDICATORS)) {
      // Reset streak on error, but record if streak was long enough
      if (consecutiveSuccesses >= 5) {
        findings.push({
          category: 'success',
          streakLength: consecutiveSuccesses,
          context: truncate(JSON.stringify(messages[streakStart]), 200),
          messageIndex: streakStart
        });
      }
      consecutiveSuccesses = 0;
    }

    if (findings.length >= MAX_FINDINGS_PER_CATEGORY) break;
  }

  // Final streak
  if (consecutiveSuccesses >= 5 && findings.length < MAX_FINDINGS_PER_CATEGORY) {
    findings.push({
      category: 'success',
      streakLength: consecutiveSuccesses,
      context: truncate(JSON.stringify(messages[streakStart]), 200),
      messageIndex: streakStart
    });
  }

  return findings;
}

// ─── Main ────────────────────────────────────────────────────────

function main() {
  const transcriptPath = process.env.CLAUDE_TRANSCRIPT_PATH;

  if (!transcriptPath || !fs.existsSync(transcriptPath)) {
    process.exit(0);
  }

  try {
    const messages = parseTranscript(transcriptPath);
    if (!messages) {
      process.exit(0);
    }

    // Extract findings
    const allFindings = [
      ...extractErrors(messages),
      ...extractDocMismatches(messages),
      ...extractNewKnowledge(messages),
      ...extractSuccessPatterns(messages)
    ];

    if (allFindings.length === 0) {
      process.exit(0);
    }

    // Add confidence scores
    for (const f of allFindings) {
      f.confidence = calculateConfidence(f);
    }

    // Sort by confidence (highest first), limit total
    allFindings.sort((a, b) => b.confidence - a.confidence);
    const topFindings = allFindings.slice(0, MAX_TOTAL_FINDINGS);

    // Split into global vs project scope
    const capsule = loadCapsule();
    const projectName = capsule?.project || 'unknown';

    const globalFindings = [];
    const projectFindings = [];

    for (const f of topFindings) {
      const text = f.context || f.error || '';
      if (isProjectSpecific(text)) {
        projectFindings.push(f);
      } else {
        globalFindings.push(f);
      }
    }

    // Build pending data
    const pending = {
      timestamp: new Date().toISOString(),
      sessionId: capsule?.session_id || `session-${Date.now()}`,
      transcriptPath,
      messageCount: messages.length,
      project: projectName,
      stats: {
        total: topFindings.length,
        errors: topFindings.filter(f => f.category === 'errors').length,
        docMismatches: topFindings.filter(f => f.category === 'doc-mismatch').length,
        newKnowledge: topFindings.filter(f => f.category === 'new-knowledge').length,
        successes: topFindings.filter(f => f.category === 'success').length
      }
    };

    // Write global findings
    if (globalFindings.length > 0) {
      if (!fs.existsSync(TMP_DIR)) {
        fs.mkdirSync(TMP_DIR, { recursive: true });
      }
      const globalPending = { ...pending, scope: 'global', findings: globalFindings };
      fs.writeFileSync(
        path.join(TMP_DIR, 'learning-pending.json'),
        JSON.stringify(globalPending, null, 2)
      );
    }

    // Write project findings
    if (projectFindings.length > 0) {
      const cwd = process.cwd();
      const projectTmp = path.join(cwd, '.claude', 'tmp');
      if (!fs.existsSync(projectTmp)) {
        fs.mkdirSync(projectTmp, { recursive: true });
      }
      const projPending = { ...pending, scope: 'project', findings: projectFindings };
      fs.writeFileSync(
        path.join(projectTmp, 'learning-pending.json'),
        JSON.stringify(projPending, null, 2)
      );
    }

    // Signal to stderr
    const totalCount = globalFindings.length + projectFindings.length;
    const scope = globalFindings.length > 0 && projectFindings.length > 0
      ? 'global+project'
      : globalFindings.length > 0 ? 'global' : 'project';
    process.stderr.write(`[SelfLearn] ${totalCount} findings (${scope}) → pending.json\n`);

  } catch (err) {
    process.stderr.write(`[SelfLearn] Error: ${err.message.substring(0, 80)}\n`);
  }

  process.exit(0);
}

main();
