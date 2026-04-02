# WF4 — Publisher Agent Setup

Triggered when the admin clicks Approve on a draft. Posts to all 6 auto-publish platforms and marks YouTube as ready.

## Credentials

| Name | Type | Notes |
|---|---|---|
| Meta | Header Auth | `Authorization: Bearer YOUR_PAGE_ACCESS_TOKEN` — same as WF3 |
| X OAuth | OAuth1 | API Key + Secret + Access Token + Secret from developer.twitter.com |
| LinkedIn OAuth | OAuth2 | `w_member_social` scope from linkedin.com/developers |
| Pinterest OAuth | OAuth2 | `pins:write boards:read` scopes from developers.pinterest.com |
| Supabase | Header Auth | `apikey: YOUR_SERVICE_ROLE_KEY` — same as WF1–3 |

## Credential Setup

### X (Twitter)
1. developer.twitter.com → Create Project + App
2. Set App permissions: Read + Write
3. Generate Access Token + Secret (user context, for your account)
4. In n8n: create OAuth1 credential with API Key, API Secret, Access Token, Access Token Secret

### LinkedIn
1. linkedin.com/developers → Create App → associate with your Company Page
2. Request `w_member_social` product (may require LinkedIn review, 1–3 days)
3. In n8n: use OAuth2 → complete the OAuth flow to get access token
4. Note your Organization URN: `urn:li:organization:YOUR_ORG_ID`

### Pinterest
1. business.pinterest.com → create Business account
2. developers.pinterest.com → Create App
3. Generate OAuth token with `pins:read`, `pins:write`, `boards:read` scopes
4. Note your Board ID to post to (from URL: pinterest.com/username/board-name/)

## Workflow Nodes (15 total)

### Node 1 — Webhook Trigger
- Type: Webhook
- Path: `wf4-publisher`
- Method: POST
- Receives: `{ "draft_id": "uuid" }`

### Node 2 — Get Draft + Posts (HTTP Request → Supabase)
- URL: `https://YOUR_PROJECT.supabase.co/rest/v1/content_drafts?id=eq.{{ $json.draft_id }}&select=*,platform_posts(*)`
- Method: GET
- Auth: Supabase credential

### Node 3 — Instagram (HTTP Request) — Continue on Fail: ON
Two-step publish:

Step A — Create container:
- URL: `https://graph.facebook.com/v21.0/YOUR_IG_USER_ID/media`
- Body: `{ "image_url": "{{ $json.platform_posts.find(p => p.platform==='instagram').image_url }}", "caption": "{{ $json.platform_posts.find(p => p.platform==='instagram').copy }}", "access_token": "YOUR_PAGE_ACCESS_TOKEN" }`

Step B — Publish container (second HTTP node):
- URL: `https://graph.facebook.com/v21.0/YOUR_IG_USER_ID/media_publish`
- Body: `{ "creation_id": "{{ $json.id }}", "access_token": "YOUR_PAGE_ACCESS_TOKEN" }`

### Node 4 — Facebook (HTTP Request) — Continue on Fail: ON
- URL: `https://graph.facebook.com/v21.0/YOUR_PAGE_ID/photos`
- Method: POST
- Body: `{ "url": "{{ $node['Node 2'].json[0].platform_posts.find(p => p.platform==='facebook').image_url }}", "message": "{{ $node['Node 2'].json[0].platform_posts.find(p => p.platform==='facebook').copy }}", "access_token": "YOUR_PAGE_ACCESS_TOKEN" }`

### Node 5 — WhatsApp (HTTP Request) — Continue on Fail: ON
- URL: `https://graph.facebook.com/v21.0/YOUR_PHONE_NUMBER_ID/messages`
- Method: POST
- Body:
```json
{
  "messaging_product": "whatsapp",
  "to": "YOUR_WHATSAPP_NUMBER",
  "type": "text",
  "text": { "body": "{{ $node['Node 2'].json[0].platform_posts.find(p => p.platform==='whatsapp').copy }}" }
}
```

### Node 6 — X/Twitter (HTTP Request) — Continue on Fail: ON
- URL: `https://api.twitter.com/2/tweets`
- Method: POST
- Auth: X OAuth credential
- Body: `{ "text": "{{ $node['Node 2'].json[0].platform_posts.find(p => p.platform==='x').copy }}" }`

