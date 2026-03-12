import { redirect } from 'next/navigation'
import { getTopics } from '@/lib/queries/topics'
import { PageHeader } from '@/components/shared/page-header'
import { SessionForm } from '@/components/sessions/session-form'
import { Card, CardContent } from '@/components/ui/card'

export const metadata = {
  title: 'Log Session | StudyTrack',
  description: 'Log a new study session',
}

interface NewSessionPageProps {
  searchParams: Promise<{ topic?: string }>
}

export default async function NewSessionPage({ searchParams }: NewSessionPageProps) {
  const { topic: topicId } = await searchParams
  const topics = await getTopics()

  if (topics.length === 0) {
    redirect('/topics/new?message=Create a topic first before logging sessions')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Log Study Session"
        description="Record what you studied and for how long."
      />

      <Card className="max-w-2xl">
        <CardContent className="pt-6">
          <SessionForm topics={topics} defaultTopicId={topicId} />
        </CardContent>
      </Card>
    </div>
  )
}
