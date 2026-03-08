'use client'

import { useState, useEffect } from 'react'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Badge from '../ui/Badge'
import { useAuth } from '../../hooks/useAuth'
import roomsApi from '../../lib/roomsApi'
import toast from '../../lib/toast'

export default function AssetManager({ assets = [], onAssetUpdate, conditionFilter = '', categoryFilter = '' }) {
  const { user } = useAuth()
  const [selectedAsset, setSelectedAsset] = useState(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false)
  const [showSaveConfirmModal, setShowSaveConfirmModal] = useState(false)
  const [selectedUnit, setSelectedUnit] = useState(null)
  const [selectedUnitToDelete, setSelectedUnitToDelete] = useState(null)
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

  // Group assets by name
  const getGroupedAssets = () => {
    const filtered = [...assets]
    let filteredList = filtered

    if (conditionFilter) {
      filteredList = filteredList.filter(asset => asset.condition === conditionFilter)
    }

    if (categoryFilter) {
      filteredList = filteredList.filter(asset => asset.category === categoryFilter)
    }

    const groups = filteredList.reduce((acc, asset) => {
      const existing = acc.find(g => g.name === asset.name)
      if (existing) {
        existing.units.push(asset)
        existing.count += 1
      } else {
        acc.push({
          id: `group-${asset.name}`,
          name: asset.name,
          category: asset.category,
          description: asset.description,
          count: 1,
          units: [asset]
        })
      }
      return acc
    }, [])

    return groups
  }

  const groupedAssets = getGroupedAssets()

  // Handle delete asset unit
  const handleDeleteAsset = async () => {
    try {
      const inventoryApi = (await import('../../lib/inventoryApi')).default
      await inventoryApi.delete(selectedUnitToDelete.id)

      // Close modals
      setShowDeleteConfirmModal(false)
      setSelectedUnitToDelete(null)

      // If we were viewing the group, the assets list will update via parent
      // but we might want to close the view modal if it was the last unit
      if (selectedAsset?.units?.length <= 1) {
        setShowViewModal(false)
        setSelectedAsset(null)
      }

      // Show success toast
      toast.success('Asset unit removed successfully')

      // Refresh the page
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      console.error('Error deleting asset unit:', error)
      toast.error('Failed to delete asset unit. Please try again.')
    }
  }

  // Handle edit asset
  const handleEditSubmit = (e) => {
    e.preventDefault()
    // Show confirmation modal instead of submitting directly
    setShowSaveConfirmModal(true)
  }

  // Confirm and save edit
  const confirmSaveEdit = async () => {
    try {
      const inventoryApi = (await import('../../lib/inventoryApi')).default

      // Find the selected room details
      const selectedRoom = rooms.find(r => r.id === editForm.roomId)

      const updatedAsset = {
        ...selectedUnit,
        name: editForm.name,
        category: editForm.category,
        condition: editForm.condition,
        purchaseDate: editForm.purchaseDate,
        value: parseFloat(editForm.value) || 0,
        serialNumber: editForm.serialNumber,
        notes: editForm.notes,
        room: selectedRoom?.roomNumber || editForm.room,
        roomId: editForm.roomId,
        location: `Room ${selectedRoom?.roomNumber || editForm.room}`
      }

      await inventoryApi.update(selectedUnit.id, updatedAsset)

      // Close modals
      setShowSaveConfirmModal(false)
      setShowEditModal(false)
      setSelectedUnit(null)

      // Show success toast
      toast.success('Asset unit updated successfully')

      // Refresh the page
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      console.error('Error updating asset unit:', error)
      toast.error('Failed to update asset unit. Please try again.')
    }
  }

  // Open edit modal
  const openEditModal = (unit) => {
    setSelectedUnit(unit)
    setEditForm({
      name: unit.name || '',
      category: unit.category || 'equipment',
      condition: unit.condition || 'good',
      purchaseDate: unit.purchaseDate || '',
      value: unit.value || '',
      serialNumber: unit.serialNumber || '',
      notes: unit.notes || '',
      room: unit.room || '',
      roomId: unit.roomId || ''
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
                Total Units
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assignments
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {groupedAssets.map((group) => (
              <tr
                key={group.id}
                onClick={() => {
                  setSelectedAsset(group)
                  setShowViewModal(true)
                }}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {group.name}
                    </div>
                    <div className="text-xs text-gray-500 line-clamp-1">
                      {group.description || 'No description available'}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge variant={group.category}>
                    {group.category ? group.category.charAt(0).toUpperCase() + group.category.slice(1) : 'N/A'}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
                    {group.count} {group.count === 1 ? 'Unit' : 'Units'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex -space-x-2 overflow-hidden">
                    {group.units.slice(0, 3).map((unit, i) => (
                      <div key={unit.id} className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-gray-100 flex items-center justify-center border border-gray-200" title={`Room ${unit.room}`}>
                        <span className="text-[8px] font-bold text-gray-600">R{unit.room?.toString().slice(-3)}</span>
                      </div>
                    ))}
                    {group.units.length > 3 && (
                      <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-gray-200 flex items-center justify-center border border-gray-200">
                        <span className="text-[8px] font-bold text-gray-600">+{group.units.length - 3}</span>
                      </div>
                    )}
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
            {/* Group Header */}
            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Asset Category</h4>
                <p className="text-sm font-semibold text-gray-900 capitalize">{selectedAsset.category || 'N/A'}</p>
              </div>
              <div className="text-right">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Assigned</h4>
                <p className="text-lg font-bold text-purple-600">{selectedAsset.count} {selectedAsset.count === 1 ? 'Unit' : 'Units'}</p>
              </div>
            </div>

            {/* Units List */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-gray-700 flex items-center">
                <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Individual Unit Assignments
              </h4>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <tr>
                      <th className="px-4 py-3">Serial Number</th>
                      <th className="px-4 py-3">Room / Location</th>
                      <th className="px-4 py-3">Condition</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedAsset.units?.map((unit) => (
                      <tr key={unit.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-mono text-xs text-gray-600">
                          {unit.serialNumber || <span className="text-gray-300 italic">No serial</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-1">
                            <svg className="w-3 h-3 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="font-medium text-gray-900">Room {unit.room}</span>
                          </div>
                          <p className="text-[10px] text-gray-400 mt-0.5">{unit.location}</p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={
                            unit.condition === 'good' ? 'success' :
                              unit.condition === 'needs-maintenance' ? 'warning' :
                                unit.condition === 'damaged' ? 'error' : 'normal'
                          }>
                            {unit.condition ? unit.condition.replace('-', ' ') : 'Good'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => openEditModal(unit)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit Unit"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => {
                                setSelectedUnitToDelete(unit)
                                setShowDeleteConfirmModal(true)
                              }}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete/Decommission Unit"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowViewModal(false)
                  setSelectedAsset(null)
                }}
              >
                Close View
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
        title={`Edit Asset Unit - ${selectedUnit?.name}`}
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
                    Room {room.roomNumber} - {room.type}
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
                setSelectedUnit(null)
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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirmModal}
        onClose={() => setShowDeleteConfirmModal(false)}
        title="Confirm Delete"
        size="md"
        centered
      >
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Delete Unit?
              </h4>
              <p className="text-gray-600">
                Are you sure you want to delete this unit (S/N: {selectedUnitToDelete?.serialNumber || 'N/A'}) assigned to <strong>Room {selectedUnitToDelete?.room}</strong>? This action cannot be undone.
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="ghost"
              onClick={() => setShowDeleteConfirmModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteAsset}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete Asset
            </Button>
          </div>
        </div>
      </Modal>

      {/* Save Confirmation Modal */}
      <Modal
        isOpen={showSaveConfirmModal}
        onClose={() => setShowSaveConfirmModal(false)}
        title="Confirm Changes"
        size="md"
        centered
      >
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Save Changes?
              </h4>
              <p className="text-gray-600">
                Are you sure you want to save the changes to this <strong>{selectedUnit?.name}</strong> unit?
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="ghost"
              onClick={() => setShowSaveConfirmModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmSaveEdit}
              className="bg-black text-white hover:bg-gray-800"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}