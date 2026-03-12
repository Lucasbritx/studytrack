'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { profileSchema } from '@/lib/validations/profile'

export type ActionState = {
  error?: string
  success?: boolean
}

export async function updateProfile(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  const rawData = {
    username: formData.get('username') || null,
    full_name: formData.get('full_name') || null,
    bio: formData.get('bio') || null,
  }

  const validated = profileSchema.safeParse(rawData)
  if (!validated.success) {
    return { error: validated.error.issues[0].message }
  }

  // Check if username is taken (if provided)
  if (validated.data.username) {
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', validated.data.username)
      .neq('id', user.id)
      .single()

    if (existingUser) {
      return { error: 'Username is already taken' }
    }
  }

  const { error } = await supabase
    .from('profiles')
    .update(validated.data)
    .eq('id', user.id)

  if (error) {
    console.error('Update profile error:', error)
    return { error: 'Failed to update profile' }
  }

  revalidatePath('/profile')
  return { success: true }
}
