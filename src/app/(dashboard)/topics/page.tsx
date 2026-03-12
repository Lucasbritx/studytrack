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
        <Link href="/topics/new">
          <Button>
            <PlusIcon className="mr-2 h-4 w-4" />
            New Topic
          </Button>
        </Link>
      </PageHeader>

      {topics.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-12 w-12" />}
          title="No topics yet"
          description="Create your first study topic to start tracking your learning."
          action={
            <Link href="/topics/new">
              <Button>
                <PlusIcon className="mr-2 h-4 w-4" />
                Create Topic
              </Button>
            </Link>
          }
        />
      ) : (
        <TopicList topics={topics} />
      )}
    </div>
  )
}
