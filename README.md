# Zugati Portal

Password-protected dashboard for the Zugati UK (GBP) and Zugati USA (USD) Amazon accounts, hosted on GitHub Pages.

- `index.html` - the page. It asks for the password and decrypts `data.enc.json` in the browser.
- `data.enc.json` - the data, encrypted with AES-256-GCM (key from PBKDF2-SHA256). Safe to be public.
- `encrypt.mjs` - turns a plain `data.json` into `data.enc.json`: `ZUGATI_PASSWORD=... node encrypt.mjs data.json`
- `data.json` is never committed (`.gitignore`).

## data.json shape

```
{ "updated_at": ISO time,
  "accounts": { "UK": {currency:"GBP", periods:[6], products:[...]}, "USA": {currency:"USD", ...} } }
```

Periods in this order: today, yesterday, 7d, mtd, 30d, lastmonth. Each has: key, label, sales, orders, units, refunds, net_profit, margin, roi, amazon_fees, product_costs, advertising (positive), vat, est_payout, sales_ppc, sessions, conversion, acos, sales_change, profit_change.

Products (top 15 by sales, last 30 days): rank, name, asin, sku, marketplace, units, sales, net_profit, margin, roi, refunds, advertising.

Data comes from Sellerboard (`dashboard_period` with compare windows, `dashboard_table` for products). Refreshed hourly by a scheduled Claude task.

