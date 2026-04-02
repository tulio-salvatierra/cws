# Social Media Management System — Phase 2 Design Spec

**Date:** 2026-04-01
**Project:** Cicero Web Studio Social Media Admin System
**Status:** Approved for implementation

---

## Overview

Phase 2 completes the publishing pipeline (WF4), adds YouTube metadata support, implements the keyword AI agent (WF5), and builds the keywords admin page. The existing WF1–3 are updated to use GPT-4o instead of Perplexity for research, and to generate YouTube copy alongside the existing 6 platforms.

---

## What Already Exists (Phase 1)

| Component | Status |
|---|---|
| WF1 — Research Agent | Done (Perplexity → Claude → Supabase) |
| WF2 — Copy Agent | Done (Claude × 6 platforms) |
| WF3 — Image Agent | Done (DALL-E/Unsplash → Storage → WhatsApp notify) |
| WF4 — Publisher Agent | Designed (spec in `2026-03-28-wf4-publisher-design.md`), not implemented |
| Admin dashboard — Pending Review tab | Done |
| Supabase schema | Done (`research_topics`, `content_drafts`, `platform_posts`, `media_assets`, `post_analytics`) |

---

## Architecture

```
[WF1 — Research Agent]  (runs Mon–Fri 6am)
  GPT-4o (web search) → trending topics in web design / Chicago SMB
  Claude → extract 5 topics + keywords as JSON
  → saves to research_topics
  → triggers WF2

[WF2 — Copy Agent]  (webhook, triggered by WF1)
  For each topic, Claude generates copy for:
  Instagram · Facebook · X · LinkedIn · Pinterest · WhatsApp · YouTube
  → saves content_draft + 7 platform_posts (status=pending)
  → triggers WF3

[WF3 — Image Agent]  (webhook, triggered by WF2)
  DALL-E or Unsplash → image
  → uploads to Supabase Storage
  → updates all 7 platform_posts with image_url
  → sets draft status → pending_review
  → WhatsApp: "📋 New content ready for review → /admin"

[Admin Dashboard — /admin]
  Pending Review tab → admin approves or rejects
  On Approve → PATCH status=approved + POST to WF4 webhook

[WF4 — Publisher Agent]  (webhook, triggered by Approve click)
  Fetches draft + 7 platform_posts from Supabase
  → Posts to: Instagram · Facebook · X · LinkedIn · Pinterest (Meta/X APIs)
  → WhatsApp: sends copy as broadcast message
  → YouTube branch: PATCHes platform_post status=youtube_ready (no API post)
  → Updates each platform_post: published | failed | youtube_ready
  → Sets draft status → published
  → WhatsApp summary: "✅ IG ✓ FB ✓ X ✓ LI ✓ PIN ✓ | ⏳ YT: ready in dashboard | ❌ Failed: none"

[WF5 — Keyword AI Agent]  (runs every Monday 7am)
  GPT-4o (web search) → top 10 search queries for web design / Chicago SMB
  Claude → deduplicates against existing keywords, assigns priority scores
  → saves to keywords table with status=suggested
  → WhatsApp: "🔍 10 new keyword suggestions ready → /admin/keywords"

[Keywords Dashboard — /admin/keywords]
  AI Suggestions section: approve / reject pending suggestions
  Active Keywords table: add / edit / block keywords + view use count
  Blocked Keywords: collapsed list with unblock action
```

---

## Data Model Changes

Three enum additions via Supabase migrations:

### Migration 003 — platform_name enum
```sql
ALTER TYPE platform_name ADD VALUE 'youtube';
```

### Migration 004 — post_status enum
```sql
ALTER TYPE post_status ADD VALUE 'youtube_ready';
```

### Migration 005 — keywords table
```sql
ALTER TABLE keywords ADD COLUMN status text DEFAULT 'active'
  CHECK (status IN ('active', 'suggested', 'blocked'));

-- Backfill: existing blocked=true rows
UPDATE keywords SET status = 'blocked' WHERE blocked = true;
```

No new tables required. The existing schema handles all Phase 2 data.

---

## WF1 — Research Agent (update)

**Change:** Replace Perplexity HTTP Request node with GPT-4o Responses API call.

### Node 2 (replacement) — GPT-4o Research
- URL: `https://api.openai.com/v1/responses`
- Method: POST
- Auth: OpenAI Header Auth (`Authorization: Bearer YOUR_KEY`)
- Body:
```json
{
  "model": "gpt-4o",
  "tools": [{ "type": "web_search_preview" }],
  "input": "What are today's top 5 trending topics in web design, web development, and small business websites relevant to Chicago businesses? Return only a plain numbered list of topic titles, no explanation."
}
```
- Extract from response: `{{ $json.output[1].content[0].text }}`

### Node 3 — Claude Topic Extraction
Unchanged. Receives the numbered list and returns JSON array of 5 `{ topic, keywords }` objects.

---

## WF2 — Copy Agent (update)

**Change:** Add a 7th platform node for YouTube after the existing 6.

