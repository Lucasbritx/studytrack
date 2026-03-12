import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getGroupWithMembers, getUserMembership } from '@/lib/queries/groups'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { GroupActions } from '@/components/groups/group-actions'
import { MemberList } from '@/components/groups/member-list'
import { InviteCodeCard } from '@/components/groups/invite-code-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Settings, Calendar, Globe, Lock } from 'lucide-react'

interface GroupPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: GroupPageProps) {
  const { id } = await params
  try {
    const group = await getGroupWithMembers(id)
    return {
      title: `${group.name} | StudyTrack`,
      description: group.description || `Group: ${group.name}`,
    }
  } catch {
    return {
      title: 'Group | StudyTrack',
    }
  }
}

export default async function GroupPage({ params }: GroupPageProps) {
  const { id } = await params
  
  let group
  try {
    group = await getGroupWithMembers(id)
  } catch {
    notFound()
  }

  const membership = await getUserMembership(id)
  const isAdmin = membership?.role === 'admin'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold tracking-tight">{group.name}</h1>
            <Badge variant="outline">
              {group.is_public ? (
                <>
                  <Globe className="mr-1 h-3 w-3" />
                  Public
                </>
              ) : (
                <>
                  <Lock className="mr-1 h-3 w-3" />
                  Private
                </>
              )}
            </Badge>
          </div>
          {group.description && (
            <p className="text-muted-foreground">{group.description}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {isAdmin && (
            <Link href={`/groups/${id}/edit`}>
              <Button variant="outline" size="sm">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </Link>
          )}
          <Link href={`/groups/${id}/meetings/new`}>
            <Button size="sm">
              <Calendar className="mr-2 h-4 w-4" />
              Schedule Meeting
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Upcoming Meetings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                No upcoming meetings scheduled.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {isAdmin && <InviteCodeCard inviteCode={group.invite_code} />}
          
          <MemberList
            groupId={id}
            members={group.members}
            isAdmin={isAdmin}
            currentUserId={user?.id || ''}
          />

          <GroupActions groupId={id} isAdmin={isAdmin} />
        </div>
      </div>
    </div>
  )
}
