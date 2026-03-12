import { TopicCard } from './topic-card'
import type { Topic } from '@/types/database'

interface TopicListProps {
  topics: (Topic & {
    totalStudyMinutes?: number
    resourceCount?: number
  })[]
}

export function TopicList({ topics }: TopicListProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {topics.map((topic) => (
        <TopicCard key={topic.id} topic={topic} />
      ))}
    </div>
  )
}
