'use client'

import { useState, useEffect } from 'react'
import Button from '../ui/Button'

export default function HousekeepingChecklist({ room, assignedBundle, onComplete, onCancel }) {
  const [items, setItems] = useState([])
  const [notes, setNotes] = useState('')

  // Initialize items from bundle
  useEffect(() => {
    if (assignedBundle && assignedBundle.items) {
      const initialItems = assignedBundle.items.map(item => ({
        itemId: item.itemId,
        name: item.name,
        category: item.category || 'Uncategorized',
        deployed: item.quantity,
        consumed: 0,
        remaining: item.quantity
      }))
      setItems(initialItems)
    }
  }, [assignedBundle])

  const handleConsumedChange = (itemId, consumed) => {
    setItems(prev => prev.map(item => {
      if (item.itemId === itemId) {
        const validConsumed = Math.max(0, Math.min(item.deployed, consumed))
        return {
          ...item,
          consumed: validConsumed,
          remaining: item.deployed - validConsumed
        }
      }
      return item
    }))
  }

  const handleRemainingChange = (itemId, remaining) => {
    setItems(prev => prev.map(item => {
      if (item.itemId === itemId) {
        const validRemaining = Math.max(0, Math.min(item.deployed, remaining))
        return {
          ...item,
          remaining: validRemaining,
          consumed: item.deployed - validRemaining
        }
      }
      return item
    }))
  }

  const handleSubmit = () => {
    // Validate all items are accounted for
    const allValid = items.every(item => item.consumed + item.remaining === item.deployed)
    if (!allValid) {
      alert('Please ensure consumed + remaining equals deployed for all items')
      return
    }

    onComplete({
      room,
      items,
      notes
    })
  }

  const totalDeployed = items.reduce((sum, item) => sum + item.deployed, 0)
  const totalConsumed = items.reduce((sum, item) => sum + item.consumed, 0)
  const totalRemaining = items.reduce((sum, item) => sum + item.remaining, 0)

  if (!assignedBundle) {
    return (
      <div className="text-center py-12">
        <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M9 21V9l3-2 3 2v12" />
        </svg>
        <p className="text-gray-500 mb-4">No bundle assigned to this room</p>
        <Button onClick={onCancel} variant="ghost">Close</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Room & Bundle Info */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg font-bold">Room {room.number || room.roomNumber}</h3>
            <p className="text-sm text-purple-100">{room.type} - Floor {room.floor}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{assignedBundle.name}</div>
            <div className="text-xs text-purple-100">{items.length} items</div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <h4 className="font-semibold text-blue-900 mb-1">Post-Checkout Inspection</h4>
            <p className="text-sm text-blue-700">
              For each item, record how many were consumed by the guest and how many remain in the room. 
              Consumed + Remaining must equal Deployed quantity.
            </p>
          </div>
        </div>
      </div>

      {/* Bundle Items Table */}
      <div className="space-y-3">
        <h4 className="font-semibold text-gray-900">Bundle Items Inspection</h4>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border">Item</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border">Deployed</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border">Consumed</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border">Remaining</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => {
                const isValid = item.consumed + item.remaining === item.deployed
                return (
                  <tr key={item.itemId} className={!isValid ? 'bg-red-50' : ''}>
                    <td className="px-4 py-3 border">
                      <div>
                        <div className="font-medium text-gray-900">{item.name}</div>
                        <div className="text-xs text-gray-500">{item.category}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center border">
                      <span className="font-semibold text-gray-900">{item.deployed}</span>
                    </td>
                    <td className="px-4 py-3 border">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleConsumedChange(item.itemId, item.consumed - 1)}
                          className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded flex items-center justify-center font-bold text-gray-700"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={item.consumed}
                          onChange={(e) => handleConsumedChange(item.itemId, parseInt(e.target.value) || 0)}
                          min="0"
                          max={item.deployed}
                          className="w-16 px-2 py-1 text-center border-2 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <button
                          onClick={() => handleConsumedChange(item.itemId, item.consumed + 1)}
                          className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded flex items-center justify-center font-bold text-gray-700"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 border">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleRemainingChange(item.itemId, item.remaining - 1)}
                          className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded flex items-center justify-center font-bold text-gray-700"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={item.remaining}
                          onChange={(e) => handleRemainingChange(item.itemId, parseInt(e.target.value) || 0)}
                          min="0"
                          max={item.deployed}
                          className="w-16 px-2 py-1 text-center border-2 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <button
                          onClick={() => handleRemainingChange(item.itemId, item.remaining + 1)}
                          className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded flex items-center justify-center font-bold text-gray-700"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center border">
                      {isValid ? (
                        <svg className="w-6 h-6 text-green-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-6 h-6 text-red-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      )}
                    </td>
                  </tr>
                )
              })}
              <tr className="bg-gray-50 font-semibold">
                <td className="px-4 py-3 border">Total</td>
                <td className="px-4 py-3 text-center border">{totalDeployed}</td>
                <td className="px-4 py-3 text-center border text-red-600">{totalConsumed}</td>
                <td className="px-4 py-3 text-center border text-green-600">{totalRemaining}</td>
                <td className="px-4 py-3 border"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="text-sm text-blue-600 font-medium mb-1">Items per Room</div>
          <div className="text-2xl font-bold text-blue-700">{totalDeployed}</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <div className="text-sm text-red-600 font-medium mb-1">Consumed</div>
          <div className="text-2xl font-bold text-red-700">{totalConsumed}</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="text-sm text-green-600 font-medium mb-1">Returned to Stock</div>
          <div className="text-2xl font-bold text-green-700">{totalRemaining}</div>
        </div>
      </div>

      {/* Additional Notes */}
      <div className="space-y-3">
        <h4 className="font-semibold text-gray-900">Additional Notes (Optional)</h4>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any additional observations about the room condition..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          className="bg-black text-white hover:bg-gray-800"
        >
          Complete Inspection
        </Button>
      </div>
    </div>
  )
}
