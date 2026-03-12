import { Suspense } from 'react'
import Link from 'next/link'
import { getTopics } from '@/lib/queries/topics'
import { getRecentSessions, getSessionStats } from '@/lib/queries/sessions'
import { getMyUpcomingMeetings } from '@/lib/queries/meetings'
import { getMyGroups } from '@/lib/queries/groups'
import { PageHeader } from '@/components/shared/page-header'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/topics/status-badge'
import { BookOpen, Clock, Users, Flame, Calendar, ArrowRight } from 'lucide-react'

export const metadata = {
  title: 'Dashboard | StudyTrack',
  description: 'Your learning dashboard',
}

async function DashboardStats() {
  const [sessionStats, topics, groups] = await Promise.all([
    getSessionStats(),
    getTopics(),
    getMyGroups(),
  ])

  const hours = Math.floor(sessionStats.totalMinutes / 60)
  const minutes = sessionStats.totalMinutes % 60

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Topics</CardTitle>
          <BookOpen className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{topics.length}</div>
          <p className="text-xs text-muted-foreground">
            Study topics created
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Study Time</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`}
          </div>
          <p className="text-xs text-muted-foreground">
            Total time studied
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Groups</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{groups.length}</div>
          <p className="text-xs text-muted-foreground">
            Mentorship groups joined
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Streak</CardTitle>
          <Flame className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{sessionStats.streak} days</div>
          <p className="text-xs text-muted-foreground">
            Current study streak
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

async function ActiveTopics() {
  const topics = await getTopics()
  const activeTopics = topics.filter(t => t.status === 'studying').slice(0, 5)

  if (activeTopics.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-muted-foreground mb-4">
          No active topics yet. Start by creating your first study topic.
        </p>
        <Link href="/topics/new">
          <Button size="sm">Create Topic</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {activeTopics.map((topic) => (
        <Link key={topic.id} href={`/topics/${topic.id}`} className="block">
          <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm truncate">{topic.title}</p>
              {topic.description && (
                <p className="text-xs text-muted-foreground truncate mt-1">
                  {topic.description}
                </p>
              )}
            </div>
            <StatusBadge status={topic.status} />
          </div>
        </Link>
      ))}
      {topics.filter(t => t.status === 'studying').length > 5 && (
        <Link href="/topics" className="block">
          <Button variant="ghost" size="sm" className="w-full">
            View all topics
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      )}
    </div>
  )
}

async function UpcomingMeetings() {
  const meetings = await getMyUpcomingMeetings(5)

  if (meetings.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-muted-foreground mb-4">
          No upcoming meetings. Join a group to see scheduled meetings.
        </p>
        <Link href="/groups">
          <Button size="sm">Browse Groups</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {meetings.map((meeting) => {
        const meetingDate = new Date(meeting.meeting_date)
        const formattedDate = meetingDate.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        })
        const formattedTime = meetingDate.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        })

        return (
          <Link 
            key={meeting.id} 
            href={`/groups/${meeting.group_id}/meetings/${meeting.id}`}
            className="block"
          >
            <div className="p-3 rounded-lg border hover:bg-muted/50 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{meeting.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {meeting.groups?.name}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-medium">{formattedDate}</p>
                  <p className="text-xs text-muted-foreground">{formattedTime}</p>
                </div>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

async function RecentSessions() {
  const sessions = await getRecentSessions(5)

  if (sessions.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-muted-foreground mb-4">
          No study sessions logged yet. Start tracking your learning time.
        </p>
        <Link href="/sessions/new">
          <Button size="sm">Log Session</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {sessions.map((session) => {
        const hours = Math.floor(session.duration_minutes / 60)
        const mins = session.duration_minutes % 60
        const formattedDate = new Date(session.session_date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })

        return (
          <div key={session.id} className="flex items-center justify-between p-3 rounded-lg border">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm truncate">
                {session.topics?.title || 'Unknown Topic'}
              </p>
              {session.notes && (
                <p className="text-xs text-muted-foreground truncate mt-1">
                  {session.notes}
                </p>
              )}
            </div>
            <div className="text-right shrink-0 ml-4">
              <p className="text-sm font-medium">
                {hours > 0 ? `${hours}h ` : ''}{mins}m
              </p>
              <p className="text-xs text-muted-foreground">{formattedDate}</p>
            </div>
          </div>
        )
      })}
      <Link href="/sessions" className="block">
        <Button variant="ghost" size="sm" className="w-full">
          View all sessions
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </Link>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Track your learning progress"
      />

      <Suspense fallback={<LoadingSpinner />}>
        <DashboardStats />
      </Suspense>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Active Topics</CardTitle>
            <Link href="/topics">
              <Button variant="ghost" size="sm">
                <BookOpen className="mr-2 h-4 w-4" />
                All Topics
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<LoadingSpinner />}>
              <ActiveTopics />
            </Suspense>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Upcoming Meetings</CardTitle>
            <Link href="/groups">
              <Button variant="ghost" size="sm">
                <Calendar className="mr-2 h-4 w-4" />
                All Groups
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<LoadingSpinner />}>
              <UpcomingMeetings />
            </Suspense>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Study Sessions</CardTitle>
          <Link href="/sessions/new">
            <Button size="sm">
              <Clock className="mr-2 h-4 w-4" />
              Log Session
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<LoadingSpinner />}>
            <RecentSessions />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
