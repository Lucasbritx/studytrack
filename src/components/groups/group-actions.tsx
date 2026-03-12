'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { leaveGroup, deleteGroup } from '@/lib/actions/groups'
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
import { LogOut, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface GroupActionsProps {
  groupId: string
  isAdmin: boolean
}

export function GroupActions({ groupId, isAdmin }: GroupActionsProps) {
  const router = useRouter()
  const [isLeaving, setIsLeaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleLeave() {
    setIsLeaving(true)
    const result = await leaveGroup(groupId)

    if (result.error) {
      toast.error(result.error)
      setIsLeaving(false)
    }
  }

  async function handleDelete() {
    setIsDeleting(true)
    const result = await deleteGroup(groupId)

    if (result.error) {
      toast.error(result.error)
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex gap-2">
      <AlertDialog>
        <AlertDialogTrigger className="inline-flex shrink-0 items-center justify-center rounded-lg h-8 gap-1.5 px-2.5 text-sm font-medium border border-border bg-background hover:bg-muted">
          <LogOut className="mr-2 h-4 w-4" />
          Leave Group
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave Group</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to leave this group? You'll need an invite code to rejoin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLeave} disabled={isLeaving}>
              {isLeaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isAdmin && (
        <AlertDialog>
          <AlertDialogTrigger className="inline-flex shrink-0 items-center justify-center rounded-lg h-8 gap-1.5 px-2.5 text-sm font-medium bg-destructive/10 text-destructive hover:bg-destructive/20">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Group
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Group</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the group and all its meetings. This action cannot be undone.
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
      )}
    </div>
  )
}
