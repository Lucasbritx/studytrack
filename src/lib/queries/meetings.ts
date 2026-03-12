import { createClient } from '@/lib/supabase/server'

export async function getMeetingsByGroup(groupId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('meetings')
    .select(`
      *,
      presenter:profiles!meetings_presenter_id_fkey (id, username, full_name, avatar_url)
    `)
    .eq('group_id', groupId)
    .order('meeting_date', { ascending: true })

  if (error) throw error
  return data
}

export async function getUpcomingMeetingsByGroup(groupId: string) {
  const supabase = await createClient()
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('meetings')
    .select(`
      *,
      presenter:profiles!meetings_presenter_id_fkey (id, username, full_name, avatar_url)
    `)
    .eq('group_id', groupId)
    .gte('meeting_date', now)
    .order('meeting_date', { ascending: true })

  if (error) throw error
  return data
}

export async function getPastMeetingsByGroup(groupId: string) {
  const supabase = await createClient()
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('meetings')
    .select(`
      *,
      presenter:profiles!meetings_presenter_id_fkey (id, username, full_name, avatar_url)
    `)
    .eq('group_id', groupId)
    .lt('meeting_date', now)
    .order('meeting_date', { ascending: false })

  if (error) throw error
  return data
}

export async function getMeeting(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('meetings')
    .select(`
      *,
      presenter:profiles!meetings_presenter_id_fkey (id, username, full_name, avatar_url),
      groups (id, name)
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function getMeetingWithComments(id: string) {
  const supabase = await createClient()

  const { data: meeting, error: meetingError } = await supabase
    .from('meetings')
    .select(`
      *,
      presenter:profiles!meetings_presenter_id_fkey (id, username, full_name, avatar_url),
      groups (id, name)
    `)
    .eq('id', id)
    .single()

  if (meetingError) throw meetingError

  const { data: comments, error: commentsError } = await supabase
    .from('comments')
    .select(`
      *,
      profiles (id, username, full_name, avatar_url)
    `)
    .eq('meeting_id', id)
    .order('created_at', { ascending: true })

  if (commentsError) throw commentsError

  const { data: resources, error: resourcesError } = await supabase
    .from('resources')
    .select('*')
    .eq('meeting_id', id)
    .order('created_at', { ascending: false })

  if (resourcesError) throw resourcesError

  return {
    ...meeting,
    comments,
    resources,
  }
}

export async function getMyUpcomingMeetings(limit = 5) {
  const supabase = await createClient()
  const now = new Date().toISOString()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // Get user's groups
  const { data: memberships } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', user.id)

  if (!memberships || memberships.length === 0) return []

  const groupIds = memberships.map(m => m.group_id)

  const { data, error } = await supabase
    .from('meetings')
    .select(`
      *,
      groups (id, name),
      presenter:profiles!meetings_presenter_id_fkey (id, username, full_name)
    `)
    .in('group_id', groupIds)
    .gte('meeting_date', now)
    .order('meeting_date', { ascending: true })
    .limit(limit)

  if (error) throw error
  return data
}