## v2 data shape (all inside the encrypted file)
Besides `updated_at` and `accounts`, data.json now holds:
- `lead_days` (45), `season` {valentines, christmas}
- `products[]`: id, name, img (Amazon image id), asin, sku, market, account (UK|USA), cur, stock, inbound, on_order, per_day, units30, sales30, profit30, margin, lost_sales, val_units (15 Jan-14 Feb last year), xmas_units (Dec last year), supplier, valentine (bool), note, optional `monthly` {months[], units[], profit[]}
- `tasks[]`: id, level (urgent|high|normal), title, who, detail, due, link, link_label, email
- `payments[]`: id, to, what, amount, cur, amount_note, status (unpaid|overdue|check|planned|later|forecast|paid), due, why, link, email, drafts? ([{label, note?, url}] - A1: shown as big choice buttons on the "Must do today" card, first = go-ahead, second = hold), must? (true = pin to the red "Must do today" card whatever the due date, while unpaid), pay_label? (text on the big orange pay button there; if the bank has less than the payment it shows as a 'wait' button with today's balance)
- `cfo.leaks[]`: {date, in, out, note} - A1: Money page "Where the money went this week" card (green in, red out, one sentence on top). Keep to the last ~7 days.
- `history`: UK account monthly months/sales/profit/units/payout (24 months)
- `team`: agent notes and the daily update shown to Eli

Agents never drop fields they don't own: decrypt with `node decrypt.mjs`, change only their part, re-encrypt with `node encrypt.mjs data.json`, `git pull --rebase`, push.
- `cfo`: cash plan - as_of, company, cash[] {name,gbp}, other_cash[], overheads_month, overheads_top[[name,£/m]], amazon_profit_month, debts[[name,£]], floor, usd_gbp, seasons[], plan[] {t,d}, note. Source: QuickBooks AS Wholesalebuy Ltd (realm 9341455090563764, the Amazon company) and Zugati Ltd (9341457518181518). Payments may carry `gbp` for the cash forecast.
- products[].years: [{y, s (sales £), u (units)}] for Sep-Dec 2023, 2024, 2025, 2026 so far (UK/EU account, all marketplaces summed)
- suppliers: {name: {email, pay}} used by the order basket
- team.rules: things Eli told the team (e.g. ignore Threecolts). Every agent must obey them.
- links.main_chat: link to Eli's main Zugati chat
- Feedback: the portal's "Done / Paid / Not relevant" buttons hide items in Eli's browser; "Tell team" emails eli@zelr.co.uk with subject "Zugati portal feedback - ...". Agent 3 reads these daily and turns them into team.rules / removes items.
- `shipping`: production_days, checkin_days, usd_gbp, methods {air,truck,sea: label, icon, days, only?}, typical {air,truck,sea $/unit}, factory_closed[{from,to,why}], lessons[] - used by the checkout planner.
- products[].buy: {unit_usd, air_usd, truck_usd, sea_usd, est?, src} - what Eli paid per unit (from PIs and freight emails). `est` = copied from a similar product.
- Browser-only (localStorage): zbasket (qty), zship (chosen method per product), zsup (supplier override), zorderway (did sending work).
- team.questions: {time, text} - Agent 2's design questions for Eli (Mon/Thu); Agent 3 puts them in the morning message and records answers in team.feedback.
- `valentine_orders[]` (A1): one row per Valentine order for the Seasons timeline - id, product, qty, supplier, ordered, deposit (payment id) or deposit_paid (date), balance (payment id), ready, ready_est?, ship (air|truck|sea), at_amazon? (override), account? (override), label?, note. "At Amazon" = ready (or today if already made) + shipping.methods[ship].days + shipping.checkin_days; green 7+ days before season.valentines.peak_from, amber within 7 days, red after. Deposit status comes live from payments[].
  - Optional shipment fields (A1 25 Nov, used by the "On the way to Amazon" card on Today): `shipped` (YYYY-MM-DD it left the factory), `tracking` (tracking number, or a URL to make it a "Track it" link; missing = orange "Tracking: waiting"), `tracking_url` (A1 26 Nov: https link to the courier page; shows a green "Track on UPS/DHL/..." pill, carrier taken from the first word of `tracking`), `lands` (YYYY-MM-DD at Amazon; default shipped + shipping.methods[ship].days). An order that is already made (ready in the past or no ready date) with an unpaid payment whose `what` mentions air/ship/freight/truck plus the order's qty and product shows as "Waiting: pay ...". Products with inbound > 0 and "tracking" in the note (e.g. "waiting on Esther's tracking") show as "Tracking: waiting for Esther".
- `clearout` (A1): Black Friday clear-out card on Products - {date, label, items[] {id, ids[] (product ids, stock is summed), title, deal (one plain suggestion), keep (what Eli keeps per sale), cost_usd (landed cost per unit, used for 'cash tied up'), est? (cost is a guess)}}. Read-only ideas, nothing changes on Amazon. Stock and speed come live from products[].
- `payouts` (Coming in card on the Money page, nav "Coming in"): {as_of, source, rule {cutoff "14:00", before 3, after 4, land_time "04:15", hits, of, holidays[]}, on_way[] {amount, cur, requested ISO, expected? ISO} (Amazon "Your payment is on the way" emails not yet landed in Wise), eu_gbp {next ISO, every_days 14, typical, note}, eu_eur {next ISO, typical, note, eur_gbp}, landed[] {amount, cur GBP|EUR, src UK|EU, landed ISO, requested?, wdays?, on_time?} newest first, max 40}. Learnt 22 Nov 2026 from 19 exact pairs: UK payouts requested before 14:00 London land 3 UK working days later at ~04:15 in Wise GBP, after 14:00 they take 4. Europe £ comes automatically every other Monday ~05:30; Europe € has no email and lands ~10am-3pm in Wise EUR.
- `payouts.enc.json` (written by the "Zugati - money coming in" scheduled task): the same `payouts` shape, locked with the public key `payouts-pub.pem` via `node seal-payouts.mjs /tmp/payouts.json` (no password needed). The page opens it with `keys.payouts` inside data.enc.json and uses it when it is newer than `payouts` in data. Agents must keep `keys` untouched.

### fivek (A1, '£5,000 tracker' on Today)
`fivek = {from: "YYYY-MM-DD", amount: 5000, in_id: "in5k", note, unlocks: [{id: <payments id>, label, gbp, icon}]}` - day counter from `from`; turns green when the `in_id` payment is `paid` (or tapped Paid); each unlock ticks off when its payment is `paid`. Remove the key to hide the card. `clearout.items[].plain` (optional) overrides the one-line plain message on the Black Friday card.
