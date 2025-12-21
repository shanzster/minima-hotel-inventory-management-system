// Session management with automatic renewal and error handling
import React from 'react'
import { handleAuthenticationError, logError } from './errorHandling'

const SESSION_CONFIG = {
  tokenKey: 'auth_token',
  userKey: 'currentUser',
  refreshKey: 'refresh_token',
  expiryKey: 'token_expiry',
  renewalThreshold: 5 * 60 * 1000, // 5 minutes before expiry
  maxRetries: 3,
  retryDelay: 1000
}

export class SessionManager {
  constructor() {
    this.renewalTimer = null
    this.isRenewing = false
    this.listeners = new Set()
  }

  // Initialize session management
  initialize() {
    if (typeof window === 'undefined') return

    // Check for existing session
    this.checkSession()
    
    // Set up automatic renewal
    this.scheduleRenewal()
    
    // Listen for storage changes (multi-tab support)
    window.addEventListener('storage', this.handleStorageChange.bind(this))
    
    // Listen for focus events to check session
    window.addEventListener('focus', this.handleWindowFocus.bind(this))
  }

  // Clean up event listeners
  cleanup() {
    if (this.renewalTimer) {
      clearTimeout(this.renewalTimer)
    }
    
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', this.handleStorageChange.bind(this))
      window.removeEventListener('focus', this.handleWindowFocus.bind(this))
    }
  }

  // Get current user from session
  getCurrentUser() {
    if (typeof window === 'undefined') return null

    try {
      const userStr = localStorage.getItem(SESSION_CONFIG.userKey)
      return userStr ? JSON.parse(userStr) : null
    } catch (error) {
      logError(error, { context: 'SessionManager.getCurrentUser' })
      this.clearSession()
      return null
    }
  }

  // Get auth token
  getAuthToken() {
    if (typeof window === 'undefined') return null

    return localStorage.getItem(SESSION_CONFIG.tokenKey)
  }

  // Check if user is authenticated
  isAuthenticated() {
    const user = this.getCurrentUser()
    const token = this.getAuthToken()
    const expiry = this.getTokenExpiry()
    
    return !!(user && token && expiry && expiry > Date.now())
  }

  // Get token expiry time
  getTokenExpiry() {
    if (typeof window === 'undefined') return null

    const expiryStr = localStorage.getItem(SESSION_CONFIG.expiryKey)
    return expiryStr ? parseInt(expiryStr, 10) : null
  }

  // Set session data
  setSession(user, token, refreshToken = null, expiresIn = 3600) {
    if (typeof window === 'undefined') return

    try {
      const expiry = Date.now() + (expiresIn * 1000)
      
      localStorage.setItem(SESSION_CONFIG.userKey, JSON.stringify(user))
      localStorage.setItem(SESSION_CONFIG.tokenKey, token)
      localStorage.setItem(SESSION_CONFIG.expiryKey, expiry.toString())
      
      if (refreshToken) {
        localStorage.setItem(SESSION_CONFIG.refreshKey, refreshToken)
      }

      // Schedule renewal
      this.scheduleRenewal()
      
      // Notify listeners
      this.notifyListeners('session_created', { user, token })
    } catch (error) {
      logError(error, { context: 'SessionManager.setSession' })
      throw new Error('Failed to save session data')
    }
  }

  // Clear session data
  clearSession() {
    if (typeof window === 'undefined') return

    localStorage.removeItem(SESSION_CONFIG.userKey)
    localStorage.removeItem(SESSION_CONFIG.tokenKey)
    localStorage.removeItem(SESSION_CONFIG.refreshKey)
    localStorage.removeItem(SESSION_CONFIG.expiryKey)
    sessionStorage.clear()

    if (this.renewalTimer) {
      clearTimeout(this.renewalTimer)
      this.renewalTimer = null
    }

    // Notify listeners
    this.notifyListeners('session_cleared')
  }

  // Check session validity
  checkSession() {
    if (!this.isAuthenticated()) {
      this.clearSession()
      return false
    }

    const expiry = this.getTokenExpiry()
    const timeUntilExpiry = expiry - Date.now()
    
    // If token expires soon, try to renew
    if (timeUntilExpiry < SESSION_CONFIG.renewalThreshold) {
      this.renewSession()
    }

    return true
  }

  // Schedule automatic session renewal
  scheduleRenewal() {
    if (this.renewalTimer) {
      clearTimeout(this.renewalTimer)
    }

    const expiry = this.getTokenExpiry()
    if (!expiry) return

    const timeUntilRenewal = expiry - Date.now() - SESSION_CONFIG.renewalThreshold
    
    if (timeUntilRenewal > 0) {
      this.renewalTimer = setTimeout(() => {
        this.renewSession()
      }, timeUntilRenewal)
    }
  }

  // Renew session token
  async renewSession() {
    if (this.isRenewing) return

    this.isRenewing = true

    try {
      const refreshToken = localStorage.getItem(SESSION_CONFIG.refreshKey)
      if (!refreshToken) {
        throw new Error('No refresh token available')
      }

      const response = await this.makeRenewalRequest(refreshToken)
      
      if (response.token) {
        const user = this.getCurrentUser()
        this.setSession(
          user, 
          response.token, 
          response.refreshToken || refreshToken,
          response.expiresIn || 3600
        )
        
        this.notifyListeners('session_renewed', { token: response.token })
      }
    } catch (error) {
      logError(error, { context: 'SessionManager.renewSession' })
      
      // If renewal fails, clear session and redirect to login
      this.clearSession()
      this.notifyListeners('session_expired')
      
      // Handle authentication error (redirect to login)
      handleAuthenticationError(error)
      
      // Re-throw the error for tests
      throw error
    } finally {
      this.isRenewing = false
    }
  }

  // Make renewal request with retry logic
  async makeRenewalRequest(refreshToken, retryCount = 0) {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${refreshToken}`
        }
      })

      if (!response.ok) {
        throw new Error(`Renewal failed: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      if (retryCount < SESSION_CONFIG.maxRetries) {
        // In test environment, don't delay
        if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
          return this.makeRenewalRequest(refreshToken, retryCount + 1)
        }
        
        await new Promise(resolve => 
          setTimeout(resolve, SESSION_CONFIG.retryDelay * Math.pow(2, retryCount))
        )
        return this.makeRenewalRequest(refreshToken, retryCount + 1)
      }
      throw error
    }
  }

  // Handle storage changes (multi-tab support)
  handleStorageChange(event) {
    if (event.key === SESSION_CONFIG.userKey || event.key === SESSION_CONFIG.tokenKey) {
      if (!event.newValue) {
        // Session was cleared in another tab
        this.clearSession()
        this.notifyListeners('session_cleared_external')
      } else {
        // Session was updated in another tab
        this.notifyListeners('session_updated_external')
      }
    }
  }

  // Handle window focus (check session when user returns)
  handleWindowFocus() {
    this.checkSession()
  }

  // Add session event listener
  addListener(callback) {
    this.listeners.add(callback)
    
    return () => {
      this.listeners.delete(callback)
    }
  }

  // Notify all listeners
  notifyListeners(event, data = null) {
    this.listeners.forEach(callback => {
      try {
        callback(event, data)
      } catch (error) {
        logError(error, { context: 'SessionManager.notifyListeners', event })
      }
    })
  }

  // Get session info for debugging
  getSessionInfo() {
    return {
      isAuthenticated: this.isAuthenticated(),
      user: this.getCurrentUser(),
      tokenExpiry: this.getTokenExpiry(),
      timeUntilExpiry: this.getTokenExpiry() ? this.getTokenExpiry() - Date.now() : null,
      isRenewing: this.isRenewing
    }
  }
}

