import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getMeetingWithComments } from '@/lib/queries/meetings'
import { isUserGroupAdmin, isUserGroupMember } from '@/lib/queries/groups'
import { createClient } from '@/lib/supabase/server'
import { DeleteMeetingButton } from '@/components/meetings/delete-meeting-button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Calendar, Clock, User, ArrowLeft, Pencil, FileText, MessageSquare } from 'lucide-react'

interface MeetingPageProps {
  params: Promise<{ id: string; meetingId: string }>
}

export async function generateMetadata({ params }: MeetingPageProps) {
  const { meetingId } = await params
  try {
    const meeting = await getMeetingWithComments(meetingId)
    return {
      title: `${meeting.title} | StudyTrack`,
      description: meeting.description || `Meeting: ${meeting.title}`,
    }
  } catch {
    return {
      title: 'Meeting | StudyTrack',
    }
  }
}

export default async function MeetingPage({ params }: MeetingPageProps) {
  const { id: groupId, meetingId } = await params
  
  let meeting
  try {
    meeting = await getMeetingWithComments(meetingId)
  } catch {
    notFound()
  }

  // Verify user has access
  const isMember = await isUserGroupMember(groupId)
  if (!isMember) {
    notFound()
  }

  const isAdmin = await isUserGroupAdmin(groupId)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isCreator = meeting.created_by === user?.id
  const canEdit = isAdmin || isCreator

  const meetingDate = new Date(meeting.meeting_date)
  const isPast = meetingDate < new Date()

  const formattedDate = meetingDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const formattedTime = meetingDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })

  function getInitials(name?: string | null, username?: string | null) {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    return username?.[0]?.toUpperCase() || 'U'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/groups/${groupId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Group
          </Button>
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold tracking-tight">{meeting.title}</h1>
            {isPast && <Badge variant="secondary">Past</Badge>}
          </div>
          <p className="text-muted-foreground">
            {meeting.groups?.name}
          </p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Link href={`/groups/${groupId}/meetings/${meetingId}/edit`}>
              <Button variant="outline" size="sm">
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </Link>
            <DeleteMeetingButton meetingId={meetingId} groupId={groupId} />
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {meeting.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{meeting.description}</p>
              </CardContent>
            </Card>
          )}

          {meeting.agenda && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Agenda
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{meeting.agenda}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Comments ({meeting.comments?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {meeting.comments && meeting.comments.length > 0 ? (
                <div className="space-y-4">
                  {meeting.comments.map((comment: any) => (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.profiles?.avatar_url ?? undefined} />
                        <AvatarFallback className="text-xs">
                          {getInitials(comment.profiles?.full_name, comment.profiles?.username)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {comment.profiles?.full_name || comment.profiles?.username || 'Anonymous'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(comment.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No comments yet. Be the first to comment!
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{formattedDate}</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{formattedTime}</span>
              </div>
              {meeting.presenter && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Presenter</p>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={meeting.presenter.avatar_url ?? undefined} />
                        <AvatarFallback className="text-xs">
                          {getInitials(meeting.presenter.full_name, meeting.presenter.username)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">
                        {meeting.presenter.full_name || meeting.presenter.username}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resources ({meeting.resources?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {meeting.resources && meeting.resources.length > 0 ? (
                <ul className="space-y-2">
                  {meeting.resources.map((resource: any) => (
                    <li key={resource.id}>
                      <a 
                        href={resource.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        {resource.title}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No resources shared yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
