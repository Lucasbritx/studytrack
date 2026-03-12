import { PageHeader } from '@/components/shared/page-header'
import { GroupForm } from '@/components/groups/group-form'
import { Card, CardContent } from '@/components/ui/card'

export const metadata = {
  title: 'Create Group | StudyTrack',
  description: 'Create a new mentorship group',
}

export default function NewGroupPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Group"
        description="Start a new mentorship group and invite others to join."
      />

      <Card className="max-w-2xl">
        <CardContent className="pt-6">
          <GroupForm />
        </CardContent>
      </Card>
    </div>
  )
}
