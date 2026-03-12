'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { meetingSchema } from '@/lib/validations/meetings'

export type ActionState = {
  error?: string
  success?: boolean
}

export async function createMeeting(
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
    title: formData.get('title'),
    description: formData.get('description') || null,
    meeting_date: formData.get('meeting_date'),
    meeting_time: formData.get('meeting_time'),
    agenda: formData.get('agenda') || null,
    presenter_id: formData.get('presenter_id') || null,
  }

  const validated = meetingSchema.safeParse(rawData)
  if (!validated.success) {
    return { error: validated.error.errors[0].message }
  }

  // Combine date and time into ISO string
  const meetingDateTime = new Date(`${validated.data.meeting_date}T${validated.data.meeting_time}`)

  const { data, error } = await supabase
    .from('meetings')
    .insert({
      group_id: groupId,
      title: validated.data.title,
      description: validated.data.description,
      meeting_date: meetingDateTime.toISOString(),
      agenda: validated.data.agenda,
      presenter_id: validated.data.presenter_id,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (error) {
    console.error('Create meeting error:', error)
    return { error: 'Failed to create meeting' }
  }

  revalidatePath(`/groups/${groupId}`)
  redirect(`/groups/${groupId}/meetings/${data.id}`)
}

export async function updateMeeting(
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
    title: formData.get('title'),
    description: formData.get('description') || null,
    meeting_date: formData.get('meeting_date'),
    meeting_time: formData.get('meeting_time'),
    agenda: formData.get('agenda') || null,
    presenter_id: formData.get('presenter_id') || null,
  }

  const validated = meetingSchema.safeParse(rawData)
  if (!validated.success) {
    return { error: validated.error.errors[0].message }
  }

  // Combine date and time into ISO string
  const meetingDateTime = new Date(`${validated.data.meeting_date}T${validated.data.meeting_time}`)

  const { error } = await supabase
    .from('meetings')
    .update({
      title: validated.data.title,
      description: validated.data.description,
      meeting_date: meetingDateTime.toISOString(),
      agenda: validated.data.agenda,
      presenter_id: validated.data.presenter_id,
    })
    .eq('id', meetingId)

  if (error) {
    console.error('Update meeting error:', error)
    return { error: 'Failed to update meeting' }
  }

  revalidatePath(`/groups/${groupId}`)
  revalidatePath(`/groups/${groupId}/meetings/${meetingId}`)
  redirect(`/groups/${groupId}/meetings/${meetingId}`)
}

export async function deleteMeeting(meetingId: string, groupId: string): Promise<ActionState> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('meetings')
    .delete()
    .eq('id', meetingId)

  if (error) {
    console.error('Delete meeting error:', error)
    return { error: 'Failed to delete meeting' }
  }

  revalidatePath(`/groups/${groupId}`)
  redirect(`/groups/${groupId}`)
}
