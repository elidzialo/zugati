// Usage: node seal-payouts.mjs /tmp/payouts.json   (writes payouts.enc.json next to this script)
// Locks the Coming-in (payouts) data with the PUBLIC key in payouts-pub.pem (RSA-OAEP-256 + AES-256-GCM).
// No password needed to write it; only the Zugati portal login (its data holds the private key) can read it.
import { readFileSync, writeFileSync } from 'node:fs';
import { randomBytes, createCipheriv, publicEncrypt, constants } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const here = dirname(fileURLToPath(import.meta.url));
const src = process.argv[2];
if (!src) { console.error('Usage: node seal-payouts.mjs /tmp/payouts.json'); process.exit(1); }
const data = JSON.parse(readFileSync(src, 'utf8'));
if (!Array.isArray(data.landed) || !data.as_of || !data.rule) { console.error('Bad payouts data'); process.exit(1); }
const pub = readFileSync(join(here, 'payouts-pub.pem'), 'utf8');
const k = randomBytes(32), iv = randomBytes(12);
const c = createCipheriv('aes-256-gcm', k, iv);
const ct = Buffer.concat([c.update(JSON.stringify(data), 'utf8'), c.final(), c.getAuthTag()]);
const ek = publicEncrypt({ key: pub, padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' }, k);
writeFileSync(join(here, 'payouts.enc.json'), JSON.stringify({ v: 2, ek: ek.toString('base64'), iv: iv.toString('base64'), ct: ct.toString('base64') }));
console.log('Wrote payouts.enc.json (' + data.landed.length + ' landed)');
