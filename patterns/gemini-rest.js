#!/usr/bin/env node
// gemini-rest.js — direct Gemini REST API CLI replacement for `gemini` (deprecated 2026-06-18)
// Usage:
//   echo "context" | node gemini-rest.js -m gemini-2.5-flash -p "summarize"
//   node gemini-rest.js -p "describe" --file image.png
//   node gemini-rest.js -p "question" --max-tokens 8192
// Reads key from $GEMINI_API_KEY or ~/.claude/credentials/gemini-api.key

const https = require('https');
const fs = require('fs');
const os = require('os');
const path = require('path');

function parseArgs(argv) {
  const args = { model: 'gemini-2.5-flash', prompt: null, file: null, maxTokens: 8192, thinkingBudget: null };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '-m' || a === '--model') args.model = argv[++i];
    else if (a === '-p' || a === '--prompt') args.prompt = argv[++i];
    else if (a === '--file') args.file = argv[++i];
    else if (a === '--max-tokens') args.maxTokens = parseInt(argv[++i], 10);
    else if (a === '--thinking-budget') args.thinkingBudget = parseInt(argv[++i], 10);
    else if (a === '-h' || a === '--help') {
      console.error('Usage: gemini-rest.js -m <model> -p "<prompt>" [--file path] [--max-tokens N] [--thinking-budget N]');
      process.exit(0);
    }
  }
  if (!args.prompt) { console.error('ERR: -p <prompt> required'); process.exit(2); }
  return args;
}

function readApiKey() {
  let key = process.env.GEMINI_API_KEY;
  if (!key) {
    try { key = fs.readFileSync(path.join(os.homedir(), '.claude/credentials/gemini-api.key'), 'utf8').trim(); } catch {}
  }
  if (!key) { console.error('ERR: GEMINI_API_KEY not set, and credentials/gemini-api.key missing'); process.exit(2); }
  return key;
}

function readStdin() {
  return new Promise(resolve => {
    if (process.stdin.isTTY) return resolve('');
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', c => data += c);
    process.stdin.on('end', () => resolve(data));
  });
}

function detectMime(file) {
  const ext = path.extname(file).toLowerCase().slice(1);
  const map = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', heic: 'image/heic',
    mp4: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm',
    mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', m4a: 'audio/mp4',
    pdf: 'application/pdf', txt: 'text/plain', md: 'text/markdown' };
  return map[ext] || 'application/octet-stream';
}

async function main() {
  const args = parseArgs(process.argv);
  const apiKey = readApiKey();
  const stdin = await readStdin();

  const parts = [];
  if (stdin) parts.push({ text: stdin });
  if (args.file) {
    const buf = fs.readFileSync(args.file);
    parts.push({ inline_data: { mime_type: detectMime(args.file), data: buf.toString('base64') } });
  }
  parts.push({ text: args.prompt });

  // thinking_budget: 0 forces no reasoning trace (faster, cheaper for routine tasks)
  // For Flash classification/extraction, set 0 explicitly (default eats 3000+ tokens)
  const tb = args.thinkingBudget !== null ? args.thinkingBudget : (args.model.includes('flash') ? 0 : 1024);

  const body = JSON.stringify({
    contents: [{ parts }],
    generationConfig: { maxOutputTokens: args.maxTokens, temperature: 0.7, thinkingConfig: { thinkingBudget: tb } }
  });

  const req = https.request({
    hostname: 'generativelanguage.googleapis.com',
    path: `/v1beta/models/${args.model}:generateContent?key=${apiKey}`,
    method: 'POST',
    headers: { 'content-type': 'application/json', 'content-length': Buffer.byteLength(body) }
  }, res => {
    res.setEncoding('utf8');
    let buf = '';
    res.on('data', c => buf += c);
    res.on('end', () => {
      if (res.statusCode !== 200) {
        console.error(`ERR ${res.statusCode}: ${buf.slice(0, 500)}`);
        process.exit(1);
      }
      try {
        const j = JSON.parse(buf);
        const text = j.candidates?.[0]?.content?.parts?.map(p => p.text).filter(Boolean).join('') || '';
        if (!text) { console.error(`ERR: empty response. Raw: ${buf.slice(0, 500)}`); process.exit(1); }
        process.stdout.write(text);
        process.stdout.write('\n');
      } catch (e) {
        console.error(`ERR parse: ${e.message}\nRaw: ${buf.slice(0, 500)}`);
        process.exit(1);
      }
    });
  });
  req.on('error', e => { console.error(`ERR net: ${e.message}`); process.exit(1); });
  req.setTimeout(120000, () => { req.destroy(new Error('timeout 120s')); });
  req.write(body);
  req.end();
}

main();
