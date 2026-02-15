#!/usr/bin/env node
/**
 * Studiokook Context Loader v3.0 - Dynamic Discovery
 *
 * Принцип: НЕ дублировать то, что Claude Code делает сам
 * - MCP tools → автоматический Tool Search
 * - Skills → автоматическое обнаружение из папок
 * - Credentials → динамическое сканирование
 */

const fs = require('fs');
const path = require('path');

const PROJECT_DIR = path.join(__dirname, '..');
const SKILLS_DIR = path.join(PROJECT_DIR, 'skills');
const CREDENTIALS_DIR = path.join(PROJECT_DIR, 'credentials');

/**
 * Динамически сканирует skills из папки
 */
function scanSkills() {
    const skills = { project: [], count: 0 };

    // Сканируем skills/ (project-level)
    if (fs.existsSync(SKILLS_DIR)) {
        try {
            const entries = fs.readdirSync(SKILLS_DIR, { withFileTypes: true });
            for (const entry of entries) {
                // Skip non-skill directories
                if (entry.name === 'marketing' || entry.name === 'twitter-algorithm-optimizer') continue;

                if (entry.isDirectory()) {
                    const skillPath = path.join(SKILLS_DIR, entry.name, 'SKILL.md');
                    if (fs.existsSync(skillPath)) {
                        skills.project.push(entry.name);
                        skills.count++;
                    }
                } else if (entry.isFile() && entry.name.endsWith('.md') &&
                           entry.name !== 'README.md' && !entry.name.includes('REGISTRY')) {
                    // Single-file skills like seo-smm.md
                    skills.project.push(entry.name.replace('.md', ''));
                    skills.count++;
                }
            }

            // Сканируем вложенные skills (marketing/skills/*)
            const marketingSkills = path.join(SKILLS_DIR, 'marketing', 'skills');
            if (fs.existsSync(marketingSkills)) {
                const marketingEntries = fs.readdirSync(marketingSkills, { withFileTypes: true });
                for (const entry of marketingEntries) {
                    if (entry.isDirectory()) {
                        const skillPath = path.join(marketingSkills, entry.name, 'SKILL.md');
                        if (fs.existsSync(skillPath)) {
                            skills.count++;
                        }
                    }
                }
            }
        } catch (e) {
            // Continue
        }
    }

    return skills;
}

/**
 * Динамически сканирует credentials (только имена, не содержимое!)
 */
function scanCredentials() {
    const credentials = { available: [], count: 0 };

    if (fs.existsSync(CREDENTIALS_DIR)) {
        try {
            const files = fs.readdirSync(CREDENTIALS_DIR);
            for (const file of files) {
                if (file.endsWith('.json')) {
                    credentials.available.push(file.replace('.json', ''));
                    credentials.count++;
                }
            }
        } catch (e) {
            // Continue
        }
    }

    return credentials;
}

/**
 * Извлекает критические правила из CLAUDE.md
 */
function extractCriticalRules() {
    const claudeMd = path.join(PROJECT_DIR, 'CLAUDE.md');
    const rules = [];

    if (fs.existsSync(claudeMd)) {
        try {
            const content = fs.readFileSync(claudeMd, 'utf-8');
            const lines = content.split('\n');

            for (const line of lines) {
                // Ищем строки с НИКОГДА, forbidden, critical
                if (line.includes('НИКОГДА') || line.includes('forbidden') ||
                    line.includes('CRITICAL') || line.includes('запрещен')) {
                    const rule = line.trim().replace(/^[-*]\s*/, '').replace(/\*\*/g, '');
                    if (rule.length > 10 && rule.length < 100) {
                        rules.push(rule);
                    }
                }
            }
        } catch (e) {
            // Continue
        }
    }

    return rules.slice(0, 3); // Top 3 critical rules
}

/**
 * Проверяет наличие snippets registry
 */
function checkSnippetsRegistry() {
    const registryPath = path.join(PROJECT_DIR, 'knowledge', 'snippets-registry.json');

    if (fs.existsSync(registryPath)) {
        try {
            const registry = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));
            const active = (registry.snippets || []).filter(s => s.status === 'active').length;
            const total = (registry.snippets || []).length;
            return { active, total };
        } catch (e) {
            return { active: 0, total: 0 };
        }
    }

    return null;
}

/**
 * Main
 */
function main() {
    const skills = scanSkills();
    const credentials = scanCredentials();
    const criticalRules = extractCriticalRules();
    const snippets = checkSnippetsRegistry();

    // Формируем компактный вывод
    const summary = {
        project: 'Studiokook',
        site: 'studiokook.ee',

        // Динамически обнаруженные skills
        skills: {
            count: skills.count,
            examples: skills.project.slice(0, 5)
        },

        // Динамически обнаруженные credentials
        credentials: {
            count: credentials.count,
            available: credentials.available
        },

        // Критические правила из CLAUDE.md
        critical_rules: criticalRules,

        // Code snippets status
        snippets: snippets ? `${snippets.active} active / ${snippets.total} total` : 'No registry',

        // Напоминания
        hints: [
            'MCP tools: use /mcp to see available',
            'Skills: auto-discovered from skills/',
            'Before PHP changes: use /wp-problem-solver'
        ]
    };

    console.log(JSON.stringify(summary, null, 2));
    process.exit(0);
}

try {
    main();
} catch (err) {
    console.error(`Context loader error: ${err.message}`);
    console.log(JSON.stringify({
        project: 'Studiokook',
        error: err.message
    }));
    process.exit(0);
}
