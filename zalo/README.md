# Zalo Estates Hub

Password-protected task page for Zalo Estates Limited properties. Served at `/zalo/` on GitHub Pages. Same design and data shape as `/sesa/` (the Sesa Estates Hub), but its own password, data and browser storage keys (`zaloPw`, `zaloDone`, `zaloLog`, `zaloOwners`, `zaloPeople`) so the two hubs never mix.

- `index.html` asks for the password and decrypts `data.enc.json` in the browser.
- `data.json` is never committed. Update flow: `ZALO_PASSWORD=... node decrypt.mjs > data.json`, edit, `ZALO_PASSWORD=... node encrypt.mjs data.json`, commit `data.enc.json`, `git pull --rebase`, push.
- Refreshed through the day by a scheduled Claude task that reads Eli's emails and Zalo's QuickBooks (read-only).

## data.json shape
`updated_at`, `headline`, `top3[]`, `watch[]`, `properties[]`: {id, name, area, status, event, units[] {name, tenant, tag ok|warn|bad, label, note}, tasks[] {id, level urgent|high|normal, title, detail, owner?}}.
Keep task ids stable so the "Done" ticks (stored in the browser) stick. New tasks get new ids.

## Money
`money`: {as_of, source, bank_balance, rent_total, costs_total, months[] {m, rent, costs, partial?}, payments[] {date, amount, from, property} (rent and Airbnb payouts, newest first), costs_top[[name, £]], expected[] {property, note}, note}.
Source: QuickBooks ZALO ESTATES LIMITED realm 9341457517873751 (READ-ONLY), from 1 Sep 2026. Loans between Eli's companies (Sesa Estates, Sesa Investments, Zugati, AS Wholesalebuy) and director top-ups are not income.
`payments[].property` should contain the property's short name (e.g. "Hawksmoor", "Delaval") so the page can total rent per property.

## People
`people[]`: {id, name, email, me?}. Eli Dzialo only for now (`me`); add others only if Eli asks.
