import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Role } from './authStore'

export type ChamaContext = {
  chamaId: string
  chamaName: string
  chamaCode: string
  role: Role
  joinMode?: string
}

type ChamaState = {
  activeChamaId: string | null
  activeChama: ChamaContext | null
  setActiveChama: (chama: ChamaContext | null) => void
  clearActiveChama: () => void
}

export const useChamaStore = create<ChamaState>()(
  persist(
    (set) => ({
      activeChamaId: null,
      activeChama: null,
      setActiveChama: (chama) => {
        if (chama) {
          localStorage.setItem('chama-active-chama-id', chama.chamaId)
          set({ activeChamaId: chama.chamaId, activeChama: chama })
        } else {
          localStorage.removeItem('chama-active-chama-id')
          set({ activeChamaId: null, activeChama: null })
        }
      },
      clearActiveChama: () => {
        localStorage.removeItem('chama-active-chama-id')
        set({ activeChamaId: null, activeChama: null })
      },
    }),
    {
      name: 'chama-context',
      partialize: (state) => ({
        activeChamaId: state.activeChamaId,
        activeChama: state.activeChama,
      }),
    }
  )
)