### Node 7 — LinkedIn (HTTP Request) — Continue on Fail: ON
- URL: `https://api.linkedin.com/v2/ugcPosts`
- Method: POST
- Auth: LinkedIn OAuth credential
- Body:
```json
{
  "author": "urn:li:organization:YOUR_ORG_ID",
  "lifecycleState": "PUBLISHED",
  "specificContent": {
    "com.linkedin.ugc.ShareContent": {
      "shareCommentary": { "text": "{{ $node['Node 2'].json[0].platform_posts.find(p => p.platform==='linkedin').copy }}" },
      "shareMediaCategory": "NONE"
    }
  },
  "visibility": { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" }
}
```

### Node 8 — Pinterest (HTTP Request) — Continue on Fail: ON
- URL: `https://api.pinterest.com/v5/pins`
- Method: POST
- Auth: Pinterest OAuth credential
- Body:
```json
{
  "board_id": "YOUR_BOARD_ID",
  "media_source": { "source_type": "image_url", "url": "{{ $node['Node 2'].json[0].platform_posts.find(p => p.platform==='pinterest').image_url }}" },
  "description": "{{ $node['Node 2'].json[0].platform_posts.find(p => p.platform==='pinterest').copy }}"
}
```

### Node 9 — Mark YouTube Ready (HTTP Request → Supabase)
- URL: `https://YOUR_PROJECT.supabase.co/rest/v1/platform_posts?draft_id=eq.{{ $node['Node 1'].json.draft_id }}&platform=eq.youtube`
- Method: PATCH
- Body: `{ "status": "youtube_ready" }`

### Node 10 — Collect Results (Code node)
```js
const draft_id = $node['Node 1'].json.draft_id;
const platforms = ['instagram','facebook','whatsapp','x','linkedin','pinterest'];
const nodeNums = [3, 4, 5, 6, 7, 8];

const results = platforms.map((p, i) => {
  try {
    const node = $('Node ' + nodeNums[i]);
    const ok = node && !node.error;
    return { platform: p, status: ok ? 'published' : 'failed', posted_at: ok ? new Date().toISOString() : null };
  } catch {
    return { platform: p, status: 'failed', posted_at: null };
  }
});

return results.map(r => ({ json: { ...r, draft_id } }));
```

### Node 11 — SplitInBatches
- Batch size: 1

### Node 12 — PATCH platform_post status (HTTP Request → Supabase, runs 6×)
- URL: `https://YOUR_PROJECT.supabase.co/rest/v1/platform_posts?draft_id=eq.{{ $json.draft_id }}&platform=eq.{{ $json.platform }}`
- Method: PATCH
- Body: `{ "status": "{{ $json.status }}", "posted_at": "{{ $json.posted_at }}" }`

### Node 13 — PATCH draft to published (HTTP Request → Supabase)
- URL: `https://YOUR_PROJECT.supabase.co/rest/v1/content_drafts?id=eq.{{ $node['Node 1'].json.draft_id }}`
- Method: PATCH
- Body: `{ "status": "published" }`

### Node 14 — Build WhatsApp Summary (Code node)
```js
const getIcon = (p) => {
  try {
    return $('Node ' + {'instagram':3,'facebook':4,'whatsapp':5,'x':6,'linkedin':7,'pinterest':8}[p]).error ? '✗' : '✓';
  } catch { return '✗'; }
};
const summary = ['instagram','facebook','x','linkedin','pinterest','whatsapp']
  .map(p => p.slice(0,2).toUpperCase() + ' ' + getIcon(p))
  .join(' | ');
return [{ json: { summary, topic: $node['Node 2'].json[0].topic } }];
```

### Node 15 — WhatsApp Summary Notification (HTTP Request)
- URL: `https://graph.facebook.com/v21.0/YOUR_PHONE_NUMBER_ID/messages`
- Method: POST
- Body:
```json
{
  "messaging_product": "whatsapp",
  "to": "YOUR_WHATSAPP_NUMBER",
  "type": "text",
  "text": {
    "body": "✅ Content published!\n\nTopic: {{ $json.topic }}\n\n{{ $json.summary }}\n⏳ YouTube: ready in dashboard\n\nReview: cicerowebstudio.xyz/admin"
  }
}
```

## Test
1. Set up all credentials
2. Approve a draft from the dashboard
3. Check n8n execution log — all 15 nodes complete
4. Check Published tab — card appears with per-platform badges
5. Verify posts visible on each social account
6. Check WhatsApp — summary notification received
7. Check YouTube tab in dashboard — card appears with metadata