// Create singleton instance
export const sessionManager = new SessionManager()

// React hook for session management
export function useSession() {
  const [sessionState, setSessionState] = React.useState(() => ({
    user: sessionManager.getCurrentUser(),
    isAuthenticated: sessionManager.isAuthenticated(),
    isLoading: false
  }))

  React.useEffect(() => {
    // Initialize session manager
    sessionManager.initialize()

    // Listen for session events
    const unsubscribe = sessionManager.addListener((event, data) => {
      switch (event) {
        case 'session_created':
        case 'session_renewed':
          setSessionState({
            user: sessionManager.getCurrentUser(),
            isAuthenticated: true,
            isLoading: false
          })
          break

        case 'session_cleared':
        case 'session_expired':
          setSessionState({
            user: null,
            isAuthenticated: false,
            isLoading: false
          })
          break

        case 'session_cleared_external':
          // Session cleared in another tab
          setSessionState({
            user: null,
            isAuthenticated: false,
            isLoading: false
          })
          break

        case 'session_updated_external':
          // Session updated in another tab
          setSessionState({
            user: sessionManager.getCurrentUser(),
            isAuthenticated: sessionManager.isAuthenticated(),
            isLoading: false
          })
          break
      }
    })

    return () => {
      unsubscribe()
      sessionManager.cleanup()
    }
  }, [])

  const login = React.useCallback(async (credentials) => {
    setSessionState(prev => ({ ...prev, isLoading: true }))

    try {
      // Make login request
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      })

      if (!response.ok) {
        throw new Error('Login failed')
      }

      const { user, token, refreshToken, expiresIn } = await response.json()
      
      sessionManager.setSession(user, token, refreshToken, expiresIn)
      
      setSessionState({
        user,
        isAuthenticated: true,
        isLoading: false
      })

      return user
    } catch (error) {
      setSessionState(prev => ({ ...prev, isLoading: false }))
      throw error
    }
  }, [])

  const logout = React.useCallback(() => {
    sessionManager.clearSession()
    setSessionState({
      user: null,
      isAuthenticated: false,
      isLoading: false
    })
  }, [])

  const sessionInfo = React.useMemo(() => sessionManager.getSessionInfo(), [])

  return {
    ...sessionState,
    login,
    logout,
    sessionInfo
  }
}

export default sessionManager