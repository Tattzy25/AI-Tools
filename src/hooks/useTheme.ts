import { useEffect, useState } from 'react'

type ThemeMode = 'light' | 'dark' | 'system'

const storageKey = 'theme-mode'

const getSystemPrefersDark = () => window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches

const applyTheme = (mode: ThemeMode) => {
  const isDark = mode === 'dark' ? true : mode === 'light' ? false : getSystemPrefersDark()
  const root = document.documentElement
  root.classList.toggle('dark', isDark)
}

export const useTheme = () => {
  const [mode, setMode] = useState<ThemeMode>(() => (localStorage.getItem(storageKey) as ThemeMode) || 'system')

  useEffect(() => {
    applyTheme(mode)
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      const current = (localStorage.getItem(storageKey) as ThemeMode) || 'system'
      if (current === 'system') applyTheme('system')
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [mode])

  const update = (next: ThemeMode) => {
    setMode(next)
    localStorage.setItem(storageKey, next)
    applyTheme(next)
  }

  return { mode, setMode: update }
}