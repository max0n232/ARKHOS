#!/usr/bin/env node
/**
 * Add Russian translation to studiokook.ee via TRP API
 * Usage: node add-translation.js "Estonian text" "Русский перевод"
 */

const https = require('https');

const WP_USER = process.env.WP_USER;
const WP_APP_PASS = process.env.WP_APP_PASS;

if (!WP_USER || !WP_APP_PASS) {
  console.error('ERROR: Set WP_USER and WP_APP_PASS environment variables');
  process.exit(1);
}

const [original, translated] = process.argv.slice(2);

if (!original || !translated) {
  console.error('Usage: node add-translation.js "Estonian text" "Русский перевод"');
  process.exit(1);
}

const data = JSON.stringify({
  original,
  translated,
  lang: 'ru'
});

const req = https.request({
  hostname: 'studiokook.ee',
  path: '/wp-json/sk/v1/trp-add',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(data),
    'Authorization': 'Basic ' + Buffer.from(WP_USER + ':' + WP_APP_PASS).toString('base64')
  }
}, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', body);
  });
});

req.on('error', err => {
  console.error('Request failed:', err.message);
  process.exit(1);
});

req.write(data);
req.end();
