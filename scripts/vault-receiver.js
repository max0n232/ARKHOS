#!/usr/bin/env node
/**
 * vault-receiver.js — HTTP bridge: VPS (n8n) → Local Obsidian vault
 * Receives notes via Cloudflare Tunnel, saves to Obsidian REST API or filesystem.
 * Port: 3456
 */
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = 3456;
const SECRET = process.env.VAULT_WEBHOOK_SECRET || '';
const OBSIDIAN_KEY = 'fd592d6558167964667e2ad8c6d61c8419035ea16c4f8e80c6b833969990a91b';
const OBSIDIAN_PORT = 27124;
const VAULT_PATH = 'C:/Users/sorte/ObsidianVault';

function saveViaObsidianAPI(filePath, content) {
  return new Promise((resolve, reject) => {
    const encoded = encodeURIComponent(filePath);
    const data = Buffer.from(content, 'utf-8');
    const req = https.request({
      hostname: '127.0.0.1',
      port: OBSIDIAN_PORT,
      path: '/vault/' + encoded,
      method: 'PUT',
      headers: {
        'Authorization': 'Bearer ' + OBSIDIAN_KEY,
        'Content-Type': 'text/markdown',
        'Content-Length': data.length,
      },
      rejectUnauthorized: false,
    }, (res) => {
      let body = '';
      res.on('data', (c) => body += c);
      res.on('end', () => res.statusCode < 300 ? resolve(body) : reject(new Error('Obsidian API ' + res.statusCode + ': ' + body)));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function saveViaFilesystem(filePath, content) {
  const full = path.join(VAULT_PATH, filePath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, 'utf-8');
}

const server = http.createServer(async (req, res) => {
  const sendJSON = (code, obj) => {
    const body = JSON.stringify(obj);
    res.writeHead(code, { 'Content-Type': 'application/json' });
    res.end(body);
  };

  if (req.method === 'GET' && req.url === '/health') {
    return sendJSON(200, { ok: true, service: 'vault-receiver' });
  }

  if (req.method !== 'POST' || req.url !== '/save-note') {
    return sendJSON(404, { error: 'not found' });
  }

  let body = '';
  req.on('data', (c) => body += c);
  req.on('end', async () => {
    try {
      const data = JSON.parse(body);

      if (SECRET && data.secret !== SECRET) {
        return sendJSON(401, { error: 'unauthorized' });
      }

      const { path: vaultDir, filename, content } = data;
      if (!vaultDir || !filename || !content) {
        return sendJSON(400, { error: 'path, filename, content required' });
      }

      const filePath = vaultDir + '/' + filename + '.md';

      try {
        await saveViaObsidianAPI(filePath, content);
        console.log('[OK] Saved via Obsidian API:', filePath);
        sendJSON(200, { ok: true, method: 'obsidian-api', path: filePath });
      } catch (apiErr) {
        console.warn('[WARN] Obsidian API failed, using filesystem:', apiErr.message);
        saveViaFilesystem(filePath, content);
        console.log('[OK] Saved via filesystem:', filePath);
        sendJSON(200, { ok: true, method: 'filesystem', path: filePath });
      }
    } catch (e) {
      console.error('[ERROR]', e.message);
      sendJSON(500, { error: e.message });
    }
  });
});

server.listen(PORT, () => {
  console.log('vault-receiver listening on http://localhost:' + PORT);
  console.log('Obsidian API: https://127.0.0.1:' + OBSIDIAN_PORT);
  console.log('Vault path: ' + VAULT_PATH);
});
