import { create } from 'zustand'

interface ThemeState {
  isDark: boolean
  toggle: () => void
}

export const useThemeStore = create<ThemeState>(set => ({
  // isDark: window.matchMedia('(prefers-color-scheme: dark)').matches,
  isDark: false,
  toggle: () =>
    set(state => {
      const next = !state.isDark
      document.documentElement.classList.toggle('dark', next)
      return { isDark: next }
    })
}))

// Apply initial theme
if (useThemeStore.getState().isDark) {
  document.documentElement.classList.add('dark')
}
