'use client'

import { useState, useEffect } from 'react'
import Button from '../ui/Button'
import Spinner from '../ui/Spinner'
import roomsApi from '../../lib/roomsApi'
import inventoryApi from '../../lib/inventoryApi'
import toast from '../../lib/toast'

export default function EnhancedAssetAssignment({ onSubmit, onCancel }) {
  const [step, setStep] = useState(1) // 1: Category, 2: Room, 3: Assets
  const [roomCategory, setRoomCategory] = useState('')
  const [rooms, setRooms] = useState([])
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [existingAssets, setExistingAssets] = useState([])
  const [editedAssets, setEditedAssets] = useState([]) // Track edits to existing assets
  const [removedAssetIds, setRemovedAssetIds] = useState([]) // Track removed assets
  const [availableItems, setAvailableItems] = useState([])
  const [selectedItems, setSelectedItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingAssets, setLoadingAssets] = useState(false)
  const [roomAssetsCache, setRoomAssetsCache] = useState({}) // Cache assets per room

  // Room categories
  const roomCategories = [
    { value: 'standard', label: 'Standard Room', icon: '🛏️' },
    { value: 'deluxe', label: 'Deluxe Room', icon: '✨' },
    { value: 'suite', label: 'Suite', icon: '👑' },
    { value: 'presidential', label: 'Presidential Suite', icon: '💎' },
    { value: 'conference', label: 'Conference Room', icon: '📊' },
    { value: 'common', label: 'Common Area', icon: '🏛️' }
  ]

  // Load rooms when category is selected
  useEffect(() => {
    if (roomCategory && step === 2) {
      loadRoomsByCategory()
    }
  }, [roomCategory, step])

  // Load existing assets and available items when room is selected
  useEffect(() => {
    if (selectedRoom && step === 3) {
      loadRoomData()
    }
  }, [selectedRoom, step])

  const loadRoomsByCategory = async () => {
    try {
      setLoading(true)
      const allRooms = await roomsApi.getAll()
      const filtered = allRooms.filter(room => 
        room.type?.toLowerCase().includes(roomCategory.toLowerCase())
      )
      setRooms(filtered)
      
      // Preload assets for all rooms in this category
      const assetsCache = {}
      for (const room of filtered) {
        try {
          const roomNum = room.roomNumber || room.number
          const assets = await inventoryApi.getAssetsByRoom(room.id, roomNum)
          assetsCache[room.id] = assets || []
        } catch (error) {
          console.error(`Error loading assets for room ${room.id}:`, error)
          assetsCache[room.id] = []
        }
      }
      setRoomAssetsCache(assetsCache)
    } catch (error) {
      console.error('Error loading rooms:', error)
      toast.error('Failed to load rooms')
    } finally {
      setLoading(false)
    }
  }

  const loadRoomData = async () => {
    try {
      setLoadingAssets(true)
      const roomNum = selectedRoom.roomNumber || selectedRoom.number
      const [assets, items] = await Promise.all([
        inventoryApi.getAssetsByRoom(selectedRoom.id, roomNum),
        inventoryApi.getAll()
      ])
      
      setExistingAssets(assets || [])
      
      // Filter available items (equipment/furniture only, exclude already assigned)
      const equipmentItems = items.filter(item => 
        (item.category === 'equipment' || item.category === 'furniture') &&
        !assets.some(asset => asset.name === item.name)
      )
      setAvailableItems(equipmentItems)
    } catch (error) {
      console.error('Error loading room data:', error)
      toast.error('Failed to load room data')
    } finally {
      setLoadingAssets(false)
    }
  }

  const handleAddItem = (item) => {
    const exists = selectedItems.find(i => i.sourceId === item.id)
    if (exists) {
      setSelectedItems(selectedItems.map(i => 
        i.sourceId === item.id ? { ...i, quantity: i.quantity + 1 } : i
      ))
    } else {
      setSelectedItems([...selectedItems, {
        id: Date.now() + Math.random(),
        sourceId: item.id,
        name: item.name,
        category: item.category,
        imageUrl: item.imageUrl,
        quantity: 1,
        condition: 'good',
        serialNumber: '',
        notes: ''
      }])
    }
  }

  const handleRemoveItem = (id) => {
    setSelectedItems(selectedItems.filter(item => item.id !== id))
  }

  const handleUpdateQuantity = (id, change) => {
    setSelectedItems(selectedItems.map(item => {
      if (item.id === id) {
        const newQuantity = Math.max(1, item.quantity + change)
        return { ...item, quantity: newQuantity }
      }
      return item
    }))
  }

  const handleUpdateItemDetails = (id, field, value) => {
    setSelectedItems(selectedItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const handleEditExistingAsset = (assetId, field, value) => {
    setEditedAssets(prev => {
      const existing = prev.find(a => a.id === assetId)
      if (existing) {
        return prev.map(a => a.id === assetId ? { ...a, [field]: value } : a)
      } else {
        const asset = existingAssets.find(a => a.id === assetId)
        return [...prev, { ...asset, [field]: value }]
      }
    })
  }

  const handleRemoveExistingAsset = (assetId) => {
    setRemovedAssetIds(prev => [...prev, assetId])
  }

  const handleRestoreAsset = (assetId) => {
    setRemovedAssetIds(prev => prev.filter(id => id !== assetId))
  }

  const getAssetValue = (assetId, field) => {
    const edited = editedAssets.find(a => a.id === assetId)
    if (edited && edited[field] !== undefined) {
      return edited[field]
    }
    const original = existingAssets.find(a => a.id === assetId)
    return original ? original[field] : ''
  }

  const handleSubmit = async () => {
    if (selectedItems.length === 0 && editedAssets.length === 0 && removedAssetIds.length === 0) {
      toast.warning('No changes to save')
      return
    }

    const result = {
      newAssets: [],
      editedAssets: editedAssets,
      removedAssetIds: removedAssetIds
    }

    // Process new assets to add
    selectedItems.forEach(item => {
      for (let i = 0; i < item.quantity; i++) {
        result.newAssets.push({
          name: item.name,
          category: item.category,
          condition: item.condition,
          serialNumber: item.serialNumber ? `${item.serialNumber}-${i + 1}` : '',
          notes: item.notes,
          type: 'asset',
          room: selectedRoom.roomNumber || selectedRoom.number,
          roomId: selectedRoom.id,
          location: `Floor ${selectedRoom.floor}, Room ${selectedRoom.roomNumber || selectedRoom.number}`,
          currentStock: 1,
          unit: 'unit',
          restockThreshold: 0,
          imageUrl: item.imageUrl || ''
        })
      }
    })

    try {
      await onSubmit(result)
    } catch (error) {
      console.error('Error submitting changes:', error)
      toast.error('Failed to save changes')
    }
  }

  // Get room status
  const getRoomStatus = (room) => {
    // This would check existing assets count
    // For now, return based on room status
    if (room.status === 'occupied') return 'partial'
    return 'empty'
  }

  // Step 1: Select Room Category
  if (step === 1) {
    return (
      <div className="space-y-6">
        <div className="text-center pb-4 border-b">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Step 1: Select Room Category</h3>
          <p className="text-sm text-gray-600">Choose the type of room you want to assign assets to</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {roomCategories.map(category => (
            <button
              key={category.value}
              onClick={() => {
                setRoomCategory(category.value)
                setStep(2)
              }}
              className="p-6 border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all group"
            >
              <div className="text-4xl mb-3">{category.icon}</div>
              <h4 className="font-semibold text-gray-900 group-hover:text-purple-600">{category.label}</h4>
            </button>
          ))}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  // Step 2: Select Specific Room
  if (step === 2) {
    const roomsByFloor = {}
    rooms.forEach(room => {
      const floor = room.floor || 1
      if (!roomsByFloor[floor]) roomsByFloor[floor] = []
      roomsByFloor[floor].push(room)
    })

    return (
      <div className="space-y-6">
        <div className="text-center pb-4 border-b">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Step 2: Select Room</h3>
          <p className="text-sm text-gray-600">
            {roomCategories.find(c => c.value === roomCategory)?.label} - Choose specific room
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No rooms found for this category</p>
          </div>
        ) : (
          <div className="space-y-6 max-h-[500px] overflow-y-auto">
            {Object.keys(roomsByFloor).sort((a, b) => b - a).map(floor => (
              <div key={floor} className="space-y-3">
                <div className="sticky top-0 z-10 bg-gradient-to-r from-gray-100 to-gray-50 px-4 py-2 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-700">Floor {floor}</h4>
                </div>
                
                <div className="space-y-3">
                  {roomsByFloor[floor].map(room => {
                    const roomNum = room.roomNumber || room.number || 'N/A'
                    const roomAssets = roomAssetsCache[room.id] || []
                    
                    return (
                      <button
                        key={room.id}
                        onClick={() => {
                          setSelectedRoom(room)
                          setStep(3)
                        }}
                        className="w-full text-left bg-white rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all p-4"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                              </svg>
                            </div>
                            <div>
                              <h5 className="text-lg font-bold text-gray-900">Room {roomNum}</h5>
                              <p className="text-sm text-gray-600">{room.type}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded font-medium">
                              {roomAssets.length} assets
                            </span>
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Current Assets</p>
                          {roomAssets.length === 0 ? (
                            <p className="text-sm text-gray-400 italic">No assets assigned yet</p>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {roomAssets.slice(0, 5).map((asset, idx) => (
                                <span key={idx} className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                                  {asset.name}
                                </span>
                              ))}
                              {roomAssets.length > 5 && (
                                <span className="text-xs px-2 py-1 bg-gray-200 text-gray-600 rounded font-medium">
                                  +{roomAssets.length - 5} more
                                </span>
                              )}
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

        <div className="flex justify-between pt-4 border-t">
          <Button variant="ghost" onClick={() => setStep(1)}>
            Back to Categories
          </Button>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  // Step 3: View Existing Assets + Add New
  return (
    <div className="flex h-[600px]">
      {/* Left: Existing Assets + Available Items */}
      <div className="flex-1 flex flex-col border-r border-gray-200">
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-lg font-bold">Room {selectedRoom.roomNumber || selectedRoom.number}</h3>
              <p className="text-sm text-green-100">{selectedRoom.type} - Floor {selectedRoom.floor}</p>
            </div>
            <button
              onClick={() => setStep(2)}
              className="text-white hover:bg-white/20 px-3 py-1 rounded-lg text-sm"
            >
              Change Room
            </button>
          </div>
        </div>

        {loadingAssets ? (
          <div className="flex-1 flex items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {/* Existing Assets */}
            {existingAssets.length > 0 && (
              <div className="p-4 bg-green-50 border-b border-green-200">
                <h4 className="font-semibold text-green-900 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Existing Assets in This Room ({existingAssets.filter(a => !removedAssetIds.includes(a.id)).length})
                </h4>
                <div className="space-y-3">
                  {existingAssets.map(asset => {
                    const isRemoved = removedAssetIds.includes(asset.id)
                    const condition = getAssetValue(asset.id, 'condition') || asset.condition || 'good'
                    
                    return (
                      <div 
                        key={asset.id} 
                        className={`bg-white rounded-lg p-3 border transition-all ${
                          isRemoved ? 'border-red-300 bg-red-50 opacity-50' : 'border-green-200'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{asset.name}</p>
                            {asset.serialNumber && (
                              <p className="text-xs text-gray-500">SN: {asset.serialNumber}</p>
                            )}
                          </div>
                          {!isRemoved ? (
                            <button
                              onClick={() => handleRemoveExistingAsset(asset.id)}
                              className="text-red-600 hover:text-red-700 p-1"
                              title="Remove asset"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRestoreAsset(asset.id)}
                              className="text-green-600 hover:text-green-700 p-1"
                              title="Restore asset"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            </button>
                          )}
                        </div>

                        {!isRemoved && (
                          <div className="space-y-2">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Condition</label>
                              <select
                                value={condition}
                                onChange={(e) => handleEditExistingAsset(asset.id, 'condition', e.target.value)}
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                              >
                                <option value="good">Good</option>
                                <option value="needs-maintenance">Needs Maintenance</option>
                                <option value="damaged">Damaged</option>
                              </select>
                            </div>
                          </div>
                        )}

                        {isRemoved && (
                          <p className="text-sm text-red-600 italic">Will be removed from this room</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Available Items */}
            <div className="p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Add New Assets</h4>
              {availableItems.length === 0 ? (
                <p className="text-gray-500 text-sm">No available items to add</p>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {availableItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => handleAddItem(item)}
                      className="bg-white rounded-xl p-3 hover:shadow-lg hover:scale-105 transition-all border-2 border-gray-200 hover:border-purple-400"
                    >
                      <div className="aspect-square bg-gray-100 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M9 21V9l3-2 3 2v12" />
                          </svg>
                        )}
                      </div>
                      <h5 className="font-semibold text-xs text-gray-900 line-clamp-2">{item.name}</h5>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right: Selected Items */}
      <div className="w-96 flex flex-col bg-white">
        <div className="bg-gray-900 text-white p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">Selected Items</h3>
            <div className="bg-white/20 px-3 py-1 rounded-full">
              <span className="text-sm font-bold">{selectedItems.length}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {selectedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-sm">No items selected</p>
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

                <select
                  value={item.condition}
                  onChange={(e) => handleUpdateItemDetails(item.id, 'condition', e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded mb-2"
                >
                  <option value="good">Good Condition</option>
                  <option value="needs-maintenance">Needs Maintenance</option>
                  <option value="damaged">Damaged</option>
                </select>

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

        <div className="border-t border-gray-200 p-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Total Items:</span>
            <span className="font-bold text-lg">{selectedItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
          </div>

          <div className="flex space-x-2">
            <Button variant="ghost" onClick={() => setStep(2)} className="flex-1">
              Back
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={selectedItems.length === 0}
              className="flex-1 bg-black text-white hover:bg-gray-800"
            >
              Assign to Room
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
