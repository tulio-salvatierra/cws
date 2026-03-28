# WF2 — Copy Agent Setup

## Webhook Trigger URL
After creating the workflow, copy the webhook URL (looks like `https://cicero.app.n8n.cloud/webhook/wf2-copy-agent`). Set this in WF1 Node 6.

## Platform System Prompts

Used in each Claude API call. Replace `[TOPIC]` and `[KEYWORDS]` with n8n expressions.

**All platforms:** Append this to every prompt:
> "Include these SEO keywords naturally: [KEYWORDS]. End with a CTA linking to cicerowebstudio.xyz."

| Platform | Prompt instruction |
|---|---|
| Instagram | "Write an Instagram post. 150–220 chars. 5–10 hashtags. Emoji-rich. Hook first. CTA at end." |
| Facebook  | "Write a Facebook post. 200–400 chars. Start with a question. Conversational. Link preview text." |
| X         | "Write a tweet. Max 280 chars. Punchy hook. 2 hashtags maximum. No filler." |
| LinkedIn  | "Write a LinkedIn post. 600–1200 chars. Insight-first. Business value framing. Professional but not stiff. No hashtag spam." |
| Pinterest | "Write a Pinterest pin description. 200–500 chars. Keyword-dense. Instructional tone. Written for search." |
| WhatsApp  | "Write a WhatsApp broadcast message. 100–200 chars. Casual and direct. 1–2 emojis. Clear CTA." |

## Workflow Nodes

### Node 1 — Webhook Trigger
- Type: Webhook
- Path: `wf2-copy-agent`
- Method: POST

### Node 2 — Get Unused Research Topics (HTTP Request → Supabase)
- URL: `https://YOUR_PROJECT.supabase.co/rest/v1/research_topics?used=eq.false&order=created_at.desc&limit=5`
- Method: GET
- Auth: Supabase credential
- Additional headers: `apikey: YOUR_SERVICE_ROLE_KEY`

### Node 3 — Split Into Items (Code node)
```js
return $input.first().json.map(topic => ({ json: topic }));
```

### Node 4 — Loop Over Topics (SplitInBatches node)
- Batch size: 1

### Nodes 5–10 — Claude API call per platform (6x HTTP Request nodes)
For each platform, duplicate this node and change the prompt:
- URL: `https://api.anthropic.com/v1/messages`
- Method: POST
- Additional headers: `anthropic-version: 2023-06-01`, `content-type: application/json`
- Auth: Anthropic credential
- Body:
```json
{
  "model": "claude-sonnet-4-6",
  "max_tokens": 512,
  "messages": [{
    "role": "user",
    "content": "Topic: {{ $json.topic }}\nKeywords: {{ $json.keywords.join(', ') }}\n\n[PLATFORM PROMPT FROM TABLE ABOVE]"
  }]
}
```

### Node 11 — Save content_draft (HTTP Request → Supabase)
- URL: `https://YOUR_PROJECT.supabase.co/rest/v1/content_drafts`
- Method: POST
- Headers: `Prefer: return=representation`
- Body:
```json
{
  "topic": "{{ $('Loop Over Topics').item.json.topic }}",
  "research_topic_id": "{{ $('Loop Over Topics').item.json.id }}",
  "status": "pending_image",
  "keywords": {{ $('Loop Over Topics').item.json.keywords }}
}
```

### Node 12 — Save 6 platform_posts (HTTP Request → Supabase, runs 6x via SplitInBatches)

Build an array of 6 objects from the 6 Claude nodes, then loop and insert each:
- URL: `https://YOUR_PROJECT.supabase.co/rest/v1/platform_posts`
- Method: POST
- Body: `{ "draft_id": "{{ $json.draftId }}", "platform": "{{ $json.platform }}", "copy": "{{ $json.copy }}", "status": "pending" }`

### Node 13 — Mark research_topic as used (HTTP Request → Supabase)
- URL: `https://YOUR_PROJECT.supabase.co/rest/v1/research_topics?id=eq.{{ $('Loop Over Topics').item.json.id }}`
- Method: PATCH
- Body: `{ "used": true }`

### Node 14 — Trigger WF3 (HTTP Request)
- URL: `https://YOUR_N8N_WORKSPACE.app.n8n.cloud/webhook/wf3-image-agent`
- Method: POST
- Body: `{ "draft_id": "{{ $node['Save content_draft'].json[0].id }}" }`

## Test
1. Make sure WF1 has run (research_topics rows exist with used=false)
2. POST to the webhook URL manually from n8n
3. Check Supabase: `select * from content_drafts order by created_at desc limit 1;`
4. Check: `select * from platform_posts where draft_id = 'THE_DRAFT_ID';` — should show 6 rows
