// Enhanced API client with comprehensive error handling and recovery
import React from 'react'
import { 
  APIError, 
  classifyError, 
  handleAuthenticationError, 
  retryWithBackoff, 
  logError,
  DataConflictError,
  resolveStockConflict 
} from './errorHandling'

// Enhanced API configuration
const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  timeout: 10000,
  retries: 3,
  retryDelay: 1000,
  enableOptimisticUpdates: true,
  enableConflictResolution: true
}

// Request interceptor for adding auth headers and request ID
function addRequestMetadata(options = {}) {
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
  
  const headers = {
    'Content-Type': 'application/json',
    'X-Request-ID': requestId,
    ...options.headers
  }

  // Add auth token if available
  if (typeof window !== 'undefined') {
    const user = localStorage.getItem('currentUser')
    if (user) {
      try {
        const userData = JSON.parse(user)
        if (userData.token) {
          headers['Authorization'] = `Bearer ${userData.token}`
        }
      } catch (error) {
        console.warn('Failed to parse user data for auth header')
      }
    }
  }

  return {
    ...options,
    headers,
    metadata: { requestId }
  }
}

// Enhanced API request function with comprehensive error handling
export async function enhancedApiRequest(endpoint, options = {}) {
  const requestOptions = addRequestMetadata(options)
  const { metadata } = requestOptions
  
  try {
    const result = await retryWithBackoff(
      () => makeRequest(endpoint, requestOptions),
      API_CONFIG.retries,
      API_CONFIG.retryDelay
    )
    
    return result
  } catch (error) {
    // Log error with context
    logError(error, {
      endpoint,
      requestId: metadata.requestId,
      method: options.method || 'GET',
      timestamp: new Date().toISOString()
    })

    // Handle authentication errors
    if (handleAuthenticationError(error)) {
      throw error
    }

    // Enhance error with request context
    if (error instanceof APIError) {
      error.requestId = metadata.requestId
      error.endpoint = endpoint
    }

    throw error
  }
}

async function makeRequest(endpoint, options) {
  const {
    method = 'GET',
    body = null,
    headers = {},
    timeout = API_CONFIG.timeout,
    metadata
  } = options

  const url = `${API_CONFIG.baseURL}${endpoint}`
  const requestOptions = {
    method,
    headers,
    ...(body && { body: JSON.stringify(body) })
  }

  // Create timeout promise
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Request timeout')), timeout)
  )

  // Make the request with timeout
  const response = await Promise.race([
    fetch(url, requestOptions),
    timeoutPromise
  ])

  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    
    // Handle specific error types
    if (response.status === 409 && errorData?.conflictType === 'stock_level') {
      throw new DataConflictError(
        'Stock level conflict detected',
        errorData.expectedVersion,
        errorData.actualVersion,
        errorData.conflictData
      )
    }
    
    throw new APIError(
      errorData?.message || `HTTP ${response.status}: ${response.statusText}`,
      response.status,
      errorData
    )
  }

  const data = await response.json()
  return data
}

// Enhanced inventory operations with conflict resolution
export class EnhancedInventoryAPI {
  // Get inventory items with caching and error recovery
  static async getItems(filters = {}, options = {}) {
    const { useCache = true, cacheKey } = options
    
    try {
      const queryParams = new URLSearchParams(filters).toString()
      const endpoint = `/inventory${queryParams ? `?${queryParams}` : ''}`
      
      return await enhancedApiRequest(endpoint, { method: 'GET' })
    } catch (error) {
      const classification = classifyError(error)
      
      // For network errors, try to return cached data if available
      if (classification.type === 'network' && useCache && cacheKey) {
        const cachedData = this.getCachedData(cacheKey)
        if (cachedData) {
          console.warn('Using cached data due to network error')
          return cachedData
        }
      }
      
      throw error
    }
  }

  // Update inventory item with optimistic updates and conflict resolution
  static async updateItem(itemId, updates, options = {}) {
    const { 
      optimistic = API_CONFIG.enableOptimisticUpdates,
      conflictResolution = API_CONFIG.enableConflictResolution,
      expectedVersion = null
    } = options

    try {
      const requestBody = {
        ...updates,
        ...(expectedVersion && { expectedVersion })
      }

      return await enhancedApiRequest(`/inventory/${itemId}`, {
        method: 'PUT',
        body: requestBody
      })
    } catch (error) {
      if (error instanceof DataConflictError && conflictResolution) {
        return this.handleStockConflict(itemId, error, updates)
      }
      throw error
    }
  }

