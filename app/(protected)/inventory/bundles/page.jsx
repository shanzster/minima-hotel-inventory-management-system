'use client'

import { useState, useEffect } from 'react'
import { usePageTitle } from '../../../../hooks/usePageTitle'
import { useAuth } from '../../../../hooks/useAuth'
import BundleManager from '../../../../components/inventory/BundleManager'
import toast from '../../../../lib/toast'

// Mock bundles storage (in real app, this would be in Firebase)
const STORAGE_KEY = 'hotel_inventory_bundles'

export default function BundlesPage() {
  const { setTitle } = usePageTitle()
  const { user } = useAuth()
  const [bundles, setBundles] = useState([])

  useEffect(() => {
    setTitle('Bundle Management')
  }, [setTitle])

  // Load bundles from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setBundles(JSON.parse(stored))
      } catch (error) {
        console.error('Error loading bundles:', error)
      }
    } else {
      // Initialize with default bundles
      const defaultBundles = [
        {
          id: 1,
          name: 'Standard Room Kit',
          description: 'Essential toiletries for standard rooms',
          type: 'standard',
          items: [
            { id: 1, name: 'Toothpaste', quantity: 2 },
            { id: 2, name: 'Toothbrush', quantity: 2 },
            { id: 3, name: 'Shampoo', quantity: 1 },
            { id: 4, name: 'Body Wash', quantity: 1 },
            { id: 5, name: 'Soap Bar', quantity: 2 },
            { id: 6, name: 'Towels', quantity: 4 },
            { id: 7, name: 'Tissues', quantity: 1 },
            { id: 8, name: 'Toilet Paper', quantity: 4 }
          ],
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          name: 'Deluxe Room Kit',
          description: 'Premium toiletries for deluxe rooms',
          type: 'deluxe',
          items: [
            { id: 1, name: 'Toothpaste', quantity: 2 },
            { id: 2, name: 'Toothbrush', quantity: 2 },
            { id: 3, name: 'Shampoo', quantity: 1 },
            { id: 4, name: 'Conditioner', quantity: 1 },
            { id: 5, name: 'Body Wash', quantity: 1 },
            { id: 6, name: 'Soap Bar', quantity: 2 },
            { id: 7, name: 'Bathrobe', quantity: 2 },
            { id: 8, name: 'Slippers', quantity: 2 },
            { id: 9, name: 'Towels', quantity: 6 },
            { id: 10, name: 'Tissues', quantity: 2 },
            { id: 11, name: 'Toilet Paper', quantity: 6 }
          ],
          createdAt: new Date().toISOString()
        }
      ]
      setBundles(defaultBundles)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultBundles))
    }
  }, [])

  // Save bundles to localStorage
  const saveBundles = (newBundles) => {
    setBundles(newBundles)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newBundles))
  }

  const handleCreateBundle = (bundle) => {
    const newBundles = [...bundles, bundle]
    saveBundles(newBundles)
    toast.success('Bundle created successfully')
  }

  const handleEditBundle = (bundleId, updatedBundle) => {
    const newBundles = bundles.map(b => b.id === bundleId ? { ...b, ...updatedBundle } : b)
    saveBundles(newBundles)
    toast.success('Bundle updated successfully')
  }

  const handleDeleteBundle = (bundleId) => {
    if (confirm('Are you sure you want to delete this bundle?')) {
      const newBundles = bundles.filter(b => b.id !== bundleId)
      saveBundles(newBundles)
      toast.success('Bundle deleted successfully')
    }
  }

  const handleAssignBundle = async (bundle, roomIds) => {
    try {
      // Get current room-bundle assignments
      const stored = localStorage.getItem('room_bundle_assignments')
      let assignments = {}
      if (stored) {
        try {
          assignments = JSON.parse(stored)
        } catch (error) {
          console.error('Error loading assignments:', error)
        }
      }

      // Assign bundle to selected rooms (no stock deduction yet - happens when room is booked)
      for (const roomId of roomIds) {
        assignments[roomId] = bundle.id
      }

      // Save assignments
      localStorage.setItem('room_bundle_assignments', JSON.stringify(assignments))
      
      toast.success(`Bundle "${bundle.name}" assigned to ${roomIds.length} room(s). Stock will be deducted when rooms are booked.`)
    } catch (error) {
      console.error('Error assigning bundle:', error)
      toast.error('Failed to assign bundle')
    }
  }

  const handleClearAllAssignments = () => {
    if (!confirm('⚠️ Are you sure you want to remove ALL bundle assignments from all rooms? This cannot be undone.')) {
      return
    }

    try {
      // Clear room bundle assignments
      localStorage.removeItem('room_bundle_assignments')
      
      // Clear bundle status
      localStorage.removeItem('room_bundle_status')
      
      toast.success('All bundle assignments have been cleared from all rooms')
    } catch (error) {
      console.error('Error clearing assignments:', error)
      toast.error('Failed to clear assignments')
    }
  }

  return (
    <div className="p-4 mx-2">
      <BundleManager
        bundles={bundles}
        onCreateBundle={handleCreateBundle}
        onEditBundle={handleEditBundle}
        onDeleteBundle={handleDeleteBundle}
        onAssignBundle={handleAssignBundle}
        onClearAllAssignments={handleClearAllAssignments}
      />
    </div>
  )
}
