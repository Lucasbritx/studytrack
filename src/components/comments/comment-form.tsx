'use client'

import { useActionState, useRef, useEffect } from 'react'
import { createComment, type ActionState } from '@/lib/actions/comments'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Send } from 'lucide-react'

interface CommentFormProps {
  meetingId: string
  groupId: string
}

export function CommentForm({ meetingId, groupId }: CommentFormProps) {
  const formRef = useRef<HTMLFormElement>(null)
  
  const action = createComment.bind(null, meetingId, groupId)
  
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    action,
    {}
  )

  // Reset form on success
  useEffect(() => {
    if (state.success) {
      formRef.current?.reset()
    }
  }, [state.success])

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <Textarea
        name="content"
        placeholder="Add a comment..."
        rows={2}
        required
      />

      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          Post
        </Button>
      </div>
    </form>
  )
}
