// Unit tests for SessionManager
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { SessionManager, sessionManager, useSession } from './sessionManager'

// Mock fetch
global.fetch = vi.fn()

// Mock localStorage and sessionStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

const mockSessionStorage = {
  clear: vi.fn()
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage
})

// Mock window events
const mockAddEventListener = vi.fn()
const mockRemoveEventListener = vi.fn()
Object.defineProperty(window, 'addEventListener', { value: mockAddEventListener })
Object.defineProperty(window, 'removeEventListener', { value: mockRemoveEventListener })

describe('SessionManager', () => {
  let manager
  
  const mockUser = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'inventory-controller'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    manager = new SessionManager()
  })

  afterEach(() => {
    manager.cleanup()
  })

  describe('initialization', () => {
    it('sets up event listeners on initialize', () => {
      manager.initialize()

      expect(mockAddEventListener).toHaveBeenCalledWith('storage', expect.any(Function))
      expect(mockAddEventListener).toHaveBeenCalledWith('focus', expect.any(Function))
    })

    it('cleans up event listeners on cleanup', () => {
      manager.initialize()
      manager.cleanup()

      expect(mockRemoveEventListener).toHaveBeenCalledWith('storage', expect.any(Function))
      expect(mockRemoveEventListener).toHaveBeenCalledWith('focus', expect.any(Function))
    })
  })

  describe('session management', () => {
    it('sets session data correctly', () => {
      const token = 'test-token'
      const refreshToken = 'refresh-token'
      const expiresIn = 3600

      manager.setSession(mockUser, token, refreshToken, expiresIn)

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('currentUser', JSON.stringify(mockUser))
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('auth_token', token)
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('refresh_token', refreshToken)
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('token_expiry', expect.any(String))
    })

    it('gets current user from localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockUser))

      const user = manager.getCurrentUser()

      expect(user).toEqual(mockUser)
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('currentUser')
    })

    it('returns null for invalid user data', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-json')

      const user = manager.getCurrentUser()

      expect(user).toBeNull()
    })

    it('gets auth token from localStorage', () => {
      const token = 'test-token'
      mockLocalStorage.getItem.mockReturnValue(token)

      const result = manager.getAuthToken()

      expect(result).toBe(token)
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('auth_token')
    })

    it('checks authentication status correctly', () => {
      const futureExpiry = Date.now() + 3600000 // 1 hour from now
      
      mockLocalStorage.getItem
        .mockReturnValueOnce(JSON.stringify(mockUser)) // getCurrentUser
        .mockReturnValueOnce('test-token') // getAuthToken
        .mockReturnValueOnce(futureExpiry.toString()) // getTokenExpiry

      expect(manager.isAuthenticated()).toBe(true)

      // Test expired token
      const pastExpiry = Date.now() - 3600000 // 1 hour ago
      mockLocalStorage.getItem
        .mockReturnValueOnce(JSON.stringify(mockUser))
        .mockReturnValueOnce('test-token')
        .mockReturnValueOnce(pastExpiry.toString())

      expect(manager.isAuthenticated()).toBe(false)
    })

    it('clears session data', () => {
      manager.clearSession()

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('currentUser')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_token')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('refresh_token')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token_expiry')
      expect(mockSessionStorage.clear).toHaveBeenCalled()
    })
  })

  describe('session renewal', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('schedules renewal before token expiry', () => {
      const futureExpiry = Date.now() + 3600000 // 1 hour from now
      mockLocalStorage.getItem.mockReturnValue(futureExpiry.toString())

      manager.scheduleRenewal()

      expect(manager.renewalTimer).toBeTruthy()
    })

    it('renews session with valid refresh token', async () => {
      const mockResponse = {
        token: 'new-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 3600
      }

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      mockLocalStorage.getItem
        .mockReturnValueOnce('refresh-token') // getRefreshToken
        .mockReturnValueOnce(JSON.stringify(mockUser)) // getCurrentUser in setSession

      await manager.renewSession()

      expect(fetch).toHaveBeenCalledWith('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer refresh-token'
        }
      })
    })

    it('clears session when renewal fails', async () => {
      fetch.mockRejectedValueOnce(new Error('Renewal failed'))
      mockLocalStorage.getItem.mockReturnValue('refresh-token')

      const clearSessionSpy = vi.spyOn(manager, 'clearSession')

      await expect(manager.renewSession()).rejects.toThrow()
      expect(clearSessionSpy).toHaveBeenCalled()
    })

    it('retries renewal request on failure', async () => {
      fetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ token: 'new-token', expiresIn: 3600 })
        })

      mockLocalStorage.getItem
        .mockReturnValueOnce('refresh-token')
        .mockReturnValueOnce(JSON.stringify(mockUser))

      await manager.renewSession()

      expect(fetch).toHaveBeenCalledTimes(2)
    })
  })

  describe('event listeners', () => {
    it('notifies listeners of session events', () => {
      const listener = vi.fn()
      const unsubscribe = manager.addListener(listener)

      manager.notifyListeners('session_created', { user: mockUser })

      expect(listener).toHaveBeenCalledWith('session_created', { user: mockUser })

      unsubscribe()
      manager.notifyListeners('session_cleared')

      expect(listener).toHaveBeenCalledTimes(1) // Should not be called after unsubscribe
    })

    it('handles storage change events', () => {
      const listener = vi.fn()
      manager.addListener(listener)

      // Simulate storage change event
      const storageEvent = {
        key: 'currentUser',
        newValue: null
      }

      manager.handleStorageChange(storageEvent)

      // Should be called with session_cleared_external (the second call)
      expect(listener).toHaveBeenCalledWith('session_cleared_external', null)
    })

    it('handles window focus events', () => {
      const checkSessionSpy = vi.spyOn(manager, 'checkSession')

      manager.handleWindowFocus()

      expect(checkSessionSpy).toHaveBeenCalled()
    })
  })

  describe('session info', () => {
    it('provides session information for debugging', () => {
      const futureExpiry = Date.now() + 3600000
      
      // Mock localStorage to return consistent values
      mockLocalStorage.getItem.mockImplementation((key) => {
        switch (key) {
          case 'currentUser':
            return JSON.stringify(mockUser)
          case 'auth_token':
            return 'test-token'
          case 'token_expiry':
            return futureExpiry.toString()
          default:
            return null
        }
      })

      const info = manager.getSessionInfo()

      expect(info.isAuthenticated).toBe(true)
      expect(info.user).toEqual(mockUser)
      expect(info.tokenExpiry).toBe(futureExpiry)
      expect(info.isRenewing).toBe(false)
      expect(typeof info.timeUntilExpiry).toBe('number')
      expect(info.timeUntilExpiry).toBeGreaterThan(0)
    })
  })
})

