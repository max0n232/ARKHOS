#!/usr/bin/env node
/**
 * Snippets Registry Manager
 *
 * CRUD operations for WordPress code snippets tracking.
 * Ensures all snippets are documented with root cause analysis.
 */

const fs = require('fs');
const path = require('path');

const STUDIOKOOK_DIR = 'C:\\Users\\sorte\\Desktop\\Studiokook';
const REGISTRY_PATH = path.join(STUDIOKOOK_DIR, 'knowledge', 'snippets-registry.json');

class SnippetsManager {
    constructor() {
        this.registry = this.load();
    }

    load() {
        try {
            if (fs.existsSync(REGISTRY_PATH)) {
                return JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf-8'));
            }
        } catch (e) {
            console.error('Failed to load registry:', e.message);
        }
        return { version: '1.0.0', last_updated: new Date().toISOString().split('T')[0], snippets: [] };
    }

    save() {
        this.registry.last_updated = new Date().toISOString().split('T')[0];
        fs.writeFileSync(REGISTRY_PATH, JSON.stringify(this.registry, null, 2));
    }

    // Add new snippet
    add(snippet) {
        const required = ['id', 'title', 'purpose', 'root_cause'];
        for (const field of required) {
            if (!snippet[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        }

        // Check for duplicates
        if (this.registry.snippets.find(s => s.id === snippet.id)) {
            throw new Error(`Snippet with id "${snippet.id}" already exists`);
        }

        const newSnippet = {
            id: snippet.id,
            file: snippet.file || null,
            title: snippet.title,
            status: snippet.status || 'active',
            purpose: snippet.purpose,
            root_cause: snippet.root_cause,
            solution_type: snippet.solution_type || 'fix',
            created: new Date().toISOString().split('T')[0],
            cleanup_after: snippet.cleanup_after || null,
            dependencies: snippet.dependencies || [],
            affects: snippet.affects || [],
            verified: false,
            notes: snippet.notes || ''
        };

        this.registry.snippets.push(newSnippet);
        this.save();
        return newSnippet;
    }

    // Update snippet
    update(id, updates) {
        const index = this.registry.snippets.findIndex(s => s.id === id);
        if (index === -1) {
            throw new Error(`Snippet "${id}" not found`);
        }

        this.registry.snippets[index] = {
            ...this.registry.snippets[index],
            ...updates
        };
        this.save();
        return this.registry.snippets[index];
    }

    // Change status
    setStatus(id, status) {
        const valid = ['active', 'temporary', 'deprecated', 'deleted'];
        if (!valid.includes(status)) {
            throw new Error(`Invalid status. Must be one of: ${valid.join(', ')}`);
        }
        return this.update(id, { status });
    }

    // Mark for cleanup
    markTemporary(id, cleanupDays = 30) {
        const cleanupDate = new Date();
        cleanupDate.setDate(cleanupDate.getDate() + cleanupDays);
        return this.update(id, {
            status: 'temporary',
            cleanup_after: cleanupDate.toISOString().split('T')[0]
        });
    }

    // Get snippet by ID
    get(id) {
        return this.registry.snippets.find(s => s.id === id);
    }

    // List snippets with optional filter
    list(filter = {}) {
        let results = this.registry.snippets;

        if (filter.status) {
            results = results.filter(s => s.status === filter.status);
        }
        if (filter.solution_type) {
            results = results.filter(s => s.solution_type === filter.solution_type);
        }

        return results;
    }

    // Find snippets needing cleanup
    getExpired() {
        const today = new Date().toISOString().split('T')[0];
        return this.registry.snippets.filter(s =>
            s.cleanup_after && s.cleanup_after <= today && s.status !== 'deleted'
        );
    }

    // Find workarounds (candidates for proper fixes)
    getWorkarounds() {
        return this.registry.snippets.filter(s =>
            s.solution_type === 'workaround' && s.status === 'active'
        );
    }

    // Search snippets
    search(query) {
        const q = query.toLowerCase();
        return this.registry.snippets.filter(s => {
            const text = `${s.id} ${s.title} ${s.purpose} ${s.root_cause} ${s.notes}`.toLowerCase();
            return text.includes(q);
        });
    }

    // Generate report
    report() {
        const snippets = this.registry.snippets;
        const active = snippets.filter(s => s.status === 'active').length;
        const temporary = snippets.filter(s => s.status === 'temporary').length;
        const deprecated = snippets.filter(s => s.status === 'deprecated').length;
        const workarounds = this.getWorkarounds().length;
        const expired = this.getExpired().length;

        return {
            total: snippets.length,
            by_status: { active, temporary, deprecated },
            workarounds_active: workarounds,
            needs_cleanup: expired,
            last_updated: this.registry.last_updated
        };
    }
}

// CLI
if (require.main === module) {
    const args = process.argv.slice(2);
    const cmd = args[0];
    const manager = new SnippetsManager();

    try {
        switch (cmd) {
            case 'list':
                const filter = args[1] ? { status: args[1] } : {};
                console.log(JSON.stringify(manager.list(filter), null, 2));
                break;

            case 'get':
                if (!args[1]) { console.error('Usage: snippets-manager get <id>'); process.exit(1); }
                console.log(JSON.stringify(manager.get(args[1]), null, 2));
                break;

            case 'add':
                // Interactive or JSON input
                console.log('Use programmatically or pass JSON: node snippets-manager.js add \'{"id":"...", ...}\'');
                if (args[1]) {
                    const snippet = JSON.parse(args[1]);
                    console.log(JSON.stringify(manager.add(snippet), null, 2));
                }
                break;

            case 'status':
                if (!args[1] || !args[2]) {
                    console.error('Usage: snippets-manager status <id> <active|temporary|deprecated|deleted>');
                    process.exit(1);
                }
                console.log(JSON.stringify(manager.setStatus(args[1], args[2]), null, 2));
                break;

            case 'expired':
                console.log(JSON.stringify(manager.getExpired(), null, 2));
                break;

            case 'workarounds':
                console.log(JSON.stringify(manager.getWorkarounds(), null, 2));
                break;

            case 'search':
                if (!args[1]) { console.error('Usage: snippets-manager search <query>'); process.exit(1); }
                console.log(JSON.stringify(manager.search(args[1]), null, 2));
                break;

            case 'report':
                console.log(JSON.stringify(manager.report(), null, 2));
                break;

            default:
                console.log(`
Snippets Registry Manager

Commands:
  list [status]       List snippets (optionally filter by status)
  get <id>           Get snippet by ID
  add '<json>'       Add new snippet
  status <id> <s>    Change status (active|temporary|deprecated|deleted)
  expired            Show snippets past cleanup_after date
  workarounds        Show active workarounds (need proper fixes)
  search <query>     Search snippets
  report             Summary statistics
                `);
        }
    } catch (e) {
        console.error('Error:', e.message);
        process.exit(1);
    }
}

module.exports = { SnippetsManager };
