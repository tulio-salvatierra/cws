# WF4 Publisher Agent — Design Spec

**Date:** 2026-03-28
**Project:** Cicero Web Studio Social Media Admin System
**Status:** Approved for implementation

---

## Overview

WF4 is the final stage of the content pipeline. When the admin clicks **Approve** on a draft in the dashboard, WF4 immediately posts to all 6 platforms (Instagram, Facebook, WhatsApp, X, LinkedIn, Pinterest) via their respective APIs. The dashboard reflects per-platform success/failure in a new **Published** tab.

---

## Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Publish timing | Immediate on approval | Simplest UX — approve = live now |
| Platform scope | All 6 | Full coverage from day one |
| Workflow structure | Single n8n workflow, sequential | Matches WF1–3 pattern, easiest to build and debug |
| Error handling | Continue on Fail per node | One platform failure never blocks others |
| Dashboard feedback | Pending / Published tabs with per-platform ✓/✗ badges | Full visibility on what succeeded/failed per post |
| Credential starting point | From scratch on all 4 developer portals | User has no existing API credentials |

---

## Architecture

```
Admin clicks Approve
  ↓
approveDraft() in useDrafts.js
  ├─ PATCH content_drafts.status → 'approved'
  └─ POST to VITE_N8N_WF4_WEBHOOK_URL { draft_id }
        ↓
  n8n WF4 wakes up
        ↓
  Fetches draft + 6 platform_posts from Supabase
        ↓
  Posts to platforms in sequence (each with Continue on Fail):
  Instagram → Facebook → WhatsApp → X → LinkedIn → Pinterest
        ↓
  Updates each platform_post: status = 'published'|'failed', posted_at = now()
        ↓
  PATCH content_drafts.status → 'published'
        ↓
  Supabase Realtime fires → ContentQueue moves card to Published tab
```

---

## WF4 Workflow — 12 Nodes

### Node 1 — Webhook Trigger
- Type: Webhook
- Path: `wf4-publisher`
- Method: POST
- Receives: `{ "draft_id": "uuid" }`

### Node 2 — Get Draft + Platform Posts (HTTP Request → Supabase)
- URL: `https://YOUR_PROJECT.supabase.co/rest/v1/content_drafts?id=eq.{{ $json.draft_id }}&select=*,platform_posts(*)`
- Method: GET
- Auth: Supabase service role

### Nodes 3–8 — Platform Publishing (one per platform, all with Continue on Fail = true)

**Node 3 — Instagram** (Meta Graph API)
- Two-step: create container, then publish
- Step A: `POST /v21.0/{ig-user-id}/media` with `image_url` + `caption`
- Step B: `POST /v21.0/{ig-user-id}/media_publish` with container ID
- Auth: Meta long-lived access token

**Node 4 — Facebook** (Meta Graph API)
- `POST /v21.0/{page-id}/photos` with `url` + `message`
- Same Meta access token as Instagram

**Node 5 — WhatsApp** (Meta Cloud API)
- `POST /v21.0/{phone-number-id}/messages`
- Type: `text`, body: post copy + link to cicerowebstudio.xyz
- Same Meta access token

**Node 6 — X (Twitter)** (X API v2)
- `POST /2/tweets` with `{ "text": "{{ copy }}" }`
- Auth: OAuth 2.0 Bearer Token + User context (read/write)

**Node 7 — LinkedIn** (LinkedIn API v2)
- `POST /v2/ugcPosts` with author (organization URN) + shareContent
- Auth: OAuth 2.0 access token with `w_member_social` scope

**Node 8 — Pinterest** (Pinterest API v5)
- `POST /v5/pins` with board_id + media_source (image_url) + description
- Auth: OAuth 2.0 access token

### Node 9 — Collect Results (Code node)
Reads success/failure output from nodes 3–8 and builds an array:
```js
const platforms = ['instagram','facebook','whatsapp','x','linkedin','pinterest'];
return platforms.map((p, i) => {
  const node = $('Node ' + (i+3));
  const ok = !node.error;
  return { json: { platform: p, status: ok ? 'published' : 'failed', posted_at: ok ? new Date().toISOString() : null } };
});
```

### Node 10 — SplitInBatches
- Batch size: 1 — iterates through the 6 results from Node 9

### Node 11 — PATCH platform_post (HTTP Request → Supabase, runs 6×)
- URL: `https://YOUR_PROJECT.supabase.co/rest/v1/platform_posts?draft_id=eq.{{ $('Node 1').json.draft_id }}&platform=eq.{{ $json.platform }}`
- Method: PATCH
- Body: `{ "status": "{{ $json.status }}", "posted_at": "{{ $json.posted_at }}" }`

### Node 12 — Mark Draft Published (HTTP Request → Supabase)
- `PATCH content_drafts?id=eq.{{ $('Node 1').json.draft_id }}`
- Body: `{ "status": "published" }`
- This triggers Supabase Realtime → dashboard Published tab refreshes

---

## Credentials to Create

