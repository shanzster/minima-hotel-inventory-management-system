'use client'

import { useState, useEffect } from 'react'
import { usePageTitle } from '../../../../hooks/usePageTitle'
import { useAuth } from '../../../../hooks/useAuth'
import BundleManager from '../../../../components/inventory/BundleManager'
import toast from '../../../../lib/toast'
import bundlesApi from '../../../../lib/bundlesApi'

export default function BundlesPage() {
  const { setTitle } = usePageTitle()
  const { user } = useAuth()
  const [bundles, setBundles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showClearAllModal, setShowClearAllModal] = useState(false)
  const [assignedRoomsCount, setAssignedRoomsCount] = useState(0)

  useEffect(() => {
    setTitle('Bundle Management')
  }, [setTitle])

  // Load bundles from Firebase
  useEffect(() => {
    loadBundles()
  }, [])

  const loadBundles = async () => {
    try {
      setLoading(true)
      const data = await bundlesApi.getAll()
      setBundles(data)
    } catch (error) {
      console.error('Error loading bundles:', error)
      toast.error('Failed to load bundles')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateBundle = async (bundle) => {
    try {
      await bundlesApi.create(bundle)
      await loadBundles()
      toast.success('Bundle created successfully')
    } catch (error) {
      console.error('Error creating bundle:', error)
      toast.error('Failed to create bundle')
    }
  }

  const handleEditBundle = async (bundleId, updatedBundle) => {
    try {
      await bundlesApi.update(bundleId, updatedBundle)
      await loadBundles()
      toast.success('Bundle updated successfully')
    } catch (error) {
      console.error('Error updating bundle:', error)
      toast.error('Failed to update bundle')
    }
  }

  const handleDeleteBundle = async (bundleId) => {
    if (!confirm('Are you sure you want to delete this bundle?')) {
      return
    }

    try {
      await bundlesApi.delete(bundleId)
      await loadBundles()
      toast.success('Bundle deleted successfully')
    } catch (error) {
      console.error('Error deleting bundle:', error)
      toast.error('Failed to delete bundle')
    }
  }

  const handleAssignBundle = async (bundle, roomIds) => {
    try {
      // Pass user information for assignment tracking
      await bundlesApi.assignBundleToRooms(bundle.id, roomIds, {
        bundleName: bundle.name,
        bundleType: bundle.type,
        bundleDescription: bundle.description,
        items: bundle.items,
        assignedBy: user?.name || user?.email || 'Unknown User'
      })
      
      toast.success(`Bundle "${bundle.name}" permanently assigned to ${roomIds.length} room(s). Bundle will remain in room and be refurbished after each guest checkout.`)
    } catch (error) {
      console.error('Error assigning bundle:', error)
      toast.error('Failed to assign bundle')
    }
  }

  const handleClearAllAssignments = async () => {
    // Calculate assigned rooms count
    try {
      const assignments = await bundlesApi.getRoomAssignments()
      const count = Object.keys(assignments).length
      setAssignedRoomsCount(count)
      setShowClearAllModal(true)
    } catch (error) {
      console.error('Error loading assignments:', error)
      toast.error('Failed to load room assignments')
    }
  }

  const handleConfirmClearAll = async () => {
    try {
      await bundlesApi.clearAllAssignments()
      await bundlesApi.clearAllStatuses()
      setShowClearAllModal(false)
      toast.success('All bundle assignments have been cleared from all rooms')
    } catch (error) {
      console.error('Error clearing assignments:', error)
      toast.error('Failed to clear assignments')
    }
  }

  if (loading) {
    return (
      <div className="p-4 mx-2">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading bundles...</div>
        </div>
      </div>
    )
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
        showClearAllModal={showClearAllModal}
        assignedRoomsCount={assignedRoomsCount}
        onConfirmClearAll={handleConfirmClearAll}
        onCancelClearAll={() => setShowClearAllModal(false)}
      />
    </div>
  )
}
