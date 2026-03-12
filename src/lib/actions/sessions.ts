'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { sessionSchema } from '@/lib/validations/sessions'

export type ActionState = {
  error?: string
  success?: boolean
}

export async function createSession(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  const hours = parseInt(formData.get('hours') as string) || 0
  const minutes = parseInt(formData.get('minutes') as string) || 0
  const duration_minutes = hours * 60 + minutes

  const rawData = {
    topic_id: formData.get('topic_id'),
    duration_minutes,
    notes: formData.get('notes'),
    session_date: formData.get('session_date'),
  }

  const validated = sessionSchema.safeParse(rawData)
  if (!validated.success) {
    return { error: validated.error.issues[0].message }
  }

  const { error } = await supabase.from('study_sessions').insert({
    ...validated.data,
    user_id: user.id,
  })

  if (error) {
    console.error('Create session error:', error)
    return { error: 'Failed to log session' }
  }

  revalidatePath('/sessions')
  revalidatePath('/dashboard')
  revalidatePath(`/topics/${validated.data.topic_id}`)
  redirect('/sessions')
}

export async function deleteSession(id: string): Promise<ActionState> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  // Get session to know which topic to revalidate
  const { data: session } = await supabase
    .from('study_sessions')
    .select('topic_id')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('study_sessions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Delete session error:', error)
    return { error: 'Failed to delete session' }
  }

  revalidatePath('/sessions')
  revalidatePath('/dashboard')
  if (session?.topic_id) {
    revalidatePath(`/topics/${session.topic_id}`)
  }

  return { success: true }
}
