const https = require('https');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CREDS = { user: '', pass: '' };
const wpAuth = fs.readFileSync(path.join(ROOT, 'credentials/wp-auth.env'), 'utf8');
for (const line of wpAuth.split('\n')) {
  if (line.startsWith('WP_USER=')) CREDS.user = line.split('=')[1].trim();
  if (line.startsWith('WP_APP_PASS=')) CREDS.pass = line.split('=')[1].trim();
}
const auth = Buffer.from(`${CREDS.user}:${CREDS.pass}`).toString('base64');

function request(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const options = {
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: opts.method || 'GET',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json', ...opts.headers },
    };
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (d) => (body += d));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(body) }); }
        catch { resolve({ status: res.statusCode, data: body }); }
      });
    });
    req.on('error', reject);
    if (opts.body) req.write(opts.body);
    req.end();
  });
}

async function main() {
  // Step 1: Delete broken snippet 280
  console.log('1. Deleting broken snippet 280...');
  await request('https://studiokook.ee/wp-json/code-snippets/v1/snippets/280', { method: 'DELETE' });

  // Also delete any other "AI-Friendly robots.txt" or "Robots.txt" snippets
  console.log('   Checking for other robots.txt snippets...');
  const all = await request('https://studiokook.ee/wp-json/code-snippets/v1/snippets?per_page=300');
  if (Array.isArray(all.data)) {
    for (const s of all.data) {
      if (s.name && (s.name.includes('robots') || s.name.includes('Robots') || s.name.includes('TEMP'))) {
        await request(`https://studiokook.ee/wp-json/code-snippets/v1/snippets/${s.id}`, { method: 'DELETE' });
        console.log(`   🗑 Deleted: "${s.name}" (ID: ${s.id})`);
      }
    }
  }

  // Step 2: Read the PHP file and extract code (skip <?php tag and docblock)
  const phpFile = fs.readFileSync(path.join(ROOT, 'code-snippets/18-robots-txt-ai.php'), 'utf8');
  // Remove <?php and the docblock, keep only the add_filter call
  const codeStart = phpFile.indexOf('add_filter(');
  const code = phpFile.substring(codeStart);

  console.log('2. Installing robots.txt snippet...');
  console.log(`   Code length: ${code.length} chars`);

  const res = await request('https://studiokook.ee/wp-json/code-snippets/v1/snippets', {
    method: 'POST',
    body: JSON.stringify({
      name: 'AI-Friendly robots.txt',
      code: code,
      scope: 'global',
      active: true,
      priority: 10,
    }),
  });

  if (res.status === 200 || res.status === 201) {
    const id = res.data.id;
    const isActive = res.data.active;
    console.log(`   ✓ Installed (ID: ${id}, active: ${isActive})`);

    // Step 3: Clear cache
    console.log('3. Clearing cache...');
    await request('https://studiokook.ee/wp-json/sk/v1/full-clear');
    await new Promise(r => setTimeout(r, 2000));

    // Step 4: Verify
    console.log('4. Verifying robots.txt...');
    const check = await request('https://studiokook.ee/robots.txt');
    const txt = typeof check.data === 'string' ? check.data : JSON.stringify(check.data);
    if (txt.includes('GPTBot') && txt.includes('ClaudeBot')) {
      console.log('   ✓ SUCCESS! AI crawlers found in robots.txt');
    } else {
      console.log('   ✗ AI crawlers not found yet');
      console.log('   Content:', txt.slice(0, 400));
    }
  } else {
    console.log(`   ✗ Failed (${res.status}): ${JSON.stringify(res.data).slice(0, 300)}`);
  }
}

main().catch(console.error);
