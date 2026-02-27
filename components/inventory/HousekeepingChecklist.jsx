'use client'

import { useState, useEffect } from 'react'
import Button from '../ui/Button'

export default function HousekeepingChecklist({ room, assignedBundle, onComplete, onCancel }) {
  const [itemsStatus, setItemsStatus] = useState({})
  const [notes, setNotes] = useState('')
  const [issues, setIssues] = useState([])
  const [newIssue, setNewIssue] = useState('')

  // Initialize items status from bundle
  useEffect(() => {
    if (assignedBundle && assignedBundle.items) {
      const initialStatus = {}
      assignedBundle.items.forEach(item => {
        initialStatus[item.id] = {
          name: item.name,
          expectedQuantity: item.quantity,
          remainingQuantity: item.quantity,
          consumed: 0,
          status: 'full' // full, partial, empty
        }
      })
      setItemsStatus(initialStatus)
    }
  }, [assignedBundle])

  const handleQuantityChange = (itemId, remaining) => {
    const item = itemsStatus[itemId]
    const consumed = item.expectedQuantity - remaining
    let status = 'full'
    
    if (remaining === 0) status = 'empty'
    else if (remaining < item.expectedQuantity) status = 'partial'

    setItemsStatus(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        remainingQuantity: remaining,
        consumed: consumed,
        status: status
      }
    }))
  }

  const handleAddIssue = () => {
    if (!newIssue.trim()) return
    setIssues([...issues, { id: Date.now(), text: newIssue, timestamp: new Date() }])
    setNewIssue('')
  }

  const handleRemoveIssue = (id) => {
    setIssues(issues.filter(issue => issue.id !== id))
  }

  const handleSubmit = () => {
    // Calculate total consumed items
    const consumedItems = Object.values(itemsStatus).filter(item => item.consumed > 0)
    const totalConsumed = consumedItems.reduce((sum, item) => sum + item.consumed, 0)

    onComplete({
      room,
      bundle: assignedBundle,
      itemsStatus,
      consumedItems,
      totalConsumed,
      notes,
      issues,
      completedAt: new Date().toISOString()
    })
  }

  const totalConsumed = Object.values(itemsStatus).reduce((sum, item) => sum + item.consumed, 0)

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
            <div className="text-xs text-purple-100">{assignedBundle.items.length} items</div>
          </div>
        </div>
        {totalConsumed > 0 && (
          <div className="bg-white/20 rounded-lg px-3 py-2 text-sm">
            <span className="font-semibold">{totalConsumed}</span> items consumed/taken
          </div>
        )}
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
              Check each item and adjust the quantity to reflect what remains in the room. 
              Items consumed or taken by guests will be automatically deducted from inventory.
            </p>
          </div>
        </div>
      </div>

      {/* Bundle Items Checklist */}
      <div className="space-y-3">
        <h4 className="font-semibold text-gray-900">Bundle Items Inspection</h4>
        <div className="space-y-3">
          {assignedBundle.items.map(item => {
            const status = itemsStatus[item.id]
            if (!status) return null

            return (
              <div
                key={item.id}
                className={`border-2 rounded-lg p-4 transition-all ${
                  status.status === 'empty'
                    ? 'border-red-300 bg-red-50'
                    : status.status === 'partial'
                    ? 'border-amber-300 bg-amber-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1">
                    <h5 className="font-semibold text-gray-900">{item.name}</h5>
                    <p className="text-sm text-gray-600">Expected: {item.quantity} pcs</p>
                  </div>
                  <div className="text-right">
                    {status.consumed > 0 && (
                      <span className="inline-block px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                        -{status.consumed} consumed
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Remaining Quantity
                    </label>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleQuantityChange(item.id, Math.max(0, status.remainingQuantity - 1))}
                        className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center justify-center font-bold text-gray-700"
                      >
                        -
                      </button>
                      <div className="flex-1 text-center">
                        <input
                          type="number"
                          value={status.remainingQuantity}
                          onChange={(e) => {
                            const val = Math.max(0, Math.min(item.quantity, parseInt(e.target.value) || 0))
                            handleQuantityChange(item.id, val)
                          }}
                          min="0"
                          max={item.quantity}
                          className="w-20 px-3 py-2 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <button
                        onClick={() => handleQuantityChange(item.id, Math.min(item.quantity, status.remainingQuantity + 1))}
                        className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center justify-center font-bold text-gray-700"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {status.status === 'full' && (
                      <div className="flex items-center space-x-2 text-green-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-medium">Full</span>
                      </div>
                    )}
                    {status.status === 'partial' && (
                      <div className="flex items-center space-x-2 text-amber-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="text-sm font-medium">Partial</span>
                      </div>
                    )}
                    {status.status === 'empty' && (
                      <div className="flex items-center space-x-2 text-red-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span className="text-sm font-medium">Empty</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Issues/Damages */}
      <div className="space-y-3">
        <h4 className="font-semibold text-gray-900">Issues & Damages</h4>
        <div className="flex space-x-2">
          <input
            type="text"
            value={newIssue}
            onChange={(e) => setNewIssue(e.target.value)}
            placeholder="Report any damages or issues (e.g., broken glass, stained towel)"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            onKeyPress={(e) => e.key === 'Enter' && handleAddIssue()}
          />
          <Button onClick={handleAddIssue} className="bg-red-600 text-white hover:bg-red-700">
            Add Issue
          </Button>
        </div>

        {issues.length > 0 && (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {issues.map(issue => (
              <div key={issue.id} className="flex items-start justify-between bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="text-sm font-medium text-red-900">{issue.text}</span>
                  </div>
                  <span className="text-xs text-red-600">
                    {new Date(issue.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <button
                  onClick={() => handleRemoveIssue(issue.id)}
                  className="text-red-600 hover:text-red-700 ml-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Additional Notes */}
      <div className="space-y-3">
        <h4 className="font-semibold text-gray-900">Additional Notes</h4>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any additional observations about the room condition..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {/* Summary */}
      {totalConsumed > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h4 className="font-semibold text-purple-900 mb-2">Restock Summary</h4>
          <p className="text-sm text-purple-700">
            {totalConsumed} items will be deducted from inventory and need to be restocked in this room.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          className="bg-black text-white hover:bg-gray-800"
        >
          Complete Inspection & Restock
        </Button>
      </div>
    </div>
  )
}
