'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { resourceSchema } from '@/lib/validations/resources'

export type ActionState = {
  error?: string
  success?: boolean
}

export async function createResource(
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
    url: formData.get('url'),
    type: formData.get('type') || 'article',
    topic_id: formData.get('topic_id') || null,
    meeting_id: formData.get('meeting_id') || null,
  }

  const validated = resourceSchema.safeParse(rawData)
  if (!validated.success) {
    return { error: validated.error.errors[0].message }
  }

  if (!validated.data.topic_id && !validated.data.meeting_id) {
    return { error: 'Resource must be attached to a topic or meeting' }
  }

  const { error } = await supabase.from('resources').insert({
    ...validated.data,
    created_by: user.id,
  })

  if (error) {
    console.error('Create resource error:', error)
    return { error: 'Failed to create resource' }
  }

  if (validated.data.topic_id) {
    revalidatePath(`/topics/${validated.data.topic_id}`)
  }
  if (validated.data.meeting_id) {
    revalidatePath(`/groups`)
  }

  return { success: true }
}

export async function deleteResource(id: string): Promise<ActionState> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  // Get the resource first to know which path to revalidate
  const { data: resource } = await supabase
    .from('resources')
    .select('topic_id, meeting_id')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('resources')
    .delete()
    .eq('id', id)
    .eq('created_by', user.id)

  if (error) {
    console.error('Delete resource error:', error)
    return { error: 'Failed to delete resource' }
  }

  if (resource?.topic_id) {
    revalidatePath(`/topics/${resource.topic_id}`)
  }

  return { success: true }
}
