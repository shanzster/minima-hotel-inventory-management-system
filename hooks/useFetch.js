// Enhanced useFetch hook with caching, error handling, and real-time updates
import { useState, useEffect, useRef, useCallback } from 'react'
import { APIError } from '../lib/api'

// Simple in-memory cache
const cache = new Map()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Cache utilities
function getCacheKey(url, options) {
  return `${url}:${JSON.stringify(options)}`
}

function getCachedData(key) {
  const cached = cache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data
  }
  cache.delete(key)
  return null
}

function setCachedData(key, data) {
  cache.set(key, {
    data,
    timestamp: Date.now()
  })
}

// Main useFetch hook
export function useFetch(fetchFunction, dependencies = [], options = {}) {
  const {
    immediate = true,
    cacheKey = null,
    onSuccess = null,
    onError = null,
    retryCount = 3,
    retryDelay = 1000
  } = options

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(immediate)
  const [error, setError] = useState(null)
  const [retryAttempt, setRetryAttempt] = useState(0)
  
  const abortControllerRef = useRef(null)
  const mountedRef = useRef(true)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!fetchFunction) return

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Check cache first
    if (cacheKey && !forceRefresh) {
      const cachedData = getCachedData(cacheKey)
      if (cachedData) {
        setData(cachedData)
        setLoading(false)
        setError(null)
        return cachedData
      }
    }

    setLoading(true)
    setError(null)
    abortControllerRef.current = new AbortController()

    try {
      const result = await fetchFunction()
      
      if (!mountedRef.current) return

      setData(result)
      setError(null)
      setRetryAttempt(0)

      // Cache the result
      if (cacheKey) {
        setCachedData(cacheKey, result)
      }

      // Call success callback
      if (onSuccess) {
        onSuccess(result)
      }

      return result
    } catch (err) {
      if (!mountedRef.current) return

      // Don't set error if request was aborted
      if (err.name === 'AbortError') return

      setError(err)
      
      // Retry logic for network errors
      if (err instanceof APIError && err.status >= 500 && retryAttempt < retryCount) {
        setTimeout(() => {
          if (mountedRef.current) {
            setRetryAttempt(prev => prev + 1)
            fetchData(forceRefresh)
          }
        }, retryDelay * Math.pow(2, retryAttempt))
      } else {
        // Call error callback
        if (onError) {
          onError(err)
        }
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [fetchFunction, cacheKey, onSuccess, onError, retryCount, retryDelay, retryAttempt])

  // Fetch data when dependencies change
  useEffect(() => {
    if (immediate) {
      fetchData()
    }
  }, [fetchData, immediate, ...dependencies])

  const refetch = useCallback((forceRefresh = false) => {
    return fetchData(forceRefresh)
  }, [fetchData])

  const mutate = useCallback((newData) => {
    setData(newData)
    if (cacheKey) {
      setCachedData(cacheKey, newData)
    }
  }, [cacheKey])

  return {
    data,
    loading,
    error,
    refetch,
    mutate,
    isRetrying: retryAttempt > 0
  }
}

// Specialized hooks for different data types
export function useInventoryItems(filters = {}) {
  const { fetchInventoryItems } = require('../lib/api')
  
  return useFetch(
    () => fetchInventoryItems(filters),
    [JSON.stringify(filters)],
    {
      cacheKey: `inventory-items:${JSON.stringify(filters)}`,
      onError: (error) => console.error('Failed to fetch inventory items:', error)
    }
  )
}

export function useInventoryItem(itemId) {
  const { fetchInventoryItem } = require('../lib/api')
  
  return useFetch(
    itemId ? () => fetchInventoryItem(itemId) : null,
    [itemId],
    {
      cacheKey: itemId ? `inventory-item:${itemId}` : null,
      onError: (error) => console.error(`Failed to fetch inventory item ${itemId}:`, error)
    }
  )
}

