'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { topicSchema } from '@/lib/validations/topics'
import type { TopicStatus } from '@/types/database'

export type ActionState = {
  error?: string
  success?: boolean
}

export async function createTopic(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  const rawData = {
    title: formData.get('title'),
    description: formData.get('description'),
    status: formData.get('status') || 'not_started',
    notes: formData.get('notes'),
  }

  const validated = topicSchema.safeParse(rawData)
  if (!validated.success) {
    return { error: validated.error.errors[0].message }
  }

  const { error } = await supabase.from('topics').insert({
    ...validated.data,
    user_id: user.id,
  })

  if (error) {
    console.error('Create topic error:', error)
    return { error: 'Failed to create topic' }
  }

  revalidatePath('/topics')
  revalidatePath('/dashboard')
  redirect('/topics')
}

export async function updateTopic(
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
    title: formData.get('title'),
    description: formData.get('description'),
    status: formData.get('status') || 'not_started',
    notes: formData.get('notes'),
  }

  const validated = topicSchema.safeParse(rawData)
  if (!validated.success) {
    return { error: validated.error.errors[0].message }
  }

  const { error } = await supabase
    .from('topics')
    .update(validated.data)
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Update topic error:', error)
    return { error: 'Failed to update topic' }
  }

  revalidatePath(`/topics/${id}`)
  revalidatePath('/topics')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteTopic(id: string): Promise<ActionState> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('topics')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Delete topic error:', error)
    return { error: 'Failed to delete topic' }
  }

  revalidatePath('/topics')
  revalidatePath('/dashboard')
  redirect('/topics')
}

export async function updateTopicStatus(
  id: string,
  status: TopicStatus
): Promise<ActionState> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('topics')
    .update({ status })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Update topic status error:', error)
    return { error: 'Failed to update status' }
  }

  revalidatePath('/topics')
  revalidatePath(`/topics/${id}`)
  revalidatePath('/dashboard')
  return { success: true }
}
