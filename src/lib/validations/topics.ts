import { z } from 'zod'

export const topicSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(100, 'Title must be less than 100 characters'),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .nullable()
    .transform(val => val || null),
  status: z.enum(['not_started', 'studying', 'completed']).default('not_started'),
  notes: z
    .string()
    .max(5000, 'Notes must be less than 5000 characters')
    .optional()
    .nullable()
    .transform(val => val || null),
})

export type TopicInput = z.infer<typeof topicSchema>
