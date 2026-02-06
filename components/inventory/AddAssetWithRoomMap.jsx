'use client'

import { useState, useEffect } from 'react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import roomsApi from '../../lib/roomsApi'

export default function AddAssetWithRoomMap({ onSubmit, onCancel }) {
  const [rooms, setRooms] = useState([])
  const [loadingRooms, setLoadingRooms] = useState(true)
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    category: 'equipment',
    condition: 'good',
    purchaseDate: '',
    value: '',
    serialNumber: '',
    notes: ''
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
  }, [])

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

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!selectedRoom) {
      alert('Please select a room for this asset')
      return
    }

    const assetData = {
      ...formData,
      type: 'asset',
      room: selectedRoom.roomNumber || selectedRoom.number,
      roomId: selectedRoom.id,
      location: `Floor ${selectedRoom.floor}, Room ${selectedRoom.roomNumber || selectedRoom.number}`,
      currentStock: 1,
      unit: 'unit',
      restockThreshold: 0
    }

    onSubmit(assetData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Asset Details Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Asset Details</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Asset Name *
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(value) => setFormData({ ...formData, name: value })}
              placeholder="e.g., Air Conditioner, TV, Bed"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
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
              value={formData.serialNumber}
              onChange={(value) => setFormData({ ...formData, serialNumber: value })}
              placeholder="Optional"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Condition *
            </label>
            <select
              value={formData.condition}
              onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
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
              value={formData.purchaseDate}
              onChange={(value) => setFormData({ ...formData, purchaseDate: value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Value (₱)
            </label>
            <Input
              type="number"
              value={formData.value}
              onChange={(value) => setFormData({ ...formData, value: value })}
              placeholder="0.00"
              step="0.01"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20"
            rows="2"
            placeholder="Additional information..."
          />
        </div>
      </div>

      {/* Room Selection Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
          Select Room *
          {selectedRoom && (
            <span className="ml-3 text-sm font-normal text-green-600">
              Selected: Room {selectedRoom.roomNumber || selectedRoom.number} - {selectedRoom.type}
            </span>
          )}
        </h3>

        {loadingRooms ? (
          <div className="text-center py-8 text-gray-500">Loading rooms...</div>
        ) : (
          <div className="space-y-6">
            {Object.keys(roomsByFloor).sort((a, b) => b - a).map(floor => (
              <div key={floor} className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-700 bg-gray-100 px-3 py-2 rounded">
                  Floor {floor}
                </h4>
                
                {/* Room Minimap Grid */}
                <div className="grid grid-cols-6 gap-3">
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
                          onClick={() => setSelectedRoom(room)}
                          className={`
                            relative p-4 rounded-lg border-2 transition-all duration-200
                            ${isSelected 
                              ? 'border-green-500 bg-green-50 shadow-lg scale-105' 
                              : 'border-gray-300 bg-white hover:border-gray-400 hover:shadow-md'
                            }
                          `}
                        >
                          {/* Room Icon */}
                          <div className="flex flex-col items-center space-y-1">
                            <svg 
                              className={`w-8 h-8 ${isSelected ? 'text-green-600' : 'text-gray-600'}`} 
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
                            
                            {/* Room Number */}
                            <span className={`text-sm font-bold ${isSelected ? 'text-green-700' : 'text-gray-700'}`}>
                              {roomNum}
                            </span>
                            
                            {/* Room Type */}
                            <span className="text-xs text-gray-500 truncate w-full text-center">
                              {room.type || 'Room'}
                            </span>
                            
                            {/* Status Indicator */}
                            {isOccupied && (
                              <div className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full" 
                                   title="Occupied" />
                            )}
                            
                            {/* Selected Checkmark */}
                            {isSelected && (
                              <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
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

        {/* Legend */}
        <div className="flex items-center space-x-6 text-xs text-gray-600 bg-gray-50 p-3 rounded">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Selected</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Occupied</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
            <span>Available</span>
          </div>
        </div>
      </div>

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
          type="submit"
          className="bg-black text-white hover:bg-gray-800"
        >
          Add Asset
        </Button>
      </div>
    </form>
  )
}
