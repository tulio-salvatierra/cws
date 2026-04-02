# WF5 — Keyword AI Agent Setup

Runs every Monday at 7am. Uses GPT-4o web search to find trending search queries, deduplicates against existing keywords, and saves suggestions to Supabase for admin review.

## Credentials

All already exist from WF1–4:
- OpenAI (Header Auth)
- Anthropic (Header Auth)
- Supabase (Header Auth)
- Meta WhatsApp (Header Auth)

## Workflow Nodes (7 total)

### Node 1 — Schedule Trigger
- Type: Schedule Trigger
- Cron: `0 7 * * 1` (every Monday at 7am)

### Node 2 — GPT-4o Keyword Research (HTTP Request)
- URL: `https://api.openai.com/v1/responses`
- Method: POST
- Auth: OpenAI credential
- Body:
```json
{
  "model": "gpt-4o",
  "tools": [{ "type": "web_search_preview" }],
  "input": "What are the top 10 search queries driving traffic to web design and small business website services in Chicago right now? Return a JSON array with exactly 10 objects: [{ \"term\": \"keyword phrase\", \"priority\": 1-5, \"rationale\": \"one sentence why\" }]. Return only the JSON array, no other text."
}
```
- Extract: `{{ $json.output[1].content[0].text }}`

### Node 3 — Get Existing Keywords (HTTP Request → Supabase)
- URL: `https://YOUR_PROJECT.supabase.co/rest/v1/keywords?select=term`
- Method: GET
- Auth: Supabase credential
- Additional headers: `apikey: YOUR_SERVICE_ROLE_KEY`

### Node 4 — Claude Deduplication (HTTP Request)
- URL: `https://api.anthropic.com/v1/messages`
- Method: POST
- Additional headers: `anthropic-version: 2023-06-01`, `content-type: application/json`
- Auth: Anthropic credential
- Body:
```json
{
  "model": "claude-sonnet-4-6",
  "max_tokens": 1024,
  "messages": [{
    "role": "user",
    "content": "New keyword suggestions:\n{{ $node['GPT-4o Keyword Research'].json.output[1].content[0].text }}\n\nExisting keywords already in database:\n{{ $node['Get Existing Keywords'].json.map(k => k.term).join(', ') }}\n\nRemove any suggested keywords that duplicate or are near-duplicates of existing ones. Keep only keywords relevant to web design services for Chicago small businesses. Return a cleaned JSON array (max 10 items): [{ \"term\": \"...\", \"priority\": 1-5, \"rationale\": \"...\" }]. Return only the JSON array."
  }]
}
```

### Node 5 — Parse Keywords (Code node)
```js
const text = $input.first().json.content[0].text;
const keywords = JSON.parse(text);
return keywords.map(k => ({ json: k }));
```

### Node 6 — Save to Supabase (HTTP Request, runs per keyword)
- URL: `https://YOUR_PROJECT.supabase.co/rest/v1/keywords`
- Method: POST
- Auth: Supabase credential
- Additional headers: `Content-Type: application/json`, `Prefer: return=representation`
- Body: `{ "term": "{{ $json.term }}", "priority": {{ $json.priority }}, "status": "suggested" }`
- Note: Supabase `term UNIQUE` constraint prevents duplicates. Enable `Continue on Fail` so one duplicate doesn't block the rest.

### Node 7 — WhatsApp Notification (HTTP Request)
- URL: `https://graph.facebook.com/v21.0/YOUR_PHONE_NUMBER_ID/messages`
- Method: POST
- Body:
```json
{
  "messaging_product": "whatsapp",
  "to": "YOUR_WHATSAPP_NUMBER",
  "type": "text",
  "text": {
    "body": "🔍 New keyword suggestions ready for review!\n\nReview and approve at:\ncicerowebstudio.xyz/admin/keywords"
  }
}
```

## Test
1. Execute workflow manually (bypass schedule)
2. Check Supabase: `select * from keywords where status='suggested' order by created_at desc limit 10;`
3. Confirm 10 rows with status='suggested'
4. Check WhatsApp: notification received
5. Open /admin/keywords — suggestions appear in AI Suggestions section
6. Approve 2, reject 1 — confirm status changes in Supabase
