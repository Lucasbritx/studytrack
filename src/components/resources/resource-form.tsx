'use client'

import { useActionState } from 'react'
import { createResource, type ActionState } from '@/lib/actions/resources'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PlusIcon, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'

interface ResourceFormProps {
  topicId?: string
  meetingId?: string
  trigger?: React.ReactNode
}

export function ResourceForm({ topicId, meetingId, trigger }: ResourceFormProps) {
  const [open, setOpen] = useState(false)
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    createResource,
    {}
  )

  useEffect(() => {
    if (state.success) {
      setOpen(false)
    }
  }, [state.success])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger className="inline-flex shrink-0 items-center justify-center">
          {trigger}
        </DialogTrigger>
      ) : (
        <DialogTrigger className="inline-flex shrink-0 items-center justify-center rounded-lg h-8 gap-1.5 px-2.5 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/80">
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Resource
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Resource</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          {topicId && <input type="hidden" name="topic_id" value={topicId} />}
          {meetingId && <input type="hidden" name="meeting_id" value={meetingId} />}

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
              placeholder="e.g., React Documentation"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">URL *</Label>
            <Input
              id="url"
              name="url"
              type="url"
              placeholder="https://..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select name="type" defaultValue="article">
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="article">Article</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="documentation">Documentation</SelectItem>
                <SelectItem value="github">GitHub</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Resource
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
