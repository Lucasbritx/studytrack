import { Suspense } from 'react'
import Link from 'next/link'
import { getMyGroups } from '@/lib/queries/groups'
import { PageHeader } from '@/components/shared/page-header'
import { GroupList } from '@/components/groups/group-list'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { Button } from '@/components/ui/button'
import { UserPlus } from 'lucide-react'

export const metadata = {
  title: 'Groups | StudyTrack',
  description: 'Your mentorship groups',
}

async function GroupsContent() {
  const groups = await getMyGroups()

  return <GroupList groups={groups as any} />
}

export default function GroupsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Groups"
          description="Collaborate with others in mentorship groups."
        />
        <div className="flex gap-2">
          <Link href="/groups/join">
            <Button variant="outline">
              <UserPlus className="mr-2 h-4 w-4" />
              Join Group
            </Button>
          </Link>
          <Link href="/groups/new">
            <Button>Create Group</Button>
          </Link>
        </div>
      </div>

      <Suspense fallback={<LoadingSpinner />}>
        <GroupsContent />
      </Suspense>
    </div>
  )
}
