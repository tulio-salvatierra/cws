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
