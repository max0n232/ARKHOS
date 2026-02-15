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
  const id = 284;
  console.log(`Activating snippet ${id}...`);
  const res = await request(`https://studiokook.ee/wp-json/code-snippets/v1/snippets/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ active: true }),
  });
  console.log(`Status: ${res.status}, active: ${res.data.active}`);

  if (res.data.active) {
    console.log('Clearing cache...');
    await request('https://studiokook.ee/wp-json/sk/v1/full-clear');
    await new Promise(r => setTimeout(r, 2000));

    console.log('Checking robots.txt...');
    const check = await request('https://studiokook.ee/robots.txt');
    const txt = typeof check.data === 'string' ? check.data : JSON.stringify(check.data);
    if (txt.includes('GPTBot') && txt.includes('ClaudeBot')) {
      console.log('✓ SUCCESS! AI crawlers in robots.txt');
    } else {
      console.log('✗ Not yet. Content:', txt.slice(0, 300));
    }
  }
}

main().catch(console.error);
