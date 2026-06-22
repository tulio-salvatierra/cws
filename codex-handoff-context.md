# Cicero Web Studio Client Portal - Codex Handoff Context

Use this as context for another Codex instance working on the same project.

## Project

- Repository: https://github.com/tulio-salvatierra/cws
- App type: Vite + React website for Cicero Web Studio
- Main feature area: hidden client portal / internal dashboard
- Current branch: `main`
- Latest pushed commit at time of handoff: `d665c28 Add leads outreach workflow`

## Product Direction

The goal is to evolve the website into a lightweight operating dashboard for Cicero Web Studio. The portal should help manage daily tasks, leads, clients, active projects, intake submissions, deliverables, balances, and future automations.

The user wants the interface to stay minimal, sleek, professional, and consistent with the rest of the website. The portal route should remain hidden from public navigation and only be accessed directly by typing the route.

## Current Portal Route

- Hidden portal route: `/client-portal`
- Public navigation link to the portal was intentionally removed.
- The user wants to type the portal route manually for basic safety/obscurity.

## Current Portal Structure

The portal now opens on an Executive Summary view instead of jumping directly into intake or admin tools.

Current internal portal views/tabs:

- `Summary`
- `Leads`
- `Project`
- `Client`
- `Intake`

The Summary view is meant to be the command center. It shows high-level business/project information such as active projects, leads, balances, deliverables, advisor prompt, and daily tasks.

## Important Files

- `src/pages/clientPortal/ClientPortalPage.jsx`
- `src/components/ClientPortal/ClientIntakeForm.jsx`
- `src/components/ClientPortal/ClientDashboard.jsx`
- `src/components/ClientPortal/AdminDashboard.jsx`
- `src/components/ClientPortal/LeadsPipeline.jsx`
- `src/data/clientPortalData.js`
- `src/data/clientPortalLeads.js`
- `src/lib/clientPortalGoogleSheet.js`
- `src/lib/clientPortalAutomations.js`
- `src/lib/leadOutreach.js`
- `api/client-portal-intake.js`
- `api/client-portal-notify.js`
- `api/lead-outreach.js`
- `vite.config.js`
- `.env.example`

## Implemented Features

### Client Portal

- Hidden `/client-portal` route exists.
- Portal opens to Executive Summary.
- Project view uses the existing client dashboard.
- Client view shows contact/intake/project details.
- Intake view contains the client intake form.
- UI is intentionally lightweight and dashboard-like.

### Google Sheets Source of Truth

Google Sheets is currently the preferred source of truth. The project has a serverless bridge that sends intake/project operations to a Google Apps Script webhook.

Existing sync flow:

1. React intake form submits client data.
2. `src/lib/clientPortalAutomations.js` runs intake automation.
3. `src/lib/clientPortalGoogleSheet.js` builds sheet operations.
4. `api/client-portal-intake.js` sends the operations to the Google Apps Script webhook.
5. Google Apps Script updates the spreadsheet.

Important: do not expose the Google webhook secret in browser/client code.

### Google Sheet Join Key Fix

A mismatch bug was fixed in `src/lib/clientPortalGoogleSheet.js`.

The row builders now consistently use:

```js
clientRecord.businessName || clientRecord.clientName
```

as the shared sheet key for client rows.

The separate `Contact Name` field should still be used for the individual person's name.

If older rows exist in the Google Sheet, the user may need to clean up duplicate rows where `Client Overview` used a personal name while other tabs used the business name.

### Email Notifications With Resend

Resend is partially implemented through secure serverless API routes.

Implemented routes:

- `api/client-portal-notify.js`
- `api/lead-outreach.js`

Implemented functions:

- `sendConfirmationEmail()`
- `notifyAdminWhenClientSubmitsForm()`
- lead intro email action
- lead follow-up email action

Important: `RESEND_API_KEY` must only live server-side. It must never be placed in client-side source or any `VITE_` variable.

### Leads Page

A Leads page has been added to the portal.

Files:

- `src/components/ClientPortal/LeadsPipeline.jsx`
- `src/data/clientPortalLeads.js`
- `src/lib/leadOutreach.js`
- `api/lead-outreach.js`

Current lead workflow includes:

- Lead list
- Selected lead detail panel
- Lead status/stage
- Fit score
- Next follow-up
- Outreach note
- Send intro action
- Send follow-up action
- Convert to client action
- Do not contact action
- Add note/activity action

Mock lead emails are placeholders and should be replaced before real outreach.

## Environment Variables

These are needed locally and/or in Vercel.

Core:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
GOOGLE_SHEETS_WEBHOOK_URL=
GOOGLE_SHEETS_WEBHOOK_SECRET=
VITE_CLIENT_PORTAL_INTAKE_WEBHOOK_URL=/api/client-portal-intake
VITE_CLIENT_PORTAL_UPDATE_WEBHOOK_URL=/api/client-portal-intake
```

Email / Resend:

```env
RESEND_API_KEY=
ADMIN_NOTIFY_EMAIL=
RESEND_FROM_EMAIL=
BUSINESS_POSTAL_ADDRESS=
LEAD_REPLY_TO_EMAIL=
LEAD_UNSUBSCRIBE_URL=
```

Optional:

```env
VITE_N8N_WF2_WEBHOOK_URL=
```

Security reminder:

- Do not put `RESEND_API_KEY` in `VITE_RESEND_API_KEY`.
- Do not hardcode `RESEND_API_KEY` in React/client files.
- Do not paste real `.env.local` values into chat unless intentionally sharing secrets.

## Validation Already Done

Before the last push:

- `npm run lint` passed.
- `npm run build` passed.
- There is one existing unrelated lint warning in `src/Hooks/useDrafts.js` about a missing `fetchDrafts` dependency.
- Build has non-blocking warnings related to `lottie-web` and large chunk size.
- Server-side Resend paths were checked to avoid exposing the key in client code.
- Lead outreach serverless behavior was tested with mock inputs.
- `main` was pushed successfully to GitHub.

## Known Next Improvements

Good next steps:

- Replace mock lead data with Google Sheets-backed lead data.
- Add a daily task page or task panel tied to the same Google Sheet.
- Add lead status updates back into Google Sheets.
- Add "send email" logging so outreach activity is written back to the sheet.
- Add simple filters for leads: hot, warm, cold, follow-up due, do not contact.
- Add a daily advisor prompt using local curated prompts first, then optional AI later.
- Add dashboard cards for today's tasks, overdue follow-ups, active proposals, payments due, and clients needing attention.
- Clean up any duplicate Google Sheet rows created before the client-name key fix.

## How To Continue In Another Codex Instance

Paste this handoff into the new Codex workspace and say:

```text
Continue from this context. Please inspect the repo before making changes, keep the client portal route hidden, keep Google Sheets as the source of truth, and do not expose any server-side secrets in client-side code.
```

