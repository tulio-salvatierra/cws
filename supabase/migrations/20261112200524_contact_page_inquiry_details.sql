-- Apply before deploying the contact-page branch. Existing lead RLS/grants remain unchanged.
alter table public.leads
  add column inquiry_service text check (inquiry_service is null or inquiry_service in ('new', 'redesign', 'audit', 'other')),
  add column inquiry_message text check (inquiry_message is null or char_length(inquiry_message) between 1 and 4000);
