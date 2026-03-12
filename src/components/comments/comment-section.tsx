import { CommentItem } from './comment-item'
import { CommentForm } from './comment-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { MessageSquare } from 'lucide-react'
import type { Comment, Profile } from '@/types/database'

type CommentWithProfile = Comment & {
  profiles?: Pick<Profile, 'id' | 'username' | 'full_name' | 'avatar_url'> | null
}

interface CommentSectionProps {
  comments: CommentWithProfile[]
  meetingId: string
  groupId: string
  currentUserId: string
  isGroupAdmin: boolean
}

export function CommentSection({
  comments,
  meetingId,
  groupId,
  currentUserId,
  isGroupAdmin,
}: CommentSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Comments ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <CommentForm meetingId={meetingId} groupId={groupId} />
        
        {comments.length > 0 && (
          <>
            <Separator />
            <div className="space-y-4">
              {comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  meetingId={meetingId}
                  groupId={groupId}
                  currentUserId={currentUserId}
                  isGroupAdmin={isGroupAdmin}
                />
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
