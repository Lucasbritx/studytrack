import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, User } from 'lucide-react'
import type { Meeting, Profile } from '@/types/database'

type MeetingWithPresenter = Meeting & {
  presenter?: Pick<Profile, 'id' | 'username' | 'full_name' | 'avatar_url'> | null
}

interface MeetingCardProps {
  meeting: MeetingWithPresenter
  groupId: string
}

export function MeetingCard({ meeting, groupId }: MeetingCardProps) {
  const meetingDate = new Date(meeting.meeting_date)
  const isPast = meetingDate < new Date()
  const isToday = meetingDate.toDateString() === new Date().toDateString()

  const formattedDate = meetingDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

  const formattedTime = meetingDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })

  function getInitials(presenter: NonNullable<MeetingWithPresenter['presenter']>) {
    if (presenter.full_name) {
      return presenter.full_name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return presenter.username?.[0]?.toUpperCase() || 'U'
  }

  return (
    <Link href={`/groups/${groupId}/meetings/${meeting.id}`}>
      <Card className={`hover:shadow-md transition-shadow cursor-pointer ${isPast ? 'opacity-60' : ''}`}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base line-clamp-1">{meeting.title}</CardTitle>
            {isToday && !isPast && (
              <Badge variant="default" className="shrink-0">Today</Badge>
            )}
            {isPast && (
              <Badge variant="secondary" className="shrink-0">Past</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {meeting.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {meeting.description}
            </p>
          )}
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>{formattedTime}</span>
            </div>
          </div>

          {meeting.presenter && (
            <div className="flex items-center gap-2">
              <Avatar className="h-5 w-5">
                <AvatarImage src={meeting.presenter.avatar_url ?? undefined} />
                <AvatarFallback className="text-[10px]">
                  {getInitials(meeting.presenter)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">
                {meeting.presenter.full_name || meeting.presenter.username}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
