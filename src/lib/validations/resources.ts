import { z } from 'zod'

export const resourceSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  url: z.string().url('Must be a valid URL'),
  type: z.enum(['article', 'video', 'documentation', 'github', 'other']).default('article'),
  topic_id: z.string().uuid().optional().nullable(),
  meeting_id: z.string().uuid().optional().nullable(),
})

export type ResourceInput = z.infer<typeof resourceSchema>
