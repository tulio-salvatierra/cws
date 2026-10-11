// Run with: node scripts/verify-business-expenses.mjs /absolute/path/to/pglite/dist/index.js
// Uses an ephemeral database; never connects to a hosted project.
import { pathToFileURL } from 'node:url'
import process from 'node:process'
const { PGlite } = await import(process.argv[2] ? pathToFileURL(process.argv[2]).href : '@electric-sql/pglite')
import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
const db = new PGlite()
await db.exec(`
create role anon; create role authenticated; create role service_role bypassrls;
create schema auth; create schema private;
create table auth.users(id uuid primary key);
create table public.workspaces(id uuid primary key);
create table public.workspace_members(workspace_id uuid, user_id uuid, role text, status text);
create function private.is_workspace_member(uuid) returns boolean language sql as $$ select $1::text = current_setting('test.workspace', true) $$;
grant usage on schema private to authenticated;
create table public.operations_projects(id uuid primary key, workspace_id uuid);
create table public.project_costs(id uuid primary key default gen_random_uuid(), workspace_id uuid, operations_project_id uuid references public.operations_projects(id), description text, amount_cents bigint, currency text, incurred_on date, recovery text, created_by uuid);
grant select, insert on public.project_costs to service_role;
grant select on public.workspace_members, public.operations_projects to service_role;
`)
await db.exec(readFileSync(new URL('../supabase/migrations/20261011185931_business_expenses.sql', import.meta.url), 'utf8'))
const w = '11111111-1111-4111-8111-111111111111', w2 = '22222222-2222-4222-8222-222222222222', u = '33333333-3333-4333-8333-333333333333', p = '44444444-4444-4444-8444-444444444444'
await db.exec(`insert into auth.users values ('${u}'); insert into workspaces values ('${w}'),('${w2}'); insert into workspace_members values ('${w}','${u}','owner','active'); insert into operations_projects values ('${p}','${w}');`)
const [{ id }] = (await db.query(`insert into expense_subscriptions(workspace_id,name,category,amount_cents,cadence,billing_anchor,operations_project_id,created_by) values($1,'API','Software',2000,'monthly','2026-01-31',$2,$3) returning id`, [w,p,u])).rows
await db.exec('set role service_role')
await db.query('select pay_business_expense($1,$2,$3,$4,$5,$6,$7)',[w,id,'subscription',0,2349,'2026-02-01',u])
assert.equal((await db.query('select next_cycle from expense_subscriptions')).rows[0].next_cycle,1)
assert.equal((await db.query('select count(*)::int as n from project_costs')).rows[0].n,1)
assert.equal((await db.query('select amount_cents::int as n from business_expenses')).rows[0].n,2349)
await assert.rejects(db.query('select pay_business_expense($1,$2,$3,$4,$5,$6,$7)',[w,id,'subscription',0,2349,'2026-02-01',u]))
await assert.rejects(db.query('select pay_business_expense($1,$2,$3,$4,$5,$6,$7)',[w2,id,'subscription',1,2349,'2026-02-01',u]))
assert.equal((await db.query("select expense_billing_date('2026-01-31','monthly',2)::text as d")).rows[0].d,'2026-03-31')
await db.query("update expense_subscriptions set status='paused' where id=$1",[id])
await assert.rejects(db.query('select pay_business_expense($1,$2,$3,$4,$5,$6,$7)',[w,id,'subscription',1,2349,'2026-02-01',u]))
await db.query("update expense_subscriptions set status='active' where id=$1",[id])
assert.ok((await db.query('select next_cycle from expense_subscriptions')).rows[0].next_cycle > 1)
await assert.rejects(db.query("insert into expense_subscriptions(workspace_id,name,category,amount_cents,cadence,billing_anchor,operations_project_id,created_by) values($1,'Wrong','Software',2000,'monthly','2026-01-31',$2,$3)",[w2,p,u]))
const once = (await db.query("insert into business_expenses(workspace_id,name,category,amount_cents,due_on,created_by) values($1,'Equipment','Other',5000,'2026-02-01',$2) returning id",[w,u])).rows[0].id
await db.query('select pay_business_expense($1,$2,$3,$4,$5,$6,$7)',[w,once,'expense',null,5000,'2026-02-01',u])
await assert.rejects(db.query('select pay_business_expense($1,$2,$3,$4,$5,$6,$7)',[w,once,'expense',null,5000,'2026-02-01',u]))
await db.exec('reset role; set role authenticated')
await db.query("select set_config('test.workspace',$1,false)",[w2])
assert.equal((await db.query('select * from business_expenses')).rows.length,0)
await db.query("select set_config('test.workspace',$1,false)",[w])
assert.equal((await db.query('select * from business_expenses')).rows.length,2)
await assert.rejects(db.query("update expense_subscriptions set status='canceled'"))
await assert.rejects(db.query('select pay_business_expense($1,$2,$3,$4,$5,$6,$7)',[w,id,'subscription',1,2349,'2026-02-01',u]))
await db.exec('reset role; set role anon')
await assert.rejects(db.query('select * from business_expenses'))
console.log('PASS: migration, actual payments, duplicate protection, workspace isolation, project linking, annual/month-end schedule, pause/resume, one-time payments, browser write/RPC restrictions.')
await db.close()
