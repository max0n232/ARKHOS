#!/usr/bin/env node
/**
 * Migrate reference files to Obsidian vault with YAML frontmatter.
 * Run: node ~/.claude/migrate-to-vault.js
 */

const fs = require('fs');
const path = require('path');

const HOME = process.env.HOME || process.env.USERPROFILE;
const CLAUDE = path.join(HOME, '.claude');
const SK = path.join(HOME, 'Desktop', 'Studiokook', '.claude', 'skills');
const AI = path.join(HOME, 'Desktop', 'AiGeneration', '.claude', 'skills');
const VAULT = path.join(HOME, 'ObsidianVault');

const migrations = [
  // Warm layer (~/.claude/)
  {
    src: path.join(CLAUDE, 'memory', 'global', 'troubleshooting.md'),
    dst: path.join(VAULT, 'troubleshooting', 'current.md'),
    tags: ['troubleshooting', 'accumulator'],
    project: 'cross-project'
  },
  {
    src: path.join(CLAUDE, 'memory', 'global', 'patterns.md'),
    dst: path.join(VAULT, 'troubleshooting', 'global-patterns.md'),
    tags: ['patterns', 'accumulator'],
    project: 'cross-project'
  },
  {
    src: path.join(CLAUDE, 'patterns', 'wordpress-plugins.md'),
    dst: path.join(VAULT, 'wordpress', 'plugin-safety.md'),
    tags: ['wordpress', 'plugins', 'safety', 'gotcha'],
    project: 'studiokook'
  },
  {
    src: path.join(CLAUDE, 'patterns', 'translation-verification.md'),
    dst: path.join(VAULT, 'wordpress', 'translation-verify.md'),
    tags: ['wordpress', 'translatepress', 'verification', 'pattern'],
    project: 'studiokook'
  },
  {
    src: path.join(CLAUDE, 'logs', 'post-mortem', '2026-02-24-2da2eaa4.md'),
    dst: path.join(VAULT, 'post-mortem', '2026-02-24.md'),
    tags: ['post-mortem', 'gpu', 'powershell'],
    project: 'cross-project'
  },
  {
    src: path.join(CLAUDE, 'logs', 'post-mortem', '2026-03-09-faq-translations.md'),
    dst: path.join(VAULT, 'post-mortem', '2026-03-09-faq.md'),
    tags: ['post-mortem', 'translations', 'verification-bias'],
    project: 'studiokook'
  },

  // n8n references (~/.claude/skills/n8n-expert/references/)
  {
    src: path.join(CLAUDE, 'skills', 'n8n-expert', 'references', 'mcp-tools.md'),
    dst: path.join(VAULT, 'n8n', 'mcp-tools.md'),
    tags: ['n8n', 'mcp', 'tools'],
    project: 'cross-project'
  },
  {
    src: path.join(CLAUDE, 'skills', 'n8n-expert', 'references', 'workflow-patterns.md'),
    dst: path.join(VAULT, 'n8n', 'workflow-patterns.md'),
    tags: ['n8n', 'patterns', 'architecture'],
    project: 'cross-project'
  },
  {
    src: path.join(CLAUDE, 'skills', 'n8n-expert', 'references', 'code-javascript.md'),
    dst: path.join(VAULT, 'n8n', 'code-javascript.md'),
    tags: ['n8n', 'code', 'javascript'],
    project: 'cross-project'
  },
  {
    src: path.join(CLAUDE, 'skills', 'n8n-expert', 'references', 'code-python.md'),
    dst: path.join(VAULT, 'n8n', 'code-python.md'),
    tags: ['n8n', 'code', 'python'],
    project: 'cross-project'
  },
  {
    src: path.join(CLAUDE, 'skills', 'n8n-expert', 'references', 'expressions.md'),
    dst: path.join(VAULT, 'n8n', 'expressions.md'),
    tags: ['n8n', 'expressions', 'syntax'],
    project: 'cross-project'
  },
  {
    src: path.join(CLAUDE, 'skills', 'n8n-expert', 'references', 'validation.md'),
    dst: path.join(VAULT, 'n8n', 'validation.md'),
    tags: ['n8n', 'validation', 'errors'],
    project: 'cross-project'
  },
  {
    src: path.join(CLAUDE, 'skills', 'n8n-expert', 'references', 'node-config.md'),
    dst: path.join(VAULT, 'n8n', 'node-config.md'),
    tags: ['n8n', 'configuration', 'nodes'],
    project: 'cross-project'
  },

  // Studiokook references
  {
    src: path.join(SK, 'wordpress', 'projects', 'studiokook', 'INFRASTRUCTURE.md'),
    dst: path.join(VAULT, 'studiokook', 'infrastructure.md'),
    tags: ['studiokook', 'infrastructure', 'wordpress'],
    project: 'studiokook'
  },
  {
    src: path.join(SK, 'wordpress', 'projects', 'studiokook', 'KNOWLEDGE.md'),
    dst: path.join(VAULT, 'studiokook', 'knowledge.md'),
    tags: ['studiokook', 'knowledge', 'gotcha'],
    project: 'studiokook'
  },
  {
    src: path.join(SK, 'wordpress', 'projects', 'studiokook', 'SEO-FIXES.md'),
    dst: path.join(VAULT, 'studiokook', 'seo-fixes.md'),
    tags: ['studiokook', 'seo', 'fixes'],
    project: 'studiokook'
  },
  {
    src: path.join(SK, 'wordpress', 'references', 'examples.md'),
    dst: path.join(VAULT, 'studiokook', 'examples.md'),
    tags: ['studiokook', 'wordpress', 'examples', 'code'],
    project: 'studiokook'
  },
  {
    src: path.join(SK, 'wordpress', 'references', 'windows-gotchas.md'),
    dst: path.join(VAULT, 'wordpress', 'windows-gotchas.md'),
    tags: ['wordpress', 'windows', 'gotcha', 'encoding'],
    project: 'cross-project'
  },
  {
    src: path.join(SK, 'wordpress', 'references', 'translatepress-internals.md'),
    dst: path.join(VAULT, 'wordpress', 'translatepress.md'),
    tags: ['wordpress', 'translatepress', 'internals'],
    project: 'studiokook'
  },
  {
    src: path.join(SK, 'wp-problem-solver', 'references', 'five-whys.md'),
    dst: path.join(VAULT, 'wordpress', 'five-whys.md'),
    tags: ['wordpress', 'debugging', 'methodology'],
    project: 'cross-project'
  },
  {
    src: path.join(SK, 'wp-problem-solver', 'references', 'solution-types.md'),
    dst: path.join(VAULT, 'wordpress', 'problem-solving.md'),
    tags: ['wordpress', 'problem-solving', 'patterns'],
    project: 'cross-project'
  },
  {
    src: path.join(SK, 'seo-aeo', 'resources', 'studiokook-seo.md'),
    dst: path.join(VAULT, 'studiokook', 'seo-strategy.md'),
    tags: ['studiokook', 'seo', 'strategy', 'keywords'],
    project: 'studiokook'
  },
  {
    src: path.join(SK, 'seo-aeo', 'resources', 'technical-seo.md'),
    dst: path.join(VAULT, 'seo', 'technical-seo.md'),
    tags: ['seo', 'technical', 'performance'],
    project: 'cross-project'
  },
  {
    src: path.join(SK, 'seo-aeo', 'resources', 'aeo-considerations.md'),
    dst: path.join(VAULT, 'seo', 'aeo-considerations.md'),
    tags: ['seo', 'aeo', 'ai-search'],
    project: 'cross-project'
  },
  {
    src: path.join(SK, 'seo-aeo', 'resources', 'eeat-principles.md'),
    dst: path.join(VAULT, 'seo', 'eeat-principles.md'),
    tags: ['seo', 'eeat', 'authority'],
    project: 'cross-project'
  },
  {
    src: path.join(SK, 'seo-aeo', 'resources', 'structured-data.md'),
    dst: path.join(VAULT, 'seo', 'structured-data.md'),
    tags: ['seo', 'schema', 'structured-data'],
    project: 'cross-project'
  },
  {
    src: path.join(SK, 'visual-style', 'references', 'interior-design-rules.md'),
    dst: path.join(VAULT, 'studiokook', 'interior-design-rules.md'),
    tags: ['studiokook', 'design', 'interior'],
    project: 'studiokook'
  },

  // AiGeneration references
  {
    src: path.join(AI, 'fal-ai', 'fal-workflow', 'references', 'MODELS.md'),
    dst: path.join(VAULT, 'ai-generation', 'fal-models.md'),
    tags: ['ai', 'fal', 'models'],
    project: 'ai-generation'
  },
  {
    src: path.join(AI, 'fal-ai', 'fal-workflow', 'references', 'PATTERNS.md'),
    dst: path.join(VAULT, 'ai-generation', 'fal-patterns.md'),
    tags: ['ai', 'fal', 'patterns'],
    project: 'ai-generation'
  },
  {
    src: path.join(AI, 'fal-ai', 'fal-workflow', 'references', 'EXAMPLES.md'),
    dst: path.join(VAULT, 'ai-generation', 'fal-examples.md'),
    tags: ['ai', 'fal', 'examples'],
    project: 'ai-generation'
  },
  {
    src: path.join(AI, 'fal-ai', 'fal-workflow', 'references', 'WORKFLOWS.md'),
    dst: path.join(VAULT, 'ai-generation', 'fal-workflows.md'),
    tags: ['ai', 'fal', 'workflows'],
    project: 'ai-generation'
  },
  {
    src: path.join(AI, 'visual-style', 'references', 'prompt-templates.md'),
    dst: path.join(VAULT, 'ai-generation', 'prompt-templates.md'),
    tags: ['ai', 'prompts', 'templates', 'visual'],
    project: 'ai-generation'
  },
  {
    src: path.join(AI, 'visual-style', 'references', 'i2i-models.md'),
    dst: path.join(VAULT, 'ai-generation', 'i2i-models.md'),
    tags: ['ai', 'i2i', 'models', 'visual'],
    project: 'ai-generation'
  },
  {
    src: path.join(AI, 'visual-style', 'references', 'project-catalog.md'),
    dst: path.join(VAULT, 'ai-generation', 'project-catalog.md'),
    tags: ['ai', 'projects', 'catalog', 'visual'],
    project: 'ai-generation'
  },
  {
    src: path.join(AI, 'smm-context', 'references', 'smm-map.md'),
    dst: path.join(VAULT, 'ai-generation', 'smm-map.md'),
    tags: ['smm', 'social-media', 'accounts'],
    project: 'ai-generation'
  },
];

