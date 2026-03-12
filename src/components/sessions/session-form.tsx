'use client'

import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { createSession, type ActionState } from '@/lib/actions/sessions'
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
import type { Topic } from '@/types/database'

interface SessionFormProps {
  topics: Pick<Topic, 'id' | 'title'>[]
  defaultTopicId?: string
}

export function SessionForm({ topics, defaultTopicId }: SessionFormProps) {
  const router = useRouter()
  const today = new Date().toISOString().split('T')[0]

  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    createSession,
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
        <Label htmlFor="topic_id">Topic *</Label>
        <Select name="topic_id" defaultValue={defaultTopicId} required>
          <SelectTrigger>
            <SelectValue placeholder="Select a topic" />
          </SelectTrigger>
          <SelectContent>
            {topics.map((topic) => (
              <SelectItem key={topic.id} value={topic.id}>
                {topic.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Duration *</Label>
        <div className="flex gap-4">
          <div className="flex-1">
            <Label htmlFor="hours" className="text-xs text-muted-foreground">
              Hours
            </Label>
            <Input
              id="hours"
              name="hours"
              type="number"
              min="0"
              max="24"
              defaultValue="0"
              placeholder="0"
            />
          </div>
          <div className="flex-1">
            <Label htmlFor="minutes" className="text-xs text-muted-foreground">
              Minutes
            </Label>
            <Input
              id="minutes"
              name="minutes"
              type="number"
              min="0"
              max="59"
              defaultValue="30"
              placeholder="30"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="session_date">Date *</Label>
        <Input
          id="session_date"
          name="session_date"
          type="date"
          defaultValue={today}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          placeholder="What did you learn? Any key takeaways?"
          rows={4}
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Log Session
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
