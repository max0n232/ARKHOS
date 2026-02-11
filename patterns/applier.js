#!/usr/bin/env node
/**
 * Pattern Applier
 * Applies corrections from analyses with backup and safety checks
 */

const { promises: fs } = require('fs');
const path = require('path');

const CLAUDE_DIR = path.join(process.env.HOME || process.env.USERPROFILE, '.claude');
const TRACKER_DB = path.join(CLAUDE_DIR, 'patterns', 'tracker.db');
const BACKUP_DIR = path.join(CLAUDE_DIR, 'patterns', 'backups');

let initSqlJs;
try {
    initSqlJs = require('sql.js');
} catch (e) {
    console.log('sql.js not installed');
    process.exit(1);
}

function escapeSQL(str) {
    if (str === null || str === undefined) return 'NULL';
    return "'" + String(str).replace(/'/g, "''") + "'";
}

async function ensureBackupDir() {
    try {
        await fs.mkdir(BACKUP_DIR, { recursive: true });
    } catch (e) {
        // Intentionally silent - directory may already exist
    }
}

async function backupFile(filePath) {
    try {
        await fs.access(filePath);
    } catch (e) {
        return null; // File doesn't exist
    }

    await ensureBackupDir();
    const filename = path.basename(filePath);
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const backupPath = path.join(BACKUP_DIR, `${filename}.${timestamp}.backup`);

    await fs.copyFile(filePath, backupPath);
    return backupPath;
}

function isSafeCorrection(correction) {
    const forbiddenPatterns = [
        'security/rules.json',
        'security\\rules.json',
        'CLAUDE.md',
        'CONSTITUTION.md'
    ];

    const target = correction.target.replace(/\\/g, '/');

    for (const pattern of forbiddenPatterns) {
        if (target.includes(pattern.replace(/\\/g, '/'))) {
            console.warn(`⚠️ Unsafe target blocked: ${correction.target}`);
            return false;
        }
    }

    if (correction.severity === 'critical' && correction.auto_apply) {
        console.warn(`⚠️ Critical corrections require manual approval`);
        return false;
    }

    return true;
}

async function applyCorrection(correction) {
    const targetPath = correction.target;

    // Check if parent directory exists
    const dir = path.dirname(targetPath);
    try {
        await fs.mkdir(dir, { recursive: true });
    } catch (e) {
        // Intentionally silent - directory may already exist
    }

    let backupPath = null;
    let fileExists = false;

    try {
        await fs.access(targetPath);
        fileExists = true;
        backupPath = await backupFile(targetPath);
    } catch (e) {
        // File doesn't exist, will be created
    }

    try {
        if (!fileExists) {
            // Create new file
            await fs.writeFile(targetPath, correction.content + '\n', 'utf-8');
            return { success: true, action: 'created', backup: null };
        }

        const currentContent = await fs.readFile(targetPath, 'utf-8');

        if (correction.action === 'add') {
            const newContent = currentContent + '\n\n' + correction.content + '\n';
            await fs.writeFile(targetPath, newContent, 'utf-8');
            return { success: true, action: 'appended', backup: backupPath };
        } else {
            return { success: false, error: `Unsupported action: ${correction.action}` };
        }
    } catch (e) {
        return { success: false, error: e.message };
    }
}

async function getPendingCorrections(db) {
    const result = db.exec(`
        SELECT id, corrections_json FROM analyses
        ORDER BY created_at DESC
        LIMIT 1
    `);

    if (!result.length || !result[0].values.length) {
        return { analysisId: null, corrections: [] };
    }

    const [analysisId, correctionsJson] = result[0].values[0];

    // Check if this analysis already has applied corrections
    const appliedResult = db.exec(`
        SELECT COUNT(*) FROM applied_corrections
        WHERE analysis_id = ${analysisId}
    `);
    const appliedCount = appliedResult.length ? appliedResult[0].values[0][0] : 0;

    let corrections = [];
    try {
        corrections = JSON.parse(correctionsJson);
    } catch (e) {
        // Invalid JSON, return empty corrections
    }

    // Skip if all corrections already applied
    if (appliedCount >= corrections.length) {
        return { analysisId: null, corrections: [] };
    }

    // Filter to auto-applicable
    const autoApplicable = corrections.filter(c =>
        c.auto_apply &&
        c.severity !== 'critical' &&
        isSafeCorrection(c)
    );

    return { analysisId, corrections: autoApplicable };
}

function recordCorrection(db, analysisId, correction, result) {
    db.exec(`
        INSERT INTO applied_corrections (
            analysis_id, type, target, action, content, reason,
            auto_applied, approved_by, backup_path
        ) VALUES (
            ${analysisId},
            ${escapeSQL(correction.type)},
            ${escapeSQL(correction.target)},
            ${escapeSQL(correction.action)},
            ${escapeSQL(correction.content)},
            ${escapeSQL(correction.reason)},
            1,
            'auto',
            ${escapeSQL(result.backup)}
        )
    `);
}

async function apply() {
    try {
        await fs.access(TRACKER_DB);
    } catch (e) {
        console.log('No tracker database found');
        process.exit(0);
    }

    const SQL = await initSqlJs();
    const buffer = await fs.readFile(TRACKER_DB);
    const db = new SQL.Database(buffer);

    const { analysisId, corrections } = await getPendingCorrections(db);

    if (!corrections.length) {
        console.log('No auto-applicable corrections');
        db.close();
        process.exit(0);
    }

    console.log(`\nApplying ${corrections.length} corrections...\n`);

    let applied = 0;
    let failed = 0;

    for (const correction of corrections) {
        console.log(`📝 ${correction.type}: ${path.basename(correction.target)}`);
        console.log(`   Reason: ${correction.reason}`);

        const result = await applyCorrection(correction);

        if (result.success) {
            recordCorrection(db, analysisId, correction, result);
            console.log(`   ✅ ${result.action}${result.backup ? ` (backup: ${path.basename(result.backup)})` : ''}\n`);
            applied++;
        } else {
            console.log(`   ❌ Failed: ${result.error}\n`);
            failed++;
        }
    }

    // Save database
    await fs.writeFile(TRACKER_DB, Buffer.from(db.export()));
    db.close();

    console.log(`\n✅ Applied: ${applied}, Failed: ${failed}`);
    process.exit(0);
}

// Export for use by reporter.js and approve.js
module.exports = { apply, applyCorrection, isSafeCorrection };

if (require.main === module) {
    apply().catch(e => {
        console.error(`Applier error: ${e.message}`);
        process.exit(1);
    });
}