### New Node — Claude YouTube Copy (add after existing Node 14)
- Same structure as the 6 existing Claude copy nodes
- Prompt:
```
Topic: {{ $json.topic }}
Keywords: {{ $json.keywords.join(', ') }}

Write YouTube video metadata:
1. Title: max 60 chars, SEO-optimized, keyword-rich
2. Description: 300–500 chars, include timestamps placeholder ([00:00] Intro), CTA to cicerowebstudio.xyz
3. Tags: 10–15 comma-separated tags

Return JSON: { "title": "...", "description": "...", "tags": "..." }
```

### New Node — Save YouTube platform_post (add after YouTube Copy node)
- Same structure as existing platform_post save node
- `platform: "youtube"`, `copy`: the full JSON string from YouTube Copy node
- `status: "pending"`

---

## WF4 — Publisher Agent (implement)

Implement the spec from `2026-03-28-wf4-publisher-design.md` with these additions:

### YouTube Branch (addition to Node 9 / Collect Results)
- After nodes 3–8 (5 platforms + WhatsApp), add an IF node for YouTube
- IF true: PATCH `platform_posts?draft_id=eq.{{draft_id}}&platform=eq.youtube` → `{ "status": "youtube_ready" }`
- YouTube result is added to the results array with `status: "youtube_ready"` (not published/failed)

### Node 13 — WhatsApp Publish Summary (new, replaces simple published notification)
After Node 12 (mark draft published), send:
```
✅ Content published!

Topic: {{ $node['Get Draft'].json[0].topic }}

IG {{ ig_ok ? '✓' : '✗' }} | FB {{ fb_ok ? '✓' : '✗' }} | X {{ x_ok ? '✓' : '✗' }} | LI {{ li_ok ? '✓' : '✗' }} | PIN {{ pin_ok ? '✓' : '✗' }} | WA {{ wa_ok ? '✓' : '✗' }}
⏳ YouTube: ready in dashboard

Review at cicerowebstudio.xyz/admin
```

---

## WF5 — Keyword AI Agent (new)

### Credentials
- OpenAI (already exists from WF3)
- Anthropic (already exists from WF1–2)
- Supabase (already exists)
- Meta WhatsApp (already exists from WF3)

### Node 1 — Schedule Trigger
- Cron: `0 7 * * 1` (every Monday 7am)

### Node 2 — GPT-4o Keyword Research
- URL: `https://api.openai.com/v1/responses`
- Body:
```json
{
  "model": "gpt-4o",
  "tools": [{ "type": "web_search_preview" }],
  "input": "What are the top 10 search queries driving traffic to web design and small business website services in Chicago right now? Return JSON array: [{ \"term\": \"...\", \"priority\": 1-5, \"rationale\": \"one sentence\" }]"
}
```

### Node 3 — Get Existing Keywords (HTTP Request → Supabase)
- URL: `https://YOUR_PROJECT.supabase.co/rest/v1/keywords?select=term`
- Returns existing terms for deduplication

### Node 4 — Claude Deduplication + Refinement
- Receives GPT-4o suggestions + existing keywords list
- Prompt: removes duplicates/near-duplicates, validates Chicago/web-design relevance, returns cleaned JSON array
- Returns: `[{ term, priority, rationale }]` (max 10)

### Node 5 — Parse Keywords (Code node)
```js
const text = $input.first().json.content[0].text;
const keywords = JSON.parse(text);
return keywords.map(k => ({ json: k }));
```

### Node 6 — Save to Supabase (HTTP Request, runs per keyword)
- URL: `https://YOUR_PROJECT.supabase.co/rest/v1/keywords`
- Method: POST
- Body: `{ "term": "{{ $json.term }}", "priority": {{ $json.priority }}, "status": "suggested" }`
- Header: `Prefer: return=representation`

### Node 7 — WhatsApp Notification
```
🔍 {{ count }} new keyword suggestions ready for review

Review and approve at:
cicerowebstudio.xyz/admin/keywords
```

---

## Dashboard Changes

### `src/components/admin/ContentQueue.jsx` (modify)

Add tab state: `'pending_review' | 'published' | 'youtube_ready'`

```
┌─────────────────────────────────────────────────┐
│  Content Queue                    [Generate]    │
│                                                 │
│  [Pending (3)] [Published (12)] [YouTube (2)]  │
│                                                 │
│  ... cards ...                                  │
└─────────────────────────────────────────────────┘
```

Tab count badges: orange (pending), green (published), purple (youtube).

### `src/components/admin/PublishedCard.jsx` (new)

Displays a published draft:
- Topic + published timestamp
- 7 platform badges: `IG ✓` green / `IG ✗` red / `YT ⏳` purple
- No approve/reject buttons

### `src/components/admin/YouTubeCard.jsx` (new)

Displays a YouTube-ready draft:
- Video title (with copy button)
- Description (with copy button)
- Tags as chips (with copy-all button)
- Thumbnail image
- **"Mark as Uploaded"** button → PATCH `platform_post.status = published`, `posted_at = now()`

### `src/Hooks/useDrafts.js` (modify)