// Studiokook visual-style also has prompt-templates, i2i-models, project-catalog
// but they may be duplicates of AiGeneration ones — skip if identical

let migrated = 0;
let skipped = 0;
let errors = 0;

for (const m of migrations) {
  try {
    if (!fs.existsSync(m.src)) {
      console.log(`SKIP (not found): ${m.src}`);
      skipped++;
      continue;
    }

    const content = fs.readFileSync(m.src, 'utf-8');
    const srcRel = path.relative(HOME, m.src).replace(/\\/g, '/');

    const frontmatter = [
      '---',
      `tags: [${m.tags.join(', ')}]`,
      `project: ${m.project}`,
      `source: ${srcRel}`,
      `updated: 2026-03-17`,
      '---',
      '',
    ].join('\n');

    // Skip if content already has frontmatter
    const output = content.startsWith('---') ? content : frontmatter + content;

    fs.mkdirSync(path.dirname(m.dst), { recursive: true });
    fs.writeFileSync(m.dst, output, 'utf-8');
    console.log(`OK: ${path.relative(VAULT, m.dst)}`);
    migrated++;
  } catch (e) {
    console.error(`ERROR: ${m.src} → ${e.message}`);
    errors++;
  }
}

console.log(`\nDone: ${migrated} migrated, ${skipped} skipped, ${errors} errors`);
