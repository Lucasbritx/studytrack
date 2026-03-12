import { z } from 'zod'

export const profileSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username too long')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .optional()
    .nullable(),
  full_name: z.string().max(100, 'Name too long').optional().nullable(),
  bio: z.string().max(500, 'Bio too long').optional().nullable(),
})

export type ProfileFormData = z.infer<typeof profileSchema>
