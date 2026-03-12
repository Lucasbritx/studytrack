import Link from 'next/link'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from './status-badge'
import { Clock, FileText } from 'lucide-react'
import type { Topic } from '@/types/database'

interface TopicCardProps {
  topic: Topic & {
    totalStudyMinutes?: number
    resourceCount?: number
  }
}

export function TopicCard({ topic }: TopicCardProps) {
  const hours = Math.floor((topic.totalStudyMinutes || 0) / 60)
  const minutes = (topic.totalStudyMinutes || 0) % 60

  return (
    <Link href={`/topics/${topic.id}`}>
      <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg line-clamp-1">{topic.title}</CardTitle>
            <StatusBadge status={topic.status} />
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          {topic.description ? (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {topic.description}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              No description
            </p>
          )}
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground gap-4">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>
              {hours > 0 ? `${hours}h ` : ''}{minutes}m studied
            </span>
          </div>
          <div className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            <span>{topic.resourceCount || 0} resources</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}