export function usePurchaseOrders(filters = {}) {
  const { fetchPurchaseOrders } = require('../lib/api')
  
  return useFetch(
    () => fetchPurchaseOrders(filters),
    [JSON.stringify(filters)],
    {
      cacheKey: `purchase-orders:${JSON.stringify(filters)}`,
      onError: (error) => console.error('Failed to fetch purchase orders:', error)
    }
  )
}

export function useSuppliers(filters = {}) {
  const { fetchSuppliers } = require('../lib/api')
  
  return useFetch(
    () => fetchSuppliers(filters),
    [JSON.stringify(filters)],
    {
      cacheKey: `suppliers:${JSON.stringify(filters)}`,
      onError: (error) => console.error('Failed to fetch suppliers:', error)
    }
  )
}

export function useTransactions(filters = {}) {
  const { fetchTransactions } = require('../lib/api')
  
  return useFetch(
    () => fetchTransactions(filters),
    [JSON.stringify(filters)],
    {
      cacheKey: `transactions:${JSON.stringify(filters)}`,
      onError: (error) => console.error('Failed to fetch transactions:', error)
    }
  )
}

export function useTransactionHistory(itemId) {
  const { fetchTransactionHistory } = require('../lib/api')
  
  return useFetch(
    itemId ? () => fetchTransactionHistory(itemId) : null,
    [itemId],
    {
      cacheKey: itemId ? `transaction-history:${itemId}` : null,
      onError: (error) => console.error(`Failed to fetch transaction history for ${itemId}:`, error)
    }
  )
}

export function useAudits(filters = {}) {
  const { fetchAudits } = require('../lib/api')
  
  return useFetch(
    () => fetchAudits(filters),
    [JSON.stringify(filters)],
    {
      cacheKey: `audits:${JSON.stringify(filters)}`,
      onError: (error) => console.error('Failed to fetch audits:', error)
    }
  )
}

export function useAdjustmentRequests(filters = {}) {
  const { fetchAdjustmentRequests } = require('../lib/api')
  
  return useFetch(
    () => fetchAdjustmentRequests(filters),
    [JSON.stringify(filters)],
    {
      cacheKey: `adjustment-requests:${JSON.stringify(filters)}`,
      onError: (error) => console.error('Failed to fetch adjustment requests:', error)
    }
  )
}

// Optimistic update hook for mutations
export function useOptimisticUpdate() {
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateError, setUpdateError] = useState(null)

  const performUpdate = useCallback(async (
    updateFunction,
    optimisticData,
    dataHooks = [],
    rollbackData = null
  ) => {
    setIsUpdating(true)
    setUpdateError(null)

    // Apply optimistic updates
    dataHooks.forEach(hook => {
      if (hook.mutate) {
        hook.mutate(optimisticData)
      }
    })

    try {
      const result = await updateFunction()
      
      // Update with real data
      dataHooks.forEach(hook => {
        if (hook.mutate) {
          hook.mutate(result)
        }
      })

      return result
    } catch (error) {
      setUpdateError(error)
      
      // Rollback optimistic updates
      if (rollbackData) {
        dataHooks.forEach(hook => {
          if (hook.mutate) {
            hook.mutate(rollbackData)
          }
        })
      } else {
        // Refetch data to get current state
        dataHooks.forEach(hook => {
          if (hook.refetch) {
            hook.refetch(true)
          }
        })
      }
      
      throw error
    } finally {
      setIsUpdating(false)
    }
  }, [])

  return {
    performUpdate,
    isUpdating,
    updateError
  }
}

// Real-time updates hook (for WebSocket or polling)
export function useRealTimeUpdates(endpoint, interval = 30000) {
  const [isConnected, setIsConnected] = useState(false)
  const intervalRef = useRef(null)

  const startPolling = useCallback((callback) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    setIsConnected(true)
    intervalRef.current = setInterval(callback, interval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      setIsConnected(false)
    }
  }, [interval])

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return {
    startPolling,
    isConnected
  }
}