insert into public.email_templates (workspace_id, name, type, lang, subject, body, created_by)
select workspace.id,
  'Monthly studio update',
  'mailing_list',
  'en',
  'A practical website idea from Cicero Web Studio',
  E'Hi {{name}},\n\nHere is one practical idea from Cicero Web Studio to make your website clearer and easier for customers to act on.\n\nWe will keep these updates useful and occasional.\n\nUnsubscribe: {{unsubscribe_url}}',
  workspace.created_by
from public.workspaces workspace
where workspace.slug = 'cicero-web-studio'
on conflict do nothing;
