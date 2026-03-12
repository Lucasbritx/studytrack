'use client'

import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { createGroup, updateGroup, type ActionState } from '@/lib/actions/groups'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'
import type { Group } from '@/types/database'

interface GroupFormProps {
  group?: Group
}

export function GroupForm({ group }: GroupFormProps) {
  const router = useRouter()
  const isEditing = !!group

  const action = isEditing
    ? updateGroup.bind(null, group.id)
    : createGroup

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
        <Label htmlFor="name">Group Name *</Label>
        <Input
          id="name"
          name="name"
          defaultValue={group?.name}
          placeholder="e.g., React Study Group"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={group?.description ?? ''}
          placeholder="What is this group about?"
          rows={3}
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <Label htmlFor="is_public">Public Group</Label>
          <p className="text-sm text-muted-foreground">
            Allow anyone to discover and view this group
          </p>
        </div>
        <Switch
          id="is_public"
          name="is_public"
          defaultChecked={group?.is_public ?? false}
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? 'Save Changes' : 'Create Group'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
