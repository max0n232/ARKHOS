#!/usr/bin/env node
/**
 * UserPromptSubmit Hook: Pre-Task Loader
 *
 * Detects domain triggers in user prompt → injects relevant topic-file
 * sections directly into context. Bridges "write-only" knowledge gap:
 * causal-rules.md says "Read [[topic]]" but Claude must follow that link;
 * this hook does the read automatically based on keywords.
 *
 * Trigger rules synced with vault/10-Projects/ARKHOS/causal-rules.md.
 * Section-scoped reads (## Heading) keep injection size bounded.
 */

const fs = require('fs');
const path = require('path');

const VAULT = process.env.OBSIDIAN_VAULT_PATH || 'C:/Users/sorte/ObsidianVault';
const STATE_FILE = path.join(__dirname, '.pre-task-loader-state.json');
const PER_FILE_THROTTLE_MS = 30 * 60 * 1000; // skip re-injection of same file within 30 min
const MAX_INJECT_CHARS = 6000; // per file cap (~1.5K tokens)

const RULES = [
  {
    name: 'EK / DC mechanics',
    pattern: /\b(EasyKitchen|set_attribute|redraw_with_undo|FACADE\d?|DRAWER|BLEND\d?|PANEL_V|d10[1-6]|d20[1-4]|k14[3-7]|lenz|ANIMATECUSTOM|onclick=|\.skp\b)/i,
    file: '10-Projects/3D-Configurators/easykitchen/dc-mechanics.md',
    sections: ['Anti-patterns'],
  },
  {
    name: 'EK facade/blend/gap',
    pattern: /\b(d106|facade\s*gap|BLEND\d?|PANEL_V|t4_corners?)/i,
    file: '10-Projects/3D-Configurators/easykitchen/facade-gap-standards.md',
    sections: null, // whole file (capped)
  },
  {
    name: 'EK formulas',
    pattern: /\b(parent!\w+|mm!\w+|CHOOSE\s*\(|RotZ|_x_formula|_y_formula|_animation_formula|formulaunits)/i,
    file: '10-Projects/3D-Configurators/easykitchen/formulas.md',
    sections: null,
  },
  {
    name: 'EK export / BOM',
    pattern: /\b(EkExport|\.bom|cutlist|save_as|_lengthunits)/i,
    file: '10-Projects/3D-Configurators/easykitchen/export-pipeline.md',
    sections: null,
  },
  {
    name: 'Vault routing / distill',
    pattern: /\b(distill|дистилляц|librarian|routing[-\s]?map|topic[-\s]file|accumulator|folder[-\s]MOC)/i,
    file: '90-System/routing-map.md',
    sections: null,
  },
  {
    name: 'Zero Point First',
    pattern: /\b(zero[-\s]point|нулев[ауы].*точк|координат.*шкаф|geomet.*кух|параметрическ.*систем)/i,
    file: '90-System/zero-point-principle.md',
    sections: null,
  },
];

function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); }
  catch { return {}; }
}
function saveState(s) {
  try { fs.writeFileSync(STATE_FILE, JSON.stringify(s)); } catch {}
}

function extractSection(content, heading) {
  const re = new RegExp(`^##\\s+${heading.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}\\b`, 'm');
  const start = content.search(re);
  if (start === -1) return null;
  const after = content.slice(start);
  const next = after.slice(1).search(/^##\s+/m);
  return next === -1 ? after : after.slice(0, next + 1);
}

function readPrompt() {
  try {
    const raw = fs.readFileSync(0, 'utf8');
    const j = JSON.parse(raw);
    return (j.prompt || j.user_prompt || '').toString();
  } catch { return ''; }
}

try {
  const prompt = readPrompt();
  if (!prompt || prompt.length < 8) process.exit(0);

  const state = loadState();
  const now = Date.now();
  const matched = [];

  for (const rule of RULES) {
    if (!rule.pattern.test(prompt)) continue;
    const fullPath = path.join(VAULT, rule.file);
    const lastInject = state[rule.file] || 0;
    if (now - lastInject < PER_FILE_THROTTLE_MS) continue;
    if (!fs.existsSync(fullPath)) continue;

    let content = fs.readFileSync(fullPath, 'utf8');
    if (rule.sections && rule.sections.length) {
      const parts = rule.sections
        .map(h => extractSection(content, h))
        .filter(Boolean);
      if (parts.length === 0) continue;
      content = parts.join('\n');
    }
    if (content.length > MAX_INJECT_CHARS) {
      content = content.slice(0, MAX_INJECT_CHARS) + `\n\n... (truncated, read [[${rule.file}]] for full)`;
    }

    matched.push({ rule: rule.name, file: rule.file, content });
    state[rule.file] = now;
  }

  if (matched.length === 0) process.exit(0);

  const blocks = matched.map(m =>
    `### ${m.rule} → ${m.file}\n${m.content.trim()}`
  ).join('\n\n---\n\n');

  const out = {
    hookSpecificOutput: {
      hookEventName: 'UserPromptSubmit',
      additionalContext: `[CAUSAL PRELOAD] Triggered by keywords in prompt — context loaded directly (skip manual vault search for these topics):\n\n${blocks}`,
    },
  };
  saveState(state);
  process.stdout.write(JSON.stringify(out));
} catch {
  process.exit(0);
}