  // Handle stock level conflicts with automatic resolution
  static async handleStockConflict(itemId, conflictError, originalUpdates) {
    const { expectedVersion, actualVersion, conflictData } = conflictError
    
    // Use conflict resolution strategy
    const resolution = resolveStockConflict(
      expectedVersion,
      actualVersion,
      conflictData?.concurrentUpdates || []
    )

    switch (resolution.strategy) {
      case 'last_write_wins':
        // Retry with current version
        return this.updateItem(itemId, originalUpdates, {
          expectedVersion: actualVersion,
          conflictResolution: false // Prevent infinite recursion
        })

      case 'manual_resolution':
      case 'audit_required':
        // Throw enhanced error with resolution options
        const enhancedError = new DataConflictError(
          'Manual conflict resolution required',
          expectedVersion,
          actualVersion,
          {
            ...conflictData,
            resolutionStrategy: resolution.strategy,
            requiresApproval: resolution.requiresApproval,
            requiresAudit: resolution.requiresAudit
          }
        )
        enhancedError.resolutionOptions = {
          acceptCurrent: () => this.updateItem(itemId, { 
            ...originalUpdates, 
            currentStock: actualVersion 
          }),
          forceUpdate: () => this.updateItem(itemId, originalUpdates, {
            expectedVersion: actualVersion,
            force: true
          }),
          createAuditRequest: () => this.createAuditRequest(itemId, conflictError)
        }
        throw enhancedError

      default:
        throw conflictError
    }
  }

  // Create audit request for unresolved conflicts
  static async createAuditRequest(itemId, conflictError) {
    const auditData = {
      itemId,
      auditType: 'conflict-resolution',
      reason: 'Stock level conflict requires manual review',
      conflictData: {
        expectedStock: conflictError.expectedVersion,
        actualStock: conflictError.actualVersion,
        timestamp: new Date().toISOString()
      }
    }

    return enhancedApiRequest('/audits', {
      method: 'POST',
      body: auditData
    })
  }

  // Batch operations with partial failure handling
  static async batchUpdate(updates, options = {}) {
    const { continueOnError = true, maxConcurrent = 5 } = options
    const results = []
    const errors = []

    // Process updates in batches to avoid overwhelming the server
    for (let i = 0; i < updates.length; i += maxConcurrent) {
      const batch = updates.slice(i, i + maxConcurrent)
      
      const batchPromises = batch.map(async (update) => {
        try {
          const result = await this.updateItem(update.itemId, update.data, update.options)
          return { success: true, itemId: update.itemId, result }
        } catch (error) {
          const errorResult = { success: false, itemId: update.itemId, error }
          
          if (!continueOnError) {
            throw error
          }
          
          return errorResult
        }
      })

      const batchResults = await Promise.all(batchPromises)
      
      batchResults.forEach(result => {
        if (result.success) {
          results.push(result)
        } else {
          errors.push(result)
        }
      })
    }

    return {
      successful: results,
      failed: errors,
      totalProcessed: updates.length,
      successCount: results.length,
      errorCount: errors.length
    }
  }

  // Cache management
  static getCachedData(key) {
    if (typeof window === 'undefined') return null
    
    try {
      const cached = sessionStorage.getItem(`api_cache_${key}`)
      if (cached) {
        const { data, timestamp } = JSON.parse(cached)
        const age = Date.now() - timestamp
        
        // Cache valid for 5 minutes
        if (age < 5 * 60 * 1000) {
          return data
        }
        
        sessionStorage.removeItem(`api_cache_${key}`)
      }
    } catch (error) {
      console.warn('Failed to retrieve cached data:', error)
    }
    
    return null
  }

  static setCachedData(key, data) {
    if (typeof window === 'undefined') return
    
    try {
      const cacheEntry = {
        data,
        timestamp: Date.now()
      }
      sessionStorage.setItem(`api_cache_${key}`, JSON.stringify(cacheEntry))
    } catch (error) {
      console.warn('Failed to cache data:', error)
    }
  }
}

// Enhanced hooks for API operations with error handling
export function useEnhancedApi() {
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState(null)

  const executeRequest = React.useCallback(async (apiCall, options = {}) => {
    const { onSuccess, onError, showErrorToUser = true } = options
    
    setLoading(true)
    setError(null)

    try {
      const result = await apiCall()
      
      if (onSuccess) {
        onSuccess(result)
      }
      
      return result
    } catch (err) {
      setError(err)
      
      if (onError) {
        onError(err)
      } else if (showErrorToUser) {
        // Could integrate with toast notification system here
        console.error('API Error:', err)
      }
      
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const clearError = React.useCallback(() => {
    setError(null)
  }, [])

  return {
    loading,
    error,
    executeRequest,
    clearError
  }
}

// Export enhanced API as default
export default EnhancedInventoryAPI