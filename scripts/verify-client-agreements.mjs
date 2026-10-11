import { pathToFileURL } from 'node:url'
import process from 'node:process'
const { PGlite } = await import(process.argv[2] ? pathToFileURL(process.argv[2]).href : '@electric-sql/pglite')
import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
const db = new PGlite()
await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
create schema auth; create schema private; create schema extensions;
create function extensions.uuid_generate_v4() returns uuid language sql as $$ select gen_random_uuid() $$;
create table auth.users(id uuid primary key); create table workspaces(id uuid primary key);
create table workspace_members(workspace_id uuid,user_id uuid,role text,status text);
create table clients(id uuid primary key,workspace_id uuid,status text,unique(id,workspace_id));
create table operations_projects(id uuid primary key, workspace_id uuid,client_id uuid,unique(id,workspace_id));
create function private.is_workspace_member(uuid) returns boolean language sql as $$ select true $$;
create function public.update_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
grant usage on schema extensions to service_role; grant select on workspace_members,clients,operations_projects to service_role;`)
await db.exec(readFileSync(new URL('../supabase/migrations/20260913195836_accounting_financial_state_foundation.sql', import.meta.url),'utf8'))
await db.exec(readFileSync(new URL('../supabase/migrations/20261011192034_customer_payment_intake.sql', import.meta.url),'utf8'))
const w='11111111-1111-4111-8111-111111111111',u='22222222-2222-4222-8222-222222222222',c='33333333-3333-4333-8333-333333333333',r='44444444-4444-4444-8444-444444444444'
await db.exec(`insert into auth.users values('${u}');insert into workspaces values('${w}');insert into workspace_members values('${w}','${u}','owner','active');insert into clients values('${c}','${w}','active');set role service_role;`)

await db.exec('reset role')
await db.exec(`create table offers(id uuid primary key,workspace_id uuid);grant select on offers to service_role;`)
await db.exec(readFileSync(new URL('../supabase/migrations/20261011214948_client_service_agreements.sql', import.meta.url),'utf8'))
await db.exec('set role service_role')
const receiptSql='select record_customer_payment($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)'
await db.query(receiptSql,[w,c,null,'Setup',30000,'2026-10-11T12:00:00Z','cash',null,u,r])
const setup=(await db.query('select id from financial_obligations')).rows[0].id
const id='55555555-5555-4555-8555-555555555555'
const create='select create_client_service_agreement($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)'
const args=[w,u,id,c,null,'Website',30000,15000,12,setup]
await db.query(create,args);await db.query(create,args)
assert.equal((await db.query('select count(*)::int n from financial_obligations')).rows[0].n,1)
await assert.rejects(db.query(create,args.map((v,i)=>i===7?16000:v)))
await assert.rejects(db.query(create,args.map((v,i)=>i===2?r:i===3?u:v)))
await assert.rejects(db.query(create,args.map((v,i)=>i===2?r:v))) // cannot link same setup twice
assert.equal((await db.query('select count(*)::int n from client_service_agreements')).rows[0].n,1)
const launch='select launch_client_service_agreement($1,$2,$3,$4)'
await db.query(launch,[w,u,id,'2026-01-31']);await db.query(launch,[w,u,id,'2026-01-31'])
await assert.rejects(db.query(launch,[w,u,id,'2026-02-01']))
const bills=(await db.query('select i.installment,o.id,o.due_date::text,o.amount_cents from agreement_installments i join financial_obligations o on o.id=i.financial_obligation_id order by i.installment')).rows
assert.equal(bills.length,13);assert.equal(bills[2].due_date,'2026-02-28');assert.equal(bills[3].due_date,'2026-03-31')
const pay='select record_agreement_payment($1,$2,$3,$4,$5,$6,$7,$8)'
const pid='66666666-6666-4666-8666-666666666666'
const payment=[w,u,bills[1].id,pid,5000,'2026-02-01T12:00:00Z','square',null]
await db.query(pay,payment);await db.query(pay,payment)
assert.equal((await db.query('select count(*)::int n from payment_receipts')).rows[0].n,2)
await assert.rejects(db.query(pay,payment.map((v,i)=>i===3?id:i===4?15000:v)))
await assert.rejects(db.query(pay,payment.map((v,i)=>i===4?6000:v)))
await db.exec('reset role;set role authenticated')
await assert.rejects(db.query(create,args));await assert.rejects(db.query(launch,[w,u,id,'2026-01-31']));await assert.rejects(db.query(pay,payment))
console.log('PASS: setup reuse, create/launch/payment retry safety, cross-client rejection, duplicate setup rollback, 12 calendar installments, partial payment/overpayment defense, restricted RPCs.')
await db.close()
