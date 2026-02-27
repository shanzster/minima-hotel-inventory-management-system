'use client'

import { useState, useEffect } from 'react'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import roomsApi from '../../lib/roomsApi'
import inventoryApi from '../../lib/inventoryApi'

export default function AddMultipleAssetsToRoom({ onSubmit, onCancel }) {
  const [step, setStep] = useState(1) // 1: Select Room, 2: Select Items (POS Style)
  const [rooms, setRooms] = useState([])
  const [loadingRooms, setLoadingRooms] = useState(true)
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [availableItems, setAvailableItems] = useState([])
  const [loadingItems, setLoadingItems] = useState(false)
  const [selectedItems, setSelectedItems] = useState([]) // Items added to cart
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('equipment')
  const [showWarningModal, setShowWarningModal] = useState(false)
  const [warningMessage, setWarningMessage] = useState('')

  // Load rooms from Firebase
  useEffect(() => {
    const loadRooms = async () => {
      try {
        setLoadingRooms(true)
        const roomsData = await roomsApi.getAll()
        setRooms(roomsData)
      } catch (error) {
        console.error('Error loading rooms:', error)
      } finally {
        setLoadingRooms(false)
      }
    }

    loadRooms()
  }, [])

  // Load available items when room is selected
  useEffect(() => {
    const loadItems = async () => {
      if (selectedRoom && step === 2) {
        try {
          setLoadingItems(true)
          const allItems = await inventoryApi.getAll()
          // Filter for equipment and furniture items only
          const equipmentItems = allItems.filter(item =>
            item.type === 'asset' ||
            item.category === 'equipment' ||
            item.category === 'furniture'
          )
          // Group items by name and sum their stock
          const groupedItems = equipmentItems.reduce((acc, item) => {
            const existing = acc.find(i => i.name === item.name)
            if (existing) {
              existing.currentStock = (existing.currentStock || 0) + (item.currentStock || 0)
            } else {
              acc.push({ ...item })
            }
            return acc
          }, [])

          setAvailableItems(groupedItems)
        } catch (error) {
          console.error('Error loading items:', error)
        } finally {
          setLoadingItems(false)
        }
      }
    }

    loadItems()
  }, [selectedRoom, step])

  // Organize rooms by floor for the minimap
  const getRoomsByFloor = () => {
    const floors = {}
    rooms.forEach(room => {
      const floor = room.floor || 1
      if (!floors[floor]) {
        floors[floor] = []
      }
      floors[floor].push(room)
    })
    return floors
  }

  const roomsByFloor = getRoomsByFloor()

  const handleRoomSelect = (room) => {
    setSelectedRoom(room)
  }

  const handleContinueToItems = () => {
    if (!selectedRoom) {
      showWarning('Please select a room first')
      return
    }
    setStep(2)
  }

  // Show custom warning nodal
  const showWarning = (message) => {
    setWarningMessage(message)
    setShowWarningModal(true)
  }

  // Add item to cart
  const handleAddItem = (item) => {
    const existingItem = selectedItems.find(i => i.sourceId === item.id)
    if (existingItem) {
      // Check if increasing quantity exceeds stock
      if (existingItem.quantity + 1 > (item.currentStock || 0)) {
        showWarning(`Cannot add more. Only ${item.currentStock} units available in stock.`)
        return
      }

      // Increase quantity
      setSelectedItems(selectedItems.map(i =>
        i.sourceId === item.id
          ? { ...i, quantity: i.quantity + 1 }
          : i
      ))
    } else {
      // Check if stock is available
      if ((item.currentStock || 0) <= 0) {
        showWarning('This item is currently out of stock and cannot be assigned.')
        return
      }

      // Add new item
      setSelectedItems([...selectedItems, {
        id: Date.now() + Math.random(),
        sourceId: item.id,
        name: item.name,
        category: item.category || 'equipment',
        imageUrl: item.imageUrl,
        quantity: 1,
        condition: 'good',
        serialNumber: '',
        notes: '',
        maxStock: item.currentStock || 0 // Store max available for validation
      }])
    }
  }

  // Remove item from cart
  const handleRemoveItem = (id) => {
    setSelectedItems(selectedItems.filter(item => item.id !== id))
  }

  // Update item quantity
  const handleUpdateQuantity = (id, change) => {
    setSelectedItems(selectedItems.map(item => {
      if (item.id === id) {
        const newQuantity = Math.max(1, item.quantity + change)

        // Check if exceeded stock
        if (newQuantity > (item.maxStock || 0)) {
          showWarning(`Cannot exceed available stock (${item.maxStock} units).`)
          return item
        }

        return { ...item, quantity: newQuantity }
      }
      return item
    }))
  }

  // Update item details
  const handleUpdateItemDetails = (id, field, value) => {
    setSelectedItems(selectedItems.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  // Filter items
  const getFilteredItems = () => {
    let filtered = [...availableItems]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query)
      )
    }

    if (categoryFilter) {
      filtered = filtered.filter(item => item.category === categoryFilter)
    }

    return filtered
  }

  const filteredItems = getFilteredItems()

  const handleSubmit = async () => {
    if (selectedItems.length === 0) {
      showWarning('Please add at least one item to assign to the room.')
      return
    }

    // Expand items based on quantity
    const assetsData = []
    selectedItems.forEach(item => {
      for (let i = 0; i < item.quantity; i++) {
        assetsData.push({
          name: item.name,
          category: item.category,
          condition: item.condition,
          serialNumber: item.serialNumber ? `${item.serialNumber}-${i + 1}` : '',
          notes: item.notes,
          sourceId: item.sourceId,
          type: 'assigned-asset',
          room: selectedRoom.roomNumber || selectedRoom.number,
          roomId: selectedRoom.id,
          location: `${selectedRoom.floor ? `Floor ${selectedRoom.floor}, ` : ''}Room ${selectedRoom.roomNumber || selectedRoom.number}`,
          currentStock: 1,
          initialStock: item.maxStock || 0, // Reference to original stock
          unit: 'unit',
          restockThreshold: 0,
          imageUrl: item.imageUrl || ''
        })
      }
    })

    try {
      await onSubmit(assetsData)
    } catch (error) {
      console.error('Error submitting assets:', error)
      showWarning('Failed to assign assets. Please check your connection and try again.')
    }
  }

  // Step 1: Room Selection
  if (step === 1) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center pb-4 border-b">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Select Target Room</h3>
          <p className="text-sm text-gray-600">Choose the room where you want to assign assets</p>
        </div>

        {/* Selected Room Display */}
        {selectedRoom && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-green-800">Selected Room</p>
                  <p className="text-lg font-bold text-green-900">
                    Room {selectedRoom.roomNumber || selectedRoom.number}
                  </p>
                  <p className="text-sm text-green-700">
                    {selectedRoom.type} • Floor {selectedRoom.floor}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRoom(null)}
                className="text-green-600 hover:text-green-800 transition-colors"
                title="Clear selection"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {loadingRooms ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-3 text-gray-500">Loading rooms...</p>
          </div>
        ) : (
          <div className="space-y-6 max-h-[450px] overflow-y-auto pr-2">
            {Object.keys(roomsByFloor).sort((a, b) => b - a).map(floor => (
              <div key={floor} className="space-y-3">
                <div className="sticky top-0 z-10 bg-gradient-to-r from-gray-100 to-gray-50 px-4 py-2 rounded-lg shadow-sm">
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <h4 className="text-sm font-semibold text-gray-700">Floor {floor}</h4>
                    <span className="text-xs text-gray-500">({roomsByFloor[floor].length} rooms)</span>
                  </div>
                </div>

                {/* Room Grid */}
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                  {roomsByFloor[floor]
                    .sort((a, b) => {
                      const aNum = String(a.roomNumber || a.number || '')
                      const bNum = String(b.roomNumber || b.number || '')
                      return aNum.localeCompare(bNum)
                    })
                    .map(room => {
                      const isSelected = selectedRoom?.id === room.id
                      const isOccupied = room.status === 'occupied'
                      const roomNum = room.roomNumber || room.number || 'N/A'

                      return (
                        <button
                          key={room.id}
                          type="button"
                          onClick={() => handleRoomSelect(room)}
                          className={`
                            relative p-4 rounded-xl border-2 transition-all duration-200 transform hover:scale-105
                            ${isSelected
                              ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg scale-105'
                              : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
                            }
                          `}
                        >
                          <div className="flex flex-col items-center space-y-2">
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${isSelected ? 'bg-green-500' : 'bg-gray-100'
                              }`}>
                              <svg
                                className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-gray-600'}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                                />
                              </svg>
                            </div>

                            <span className={`text-base font-bold ${isSelected ? 'text-green-700' : 'text-gray-900'}`}>
                              {roomNum}
                            </span>

                            <span className="text-xs text-gray-500 truncate w-full text-center px-1">
                              {room.type || 'Room'}
                            </span>

                            {isOccupied && (
                              <div className="absolute top-2 right-2">
                                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse" title="Occupied" />
                              </div>
                            )}

                            {isSelected && (
                              <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1.5 shadow-lg">
                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                            )}
                          </div>
                        </button>
                      )
                    })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleContinueToItems}
            className="bg-black text-white hover:bg-gray-800"
            disabled={!selectedRoom}
          >
            Continue to Select Items
            <svg className="w-4 h-4 ml-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Button>
        </div>
      </div>
    )
  }

  // Step 2: POS-Style Item Selection
  return (
    <div className="flex h-[600px]">
      {/* Left Side - Item Grid (POS Style) */}
      <div className="flex-1 flex flex-col border-r border-gray-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M9 21V9l3-2 3 2v12" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold">Select Items</h3>
                <p className="text-sm text-purple-100">
                  Room {selectedRoom.roomNumber || selectedRoom.number} - {selectedRoom.type}
                </p>
              </div>
            </div>
            <button
              onClick={() => setStep(1)}
              className="text-white hover:bg-white/20 px-3 py-1 rounded-lg text-sm transition-colors"
            >
              Change Room
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/90 text-gray-900 placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-white"
            />
          </div>
        </div>

        {/* Category Filter */}
        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
          <div className="flex space-x-2">
            <button
              onClick={() => setCategoryFilter('equipment')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${categoryFilter === 'equipment'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
            >
              Equipment
            </button>
            <button
              onClick={() => setCategoryFilter('furniture')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${categoryFilter === 'furniture'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
            >
              Furniture
            </button>
            <button
              onClick={() => setCategoryFilter('')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${!categoryFilter
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
            >
              All
            </button>
          </div>
        </div>

        {/* Items Grid */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {loadingItems ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                <p className="mt-3 text-gray-500">Loading items...</p>
              </div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p>No items found</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {filteredItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleAddItem(item)}
                  className="bg-white rounded-xl p-4 hover:shadow-lg hover:scale-105 transition-all duration-200 border-2 border-gray-200 hover:border-purple-400 group"
                >
                  <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M9 21V9l3-2 3 2v12" />
                      </svg>
                    )}
                  </div>
                  <h4 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-2 group-hover:text-purple-600">
                    {item.name}
                  </h4>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-[10px] text-gray-500 capitalize">{item.category}</p>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${(item.currentStock || 0) <= 0 ? 'bg-red-50 text-red-500' :
                      (item.currentStock || 0) <= 3 ? 'bg-amber-50 text-amber-500' : 'bg-green-50 text-green-500'
                      }`}>
                      {item.currentStock || 0} left
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Side - Assignment List */}
      <div className="w-96 flex flex-col bg-white">
        {/* Header */}
        <div className="bg-gray-900 text-white p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">Selected Items</h3>
            <div className="bg-white/20 px-3 py-1 rounded-full">
              <span className="text-sm font-bold">{selectedItems.length} items</span>
            </div>
          </div>
        </div>

        {/* Selected Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {selectedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-sm">No items selected</p>
              <p className="text-xs mt-1">Click items to add</p>
            </div>
          ) : (
            selectedItems.map(item => (
              <div key={item.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm text-gray-900">{item.name}</h4>
                    <p className="text-xs text-gray-500 capitalize">{item.category}</p>
                  </div>
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-xs text-gray-600">Qty:</span>
                  <button
                    onClick={() => handleUpdateQuantity(item.id, -1)}
                    className="w-6 h-6 bg-gray-200 hover:bg-gray-300 rounded flex items-center justify-center"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                  <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                  <button
                    onClick={() => handleUpdateQuantity(item.id, 1)}
                    className="w-6 h-6 bg-gray-200 hover:bg-gray-300 rounded flex items-center justify-center"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                </div>

                {/* Condition */}
                <select
                  value={item.condition}
                  onChange={(e) => handleUpdateItemDetails(item.id, 'condition', e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded mb-2"
                >
                  <option value="good">Good Condition</option>
                  <option value="needs-maintenance">Needs Maintenance</option>
                  <option value="damaged">Damaged</option>
                </select>

                {/* Serial Number */}
                <input
                  type="text"
                  placeholder="Serial number (optional)"
                  value={item.serialNumber}
                  onChange={(e) => handleUpdateItemDetails(item.id, 'serialNumber', e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                />
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Total Items:</span>
            <span className="font-bold text-lg">{selectedItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
          </div>

          <div className="flex space-x-2">
            <Button
              variant="ghost"
              onClick={() => setStep(1)}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={selectedItems.length === 0}
              className="flex-1 bg-black text-white hover:bg-gray-800"
            >
              <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Assign to Room
            </Button>
          </div>
        </div>
      </div>

      {/* Warning Nodal */}
      <Modal
        isOpen={showWarningModal}
        onClose={() => setShowWarningModal(false)}
        title="Stock Warning"
      >
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Insufficient Stock</h3>
          <p className="text-sm text-gray-600 mb-6">
            {warningMessage}
          </p>
          <Button
            onClick={() => setShowWarningModal(false)}
            className="w-full bg-amber-600 text-white hover:bg-amber-700"
          >
            I Understand
          </Button>
        </div>
      </Modal>
    </div>
  )
}
