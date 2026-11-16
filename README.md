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
