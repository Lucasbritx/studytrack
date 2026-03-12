'use client'

import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { createMeeting, updateMeeting, type ActionState } from '@/lib/actions/meetings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'
import type { Meeting, Profile } from '@/types/database'

type Member = Pick<Profile, 'id' | 'username' | 'full_name'>

interface MeetingFormProps {
  groupId: string
  meeting?: Meeting
  members: Member[]
}

export function MeetingForm({ groupId, meeting, members }: MeetingFormProps) {
  const router = useRouter()
  const isEditing = !!meeting

  // Parse existing meeting date/time
  let defaultDate = ''
  let defaultTime = ''
  if (meeting?.meeting_date) {
    const date = new Date(meeting.meeting_date)
    defaultDate = date.toISOString().split('T')[0]
    defaultTime = date.toTimeString().slice(0, 5)
  } else {
    // Default to tomorrow at 10:00
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    defaultDate = tomorrow.toISOString().split('T')[0]
    defaultTime = '10:00'
  }

  const action = isEditing
    ? updateMeeting.bind(null, meeting.id, groupId)
    : createMeeting.bind(null, groupId)

  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    action,
    {}
  )

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          name="title"
          defaultValue={meeting?.title}
          placeholder="e.g., Weekly React Study Session"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={meeting?.description ?? ''}
          placeholder="What will this meeting cover?"
          rows={2}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="meeting_date">Date *</Label>
          <Input
            id="meeting_date"
            name="meeting_date"
            type="date"
            defaultValue={defaultDate}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="meeting_time">Time *</Label>
          <Input
            id="meeting_time"
            name="meeting_time"
            type="time"
            defaultValue={defaultTime}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="presenter_id">Presenter</Label>
        <Select name="presenter_id" defaultValue={meeting?.presenter_id ?? undefined}>
          <SelectTrigger>
            <SelectValue placeholder="Select a presenter (optional)" />
          </SelectTrigger>
          <SelectContent>
            {members.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {member.full_name || member.username || 'Anonymous'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="agenda">Agenda</Label>
        <Textarea
          id="agenda"
          name="agenda"
          defaultValue={meeting?.agenda ?? ''}
          placeholder="Meeting agenda or topics to discuss..."
          rows={4}
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? 'Save Changes' : 'Create Meeting'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
