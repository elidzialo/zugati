// Usage: ZUGATI_PASSWORD=... node decrypt.mjs data.enc.json > data.json
import { readFileSync } from 'node:fs';
import { pbkdf2Sync, createDecipheriv } from 'node:crypto';
const pw = process.env.ZUGATI_PASSWORD;
if (!pw) { console.error('Set ZUGATI_PASSWORD'); process.exit(1); }
const e = JSON.parse(readFileSync(process.argv[2] || 'data.enc.json', 'utf8'));
const b = (s) => Buffer.from(s, 'base64');
const key = pbkdf2Sync(pw, b(e.salt), e.iter, 32, 'sha256');
const ct = b(e.ct), tag = ct.subarray(ct.length - 16), body = ct.subarray(0, ct.length - 16);
const d = createDecipheriv('aes-256-gcm', key, b(e.iv)); d.setAuthTag(tag);
process.stdout.write(Buffer.concat([d.update(body), d.final()]).toString('utf8'));
