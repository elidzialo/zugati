// Usage: HOME_PASSWORD=... node seal.mjs in.json out.enc.json
// Encrypts a JSON file for the Eli HQ page (AES-256-GCM, PBKDF2-SHA256, same scheme as the hubs).
// The plain file must never be committed.
import { readFileSync, writeFileSync } from 'node:fs';
import { randomBytes, pbkdf2Sync, createCipheriv } from 'node:crypto';
const pw = process.env.HOME_PASSWORD;
if (!pw) { console.error('Set HOME_PASSWORD'); process.exit(1); }
const [src, out] = process.argv.slice(2);
if (!src || !out) { console.error('Usage: node seal.mjs in.json out.enc.json'); process.exit(1); }
const txt = JSON.stringify(JSON.parse(readFileSync(src, 'utf8')));
const iter = 250000, salt = randomBytes(16), iv = randomBytes(12);
const key = pbkdf2Sync(pw, salt, iter, 32, 'sha256');
const c = createCipheriv('aes-256-gcm', key, iv);
const ct = Buffer.concat([c.update(txt, 'utf8'), c.final(), c.getAuthTag()]);
writeFileSync(out, JSON.stringify({ v: 1, iter, salt: salt.toString('base64'), iv: iv.toString('base64'), ct: ct.toString('base64') }));
console.log('Wrote ' + out);
