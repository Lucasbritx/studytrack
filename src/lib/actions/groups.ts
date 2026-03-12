'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { groupSchema, joinGroupSchema } from '@/lib/validations/groups'

export type ActionState = {
  error?: string
  success?: boolean
}

export async function createGroup(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  const rawData = {
    name: formData.get('name'),
    description: formData.get('description') || null,
    is_public: formData.get('is_public') === 'on',
  }

  const validated = groupSchema.safeParse(rawData)
  if (!validated.success) {
    return { error: validated.error.issues[0].message }
  }

  const { data, error } = await supabase
    .from('groups')
    .insert({
      ...validated.data,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (error) {
    console.error('Create group error:', error)
    return { error: 'Failed to create group' }
  }

  revalidatePath('/groups')
  redirect(`/groups/${data.id}`)
}

export async function updateGroup(
  id: string,
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  const rawData = {
    name: formData.get('name'),
    description: formData.get('description') || null,
    is_public: formData.get('is_public') === 'on',
  }

  const validated = groupSchema.safeParse(rawData)
  if (!validated.success) {
    return { error: validated.error.issues[0].message }
  }

  const { error } = await supabase
    .from('groups')
    .update(validated.data)
    .eq('id', id)

  if (error) {
    console.error('Update group error:', error)
    return { error: 'Failed to update group' }
  }

  revalidatePath('/groups')
  revalidatePath(`/groups/${id}`)
  redirect(`/groups/${id}`)
}

export async function deleteGroup(id: string): Promise<ActionState> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('groups')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Delete group error:', error)
    return { error: 'Failed to delete group' }
  }

  revalidatePath('/groups')
  redirect('/groups')
}

export async function joinGroup(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  const inviteCode = formData.get('invite_code') as string

  const validated = joinGroupSchema.safeParse({ invite_code: inviteCode })
  if (!validated.success) {
    return { error: validated.error.issues[0].message }
  }

  // Find group by invite code
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .select('id')
    .eq('invite_code', inviteCode)
    .single()

  if (groupError || !group) {
    return { error: 'Invalid invite code' }
  }

  // Check if already a member
  const { data: existingMember } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', group.id)
    .eq('user_id', user.id)
    .single()

  if (existingMember) {
    return { error: 'You are already a member of this group' }
  }

  // Join the group
  const { error } = await supabase
    .from('group_members')
    .insert({
      group_id: group.id,
      user_id: user.id,
      role: 'member',
    })

  if (error) {
    console.error('Join group error:', error)
    return { error: 'Failed to join group' }
  }

  revalidatePath('/groups')
  redirect(`/groups/${group.id}`)
}

export async function leaveGroup(groupId: string): Promise<ActionState> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  // Check if user is the only admin
  const { data: admins } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', groupId)
    .eq('role', 'admin')

  const { data: userMembership } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single()

  if (userMembership?.role === 'admin' && admins?.length === 1) {
    return { error: 'Cannot leave: you are the only admin. Transfer ownership or delete the group.' }
  }

  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Leave group error:', error)
    return { error: 'Failed to leave group' }
  }

  revalidatePath('/groups')
  redirect('/groups')
}

export async function removeMember(groupId: string, memberId: string): Promise<ActionState> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('id', memberId)
    .eq('group_id', groupId)

  if (error) {
    console.error('Remove member error:', error)
    return { error: 'Failed to remove member' }
  }

  revalidatePath(`/groups/${groupId}`)
  return { success: true }
}

export async function updateMemberRole(
  groupId: string,
  memberId: string,
  role: 'admin' | 'member'
): Promise<ActionState> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('group_members')
    .update({ role })
    .eq('id', memberId)
    .eq('group_id', groupId)

  if (error) {
    console.error('Update role error:', error)
    return { error: 'Failed to update role' }
  }

  revalidatePath(`/groups/${groupId}`)
  return { success: true }
}
