import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'
import { describe, expect, it } from 'vitest'

const migration = readFileSync(resolve(process.cwd(), 'supabase/migrations/20260913195836_accounting_financial_state_foundation.sql'), 'utf8')

describe('Accounting database boundary', () => {
  it('uses workspace-scoped foreign keys, integer cents, RLS, and append-only receipts', () => {
    expect(migration).toMatch(/amount_cents bigint not null check \(amount_cents > 0/)
    expect(migration).toMatch(/foreign key \(financial_obligation_id, workspace_id\)/)
    expect(migration).toMatch(/foreign key \(operations_project_id, workspace_id\)/)
    expect(migration).toMatch(/alter table public\.financial_obligations enable row level security/)
    expect(migration).toMatch(/revoke all on public\.payment_receipts from public, anon, authenticated, service_role/)
    expect(migration).toMatch(/grant select on public\.payment_receipts to authenticated/)
    expect(migration).not.toMatch(/grant .*insert.* on public\.payment_receipts to authenticated/)
    expect(migration).toMatch(/payment_receipts_prevent_overpayment/)
    expect(migration).toMatch(/for update/)
  })
})
