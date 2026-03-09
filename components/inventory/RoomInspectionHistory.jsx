'use client'

import { useState, useEffect } from 'react'
import bundlesApi from '../../lib/bundlesApi'
import usersApi from '../../lib/usersApi'

export default function RoomInspectionHistory({ room, onClose }) {
  const [inspections, setInspections] = useState([])
  const [transactions, setTransactions] = useState([])
  const [users, setUsers] = useState({})
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('inspections') // 'inspections' or 'transactions'

  useEffect(() => {
    loadData()
  }, [room.id])

  const loadData = async () => {
    try {
      setLoading(true)
      const [inspectionsData, transactionsData, allUsers] = await Promise.all([
        bundlesApi.getRoomInspections(room.id),
        bundlesApi.getRoomTransactions(room.id),
        usersApi.getAll()
      ])

      // Sort by date (newest first)
      const sortedInspections = inspectionsData.sort((a, b) => 
        new Date(b.inspectedAt) - new Date(a.inspectedAt)
      )
      const sortedTransactions = transactionsData.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      )

      setInspections(sortedInspections)
      setTransactions(sortedTransactions)

      // Create user lookup map
      const userMap = {}
      allUsers.forEach(user => {
        userMap[user.id] = user
      })
      setUsers(userMap)
    } catch (error) {
      console.error('Error loading inspection history:', error)
    } finally {
      setLoading(false)
    }
  }

  const getUserName = (userId) => {
    const user = users[userId]
    return user ? user.name || user.email : 'Unknown User'
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading history...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-h-[80vh] overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Room {room.roomNumber || room.number} - Inspection History
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              View all inspections and consumption records
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('inspections')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'inspections'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Inspections ({inspections.length})
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'transactions'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Transactions ({transactions.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'inspections' ? (
          <div className="space-y-4">
            {inspections.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No inspection records found for this room
              </div>
            ) : (
              inspections.map((inspection) => (
                <div
                  key={inspection.id}
                  className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors"
                >
                  {/* Inspection Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 className="text-lg font-bold text-gray-900">
                          {inspection.bundleName}
                        </h3>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span>{getUserName(inspection.inspectedBy)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{formatDate(inspection.inspectedAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-red-600">
                        {inspection.totalConsumed}
                      </div>
                      <div className="text-xs text-gray-500">Items Consumed</div>
                    </div>
                  </div>

                  {/* Items Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left px-4 py-2 font-semibold text-gray-700">Item</th>
                          <th className="text-center px-4 py-2 font-semibold text-gray-700">In Bundle</th>
                          <th className="text-center px-4 py-2 font-semibold text-gray-700">Consumed</th>
                          <th className="text-center px-4 py-2 font-semibold text-gray-700">Refurbished</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inspection.items.map((item, idx) => (
                          <tr key={idx} className="border-b border-gray-100">
                            <td className="px-4 py-3 text-gray-900">{item.name}</td>
                            <td className="px-4 py-3 text-center text-gray-600">{item.bundleQuantity}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`font-semibold ${item.consumed > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                                {item.consumed}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`font-semibold ${item.needsRefurbish > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                                {item.needsRefurbish}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Notes */}
                  {inspection.notes && (
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="text-xs font-semibold text-amber-800 mb-1">Notes:</div>
                      <div className="text-sm text-amber-900">{inspection.notes}</div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No transaction records found for this room
              </div>
            ) : (
              transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-purple-300 transition-colors"
                >
                  {/* Transaction Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <h3 className="text-lg font-bold text-gray-900">
                          {transaction.bundleName}
                        </h3>
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded">
                          {transaction.type}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span>{getUserName(transaction.inspectedBy)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{formatDate(transaction.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Items Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left px-4 py-2 font-semibold text-gray-700">Item</th>
                          <th className="text-center px-4 py-2 font-semibold text-gray-700">Consumed</th>
                          <th className="text-center px-4 py-2 font-semibold text-gray-700">Previous Stock</th>
                          <th className="text-center px-4 py-2 font-semibold text-gray-700">New Stock</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transaction.consumedItems.map((item, idx) => (
                          <tr key={idx} className="border-b border-gray-100">
                            <td className="px-4 py-3 text-gray-900">{item.name}</td>
                            <td className="px-4 py-3 text-center">
                              <span className="font-semibold text-red-600">-{item.consumed}</span>
                            </td>
                            <td className="px-4 py-3 text-center text-gray-600">{item.previousStock}</td>
                            <td className="px-4 py-3 text-center">
                              <span className="font-semibold text-blue-600">{item.newStock}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Errors */}
                  {transaction.errors && transaction.errors.length > 0 && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="text-xs font-semibold text-red-800 mb-1">Errors:</div>
                      <ul className="text-sm text-red-900 list-disc list-inside">
                        {transaction.errors.map((error, idx) => (
                          <li key={idx}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Notes */}
                  {transaction.notes && (
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="text-xs font-semibold text-amber-800 mb-1">Notes:</div>
                      <div className="text-sm text-amber-900">{transaction.notes}</div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
