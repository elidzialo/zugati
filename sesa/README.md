# Sesa Estates Hub

Password-protected task page for Sesa Estates properties (51 St Andrews Road South, Castleford HMO at 32-34 Lumley Street). Served at `/sesa/` on GitHub Pages.

- `index.html` asks for the password and decrypts `data.enc.json` in the browser.
- `data.json` is never committed. Update flow: `SESA_PASSWORD=... node decrypt.mjs > data.json`, edit, `SESA_PASSWORD=... node encrypt.mjs data.json`, commit `data.enc.json`, `git pull --rebase`, push.
- Refreshed twice a day (08:00 and 17:00 London) by a scheduled Claude task that reads Eli's emails.

## data.json shape
`updated_at`, `headline`, `top3[]`, `watch[]`, `properties[]`: {id, name, area, status, event, units[] {name, tenant, tag ok|warn|bad, label, note}, tasks[] {id, level urgent|high|normal, title, detail}}.
Keep task ids stable so the "Done" ticks (stored in the browser) stick. New tasks get new ids.

## Money (added 17 Nov)
`money`: {as_of, source, bank_balance, rent_total, costs_total, months[] {m, rent, costs, partial?}, payments[] {date, amount, from, property} (rent only, newest first), costs_top[[name, £]], expected[] {property, note}, note}.
Source: QuickBooks SESA ESTATES LTD realm 9341457863772786 (READ-ONLY) - Profit and Loss by month from 1 Sep 2026 (Rental income account), Rental income deposits, Wise bank feed (account 57) for money not yet categorised and the bank balance. Loans from Zalo / Sesa Investments are not income.
The page has tabs: Today, Money, one per property.

## People and nudges (added 17 Nov)
`people[]`: {id, name, email, me?} - who tasks can be assigned to (Eli Dzialo is `me`). Keep this list; add a partner only if Eli asks.
`tasks[].owner`: optional person id. Keep it when a task stays. Picks made on the page override it on that device only (localStorage `sesaOwners`, extra people in `sesaPeople`).
The Nudge button opens Claude (claude.ai/new?q=...) with a one-line prompt to send the nudge email from eli@zelr.co.uk to the owner, cc Eli, subject "Sesa nudge: <task title>". Replies to those threads say whether the task is done - the refresh task reads them.
