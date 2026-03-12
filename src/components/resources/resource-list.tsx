import { ResourceCard } from './resource-card'
import { ResourceForm } from './resource-form'
import { EmptyState } from '@/components/shared/empty-state'
import { FileText } from 'lucide-react'
import type { Resource } from '@/types/database'

interface ResourceListProps {
  resources: Resource[]
  topicId?: string
  meetingId?: string
  canAdd?: boolean
  canDelete?: boolean
}

export function ResourceList({
  resources,
  topicId,
  meetingId,
  canAdd = true,
  canDelete = true,
}: ResourceListProps) {
  return (
    <div className="space-y-4">
      {canAdd && (
        <div className="flex justify-end">
          <ResourceForm topicId={topicId} meetingId={meetingId} />
        </div>
      )}

      {resources.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-10 w-10" />}
          title="No resources yet"
          description="Add articles, videos, or documentation to help with your learning."
          action={
            canAdd ? (
              <ResourceForm topicId={topicId} meetingId={meetingId} />
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-2">
          {resources.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              canDelete={canDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
