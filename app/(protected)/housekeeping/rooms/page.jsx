'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { usePageTitle } from '../../../../hooks/usePageTitle'
import roomsApi from '../../../../lib/roomsApi'
import bundlesApi from '../../../../lib/bundlesApi'

export default function HousekeepingRoomsPage() {
  const { setTitle } = usePageTitle()
  const router = useRouter()
  const searchParams = useSearchParams()
  const status = searchParams.get('status') || 'all'
  
  const [rooms, setRooms] = useState([])
  const [bundles, setBundles] = useState([])
  const [roomBundles, setRoomBundles] = useState({})
  const [bundleStatus, setBundleStatus] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const statusTitles = {
      'needs-inspection': 'Rooms Needing Inspection',
      'pending': 'Rooms In Use',
      'ready': 'Ready Rooms',
      'all': 'All Rooms'
    }
    setTitle(statusTitles[status] || 'Rooms')
  }, [setTitle, status])

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
    } finally {
      setLoading(false)
    }
  }

  const getAssignedBundle = (roomId) => {
    const bundleId = roomBundles[roomId]
    return bundles.find(b => b.id === bundleId)
  }

  // Filter rooms based on status
  const filteredRooms = rooms.filter(room => {
    const hasBundle = !!roomBundles[room.id]
    if (!hasBundle) return false

    const roomStatus = bundleStatus[room.id] || 'ready'
    
    if (status === 'all') return true
    if (status === 'needs-inspection') return roomStatus === 'needs-inspection'
    if (status === 'pending') return roomStatus === 'pending'
    if (status === 'ready') return roomStatus === 'ready'
    
    return false
  })

  // Group rooms by floor
  const roomsByFloor = filteredRooms.reduce((acc, room) => {
    const floor = room.floor || 1
    if (!acc[floor]) acc[floor] = []
    acc[floor].push(room)
    return acc
  }, {})

  const getStatusConfig = (roomId) => {
    const roomStatus = bundleStatus[roomId] || 'ready'
    
    const configs = {
      'needs-inspection': {
        label: 'Needs Inspection',
        color: 'bg-red-500',
        textColor: 'text-red-700',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-300',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        ),
        clickable: true
      },
      'pending': {
        label: 'In Use',
        color: 'bg-amber-500',
        textColor: 'text-amber-700',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-300',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        clickable: false
      },
      'ready': {
        label: 'Ready',
        color: 'bg-green-500',
        textColor: 'text-green-700',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-300',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        clickable: false
      }
    }
    
    return configs[roomStatus]
  }

  const handleRoomClick = (room) => {
    const config = getStatusConfig(room.id)
    if (config.clickable) {
      router.push(`/housekeeping/inspect/${room.id}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-500">Loading rooms...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <button
              onClick={() => router.push('/housekeeping')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-3 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm font-medium">Back to Dashboard</span>
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              {status === 'needs-inspection' && 'Rooms Needing Inspection'}
              {status === 'pending' && 'Rooms In Use'}
              {status === 'ready' && 'Ready Rooms'}
              {status === 'all' && 'All Rooms'}
            </h1>
            <p className="text-gray-600 mt-1">{filteredRooms.length} room{filteredRooms.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Rooms by Floor */}
        {filteredRooms.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-gray-500 text-lg">No rooms found</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.keys(roomsByFloor).sort((a, b) => b - a).map(floor => (
              <div key={floor} className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Floor {floor}</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  {roomsByFloor[floor].map(room => {
                    const config = getStatusConfig(room.id)
                    const bundle = getAssignedBundle(room.id)
                    
                    return (
                      <button
                        key={room.id}
                        onClick={() => handleRoomClick(room)}
                        disabled={!config.clickable}
                        className={`relative p-4 rounded-xl border-2 ${config.borderColor} ${config.bgColor} transition-all duration-200 ${
                          config.clickable 
                            ? 'hover:shadow-lg hover:scale-105 cursor-pointer' 
                            : 'opacity-75 cursor-not-allowed'
                        }`}
                      >
                        {/* Room Number */}
                        <div className="text-center mb-3">
                          <p className="text-2xl font-bold text-gray-900">{room.roomNumber || room.number}</p>
                          <p className="text-xs text-gray-500 mt-1">{room.type}</p>
                        </div>

                        {/* Status Badge */}
                        <div className={`flex items-center justify-center space-x-1 ${config.textColor} mb-2`}>
                          {config.icon}
                          <span className="text-xs font-medium">{config.label}</span>
                        </div>

                        {/* Bundle Name */}
                        {bundle && (
                          <div className="text-xs text-gray-600 text-center truncate">
                            {bundle.name}
                          </div>
                        )}

                        {/* Clickable indicator */}
                        {config.clickable && (
                          <div className="absolute top-2 right-2">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
