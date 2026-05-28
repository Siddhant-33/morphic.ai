'use client'

import { useRouter } from 'next/navigation'

import { User } from '@supabase/supabase-js'
import {
  Link2,
  LogOut,
  Palette,
  Sparkles,
  Shield,
  Cpu,
  Crown
} from 'lucide-react'

import { createClient } from '@/lib/supabase/client'

import {
  Avatar,
  AvatarFallback,
  AvatarImage
} from '@/components/ui/avatar'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

import { Button } from './ui/button'
import { ExternalLinkItems } from './external-link-items'
import { ThemeMenuItems } from './theme-menu-items'

interface UserMenuProps {
  user: User
}

export default function UserMenu({
  user
}: UserMenuProps) {
  const router = useRouter()

  const userName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    'User'

  const avatarUrl =
    user.user_metadata?.avatar_url ||
    user.user_metadata?.picture

  const getInitials = (
    name: string,
    email: string | undefined
  ) => {
    if (name && name !== 'User') {
      const names = name.split(' ')

      if (names.length > 1) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
      }

      return name.substring(0, 2).toUpperCase()
    }

    if (email) {
      return email
        .split('@')[0]
        .substring(0, 2)
        .toUpperCase()
    }

    return 'U'
  }

  const handleLogout = async () => {
    const supabase = createClient()

    await supabase.auth.signOut()

    router.push('/')
    router.refresh()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative size-8 rounded-full"
        >
          <Avatar className="size-8 border border-white/10">
            <AvatarImage
              src={avatarUrl}
              alt={userName}
            />

            <AvatarFallback>
              {getInitials(
                userName,
                user.email
              )}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-80 border border-white/10 bg-black/95 text-white backdrop-blur-xl"
        align="end"
        forceMount
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="truncate text-sm font-semibold">
              {userName}
            </p>

            <p className="truncate text-xs text-zinc-400">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* THEME */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Palette className="mr-2 h-4 w-4" />
            <span>Theme</span>
          </DropdownMenuSubTrigger>

          <DropdownMenuSubContent className="border border-white/10 bg-black text-white">
            <ThemeMenuItems />
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* LINKS */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Link2 className="mr-2 h-4 w-4" />
            <span>Links</span>
          </DropdownMenuSubTrigger>

          <DropdownMenuSubContent className="border border-white/10 bg-black text-white">

            <DropdownMenuItem asChild>
              <a
                href="https://github.com/Siddhant-33"
                target="_blank"
              >
                GitHub
              </a>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <a href="/privacy-policy">
                Privacy Policy
              </a>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <a href="/developer-info">
                Developer Info
              </a>
            </DropdownMenuItem>

          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        {/* FEATURES */}
        <div className="px-3 py-2">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
            <Sparkles className="h-4 w-4 text-violet-400" />
            Morphic Features
          </div>

          <div className="space-y-2 text-xs text-zinc-400">

            <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-2">
              <div className="font-medium text-orange-300">
                Search Mode
              </div>
              Fast real-time AI answers.
            </div>

            <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-2">
              <div className="font-medium text-violet-300">
                Adaptive Mode
              </div>
              Smart balanced AI reasoning.
            </div>

            <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-2">
              <div className="font-medium text-cyan-300">
                Deep Research
              </div>
              Advanced multi-step analysis.
            </div>

            <div className="rounded-lg border border-pink-500/20 bg-pink-500/5 p-2">
              <div className="font-medium text-pink-300">
                Image Generation
              </div>
              AI image & artwork creation.
            </div>

            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2">
              <div className="font-medium text-emerald-300">
                Multi Source Intelligence
              </div>
              Combines AI + web intelligence.
            </div>

          </div>
        </div>

        <DropdownMenuSeparator />

        {/* PRICING */}
        <div className="px-3 py-2">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <Crown className="h-4 w-4 text-yellow-400" />
            Pricing Plans
          </div>

          <div className="space-y-2 text-xs">

            <div className="rounded-xl border border-violet-500/20 bg-violet-500/10 p-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">
                  Pro
                </span>

                <span className="font-bold text-violet-300">
                  ₹499/year
                </span>
              </div>

              <p className="mt-1 text-zinc-400">
                Unlimited chats + image generation
              </p>
            </div>

            <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">
                  Ultra
                </span>

                <span className="font-bold text-yellow-300">
                  ₹999/6 months
                </span>
              </div>

              <p className="mt-1 text-zinc-400">
                Full premium AI experience
              </p>
            </div>

          </div>
        </div>

        <DropdownMenuSeparator />

        {/* ABOUT */}
        <div className="px-3 py-3">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <Shield className="h-4 w-4 text-cyan-400" />
            About Morphic
          </div>

          <p className="text-xs leading-relaxed text-zinc-400">
            Morphic is an advanced AI-powered search and research platform
            created by Siddhant Ray under Shironel. Our mission is to deliver
            intelligent, fast, accurate and modern AI experiences with
            multi-model reasoning, image generation, adaptive search,
            deep research and real-time web intelligence in one place.
          </p>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleLogout}
          className="text-red-400 focus:text-red-300"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
