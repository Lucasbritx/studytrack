'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteMeeting } from '@/lib/actions/meetings'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface DeleteMeetingButtonProps {
  meetingId: string
  groupId: string
}

export function DeleteMeetingButton({ meetingId, groupId }: DeleteMeetingButtonProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    setIsDeleting(true)
    const result = await deleteMeeting(meetingId, groupId)

    if (result.error) {
      toast.error(result.error)
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger className="inline-flex shrink-0 items-center justify-center rounded-lg h-8 gap-1.5 px-2.5 text-sm font-medium bg-destructive/10 text-destructive hover:bg-destructive/20">
        <Trash2 className="mr-2 h-4 w-4" />
        Delete Meeting
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Meeting</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this meeting? All comments and resources will also be deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
