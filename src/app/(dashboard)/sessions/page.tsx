import { Suspense } from 'react'
import Link from 'next/link'
import { getSessions, getSessionStats } from '@/lib/queries/sessions'
import { PageHeader } from '@/components/shared/page-header'
import { SessionList } from '@/components/sessions/session-list'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, Calendar, Flame, Plus } from 'lucide-react'

export const metadata = {
  title: 'Study Sessions | StudyTrack',
  description: 'Track your study sessions',
}

async function SessionStats() {
  const stats = await getSessionStats()
  
  const hours = Math.floor(stats.totalMinutes / 60)
  const minutes = stats.totalMinutes % 60

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardContent className="flex items-center gap-4 pt-6">
          <div className="rounded-full bg-primary/10 p-3">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Time</p>
            <p className="text-2xl font-bold">
              {hours > 0 ? `${hours}h ` : ''}{minutes}m
            </p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex items-center gap-4 pt-6">
          <div className="rounded-full bg-primary/10 p-3">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Sessions</p>
            <p className="text-2xl font-bold">{stats.totalSessions}</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex items-center gap-4 pt-6">
          <div className="rounded-full bg-orange-500/10 p-3">
            <Flame className="h-5 w-5 text-orange-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Current Streak</p>
            <p className="text-2xl font-bold">{stats.streak} days</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

async function SessionsContent() {
  const sessions = await getSessions()

  return <SessionList sessions={sessions} />
}

export default function SessionsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Study Sessions"
        description="Track your learning progress and build consistent study habits."
      >
        <Link href="/sessions/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Log Session
          </Button>
        </Link>
      </PageHeader>

      <Suspense fallback={<LoadingSpinner />}>
        <SessionStats />
      </Suspense>

      <Suspense fallback={<LoadingSpinner />}>
        <SessionsContent />
      </Suspense>
    </div>
  )
}
