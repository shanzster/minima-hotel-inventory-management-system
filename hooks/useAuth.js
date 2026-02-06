import { useState, useEffect, useCallback } from 'react'
import { 
  getCurrentUser, 
  setCurrentUser, 
  authenticateUser, 
  logout as authLogout, 
  checkPermission 
} from '../lib/auth'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Check for existing user on mount
    let currentUser = getCurrentUser()

    // Check if user has manually logged out (don't auto-login)
    const hasLoggedOut = typeof window !== 'undefined' &&
                        localStorage.getItem('hasLoggedOut') === 'true'

    // Auto-login as purchasing officer for development (only if not manually logged out)
    if (!currentUser && !hasLoggedOut && process.env.NODE_ENV === 'development') {
      const devUser = {
        id: '3',
        email: 'purchasing@minima.com',
        name: 'Mike Purchasing',
        role: 'purchasing-officer'
      }
      setCurrentUser(devUser)
      currentUser = devUser
    }

    setUser(currentUser)
    setLoading(false)
  }, [])

  const login = useCallback(async (email, password) => {
    setLoading(true)
    setError(null)

    try {
      const authenticatedUser = await authenticateUser(email, password)
      setCurrentUser(authenticatedUser)
      setUser(authenticatedUser)

      // Clear the logout flag since user has logged in manually
      if (typeof window !== 'undefined') {
        localStorage.removeItem('hasLoggedOut')
      }

      return authenticatedUser
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    // Clear auth state
    authLogout()
    setUser(null)
    setError(null)

    // Force a page reload to ensure clean state and prevent auto-login
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        window.location.reload()
      }, 100)
    }
  }, [])

  const hasPermission = useCallback((resource, action) => {
    if (!user) return false
    return checkPermission(user.role, resource, action)
  }, [user])

  const hasRole = useCallback((role) => {
    return user && user.role === role
  }, [user])

  const hasAnyRole = useCallback((roles) => {
    return user && roles.includes(user.role)
  }, [user])

  return {
    user,
    loading,
    error,
    login,
    logout,
    hasPermission,
    hasRole,
    hasAnyRole,
    isAuthenticated: !!user
  }
}