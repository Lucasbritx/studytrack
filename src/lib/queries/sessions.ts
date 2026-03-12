import { createClient } from '@/lib/supabase/server'

export async function getSessions() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('study_sessions')
    .select(`
      *,
      topics (id, title)
    `)
    .order('session_date', { ascending: false })

  if (error) throw error
  return data
}

export async function getSessionsByTopic(topicId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('study_sessions')
    .select('*')
    .eq('topic_id', topicId)
    .order('session_date', { ascending: false })

  if (error) throw error
  return data
}

export async function getRecentSessions(limit = 5) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('study_sessions')
    .select(`
      *,
      topics (id, title)
    `)
    .order('session_date', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

export async function getSessionStats() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('study_sessions')
    .select('duration_minutes, session_date')

  if (error) throw error

  const totalMinutes = data.reduce((sum, s) => sum + s.duration_minutes, 0)
  const totalSessions = data.length

  // Calculate streak
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const sortedDates = [...new Set(data.map(s => s.session_date))].sort().reverse()
  let streak = 0
  let checkDate = new Date(today)

  for (const dateStr of sortedDates) {
    const sessionDate = new Date(dateStr)
    sessionDate.setHours(0, 0, 0, 0)
    
    const diffDays = Math.floor((checkDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays <= 1) {
      streak++
      checkDate = sessionDate
    } else {
      break
    }
  }

  return {
    totalMinutes,
    totalSessions,
    streak,
  }
}