### 1. Meta for Developers (covers IG + FB + WhatsApp)
**Steps:**
1. Create a Meta Business Account at business.facebook.com
2. Go to developers.facebook.com → Create App → Business type
3. Add products: Instagram Graph API, Facebook Pages, WhatsApp Business
4. Get a permanent Page Access Token (not expiring)
5. Connect an Instagram Professional account to your Facebook Page
6. Note: Instagram User ID, Facebook Page ID, WhatsApp Phone Number ID

**n8n credential:** Header Auth — `Authorization: Bearer {PAGE_ACCESS_TOKEN}`

### 2. X Developer Portal
**Steps:**
1. Go to developer.twitter.com → Apply for access (free tier)
2. Create a Project + App
3. Set App permissions to Read + Write
4. Generate Access Token + Secret (for your account)
5. Note: API Key, API Secret, Access Token, Access Token Secret

**n8n credential:** OAuth1 API — X (Twitter) OAuth credential

### 3. LinkedIn Developer
**Steps:**
1. Go to linkedin.com/developers → Create App
2. Associate with your Company Page
3. Request `w_member_social` product (may need LinkedIn review)
4. Generate access token via OAuth 2.0 flow
5. Note: Client ID, Client Secret, Access Token, Organization URN

**n8n credential:** OAuth2 with `w_member_social` scope

### 4. Pinterest Developer
**Steps:**
1. Create a Pinterest Business account at business.pinterest.com
2. Go to developers.pinterest.com → Create App
3. Generate OAuth access token with `pins:read`, `pins:write`, `boards:read` scopes
4. Note: Access Token, Board ID to post to

**n8n credential:** OAuth2 Bearer Token

---

## Code Changes

### 1. `src/Hooks/useDrafts.js` — approveDraft()

Add WF4 webhook call after updating Supabase status:

```js
async function approveDraft(id, scheduledAt) {
  const { error } = await supabase
    .from('content_drafts')
    .update({ status: 'approved', scheduled_at: scheduledAt })
    .eq('id', id)
  if (!error) {
    setDrafts(prev => prev.filter(d => d.id !== id))
    // Trigger WF4 publisher
    const webhookUrl = import.meta.env.VITE_N8N_WF4_WEBHOOK_URL
    if (webhookUrl) {
      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft_id: id }),
      }).catch(() => {}) // fire-and-forget; WF4 errors surface in Published tab
    }
  }
  return { error }
}
```

### 2. `src/components/admin/ContentQueue.jsx` — Published Tab

**Tabs:** `activeTab` state, values: `'pending'` | `'published'`

**Pending tab:** existing queue view (status = 'pending_review')

**Published tab:**
- Uses `useDrafts('published')` to fetch published drafts
- Each card shows topic + timestamp + per-platform status badges
- Platform badges: green `IG ✓` if platform_post.status = 'published', red `IG ✗` if 'failed'
- Realtime subscription watches `content_drafts` for UPDATE events where status → `'published'`
- **Important:** `useDrafts` hook's Supabase channel must use `event: '*'` (not just `'INSERT'`) so the Published tab instance refreshes when WF4 sets draft status to `'published'`

**Tab counts:** badge on each tab label showing count

### 3. `.env.local`

```
VITE_N8N_WF4_WEBHOOK_URL=https://YOUR_WORKSPACE.app.n8n.cloud/webhook/wf4-publisher
```

---

## Files Produced

| File | Type | Description |
|---|---|---|
| `n8n/wf4-publisher.md` | New | Full setup guide: credential walkthroughs + all 12 nodes |
| `src/Hooks/useDrafts.js` | Modified | approveDraft() fires WF4 webhook; subscription uses `event: '*'` |
| `src/components/admin/ContentQueue.jsx` | Modified | Adds Pending/Published tabs with counts; renders PublishedCard list in Published tab |
| `src/components/admin/PublishedCard.jsx` | New | Displays published draft: topic, timestamp, per-platform ✓/✗ badges (no approve/reject buttons) |
| `.env.local` | Modified | Add VITE_N8N_WF4_WEBHOOK_URL |

---

## Database — No Schema Changes Needed

The existing schema already has everything required:
- `content_drafts.status` enum includes `'approved'` and `'published'`
- `platform_posts.status` enum includes `'published'` and `'failed'`
- `platform_posts.posted_at` timestamp column exists
- `platform_posts.platform_post_id` varchar column exists (for storing the ID returned by each platform API)

---

## Error Handling

- Each platform node in WF4 has **Continue on Fail = true** — a failure never blocks remaining platforms
- Failed platforms are written to the DB with `status = 'failed'` and no `posted_at`
- The dashboard Published tab displays red `✗` badges for failed platforms
- No automatic retry — if a platform fails, the admin sees it in the Published tab and can rerun WF4 manually

---

## Testing Checklist (manual, after setup)

1. Set up all credentials in n8n Cloud
2. Click Approve on a draft in the dashboard
3. Watch n8n execution log — all 12 nodes should complete
4. Check Published tab — card appears with platform badges
5. Verify actual posts appear on each social account
6. Test failure case: temporarily use a bad credential → confirm red `✗` badge appears for that platform while others succeed
