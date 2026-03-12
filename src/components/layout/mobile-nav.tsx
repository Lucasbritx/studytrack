'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  BookOpen,
  Clock,
  Home,
  Users,
  User,
  Menu,
  X,
  GraduationCap,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/topics', label: 'Topics', icon: BookOpen },
  { href: '/sessions', label: 'Sessions', icon: Clock },
  { href: '/groups', label: 'Groups', icon: Users },
  { href: '/profile', label: 'Profile', icon: User },
]

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {isOpen && (
        <div className="fixed inset-0 top-16 z-50 bg-background">
          <nav className="p-4 space-y-2">
            <div className="flex items-center gap-2 px-3 py-4 mb-4 border-b">
              <GraduationCap className="h-6 w-6 text-primary" />
              <span className="font-semibold text-lg">StudyTrack</span>
            </div>
            
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
              const Icon = item.icon

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium transition-colors',
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
        </div>
      )}
    </div>
  )
}
