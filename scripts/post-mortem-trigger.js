#!/usr/bin/env node
/**
 * Post-Mortem Trigger (Stop hook)
 *
 * Reads $CLAUDE_TRANSCRIPT_PATH, counts errors/retries.
 * If findings exist → writes tmp/post-mortem-pending.json
 * If no findings → exit 0 (skip post-mortem skill)
 *
 * Limits:
 * - stdout: 0 bytes (no context pollution)
 * - stderr: ≤150 bytes (signal only)
 * - timeout: 10s
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const CLAUDE_DIR = path.join(os.homedir(), '.claude');
const TMP_DIR = path.join(CLAUDE_DIR, 'tmp');
const PENDING_FILE = path.join(TMP_DIR, 'post-mortem-pending.json');

// Min session length to analyze
const MIN_MESSAGES = 5;

// Error patterns to detect in transcript
const ERROR_PATTERNS = [
  /"error"/i,
  /"status":\s*(4\d{2}|5\d{2})/,
  /exit.?code["\s:]+[1-9]/i,
  /"retry"/i,
  /failed/i,
  /timed?\s*out/i,
  /exception/i
];

function main() {
  const transcriptPath = process.env.CLAUDE_TRANSCRIPT_PATH;

  // No transcript → skip
  if (!transcriptPath || !fs.existsSync(transcriptPath)) {
    process.exit(0);
  }

  try {
    const content = fs.readFileSync(transcriptPath, 'utf8');
    const lines = content.trim().split('\n').filter(Boolean);

    // Too short → skip
    if (lines.length < MIN_MESSAGES) {
      process.exit(0);
    }

    // Count errors
    let errorCount = 0;
    let retryCount = 0;
    const errors = [];

    for (const line of lines) {
      for (const pattern of ERROR_PATTERNS) {
        if (pattern.test(line)) {
          errorCount++;
          if (/retry/i.test(line)) retryCount++;
          // Capture first 100 chars of error context
          errors.push(line.substring(0, 100));
          break;
        }
      }
    }

    // No errors → skip
    if (errorCount === 0) {
      process.exit(0);
    }

    // Ensure tmp dir exists
    if (!fs.existsSync(TMP_DIR)) {
      fs.mkdirSync(TMP_DIR, { recursive: true });
    }

    // Extract session ID from transcript path
    const sessionId = path.basename(transcriptPath, '.jsonl') ||
                      `session-${Date.now()}`;

    // Write pending file
    const pending = {
      timestamp: new Date().toISOString(),
      sessionId,
      transcriptPath,
      messageCount: lines.length,
      errorCount,
      retryCount,
      sampleErrors: errors.slice(0, 5) // Max 5 samples
    };

    fs.writeFileSync(PENDING_FILE, JSON.stringify(pending, null, 2));

    // Signal to stderr (≤150 bytes)
    process.stderr.write(`[PostMortem] ${errorCount} errors found → pending.json\n`);
    process.exit(0);

  } catch (err) {
    // Graceful fail - don't block session
    process.stderr.write(`[PostMortem] Error: ${err.message.substring(0, 50)}\n`);
    process.exit(0);
  }
}

main();
