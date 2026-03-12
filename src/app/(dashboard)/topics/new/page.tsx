import { TopicForm } from '@/components/topics/topic-form'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'

export default function NewTopicPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="New Topic"
        description="Create a new study topic to track your learning"
      />

      <Card className="max-w-2xl">
        <CardContent className="pt-6">
          <TopicForm />
        </CardContent>
      </Card>
    </div>
  )
}
