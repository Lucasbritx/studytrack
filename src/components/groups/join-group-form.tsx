'use client'

import { useActionState } from 'react'
import { joinGroup, type ActionState } from '@/lib/actions/groups'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'

export function JoinGroupForm() {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    joinGroup,
    {}
  )

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="invite_code">Invite Code</Label>
        <Input
          id="invite_code"
          name="invite_code"
          placeholder="Enter 12-character invite code"
          maxLength={12}
          required
        />
        <p className="text-xs text-muted-foreground">
          Ask the group admin for the invite code
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Join Group
      </Button>
    </form>
  )
}
