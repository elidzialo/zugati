# Eli HQ (/home/)

One login for all of Eli's hubs: https://elidzialo.github.io/zugati/home/

- `index.html` - Eli logs in once (his Sesa/Zalo password). It opens `keys.enc.json`, then fills each hub's own 7-day "remember" slot (zugatiRemember, sesaRemember, zaloRemember) so the Zugati, Sesa and Zalo pages open without asking. Tabs: Hubs (live peek at each hub) and Agents (`#agents`).
- `keys.enc.json` - the hub passwords, encrypted with Eli's HQ password. Never commit them in plain text.
- `agents.enc.json` - the Agents board data, locked with the public key `board-pub.pem` (write it with `node home/seal-board.mjs /tmp/agents.json` - no password needed). The private key sits inside `keys.enc.json`, so only Eli's HQ login can read the board. Written by the "Eli HQ - agents board refresh" scheduled task. Shape: {updated_at, agents[] {id, name, biz (brief|zugati|web|sesa|zalo|plumb|admin), what, when, status (live|oneoff|paused), last, last_ok, next, tells_you?, ends?}}. Never put prompts, passwords or keys in it.
- `seal.mjs` / `open.mjs` - `HOME_PASSWORD=... node seal.mjs in.json out.enc.json` and `node open.mjs file.enc.json`.
- `back.js` - the small round "All hubs" button. It is loaded at the end of `/index.html`, `/sesa/index.html` and `/zalo/index.html` (one `<script src=".../home/back.js">` line - designers: keep that line). It only shows on a device where Eli logged in to HQ, and never for Sesa partners (email login).
- Team map (Agents tab): who-talks-to-who links and short names live in `LINKS` / `SHORT` in index.html, keyed by scheduled task id. New agents still appear (in their business group); add a LINKS line to draw their arrows.
