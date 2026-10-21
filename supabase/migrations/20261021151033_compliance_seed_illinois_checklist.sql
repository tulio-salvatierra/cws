-- COMPLIANCE-SEED-001: Illinois compliance checklist (research 2026-10-19).
-- Data only. Skips cleanly on databases without the CWS workspace rows.
do $$
declare
  ws  constant uuid := 'a0eb078c-8ea5-44b6-b3cb-a7ba9ca23293';
  usr constant uuid := 'ecf774f5-4565-4701-995c-ebc6b410a3e1';
begin
  if not exists (select 1 from public.compliance_requirements
                 where id = '3238ba32-1774-4e4f-a5d6-3ef66ed4c95d' and applicability_status = 'applies') then
    raise notice 'COMPLIANCE-SEED-001 skipped: owner-verified LLC row not present';
    return;
  end if;

  if exists (select 1 from public.compliance_requirements
             where workspace_id = ws and title = 'Chicago business license and home occupation') then
    raise notice 'COMPLIANCE-SEED-001 skipped: already applied';
    return;
  end if;

  -- 1. Retire the 2026-09-15 test row (fictitious 2065 due date). Retired, not deleted.
  update public.compliance_requirements
  set status = 'retired',
      notes = 'Retired 2026-10-21: test row (fictitious due date). Superseded by the annual report row.'
  where id = '324ac6d9-c041-4173-a890-5177ed96d609';

  -- 2. Convert the owner-verified row into the real obligation. Keeps owner verification.
  update public.compliance_requirements
  set title = 'Illinois LLC annual report',
      category = 'filing',
      description = 'File the LLC annual report with the Illinois SOS before the first day of the anniversary month (December formation = due Nov 30). Ordinary fee $75. $100 penalty if still unfiled 60 days after the due date; later dissolution risk. While filing, confirm registered agent and office are accurate (agent/office changes are a separate $25 filing). Save the accepted filing and payment receipt.',
      source_url = 'https://www.ilsos.gov/departments/business-services/annual-reports/llc-instructions.html',
      recurrence_type = 'annual',
      next_due_date = '2026-11-30',
      notes = 'First check the entity search for current status and whether the 2025 report was filed: https://apps.ilsos.gov/businessentitysearch/'
  where id = '3238ba32-1774-4e4f-a5d6-3ef66ed4c95d';

  -- 3. New rows. All needs_verification: only the owner sets applicability (DB constraint).
  insert into public.compliance_requirements
    (workspace_id, created_by, title, category, authority_name, jurisdiction, description, source_url, recurrence_type, next_due_date, notes)
  values
    (ws, usr, 'Chicago business license and home occupation', 'license',
     'City of Chicago BACP', 'Chicago',
     'Ask BACP to classify the actual operating address and full activity mix (web, SEO, photo, video, AI services). LLC formation is not a city license. If home-based, check home-occupation rules and any lease/condo restrictions.',
     'https://codelibrary.amlegal.com/codes/chicago/latest/chicago_il/0-0-0-2608745', 'one_time', null,
     'BACP: 312-744-6249.'),
    (ws, usr, 'Tax classification and IDOR registration', 'tax',
     'Illinois Department of Revenue', 'Illinois',
     'With a CPA: confirm EIN and tax election (default single-member LLC = disregarded, Schedule C), classify each revenue type (custom dev, SEO/maintenance, hosting/software access, digital media) for sales tax, register with IDOR only if a liability exists, and check Chicago lease-tax exposure.',
     'https://tax.illinois.gov/questionsandanswers/answer.286.html', 'one_time', null, null),
    (ws, usr, 'Estimated tax payment (federal + Illinois)', 'tax',
     'IRS / Illinois Department of Revenue', 'Federal / Illinois',
     'Standard installment for 2026 if estimates are required. CPA confirms whether payments are needed.',
     'https://www.irs.gov/pub/irs-pdf/f1040es.pdf', 'none', '2027-01-15',
     'Installments are irregular (Apr 15, Jun 15, Sep 15, Jan 15): set the next due date by hand after each completion.'),
    (ws, usr, 'Income tax return (federal + Illinois)', 'tax',
     'IRS / Illinois Department of Revenue', 'Federal / Illinois',
     'Calendar-year 2026 individual return including LLC income, subject to the tax election confirmed with the CPA.',
     'https://www.irs.gov/businesses/small-businesses-self-employed/single-member-limited-liability-companies', 'annual', '2027-04-15', null),
    (ws, usr, 'CAN-SPAM for Sales outreach email', 'other',
     'Federal Trade Commission', 'Federal',
     'Every commercial email (including B2B prospect outreach) needs accurate From/subject, ad identification, a valid postal address, and a working opt-out honored within 10 business days and kept working at least 30 days. Keep suppression records. Applies to every Resend send from Sales.',
     'https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business', 'none', null,
     'Paired with the CANSPAM-AUDIT ticket (Sales email template and opt-out handling).'),
    (ws, usr, 'Negocio Listo client agreement review', 'other',
     'Illinois law (attorney review)', 'Illinois',
     'Written agreement in the LLC''s name: scope, setup fee, subscription start, 12-month term, cancellation, extra work, hosting/domain ownership, access, IP assignment for deliverables, handoff. Illinois automatic-renewal law excludes B2B contracts; consumer subscriptions would need extra disclosures.',
     'https://www.ilga.gov/documents/legislation/ilcs/documents/081506010K20.htm', 'one_time', null,
     'Do not silently change terms already offered to a client.'),
    (ws, usr, 'Client credentials and data security', 'privacy',
     'Illinois Attorney General (PIPA)', 'Illinois',
     'Inventory where client logins, GBP access, intake data, and vendor accounts live. MFA, least access, minimal retention, and a short breach-response plan. A covered breach triggers prompt statutory notices.',
     'https://www.ilga.gov/legislation/ilcs/fulltext?DocName=081505300K45', 'one_time', null, null),
    (ws, usr, 'Website privacy notice', 'privacy',
     'Federal Trade Commission', 'Federal / Illinois',
     'cicerowebstudio.xyz collects intake data via Google Apps Script. Publish an accurate privacy notice covering the form, analytics, cookies, and vendors, and only promise what is actually done.',
     'https://www.ftc.gov/business-guidance/privacy-security', 'one_time', null, null),
    (ws, usr, 'Company records and operating agreement', 'business_registration',
     'Illinois LLC Act (805 ILCS 180/1-40)', 'Illinois',
     'Keep member and contribution records, Articles, 3 years of tax returns and financial statements, and a written single-member operating agreement (recommended, not mandatory). Keep business bank and books separate.',
     'https://www.ilga.gov/Documents/legislation/ilcs/documents/080501800K1-40.htm', 'one_time', null, null),
    (ws, usr, 'FinCEN beneficial ownership (BOI) report', 'filing',
     'FinCEN', 'Federal',
     'Current FinCEN guidance exempts entities created in the US. Expected: not_applicable. Recorded so the question is not re-asked; recheck if the law changes.',
     'https://www.fincen.gov/boi', 'none', null,
     'Owner marks not_applicable after checking the source.');
end $$;
