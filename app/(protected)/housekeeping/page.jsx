'use client'

import { useState, useEffect } from 'react'
import { usePageTitle } from '../../../hooks/usePageTitle'
import { useAuth } from '../../../hooks/useAuth'
import HousekeepingChecklist from '../../../components/inventory/HousekeepingChecklist'
import Modal from '../../../components/ui/Modal'
import roomsApi from '../../../lib/roomsApi'
import bundlesApi from '../../../lib/bundlesApi'
import toast from '../../../lib/toast'

export default function HousekeepingPage() {
  const { setTitle } = usePageTitle()
  const { user } = useAuth()
  const [rooms, setRooms] = useState([])
  const [bundles, setBundles] = useState([])
  const [roomBundles, setRoomBundles] = useState({})
  const [bundleStatus, setBundleStatus] = useState({})
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [showChecklistModal, setShowChecklistModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setTitle('Housekeeping')
  }, [setTitle])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [allRooms, allBundles, assignments, statuses] = await Promise.all([
        roomsApi.getAll(),
        bundlesApi.getAll(),
        bundlesApi.getRoomAssignments(),
        bundlesApi.getRoomStatuses()
      ])
      setRooms(allRooms)
      setBundles(allBundles)
      setRoomBundles(assignments)
      setBundleStatus(statuses)
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load housekeeping data')
    } finally {
      setLoading(false)
    }
  }

  // Monitor room status changes and update bundle status automatically
  useEffect(() => {
    if (rooms.length === 0 || Object.keys(roomBundles).length === 0) return

    const checkRoomStatusChanges = async () => {
      let statusChanged = false
      const updates = []

      for (const room of rooms) {
        const bundleAssignment = roomBundles[room.id]
        if (!bundleAssignment) continue

        const currentStatus = bundleStatus[room.id]

        // Room just got booked - set to pending (stock deduction happens on checkout/inspection)
        if (room.status === 'occupied' && currentStatus !== 'pending') {
          updates.push({
            roomId: room.id,
            bundleId: bundleAssignment.bundleId,
            status: 'pending'
          })
          statusChanged = true
        }
        // Guest checked out - needs inspection
        else if (room.status === 'available' && currentStatus === 'pending') {
          updates.push({
            roomId: room.id,
            bundleId: bundleAssignment.bundleId,
            status: 'needs-inspection'
          })
          statusChanged = true
        }
      }

      // Apply all updates
      if (statusChanged) {
        for (const update of updates) {
          try {
            await bundlesApi.updateRoomStatus(update.bundleId, update.roomId, update.status)
          } catch (error) {
            console.error(`Error updating status for room ${update.roomId}:`, error)
          }
        }
        // Reload statuses
        const newStatuses = await bundlesApi.getRoomStatuses()
        setBundleStatus(newStatuses)
      }
    }

    checkRoomStatusChanges()
  }, [rooms, roomBundles, user])

  const getAssignedBundle = (roomId) => {
    const bundleAssignment = roomBundles[roomId]
    if (!bundleAssignment) return null
    
    // roomBundles now contains the complete bundle data
    // Return it directly instead of looking it up in bundles array
    return {
      id: bundleAssignment.bundleId,
      name: bundleAssignment.bundleName,
      type: bundleAssignment.bundleType,
      description: bundleAssignment.bundleDescription,
      items: bundleAssignment.items || [],
      assignedAt: bundleAssignment.assignedAt,
      assignedBy: bundleAssignment.assignedBy
    }
  }

  const handleStartChecklist = (room) => {
    setSelectedRoom(room)
    setShowChecklistModal(true)
  }

  const handleCompleteChecklist = async (checklistData) => {
    try {
      const bundle = getAssignedBundle(checklistData.room.id)
      if (!bundle) {
        toast.error('Bundle not found')
        return
      }

      // Prepare consumed items data
      const consumedItems = checklistData.items
        .filter(item => item.consumed > 0)
        .map(item => ({
          itemId: item.itemId,
          name: item.name,
          bundleQuantity: item.deployed,
          consumed: item.consumed
        }))

      // Record consumption and deduct stock
      const result = await bundlesApi.recordConsumption(
        checklistData.room.id,
        bundle.id,
        consumedItems,
        user?.id || 'housekeeping',
        checklistData.notes || ''
      )

      if (result.success) {
        // Reload data
        await loadData()
        
        const totalConsumed = consumedItems.reduce((sum, item) => sum + item.consumed, 0)
        toast.success(`Inspection completed for Room ${checklistData.room.roomNumber || checklistData.room.number}. ${totalConsumed} items consumed and deducted from stock.`)
      } else {
        toast.error(`Inspection completed with errors: ${result.errors.join(', ')}`)
      }

      setShowChecklistModal(false)
      setSelectedRoom(null)
    } catch (error) {
      console.error('Error completing checklist:', error)
      toast.error('Failed to complete inspection')
    }
  }

  const handleRemoveBundle = async (roomId, roomNumber) => {
    if (!confirm(`Remove bundle from Room ${roomNumber}? This will not return any stock.`)) {
      return
    }

    try {
      // Find which bundle is assigned to this room
      const bundleAssignment = roomBundles[roomId]
      if (!bundleAssignment) {
        toast.error('No bundle assigned to this room')
        return
      }

      await bundlesApi.removeBundleFromRoom(bundleAssignment.bundleId, roomId)
      await loadData()
      toast.success(`Bundle removed from Room ${roomNumber}`)
    } catch (error) {
      console.error('Error removing bundle:', error)
      toast.error('Failed to remove bundle')
    }
  }

  const handlePrintRoomChecklist = (room) => {
    const bundle = getAssignedBundle(room.id)
    if (!bundle) return

    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html>
        <head>
          <title>Room ${room.roomNumber || room.number} Inspection Checklist</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #f4f4f4; }
            .header { margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Room ${room.roomNumber || room.number} - Post-Checkout Inspection</h1>
            <p><strong>Bundle:</strong> ${bundle.name}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Deployed</th>
                <th>Consumed</th>
                <th>Remaining</th>
              </tr>
            </thead>
            <tbody>
              ${bundle.items.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.quantity}</td>
                  <td></td>
                  <td></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div style="margin-top: 40px;">
            <p><strong>Notes:</strong></p>
            <div style="border: 1px solid #ddd; min-height: 100px; padding: 10px;"></div>
          </div>
          <div style="margin-top: 40px;">
            <p><strong>Inspected by:</strong> _______________________</p>
            <p><strong>Date:</strong> _______________________</p>
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  // Filter rooms
  const filteredRooms = rooms.filter(room => {
    const hasBundle = !!roomBundles[room.id]
    if (!hasBundle) return false

    const status = bundleStatus[room.id] || 'ready'
    
    if (filterStatus === 'all') return true
    if (filterStatus === 'needs-inspection') return status === 'needs-inspection'
    if (filterStatus === 'pending') return status === 'pending'
    if (filterStatus === 'completed') return status === 'ready'
    
    return true
  })

  // Calculate counts
  const needsInspectionCount = rooms.filter(r => roomBundles[r.id] && bundleStatus[r.id] === 'needs-inspection').length
  const pendingRooms = rooms.filter(r => roomBundles[r.id] && bundleStatus[r.id] === 'pending').length
  const readyRooms = rooms.filter(r => roomBundles[r.id] && (bundleStatus[r.id] === 'ready' || !bundleStatus[r.id])).length
  const totalRooms = rooms.filter(r => roomBundles[r.id]).length

  if (loading) {
    return (
      <div className="p-4 mx-2">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 mx-2">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Housekeeping</h1>
        <p className="text-sm text-gray-600 mt-1">Manage room inspections and bundle status</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-medium">Needs Inspection</p>
              <p className="text-3xl font-bold text-red-700">{needsInspectionCount}</p>
            </div>
            <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-amber-600 font-medium">Pending (In Use)</p>
              <p className="text-3xl font-bold text-amber-700">{pendingRooms}</p>
            </div>
            <svg className="w-10 h-10 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Ready</p>
              <p className="text-3xl font-bold text-green-700">{readyRooms}</p>
            </div>
            <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Rooms</p>
              <p className="text-3xl font-bold text-blue-700">{totalRooms}</p>
            </div>
            <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex items-center space-x-3 mb-6">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            filterStatus === 'all' ? 'bg-black text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          All Rooms
        </button>
        <button
          onClick={() => setFilterStatus('needs-inspection')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            filterStatus === 'needs-inspection' ? 'bg-red-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Needs Inspection ({needsInspectionCount})
        </button>
        <button
          onClick={() => setFilterStatus('pending')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            filterStatus === 'pending' ? 'bg-amber-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Pending ({pendingRooms})
        </button>
        <button
          onClick={() => setFilterStatus('completed')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            filterStatus === 'completed' ? 'bg-green-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Ready ({readyRooms})
        </button>
      </div>

      {/* Rooms Grid */}
      <div className="space-y-6">
        <div className="bg-white/80 backdrop-blur-xl rounded-lg border border-white/20 p-4 shadow-xl">
          <h3 className="font-semibold text-gray-900 mb-4">All Rooms</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {filteredRooms.map(room => {
                const hasBundle = !!getAssignedBundle(room.id)
                const status = bundleStatus[room.id] || 'ready'
                const isNeedsInspection = status === 'needs-inspection'
                const isPending = status === 'pending'
                const isReady = status === 'ready'

                // Determine card styling based on status
                let cardStyle = ''
                let iconBg = ''
                let statusBadge = ''
                let statusText = ''
                let icon = null

                if (!hasBundle) {
                  cardStyle = 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                  iconBg = 'bg-gray-200'
                  statusBadge = 'bg-gray-200 text-gray-600'
                  statusText = 'No Bundle'
                  icon = (
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )
                } else if (isNeedsInspection) {
                  cardStyle = 'border-red-500 bg-red-50 hover:border-red-600 hover:shadow-md'
                  iconBg = 'bg-red-100'
                  statusBadge = 'bg-red-100 text-red-700 font-semibold'
                  statusText = 'Inspection Needed'
                  icon = (
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )
                } else if (isPending) {
                  cardStyle = 'border-amber-500 bg-amber-50 cursor-not-allowed'
                  iconBg = 'bg-amber-100'
                  statusBadge = 'bg-amber-100 text-amber-700'
                  statusText = 'Pending (In Use)'
                  icon = (
                    <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )
                } else if (isReady) {
                  cardStyle = 'border-green-500 bg-green-50 cursor-not-allowed'
                  iconBg = 'bg-green-100'
                  statusBadge = 'bg-green-100 text-green-700'
                  statusText = 'Ready'
                  icon = (
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )
                }

                return (
                  <div
                    key={room.id}
                    className="relative"
                  >
                    {hasBundle && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemoveBundle(room.id, room.roomNumber || room.number)
                        }}
                        className="absolute top-2 left-2 p-1 bg-white rounded-md shadow-sm hover:bg-red-50 transition-all z-10 group"
                        title="Remove bundle from room"
                      >
                        <svg className="w-4 h-4 text-gray-600 group-hover:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                    {hasBundle && isNeedsInspection && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handlePrintRoomChecklist(room)
                        }}
                        className="absolute top-2 right-2 p-1 bg-white rounded-md shadow-sm hover:bg-gray-50 transition-all z-10"
                        title="Print checklist"
                      >
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => isNeedsInspection && handleStartChecklist(room)}
                      disabled={!isNeedsInspection}
                      className={`w-full p-4 rounded-xl border-2 transition-all ${cardStyle}`}
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${iconBg}`}>
                          {icon}
                        </div>
                        <span className="text-base font-bold text-gray-900">
                          {room.roomNumber || room.number}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${statusBadge}`}>
                          {statusText}
                        </span>
                      </div>
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
      </div>

      {/* Inspection Modal */}
      {selectedRoom && (
        <Modal
          isOpen={showChecklistModal}
          onClose={() => {
            setShowChecklistModal(false)
            setSelectedRoom(null)
          }}
          title="Post-Checkout Inspection"
          size="2xl"
        >
          <HousekeepingChecklist
            room={selectedRoom}
            assignedBundle={getAssignedBundle(selectedRoom.id)}
            onComplete={handleCompleteChecklist}
            onCancel={() => {
              setShowChecklistModal(false)
              setSelectedRoom(null)
            }}
          />
        </Modal>
      )}
    </div>
  )
}
