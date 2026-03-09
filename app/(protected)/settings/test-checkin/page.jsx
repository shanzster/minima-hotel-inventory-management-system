'use client'

import { useState, useEffect } from 'react'
import { usePageTitle } from '../../../../hooks/usePageTitle'
import { useAuth } from '../../../../hooks/useAuth'
import Button from '../../../../components/ui/Button'
import bookingsApi from '../../../../lib/bookingsApi'
import roomsApi from '../../../../lib/roomsApi'
import toast from '../../../../lib/toast'

export default function TestCheckInPage() {
  const { setTitle } = usePageTitle()
  const { user, hasRole } = useAuth()
  const [rooms, setRooms] = useState([])
  const [selectedRoomId, setSelectedRoomId] = useState('')
  const [guestName, setGuestName] = useState('')
  const [loading, setLoading] = useState(false)
  const [bookings, setBookings] = useState([])

  useEffect(() => {
    setTitle('Test Check-In Notifications')
  }, [setTitle])

  useEffect(() => {
    loadRooms()
    loadBookings()
  }, [])

  const loadRooms = async () => {
    try {
      const allRooms = await roomsApi.getAll()
      setRooms(allRooms)
    } catch (error) {
      console.error('Error loading rooms:', error)
    }
  }

  const loadBookings = async () => {
    try {
      const allBookings = await bookingsApi.getAll()
      setBookings(allBookings)
    } catch (error) {
      console.error('Error loading bookings:', error)
    }
  }

  const handleCreateCheckIn = async () => {
    if (!selectedRoomId || !guestName.trim()) {
      toast.error('Please select a room and enter guest name')
      return
    }

    try {
      setLoading(true)
      const room = rooms.find(r => r.id === selectedRoomId)
      
      const booking = await bookingsApi.create({
        roomId: selectedRoomId,
        roomNumber: room?.roomNumber || 'Unknown',
        guestName: guestName.trim(),
        status: 'checked-in',
        checkInDate: new Date().toISOString(),
        checkOutDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days later
        createdBy: user?.name || user?.email || 'Test User'
      })

      toast.success(`Check-in created for ${guestName} in Room ${room?.roomNumber}`)
      setGuestName('')
      setSelectedRoomId('')
      await loadBookings()
    } catch (error) {
      console.error('Error creating check-in:', error)
      toast.error('Failed to create check-in')
    } finally {
      setLoading(false)
    }
  }

  const handleCheckOut = async (bookingId) => {
    try {
      const booking = bookings.find(b => b.id === bookingId)
      await bookingsApi.update(bookingId, {
        ...booking,
        status: 'checked-out',
        actualCheckOutDate: new Date().toISOString()
      })
      toast.success('Guest checked out')
      await loadBookings()
    } catch (error) {
      console.error('Error checking out:', error)
      toast.error('Failed to check out')
    }
  }

  const checkedInBookings = bookings.filter(b => b.status === 'checked-in')

  return (
    <div className="p-4 mx-2 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Test Check-In Notifications</h1>
        <p className="text-sm text-gray-600 mt-1">
          Create test check-ins to verify housekeeping notifications are working
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <h3 className="text-sm font-bold text-amber-900">Testing Instructions</h3>
            <ol className="text-sm text-amber-800 mt-2 space-y-1 list-decimal list-inside">
              <li>Open the Housekeeping page in another tab/window</li>
              <li>Ensure notifications are enabled (green indicator)</li>
              <li>Create a check-in below</li>
              <li>You should see a browser notification and toast in the Housekeeping page</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Create Check-In Form */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Create Test Check-In</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Room
            </label>
            <select
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20"
            >
              <option value="">Choose a room...</option>
              {rooms.map(room => (
                <option key={room.id} value={room.id}>
                  Room {room.roomNumber} - {room.type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Guest Name
            </label>
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="e.g., John Doe"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20"
            />
          </div>

          <Button
            onClick={handleCreateCheckIn}
            disabled={loading || !selectedRoomId || !guestName.trim()}
            className="w-full bg-black text-white hover:bg-gray-800"
          >
            {loading ? 'Creating Check-In...' : 'Create Check-In (Will Trigger Notification)'}
          </Button>
        </div>
      </div>

      {/* Current Check-Ins */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          Current Check-Ins ({checkedInBookings.length})
        </h2>

        {checkedInBookings.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No active check-ins</p>
        ) : (
          <div className="space-y-3">
            {checkedInBookings.map(booking => (
              <div
                key={booking.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div>
                  <h3 className="font-bold text-gray-900">{booking.guestName}</h3>
                  <p className="text-sm text-gray-600">
                    Room {booking.roomNumber} • Checked in: {new Date(booking.checkInDate).toLocaleString()}
                  </p>
                </div>
                <Button
                  onClick={() => handleCheckOut(booking.id)}
                  className="bg-red-600 text-white hover:bg-red-700"
                >
                  Check Out
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* All Bookings */}
      {bookings.length > checkedInBookings.length && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mt-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            All Bookings ({bookings.length})
          </h2>
          <div className="space-y-2">
            {bookings.map(booking => (
              <div
                key={booking.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200 text-sm"
              >
                <div>
                  <span className="font-medium">{booking.guestName}</span>
                  <span className="text-gray-500 mx-2">•</span>
                  <span className="text-gray-600">Room {booking.roomNumber}</span>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                  booking.status === 'checked-in' ? 'bg-green-100 text-green-700' :
                  booking.status === 'checked-out' ? 'bg-gray-100 text-gray-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {booking.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
