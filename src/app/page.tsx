import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { GraduationCap, BookOpen, Users, Clock, ArrowRight } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">StudyTrack</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <main className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Track Your Learning Journey
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            A platform for developers to track study progress, log learning sessions, 
            and collaborate with mentorship groups.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="gap-2">
                Start Learning <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-24">
          <div className="text-center p-6 rounded-lg border bg-card">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
              <BookOpen className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Track Topics</h3>
            <p className="text-muted-foreground">
              Organize your study topics with resources, notes, and progress tracking.
            </p>
          </div>
          <div className="text-center p-6 rounded-lg border bg-card">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
              <Clock className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Log Sessions</h3>
            <p className="text-muted-foreground">
              Track your study time and see how much effort you&apos;re putting into learning.
            </p>
          </div>
          <div className="text-center p-6 rounded-lg border bg-card">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Join Groups</h3>
            <p className="text-muted-foreground">
              Collaborate with mentorship groups, schedule meetings, and share resources.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t mt-16">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <GraduationCap className="h-5 w-5" />
            <span>StudyTrack</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Built for developers who love learning.
          </p>
        </div>
      </footer>
    </div>
  )
}
