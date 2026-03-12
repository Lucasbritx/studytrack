import { createClient } from '@/lib/supabase/server'

export async function getTopics() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('topics')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getTopicsWithStats() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('topics')
    .select(`
      *,
      resources (id),
      study_sessions (duration_minutes)
    `)
    .order('updated_at', { ascending: false })

  if (error) throw error

  return data.map((topic) => ({
    ...topic,
    totalStudyMinutes:
      topic.study_sessions?.reduce(
        (sum, s) => sum + (s.duration_minutes || 0),
        0
      ) || 0,
    resourceCount: topic.resources?.length || 0,
  }))
}

export async function getTopic(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('topics')
    .select(`
      *,
      resources (*),
      study_sessions (*)
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function getActiveTopics(limit = 5) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('topics')
    .select('id, title, status, updated_at')
    .eq('status', 'studying')
    .order('updated_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}
