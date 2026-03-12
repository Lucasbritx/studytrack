import { createClient } from '@/lib/supabase/server'
import { UserMenu } from './user-menu'
import { MobileNav } from './mobile-nav'

export async function Header() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id ?? '')
    .single()

  return (
    <header className="sticky top-0 z-50 h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-full items-center justify-between px-4 md:px-6">
        <MobileNav />
        
        <div className="flex-1" />
        
        <UserMenu
          email={user?.email || ''}
          fullName={profile?.full_name || user?.email || 'User'}
          avatarUrl={profile?.avatar_url}
        />
      </div>
    </header>
  )
}
