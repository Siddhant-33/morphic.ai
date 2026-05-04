'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { cn } from '@/lib/utils'
import { useSidebar } from '@/components/ui/sidebar'
import { Button } from './ui/button'
import GuestMenu from './guest-menu'
import UserMenu from './user-menu'

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
        'absolute top-0 right-0 p-2 md:p-3 flex justify-between items-center z-10 backdrop-blur-sm lg:backdrop-blur-none bg-background/80 lg:bg-transparent transition-[width] duration-200 ease-linear',
        open ? 'md:w-[calc(100%-var(--sidebar-width))]' : 'md:w-full',
        'w-full'
      )}
    >
      {/* Left side - empty for now */}
      <div></div>

      {/* Center - "Made by" credit */}
      <div className="absolute left-1/2 transform -translate-x-1/2">
        <span className="text-sm text-muted-foreground font-medium">
          Made by Siddhant Ray ❤
        </span>
      </div>

      {/* Right side - Feedback + User menu */}
      <div className="flex items-center gap-2">
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
