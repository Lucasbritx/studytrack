import { z } from 'zod'

export const groupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional().nullable(),
  is_public: z.boolean().default(false),
})

export const joinGroupSchema = z.object({
  invite_code: z.string().length(12, 'Invalid invite code'),
})

export type GroupFormData = z.infer<typeof groupSchema>
export type JoinGroupFormData = z.infer<typeof joinGroupSchema>
