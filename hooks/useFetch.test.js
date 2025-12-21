import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import {
  useFetch,
  useOptimisticUpdate,
  useRealTimeUpdates
} from './useFetch'
import { APIError } from '../lib/api'

describe('useFetch Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  describe('Basic useFetch functionality', () => {
    it('should initialize with loading state', () => {
      const mockFetch = vi.fn().mockResolvedValue(['item1', 'item2'])
      
      const { result } = renderHook(() => 
        useFetch(mockFetch, [], { immediate: true })
      )
      
      expect(result.current.loading).toBe(true)
      expect(result.current.data).toBe(null)
      expect(result.current.error).toBe(null)
    })

    it('should not fetch immediately when immediate is false', () => {
      const mockFetch = vi.fn().mockResolvedValue(['item1'])
      
      const { result } = renderHook(() => 
        useFetch(mockFetch, [], { immediate: false })
      )
      
      expect(result.current.loading).toBe(false)
      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  describe('useOptimisticUpdate', () => {
    it('should perform optimistic update successfully', async () => {
      const { result } = renderHook(() => useOptimisticUpdate())
      
      const mockUpdateFunction = vi.fn().mockResolvedValue({ id: '1', updated: true })
      const optimisticData = { id: '1', updating: true }
      const mockHook = { mutate: vi.fn() }
      
      await act(async () => {
        await result.current.performUpdate(
          mockUpdateFunction,
          optimisticData,
          [mockHook]
        )
      })
      
      expect(mockHook.mutate).toHaveBeenCalledWith(optimisticData)
      expect(mockHook.mutate).toHaveBeenCalledWith({ id: '1', updated: true })
      expect(result.current.isUpdating).toBe(false)
      expect(result.current.updateError).toBe(null)
    })

    it('should rollback on update failure', async () => {
      const { result } = renderHook(() => useOptimisticUpdate())
      
      const mockError = new Error('Update failed')
      const mockUpdateFunction = vi.fn().mockRejectedValue(mockError)
      const optimisticData = { id: '1', updating: true }
      const rollbackData = { id: '1', original: true }
      const mockHook = { mutate: vi.fn(), refetch: vi.fn() }
      
      await act(async () => {
        try {
          await result.current.performUpdate(
            mockUpdateFunction,
            optimisticData,
            [mockHook],
            rollbackData
          )
        } catch (error) {
          expect(error).toBe(mockError)
        }
      })
      
      expect(mockHook.mutate).toHaveBeenCalledWith(optimisticData)
      expect(mockHook.mutate).toHaveBeenCalledWith(rollbackData)
      expect(result.current.updateError).toBe(mockError)
    })
  })

  describe('useRealTimeUpdates', () => {
    it('should cleanup interval on unmount', () => {
      const { result, unmount } = renderHook(() => useRealTimeUpdates('/test', 1000))
      
      const mockCallback = vi.fn()
      
      act(() => {
        result.current.startPolling(mockCallback)
      })
      
      unmount()
      
      // Should not call callback after unmount
      vi.advanceTimersByTime(1000)
      expect(mockCallback).not.toHaveBeenCalled()
    })
  })
})