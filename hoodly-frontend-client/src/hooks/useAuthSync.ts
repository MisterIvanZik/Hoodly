import { useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { useAuthStore } from '../stores/auth.store'
import { authApi } from '../services/api/auth'

export function useAuthSync() {
  const { isAuthenticated, isLoading } = useAuth0()
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)
  const setIsSyncing = useAuthStore((state) => state.setIsSyncing)

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) return
    if (user) return

    const fetchProfile = async () => {
      setIsSyncing(true)
      try {
        const { data } = await authApi.getMe()
        setUser(data)
      } catch {
        // Erreur de fetch - store vide
      } finally {
        setIsSyncing(false)
      }
    }

    fetchProfile()
  }, [isAuthenticated, isLoading, user, setUser, setIsSyncing])
}
