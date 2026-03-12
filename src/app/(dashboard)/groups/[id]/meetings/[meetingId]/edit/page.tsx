import { notFound, redirect } from 'next/navigation'
import { getMeeting } from '@/lib/queries/meetings'
import { isUserGroupAdmin, getGroupWithMembers } from '@/lib/queries/groups'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { MeetingForm } from '@/components/meetings/meeting-form'
import { Card, CardContent } from '@/components/ui/card'

interface EditMeetingPageProps {
  params: Promise<{ id: string; meetingId: string }>
}

export const metadata = {
  title: 'Edit Meeting | StudyTrack',
  description: 'Edit meeting details',
}

export default async function EditMeetingPage({ params }: EditMeetingPageProps) {
  const { id: groupId, meetingId } = await params
  
  // Check permissions
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  let meeting
  try {
    meeting = await getMeeting(meetingId)
  } catch {
    notFound()
  }

  const isAdmin = await isUserGroupAdmin(groupId)
  const isCreator = meeting.created_by === user?.id

  if (!isAdmin && !isCreator) {
    redirect(`/groups/${groupId}/meetings/${meetingId}`)
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
        title="Edit Meeting"
        description="Update meeting details."
      />

      <Card className="max-w-2xl">
        <CardContent className="pt-6">
          <MeetingForm groupId={groupId} meeting={meeting} members={group.members} />
        </CardContent>
      </Card>
    </div>
  )
}
