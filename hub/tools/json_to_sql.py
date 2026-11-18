#!/usr/bin/env python3
"""Turn a hub data.json (Zalo / Sesa / Zugati shape) into idempotent SQL for the Eli Hub Supabase database.
Usage: python3 json_to_sql.py <business_id zalo|sesa|zugati> <data.json>  > out.sql
Keeps people's ticks, owners and comments: tasks are upserted by (business_id, ext_key) and only text fields change.
Auto tasks that disappear from the data are closed (status done) if still open."""
import json, sys, re

def q(v):
    if v is None: return 'null'
    if isinstance(v, bool): return 'true' if v else 'false'
    if isinstance(v, (int, float)): return repr(v)
    return "'" + str(v).replace("'", "''") + "'"

def arr(xs): return 'array[' + ','.join(q(x) for x in xs) + ']::text[]' if xs else "'{}'::text[]"
def js(v): return q(json.dumps(v, ensure_ascii=False)) + '::jsonb'
def date(v):
    if not v: return 'null'
    m = re.match(r'\d{4}-\d{2}-\d{2}', str(v)); return q(m.group(0)) + '::date' if m else 'null'

biz, path = sys.argv[1], sys.argv[2]
d = json.load(open(path))
out = ['begin;']
keys = []
if biz in ('zalo', 'sesa'):
    for i, p in enumerate(d.get('properties', [])):
        pid = f"{biz}:{p['id']}"
        out.append(f"insert into public.properties (id,business_id,name,area,status,next_event,sort,archived,updated_at) values ({q(pid)},{q(biz)},{q(p.get('name'))},{q(p.get('area'))},{q(p.get('status'))},{q(p.get('event'))},{i},false,now()) on conflict (id) do update set name=excluded.name,area=excluded.area,status=excluded.status,next_event=excluded.next_event,sort=excluded.sort,archived=false,updated_at=now();")
        out.append(f"delete from public.units where property_id={q(pid)};")
        for j, u in enumerate(p.get('units', [])):
            tag = u.get('tag') if u.get('tag') in ('ok', 'warn', 'bad') else 'ok'
            out.append(f"insert into public.units (property_id,name,person,tag,label,note,sort) values ({q(pid)},{q(u.get('name'))},{q(u.get('tenant'))},{q(tag)},{q(u.get('label'))},{q(u.get('note'))},{j});")
        for j, t in enumerate(p.get('tasks', [])):
            keys.append(t['id'])
            lvl = t.get('level') if t.get('level') in ('urgent', 'high', 'normal') else 'normal'
            out.append(f"insert into public.tasks (business_id,property_id,ext_key,title,detail,level,due,source,sort) values ({q(biz)},{q(pid)},{q(t['id'])},{q(t.get('title'))},{q(t.get('detail'))},{q(lvl)},{date(t.get('due'))},'auto',{j}) on conflict (business_id,ext_key) do update set property_id=excluded.property_id,title=excluded.title,detail=excluded.detail,level=excluded.level,due=excluded.due,sort=excluded.sort;")
    pids = [f"{biz}:{p['id']}" for p in d.get('properties', [])]
    if pids:
        out.append(f"update public.properties set archived=true where business_id={q(biz)} and id not in ({','.join(q(x) for x in pids)}) and id like {q(biz + ':%')};")
    m = d.get('money')
    if m:
        out.append(f"delete from public.money_months where business_id={q(biz)};")
        for i, x in enumerate(m.get('months', [])):
            out.append(f"insert into public.money_months values ({q(biz)},{q(x.get('m'))},{i},{q(x.get('rent') or 0)},{q(x.get('costs') or 0)},{q(bool(x.get('partial')))});")
        out.append(f"delete from public.payments where business_id={q(biz)};")
        names = {p['id']: p.get('name', '') for p in d.get('properties', [])}
        for x in m.get('payments', []):
            prop = None
            target = str(x.get('property', '')).lower()
            for pid, nm in names.items():
                words = [w for w in re.findall(r'[a-z]+', (nm + ' ' + pid).lower()) if len(w) >= 5 and w not in ('flats', 'street', 'road', 'avenue', 'south', 'north')]
                if any(w in target for w in words):
                    prop = f"{biz}:{pid}"; break
            kind = 'airbnb' if 'airbnb' in str(x.get('from', '')).lower() else 'rent'
            out.append(f"insert into public.payments (business_id,property_id,date,amount,from_who,kind,note) values ({q(biz)},{q(prop)},{date(x.get('date'))},{q(x.get('amount'))},{q(x.get('from'))},{q(kind)},{q(x.get('property'))});")
    out.append(f"insert into public.summary (business_id,headline,top3,watch,bank_balance,rent_total,costs_total,costs_top,expected,money_note,money_as_of,updated_at) values ({q(biz)},{q(d.get('headline'))},{arr(d.get('top3', []))},{arr(d.get('watch', []))},{q((m or {}).get('bank_balance'))},{q((m or {}).get('rent_total'))},{q((m or {}).get('costs_total'))},{js((m or {}).get('costs_top', []))},{js((m or {}).get('expected', []))},{q((m or {}).get('note'))},{date((m or {}).get('as_of'))},{q(d.get('updated_at'))}::timestamptz) on conflict (business_id) do update set headline=excluded.headline,top3=excluded.top3,watch=excluded.watch,bank_balance=excluded.bank_balance,rent_total=excluded.rent_total,costs_total=excluded.costs_total,costs_top=excluded.costs_top,expected=excluded.expected,money_note=excluded.money_note,money_as_of=excluded.money_as_of,updated_at=excluded.updated_at;")
