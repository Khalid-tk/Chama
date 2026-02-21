import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../lib/api'

export type Role = 'MEMBER' | 'ADMIN' | 'TREASURER' | 'CHAIR' | 'AUDITOR'

export type AuthUser = {
  id: string
  fullName: string
  email: string
  phone?: string
  authProvider?: string
  globalRole?: 'USER' | 'SUPER_ADMIN'
  avatarUrl?: string | null
}

export type ChamaMembership = {
  chamaId: string
  role: Role
  joinedAt: string
  chama: {
    id: string
    name: string
    chamaCode: string
    joinMode?: string
  }
}

type AuthState = {
  token: string | null
  user: AuthUser | null
  memberships: ChamaMembership[]
  isAuthed: boolean
  login: (token: string, user: AuthUser, memberships: ChamaMembership[]) => void
  logout: () => void
  refreshMemberships: () => Promise<void>
  setUser: (user: AuthUser | null) => void
  updateUser: (patch: Partial<AuthUser>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      memberships: [],
      isAuthed: false,
      login: (token, user, memberships) => {
        localStorage.setItem('chama-token', token)
        set({ token, user, memberships, isAuthed: true })
      },
      logout: () => {
        set({ token: null, user: null, memberships: [], isAuthed: false })
        localStorage.removeItem('chama-token')
        localStorage.removeItem('chama-active-chama-id')
        localStorage.removeItem('chama-auth')
        localStorage.removeItem('chama-context')
        window.location.href = '/login'
      },
      refreshMemberships: async () => {
        try {
          const response = await api.get('/auth/me')
          const data = response.data.data
          set({
            user: {
              id: data.id,
              fullName: data.fullName,
              email: data.email,
              phone: data.phone,
              authProvider: data.authProvider,
              globalRole: data.globalRole,
              avatarUrl: data.avatarUrl ?? undefined,
            },
            memberships: data.memberships || [],
          })
        } catch (error) {
          if (import.meta.env.DEV) console.error('Failed to refresh memberships:', error)
        }
      },
      setUser: (user) => set({ user }),
      updateUser: (patch) => set((s) => ({ user: s.user ? { ...s.user, ...patch } : null })),
    }),
    {
      name: 'chama-auth',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        memberships: state.memberships,
        isAuthed: state.isAuthed,
      }),
    }
  )
)