Two changes:
1. Realtime subscription: change `event: 'INSERT'` to `event: '*'` so Published tab refreshes when WF4 updates status
2. Add `useYouTubeDrafts()` export — queries `platform_posts` where `status = youtube_ready`, joined to `content_drafts`

### `src/Hooks/useKeywords.js` (new)

Fetches keywords grouped by status. Exposes:
- `suggested`, `active`, `blocked` arrays
- `approveKeyword(id)` → PATCH `status = active`
- `rejectKeyword(id)` → PATCH `status = blocked`
- `blockKeyword(id)` → PATCH `status = blocked`
- `unblockKeyword(id)` → PATCH `status = active`
- `updatePriority(id, priority)` → PATCH `priority`
- `addKeyword({ term, priority })` → POST

### `src/pages/admin/KeywordsPage.jsx` (new)

Three sections:

**AI Suggestions (top)**
- Cards for `status = suggested` keywords
- Each: term + rationale + priority chip + Approve / Reject buttons
- Empty state: "No suggestions — WF5 runs every Monday"

**Active Keywords (middle)**
- Table: Term | Priority | Use Count | Actions (Block / Edit)
- Inline "Add keyword" input row at top

**Blocked Keywords (bottom, collapsed)**
- Simple list with Unblock button per row

### `src/components/admin/AdminLayout.jsx` (modify)

Add "Keywords" nav link pointing to `/admin/keywords`.

### `src/App.jsx` (modify)

Add route: `<Route path="keywords" element={<KeywordsPage />} />` inside the admin route group.

---

## Files Produced

| File | Type | Description |
|---|---|---|
| `supabase/migrations/003_add_youtube_platform.sql` | New | Adds `youtube` to platform_name enum |
| `supabase/migrations/004_add_youtube_ready_status.sql` | New | Adds `youtube_ready` to post_status enum |
| `supabase/migrations/005_keywords_status.sql` | New | Adds `status` column to keywords table |
| `n8n/wf1-research-agent.md` | Modified | Replace Perplexity node with GPT-4o Responses API |
| `n8n/wf2-copy-agent.md` | Modified | Add YouTube copy generation node |
| `n8n/wf4-publisher.md` | New | Full WF4 setup: nodes, credentials, YouTube branch, WhatsApp summary |
| `n8n/wf5-keyword-agent.md` | New | Full WF5 setup: nodes, schedule, deduplication flow |
| `src/Hooks/useDrafts.js` | Modified | `event: '*'` subscription + `approveDraft` fires WF4 webhook + `useYouTubeDrafts` |
| `src/Hooks/useKeywords.js` | New | Keyword CRUD against Supabase |
| `src/components/admin/ContentQueue.jsx` | Modified | 3-tab layout |
| `src/components/admin/PublishedCard.jsx` | New | Published draft card with platform badges |
| `src/components/admin/YouTubeCard.jsx` | New | YouTube ready card with copy buttons + Mark as Uploaded |
| `src/components/admin/AdminLayout.jsx` | Modified | Add Keywords nav link |
| `src/pages/admin/KeywordsPage.jsx` | New | Keywords admin page (3 sections) |
| `src/App.jsx` | Modified | Add `/admin/keywords` route |
| `.env.local` | Modified | Add `VITE_N8N_WF4_WEBHOOK_URL` (WF5 is schedule-triggered, no env var needed) |

---

## Credentials Summary

All credentials already exist in n8n except where noted:

| Credential | Used in | Status |
|---|---|---|
| OpenAI | WF1 (research), WF3 (DALL-E), WF5 (research) | Already exists (WF3) |
| Anthropic | WF1, WF2, WF5 | Already exists |
| Supabase | WF1–5 | Already exists |
| Meta (IG/FB/WhatsApp) | WF3 (notify), WF4 (publish) | WF3 exists, WF4 needs setup |
| X OAuth | WF4 | Needs setup |
| LinkedIn OAuth | WF4 | Needs setup |
| Pinterest OAuth | WF4 | Needs setup |

---

## Error Handling

- WF4: all platform nodes have `Continue on Fail = true` — one failure never blocks others
- WF4: YouTube branch never fails (no external API call)
- WF5: Claude deduplication step prevents saving duplicate keyword terms (Supabase `term UNIQUE` constraint is the final safety net)
- Dashboard: YouTube "Mark as Uploaded" is idempotent — safe to click multiple times

---

## Testing Checklist

1. Run migration 003–005 against Supabase
2. Update WF1 Node 2 to GPT-4o — execute manually, confirm 5 topics saved
3. Update WF2 — execute manually, confirm 7 platform_posts created per draft (including youtube)
4. Build WF4 — approve a draft from dashboard, confirm posts appear on all platforms + WhatsApp summary received
5. Confirm YouTube card appears in YouTube Ready tab
6. Click "Mark as Uploaded" — confirm status flips to published
7. Build WF5 — execute manually, confirm 10 suggested keywords appear in /admin/keywords
8. Approve 3, reject 2 — confirm status changes correctly
9. Add a keyword manually — confirm it appears in Active table
