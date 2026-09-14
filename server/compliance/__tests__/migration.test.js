import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'
import { describe, expect, it } from 'vitest'

const migration = readFileSync(resolve(process.cwd(), 'supabase/migrations/20260914022216_compliance_verified_obligation_foundation.sql'), 'utf8')

describe('Compliance database boundary', () => {
  it('requires owner verification for applicable truth and preserves append-only completion history', () => {
    expect(migration).toMatch(/create table public\.compliance_requirements/)
    expect(migration).toMatch(/applicability_status in \('needs_verification', 'applies', 'not_applicable'\)/)
    expect(migration).toMatch(/applicability_status = 'needs_verification'\s+or \(verified_by_owner_at is not null and verified_by_owner_id is not null\)/)
    expect(migration).toMatch(/create table public\.compliance_completions/)
    expect(migration).toMatch(/foreign key \(compliance_requirement_id, workspace_id\)/)
    expect(migration).toMatch(/record_compliance_completion/)
    expect(migration).toMatch(/for update/)
    expect(migration).toMatch(/The owner must confirm the next due date for a recurring requirement/)
    expect(migration).not.toMatch(/create table public\.tasks/)
  })

  it('enables RLS, gives browser roles read-only access, and reserves writes for server credentials', () => {
    expect(migration).toMatch(/alter table public\.compliance_requirements enable row level security/)
    expect(migration).toMatch(/alter table public\.compliance_completions enable row level security/)
    expect(migration).toMatch(/workspace_members_can_read_compliance_requirements/)
    expect(migration).toMatch(/revoke all on public\.compliance_requirements from public, anon, authenticated, service_role/)
    expect(migration).toMatch(/grant select on public\.compliance_requirements to authenticated/)
    expect(migration).not.toMatch(/grant .*insert.* on public\.compliance_requirements to authenticated/)
    expect(migration).not.toMatch(/grant .*update.* on public\.compliance_completions to service_role/)
  })
})
