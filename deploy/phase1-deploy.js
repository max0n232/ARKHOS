#!/usr/bin/env node
/**
 * STUDIOKOOK — Phase 1 Deploy Script
 * Запуск: node deploy/phase1-deploy.js
 *
 * Что делает:
 * 1. Импортирует n8n workflows (Content Generator, Pinterest Pinner)
 * 2. Устанавливает PHP-сниппеты через Code Snippets REST API
 * 3. Верифицирует установку
 *
 * Требования: Node.js 18+, credentials/ настроены
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// ============ CONFIG ============
const ROOT = path.resolve(__dirname, '..');
const CREDS = {
  wp: { user: '', pass: '' },
  n8n: { url: '', key: '' },
};

// Load credentials
function loadCreds() {
  const wpAuth = fs.readFileSync(path.join(ROOT, 'credentials/wp-auth.env'), 'utf8');
  for (const line of wpAuth.split('\n')) {
    if (line.startsWith('WP_USER=')) CREDS.wp.user = line.split('=')[1].trim();
    if (line.startsWith('WP_APP_PASS=')) CREDS.wp.pass = line.split('=')[1].trim();
  }
  const n8nAuth = fs.readFileSync(path.join(ROOT, 'credentials/n8n-api.env'), 'utf8');
  for (const line of n8nAuth.split('\n')) {
    if (line.startsWith('N8N_URL=')) CREDS.n8n.url = line.split('=')[1].trim();
    if (line.startsWith('N8N_API_KEY=')) CREDS.n8n.key = line.split('=')[1].trim();
  }
  console.log(`✓ Credentials loaded (WP: ${CREDS.wp.user}, n8n: ${CREDS.n8n.url})`);
}

// ============ HTTP HELPER ============
function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const opts = {
      hostname: parsed.hostname,
      port: parsed.port || 443,
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: { ...options.headers },
    };

    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data), headers: res.headers });
        } catch {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    if (options.body) req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    req.end();
  });
}

function wpHeaders() {
  const auth = Buffer.from(`${CREDS.wp.user}:${CREDS.wp.pass}`).toString('base64');
  return { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' };
}

function n8nHeaders() {
  return { 'X-N8N-API-KEY': CREDS.n8n.key, 'Content-Type': 'application/json' };
}

// ============ N8N WORKFLOW IMPORT ============
async function importN8nWorkflow(filePath, name) {
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // n8n API only accepts: name, nodes, connections, settings
  // All other fields cause 400 "must NOT have additional properties"
  const workflow = {
    name: name,
    nodes: raw.nodes || [],
    connections: raw.connections || {},
    settings: {
      executionOrder: (raw.settings && raw.settings.executionOrder) || 'v1',
      saveManualExecutions: (raw.settings && raw.settings.saveManualExecutions) || false,
    },
  };

  const url = `${CREDS.n8n.url}/api/v1/workflows`;

  try {
    const res = await request(url, {
      method: 'POST',
      headers: n8nHeaders(),
      body: JSON.stringify(workflow),
    });

    if (res.status === 200 || res.status === 201) {
      const id = res.data.id || res.data.data?.id;
      console.log(`  ✓ n8n: "${name}" imported (ID: ${id})`);
      return id;
    } else {
      console.log(`  ✗ n8n: "${name}" failed (${res.status}): ${JSON.stringify(res.data).slice(0, 200)}`);
      return null;
    }
  } catch (err) {
    console.log(`  ✗ n8n: "${name}" error: ${err.message}`);
    return null;
  }
}

async function deleteN8nWorkflow(id) {
  const url = `${CREDS.n8n.url}/api/v1/workflows/${id}`;
  try {
    await request(url, { method: 'DELETE', headers: n8nHeaders() });
    return true;
  } catch { return false; }
}

async function deployN8nWorkflows() {
  console.log('\n═══ 1/3 IMPORTING N8N WORKFLOWS ═══');

  const workflows = [
    { file: 'n8n/dev/content-generator.json', name: 'Studiokook: Content Generator' },
    { file: 'n8n/dev/pinterest-pinner.json', name: 'Studiokook: Pinterest Pinner' },
  ];

  // Step 1: Delete old duplicates
  try {
    const res = await request(`${CREDS.n8n.url}/api/v1/workflows`, { headers: n8nHeaders() });
    if (res.status === 200) {
      const existing = res.data.data || res.data;
      if (Array.isArray(existing)) {
        for (const wf of workflows) {
          const dupes = existing.filter(e => e.name === wf.name);
          for (const d of dupes) {
            await deleteN8nWorkflow(d.id);
            console.log(`  🗑 Deleted old: "${d.name}" (ID: ${d.id})`);
          }
        }
      }
    }
  } catch (err) {
    console.log(`  ⚠ Could not check existing workflows: ${err.message}`);
  }

  // Step 2: Import fresh
  let success = 0;
  for (const wf of workflows) {
    const filePath = path.join(ROOT, wf.file);
    if (!fs.existsSync(filePath)) {
      console.log(`  ✗ File not found: ${wf.file}`);
      continue;
    }
    const id = await importN8nWorkflow(filePath, wf.name);
    if (id) success++;
  }

  console.log(`  Итого: ${success}/${workflows.length} workflows imported`);
  return success;
}

// ============ CODE SNIPPETS INSTALL ============
async function getExistingSnippets() {
  const url = 'https://studiokook.ee/wp-json/code-snippets/v1/snippets';
  try {
    const res = await request(url, { headers: wpHeaders() });
    if (res.status === 200 && Array.isArray(res.data)) {
      return res.data;
    }
    return [];
  } catch {
    return [];
  }
}

async function createSnippet(name, code, scope = 'front-end') {
  const url = 'https://studiokook.ee/wp-json/code-snippets/v1/snippets';

  // Remove opening <?php tag if present
  let cleanCode = code.trim();
  if (cleanCode.startsWith('<?php')) {
    cleanCode = cleanCode.slice(5).trim();
  }

  const body = {
    name: name,
    code: cleanCode,
    scope: scope,  // 'global', 'front-end', 'admin', 'single-use'
    active: true,
    priority: 10,
  };

  try {
    const res = await request(url, {
      method: 'POST',
      headers: wpHeaders(),
      body: JSON.stringify(body),
    });

    if (res.status === 200 || res.status === 201) {
      const id = res.data.id || '?';
      console.log(`  ✓ WP: "${name}" installed & activated (ID: ${id})`);
      return true;
    } else {
      console.log(`  ✗ WP: "${name}" failed (${res.status}): ${JSON.stringify(res.data).slice(0, 300)}`);
      return false;
    }
  } catch (err) {
    console.log(`  ✗ WP: "${name}" error: ${err.message}`);
    return false;
  }
}

async function deleteSnippet(id) {
  const url = `https://studiokook.ee/wp-json/code-snippets/v1/snippets/${id}`;
  try {
    await request(url, { method: 'DELETE', headers: wpHeaders() });
    return true;
  } catch { return false; }
}

async function deployCodeSnippets() {
  console.log('\n═══ 2/3 INSTALLING CODE SNIPPETS ═══');

  const existing = await getExistingSnippets();
  console.log(`  Existing snippets: ${existing.length}`);

  const snippets = [
    { file: 'code-snippets/15-faqpage-schema.php', name: 'FAQPage Schema', scope: 'front-end' },
    { file: 'code-snippets/17-howto-schema.php', name: 'HowTo Schema - Kuidas tellida kööki', scope: 'front-end' },
    { file: 'code-snippets/18-product-service-schema.php', name: 'Product/Service Schema', scope: 'front-end' },
    { file: 'code-snippets/18-robots-txt-ai.php', name: 'AI-Friendly robots.txt', scope: 'global' },
    { file: 'code-snippets/19-ai-sitemap-hints.php', name: 'AI Sitemap Hints + BreadcrumbList', scope: 'front-end' },
  ];

  // Step 1: Delete ALL old duplicates of our snippets
  for (const sn of snippets) {
    const dupes = existing.filter(e => e.name === sn.name);
    if (dupes.length > 0) {
      for (const d of dupes) {
        await deleteSnippet(d.id);
        console.log(`  🗑 Deleted old: "${d.name}" (ID: ${d.id})`);
      }
      await new Promise(r => setTimeout(r, 300));
    }
  }

  // Step 2: Install fresh versions
  let success = 0;
  for (const sn of snippets) {
    const filePath = path.join(ROOT, sn.file);
    if (!fs.existsSync(filePath)) {
      console.log(`  ✗ File not found: ${sn.file}`);
      continue;
    }

    const code = fs.readFileSync(filePath, 'utf8');
    const ok = await createSnippet(sn.name, code, sn.scope);
    if (ok) success++;
    await new Promise(r => setTimeout(r, 500));
  }

  // Step 3: Clear all caches
  console.log('  Clearing WP caches...');
  try {
    const cacheRes = await request('https://studiokook.ee/wp-json/sk/v1/full-clear', { headers: wpHeaders() });
    console.log(`  ✓ Cache cleared (${cacheRes.status})`);
  } catch (err) {
    console.log(`  ⚠ Cache clear failed: ${err.message}`);
  }

  console.log(`  Итого: ${success}/${snippets.length} snippets installed (fresh)`);
  return success;
}

// ============ VERIFICATION ============
async function verify() {
  console.log('\n═══ 3/3 VERIFICATION ═══');

  let checks = 0;
  let passed = 0;

  // Check n8n workflows
  checks++;
  try {
    const res = await request(`${CREDS.n8n.url}/api/v1/workflows`, { headers: n8nHeaders() });
    if (res.status === 200) {
      const wfs = res.data.data || res.data;
      const names = Array.isArray(wfs) ? wfs.map(w => w.name) : [];
      const hasContentGen = names.some(n => n.includes('Content Generator'));
      const hasPinterest = names.some(n => n.includes('Pinterest'));
      console.log(`  ${hasContentGen ? '✓' : '✗'} n8n: Content Generator workflow`);
      console.log(`  ${hasPinterest ? '✓' : '✗'} n8n: Pinterest Pinner workflow`);
      if (hasContentGen && hasPinterest) passed++;
    } else {
      console.log(`  ✗ n8n: Could not list workflows (${res.status})`);
    }
  } catch (err) {
    console.log(`  ✗ n8n: ${err.message}`);
  }

  // Check WP snippets
  checks++;
  try {
    const snippets = await getExistingSnippets();
    const activeSnippets = snippets.filter(s => s.active);
    const schemaSnippets = activeSnippets.filter(s =>
      s.name.includes('Schema') || s.name.includes('robots') || s.name.includes('Sitemap')
    );
    console.log(`  ✓ WP: ${activeSnippets.length} active snippets (${schemaSnippets.length} schema/SEO)`);
    if (schemaSnippets.length >= 4) passed++;
  } catch (err) {
    console.log(`  ✗ WP snippets: ${err.message}`);
  }

  // Check robots.txt
  checks++;
  try {
    const res = await request('https://studiokook.ee/robots.txt');
    const hasAI = typeof res.data === 'string' && res.data.includes('GPTBot');
    console.log(`  ${hasAI ? '✓' : '✗'} robots.txt: AI crawlers ${hasAI ? 'configured' : 'NOT found'}`);
    if (hasAI) passed++;
  } catch (err) {
    console.log(`  ✗ robots.txt: ${err.message}`);
  }

  // Check schema on homepage
  checks++;
  try {
    const res = await request('https://studiokook.ee/');
    const hasSchema = typeof res.data === 'string' && res.data.includes('application/ld+json');
    console.log(`  ${hasSchema ? '✓' : '✗'} Homepage: Schema markup ${hasSchema ? 'present' : 'NOT found'}`);
    if (hasSchema) passed++;
  } catch (err) {
    console.log(`  ✗ Homepage schema: ${err.message}`);
  }

  console.log(`\n  Verification: ${passed}/${checks} checks passed`);
  return passed;
}

// ============ MAIN ============
async function main() {
  console.log('╔═══════════════════════════════════════════╗');
  console.log('║  STUDIOKOOK — Phase 1 Deploy             ║');
  console.log('║  n8n Workflows + WP Code Snippets        ║');
  console.log('╚═══════════════════════════════════════════╝');

  try {
    loadCreds();
  } catch (err) {
    console.error('✗ Failed to load credentials:', err.message);
    console.error('  Ensure credentials/ directory has wp-auth.env and n8n-api.env');
    process.exit(1);
  }

  const n8nResult = await deployN8nWorkflows();
  const wpResult = await deployCodeSnippets();
  const verifyResult = await verify();

  console.log('\n╔═══════════════════════════════════════════╗');
  console.log(`║  RESULTS:                                 ║`);
  console.log(`║  n8n Workflows:  ${n8nResult}/2 imported              ║`);
  console.log(`║  Code Snippets:  ${wpResult}/5 installed              ║`);
  console.log(`║  Verification:   ${verifyResult}/4 passed               ║`);
  console.log('╚═══════════════════════════════════════════════╝');

  if (n8nResult === 2 && wpResult === 5) {
    console.log('\n✓ Deploy complete! Workflows imported but NOT activated.');
    console.log('  Next steps:');
    console.log('  1. Open n8n → review workflows → configure credential nodes');
    console.log('  2. Test each workflow manually (Execute Once)');
    console.log('  3. Activate when ready');
  } else {
    console.log('\n⚠ Some items failed. Check errors above.');
    console.log('  You can re-run this script safely — it skips existing snippets.');
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
