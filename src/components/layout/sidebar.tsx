'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  BookOpen,
  Clock,
  Home,
  Users,
  User,
  GraduationCap,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/topics', label: 'Topics', icon: BookOpen },
  { href: '/sessions', label: 'Sessions', icon: Clock },
  { href: '/groups', label: 'Groups', icon: Users },
  { href: '/profile', label: 'Profile', icon: User },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-gray-50 dark:bg-gray-900 border-r">
      {/* Logo */}
      <div className="flex items-center h-16 px-6 border-b">
        <Link href="/dashboard" className="flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-primary" />
          <span className="font-semibold text-lg">StudyTrack</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
