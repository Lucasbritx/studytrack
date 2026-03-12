import { redirect } from 'next/navigation'
import { getCurrentUserProfile } from '@/lib/queries/profile'
import { getSessionStats } from '@/lib/queries/sessions'
import { getTopics } from '@/lib/queries/topics'
import { getMyGroups } from '@/lib/queries/groups'
import { PageHeader } from '@/components/shared/page-header'
import { ProfileForm } from '@/components/profile/profile-form'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Clock, Users, Flame } from 'lucide-react'

export const metadata = {
  title: 'Profile | StudyTrack',
  description: 'Your profile settings',
}

export default async function ProfilePage() {
  const profileResult = await getCurrentUserProfile()

  if (!profileResult) {
    redirect('/login')
  }

  // Assign to new const after null check for TypeScript narrowing
  const profile = profileResult

  const [sessionStats, topics, groups] = await Promise.all([
    getSessionStats(),
    getTopics(),
    getMyGroups(),
  ])

  const hours = Math.floor(sessionStats.totalMinutes / 60)
  const minutes = sessionStats.totalMinutes % 60

  const initials = profile.full_name
    ? profile.full_name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : profile.username?.[0]?.toUpperCase() || profile.email?.[0]?.toUpperCase() || 'U'

  return (
    <div className="space-y-8">
      <PageHeader
        title="Profile"
        description="Manage your account settings"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent>
              <ProfileForm profile={profile} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-20 w-20 mb-4">
                  <AvatarImage src={profile.avatar_url ?? undefined} />
                  <AvatarFallback className="text-xl">{initials}</AvatarFallback>
                </Avatar>
                <h3 className="font-semibold text-lg">
                  {profile.full_name || profile.username || 'Anonymous'}
                </h3>
                {profile.username && (
                  <p className="text-sm text-muted-foreground">@{profile.username}</p>
                )}
                {profile.bio && (
                  <p className="text-sm text-muted-foreground mt-2">{profile.bio}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Topics</span>
                </div>
                <span className="font-medium">{topics.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Study Time</span>
                </div>
                <span className="font-medium">
                  {hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Groups</span>
                </div>
                <span className="font-medium">{groups.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <span className="text-sm">Streak</span>
                </div>
                <span className="font-medium">{sessionStats.streak} days</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
