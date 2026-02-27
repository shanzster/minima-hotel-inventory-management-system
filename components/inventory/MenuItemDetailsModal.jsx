'use client'

import React, { useState, useEffect } from 'react'
import toast from '../../lib/toast'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import Modal from '../ui/Modal'
import ImageUpload from './ImageUpload'
import menuApi from '../../lib/menuApi'
import inventoryApi from '../../lib/inventoryApi'

export default function MenuItemDetailsModal({
  isOpen,
  onClose,
  menuItem,
  onUpdateAvailability,
  onUpdateItem,
  isLoading = false
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({})

  // Initialize edit form when menuItem changes
  React.useEffect(() => {
    if (menuItem) {
      setEditForm({
        name: menuItem.name || '',
        description: menuItem.description || '',
        category: menuItem.category || '',
        preparationTime: menuItem.preparationTime || 0,
        price: menuItem.price || 0,
        imageUrl: menuItem.imageUrl || '',
        imageMetadata: menuItem.imageMetadata || null
      })
    }
  }, [menuItem])

  const handleAvailabilityToggle = async () => {
    try {
      await onUpdateAvailability(menuItem.id, !menuItem.isAvailable)
      toast.success(`Menu item ${menuItem.isAvailable ? 'disabled' : 'enabled'} successfully!`)
      onClose()
    } catch (error) {
      console.error('Error updating availability:', error)
      toast.error('Failed to update availability. Please try again.')
    }
  }

  const handleEditItem = async () => {
    try {
      await onUpdateItem(menuItem.id, editForm)
      toast.success('Menu item updated successfully!')
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating menu item:', error)
      toast.error('Failed to update menu item. Please try again.')
    }
  }

  const handleEditFormChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleImageUpload = (imageData) => {
    setEditForm(prev => ({
      ...prev,
      imageUrl: imageData.url,
      imageMetadata: {
        publicId: imageData.publicId,
        width: imageData.width,
        height: imageData.height,
        size: imageData.size,
        format: imageData.format
      }
    }))
  }

  if (!menuItem) return null

  const getAvailabilityStatus = () => {
    if (menuItem.isAvailable) {
      return { status: 'success', label: 'Available', color: 'text-green-600' }
    }
    return { status: 'error', label: 'Unavailable', color: 'text-red-600' }
  }

  const availabilityStatus = getAvailabilityStatus()

  const menuCategories = {
    'appetizer': 'Appetizer',
    'main-course': 'Main Course',
    'dessert': 'Dessert',
    'beverage': 'Beverage'
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${menuItem.name} - Menu Details`}
      size="2xl"
    >
      <div className="space-y-6">
        {/* Header with Status and Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Badge variant={availabilityStatus.status}>
              {availabilityStatus.label}
            </Badge>
            <Badge variant="normal">
              {menuCategories[menuItem.category] || menuItem.category}
            </Badge>
            <span className="text-sm text-gray-500">
              ID: {menuItem.id}
            </span>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              disabled={isLoading}
            >
              {isEditing ? 'Cancel Edit' : 'Edit Details'}
            </Button>
            <Button
              variant={availabilityStatus.status === 'success' ? 'secondary' : 'primary'}
              size="sm"
              onClick={handleAvailabilityToggle}
              disabled={isLoading}
              className={availabilityStatus.status === 'success'
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
              }
            >
              {menuItem.isAvailable ? 'Make Unavailable' : 'Make Available'}
            </Button>
          </div>
        </div>

        {/* Menu Item Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Image */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Menu Item Image</h3>
            
            {isEditing ? (
              <ImageUpload
                onImageUpload={handleImageUpload}
                imageUrl={editForm.imageUrl}
                imageAlt={editForm.name || 'Menu Item'}
                disabled={isLoading}
              />
            ) : (
              <div className="space-y-3">
                {menuItem.imageUrl ? (
                  <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={menuItem.imageUrl}
                      alt={menuItem.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center text-gray-400">
                      <svg
                        className="w-16 h-16 mx-auto mb-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <p className="text-sm">No image</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Middle Column - Basic Info */}
          <div className="space-y-4 lg:col-span-2">
            <h3 className="text-lg font-medium text-gray-900">Menu Item Information</h3>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => handleEditFormChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                  />
                ) : (
                  <p className="text-lg font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                    {menuItem.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                {isEditing ? (
                  <textarea
                    value={editForm.description}
                    onChange={(e) => handleEditFormChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                  />
                ) : (
                  <p className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-md">
                    {menuItem.description || 'No description'}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  {isEditing ? (
                    <select
                      value={editForm.category}
                      onChange={(e) => handleEditFormChange('category', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                    >
                      <option value="appetizer">Appetizer</option>
                      <option value="main-course">Main Course</option>
                      <option value="dessert">Dessert</option>
                      <option value="beverage">Beverage</option>
                    </select>
                  ) : (
                    <p className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-md">
                      {menuCategories[menuItem.category] || menuItem.category}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (₱)
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editForm.price}
                      onChange={(e) => handleEditFormChange('price', parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  ) : (
                    <p className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-md">
                      ₱{(menuItem.price || 0).toFixed(2)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preparation Time
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editForm.preparationTime}
                      onChange={(e) => handleEditFormChange('preparationTime', parseInt(e.target.value) || 0)}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  ) : (
                    <p className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-md">
                      {menuItem.preparationTime} min
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stock Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-2">Additional Information</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-blue-700">Location:</span>
              <span className="ml-2 font-medium">{menuItem.location || 'Kitchen'}</span>
            </div>
            <div>
              <span className="text-blue-700">Unit:</span>
              <span className="ml-2 font-medium">{menuItem.unit || 'servings'}</span>
            </div>
            <div>
              <span className="text-blue-700">Stock:</span>
              <span className="ml-2 font-medium">{menuItem.currentStock || 1}</span>
            </div>
          </div>
        </div>

        {/* Timestamps */}
        <div className="border-t pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
            <div>
              <span className="font-medium">Created:</span> {menuItem.createdAt ? new Date(menuItem.createdAt).toLocaleString() : 'N/A'}
            </div>
            <div>
              <span className="font-medium">Last Updated:</span> {menuItem.updatedAt ? new Date(menuItem.updatedAt).toLocaleString() : 'N/A'}
            </div>
          </div>
        </div>

        {/* Edit Actions */}
        {isEditing && (
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="ghost"
              onClick={() => setIsEditing(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditItem}
              disabled={isLoading}
              className="bg-black text-white hover:bg-gray-800"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}
