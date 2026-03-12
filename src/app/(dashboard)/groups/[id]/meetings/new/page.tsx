import { notFound, redirect } from 'next/navigation'
import { getGroup, isUserGroupMember, getGroupWithMembers } from '@/lib/queries/groups'
import { PageHeader } from '@/components/shared/page-header'
import { MeetingForm } from '@/components/meetings/meeting-form'
import { Card, CardContent } from '@/components/ui/card'

interface NewMeetingPageProps {
  params: Promise<{ id: string }>
}

export const metadata = {
  title: 'Schedule Meeting | StudyTrack',
  description: 'Schedule a new group meeting',
}

export default async function NewMeetingPage({ params }: NewMeetingPageProps) {
  const { id: groupId } = await params
  
  const isMember = await isUserGroupMember(groupId)
  if (!isMember) {
    redirect('/groups')
  }

  let group
  try {
    group = await getGroupWithMembers(groupId)
  } catch {
    notFound()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Schedule Meeting"
        description={`Create a new meeting for ${group.name}`}
      />

      <Card className="max-w-2xl">
        <CardContent className="pt-6">
          <MeetingForm groupId={groupId} members={group.members} />
        </CardContent>
      </Card>
    </div>
  )
}
