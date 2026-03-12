'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { removeMember, updateMemberRole } from '@/lib/actions/groups'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MoreVertical, Shield, User, UserMinus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Profile, MemberRole } from '@/types/database'

type Member = {
  id: string
  role: MemberRole
  joined_at: string
} & Pick<Profile, 'id' | 'username' | 'full_name' | 'avatar_url'>

interface MemberListProps {
  groupId: string
  members: Member[]
  isAdmin: boolean
  currentUserId: string
}

export function MemberList({ groupId, members, isAdmin, currentUserId }: MemberListProps) {
  const router = useRouter()
  const [loadingMemberId, setLoadingMemberId] = useState<string | null>(null)

  async function handleRemove(memberId: string) {
    setLoadingMemberId(memberId)
    const result = await removeMember(groupId, memberId)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Member removed')
      router.refresh()
    }
    setLoadingMemberId(null)
  }

  async function handleRoleChange(memberId: string, newRole: MemberRole) {
    setLoadingMemberId(memberId)
    const result = await updateMemberRole(groupId, memberId, newRole)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Role updated')
      router.refresh()
    }
    setLoadingMemberId(null)
  }

  function getInitials(member: Member) {
    if (member.full_name) {
      return member.full_name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return member.username?.[0]?.toUpperCase() || 'U'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Members ({members.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {members.map((member) => {
          const isCurrentUser = member.id === currentUserId
          const isLoading = loadingMemberId === member.id

          return (
            <div key={member.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={member.avatar_url ?? undefined} />
                  <AvatarFallback className="text-xs">
                    {getInitials(member)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">
                    {member.full_name || member.username || 'Anonymous'}
                    {isCurrentUser && (
                      <span className="text-muted-foreground ml-1">(you)</span>
                    )}
                  </p>
                  {member.username && member.full_name && (
                    <p className="text-xs text-muted-foreground">@{member.username}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                  {member.role === 'admin' ? (
                    <Shield className="mr-1 h-3 w-3" />
                  ) : (
                    <User className="mr-1 h-3 w-3" />
                  )}
                  {member.role}
                </Badge>
                
                {isAdmin && !isCurrentUser && (
                  <DropdownMenu>
                    <DropdownMenuTrigger 
                      className="inline-flex shrink-0 items-center justify-center rounded-lg h-8 w-8 hover:bg-muted disabled:pointer-events-none disabled:opacity-50" 
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MoreVertical className="h-4 w-4" />
                      )}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {member.role === 'member' ? (
                        <DropdownMenuItem onClick={() => handleRoleChange(member.id, 'admin')}>
                          <Shield className="mr-2 h-4 w-4" />
                          Make Admin
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => handleRoleChange(member.id, 'member')}>
                          <User className="mr-2 h-4 w-4" />
                          Remove Admin
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleRemove(member.id)}
                      >
                        <UserMinus className="mr-2 h-4 w-4" />
                        Remove from Group
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
