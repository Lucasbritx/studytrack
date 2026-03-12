import { SessionCard } from './session-card'
import { EmptyState } from '@/components/shared/empty-state'
import { Clock } from 'lucide-react'
import type { StudySession, Topic } from '@/types/database'

type SessionWithTopic = StudySession & {
  topics?: Pick<Topic, 'id' | 'title'> | null
}

interface SessionListProps {
  sessions: SessionWithTopic[]
}

export function SessionList({ sessions }: SessionListProps) {
  if (sessions.length === 0) {
    return (
      <EmptyState
        icon={<Clock className="h-12 w-12" />}
        title="No study sessions yet"
        description="Log your first study session to start tracking your learning progress."
      />
    )
  }

  // Group sessions by date
  const groupedSessions = sessions.reduce<Record<string, SessionWithTopic[]>>(
    (groups, session) => {
      const date = session.session_date
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(session)
      return groups
    },
    {}
  )

  const sortedDates = Object.keys(groupedSessions).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  )

  return (
    <div className="space-y-8">
      {sortedDates.map((date) => {
        const dateObj = new Date(date)
        const isToday = new Date().toDateString() === dateObj.toDateString()
        const isYesterday = new Date(Date.now() - 86400000).toDateString() === dateObj.toDateString()
        
        let dateLabel = dateObj.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        })
        
        if (isToday) dateLabel = 'Today'
        else if (isYesterday) dateLabel = 'Yesterday'

        const totalMinutes = groupedSessions[date].reduce(
          (sum, s) => sum + s.duration_minutes,
          0
        )
        const hours = Math.floor(totalMinutes / 60)
        const mins = totalMinutes % 60

        return (
          <div key={date}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-sm">{dateLabel}</h3>
              <span className="text-xs text-muted-foreground">
                {hours > 0 ? `${hours}h ` : ''}{mins}m total
              </span>
            </div>
            <div className="space-y-3">
              {groupedSessions[date].map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