describe('useSession hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset fetch mock completely
    fetch.mockReset()
  })

  it('provides session state and methods', () => {
    const { result } = renderHook(() => useSession())

    expect(typeof result.current.login).toBe('function')
    expect(typeof result.current.logout).toBe('function')
    expect(typeof result.current.isAuthenticated).toBe('boolean')
    expect(typeof result.current.isLoading).toBe('boolean')
  })

  it('handles login successfully', async () => {
    const mockResponse = {
      user: { id: '1', name: 'Test' },
      token: 'new-token',
      refreshToken: 'refresh-token',
      expiresIn: 3600
    }

    // Set up fresh mock
    fetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })
    )

    const { result } = renderHook(() => useSession())

    let loginResult
    await act(async () => {
      loginResult = await result.current.login({
        email: 'test@example.com',
        password: 'password'
      })
    })

    expect(loginResult).toEqual(mockResponse.user)
    expect(fetch).toHaveBeenCalledWith('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password'
      })
    })
  })

  it('handles login failure', async () => {
    // Set up fresh mock for failure
    fetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: false,
        status: 401
      })
    )

    const { result } = renderHook(() => useSession())

    await act(async () => {
      await expect(result.current.login({
        email: 'test@example.com',
        password: 'wrong'
      })).rejects.toThrow('Login failed')
    })

    expect(result.current.isLoading).toBe(false)
  })

  it('handles logout', () => {
    const { result } = renderHook(() => useSession())

    act(() => {
      result.current.logout()
    })

    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('currentUser')
  })

  it('provides session info', () => {
    const { result } = renderHook(() => useSession())

    expect(result.current.sessionInfo).toBeDefined()
    expect(typeof result.current.sessionInfo).toBe('object')
  })
})