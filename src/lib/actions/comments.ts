'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { commentSchema } from '@/lib/validations/comments'

export type ActionState = {
  error?: string
  success?: boolean
}

export async function createComment(
  meetingId: string,
  groupId: string,
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  const rawData = {
    content: formData.get('content'),
  }

  const validated = commentSchema.safeParse(rawData)
  if (!validated.success) {
    return { error: validated.error.issues[0].message }
  }

  const { error } = await supabase
    .from('comments')
    .insert({
      meeting_id: meetingId,
      user_id: user.id,
      content: validated.data.content,
    })

  if (error) {
    console.error('Create comment error:', error)
    return { error: 'Failed to post comment' }
  }

  revalidatePath(`/groups/${groupId}/meetings/${meetingId}`)
  return { success: true }
}

export async function updateComment(
  commentId: string,
  meetingId: string,
  groupId: string,
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  const rawData = {
    content: formData.get('content'),
  }

  const validated = commentSchema.safeParse(rawData)
  if (!validated.success) {
    return { error: validated.error.issues[0].message }
  }

  const { error } = await supabase
    .from('comments')
    .update({ content: validated.data.content })
    .eq('id', commentId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Update comment error:', error)
    return { error: 'Failed to update comment' }
  }

  revalidatePath(`/groups/${groupId}/meetings/${meetingId}`)
  return { success: true }
}

export async function deleteComment(
  commentId: string,
  meetingId: string,
  groupId: string
): Promise<ActionState> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)

  if (error) {
    console.error('Delete comment error:', error)
    return { error: 'Failed to delete comment' }
  }

  revalidatePath(`/groups/${groupId}/meetings/${meetingId}`)
  return { success: true }
}
