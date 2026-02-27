import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ThemeStore {
  isDark: boolean
  toggleTheme: () => void
  setDark: (dark: boolean) => void
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      isDark: false,
      toggleTheme: () =>
        set((state) => {
          const newDark = !state.isDark
          document.documentElement.classList.toggle('dark', newDark)
          return { isDark: newDark }
        }),
      setDark: (dark: boolean) => {
        document.documentElement.classList.toggle('dark', dark)
        set({ isDark: dark })
      },
    }),
    {
      name: 'larre-theme',
      onRehydrateStorage: () => (state) => {
        if (state?.isDark) {
          document.documentElement.classList.add('dark')
        }
      },
    }
  )
)
