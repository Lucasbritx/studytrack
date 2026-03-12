import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Globe, Lock } from 'lucide-react'
import type { Group, MemberRole } from '@/types/database'

interface GroupCardProps {
  group: Group & {
    role?: MemberRole
    memberCount?: number
  }
}

export function GroupCard({ group }: GroupCardProps) {
  return (
    <Link href={`/groups/${group.id}`}>
      <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg line-clamp-1">{group.name}</CardTitle>
            <div className="flex items-center gap-2">
              {group.role === 'admin' && (
                <Badge variant="secondary" className="text-xs">
                  Admin
                </Badge>
              )}
              {group.is_public ? (
                <Globe className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Lock className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {group.description ? (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
              {group.description}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground italic mb-4">
              No description
            </p>
          )}
          {group.memberCount !== undefined && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>{group.memberCount} member{group.memberCount !== 1 ? 's' : ''}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
