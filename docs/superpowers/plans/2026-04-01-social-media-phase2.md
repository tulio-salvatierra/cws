# Social Media Phase 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the publishing pipeline (WF4), add YouTube metadata support, implement keyword AI agent (WF5), and build the keywords admin page.

**Architecture:** n8n workflows (WF1–5) orchestrate research → copy → image → publish. A React admin dashboard backed by Supabase provides review, approval, and keyword management. WF4 posts to 5 platforms automatically; YouTube is handled as a "ready" state the admin copies manually.

**Tech Stack:** React 18 + Vite, Tailwind CSS, Supabase (Postgres + Realtime + Storage), n8n Cloud, Vitest + @testing-library/react, Claude API, OpenAI API (GPT-4o + DALL-E)

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `supabase/migrations/003_add_youtube_platform.sql` | Create | Add `youtube` to platform_name enum |
| `supabase/migrations/004_add_youtube_ready_status.sql` | Create | Add `youtube_ready` to post_status enum |
| `supabase/migrations/005_keywords_status.sql` | Create | Add `status` column to keywords table |
| `src/components/admin/PlatformBadge.jsx` | Modify | Add youtube style |
| `src/Hooks/useDrafts.js` | Modify | event:*, WF4 webhook on approve, useYouTubeDrafts export |
| `src/Hooks/useKeywords.js` | Create | Keyword CRUD against Supabase |
| `src/components/admin/PublishedCard.jsx` | Create | Published draft card with per-platform status badges |
| `src/components/admin/YouTubeCard.jsx` | Create | YouTube metadata card with copy buttons + Mark as Uploaded |
| `src/components/admin/ContentQueue.jsx` | Modify | 3-tab layout (Pending / Published / YouTube) |
| `src/pages/admin/KeywordsPage.jsx` | Create | Keywords admin page (3 sections) |
| `src/App.jsx` | Modify | Add `/admin/keywords` route |
| `.env.local` | Modify | Add VITE_N8N_WF4_WEBHOOK_URL |
| `n8n/wf1-research-agent.md` | Modify | Replace Perplexity node with GPT-4o Responses API |
| `n8n/wf2-copy-agent.md` | Modify | Add YouTube copy generation nodes |
| `n8n/wf4-publisher.md` | Create | Full WF4 setup guide |
| `n8n/wf5-keyword-agent.md` | Create | Full WF5 setup guide |
| `src/components/admin/__tests__/PlatformBadge.test.jsx` | Create | Test youtube badge renders |
| `src/components/admin/__tests__/PublishedCard.test.jsx` | Create | Test published card with status badges |
| `src/components/admin/__tests__/YouTubeCard.test.jsx` | Create | Test YouTube card copy + mark uploaded |
| `src/components/admin/__tests__/ContentQueue.test.jsx` | Create | Test 3-tab layout |
| `src/components/admin/__tests__/KeywordsPage.test.jsx` | Create | Test keyword approval / add / block |

---

## Task 1: Migration 003 — Add youtube to platform_name enum

**Files:**
- Create: `supabase/migrations/003_add_youtube_platform.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- supabase/migrations/003_add_youtube_platform.sql
ALTER TYPE platform_name ADD VALUE IF NOT EXISTS 'youtube';
```

- [ ] **Step 2: Apply to Supabase**

In the Supabase dashboard → SQL Editor, paste and run the migration. Or via CLI:
```bash
supabase db push
```
Expected: no error

- [ ] **Step 3: Verify**

In Supabase SQL Editor:
```sql
SELECT enum_range(NULL::platform_name);
```
Expected output includes `youtube` in the array.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/003_add_youtube_platform.sql
git commit -m "feat: add youtube to platform_name enum"
```

---

## Task 2: Migration 004 — Add youtube_ready to post_status enum

**Files:**
- Create: `supabase/migrations/004_add_youtube_ready_status.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- supabase/migrations/004_add_youtube_ready_status.sql
ALTER TYPE post_status ADD VALUE IF NOT EXISTS 'youtube_ready';
```

- [ ] **Step 2: Apply to Supabase**

In Supabase SQL Editor, run the migration.

- [ ] **Step 3: Verify**

```sql
SELECT enum_range(NULL::post_status);
```
Expected output includes `youtube_ready`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/004_add_youtube_ready_status.sql
git commit -m "feat: add youtube_ready to post_status enum"
```

---

## Task 3: Migration 005 — Add status column to keywords

**Files:**
- Create: `supabase/migrations/005_keywords_status.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- supabase/migrations/005_keywords_status.sql
ALTER TABLE keywords
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'active'
    CHECK (status IN ('active', 'suggested', 'blocked'));

-- Backfill: mark existing blocked=true rows
UPDATE keywords SET status = 'blocked' WHERE blocked = true;
```

- [ ] **Step 2: Apply to Supabase**

In Supabase SQL Editor, run the migration.

- [ ] **Step 3: Verify**

```sql
SELECT id, term, blocked, status FROM keywords LIMIT 5;
```
Expected: `status` column exists, blocked rows have `status = 'blocked'`, others have `status = 'active'`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/005_keywords_status.sql
git commit -m "feat: add status column to keywords table"
```

---

## Task 4: Update PlatformBadge — add youtube

**Files:**
- Modify: `src/components/admin/PlatformBadge.jsx`
- Create: `src/components/admin/__tests__/PlatformBadge.test.jsx`

- [ ] **Step 1: Write the failing test**

```jsx
// src/components/admin/__tests__/PlatformBadge.test.jsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import PlatformBadge from '../PlatformBadge'

