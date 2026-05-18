'use client'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import { SHORTCUT_EVENTS, SHORTCUTS } from '@/lib/keyboard-shortcuts'
import { SearchMode } from '@/lib/types/search'
import { getCookie, setCookie } from '@/lib/utils/cookies'
import { useKeyboardShortcut } from '@/hooks/use-keyboard-shortcut'
import { useSidebar } from './ui/sidebar'
import { KeyboardShortcutDialog } from './keyboard-shortcut-dialog'

const THEME_CYCLE: Record<string, string> = {
  dark: 'light',
  light: 'system',
  system: 'dark'
}

// ✅ FIXED: Use string key to avoid type error
const SEARCH_MODE_LABELS: Record<string, string> = {
  quick: 'Quick',
  adaptive: 'Adaptive',
  analyzing: 'Analyzing',
  image: 'Image Generation',
  research: 'Research',
}

export function KeyboardShortcutHandler() {
  const { theme, setTheme } = useTheme()
  const { toggleSidebar } = useSidebar()

  useKeyboardShortcut(SHORTCUTS.toggleSidebar, toggleSidebar)

  useKeyboardShortcut(SHORTCUTS.newChat, () => {
    window.dispatchEvent(
      new CustomEvent(SHORTCUT_EVENTS.newChat, { cancelable: true })
    )
  })

  useKeyboardShortcut(SHORTCUTS.toggleTheme, () => {
    setTheme(THEME_CYCLE[theme ?? 'system'] ?? 'dark')
  })

  useKeyboardShortcut(SHORTCUTS.copyMessage, () => {
    window.dispatchEvent(
      new CustomEvent(SHORTCUT_EVENTS.copyMessage, { cancelable: true })
    )
  })

  useKeyboardShortcut(SHORTCUTS.toggleSearchMode, () => {
    const current = getCookie('searchMode') || 'quick'
    const next: SearchMode = current === 'quick' ? 'adaptive' : 'quick'
    setCookie('searchMode', next)
    toast.info(`Search mode: ${SEARCH_MODE_LABELS[next]}`)
  })

  useKeyboardShortcut(SHORTCUTS.showShortcuts, () => {
    window.dispatchEvent(new CustomEvent(SHORTCUT_EVENTS.showShortcuts))
  })

  return <KeyboardShortcutDialog />
}
