'use client'

import React, { useState, useEffect } from 'react'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import Modal from '../ui/Modal'
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
        requiredIngredients: menuItem.requiredIngredients || []
      })
    }
  }, [menuItem])

  const handleAvailabilityToggle = async () => {
    try {
      await onUpdateAvailability(menuItem.id, !menuItem.isAvailable)
      onClose()
    } catch (error) {
      console.error('Error updating availability:', error)
      alert('Failed to update availability. Please try again.')
    }
  }

  const handleEditItem = async () => {
    try {
      await onUpdateItem(menuItem.id, editForm)
      alert('Menu item updated successfully!')
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating menu item:', error)
      alert('Failed to update menu item. Please try again.')
    }
  }

  const handleEditFormChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const updateIngredient = (index, field, value) => {
    setEditForm(prev => ({
      ...prev,
      requiredIngredients: prev.requiredIngredients.map((ing, i) =>
        i === index ? { ...ing, [field]: value } : ing
      )
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
      size="xl"
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Basic Info */}
          <div className="space-y-4">
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

              <div className="grid grid-cols-2 gap-4">
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
                      {menuItem.preparationTime} minutes
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Ingredients */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Required Ingredients</h3>

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {menuItem.requiredIngredients?.map((ingredient, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        Ingredient #{index + 1}
                      </p>
                      <p className="text-xs text-gray-500">
                        ID: {ingredient.ingredientId}
                      </p>
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Quantity Required
                        </label>
                        <input
                          type="number"
                          value={editForm.requiredIngredients[index]?.quantityRequired || 0}
                          onChange={(e) => updateIngredient(index, 'quantityRequired', parseFloat(e.target.value) || 0)}
                          step="0.01"
                          min="0"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Unit
                        </label>
                        <input
                          type="text"
                          value={editForm.requiredIngredients[index]?.unit || ''}
                          onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={editForm.requiredIngredients[index]?.isCritical || false}
                            onChange={(e) => updateIngredient(index, 'isCritical', e.target.checked)}
                            className="rounded border-gray-300 text-black focus:ring-black"
                          />
                          <span className="ml-2 text-xs text-gray-700">Critical Ingredient</span>
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">Quantity:</span>
                        <span className="ml-2 font-medium">{ingredient.quantityRequired} {ingredient.unit}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Critical:</span>
                        <span className={`ml-2 font-medium ${ingredient.isCritical ? 'text-red-600' : 'text-green-600'}`}>
                          {ingredient.isCritical ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )) || (
                <p className="text-sm text-gray-500 text-center py-4">
                  No ingredients specified
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Stock Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-2">Stock Information</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-blue-700">Menu Stock:</span>
              <span className="ml-2 font-medium">{menuItem.currentStock} servings</span>
            </div>
            <div>
              <span className="text-blue-700">Restock Threshold:</span>
              <span className="ml-2 font-medium">{menuItem.restockThreshold}</span>
            </div>
            <div>
              <span className="text-blue-700">Max Stock:</span>
              <span className="ml-2 font-medium">{menuItem.maxStock || 'Unlimited'}</span>
            </div>
            <div>
              <span className="text-blue-700">Location:</span>
              <span className="ml-2 font-medium">{menuItem.location || 'Not specified'}</span>
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