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
const params=[w,c,null,'Setup',30000,'2026-10-11T12:00:00Z','cash',null,u,r]
const sql='select record_customer_payment($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)'
await db.query(sql,params);await db.query(sql,params)
assert.equal((await db.query('select count(*)::int n from payment_receipts')).rows[0].n,1)
assert.equal((await db.query('select count(*)::int n from financial_obligations')).rows[0].n,1)
await assert.rejects(db.query(sql,params.map((v,i)=>i===4?40000:v)))
await assert.rejects(db.query(sql,params.map((v,i)=>i===1?u:i===9?c:v)))
await assert.rejects(db.query(sql,params.map((v,i)=>i===6?'invalid':i===9?c:v)))
assert.equal((await db.query('select count(*)::int n from financial_obligations')).rows[0].n,1)
await db.exec('reset role;set role authenticated')
await assert.rejects(db.query(sql,params))
console.log('PASS: atomic customer receipt, retry deduplication, mismatched retry rejection, client validation, rollback on receipt failure, restricted RPC.')
await db.close()
