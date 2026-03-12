import { PageHeader } from '@/components/shared/page-header'
import { JoinGroupForm } from '@/components/groups/join-group-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata = {
  title: 'Join Group | StudyTrack',
  description: 'Join an existing mentorship group',
}

export default function JoinGroupPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Join Group"
        description="Enter an invite code to join an existing group."
      />

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Enter Invite Code</CardTitle>
        </CardHeader>
        <CardContent>
          <JoinGroupForm />
        </CardContent>
      </Card>
    </div>
  )
}
