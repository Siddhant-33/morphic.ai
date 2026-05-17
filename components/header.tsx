'use client'
import React from 'react'
import { usePathname } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { cn } from '@/lib/utils'
import { useSidebar } from '@/components/ui/sidebar'
import { Button } from './ui/button'
import GuestMenu from './guest-menu'
import UserMenu from './user-menu'
import SearchModeSelector from './search-mode-selector'

interface HeaderProps {
  user: User | null
}

export const Header: React.FC<HeaderProps> = ({ user }) => {
  const { open } = useSidebar()
  const pathname = usePathname()
  const isRootPage = pathname === '/'

  return (
    <header
      className={cn(
        'absolute top-0 left-0 right-0 z-50 p-3 md:p-4 flex items-center justify-between bg-background/90 backdrop-blur-md border-b border-zinc-800',
        open && 'md:pl-[var(--sidebar-width)]'
      )}
    >
      {/* Left - Mode Selector */}
      <div className="flex items-center">
        <SearchModeSelector />
      </div>

      {/* Center - Brand / Credit */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 hidden md:block">
        <span className="text-sm text-muted-foreground font-medium">
          Made by Siddhant Ray ❤
        </span>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-3">
        {isRootPage && (
          <Button variant="outline" size="sm" asChild>
            <a href="mailto:siddhant.ray1589@gmail.com?subject=Morphic%20Feedback&body=Hi%20Siddhant,%0D%0A%0D%0AI%20wanted%20to%20share%20some%20feedback%20about%20Morphic:%0D%0A%0D%0A">
              Feedback
            </a>
          </Button>
        )}
        {user ? <UserMenu user={user} /> : <GuestMenu />}
      </div>
    </header>
  )
}

export default Header
