'use client'

import { useState, useEffect } from 'react'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Badge from '../ui/Badge'
import { useAuth } from '../../hooks/useAuth'
import roomsApi from '../../lib/roomsApi'

export default function AssetManager({ assets = [], onAssetUpdate, conditionFilter = '', categoryFilter = '' }) {
  const { user } = useAuth()
  const [selectedAsset, setSelectedAsset] = useState(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [rooms, setRooms] = useState([])
  const [loadingRooms, setLoadingRooms] = useState(true)
  const [editForm, setEditForm] = useState({
    name: '',
    category: 'equipment',
    condition: 'good',
    purchaseDate: '',
    value: '',
    serialNumber: '',
    notes: '',
    room: '',
    roomId: ''
  })

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

    // Set up real-time listener
    const unsubscribe = roomsApi.onRoomsChange((roomsData) => {
      setRooms(roomsData)
    })

    return unsubscribe
  }, [])

  // Filter assets based on props
  const getFilteredAssets = () => {
    let filtered = [...assets]
    
    if (conditionFilter) {
      filtered = filtered.filter(asset => asset.condition === conditionFilter)
    }
    
    if (categoryFilter) {
      filtered = filtered.filter(asset => asset.category === categoryFilter)
    }
    
    return filtered
  }

  const filteredAssets = getFilteredAssets()

  // Handle delete asset
  const handleDeleteAsset = async (assetId) => {
    try {
      const inventoryApi = (await import('../../lib/inventoryApi')).default
      await inventoryApi.delete(assetId)
      
      // Show success message
      alert('Asset deleted successfully')
      
      // Refresh the page or update the assets list
      window.location.reload()
    } catch (error) {
      console.error('Error deleting asset:', error)
      alert('Failed to delete asset. Please try again.')
    }
  }

  // Handle edit asset
  const handleEditSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const inventoryApi = (await import('../../lib/inventoryApi')).default
      
      // Find the selected room details
      const selectedRoom = rooms.find(r => r.id === editForm.roomId)
      
      const updatedAsset = {
        ...selectedAsset,
        name: editForm.name,
        category: editForm.category,
        condition: editForm.condition,
        purchaseDate: editForm.purchaseDate,
        value: parseFloat(editForm.value) || 0,
        serialNumber: editForm.serialNumber,
        notes: editForm.notes,
        room: selectedRoom?.roomNumber || editForm.room,
        roomId: editForm.roomId,
        location: `Floor ${selectedRoom?.floor}, Room ${selectedRoom?.roomNumber || editForm.room}`
      }
      
      await inventoryApi.update(selectedAsset.id, updatedAsset)
      
      // Close modal and refresh
      setShowEditModal(false)
      setSelectedAsset(null)
      alert('Asset updated successfully')
      window.location.reload()
    } catch (error) {
      console.error('Error updating asset:', error)
      alert('Failed to update asset. Please try again.')
    }
  }

  // Open edit modal
  const openEditModal = (asset) => {
    setSelectedAsset(asset)
    setEditForm({
      name: asset.name || '',
      category: asset.category || 'equipment',
      condition: asset.condition || 'good',
      purchaseDate: asset.purchaseDate || '',
      value: asset.value || '',
      serialNumber: asset.serialNumber || '',
      notes: asset.notes || '',
      room: asset.room || '',
      roomId: asset.roomId || ''
    })
    setShowEditModal(true)
  }

  return (
    <div className="space-y-6">
      {/* Asset List */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Asset
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Condition
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Room
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAssets.map((asset) => (
                <tr key={asset.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {asset.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {asset.description}
                      </div>
                      {asset.serialNumber && (
                        <div className="text-xs text-gray-400">
                          S/N: {asset.serialNumber}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={asset.condition}>
                      {asset.condition}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <Badge variant="normal">
                      {asset.category ? asset.category.charAt(0).toUpperCase() + asset.category.slice(1) : 'N/A'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={
                      asset.condition === 'good' ? 'success' :
                      asset.condition === 'needs-maintenance' ? 'warning' :
                      asset.condition === 'damaged' ? 'error' : 'normal'
                    }>
                      {asset.condition ? asset.condition.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Good'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {asset.room ? (
                      <div className="flex items-center space-x-1">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>Room {asset.room}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">Not assigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedAsset(asset)
                          setShowViewModal(true)
                        }}
                        className="inline-flex items-center px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors backdrop-blur-sm"
                        title="View asset details"
                      >
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          openEditModal(asset)
                        }}
                        className="inline-flex items-center px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors backdrop-blur-sm"
                        title="Edit asset"
                      >
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (confirm(`Are you sure you want to delete ${asset.name}?`)) {
                            handleDeleteAsset(asset.id)
                          }
                        }}
                        className="inline-flex items-center px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors backdrop-blur-sm"
                        title="Delete asset"
                      >
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

        {assets.length === 0 && (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-500">No assets found</p>
          </div>
        )}
      </div>

      {/* View Asset Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false)
          setSelectedAsset(null)
        }}
        title={`Asset Details - ${selectedAsset?.name}`}
        size="lg"
      >
        {selectedAsset && (
          <div className="space-y-6">
            {/* Asset Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Asset Name</label>
                <p className="text-base text-gray-900">{selectedAsset.name}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <Badge variant="normal">
                  {selectedAsset.category ? selectedAsset.category.charAt(0).toUpperCase() + selectedAsset.category.slice(1) : 'N/A'}
                </Badge>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                <Badge variant={
                  selectedAsset.condition === 'good' ? 'success' :
                  selectedAsset.condition === 'needs-maintenance' ? 'warning' :
                  selectedAsset.condition === 'damaged' ? 'error' : 'normal'
                }>
                  {selectedAsset.condition ? selectedAsset.condition.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Good'}
                </Badge>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
                <p className="text-base text-gray-900">{selectedAsset.serialNumber || 'N/A'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
                <p className="text-base text-gray-900">
                  {selectedAsset.room ? `Room ${selectedAsset.room}` : 'Not assigned'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <p className="text-base text-gray-900">{selectedAsset.location || 'N/A'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
                <p className="text-base text-gray-900">
                  {selectedAsset.purchaseDate ? new Date(selectedAsset.purchaseDate).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                <p className="text-base text-gray-900">
                  {selectedAsset.value ? `₱${selectedAsset.value.toFixed(2)}` : 'N/A'}
                </p>
              </div>
            </div>
            
            {/* Notes */}
            {selectedAsset.notes && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <p className="text-base text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedAsset.notes}</p>
              </div>
            )}
            
            {/* Description */}
            {selectedAsset.description && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <p className="text-base text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedAsset.description}</p>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowViewModal(false)
                  setSelectedAsset(null)
                }}
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  setShowViewModal(false)
                  openEditModal(selectedAsset)
                }}
                className="bg-black text-white hover:bg-gray-800"
              >
                Edit Asset
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Asset Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedAsset(null)
        }}
        title={`Edit Asset - ${selectedAsset?.name}`}
        size="lg"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Asset Name *
              </label>
              <Input
                type="text"
                value={editForm.name}
                onChange={(value) => setEditForm({ ...editForm, name: value })}
                placeholder="e.g., Air Conditioner, TV, Bed"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                value={editForm.category}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20"
                required
              >
                <option value="equipment">Equipment</option>
                <option value="furniture">Furniture</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Serial Number
              </label>
              <Input
                type="text"
                value={editForm.serialNumber}
                onChange={(value) => setEditForm({ ...editForm, serialNumber: value })}
                placeholder="Optional"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Condition *
              </label>
              <select
                value={editForm.condition}
                onChange={(e) => setEditForm({ ...editForm, condition: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20"
                required
              >
                <option value="good">Good</option>
                <option value="needs-maintenance">Needs Maintenance</option>
                <option value="damaged">Damaged</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purchase Date
              </label>
              <Input
                type="date"
                value={editForm.purchaseDate}
                onChange={(value) => setEditForm({ ...editForm, purchaseDate: value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Value (₱)
              </label>
              <Input
                type="number"
                value={editForm.value}
                onChange={(value) => setEditForm({ ...editForm, value: value })}
                placeholder="0.00"
                step="0.01"
              />
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Room Assignment *
              </label>
              <select
                value={editForm.roomId}
                onChange={(e) => setEditForm({ ...editForm, roomId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20"
                required
                disabled={loadingRooms}
              >
                <option value="">{loadingRooms ? 'Loading rooms...' : 'Select Room'}</option>
                {rooms.map(room => (
                  <option key={room.id} value={room.id}>
                    Room {room.roomNumber} - {room.type} (Floor {room.floor})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={editForm.notes}
              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20"
              rows="3"
              placeholder="Additional information..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setShowEditModal(false)
                setSelectedAsset(null)
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-black text-white hover:bg-gray-800"
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}