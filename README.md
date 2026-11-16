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
- `payments[]`: id, to, what, amount, cur, amount_note, status (unpaid|overdue|check|planned|later|forecast|paid), due, why, link, email
- `history`: UK account monthly months/sales/profit/units/payout (24 months)
- `team`: agent notes and the daily update shown to Eli

Agents never drop fields they don't own: decrypt with `node decrypt.mjs`, change only their part, re-encrypt with `node encrypt.mjs data.json`, `git pull --rebase`, push.
