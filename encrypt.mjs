// Usage: ZUGATI_PASSWORD=... node encrypt.mjs data.json
// Encrypts the plain data file into data.enc.json (AES-256-GCM, key from PBKDF2-SHA256).
// The plain data.json must never be committed (see .gitignore).
import { readFileSync, writeFileSync } from 'node:fs';
import { randomBytes, pbkdf2Sync, createCipheriv } from 'node:crypto';

const pw = process.env.ZUGATI_PASSWORD;
if (!pw) { console.error('Set ZUGATI_PASSWORD'); process.exit(1); }
const src = process.argv[2] || 'data.json';
const data = JSON.parse(readFileSync(src, 'utf8'));

// Basic shape check so a bad file never replaces a good one.
for (const acc of ['UK', 'USA']) {
  const a = data.accounts && data.accounts[acc];
  if (!a || !Array.isArray(a.periods) || a.periods.length !== 6) { console.error('Bad data for ' + acc); process.exit(1); }
}
if (!data.updated_at || isNaN(new Date(data.updated_at))) { console.error('Missing updated_at'); process.exit(1); }

const iter = 250000;
const salt = randomBytes(16);
const iv = randomBytes(12);
const key = pbkdf2Sync(pw, salt, iter, 32, 'sha256');
const c = createCipheriv('aes-256-gcm', key, iv);
const ct = Buffer.concat([c.update(JSON.stringify(data), 'utf8'), c.final(), c.getAuthTag()]);
writeFileSync('data.enc.json', JSON.stringify({ v: 1, iter, salt: salt.toString('base64'), iv: iv.toString('base64'), ct: ct.toString('base64') }));
console.log('Wrote data.enc.json for ' + data.updated_at);
