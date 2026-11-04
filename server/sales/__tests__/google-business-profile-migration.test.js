import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'
import { describe, expect, it } from 'vitest'

const migration = readFileSync(resolve(process.cwd(), 'supabase/migrations/20261104174536_lead_google_share_reference_constraint.sql'), 'utf8')

describe('Lead Google Business Profile database boundary', () => {
  it('adds the exact Google Share host while retaining the strict URL checks', () => {
    expect(migration).toMatch(/drop constraint leads_google_business_profile_url_check/)
    expect(migration).toMatch(/add constraint leads_google_business_profile_url_check/)
    expect(migration).toMatch(/google_business_profile_url = btrim\(google_business_profile_url\)/)
    expect(migration).toMatch(/char_length\(google_business_profile_url\) between 1 and 2048/)
    expect(migration).toContain("'^https://share\\.google([/?#]|$)'")
  })
})