elif biz == 'zugati':
    for j, t in enumerate(d.get('tasks', [])):
        keys.append(t['id'])
        lvl = t.get('level') if t.get('level') in ('urgent', 'high', 'normal') else 'normal'
        det = (t.get('detail') or '') + (f" ({t['who']})" if t.get('who') else '') + (f"\n{t.get('link_label') or 'Link'}: {t['link']}" if t.get('link') else '')
        out.append(f"insert into public.tasks (business_id,ext_key,title,detail,level,due,source,sort) values ('zugati',{q(t['id'])},{q(t.get('title'))},{q(det)},{q(lvl)},{date(t.get('due'))},'auto',{j}) on conflict (business_id,ext_key) do update set title=excluded.title,detail=excluded.detail,level=excluded.level,due=excluded.due,sort=excluded.sort;")
    upd = (d.get('team') or {}).get('update') or {}
    lines = [l.strip() for l in str(upd.get('text', '')).split('\n') if l.strip()]
    pays = [p for p in d.get('payments', []) if p.get('status') in ('unpaid', 'overdue', 'check')]
    watch = [f"{p.get('to')}: {p.get('what')}" + (f" - {p.get('cur', '')} {p.get('amount')}" if p.get('amount') is not None else '') + f" ({p.get('status')}{', due ' + str(p.get('due')) if p.get('due') else ''})" for p in pays][:8]
    cash = sum(float(c.get('gbp') or 0) for c in (d.get('cfo') or {}).get('cash', []))
    out.append(f"insert into public.summary (business_id,headline,top3,watch,bank_balance,extra,updated_at) values ('zugati',{q(lines[0] if lines else 'Zugati')},{arr(lines[1:4])},{arr(watch)},{q(round(cash, 2))},{js({'link': 'https://elidzialo.github.io/zugati/'})},{q(d.get('updated_at'))}::timestamptz) on conflict (business_id) do update set headline=excluded.headline,top3=excluded.top3,watch=excluded.watch,bank_balance=excluded.bank_balance,extra=excluded.extra,updated_at=excluded.updated_at;")
if keys:
    out.append(f"update public.tasks set status='done', done_at=now() where business_id={q(biz)} and source='auto' and status='open' and ext_key not in ({','.join(q(k) for k in keys)});")
out.append('commit;')
print('\n'.join(out))
