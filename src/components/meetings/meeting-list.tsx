import { MeetingCard } from './meeting-card'
import { EmptyState } from '@/components/shared/empty-state'
import { Calendar } from 'lucide-react'
import type { Meeting, Profile } from '@/types/database'

type MeetingWithPresenter = Meeting & {
  presenter?: Pick<Profile, 'id' | 'username' | 'full_name' | 'avatar_url'> | null
}

interface MeetingListProps {
  meetings: MeetingWithPresenter[]
  groupId: string
  emptyMessage?: string
}

export function MeetingList({ meetings, groupId, emptyMessage }: MeetingListProps) {
  if (meetings.length === 0) {
    return (
      <EmptyState
        icon={<Calendar className="h-12 w-12" />}
        title="No meetings"
        description={emptyMessage || "No meetings scheduled yet."}
      />
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {meetings.map((meeting) => (
        <MeetingCard key={meeting.id} meeting={meeting} groupId={groupId} />
      ))}
    </div>
  )
}
