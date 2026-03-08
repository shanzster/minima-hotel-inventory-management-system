'use client'

import { useState, useEffect } from 'react'
import Button from '../ui/Button'
import Spinner from '../ui/Spinner'
import roomsApi from '../../lib/roomsApi'
import inventoryApi from '../../lib/inventoryApi'
import toast from '../../lib/toast'

export default function EnhancedAssetAssignment({ onSubmit, onCancel }) {
  const [step, setStep] = useState(1) // 1: Category, 2: Rooms (multiple), 3: Assets
  const [roomCategory, setRoomCategory] = useState('')
  const [rooms, setRooms] = useState([])
  const [selectedRooms, setSelectedRooms] = useState([]) // Changed to array for multiple rooms
  const [existingAssets, setExistingAssets] = useState([])
  const [editedAssets, setEditedAssets] = useState([]) // Track edits to existing assets
  const [removedAssetIds, setRemovedAssetIds] = useState([]) // Track removed assets
  const [availableItems, setAvailableItems] = useState([])
  const [selectedItems, setSelectedItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingAssets, setLoadingAssets] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false) // Add submitting state
  const [roomAssetsCache, setRoomAssetsCache] = useState({}) // Cache assets per room

  // Room categories
  const roomCategories = [
    { 
      value: 'standard', 
      label: 'Standard Room', 
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    { 
      value: 'deluxe', 
      label: 'Deluxe Room', 
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      )
    },
    { 
      value: 'suite', 
      label: 'Suite', 
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    },
    { 
      value: 'presidential', 
      label: 'Presidential Suite', 
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      )
    },
    { 
      value: 'conference', 
      label: 'Conference Room', 
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    { 
      value: 'common', 
      label: 'Common Area', 
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
        </svg>
      )
    }
  ]

  // Load rooms when category is selected
  useEffect(() => {
    if (roomCategory && step === 2) {
      loadRoomsByCategory()
    }
  }, [roomCategory, step])

  // Load existing assets and available items when rooms are selected
  useEffect(() => {
    if (selectedRooms.length > 0 && step === 3) {
      loadRoomData()
    }
  }, [selectedRooms, step])

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
      
      // Load items once
      const items = await inventoryApi.getAll()
      
      // Filter available items (equipment/furniture only, with available stock)
      const equipmentItems = items.filter(item => 
        (item.category === 'equipment' || item.category === 'furniture') &&
        item.type !== 'asset-instance' && // Exclude individual asset instances
        (item.currentStock > 0 || item.currentStock === undefined) // Show items with stock
      )
      setAvailableItems(equipmentItems)
      
      // Load existing assets for all selected rooms
      const allAssets = []
      for (const room of selectedRooms) {
        const roomNum = room.roomNumber || room.number
        const assets = await inventoryApi.getAssetsByRoom(room.id, roomNum)
        allAssets.push(...(assets || []))
      }
      setExistingAssets(allAssets)
      
    } catch (error) {
      console.error('Error loading room data:', error)
      toast.error('Failed to load room data')
    } finally {
      setLoadingAssets(false)
    }
  }

  const handleAddItem = (item) => {
    const numRooms = selectedRooms.length
    
    // Check if there's enough stock (quantity * number of rooms)
    const currentlySelected = selectedItems.find(i => i.sourceId === item.id)
    const totalSelected = currentlySelected ? currentlySelected.quantity : 0
    const totalNeeded = (totalSelected + 1) * numRooms // Each quantity will be multiplied by rooms
    
    if (totalNeeded > item.currentStock) {
      toast.warning(`Not enough stock for ${item.name}. Need ${totalNeeded} (${totalSelected + 1} × ${numRooms} rooms) but only ${item.currentStock} available`)
      return
    }

    const exists = selectedItems.find(i => i.sourceId === item.id)
    if (exists) {
      setSelectedItems(selectedItems.map(i => 
        i.sourceId === item.id ? { ...i, quantity: i.quantity + 1 } : i
      ))
    } else {
      const numRooms = selectedRooms.length
      const totalSerialNumbers = 1 * numRooms // quantity × rooms
      setSelectedItems([...selectedItems, {
        id: Date.now() + Math.random(),
        sourceId: item.id,
        name: item.name,
        category: item.category,
        imageUrl: item.imageUrl,
        quantity: 1,
        maxStock: Math.floor(item.currentStock / numRooms), // Max per room based on total stock
        condition: 'good',
        serialNumbers: Array(totalSerialNumbers).fill(''), // Array of serial numbers for all rooms
        notes: ''
      }])
    }
  }

  const handleRemoveItem = (id) => {
    setSelectedItems(selectedItems.filter(item => item.id !== id))
  }

  const handleUpdateQuantity = (id, change) => {
    const numRooms = selectedRooms.length
    
    setSelectedItems(selectedItems.map(item => {
      if (item.id === id) {
        const newQuantity = Math.max(1, item.quantity + change)
        
        // Check if we have enough stock for all rooms
        const totalNeeded = newQuantity * numRooms
        const sourceItem = availableItems.find(i => i.id === item.sourceId)
        
        if (sourceItem && totalNeeded > sourceItem.currentStock) {
          toast.warning(`Not enough stock for ${item.name}. Need ${totalNeeded} (${newQuantity} × ${numRooms} rooms) but only ${sourceItem.currentStock} available`)
          return item
        }
        
        // Adjust serial numbers array to match new total (quantity × rooms)
        const totalSerialNumbers = newQuantity * numRooms
        const serialNumbers = item.serialNumbers || []
        const updatedSerialNumbers = Array(totalSerialNumbers).fill('').map((_, i) => serialNumbers[i] || '')
        
        return { ...item, quantity: newQuantity, serialNumbers: updatedSerialNumbers }
      }
      return item
    }))
  }

  const handleUpdateItemDetails = (id, field, value) => {
    setSelectedItems(selectedItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const handleUpdateSerialNumber = (itemId, index, value) => {
    setSelectedItems(selectedItems.map(item => {
      if (item.id === itemId) {
        const serialNumbers = item.serialNumbers || []
        const updated = [...serialNumbers]
        updated[index] = value
        return { ...item, serialNumbers: updated }
      }
      return item
    }))
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

  // Calculate remaining stock for an item (original stock - selected quantity * number of rooms)
  const getRemainingStock = (itemId) => {
    const item = availableItems.find(i => i.id === itemId)
    if (!item) return 0
    
    const selectedItem = selectedItems.find(i => i.sourceId === itemId)
    const selectedQty = selectedItem ? selectedItem.quantity : 0
    const numRooms = selectedRooms.length
    
    // Total stock needed = quantity per room × number of rooms
    const totalNeeded = selectedQty * numRooms
    
    return Math.max(0, (item.currentStock || 0) - totalNeeded)
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

    setIsSubmitting(true) // Start loading

    try {
      // Process for each selected room
      for (const room of selectedRooms) {
        const result = {
          newAssets: [],
          editedAssets: editedAssets,
          removedAssetIds: removedAssetIds
        }

        // Process new assets to add for this room
        selectedItems.forEach(item => {
          for (let i = 0; i < item.quantity; i++) {
            // Get the serial number for this specific item (if provided)
            const serialNumber = (item.serialNumbers && item.serialNumbers[i]) || ''
            const serialNumberWithRoom = serialNumber ? `${serialNumber}-${room.roomNumber || room.number}` : ''
            
            result.newAssets.push({
              name: item.name,
              category: item.category,
              condition: item.condition,
              serialNumber: serialNumberWithRoom,
              notes: item.notes,
              type: 'asset',
              room: room.roomNumber || room.number,
              roomId: room.id,
              location: `Room ${room.roomNumber || room.number}`,
              currentStock: 1,
              unit: 'unit',
              restockThreshold: 0,
              imageUrl: item.imageUrl || ''
            })
          }
        })

        await onSubmit(result)
      }
      
      toast.success(`Assets assigned successfully to ${selectedRooms.length} room(s)!`)
    } catch (error) {
      console.error('Error submitting changes:', error)
      toast.error('Failed to save changes')
    } finally {
      setIsSubmitting(false) // Stop loading
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
              <div className="text-purple-600 mb-3 flex justify-center">{category.icon}</div>
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

  // Step 2: Select Rooms (Multiple)
  if (step === 2) {
    const toggleRoomSelection = (room) => {
      setSelectedRooms(prev => {
        const isSelected = prev.find(r => r.id === room.id)
        if (isSelected) {
          return prev.filter(r => r.id !== room.id)
        } else {
          return [...prev, room]
        }
      })
    }

    const isRoomSelected = (roomId) => {
      return selectedRooms.some(r => r.id === roomId)
    }

    return (
      <div className="space-y-6">
        <div className="text-center pb-4 border-b">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Step 2: Select Rooms</h3>
          <p className="text-sm text-gray-600">
            {roomCategories.find(c => c.value === roomCategory)?.label} - Choose one or more rooms
          </p>
          {selectedRooms.length > 0 && (
            <div className="mt-3">
              <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                {selectedRooms.length} room{selectedRooms.length !== 1 ? 's' : ''} selected
              </span>
            </div>
          )}
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
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {rooms.map(room => {
              const roomNum = room.roomNumber || room.number || 'N/A'
              const roomAssets = roomAssetsCache[room.id] || []
              const selected = isRoomSelected(room.id)
              
              // Group assets by name and count duplicates
              const groupedAssets = roomAssets.reduce((acc, asset) => {
                const name = asset.name
                if (acc[name]) {
                  acc[name].count++
                } else {
                  acc[name] = { name, count: 1 }
                }
                      return acc
                    }, {})
                    
                    const assetGroups = Object.values(groupedAssets)
                    const displayAssets = assetGroups.slice(0, 5)
                    const remainingCount = assetGroups.length - 5
                    
                    return (
                      <button
                        key={room.id}
                        onClick={() => toggleRoomSelection(room)}
                        className={`w-full text-left bg-white rounded-xl border-2 transition-all p-4 ${
                          selected 
                            ? 'border-blue-500 bg-blue-50 shadow-lg' 
                            : 'border-gray-200 hover:border-blue-400 hover:shadow-lg'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <div className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                              selected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                            }`}>
                              {selected && (
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="text-lg font-bold text-gray-900">Room {roomNum}</h5>
                              <p className="text-sm text-gray-600 mt-0.5">{room.type}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end justify-start space-y-1 flex-shrink-0 ml-3">
                            <span className="text-xs px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full font-medium whitespace-nowrap">
                              {roomAssets.length} {roomAssets.length === 1 ? 'asset' : 'assets'}
                            </span>
                          </div>
                        </div>

                        {roomAssets.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Current Assets</p>
                            <div className="flex flex-wrap gap-2">
                              {displayAssets.map((assetGroup, idx) => (
                                <span key={idx} className="text-xs px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md inline-flex items-center gap-1">
                                  <span>{assetGroup.name}</span>
                                  {assetGroup.count > 1 && (
                                    <span className="font-semibold text-gray-900">(×{assetGroup.count})</span>
                                  )}
                                </span>
                              ))}
                              {remainingCount > 0 && (
                                <span className="text-xs px-2.5 py-1 bg-gray-200 text-gray-600 rounded-md font-medium">
                                  +{remainingCount} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </button>
                    )
                  })}
          </div>
        )}

        <div className="flex justify-between pt-4 border-t">
          <Button variant="ghost" onClick={() => setStep(1)}>
            Back to Categories
          </Button>
          <Button 
            onClick={() => setStep(3)}
            disabled={selectedRooms.length === 0}
            className="bg-black text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue ({selectedRooms.length} room{selectedRooms.length !== 1 ? 's' : ''})
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
              <h3 className="text-lg font-bold">
                {selectedRooms.length === 1 
                  ? `Room ${selectedRooms[0].roomNumber || selectedRooms[0].number}`
                  : `${selectedRooms.length} Rooms Selected`
                }
              </h3>
              <p className="text-sm text-green-100">
                {selectedRooms.length === 1 
                  ? `${selectedRooms[0].type}`
                  : selectedRooms.map(r => `Room ${r.roomNumber || r.number}`).join(', ')
                }
              </p>
            </div>
            <button
              onClick={() => setStep(2)}
              className="text-white hover:bg-white/20 px-3 py-1 rounded-lg text-sm"
            >
              Change Rooms
            </button>
          </div>
        </div>

        {loadingAssets ? (
          <div className="flex-1 flex items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {/* Existing Assets - Always show this section */}
            <div className="p-4 bg-green-50 border-b border-green-200">
              <h4 className="font-semibold text-green-900 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Existing Assets in This Room ({existingAssets.filter(a => !removedAssetIds.includes(a.id)).length})
              </h4>
              
              {existingAssets.length === 0 ? (
                <div className="bg-white rounded-lg p-4 border border-green-200 text-center">
                  <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-sm text-gray-500">No assets assigned to this room yet</p>
                  <p className="text-xs text-gray-400 mt-1">Add assets from the list below</p>
                </div>
              ) : (
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
              )}
            </div>

            {/* Available Items */}
            <div className="p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Add New Assets</h4>
              {availableItems.length === 0 ? (
                <p className="text-gray-500 text-sm">No available items to add</p>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {availableItems.map(item => {
                    const remainingStock = getRemainingStock(item.id)
                    const isOutOfStock = remainingStock === 0
                    
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleAddItem(item)}
                        disabled={isOutOfStock}
                        className={`bg-white rounded-xl p-3 transition-all border-2 ${
                          isOutOfStock 
                            ? 'opacity-50 cursor-not-allowed border-gray-200' 
                            : 'hover:shadow-lg hover:scale-105 border-gray-200 hover:border-purple-400'
                        }`}
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
                        <h5 className="font-semibold text-xs text-gray-900 line-clamp-2 mb-1">{item.name}</h5>
                        <div className="flex items-center justify-center space-x-1">
                          <span className={`text-xs font-bold ${
                            isOutOfStock ? 'text-red-600' :
                            remainingStock > 10 ? 'text-green-600' : 
                            remainingStock > 5 ? 'text-amber-600' : 
                            'text-red-600'
                          }`}>
                            {remainingStock}
                          </span>
                          <span className="text-xs text-gray-500">
                            {isOutOfStock ? 'out of stock' : 'available'}
                          </span>
                        </div>
                      </button>
                    )
                  })}
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

                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
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
                  <span className="text-xs text-gray-500">
                    per room
                  </span>
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

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-700">
                    Serial Numbers (optional):
                    {selectedRooms.length > 1 && (
                      <span className="ml-1 text-gray-500">
                        ({item.quantity} × {selectedRooms.length} rooms = {item.quantity * selectedRooms.length} total)
                      </span>
                    )}
                  </label>
                  {selectedRooms.length === 1 ? (
                    // Single room: show quantity-based serial numbers
                    Array.from({ length: item.quantity }).map((_, index) => (
                      <input
                        key={index}
                        type="text"
                        placeholder={`Serial #${index + 1}`}
                        value={(item.serialNumbers && item.serialNumbers[index]) || ''}
                        onChange={(e) => handleUpdateSerialNumber(item.id, index, e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                      />
                    ))
                  ) : (
                    // Multiple rooms: show serial numbers grouped by room
                    selectedRooms.map((room, roomIndex) => (
                      <div key={room.id} className="space-y-1 mb-2">
                        <div className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                          Room {room.roomNumber || room.number}
                        </div>
                        {Array.from({ length: item.quantity }).map((_, qtyIndex) => {
                          const serialIndex = roomIndex * item.quantity + qtyIndex
                          return (
                            <input
                              key={serialIndex}
                              type="text"
                              placeholder={`Serial #${qtyIndex + 1} for Room ${room.roomNumber || room.number}`}
                              value={(item.serialNumbers && item.serialNumbers[serialIndex]) || ''}
                              onChange={(e) => handleUpdateSerialNumber(item.id, serialIndex, e.target.value)}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                            />
                          )
                        })}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-gray-200 p-4 space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Items per room:</span>
              <span className="font-bold text-lg">{selectedItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Number of rooms:</span>
              <span className="font-bold text-lg">{selectedRooms.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-200">
              <span className="text-gray-700 font-semibold">Total items needed:</span>
              <span className="font-bold text-xl text-green-600">
                {selectedItems.reduce((sum, item) => sum + item.quantity, 0) * selectedRooms.length}
              </span>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button 
              variant="ghost" 
              onClick={() => setStep(2)} 
              className="flex-1"
              disabled={isSubmitting}
            >
              Back
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={selectedItems.length === 0 || isSubmitting}
              className="flex-1 bg-black text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center space-x-2">
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Assigning...</span>
                </div>
              ) : (
                'Assign to Room'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
