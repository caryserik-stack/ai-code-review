import { create } from 'zustand'


interface User {
  id: string
  email: string
  name: string | null
  role: string
  createdAt: string
}

interface AuthStore {
  user: User | null
  loading: boolean
  setUser: (user: User | null) => void
  fetchMe: () => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: true,
  

  setUser: (user) => set({ user }),


  fetchMe: async () => {
    set ({ loading: true})
    try {
      const response = await fetch('http://localhost:4000/api/auth/me', {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        set({ user: data.user, loading: false })
      } else {
        set({ user: null, loading: false })
      }
    } catch {
      set({ user: null, loading: false })
    }
  },


  logout: async () => {
    await fetch('http://localhost:4000/api/auth/logout', {
      method: "POST",
      credentials: "include",
    })
    set({ user: null })
  }





}))