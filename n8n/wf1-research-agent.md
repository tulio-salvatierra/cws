# WF1 — Research Agent Setup

## Credentials to add in n8n (Settings → Credentials)

| Name | Type | Value |
|---|---|---|
| OpenAI     | Header Auth | Name: `Authorization` Value: `Bearer YOUR_OPENAI_KEY` |
| Anthropic  | Header Auth | Name: `x-api-key` Value: `YOUR_KEY` |
| Supabase   | Header Auth | Name: `apikey` Value: `YOUR_SERVICE_ROLE_KEY` |

## Workflow Nodes

### Node 1 — Schedule Trigger
- Type: Schedule Trigger
- Cron expression: `0 6 * * 1-5` (6am Mon–Fri)

### Node 2 — GPT-4o Research (HTTP Request)
- URL: `https://api.openai.com/v1/responses`
- Method: POST
- Auth: OpenAI credential
- Additional headers: `Content-Type: application/json`
- Body (JSON):
```json
{
  "model": "gpt-4o",
  "tools": [{ "type": "web_search_preview" }],
  "input": "What are today's top 5 trending topics in web design, web development, and small business websites relevant to Chicago businesses? Return only a plain numbered list of topic titles, no explanation."
}
```
- Extract from response: `{{ $json.output[1].content[0].text }}`

### Node 3 — Claude Topic Extraction (HTTP Request)
- URL: `https://api.anthropic.com/v1/messages`
- Method: POST
- Additional headers: `anthropic-version: 2023-06-01`, `content-type: application/json`
- Auth: Anthropic credential
- Body (JSON):
```json
{
  "model": "claude-sonnet-4-6",
  "max_tokens": 1024,
  "messages": [
    {
      "role": "user",
      "content": "Given these trending topics:\n\n{{ $node['GPT-4o Research'].json.output[1].content[0].text }}\n\nReturn a JSON array of exactly 5 objects. Each object: { \"topic\": \"post topic title\", \"keywords\": [\"kw1\", \"kw2\", \"kw3\"] }. Topics must be relevant to web development services for Chicago businesses. Return only the JSON array, no other text."
    }
  ]
}
```

### Node 4 — Parse Topics (Code node)
```js
const text = $input.first().json.content[0].text;
const topics = JSON.parse(text);
return topics.map(t => ({ json: t }));
```

### Node 5 — Save to Supabase (HTTP Request, runs once per topic)
- URL: `https://YOUR_PROJECT.supabase.co/rest/v1/research_topics`
- Method: POST
- Auth: Supabase credential
- Additional headers: `Content-Type: application/json`, `Prefer: return=representation`
- Body:
```json
{
  "topic": "{{ $json.topic }}",
  "keywords": {{ $json.keywords }}
}
```

### Node 6 — Trigger WF2 (HTTP Request)
- URL: `https://YOUR_N8N_WORKSPACE.app.n8n.cloud/webhook/wf2-copy-agent`
- Method: POST
- Body: `{ "triggered_by": "wf1" }`

## Test
1. Click "Execute Workflow" manually
2. Check Supabase: `select * from research_topics order by created_at desc limit 5;`
3. Confirm 5 rows inserted with topics and keywords
