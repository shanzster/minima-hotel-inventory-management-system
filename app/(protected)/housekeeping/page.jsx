'use client'

import { useState, useEffect, useRef } from 'react'
import { usePageTitle } from '../../../hooks/usePageTitle'
import { useAuth } from '../../../hooks/useAuth'
import HousekeepingChecklist from '../../../components/inventory/HousekeepingChecklist'
import RoomInspectionHistory from '../../../components/inventory/RoomInspectionHistory'
import Modal from '../../../components/ui/Modal'
import roomsApi from '../../../lib/roomsApi'
import bundlesApi from '../../../lib/bundlesApi'
import bookingsApi from '../../../lib/bookingsApi'
import toast from '../../../lib/toast'

export default function HousekeepingPage() {
  const { setTitle } = usePageTitle()
  const { user, logout } = useAuth()
  const [rooms, setRooms] = useState([])
  const [bundles, setBundles] = useState([])
  const [roomBundles, setRoomBundles] = useState({})
  const [bundleStatus, setBundleStatus] = useState({})
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [showChecklistModal, setShowChecklistModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')
  const [loading, setLoading] = useState(true)
  const [notificationPermission, setNotificationPermission] = useState('default')
  const previousCheckedOutBookings = useRef(new Set())

  // Check if user is housekeeping staff
  const isHousekeepingUser = user?.role === 'housekeeping'

  useEffect(() => {
    setTitle('Housekeeping')
  }, [setTitle])

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission)
      
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          setNotificationPermission(permission)
        })
      }
    }
  }, [])

  // Listen for new checkouts and send browser notifications
  useEffect(() => {
    const unsubscribe = bookingsApi.onCheckedOutBookings((checkedOutBookings) => {
      // Skip initial load - only notify on new checkouts
      if (previousCheckedOutBookings.current.size === 0) {
        // Initialize with current bookings
        checkedOutBookings.forEach(booking => {
          previousCheckedOutBookings.current.add(booking.id)
        })
        return
      }

      // Check for new checkouts
      checkedOutBookings.forEach(booking => {
        if (!previousCheckedOutBookings.current.has(booking.id)) {
          // New checkout detected
          previousCheckedOutBookings.current.add(booking.id)
          
          // Get room number from booking or find it from rooms array
          let roomNumber = booking.roomNumber
          if (!roomNumber && booking.roomId) {
            const room = rooms.find(r => r.id === booking.roomId)
            roomNumber = room?.roomNumber || room?.number
          }
          roomNumber = roomNumber || 'Unknown'
          
          const guestName = booking.guestName || 'Guest'
          
          // Show browser notification
          if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification('Guest Checked Out', {
              body: `${guestName} has checked out of Room ${roomNumber}`,
              icon: '/icon-192x192.png',
              badge: '/badge-72x72.png',
              tag: `checkout-${booking.id}`,
              requireInteraction: false,
              silent: false
            })

            // Auto-close notification after 10 seconds
            setTimeout(() => notification.close(), 10000)

            // Optional: Handle notification click
            notification.onclick = () => {
              window.focus()
              notification.close()
            }
          }
          
          // Also show in-app toast notification
          toast.info(`Checkout: ${guestName} - Room ${roomNumber}`)
        }
      })

      // Remove bookings that are no longer checked-out
      const currentBookingIds = new Set(checkedOutBookings.map(b => b.id))
      previousCheckedOutBookings.current.forEach(bookingId => {
        if (!currentBookingIds.has(bookingId)) {
          previousCheckedOutBookings.current.delete(bookingId)
        }
      })
    })

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [rooms])

  // Load initial data and setup real-time listeners
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true)
        const [allBundles, assignments, statuses] = await Promise.all([
          bundlesApi.getAll(),
          bundlesApi.getRoomAssignments(),
          bundlesApi.getRoomStatuses()
        ])
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

    loadInitialData()

    // Setup real-time listener for rooms
    const unsubscribeRooms = roomsApi.onRoomsChange((updatedRooms) => {
      setRooms(updatedRooms)
    })

    // Setup real-time listener for bundle statuses
    const unsubscribeBundleStatus = bundlesApi.onRoomStatusesChange((statuses) => {
      setBundleStatus(statuses)
    })

    return () => {
      if (unsubscribeRooms) unsubscribeRooms()
      if (unsubscribeBundleStatus) unsubscribeBundleStatus()
    }
  }, [])

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
    if (isHousekeepingUser) {
      setShowChecklistModal(true)
    } else {
      // Inventory controllers see history
      setShowHistoryModal(true)
    }
  }

  const handleViewHistory = (room) => {
    setSelectedRoom(room)
    setShowHistoryModal(true)
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
        const totalConsumed = consumedItems.reduce((sum, item) => sum + item.consumed, 0)
        toast.success(`Inspection completed for Room ${checklistData.room.roomNumber || checklistData.room.number}. ${totalConsumed} items consumed and deducted from stock.`)
        
        // Close modal
        setShowChecklistModal(false)
        setSelectedRoom(null)
        
        // Reload page after a short delay to show the toast
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      } else {
        toast.error(`Inspection completed with errors: ${result.errors.join(', ')}`)
      }
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
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Housekeeping</h1>
          <p className="text-sm text-gray-600 mt-1">Manage room inspections and bundle status</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Notification Status Indicator */}
          <div className="flex items-center space-x-2 bg-white border-2 border-gray-200 rounded-lg px-4 py-2">
            {notificationPermission === 'granted' ? (
              <>
                <div className="relative">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                  </svg>
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                </div>
                <span className="text-sm font-medium text-green-700">Notifications Active</span>
              </>
            ) : notificationPermission === 'denied' ? (
              <>
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                  <path fillRule="evenodd" d="M3 3l14 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <span className="text-sm font-medium text-red-700">Notifications Blocked</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                </svg>
                <button
                  onClick={() => {
                    if ('Notification' in window) {
                      Notification.requestPermission().then(permission => {
                        setNotificationPermission(permission)
                      })
                    }
                  }}
                  className="text-sm font-medium text-amber-700 hover:text-amber-800 underline"
                >
                  Enable Notifications
                </button>
              </>
            )}
          </div>

          {/* Logout Button - Only for housekeeping users */}
          {isHousekeepingUser && (
            <button
              onClick={() => {
                if (confirm('Are you sure you want to logout?')) {
                  logout()
                  window.location.href = '/login'
                }
              }}
              className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg transition-colors active:scale-95"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
            </button>
          )}
        </div>
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

      {/* Filter Buttons - Touch Optimized */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-6 py-4 rounded-xl text-base font-bold transition-all active:scale-95 ${
            filterStatus === 'all' ? 'bg-black text-white shadow-lg' : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50'
          }`}
        >
          All Rooms
        </button>
        <button
          onClick={() => setFilterStatus('needs-inspection')}
          className={`px-6 py-4 rounded-xl text-base font-bold transition-all active:scale-95 ${
            filterStatus === 'needs-inspection' ? 'bg-red-600 text-white shadow-lg' : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50'
          }`}
        >
          <div className="flex flex-col items-center">
            <span>Needs Inspection</span>
            <span className="text-2xl font-black">{needsInspectionCount}</span>
          </div>
        </button>
        <button
          onClick={() => setFilterStatus('pending')}
          className={`px-6 py-4 rounded-xl text-base font-bold transition-all active:scale-95 ${
            filterStatus === 'pending' ? 'bg-amber-600 text-white shadow-lg' : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50'
          }`}
        >
          <div className="flex flex-col items-center">
            <span>Pending</span>
            <span className="text-2xl font-black">{pendingRooms}</span>
          </div>
        </button>
        <button
          onClick={() => setFilterStatus('completed')}
          className={`px-6 py-4 rounded-xl text-base font-bold transition-all active:scale-95 ${
            filterStatus === 'completed' ? 'bg-green-600 text-white shadow-lg' : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50'
          }`}
        >
          <div className="flex flex-col items-center">
            <span>Ready</span>
            <span className="text-2xl font-black">{readyRooms}</span>
          </div>
        </button>
      </div>

      {/* Rooms Grid - Touch Optimized */}
      <div className="space-y-6">
        <div className="bg-white/80 backdrop-blur-xl rounded-lg border border-white/20 p-6 shadow-xl">
          <h3 className="font-semibold text-xl text-gray-900 mb-6">All Rooms</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
                  cardStyle = isHousekeepingUser 
                    ? 'border-red-500 bg-red-50 hover:border-red-600 hover:shadow-md cursor-pointer'
                    : 'border-red-500 bg-red-50 hover:border-red-600 hover:shadow-md cursor-pointer'
                  iconBg = 'bg-red-100'
                  statusBadge = 'bg-red-100 text-red-700 font-semibold'
                  statusText = 'Inspection Needed'
                  icon = (
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )
                } else if (isPending) {
                  cardStyle = isHousekeepingUser
                    ? 'border-amber-500 bg-amber-50 cursor-not-allowed'
                    : 'border-amber-500 bg-amber-50 hover:border-amber-600 hover:shadow-md cursor-pointer'
                  iconBg = 'bg-amber-100'
                  statusBadge = 'bg-amber-100 text-amber-700'
                  statusText = 'Pending (In Use)'
                  icon = (
                    <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )
                } else if (isReady) {
                  cardStyle = isHousekeepingUser
                    ? 'border-green-500 bg-green-50 cursor-not-allowed'
                    : 'border-green-500 bg-green-50 hover:border-green-600 hover:shadow-md cursor-pointer'
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
                    <button
                      onClick={() => {
                        if (isHousekeepingUser && isNeedsInspection) {
                          handleStartChecklist(room)
                        } else if (!isHousekeepingUser && hasBundle) {
                          handleViewHistory(room)
                        }
                      }}
                      disabled={isHousekeepingUser ? !isNeedsInspection : !hasBundle}
                      className={`w-full p-8 rounded-2xl border-4 transition-all ${
                        (isHousekeepingUser && isNeedsInspection) || (!isHousekeepingUser && hasBundle) ? 'active:scale-95 cursor-pointer' : ''
                      } ${cardStyle}`}
                    >
                      <div className="flex flex-col items-center space-y-4">
                        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center ${iconBg}`}>
                          <div className="scale-150">{icon}</div>
                        </div>
                        <span className="text-3xl font-black text-gray-900">
                          {room.roomNumber || room.number}
                        </span>
                        <span className={`text-sm px-4 py-2 rounded-lg font-bold ${statusBadge}`}>
                          {statusText}
                        </span>
                        {!isHousekeepingUser && hasBundle && (
                          <span className="text-xs text-blue-600 font-medium">
                            Click to view history
                          </span>
                        )}
                      </div>
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
      </div>

      {/* Inspection Modal - For Housekeeping Staff */}
      {selectedRoom && isHousekeepingUser && (
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

      {/* History Modal - For Inventory Controllers */}
      {selectedRoom && !isHousekeepingUser && (
        <Modal
          isOpen={showHistoryModal}
          onClose={() => {
            setShowHistoryModal(false)
            setSelectedRoom(null)
          }}
          title="Room Inspection History"
          size="4xl"
        >
          <RoomInspectionHistory
            room={selectedRoom}
            onClose={() => {
              setShowHistoryModal(false)
              setSelectedRoom(null)
            }}
          />
        </Modal>
      )}
    </div>
  )
}
