'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { usePageTitle } from '../../../../../hooks/usePageTitle'
import { useAuth } from '../../../../../hooks/useAuth'
import roomsApi from '../../../../../lib/roomsApi'
import bundlesApi from '../../../../../lib/bundlesApi'
import { inventoryApi } from '../../../../../lib/inventoryApi'
import toast from '../../../../../lib/toast'

export default function InspectRoomPage() {
  const { setTitle } = usePageTitle()
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const roomId = params.roomId

  const [room, setRoom] = useState(null)
  const [bundle, setBundle] = useState(null)
  const [checklistItems, setChecklistItems] = useState([])
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadData()
  }, [roomId])

  useEffect(() => {
    if (room) {
      setTitle(`Inspect Room ${room.roomNumber || room.number}`)
    }
  }, [room, setTitle])

  const loadData = async () => {
    try {
      setLoading(true)
      const [roomData, assignments, allBundles] = await Promise.all([
        roomsApi.getById(roomId),
        bundlesApi.getRoomAssignments(),
        bundlesApi.getAll()
      ])

      setRoom(roomData)

      const bundleId = assignments[roomId]
      const assignedBundle = allBundles.find(b => b.id === bundleId)
      
      if (assignedBundle) {
        setBundle(assignedBundle)
        
        // Initialize checklist items with consumed and remaining fields
        const items = assignedBundle.items.map(item => ({
          ...item,
          deployed: item.quantity,
          consumed: 0,
          remaining: item.quantity
        }))
        setChecklistItems(items)
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load room data')
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Photo size must be less than 5MB')
        return
      }
      
      setPhoto(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleConsumedChange = (itemId, value) => {
    const numValue = parseInt(value) || 0
    setChecklistItems(items =>
      items.map(item => {
        if (item.id === itemId) {
          const consumed = Math.max(0, Math.min(numValue, item.deployed))
          const remaining = item.deployed - consumed
          return { ...item, consumed, remaining }
        }
        return item
      })
    )
  }

  const handleRemainingChange = (itemId, value) => {
    const numValue = parseInt(value) || 0
    setChecklistItems(items =>
      items.map(item => {
        if (item.id === itemId) {
          const remaining = Math.max(0, Math.min(numValue, item.deployed))
          const consumed = item.deployed - remaining
          return { ...item, consumed, remaining }
        }
        return item
      })
    )
  }

  const validateChecklist = () => {
    // Check if photo is uploaded
    if (!photo) {
      toast.error('Please upload a photo of the room')
      return false
    }

    // Check if all items are accounted for
    for (const item of checklistItems) {
      if (item.consumed + item.remaining !== item.deployed) {
        toast.error(`${item.name}: Consumed + Remaining must equal ${item.deployed}`)
        return false
      }
    }

    return true
  }

  const handleSubmit = async () => {
    if (!validateChecklist()) return

    try {
      setSubmitting(true)

      // Return unused items to stock
      for (const item of checklistItems) {
        if (item.remaining > 0) {
          const inventoryItem = await inventoryApi.getAll().then(items => 
            items.find(i => i.name === item.name)
          )
          
          if (inventoryItem) {
            await inventoryApi.update(inventoryItem.id, {
              currentStock: inventoryItem.currentStock + item.remaining
            })
          }
        }
      }

      // Update bundle status to ready
      await bundlesApi.updateRoomStatus(roomId, 'ready')

      // Save inspection record (in real app, save to database)
      const inspectionRecord = {
        roomId,
        bundleId: bundle.id,
        inspectedBy: user?.id,
        inspectedAt: new Date().toISOString(),
        items: checklistItems,
        photo: photoPreview, // In real app, upload to storage
        notes,
        totalConsumed: checklistItems.reduce((sum, item) => sum + item.consumed, 0),
        totalReturned: checklistItems.reduce((sum, item) => sum + item.remaining, 0)
      }

      console.log('Inspection completed:', inspectionRecord)

      toast.success('Inspection completed successfully!')
      router.push('/housekeeping')
    } catch (error) {
      console.error('Error completing inspection:', error)
      toast.error('Failed to complete inspection')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-500">Loading inspection...</p>
        </div>
      </div>
    )
  }

  if (!room || !bundle) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Room or bundle not found</p>
          <button
            onClick={() => router.push('/housekeeping')}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const totalConsumed = checklistItems.reduce((sum, item) => sum + item.consumed, 0)
  const totalReturned = checklistItems.reduce((sum, item) => sum + item.remaining, 0)
  const totalDeployed = checklistItems.reduce((sum, item) => sum + item.deployed, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/housekeeping/rooms?status=needs-inspection')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-3 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">Back to Rooms</span>
          </button>
          
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Room {room.roomNumber || room.number}</h1>
                <p className="text-gray-600">{room.type}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Bundle</p>
                <p className="font-semibold text-gray-900">{bundle.name}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Photo Upload */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Room Photo <span className="text-red-500 ml-1">*</span>
          </h2>
          
          {photoPreview ? (
            <div className="relative">
              <img
                src={photoPreview}
                alt="Room preview"
                className="w-full h-64 object-cover rounded-lg"
              />
              <button
                onClick={() => {
                  setPhoto(null)
                  setPhotoPreview(null)
                }}
                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors bg-gray-50">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="mb-2 text-sm text-gray-600">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handlePhotoChange}
              />
            </label>
          )}
        </div>

        {/* Checklist */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Bundle Items Checklist</h2>
          
          <div className="space-y-4">
            {checklistItems.map((item) => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-500">{item.category}</p>
                  </div>
                  <span className="text-sm font-medium text-gray-600">
                    Deployed: {item.deployed} {item.unit}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Consumed
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={item.deployed}
                      value={item.consumed}
                      onChange={(e) => handleConsumedChange(item.id, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Remaining
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={item.deployed}
                      value={item.remaining}
                      onChange={(e) => handleRemainingChange(item.id, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Validation indicator */}
                {item.consumed + item.remaining === item.deployed ? (
                  <div className="mt-2 flex items-center text-green-600 text-sm">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Verified
                  </div>
                ) : (
                  <div className="mt-2 flex items-center text-red-600 text-sm">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Must equal {item.deployed}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Summary</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Total Deployed</p>
              <p className="text-2xl font-bold text-blue-600">{totalDeployed}</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Consumed</p>
              <p className="text-2xl font-bold text-red-600">{totalConsumed}</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Returned</p>
              <p className="text-2xl font-bold text-green-600">{totalReturned}</p>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes (Optional)</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional notes about the room condition..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Actions */}
        <div className="flex space-x-4">
          <button
            onClick={() => router.push('/housekeeping/rooms?status=needs-inspection')}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Completing...' : 'Complete Inspection'}
          </button>
        </div>
      </div>
    </div>
  )
}
