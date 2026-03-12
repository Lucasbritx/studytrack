'use client'

import { useTransition } from 'react'
import { deleteResource } from '@/lib/actions/resources'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ResourceTypeIcon } from './resource-type-icon'
import { ExternalLink, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Resource } from '@/types/database'

interface ResourceCardProps {
  resource: Resource
  canDelete?: boolean
}

export function ResourceCard({ resource, canDelete = true }: ResourceCardProps) {
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteResource(resource.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Resource deleted')
      }
    })
  }

  return (
    <Card>
      <CardContent className="py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <ResourceTypeIcon
            type={resource.type}
            className="h-4 w-4 text-muted-foreground flex-shrink-0"
          />
          <div className="min-w-0">
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium hover:underline flex items-center gap-1"
            >
              <span className="truncate">{resource.title}</span>
              <ExternalLink className="h-3 w-3 flex-shrink-0" />
            </a>
            <p className="text-xs text-muted-foreground capitalize">
              {resource.type}
            </p>
          </div>
        </div>
        {canDelete && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
