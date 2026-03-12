import Link from 'next/link'
import { getTopicsWithStats } from '@/lib/queries/topics'
import { TopicList } from '@/components/topics/topic-list'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import { PlusIcon, BookOpen } from 'lucide-react'

export default async function TopicsPage() {
  const topics = await getTopicsWithStats()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Study Topics"
        description="Manage your learning topics"
      >
        <Button asChild>
          <Link href="/topics/new">
            <PlusIcon className="mr-2 h-4 w-4" />
            New Topic
          </Link>
        </Button>
      </PageHeader>

      {topics.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-12 w-12" />}
          title="No topics yet"
          description="Create your first study topic to start tracking your learning."
          action={
            <Button asChild>
              <Link href="/topics/new">
                <PlusIcon className="mr-2 h-4 w-4" />
                Create Topic
              </Link>
            </Button>
          }
        />
      ) : (
        <TopicList topics={topics} />
      )}
    </div>
  )
}
