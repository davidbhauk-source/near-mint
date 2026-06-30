// src/hooks/use-runs.ts
'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

export type Run = {
  id: string
  title: string
  cover_url: string | null
  publisher: string | null
  summary: string | null
  start_year: number
  end_year: string | null
  creative_team: {
    writers: string[]
    artists: string[]
    colorists: string[]
    letterers: string[]
  } | null
  issue_count: number | null
}

export function useRuns() {
  const [runs, setRuns] = useState<Run[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function fetchRuns() {
      const { data, error } = await supabase
        .from('runs')
        .select('*')
        .order('title')

      if (error) {
        setError(error.message)
      } else {
        setRuns(data ?? [])
      }
      setLoading(false)
    }

    fetchRuns()
  }, [])

  return { runs, loading, error }
}