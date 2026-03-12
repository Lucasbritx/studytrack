import { GroupCard } from './group-card'
import { EmptyState } from '@/components/shared/empty-state'
import { Users } from 'lucide-react'
import type { Group, MemberRole } from '@/types/database'

type GroupWithRole = Group & {
  role?: MemberRole
  memberCount?: number
}

interface GroupListProps {
  groups: GroupWithRole[]
}

export function GroupList({ groups }: GroupListProps) {
  if (groups.length === 0) {
    return (
      <EmptyState
        icon={<Users className="h-12 w-12" />}
        title="No groups yet"
        description="Create a new mentorship group or join an existing one with an invite code."
      />
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {groups.map((group) => (
        <GroupCard key={group.id} group={group} />
      ))}
    </div>
  )
}
