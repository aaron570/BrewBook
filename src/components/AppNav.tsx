'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Coffee, BookOpen, PlusCircle, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface AppNavProps {
  orgName: string
  userRole: string
}

export default function AppNav({ orgName, userRole }: AppNavProps) {
  const router = useRouter()
  const pathname = usePathname()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const canEdit = userRole === 'owner' || userRole === 'manager'

  return (
    <header className="bg-amber-900 text-white shadow-md">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Coffee className="h-6 w-6" />
            <span className="font-bold text-lg hidden sm:block">BrewBook</span>
          </Link>
          <div className="h-6 w-px bg-amber-700" />
          <span className="text-amber-200 text-sm font-medium truncate max-w-[160px]">{orgName}</span>
          <Badge variant="outline" className="text-amber-200 border-amber-600 text-xs capitalize hidden sm:inline-flex">
            {userRole}
          </Badge>
        </div>

        <nav className="flex items-center gap-2">
          <Link href="/dashboard">
            <Button
              variant="ghost"
              size="sm"
              className={`text-amber-100 hover:text-white hover:bg-amber-800 ${pathname === '/dashboard' ? 'bg-amber-800' : ''}`}
            >
              <BookOpen className="h-4 w-4 mr-1.5" />
              Recipes
            </Button>
          </Link>
          {canEdit && (
            <Link href="/recipes/new">
              <Button size="sm" className="bg-amber-600 hover:bg-amber-500 text-white">
                <PlusCircle className="h-4 w-4 mr-1.5" />
                New Recipe
              </Button>
            </Link>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="text-amber-200 hover:text-white hover:bg-amber-800"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </nav>
      </div>
    </header>
  )
}
