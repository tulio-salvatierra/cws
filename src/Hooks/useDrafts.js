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
