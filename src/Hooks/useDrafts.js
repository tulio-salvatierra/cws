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
    if (!error) setDrafts(prev => prev.filter(d => d.id !== id))
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
      .channel('content_drafts_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'content_drafts' },
        () => fetchDrafts()
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [statusFilter])

  return { drafts, loading, error, approveDraft, rejectDraft }
}
