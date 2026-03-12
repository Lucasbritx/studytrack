import { z } from 'zod'

export const sessionSchema = z.object({
  topic_id: z.string().uuid('Please select a topic'),
  duration_minutes: z
    .number({ message: 'Duration is required' })
    .int()
    .positive('Duration must be positive')
    .max(1440, 'Duration cannot exceed 24 hours'),
  notes: z
    .string()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional()
    .nullable()
    .transform(val => val || null),
  session_date: z.string().min(1, 'Date is required'),
})

export type SessionInput = z.infer<typeof sessionSchema>
