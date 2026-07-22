# Technical Conventions

## Stack

- Vite
- React
- React Router
- TypeScript
- Supabase
- Tailwind CSS
- Vercel serverless functions under `/api`
- n8n for the existing social publishing pipeline
- Final Cut Pro for video editing

Note: this is not Next.js. There is no app router, no server components, and no
Next.js API routes in this repository — server-side logic lives in Vercel
serverless functions under `/api`.

## Row-Level Security

- Legacy tables (`research_topics`, `keywords`, `content_drafts`, `platform_posts`,
  `media_assets`, `post_analytics`) retain their existing blanket
  `to authenticated using (true) with check (true)` policy. Do not extend this
  pattern to new tables — see DEC-007.
- New CWS Operating System tables use explicit `workspace_id` / `created_by`
  ownership columns with workspace-authorized RLS policies, per DEC-007.