describe('PlatformBadge', () => {
  it('renders YT label for youtube platform', () => {
    render(<PlatformBadge platform="youtube" />)
    expect(screen.getByText('YT')).toBeInTheDocument()
  })

  it('renders IG label for instagram platform', () => {
    render(<PlatformBadge platform="instagram" />)
    expect(screen.getByText('IG')).toBeInTheDocument()
  })

  it('renders platform name as fallback for unknown platform', () => {
    render(<PlatformBadge platform="tiktok" />)
    expect(screen.getByText('tiktok')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:run -- src/components/admin/__tests__/PlatformBadge.test.jsx
```
Expected: FAIL — `YT` not found (youtube not in PLATFORM_STYLES)

- [ ] **Step 3: Add youtube to PlatformBadge**

Replace the entire `PLATFORM_STYLES` object in `src/components/admin/PlatformBadge.jsx`:

```jsx
const PLATFORM_STYLES = {
  instagram: { label: 'IG',  bg: 'bg-pink-900',  text: 'text-pink-300' },
  facebook:  { label: 'FB',  bg: 'bg-blue-900',  text: 'text-blue-300' },
  x:         { label: 'X',   bg: 'bg-gray-800',  text: 'text-gray-300' },
  linkedin:  { label: 'LI',  bg: 'bg-sky-900',   text: 'text-sky-300'  },
  pinterest: { label: 'PIN', bg: 'bg-red-900',   text: 'text-red-300'  },
  whatsapp:  { label: 'WA',  bg: 'bg-green-900', text: 'text-green-300'},
  youtube:   { label: 'YT',  bg: 'bg-rose-900',  text: 'text-rose-300' },
}

export default function PlatformBadge({ platform }) {
  const style = PLATFORM_STYLES[platform] ?? { label: platform, bg: 'bg-gray-800', text: 'text-gray-300' }
  return (
    <span className={`${style.bg} ${style.text} text-xs font-semibold px-2 py-0.5 rounded`}>
      {style.label}
    </span>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test:run -- src/components/admin/__tests__/PlatformBadge.test.jsx
```
Expected: 3 passed

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/PlatformBadge.jsx src/components/admin/__tests__/PlatformBadge.test.jsx
git commit -m "feat: add youtube to PlatformBadge"
```

---

## Task 5: Update useDrafts — realtime fix + WF4 webhook + useYouTubeDrafts

**Files:**
- Modify: `src/Hooks/useDrafts.js`

- [ ] **Step 1: Replace the entire file**

```js
// src/Hooks/useDrafts.js
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useDrafts(statusFilter = 'pending_review') {
  const [drafts, setDrafts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function fetchDrafts() {
    const { data, error } = await supabase
      .from('content_drafts')
      .select('*, platform_posts(*)')
      .eq('status', statusFilter)
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setDrafts(data)
    }
    setLoading(false)
  }

  async function approveDraft(id, scheduledAt) {
    const { error } = await supabase
      .from('content_drafts')
      .update({ status: 'approved', scheduled_at: scheduledAt })
      .eq('id', id)
    if (!error) {
      setDrafts(prev => prev.filter(d => d.id !== id))
      const webhookUrl = import.meta.env.VITE_N8N_WF4_WEBHOOK_URL
      if (webhookUrl) {
        fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ draft_id: id }),
        }).catch(() => {})
      }
    }
    return { error }
  }

  async function rejectDraft(id) {
    const { error } = await supabase
      .from('content_drafts')
      .update({ status: 'rejected' })
      .eq('id', id)
    if (!error) setDrafts(prev => prev.filter(d => d.id !== id))
    return { error }
  }

  useEffect(() => {
    fetchDrafts()

    const channel = supabase
      .channel(`content_drafts_changes_${statusFilter}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'content_drafts' },
        () => fetchDrafts()
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [statusFilter])

  return { drafts, loading, error, approveDraft, rejectDraft }
}

export function useYouTubeDrafts() {
  const [drafts, setDrafts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function fetchDrafts() {
    const { data, error } = await supabase
      .from('content_drafts')
      .select('*, platform_posts!inner(*)')
      .eq('platform_posts.platform', 'youtube')
      .eq('platform_posts.status', 'youtube_ready')
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setDrafts(data)
    }
    setLoading(false)
  }

  async function markUploaded(platformPostId) {
    const { error } = await supabase
      .from('platform_posts')
      .update({ status: 'published', posted_at: new Date().toISOString() })
      .eq('id', platformPostId)
    if (!error) {
      setDrafts(prev =>
        prev.filter(d =>
          !d.platform_posts.some(
            pp => pp.id === platformPostId && pp.platform === 'youtube'
          )
        )
      )
    }
    return { error }
  }

  useEffect(() => {
    fetchDrafts()
  }, [])

  return { drafts, loading, error, markUploaded }
}
```

- [ ] **Step 2: Run existing tests to verify nothing broke**

```bash
npm run test:run
```
Expected: all existing tests pass (AdminGuard, DraftCard, GenerateButton, SlideOver)

- [ ] **Step 3: Commit**

```bash
git add src/Hooks/useDrafts.js
git commit -m "feat: update useDrafts — realtime event:*, WF4 webhook on approve, add useYouTubeDrafts"
```

---

## Task 6: Create useKeywords hook

**Files:**
- Create: `src/Hooks/useKeywords.js`

- [ ] **Step 1: Create the file**

```js
// src/Hooks/useKeywords.js
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useKeywords() {
  const [keywords, setKeywords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function fetchKeywords() {
    const { data, error } = await supabase
      .from('keywords')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) {
      setError(error.message)
    } else {
      setKeywords(data)
    }
    setLoading(false)
  }

  async function approveKeyword(id) {
    const { error } = await supabase
      .from('keywords')
      .update({ status: 'active' })
      .eq('id', id)
    if (!error) {
      setKeywords(prev => prev.map(k => k.id === id ? { ...k, status: 'active' } : k))
    }
    return { error }
  }

  async function rejectKeyword(id) {
    const { error } = await supabase
      .from('keywords')
      .update({ status: 'blocked' })
      .eq('id', id)
    if (!error) {
      setKeywords(prev => prev.map(k => k.id === id ? { ...k, status: 'blocked' } : k))
    }
    return { error }
  }

  async function blockKeyword(id) {
    return rejectKeyword(id)
  }

  async function unblockKeyword(id) {
    const { error } = await supabase
      .from('keywords')
      .update({ status: 'active' })
      .eq('id', id)
    if (!error) {
      setKeywords(prev => prev.map(k => k.id === id ? { ...k, status: 'active' } : k))
    }
    return { error }
  }

  async function updatePriority(id, priority) {
    const { error } = await supabase
      .from('keywords')
      .update({ priority })
      .eq('id', id)
    if (!error) {
      setKeywords(prev => prev.map(k => k.id === id ? { ...k, priority } : k))
    }
    return { error }
  }

  async function addKeyword({ term, priority = 3 }) {
    const { data, error } = await supabase
      .from('keywords')
      .insert({ term, priority, status: 'active' })
      .select()
      .single()
    if (!error) {
      setKeywords(prev => [data, ...prev])
    }
    return { error }
  }

  useEffect(() => {
    fetchKeywords()
  }, [])

  const suggested = keywords.filter(k => k.status === 'suggested')
  const active = keywords.filter(k => k.status === 'active')
  const blocked = keywords.filter(k => k.status === 'blocked')

  return {
    suggested,
    active,
    blocked,
    loading,
    error,
    approveKeyword,
    rejectKeyword,
    blockKeyword,
    unblockKeyword,
    updatePriority,
    addKeyword,
  }
}
```

- [ ] **Step 2: Run existing tests to verify nothing broke**

```bash
npm run test:run
```
Expected: all tests pass

- [ ] **Step 3: Commit**

```bash
git add src/Hooks/useKeywords.js
git commit -m "feat: add useKeywords hook"
```

---

## Task 7: Create PublishedCard component

**Files:**
- Create: `src/components/admin/PublishedCard.jsx`
- Create: `src/components/admin/__tests__/PublishedCard.test.jsx`

- [ ] **Step 1: Write the failing test**

```jsx
// src/components/admin/__tests__/PublishedCard.test.jsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import PublishedCard from '../PublishedCard'

const mockDraft = {
  id: 'draft-1',
  topic: 'Top 5 Web Design Trends in Chicago',
  updated_at: '2026-04-01T10:00:00Z',
  platform_posts: [
    { id: 'pp-1', platform: 'instagram', status: 'published', image_url: null },
    { id: 'pp-2', platform: 'facebook',  status: 'published', image_url: null },
    { id: 'pp-3', platform: 'x',         status: 'failed',    image_url: null },
    { id: 'pp-4', platform: 'linkedin',  status: 'published', image_url: null },
    { id: 'pp-5', platform: 'pinterest', status: 'published', image_url: null },
    { id: 'pp-6', platform: 'whatsapp',  status: 'published', image_url: null },
    { id: 'pp-7', platform: 'youtube',   status: 'youtube_ready', image_url: null },
  ],
}

describe('PublishedCard', () => {
  it('renders the topic', () => {
    render(<PublishedCard draft={mockDraft} />)
    expect(screen.getByText(/Top 5 Web Design/i)).toBeInTheDocument()
  })

  it('shows checkmark badge for published platform', () => {
    render(<PublishedCard draft={mockDraft} />)
    expect(screen.getByText('IG ✓')).toBeInTheDocument()
  })

  it('shows failure badge for failed platform', () => {
    render(<PublishedCard draft={mockDraft} />)
    expect(screen.getByText('X ✗')).toBeInTheDocument()
  })

  it('shows pending badge for youtube_ready platform', () => {
    render(<PublishedCard draft={mockDraft} />)
    expect(screen.getByText('YT ⏳')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:run -- src/components/admin/__tests__/PublishedCard.test.jsx
```
Expected: FAIL — PublishedCard not found

- [ ] **Step 3: Create PublishedCard**

```jsx
// src/components/admin/PublishedCard.jsx

function StatusBadge({ platform, status }) {
  const LABELS = {
    instagram: 'IG', facebook: 'FB', x: 'X',
    linkedin: 'LI', pinterest: 'PIN', whatsapp: 'WA', youtube: 'YT',
  }
  const label = LABELS[platform] ?? platform.toUpperCase()

  if (status === 'published') {
    return (
      <span className="bg-green-900 text-green-300 text-xs font-semibold px-2 py-0.5 rounded">
        {label} ✓
      </span>
    )
  }
  if (status === 'failed') {
    return (
      <span className="bg-red-900 text-red-300 text-xs font-semibold px-2 py-0.5 rounded">
        {label} ✗
      </span>
    )
  }
  if (status === 'youtube_ready') {
    return (
      <span className="bg-purple-900 text-purple-300 text-xs font-semibold px-2 py-0.5 rounded">
        {label} ⏳
      </span>
    )
  }
  return (
    <span className="bg-gray-800 text-gray-400 text-xs font-semibold px-2 py-0.5 rounded">
      {label}
    </span>
  )
}

export default function PublishedCard({ draft }) {
  const imageUrl = draft.platform_posts?.find(pp => pp.image_url)?.image_url
  const formattedDate = new Date(draft.updated_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="flex items-center gap-4 bg-gray-900 border border-gray-800 rounded-xl px-4 py-3">
      <div
        className="w-14 h-14 rounded-lg bg-gray-800 flex-shrink-0 bg-cover bg-center"
        style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : {}}
      />
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate">{draft.topic}</p>
        <p className="text-gray-500 text-xs mt-0.5">{formattedDate}</p>
        <div className="flex gap-1 mt-1 flex-wrap">
          {draft.platform_posts?.map(pp => (
            <StatusBadge key={pp.id} platform={pp.platform} status={pp.status} />
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test:run -- src/components/admin/__tests__/PublishedCard.test.jsx
```
Expected: 4 passed

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/PublishedCard.jsx src/components/admin/__tests__/PublishedCard.test.jsx
git commit -m "feat: add PublishedCard component with per-platform status badges"
```

---

## Task 8: Create YouTubeCard component

**Files:**
- Create: `src/components/admin/YouTubeCard.jsx`
- Create: `src/components/admin/__tests__/YouTubeCard.test.jsx`

- [ ] **Step 1: Write the failing test**

```jsx
// src/components/admin/__tests__/YouTubeCard.test.jsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import YouTubeCard from '../YouTubeCard'

const mockDraft = {
  id: 'draft-1',
  topic: 'Web Design Tips',
  platform_posts: [
    {
      id: 'pp-yt-1',
      platform: 'youtube',
      status: 'youtube_ready',
      image_url: null,
      copy: JSON.stringify({
        title: 'Top 5 Web Design Tips for Chicago Businesses',
        description: '[00:00] Intro\n[00:30] Tip 1\nVisit cicerowebstudio.xyz for more.',
        tags: 'web design, chicago, small business website',
      }),
    },
  ],
}

describe('YouTubeCard', () => {
  it('renders the video title', () => {
    render(<YouTubeCard draft={mockDraft} onMarkUploaded={vi.fn()} />)
    expect(screen.getByText('Top 5 Web Design Tips for Chicago Businesses')).toBeInTheDocument()
  })

  it('renders tags as chips', () => {
    render(<YouTubeCard draft={mockDraft} onMarkUploaded={vi.fn()} />)
    expect(screen.getByText('web design')).toBeInTheDocument()
    expect(screen.getByText('chicago')).toBeInTheDocument()
  })

  it('calls onMarkUploaded with the platform_post id when button clicked', () => {
    const onMarkUploaded = vi.fn()
    render(<YouTubeCard draft={mockDraft} onMarkUploaded={onMarkUploaded} />)
    fireEvent.click(screen.getByRole('button', { name: /mark as uploaded/i }))
    expect(onMarkUploaded).toHaveBeenCalledWith('pp-yt-1')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:run -- src/components/admin/__tests__/YouTubeCard.test.jsx
```
Expected: FAIL — YouTubeCard not found

- [ ] **Step 3: Create YouTubeCard**

```jsx
// src/components/admin/YouTubeCard.jsx
import { useState } from 'react'

export default function YouTubeCard({ draft, onMarkUploaded }) {
  const ytPost = draft.platform_posts?.find(pp => pp.platform === 'youtube')
  let metadata = { title: '', description: '', tags: '' }
  try {
    metadata = JSON.parse(ytPost?.copy || '{}')
  } catch {
    // keep defaults
  }

  const [copied, setCopied] = useState(null)

  async function copy(text, field) {
    await navigator.clipboard.writeText(text)
    setCopied(field)
    setTimeout(() => setCopied(null), 2000)
  }

  const tags = metadata.tags
    ? metadata.tags.split(',').map(t => t.trim()).filter(Boolean)
    : []

  return (
    <div className="bg-gray-900 border border-purple-900 rounded-xl px-4 py-4">
      {/* Thumbnail + Title */}
      <div className="flex gap-4 mb-3">
        {ytPost?.image_url && (
          <div
            className="w-24 h-16 rounded-lg bg-gray-800 flex-shrink-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${ytPost.image_url})` }}
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Title</p>
          <div className="flex gap-2 items-start">
            <p className="text-white text-sm font-medium flex-1">{metadata.title}</p>
            <button
              onClick={() => copy(metadata.title, 'title')}
              className="text-gray-500 hover:text-gray-300 text-xs shrink-0 transition-colors"
            >
              {copied === 'title' ? '✓' : 'Copy'}
            </button>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <p className="text-gray-400 text-xs uppercase tracking-wide">Description</p>
          <button
            onClick={() => copy(metadata.description, 'desc')}
            className="text-gray-500 hover:text-gray-300 text-xs transition-colors"
          >
            {copied === 'desc' ? '✓ Copied' : 'Copy'}
          </button>
        </div>
        <p className="text-gray-300 text-xs leading-relaxed line-clamp-3">
          {metadata.description}
        </p>
      </div>

      {/* Tags */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <p className="text-gray-400 text-xs uppercase tracking-wide">Tags</p>
          <button
            onClick={() => copy(metadata.tags, 'tags')}
            className="text-gray-500 hover:text-gray-300 text-xs transition-colors"
          >
            {copied === 'tags' ? '✓ Copied' : 'Copy all'}
          </button>
        </div>
        <div className="flex flex-wrap gap-1">
          {tags.map((tag, i) => (
            <span key={i} className="bg-gray-800 text-gray-400 text-xs px-2 py-0.5 rounded">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Action */}
      <button
        aria-label="Mark as Uploaded"
        onClick={() => onMarkUploaded(ytPost.id)}
        className="w-full bg-purple-700 hover:bg-purple-600 text-white text-xs font-semibold py-2 rounded-lg transition-colors"
      >
        ✓ Mark as Uploaded
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test:run -- src/components/admin/__tests__/YouTubeCard.test.jsx
```
Expected: 3 passed

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/YouTubeCard.jsx src/components/admin/__tests__/YouTubeCard.test.jsx
git commit -m "feat: add YouTubeCard component"
```

---

## Task 9: Update ContentQueue — 3-tab layout

**Files:**
- Modify: `src/components/admin/ContentQueue.jsx`
- Create: `src/components/admin/__tests__/ContentQueue.test.jsx`

- [ ] **Step 1: Write the failing test**

```jsx
// src/components/admin/__tests__/ContentQueue.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('../../../Hooks/useDrafts', () => ({
  useDrafts: vi.fn(),
  useYouTubeDrafts: vi.fn(),
}))

import { useDrafts, useYouTubeDrafts } from '../../../Hooks/useDrafts'
import ContentQueue from '../ContentQueue'

const emptyState = { drafts: [], loading: false, error: null, approveDraft: vi.fn(), rejectDraft: vi.fn() }
const ytEmptyState = { drafts: [], loading: false, error: null, markUploaded: vi.fn() }

describe('ContentQueue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useDrafts.mockReturnValue(emptyState)
    useYouTubeDrafts.mockReturnValue(ytEmptyState)
  })

  it('renders Pending tab by default', () => {
    render(<ContentQueue />)
    expect(screen.getByRole('button', { name: /pending/i })).toBeInTheDocument()
  })

  it('renders Published tab button', () => {
    render(<ContentQueue />)
    expect(screen.getByRole('button', { name: /published/i })).toBeInTheDocument()
  })

  it('renders YouTube tab button', () => {
    render(<ContentQueue />)
    expect(screen.getByRole('button', { name: /youtube/i })).toBeInTheDocument()
  })

  it('shows pending empty state on load', () => {
    render(<ContentQueue />)
    expect(screen.getByText(/no drafts pending review/i)).toBeInTheDocument()
  })

  it('switches to Published tab on click', () => {
    render(<ContentQueue />)
    fireEvent.click(screen.getByRole('button', { name: /published/i }))
    expect(screen.getByText(/no published posts yet/i)).toBeInTheDocument()
  })

  it('switches to YouTube tab on click', () => {
    render(<ContentQueue />)
    fireEvent.click(screen.getByRole('button', { name: /youtube/i }))
    expect(screen.getByText(/no youtube metadata ready/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:run -- src/components/admin/__tests__/ContentQueue.test.jsx
```
Expected: FAIL — tabs not found, wrong empty state text

- [ ] **Step 3: Replace ContentQueue**

```jsx
// src/components/admin/ContentQueue.jsx
import { useState } from 'react'
import { useDrafts, useYouTubeDrafts } from '../../Hooks/useDrafts'
import DraftCard from './DraftCard'
import PublishedCard from './PublishedCard'
import YouTubeCard from './YouTubeCard'
import SlideOver from './SlideOver'
import GenerateButton from './GenerateButton'

export default function ContentQueue() {
  const [activeTab, setActiveTab] = useState('pending')
  const [expandedDraft, setExpandedDraft] = useState(null)

  const pending = useDrafts('pending_review')
  const published = useDrafts('published')
  const youtube = useYouTubeDrafts()

  function TabButton({ id, label, count, color }) {
    const isActive = activeTab === id
    const colors = {
      orange: isActive ? 'bg-orange-600 text-white' : 'text-gray-400 hover:text-white',
      green:  isActive ? 'bg-green-700 text-white'  : 'text-gray-400 hover:text-white',
      purple: isActive ? 'bg-purple-700 text-white' : 'text-gray-400 hover:text-white',
    }
    return (
      <button
        onClick={() => setActiveTab(id)}
        aria-label={label}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${colors[color]}`}
      >
        {label}
        {count > 0 && (
          <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20' : 'bg-gray-700'}`}>
            {count}
          </span>
        )}
      </button>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-white text-lg font-semibold">Content Queue</h1>
        <GenerateButton webhookUrl={import.meta.env.VITE_N8N_WF2_WEBHOOK_URL} />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <TabButton id="pending"   label="Pending"   count={pending.drafts.length}   color="orange" />
        <TabButton id="published" label="Published" count={published.drafts.length} color="green"  />
        <TabButton id="youtube"   label="YouTube"   count={youtube.drafts.length}   color="purple" />
      </div>

      {/* Pending tab */}
      {activeTab === 'pending' && (
        <>
          {pending.loading && <p className="text-gray-500 text-sm">Loading…</p>}
          {pending.error   && <p className="text-red-400 text-sm">Error: {pending.error}</p>}
          {!pending.loading && !pending.error && pending.drafts.length === 0 && (
            <p className="text-gray-500 text-sm">No drafts pending review.</p>
          )}
          <div className="flex flex-col gap-3">
            {pending.drafts.map(draft => (
              <DraftCard
                key={draft.id}
                draft={draft}
                onApprove={id => pending.approveDraft(id, null)}
                onReject={pending.rejectDraft}
                onExpand={setExpandedDraft}
              />
            ))}
          </div>
        </>
      )}

      {/* Published tab */}
      {activeTab === 'published' && (
        <>
          {published.loading && <p className="text-gray-500 text-sm">Loading…</p>}
          {published.error   && <p className="text-red-400 text-sm">Error: {published.error}</p>}
          {!published.loading && !published.error && published.drafts.length === 0 && (
            <p className="text-gray-500 text-sm">No published posts yet.</p>
          )}
          <div className="flex flex-col gap-3">
            {published.drafts.map(draft => (
              <PublishedCard key={draft.id} draft={draft} />
            ))}
          </div>
        </>
      )}

      {/* YouTube tab */}
      {activeTab === 'youtube' && (
        <>
          {youtube.loading && <p className="text-gray-500 text-sm">Loading…</p>}
          {youtube.error   && <p className="text-red-400 text-sm">Error: {youtube.error}</p>}
          {!youtube.loading && !youtube.error && youtube.drafts.length === 0 && (
            <p className="text-gray-500 text-sm">No YouTube metadata ready.</p>
          )}
          <div className="flex flex-col gap-4">
            {youtube.drafts.map(draft => (
              <YouTubeCard
                key={draft.id}
                draft={draft}
                onMarkUploaded={youtube.markUploaded}
              />
            ))}
          </div>
        </>
      )}

      {/* SlideOver for pending draft preview */}
      {expandedDraft && (
        <SlideOver
          draft={expandedDraft}
          onClose={() => setExpandedDraft(null)}
          onApprove={id => { pending.approveDraft(id, null); setExpandedDraft(null) }}
          onReject={id => { pending.rejectDraft(id); setExpandedDraft(null) }}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test:run -- src/components/admin/__tests__/ContentQueue.test.jsx
```
Expected: 6 passed

- [ ] **Step 5: Run all tests**

```bash
npm run test:run
```
Expected: all tests pass

- [ ] **Step 6: Commit**

```bash
git add src/components/admin/ContentQueue.jsx src/components/admin/__tests__/ContentQueue.test.jsx
git commit -m "feat: update ContentQueue with 3-tab layout (Pending/Published/YouTube)"
```

---

## Task 10: Create KeywordsPage

**Files:**
- Create: `src/pages/admin/KeywordsPage.jsx`
- Create: `src/components/admin/__tests__/KeywordsPage.test.jsx`

- [ ] **Step 1: Write the failing test**

```jsx
// src/components/admin/__tests__/KeywordsPage.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('../../../Hooks/useKeywords', () => ({
  useKeywords: vi.fn(),
}))

import { useKeywords } from '../../../Hooks/useKeywords'
import KeywordsPage from '../../../pages/admin/KeywordsPage'

const mockApprove = vi.fn()
const mockReject = vi.fn()
const mockBlock = vi.fn()
const mockUnblock = vi.fn()
const mockUpdatePriority = vi.fn()
const mockAdd = vi.fn()

const baseState = {
  suggested: [],
  active: [],
  blocked: [],
  loading: false,
  error: null,
  approveKeyword: mockApprove,
  rejectKeyword: mockReject,
  blockKeyword: mockBlock,
  unblockKeyword: mockUnblock,
  updatePriority: mockUpdatePriority,
  addKeyword: mockAdd,
}

describe('KeywordsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useKeywords.mockReturnValue(baseState)
  })

  it('renders the page heading', () => {
    render(<KeywordsPage />)
    expect(screen.getByText('Keyword Strategy')).toBeInTheDocument()
  })

  it('shows empty state when no suggestions', () => {
    render(<KeywordsPage />)
    expect(screen.getByText(/WF5 runs every Monday/i)).toBeInTheDocument()
  })

  it('renders a suggestion card and calls approve', () => {
    useKeywords.mockReturnValue({
      ...baseState,
      suggested: [{ id: 'kw-1', term: 'chicago web design', priority: 4, status: 'suggested', rationale: 'High search volume' }],
    })
    render(<KeywordsPage />)
    expect(screen.getByText('chicago web design')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /approve/i }))
    expect(mockApprove).toHaveBeenCalledWith('kw-1')
  })

  it('renders active keywords table', () => {
    useKeywords.mockReturnValue({
      ...baseState,
      active: [{ id: 'kw-2', term: 'small business website', priority: 3, status: 'active', use_count: 5 }],
    })
    render(<KeywordsPage />)
    expect(screen.getByText('small business website')).toBeInTheDocument()
  })

  it('calls blockKeyword when block is clicked', () => {
    useKeywords.mockReturnValue({
      ...baseState,
      active: [{ id: 'kw-2', term: 'small business website', priority: 3, status: 'active', use_count: 0 }],
    })
    render(<KeywordsPage />)
    fireEvent.click(screen.getByRole('button', { name: /block/i }))
    expect(mockBlock).toHaveBeenCalledWith('kw-2')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:run -- src/components/admin/__tests__/KeywordsPage.test.jsx
```
Expected: FAIL — KeywordsPage not found

- [ ] **Step 3: Create KeywordsPage**

```jsx
// src/pages/admin/KeywordsPage.jsx
import { useState } from 'react'
import { useKeywords } from '../../Hooks/useKeywords'

export default function KeywordsPage() {
  const {
    suggested, active, blocked, loading, error,
    approveKeyword, rejectKeyword, blockKeyword, unblockKeyword,
    updatePriority, addKeyword,
  } = useKeywords()

  const [showBlocked, setShowBlocked] = useState(false)
  const [newTerm, setNewTerm] = useState('')
  const [newPriority, setNewPriority] = useState(3)

  if (loading) return <div className="p-6 text-gray-500 text-sm">Loading keywords…</div>
  if (error)   return <div className="p-6 text-red-400 text-sm">Error: {error}</div>

  async function handleAdd(e) {
    e.preventDefault()
    if (!newTerm.trim()) return
    await addKeyword({ term: newTerm.trim(), priority: newPriority })
    setNewTerm('')
    setNewPriority(3)
  }

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-white text-lg font-semibold mb-6">Keyword Strategy</h1>

      {/* AI Suggestions */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-white text-sm font-semibold">AI Suggestions</h2>
          {suggested.length > 0 && (
            <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {suggested.length}
            </span>
          )}
        </div>
        {suggested.length === 0 ? (
          <p className="text-gray-500 text-sm">No suggestions pending — WF5 runs every Monday.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {suggested.map(kw => (
              <div
                key={kw.id}
                className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 flex items-start gap-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">{kw.term}</p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    Priority {kw.priority} · {kw.rationale || 'AI suggested'}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    aria-label="Approve"
                    onClick={() => approveKeyword(kw.id)}
                    className="bg-green-900 hover:bg-green-800 text-green-300 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                  >
                    ✓ Approve
                  </button>
                  <button
                    aria-label="Reject"
                    onClick={() => rejectKeyword(kw.id)}
                    className="bg-red-950 hover:bg-red-900 text-red-400 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Active Keywords */}
      <section className="mb-8">
        <h2 className="text-white text-sm font-semibold mb-3">Active Keywords</h2>
        <form onSubmit={handleAdd} className="flex gap-2 mb-3">
          <input
            value={newTerm}
            onChange={e => setNewTerm(e.target.value)}
            placeholder="Add keyword…"
            className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-indigo-500"
          />
          <select
            value={newPriority}
            onChange={e => setNewPriority(Number(e.target.value))}
            className="bg-gray-900 border border-gray-700 rounded-lg px-2 py-1.5 text-white text-sm"
          >
            {[1, 2, 3, 4, 5].map(n => (
              <option key={n} value={n}>P{n}</option>
            ))}
          </select>
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
          >
            Add
          </button>
        </form>

        {active.length === 0 ? (
          <p className="text-gray-500 text-sm">No active keywords yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-xs border-b border-gray-800">
                <th className="text-left py-2">Term</th>
                <th className="text-left py-2 w-24">Priority</th>
                <th className="text-left py-2 w-16">Uses</th>
                <th className="text-right py-2 w-16">Actions</th>
              </tr>
            </thead>
            <tbody>
              {active.map(kw => (
                <tr key={kw.id} className="border-b border-gray-900">
                  <td className="py-2 text-white">{kw.term}</td>
                  <td className="py-2">
                    <select
                      value={kw.priority}
                      onChange={e => updatePriority(kw.id, Number(e.target.value))}
                      className="bg-gray-900 border border-gray-800 rounded px-1 py-0.5 text-gray-300 text-xs"
                    >
                      {[1, 2, 3, 4, 5].map(n => (
                        <option key={n} value={n}>P{n}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 text-gray-500">{kw.use_count ?? 0}</td>
                  <td className="py-2 text-right">
                    <button
                      aria-label="Block"
                      onClick={() => blockKeyword(kw.id)}
                      className="text-gray-500 hover:text-red-400 text-xs transition-colors"
                    >
                      Block
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Blocked Keywords */}
      <section>
        <button
          onClick={() => setShowBlocked(b => !b)}
          className="text-gray-500 hover:text-gray-300 text-sm font-semibold mb-3 flex items-center gap-1"
        >
          {showBlocked ? '▾' : '▸'} Blocked Keywords ({blocked.length})
        </button>
        {showBlocked && (
          <div className="flex flex-col gap-1">
            {blocked.map(kw => (
              <div
                key={kw.id}
                className="flex items-center justify-between px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg"
              >
                <span className="text-gray-500 text-sm line-through">{kw.term}</span>
                <button
                  onClick={() => unblockKeyword(kw.id)}
                  className="text-gray-500 hover:text-green-400 text-xs transition-colors"
                >
                  Unblock
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test:run -- src/components/admin/__tests__/KeywordsPage.test.jsx
```
Expected: 5 passed

- [ ] **Step 5: Run all tests**

```bash
npm run test:run
```
Expected: all tests pass

- [ ] **Step 6: Commit**

```bash
git add src/pages/admin/KeywordsPage.jsx src/components/admin/__tests__/KeywordsPage.test.jsx
git commit -m "feat: add KeywordsPage admin page"
```

---

## Task 11: Update App.jsx — add keywords route

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Add the import and route**

In `src/App.jsx`, add the import after the existing admin imports:

```jsx
import KeywordsPage from './pages/admin/KeywordsPage'
```

Replace the admin route block (currently only has `<Route index ...>`):

```jsx
<Route
  path="/admin"
  element={<AdminGuard><AdminPage /></AdminGuard>}
>
  <Route index element={<ContentQueue />} />
  <Route path="keywords" element={<KeywordsPage />} />
</Route>
```

- [ ] **Step 2: Run all tests**

```bash
npm run test:run
```
Expected: all tests pass

- [ ] **Step 3: Commit**

```bash
git add src/App.jsx
git commit -m "feat: add /admin/keywords route"
```

---

## Task 12: Add env var

**Files:**
- Modify: `.env.local`

- [ ] **Step 1: Add the webhook URL**

Add this line to `.env.local` (get the URL from n8n after creating WF4 webhook trigger):

```
VITE_N8N_WF4_WEBHOOK_URL=https://YOUR_WORKSPACE.app.n8n.cloud/webhook/wf4-publisher
```

- [ ] **Step 2: Restart the dev server**

```bash
npm run dev
```
Expected: server starts on port 5174, no errors

---

## Task 13: Update n8n/wf1-research-agent.md — replace Perplexity with GPT-4o

**Files:**
- Modify: `n8n/wf1-research-agent.md`

- [ ] **Step 1: Update the credentials table**

Replace the Perplexity credential row:

```markdown
| Name | Type | Value |
|---|---|---|
| OpenAI     | Header Auth | Name: `Authorization` Value: `Bearer YOUR_OPENAI_KEY` |
| Anthropic  | Header Auth | Name: `x-api-key` Value: `YOUR_KEY` |
| Supabase   | Header Auth | Name: `apikey` Value: `YOUR_SERVICE_ROLE_KEY` |
```

Note: OpenAI credential already exists from WF3. Reuse the same credential.

- [ ] **Step 2: Replace Node 2**

Replace the `### Node 2 — Perplexity Research` section with:

```markdown
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
```

- [ ] **Step 3: Update Node 3 reference**

In Node 3 body, update the reference from `$node['Perplexity Research']` to `$node['GPT-4o Research']`:

```json
"content": "Given these trending topics:\n\n{{ $node['GPT-4o Research'].json.output[1].content[0].text }}\n\nReturn a JSON array of exactly 5 objects..."
```

- [ ] **Step 4: Commit**

```bash
git add n8n/wf1-research-agent.md
git commit -m "docs: update WF1 to use GPT-4o instead of Perplexity"
```

---

## Task 14: Update n8n/wf2-copy-agent.md — add YouTube node

**Files:**
- Modify: `n8n/wf2-copy-agent.md`

- [ ] **Step 1: Add YouTube to the platform system prompts table**

Add a row to the platform table:

```markdown
| YouTube   | "Write YouTube video metadata as JSON with three keys: title (max 60 chars, SEO-optimized), description (300–500 chars with [00:00] Intro timestamp placeholder and CTA to cicerowebstudio.xyz), tags (10–15 comma-separated tags). Return only the JSON object, no other text." |
```

- [ ] **Step 2: Add two new nodes after Node 14**

```markdown
### Node 15 — Claude YouTube Copy (HTTP Request)
Same configuration as Nodes 5–10. Use the YouTube prompt from the table above.
- Body:
```json
{
  "model": "claude-sonnet-4-6",
  "max_tokens": 512,
  "messages": [{
    "role": "user",
    "content": "Topic: {{ $('Loop Over Topics').item.json.topic }}\nKeywords: {{ $('Loop Over Topics').item.json.keywords.join(', ') }}\n\nWrite YouTube video metadata as JSON with three keys: title (max 60 chars, SEO-optimized), description (300–500 chars with [00:00] Intro timestamp placeholder and CTA to cicerowebstudio.xyz), tags (10–15 comma-separated tags). Return only the JSON object, no other text."
  }]
}
```
- Extract: `{{ $json.content[0].text }}`

### Node 16 — Save YouTube platform_post (HTTP Request → Supabase)
- URL: `https://YOUR_PROJECT.supabase.co/rest/v1/platform_posts`
- Method: POST
- Body:
```json
{
  "draft_id": "{{ $node['Save content_draft'].json[0].id }}",
  "platform": "youtube",
  "copy": "{{ $node['Claude YouTube Copy'].json.content[0].text }}",
  "status": "pending"
}
```
```

- [ ] **Step 3: Commit**

```bash
git add n8n/wf2-copy-agent.md
git commit -m "docs: update WF2 to generate YouTube metadata"
```

---

## Task 15: Create n8n/wf4-publisher.md

**Files:**
- Create: `n8n/wf4-publisher.md`

- [ ] **Step 1: Create the file**

```markdown
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
const results = $node['Node 10'].json;
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
```

- [ ] **Step 2: Commit**

```bash
git add n8n/wf4-publisher.md
git commit -m "docs: add WF4 publisher agent setup guide"
```

---

## Task 16: Create n8n/wf5-keyword-agent.md

**Files:**
- Create: `n8n/wf5-keyword-agent.md`

- [ ] **Step 1: Create the file**

```markdown
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
```

- [ ] **Step 2: Commit**

```bash
git add n8n/wf5-keyword-agent.md
git commit -m "docs: add WF5 keyword AI agent setup guide"
```

---

## Final Verification

- [ ] **Run full test suite**

```bash
npm run test:run
```
Expected: all tests pass, 0 failures

- [ ] **Start dev server and smoke test**

```bash
npm run dev
```
Navigate to `http://localhost:5174/admin`:
1. Verify 3 tabs render (Pending / Published / YouTube)
2. Navigate to `/admin/keywords` — page renders with 3 sections
3. Check sidebar — Keywords link is active and routes correctly

- [ ] **Final commit tag**

```bash
git tag phase2-complete
```
