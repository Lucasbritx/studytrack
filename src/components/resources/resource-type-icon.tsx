import { ResourceType } from '@/types/database'
import { FileText, Video, BookOpen, Github, Link } from 'lucide-react'

interface ResourceTypeIconProps {
  type: ResourceType
  className?: string
}

const iconMap: Record<ResourceType, typeof FileText> = {
  article: FileText,
  video: Video,
  documentation: BookOpen,
  github: Github,
  other: Link,
}

export function ResourceTypeIcon({ type, className }: ResourceTypeIconProps) {
  const Icon = iconMap[type] || Link
  return <Icon className={className} />
}
