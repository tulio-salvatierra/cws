# WF3 — Image Agent Setup

## Additional Credentials

| Name | Type | Value |
|---|---|---|
| OpenAI     | Header Auth | `Authorization: Bearer YOUR_OPENAI_KEY` |
| Unsplash   | Header Auth | `Authorization: Client-ID YOUR_ACCESS_KEY` |
| Meta WA    | Header Auth | `Authorization: Bearer YOUR_WA_TOKEN` |

## WhatsApp Setup
1. Meta for Developers → create App → add WhatsApp product
2. Get: Phone Number ID, WhatsApp Business Account ID
3. Note your personal WhatsApp number to receive notifications

## Workflow Nodes

### Node 1 — Webhook Trigger
- Path: `wf3-image-agent`
- Method: POST
- Receives: `{ "draft_id": "uuid" }`

### Node 2 — Get Draft (HTTP Request → Supabase)
- URL: `https://YOUR_PROJECT.supabase.co/rest/v1/content_drafts?id=eq.{{ $json.draft_id }}&select=*`
- Method: GET

### Node 3 — Classify Post Type (Code node)
Determine if topic suggests a carousel/infographic or lifestyle image:
```js
const topic = $input.first().json[0].topic.toLowerCase();
const carouselKeywords = ['tips', 'reasons', 'mistakes', 'steps', 'vs', 'how to', 'guide', 'checklist'];
const isCarousel = carouselKeywords.some(k => topic.includes(k));
return [{ json: { ...$input.first().json[0], imageType: isCarousel ? 'carousel' : 'lifestyle' } }];
```

### Node 4 — IF: Carousel or Lifestyle?
- Condition: `{{ $json.imageType }} === "carousel"`

### Node 5a — DALL-E 3 (carousel path, HTTP Request)
- URL: `https://api.openai.com/v1/images/generations`
- Method: POST
- Auth: OpenAI credential
- Body:
```json
{
  "model": "dall-e-3",
  "prompt": "Clean, professional infographic for a web design agency. Topic: {{ $json.topic }}. Style: dark background, indigo and white colors, modern tech aesthetic. No text in image.",
  "n": 1,
  "size": "1024x1024",
  "quality": "standard"
}
```
- Extract URL: `{{ $json.data[0].url }}`

### Node 5b — Unsplash (lifestyle path, HTTP Request)
- URL: `https://api.unsplash.com/photos/random?query={{ $json.topic }}&orientation=landscape&content_filter=high`
- Method: GET
- Auth: Unsplash credential
- Extract URL: `{{ $json.urls.regular }}`

### Node 6 — Upload Image to Supabase Storage (HTTP Request)
First download the image (HTTP Request to the URL from Node 5a/5b), then upload:
- URL: `https://YOUR_PROJECT.supabase.co/storage/v1/object/post-images/{{ $json.draft_id }}.jpg`
- Method: POST
- Auth: Supabase credential (service role)
- Body: binary image data from previous node

### Node 7 — Save media_asset record (HTTP Request → Supabase)
- URL: `https://YOUR_PROJECT.supabase.co/rest/v1/media_assets`
- Method: POST
- Body:
```json
{
  "draft_id": "{{ $json.draft_id }}",
  "storage_url": "https://YOUR_PROJECT.supabase.co/storage/v1/object/public/post-images/{{ $json.draft_id }}.jpg",
  "type": "{{ $json.imageType === 'carousel' ? 'template' : 'stock' }}",
  "source": "{{ $json.imageType === 'carousel' ? 'dall-e' : 'unsplash' }}"
}
```

### Node 8 — Update platform_posts with image_url (HTTP Request → Supabase)
- URL: `https://YOUR_PROJECT.supabase.co/rest/v1/platform_posts?draft_id=eq.{{ $json.draft_id }}`
- Method: PATCH
- Body: `{ "image_url": "https://YOUR_PROJECT.supabase.co/storage/v1/object/public/post-images/{{ $json.draft_id }}.jpg" }`

### Node 9 — Update draft status to pending_review (HTTP Request → Supabase)
- URL: `https://YOUR_PROJECT.supabase.co/rest/v1/content_drafts?id=eq.{{ $json.draft_id }}`
- Method: PATCH
- Body: `{ "status": "pending_review" }`

### Node 10 — WhatsApp Notification (HTTP Request)
- URL: `https://graph.facebook.com/v21.0/YOUR_PHONE_NUMBER_ID/messages`
- Method: POST
- Auth: Meta WA credential
- Body:
```json
{
  "messaging_product": "whatsapp",
  "to": "YOUR_WHATSAPP_NUMBER",
  "type": "text",
  "text": {
    "body": "📋 New content ready for review:\n\n{{ $node['Get Draft'].json[0].topic }}\n\nReview at cicerowebstudio.xyz/admin"
  }
}
```

## Test
1. POST to WF3 webhook with a valid draft_id that has status `pending_image`
2. Check Supabase Storage: image file appears in `post-images` bucket
3. Check Supabase: draft status changed to `pending_review`
4. Check your WhatsApp: notification received
5. Reload admin dashboard: draft now appears in queue with thumbnail
