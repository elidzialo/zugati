# Sesa Estates Hub

Password-protected task page for Sesa Estates properties (51 St Andrews Road South, Castleford HMO at 32-34 Lumley Street). Served at `/sesa/` on GitHub Pages.

- `index.html` asks for the password and decrypts `data.enc.json` in the browser.
- `data.json` is never committed. Update flow: `SESA_PASSWORD=... node decrypt.mjs > data.json`, edit, `SESA_PASSWORD=... node encrypt.mjs data.json`, commit `data.enc.json`, `git pull --rebase`, push.
- Refreshed twice a day (08:00 and 17:00 London) by a scheduled Claude task that reads Eli's emails.

## data.json shape
`updated_at`, `headline`, `top3[]`, `watch[]`, `properties[]`: {id, name, area, status, event, units[] {name, tenant, tag ok|warn|bad, label, note}, tasks[] {id, level urgent|high|normal, title, detail}}.
Keep task ids stable so the "Done" ticks (stored in the browser) stick. New tasks get new ids.
