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

## Logins (added 21 Nov)
- `data.enc.json` is encrypted with its own data key (not Eli's password). The refresh task has the key.
- `keys.json` holds that data key locked with Eli's password, so Eli's password still opens the page. Rebuild it with `SESA_PASSWORD=<Eli's password> SESA_KEY=<data key> node wrapkey.mjs` only if either changes.
- Partners (e.g. Samuel Reich, Eli Sinitsky) tap "Partner? Log in with your email" and use their Eli Hub login (Supabase project eli-hub). The page reads the data key from the `portal_keys` table, which only users with Sesa access can read. They only ever get the Sesa page.
- Never commit the data key or a plain data file.

## Rules from Eli (22 Nov)
- The Pozitive Energy / Foxglove Energy Supply Direct Debit (£377.55) is NOT for the Castleford HMO. Do not add it to the Castleford HMO (units, tasks, event, watch, top3 or money).
- Tasks can be deleted on the page (Delete button on an open task). Keep task ids stable - a deleted id stays hidden even if the refresh keeps it.

## Shared state (22 Nov)
- When signed in with email (Eli Hub / Supabase project eli-hub), Done ticks, assignments and deletes are saved for everyone in table `public.hub_state` (business_id 'sesa', item_id = task id or top3 hash). RLS: admins and partners with Sesa membership can read and write; staff cannot.
- The page pulls it on load, every 30 seconds and when the tab comes back into view.
- Password-only logins have no account, so they keep the old on-this-device behaviour (localStorage `sesaDone`, `sesaOwners`, `sesaDel`).
- Refresh task: tasks with `deleted = true` in hub_state were deleted by a partner - drop them from data.json instead of re-adding them.

## Added tasks, edits and notes (22 Nov)
- Email-logged-in users can add tasks (+ Add task under Jobs), edit any task (title, details, urgency) and post notes on a task. All saved for everyone.
- New tasks: `hub_state` rows with `custom = true` (item_id starts with `u`, `prop` = property id). Edits to refresh-made tasks: `edited = true` with the new `title` / `detail` / `level` - the page shows these over data.json.
- Notes: table `public.hub_notes` (business_id, item_id, body, author_name, author_email, created_at). Same access rules; people can delete their own notes.
- Refresh task: read hub_notes for progress on tasks (e.g. "paid", "booked") and respect edited titles; never delete custom tasks.
