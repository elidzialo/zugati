// Usage: ZALO_PASSWORD=... node encrypt.mjs data.json
// Encrypts the plain data file into data.enc.json (AES-256-GCM, key from PBKDF2-SHA256).
import { readFileSync, writeFileSync } from 'node:fs';
import { randomBytes, pbkdf2Sync, createCipheriv } from 'node:crypto';
const pw = process.env.ZALO_PASSWORD;
if (!pw) { console.error('Set ZALO_PASSWORD'); process.exit(1); }
const data = JSON.parse(readFileSync(process.argv[2] || 'data.json', 'utf8'));
if (!data.updated_at || isNaN(new Date(data.updated_at))) { console.error('Missing updated_at'); process.exit(1); }
if (!Array.isArray(data.properties) || !data.properties.length) { console.error('No properties'); process.exit(1); }
const iter = 250000, salt = randomBytes(16), iv = randomBytes(12);
const key = pbkdf2Sync(pw, salt, iter, 32, 'sha256');
const c = createCipheriv('aes-256-gcm', key, iv);
const ct = Buffer.concat([c.update(JSON.stringify(data), 'utf8'), c.final(), c.getAuthTag()]);
writeFileSync('data.enc.json', JSON.stringify({ v: 1, iter, salt: salt.toString('base64'), iv: iv.toString('base64'), ct: ct.toString('base64') }));
console.log('Wrote data.enc.json for ' + data.updated_at);
