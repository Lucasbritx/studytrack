import { z } from 'zod'

export const meetingSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional().nullable(),
  meeting_date: z.string().min(1, 'Meeting date is required'),
  meeting_time: z.string().min(1, 'Meeting time is required'),
  agenda: z.string().max(2000, 'Agenda too long').optional().nullable(),
  presenter_id: z.string().uuid().optional().nullable(),
})

export type MeetingFormData = z.infer<typeof meetingSchema>
