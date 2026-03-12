import { createClient } from '@/lib/supabase/server'

export async function getMyGroups() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('group_members')
    .select(`
      role,
      groups (
        id,
        name,
        description,
        is_public,
        invite_code,
        created_by,
        created_at
      )
    `)
    .eq('user_id', user.id)
    .order('joined_at', { ascending: false })

  if (error) throw error
  
  return data.map(item => ({
    ...item.groups,
    role: item.role,
  }))
}

export async function getGroup(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function getGroupWithMembers(id: string) {
  const supabase = await createClient()

  const { data: group, error: groupError } = await supabase
    .from('groups')
    .select('*')
    .eq('id', id)
    .single()

  if (groupError) throw groupError

  const { data: members, error: membersError } = await supabase
    .from('group_members')
    .select(`
      id,
      role,
      joined_at,
      profiles (
        id,
        username,
        full_name,
        avatar_url
      )
    `)
    .eq('group_id', id)
    .order('role', { ascending: true })
    .order('joined_at', { ascending: true })

  if (membersError) throw membersError

  return {
    ...group,
    members: members.map(m => ({
      id: m.id,
      role: m.role,
      joined_at: m.joined_at,
      ...m.profiles,
    })),
  }
}

export async function getGroupByInviteCode(inviteCode: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('groups')
    .select('id, name, description')
    .eq('invite_code', inviteCode)
    .single()

  if (error) return null
  return data
}

export async function isUserGroupMember(groupId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data, error } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single()

  return !error && !!data
}

export async function isUserGroupAdmin(groupId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data, error } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single()

  return !error && data?.role === 'admin'
}

export async function getUserMembership(groupId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('group_members')
    .select('id, role')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single()

  if (error) return null
  return data
}
