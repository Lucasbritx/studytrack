'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteComment } from '@/lib/actions/comments'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreVertical, Pencil, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Comment, Profile } from '@/types/database'

type CommentWithProfile = Comment & {
  profiles?: Pick<Profile, 'id' | 'username' | 'full_name' | 'avatar_url'> | null
}

interface CommentItemProps {
  comment: CommentWithProfile
  meetingId: string
  groupId: string
  currentUserId: string
  isGroupAdmin: boolean
}

export function CommentItem({
  comment,
  meetingId,
  groupId,
  currentUserId,
  isGroupAdmin,
}: CommentItemProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  
  const isOwner = comment.user_id === currentUserId
  const canDelete = isOwner || isGroupAdmin

  function getInitials() {
    if (comment.profiles?.full_name) {
      return comment.profiles.full_name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return comment.profiles?.username?.[0]?.toUpperCase() || 'U'
  }

  async function handleDelete() {
    setIsDeleting(true)
    const result = await deleteComment(comment.id, meetingId, groupId)

    if (result.error) {
      toast.error(result.error)
      setIsDeleting(false)
    } else {
      toast.success('Comment deleted')
      router.refresh()
    }
  }

  const formattedDate = new Date(comment.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  return (
    <div className="flex gap-3 group">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src={comment.profiles?.avatar_url ?? undefined} />
        <AvatarFallback className="text-xs">{getInitials()}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {comment.profiles?.full_name || comment.profiles?.username || 'Anonymous'}
          </span>
          <span className="text-xs text-muted-foreground">
            {formattedDate}
          </span>
          {canDelete && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <MoreVertical className="h-3 w-3" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  className="text-destructive"
                  onClick={handleDelete}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
          {comment.content}
        </p>
      </div>
    </div>
  )
}
