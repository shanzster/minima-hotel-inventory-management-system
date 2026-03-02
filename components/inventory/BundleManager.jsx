'use client'

import { useState, useEffect } from 'react'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import roomsApi from '../../lib/roomsApi'
import { inventoryApi } from '../../lib/inventoryApi'

export default function BundleManager({ bundles = [], onCreateBundle, onEditBundle, onDeleteBundle, onAssignBundle, onClearAllAssignments }) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedBundle, setSelectedBundle] = useState(null)
  const [bundleName, setBundleName] = useState('')
  const [bundleDescription, setBundleDescription] = useState('')
  const [bundleType, setBundleType] = useState('standard')
  const [bundleItems, setBundleItems] = useState([])
  const [selectedItemId, setSelectedItemId] = useState('')
  const [newItemQuantity, setNewItemQuantity] = useState(1)
  const [rooms, setRooms] = useState([])
  const [selectedRooms, setSelectedRooms] = useState([])
  const [loadingRooms, setLoadingRooms] = useState(false)
  const [inventoryItems, setInventoryItems] = useState([])
  const [loadingItems, setLoadingItems] = useState(false)
  const [assignStep, setAssignStep] = useState(1) // 1: Category, 2: Rooms
  const [selectedRoomCategory, setSelectedRoomCategory] = useState('')
  const [roomBundleAssignments, setRoomBundleAssignments] = useState({}) // Track which rooms have bundles

  const bundleTypes = [
    { value: 'standard', label: 'Standard Room Kit', icon: '🛏️' },
    { value: 'deluxe', label: 'Deluxe Room Kit', icon: '✨' },
    { value: 'suite', label: 'Suite Kit', icon: '👑' },
    { value: 'custom', label: 'Custom Bundle', icon: '📦' }
  ]

  // Room categories with SVG icons
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
    if (showAssignModal && selectedRoomCategory && assignStep === 2) {
      loadRoomsByCategory()
      loadRoomBundleAssignments()
    }
  }, [showAssignModal, selectedRoomCategory, assignStep])

  // Load inventory items when create modal opens
  useEffect(() => {
    if (showCreateModal) {
      loadInventoryItems()
    }
  }, [showCreateModal])

  const loadInventoryItems = async () => {
    try {
      setLoadingItems(true)
      const items = await inventoryApi.getAll()
      // Filter to only show consumable items (exclude equipment, furniture, and asset instances)
      const consumableItems = items.filter(item => {
        // Exclude asset instances
        if (item.type === 'asset-instance') return false
        
        // Exclude equipment and furniture
        if (item.category === 'equipment' || item.category === 'furniture') return false
        
        // Include everything else (consumables, toiletries, supplies, or items without category)
        return true
      })
      setInventoryItems(consumableItems)
    } catch (error) {
      console.error('Error loading inventory items:', error)
    } finally {
      setLoadingItems(false)
    }
  }

  const loadRoomsByCategory = async () => {
    try {
      setLoadingRooms(true)
      const allRooms = await roomsApi.getAll()
      const filtered = allRooms.filter(room => 
        room.type?.toLowerCase().includes(selectedRoomCategory.toLowerCase())
      )
      setRooms(filtered)
    } catch (error) {
      console.error('Error loading rooms:', error)
    } finally {
      setLoadingRooms(false)
    }
  }

  const loadRoomBundleAssignments = () => {
    try {
      const stored = localStorage.getItem('room_bundle_assignments')
      if (stored) {
        setRoomBundleAssignments(JSON.parse(stored))
      }
    } catch (error) {
      console.error('Error loading room bundle assignments:', error)
    }
  }

  const handleToggleRoom = (roomId) => {
    // Check if room already has a bundle
    if (roomBundleAssignments[roomId]) {
      // Don't allow toggling if room already has a bundle
      return
    }
    
    setSelectedRooms(prev => 
      prev.includes(roomId) 
        ? prev.filter(id => id !== roomId)
        : [...prev, roomId]
    )
  }

  const handleAssignBundle = () => {
    if (selectedRooms.length === 0) {
      return
    }
    onAssignBundle(selectedBundle, selectedRooms)
    setShowAssignModal(false)
    setSelectedBundle(null)
    setSelectedRooms([])
    setAssignStep(1)
    setSelectedRoomCategory('')
  }

  const handleAddItem = () => {
    if (!selectedItemId) return

    // Find the selected item from inventory
    const selectedItem = inventoryItems.find(item => item.id === selectedItemId)
    if (!selectedItem) return

    // Check if item is already in bundle
    const existingItem = bundleItems.find(item => item.itemId === selectedItemId)
    if (existingItem) {
      // Update quantity if already exists
      setBundleItems(bundleItems.map(item => 
        item.itemId === selectedItemId 
          ? { ...item, quantity: item.quantity + newItemQuantity }
          : item
      ))
    } else {
      // Add new item to bundle
      setBundleItems([...bundleItems, {
        id: Date.now(),
        itemId: selectedItemId,
        name: selectedItem.name,
        category: selectedItem.category || 'Uncategorized',
        unit: selectedItem.unit || 'pcs',
        quantity: newItemQuantity
      }])
    }
    
    setSelectedItemId('')
    setNewItemQuantity(1)
  }

  const handleRemoveItem = (id) => {
    setBundleItems(bundleItems.filter(item => item.id !== id))
  }

  const handleCreateBundle = () => {
    if (!bundleName.trim() || bundleItems.length === 0) return

    const newBundle = {
      id: Date.now(),
      name: bundleName,
      description: bundleDescription,
      type: bundleType,
      items: bundleItems,
      createdAt: new Date().toISOString()
    }

    onCreateBundle(newBundle)
    resetForm()
    setShowCreateModal(false)
  }

  const resetForm = () => {
    setBundleName('')
    setBundleDescription('')
    setBundleType('standard')
    setBundleItems([])
    setSelectedItemId('')
    setNewItemQuantity(1)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Bundle Management</h2>
          <p className="text-sm text-gray-600">Create and manage toiletry bundles for quick room setup</p>
        </div>
        <div className="flex items-center space-x-3">
          {onClearAllAssignments && (
            <Button
              onClick={onClearAllAssignments}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear All Assignments
            </Button>
          )}
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-black text-white hover:bg-gray-800"
          >
            <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Bundle
          </Button>
        </div>
      </div>

      {/* Bundles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {bundles.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M9 21V9l3-2 3 2v12" />
            </svg>
            <p>No bundles created yet</p>
            <p className="text-sm mt-2">Create your first bundle to get started</p>
          </div>
        ) : (
          bundles.map(bundle => (
            <div key={bundle.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-2xl">
                      {bundleTypes.find(t => t.value === bundle.type)?.icon || '📦'}
                    </span>
                    <h3 className="font-semibold text-gray-900">{bundle.name}</h3>
                  </div>
                  {bundle.description && (
                    <p className="text-sm text-gray-600">{bundle.description}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-xs font-medium text-gray-500 uppercase">Items ({bundle.items.length})</p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {bundle.items.map(item => (
                    <div key={item.id} className="flex items-center justify-between text-sm bg-gray-50 rounded px-2 py-1">
                      <span className="text-gray-700">{item.name}</span>
                      <span className="text-gray-500 font-medium">×{item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={() => {
                    setSelectedBundle(bundle)
                    setShowAssignModal(true)
                  }}
                  className="flex-1 bg-black text-white hover:bg-gray-800 text-sm"
                >
                  Assign to Room
                </Button>
                <button
                  onClick={() => onDeleteBundle(bundle.id)}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Bundle Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          resetForm()
        }}
        title="Create New Bundle"
        size="lg"
      >
        <div className="space-y-4">
          {/* Bundle Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bundle Type</label>
            <div className="grid grid-cols-2 gap-3">
              {bundleTypes.map(type => (
                <button
                  key={type.value}
                  onClick={() => setBundleType(type.value)}
                  className={`p-3 border-2 rounded-lg transition-all ${
                    bundleType === type.value
                      ? 'border-black bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{type.icon}</div>
                  <div className="text-sm font-medium">{type.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Bundle Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bundle Name</label>
            <input
              type="text"
              value={bundleName}
              onChange={(e) => setBundleName(e.target.value)}
              placeholder="e.g., Standard Room Toiletries"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20"
            />
          </div>

          {/* Bundle Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
            <textarea
              value={bundleDescription}
              onChange={(e) => setBundleDescription(e.target.value)}
              placeholder="Brief description of this bundle"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20"
            />
          </div>

          {/* Add Items */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bundle Items (Consumables Only)</label>
            <p className="text-xs text-gray-500 mb-3">Add toiletries, amenities, and other consumable items to this bundle</p>
            <div className="flex space-x-2 mb-3">
              <select
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20 bg-white"
                disabled={loadingItems}
              >
                <option value="">
                  {loadingItems ? 'Loading items...' : inventoryItems.length === 0 ? 'No consumable items available' : 'Select an item'}
                </option>
                {inventoryItems.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name} {item.category ? `(${item.category})` : ''}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={newItemQuantity}
                onChange={(e) => setNewItemQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20"
              />
              <Button 
                onClick={handleAddItem} 
                disabled={!selectedItemId || loadingItems}
                className="bg-black text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </Button>
            </div>

            {/* Items List */}
            {bundleItems.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                {bundleItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between bg-gray-50 rounded px-3 py-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">{item.name}</span>
                        <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded">{item.category}</span>
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-sm text-gray-600">×{item.quantity}</span>
                        <span className="text-xs text-gray-400">{item.unit}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-red-600 hover:text-red-700"
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

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="ghost"
              onClick={() => {
                setShowCreateModal(false)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateBundle}
              disabled={!bundleName.trim() || bundleItems.length === 0}
              className="bg-black text-white hover:bg-gray-800"
            >
              Create Bundle
            </Button>
          </div>
        </div>
      </Modal>

      {/* Assign Bundle Modal */}
      {selectedBundle && (
        <Modal
          isOpen={showAssignModal}
          onClose={() => {
            setShowAssignModal(false)
            setSelectedBundle(null)
            setSelectedRooms([])
            setAssignStep(1)
            setSelectedRoomCategory('')
          }}
          title={`Assign ${selectedBundle.name}`}
          size="lg"
        >
          <div className="space-y-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-medium text-purple-900 mb-2">Bundle Contents:</h4>
              <div className="space-y-1">
                {selectedBundle.items.map(item => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span className="text-purple-700">{item.name}</span>
                    <span className="text-purple-600 font-medium">×{item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 1: Select Room Category */}
            {assignStep === 1 && (
              <div className="space-y-4">
                <div className="text-center pb-4 border-b">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Step 1: Select Room Category</h3>
                  <p className="text-sm text-gray-600">Choose the type of room you want to assign this bundle to</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {roomCategories.map(category => (
                    <button
                      key={category.value}
                      onClick={() => {
                        setSelectedRoomCategory(category.value)
                        setAssignStep(2)
                      }}
                      className="p-6 border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all group"
                    >
                      <div className="text-purple-600 mb-3 flex justify-center">{category.icon}</div>
                      <h4 className="font-semibold text-gray-900 group-hover:text-purple-600">{category.label}</h4>
                    </button>
                  ))}
                </div>

                <div className="flex justify-end pt-4 border-t">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowAssignModal(false)
                      setSelectedBundle(null)
                      setSelectedRooms([])
                      setAssignStep(1)
                      setSelectedRoomCategory('')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Select Rooms */}
            {assignStep === 2 && (
              <div className="space-y-4">
                <div className="text-center pb-4 border-b">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Step 2: Select Rooms</h3>
                  <p className="text-sm text-gray-600">
                    {roomCategories.find(c => c.value === selectedRoomCategory)?.label} - Choose one or more rooms
                  </p>
                  {selectedRooms.length > 0 && (
                    <div className="mt-3">
                      <span className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                        {selectedRooms.length} room{selectedRooms.length !== 1 ? 's' : ''} selected
                      </span>
                    </div>
                  )}
                </div>

                {Object.keys(roomBundleAssignments).length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                      <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm text-blue-800">
                        Rooms with existing bundles are disabled and shown with a lock icon. Remove the existing bundle first to assign a new one.
                      </p>
                    </div>
                  </div>
                )}

                {loadingRooms ? (
                  <div className="text-center py-8 text-gray-500">Loading rooms...</div>
                ) : rooms.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p>No rooms found for this category</p>
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto space-y-3">
                    {Object.entries(
                      rooms.reduce((acc, room) => {
                        const floor = room.floor || 1
                        if (!acc[floor]) acc[floor] = []
                        acc[floor].push(room)
                        return acc
                      }, {})
                    ).sort(([a], [b]) => b - a).map(([floor, floorRooms]) => (
                      <div key={floor} className="space-y-2">
                        <div className="bg-gray-100 px-3 py-1 rounded text-sm font-semibold text-gray-700">
                          Floor {floor}
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {floorRooms.map(room => {
                            const roomNum = room.roomNumber || room.number
                            const isSelected = selectedRooms.includes(room.id)
                            const hasBundle = !!roomBundleAssignments[room.id]
                            
                            return (
                              <div key={room.id} className="relative">
                                {hasBundle && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if (window.confirm(`Remove bundle from Room ${roomNum}?`)) {
                                        const updatedAssignments = { ...roomBundleAssignments }
                                        delete updatedAssignments[room.id]
                                        localStorage.setItem('room_bundle_assignments', JSON.stringify(updatedAssignments))
                                        
                                        // Also remove bundle status
                                        const storedStatus = localStorage.getItem('room_bundle_status')
                                        if (storedStatus) {
                                          const statusData = JSON.parse(storedStatus)
                                          delete statusData[room.id]
                                          localStorage.setItem('room_bundle_status', JSON.stringify(statusData))
                                        }
                                        
                                        // Reload assignments
                                        loadRoomBundleAssignments()
                                      }
                                    }}
                                    className="absolute -top-1 -right-1 p-1 bg-red-500 rounded-full shadow-md hover:bg-red-600 transition-all z-10"
                                    title="Remove bundle"
                                  >
                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                )}
                                <button
                                  onClick={() => handleToggleRoom(room.id)}
                                  disabled={hasBundle}
                                  className={`w-full p-3 rounded-lg border-2 transition-all ${
                                    hasBundle
                                      ? 'border-gray-300 bg-gray-100 cursor-not-allowed opacity-60'
                                      : isSelected
                                      ? 'border-purple-500 bg-purple-50'
                                      : 'border-gray-200 bg-white hover:border-gray-300'
                                  }`}
                                >
                                  <div className="flex flex-col items-center space-y-1">
                                    {hasBundle ? (
                                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                      </svg>
                                    ) : isSelected ? (
                                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                    ) : (
                                      <div className="w-5 h-5"></div>
                                    )}
                                    <span className="text-sm font-bold text-gray-900">{roomNum}</span>
                                    <span className="text-xs text-gray-500">{room.type}</span>
                                    {hasBundle && (
                                      <span className="text-xs text-gray-500 font-medium">Has Bundle</span>
                                    )}
                                  </div>
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-between pt-4 border-t">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setAssignStep(1)
                      setSelectedRooms([])
                    }}
                  >
                    Back to Categories
                  </Button>
                  <Button
                    onClick={handleAssignBundle}
                    disabled={selectedRooms.length === 0}
                    className="bg-black text-white hover:bg-gray-800"
                  >
                    Assign to {selectedRooms.length} Room(s)
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}
