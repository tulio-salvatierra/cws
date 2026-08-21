insert into public.email_templates (workspace_id, name, type, lang, subject, body, created_by)
select workspace.id, template.name, template.type, 'en', template.subject, template.body, workspace.created_by
from public.workspaces workspace
cross join (
  values
    ('Intro outreach', 'intro', 'A quick idea for {{company}}', E'Hi {{name}},\n\nI''m reaching out from Cicero Web Studio. I noticed {{company}} may have an opportunity to make its online presence clearer and easier for customers to act on.\n\nWould a short, practical observation be useful?'),
    ('Follow-up outreach', 'follow_up', 'Following up with {{company}}', E'Hi {{name}},\n\nI wanted to follow up on my note about {{company}}. If improving the website or lead flow is a priority this quarter, I''m happy to share one practical next step.\n\nNo pressure either way.'),
    ('Cold outreach', 'cold', 'A practical website idea for {{company}}', E'Hi {{name}},\n\nI help local businesses turn clearer website messaging into more qualified inquiries. I have one idea that may be useful for {{company}}.\n\nWould you be open to a brief conversation?')
) as template(name, type, subject, body)
where workspace.slug = 'cicero-web-studio'
on conflict do nothing;
