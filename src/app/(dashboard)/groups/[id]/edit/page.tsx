import { notFound, redirect } from 'next/navigation'
import { getGroup, isUserGroupAdmin } from '@/lib/queries/groups'
import { PageHeader } from '@/components/shared/page-header'
import { GroupForm } from '@/components/groups/group-form'
import { Card, CardContent } from '@/components/ui/card'

interface EditGroupPageProps {
  params: Promise<{ id: string }>
}

export const metadata = {
  title: 'Edit Group | StudyTrack',
  description: 'Edit group settings',
}

export default async function EditGroupPage({ params }: EditGroupPageProps) {
  const { id } = await params
  
  const isAdmin = await isUserGroupAdmin(id)
  if (!isAdmin) {
    redirect(`/groups/${id}`)
  }

  let group
  try {
    group = await getGroup(id)
  } catch {
    notFound()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Group"
        description="Update your group settings."
      />

      <Card className="max-w-2xl">
        <CardContent className="pt-6">
          <GroupForm group={group} />
        </CardContent>
      </Card>
    </div>
  )
}
