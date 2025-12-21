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
    
    // Commented out auto-login for proper authentication flow
    // For development: auto-login as inventory controller if no user exists
    // if (!currentUser && process.env.NODE_ENV === 'development') {
    //   const devUser = {
    //     id: '1',
    //     email: 'controller@minima.com',
    //     name: 'Mark Trinidad',
    //     role: 'inventory-controller'
    //   }
    //   setCurrentUser(devUser)
    //   currentUser = devUser
    // }
    
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
    
    // Optional: Force a page reload to ensure clean state
    // This helps prevent any lingering state issues
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