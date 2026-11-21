// Usage: SESA_PASSWORD=<login password> SESA_KEY=<data key> node wrapkey.mjs
// Writes keys.json: the data key, encrypted with a login password, so the old
// password still opens the hub while data.enc.json uses its own key.
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { randomBytes, pbkdf2Sync, createCipheriv } from 'node:crypto';
const pw = process.env.SESA_PASSWORD, k = process.env.SESA_KEY;
if (!pw || !k) { console.error('Set SESA_PASSWORD and SESA_KEY'); process.exit(1); }
const iter = 250000, salt = randomBytes(16), iv = randomBytes(12);
const key = pbkdf2Sync(pw, salt, iter, 32, 'sha256');
const c = createCipheriv('aes-256-gcm', key, iv);
const ct = Buffer.concat([c.update(k, 'utf8'), c.final(), c.getAuthTag()]);
const out = existsSync('keys.json') ? JSON.parse(readFileSync('keys.json', 'utf8')) : { v: 1, wraps: [] };
out.wraps = [{ iter, salt: salt.toString('base64'), iv: iv.toString('base64'), ct: ct.toString('base64') }];
writeFileSync('keys.json', JSON.stringify(out));
console.log('Wrote keys.json');
