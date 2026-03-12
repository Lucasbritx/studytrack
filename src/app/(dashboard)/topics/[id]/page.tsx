import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getTopic } from '@/lib/queries/topics'
import { TopicForm } from '@/components/topics/topic-form'
import { StatusBadge } from '@/components/topics/status-badge'
import { DeleteTopicButton } from '@/components/topics/delete-topic-button'
import { ResourceList } from '@/components/resources/resource-list'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Clock, FileText, Calendar } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface TopicDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function TopicDetailPage({ params }: TopicDetailPageProps) {
  const { id } = await params

  let topic
  try {
    topic = await getTopic(id)
  } catch {
    notFound()
  }

  const totalStudyMinutes = topic.study_sessions?.reduce(
    (sum, s) => sum + s.duration_minutes,
    0
  ) || 0
  const hours = Math.floor(totalStudyMinutes / 60)
  const minutes = totalStudyMinutes % 60

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/topics">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <PageHeader title={topic.title}>
            <StatusBadge status={topic.status} />
          </PageHeader>
        </div>
      </div>

      {topic.description && (
        <p className="text-muted-foreground max-w-2xl">{topic.description}</p>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Study Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {hours > 0 ? `${hours}h ` : ''}{minutes}m
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{topic.resources?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{topic.study_sessions?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium">
              {formatDistanceToNow(new Date(topic.updated_at), { addSuffix: true })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {topic.notes ? (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{topic.notes}</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No notes yet. Add notes in the Settings tab.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <ResourceList 
            resources={topic.resources || []} 
            topicId={topic.id}
          />
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Study Sessions</h3>
            <Button size="sm" asChild>
              <Link href={`/sessions/new?topicId=${topic.id}`}>
                Log Session
              </Link>
            </Button>
          </div>
          {topic.study_sessions && topic.study_sessions.length > 0 ? (
            <div className="space-y-2">
              {topic.study_sessions.map((session) => (
                <Card key={session.id}>
                  <CardContent className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {Math.floor(session.duration_minutes / 60) > 0 
                          ? `${Math.floor(session.duration_minutes / 60)}h ` 
                          : ''
                        }
                        {session.duration_minutes % 60}m
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(session.session_date).toLocaleDateString()}
                      </p>
                    </div>
                    {session.notes && (
                      <p className="text-sm text-muted-foreground max-w-md truncate">
                        {session.notes}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No study sessions logged yet. Start tracking your learning time.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Edit Topic</CardTitle>
            </CardHeader>
            <CardContent>
              <TopicForm topic={topic} />
            </CardContent>
          </Card>

          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Deleting this topic will also remove all associated resources and study sessions.
              </p>
              <DeleteTopicButton topicId={topic.id} topicTitle={topic.title} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
