import { TopicStatus } from '@/types/database'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: TopicStatus
  className?: string
}

const statusConfig: Record<TopicStatus, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  not_started: { label: 'Not Started', variant: 'outline' },
  studying: { label: 'Studying', variant: 'default' },
  completed: { label: 'Completed', variant: 'secondary' },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <Badge variant={config.variant} className={cn(className)}>
      {config.label}
    </Badge>
  )
}
