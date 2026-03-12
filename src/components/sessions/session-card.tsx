import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DeleteSessionButton } from './delete-session-button'
import { Clock, Calendar, BookOpen } from 'lucide-react'
import type { StudySession, Topic } from '@/types/database'

interface SessionCardProps {
  session: StudySession & {
    topics?: Pick<Topic, 'id' | 'title'> | null
  }
}

export function SessionCard({ session }: SessionCardProps) {
  const hours = Math.floor(session.duration_minutes / 60)
  const minutes = session.duration_minutes % 60

  const formattedDate = new Date(session.session_date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              {session.topics?.title || 'Unknown Topic'}
            </CardTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>
                  {hours > 0 ? `${hours}h ` : ''}{minutes}m
                </span>
              </div>
            </div>
          </div>
          <DeleteSessionButton sessionId={session.id} />
        </div>
      </CardHeader>
      {session.notes && (
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {session.notes}
          </p>
        </CardContent>
      )}
    </Card>
  )
}
