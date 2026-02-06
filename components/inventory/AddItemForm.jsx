'use client'

import { useState, useEffect } from 'react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import ImageUpload from './ImageUpload'
import Modal from '../ui/Modal'
import { INVENTORY_CATEGORIES } from '../../lib/constants'
import supplierApi from '../../lib/supplierApi'

export default function AddItemForm({ onSubmit, onCancel, isLoading = false }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'toiletries',
    type: 'consumable',
    variant: '', // Product variant/SKU
    unit: 'pcs',
    restockThreshold: 10,
    maxStock: 100,
    location: 'Kitchen Storage', // Default location
    supplier: '',
    cost: 0,
    notes: '',
    imageUrl: '',
    imageMetadata: null
  })

  const [suppliers, setSuppliers] = useState([])
  const [loadingSuppliers, setLoadingSuppliers] = useState(true)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  // Location presets
  const locationPresets = [
    'Kitchen Storage',
    'Walk-in Freezer',
    'Cold Storage',
    'Housekeeping Storage',
    'Pantry',
    'Warehouse'
  ]

  // Load suppliers on component mount
  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        setLoadingSuppliers(true)
        const suppliersList = await supplierApi.getAll()
        setSuppliers(suppliersList || [])
      } catch (error) {
        console.error('Error loading suppliers:', error)
        setSuppliers([])
      } finally {
        setLoadingSuppliers(false)
      }
    }

    loadSuppliers()
  }, [])

  const [errors, setErrors] = useState({})

  // Common room essentials presets
  const roomEssentials = [
    { name: 'Toothpaste', unit: 'pcs', category: 'toiletries', restockThreshold: 20, maxStock: 50 },
    { name: 'Toothbrush', unit: 'pcs', category: 'toiletries', restockThreshold: 30, maxStock: 100 },
    { name: 'Shampoo', unit: 'bottles', category: 'toiletries', restockThreshold: 15, maxStock: 40 },
    { name: 'Body Wash', unit: 'bottles', category: 'toiletries', restockThreshold: 15, maxStock: 40 },
    { name: 'Soap Bar', unit: 'pcs', category: 'toiletries', restockThreshold: 25, maxStock: 75 },
    { name: 'Towels', unit: 'pcs', category: 'toiletries', restockThreshold: 10, maxStock: 30 },
    { name: 'Tissues', unit: 'boxes', category: 'toiletries', restockThreshold: 20, maxStock: 60 },
    { name: 'Toilet Paper', unit: 'rolls', category: 'toiletries', restockThreshold: 50, maxStock: 200 },
    { name: 'Bed Sheets', unit: 'sets', category: 'toiletries', restockThreshold: 5, maxStock: 20 },
    { name: 'Pillowcases', unit: 'pcs', category: 'toiletries', restockThreshold: 10, maxStock: 40 }
  ]

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }))
    }
  }

  const applyPreset = (preset) => {
    setFormData(prev => ({
      ...prev,
      name: preset.name,
      unit: preset.unit,
      category: preset.category,
      restockThreshold: preset.restockThreshold,
      maxStock: preset.maxStock
    }))
  }

  const handleImageUpload = (imageData) => {
    setFormData(prev => ({
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

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Item name is required'
    }

    if (!formData.category) {
      newErrors.category = 'Category is required'
    }

    if (formData.restockThreshold < 0) {
      newErrors.restockThreshold = 'Restock threshold cannot be negative'
    }

    if (formData.maxStock && formData.maxStock <= 0) {
      newErrors.maxStock = 'Maximum stock must be greater than 0'
    }

    if (formData.cost < 0) {
      newErrors.cost = 'Cost cannot be negative'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    // Show confirmation modal
    setShowConfirmModal(true)
  }

  const handleConfirmSubmit = async () => {
    setShowConfirmModal(false)

    try {
      // Prepare data for submission
      const submitData = {
        ...formData,
        restockThreshold: parseFloat(formData.restockThreshold) || 0,
        maxStock: formData.maxStock ? parseFloat(formData.maxStock) : null,
        cost: parseFloat(formData.cost) || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      await onSubmit(submitData)
      
      // Show success modal
      setSuccessMessage(`Item "${formData.name}" has been successfully added!`)
      setShowSuccessModal(true)
      
      // Reset form after success
      setTimeout(() => {
        setShowSuccessModal(false)
        setFormData({
          name: '',
          description: '',
          category: 'toiletries',
          type: 'consumable',
          variant: '',
          unit: 'pcs',
          restockThreshold: 10,
          maxStock: 100,
          location: 'Kitchen Storage',
          supplier: '',
          cost: 0,
          notes: '',
          imageUrl: '',
          imageMetadata: null
        })
        setErrors({})
      }, 2000)
    } catch (error) {
      console.error('Error submitting form:', error)
      setShowConfirmModal(false)
      setErrors({ submit: 'Failed to add item. Please try again.' })
    }
  }

  const categoryOptions = INVENTORY_CATEGORIES.map(cat => ({
    label: cat.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value: cat
  }))

  const unitOptions = [
    { label: 'Pieces (pcs)', value: 'pcs' },
    { label: 'Kilograms (kg)', value: 'kg' },
    { label: 'Liters (L)', value: 'L' },
    { label: 'Milliliters (ml)', value: 'ml' },
    { label: 'Boxes', value: 'boxes' },
    { label: 'Bottles', value: 'bottles' },
    { label: 'Rolls', value: 'rolls' },
    { label: 'Sets', value: 'sets' },
    { label: 'Packs', value: 'packs' },
    { label: 'Tubes', value: 'tubes' },
    { label: 'Cans', value: 'cans' }
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Quick Presets for Room Essentials */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Quick Presets (Room Essentials)
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {roomEssentials.map((preset, index) => (
            <button
              key={index}
              type="button"
              onClick={() => applyPreset(preset)}
              className="text-left px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400 transition-colors"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Input
            label="Item Name"
            value={formData.name}
            onChange={(value) => handleInputChange('name', value)}
            error={errors.name}
            required
            placeholder="e.g., Toothpaste, Towels, Shampoo"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category *
          </label>
          <select
            value={formData.category}
            onChange={(e) => handleInputChange('category', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black ${
              errors.category ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            {categoryOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="mt-1 text-sm text-red-600">{errors.category}</p>
          )}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
          placeholder="Optional description of the item"
        />
      </div>

      {/* Variant */}
      <div>
        <Input
          label="Variant"
          value={formData.variant}
          onChange={(value) => handleInputChange('variant', value)}
          placeholder="e.g., Red, Golden, Blue, Large, Small, etc."
        />
      </div>

      {/* Product Image Upload */}
      <div>
        <ImageUpload
          onImageUpload={handleImageUpload}
          imageUrl={formData.imageUrl}
          imageAlt={formData.name || 'Product'}
          disabled={isLoading}
        />
      </div>

      {/* Unit and Restock Threshold */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Unit *
          </label>
          <select
            value={formData.unit}
            onChange={(e) => handleInputChange('unit', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
            required
          >
            {unitOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Input
            label="Restock Threshold"
            type="number"
            value={formData.restockThreshold}
            onChange={(value) => handleInputChange('restockThreshold', parseFloat(value) || 0)}
            error={errors.restockThreshold}
            min="0"
            step="1"
            required
          />
        </div>
      </div>

      {/* Max Stock */}
      <div>
        <Input
          label="Maximum Stock (Optional)"
          type="number"
          value={formData.maxStock}
          onChange={(value) => handleInputChange('maxStock', value ? parseFloat(value) : '')}
          error={errors.maxStock}
          min="0"
          step="1"
          placeholder="Leave empty for unlimited"
        />
      </div>

      {/* Location and Supplier */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Location *
          </label>
          <select
            value={formData.location}
            onChange={(e) => handleInputChange('location', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
            required
          >
            {locationPresets.map(location => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Supplier
          </label>
          <select
            value={formData.supplier}
            onChange={(e) => handleInputChange('supplier', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
            disabled={loadingSuppliers}
          >
            <option value="">{loadingSuppliers ? 'Loading suppliers...' : 'Select Supplier'}</option>
            {suppliers.map(supplier => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Cost */}
      <div>
        <Input
          label="Cost per Unit (₱)"
          type="number"
          value={formData.cost}
          onChange={(value) => handleInputChange('cost', parseFloat(value) || 0)}
          error={errors.cost}
          min="0"
          step="0.01"
          placeholder="0.00"
        />
      </div>

      {/* Notes */}
      <div>
        <Input
          label="Notes"
          value={formData.notes}
          onChange={(value) => handleInputChange('notes', value)}
          placeholder="Additional notes about this item"
        />
      </div>

      {/* Error Display */}
      {errors.submit && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800 text-sm">{errors.submit}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-black text-white hover:bg-gray-800"
        >
          {isLoading ? 'Adding Item...' : 'Add Item'}
        </Button>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirm Add Item"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to add <strong>{formData.name || 'this item'}</strong> to the inventory?
          </p>
          
          <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Category:</span>
              <span className="font-medium">{formData.category}</span>
            </div>
            {formData.variant && (
              <div className="flex justify-between">
                <span className="text-gray-600">Variant:</span>
                <span className="font-medium">{formData.variant}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Location:</span>
              <span className="font-medium">{formData.location}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Unit:</span>
              <span className="font-medium">{formData.unit}</span>
            </div>
            {formData.cost > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Cost:</span>
                <span className="font-medium">₱{formData.cost.toFixed(2)}</span>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowConfirmModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-black text-white hover:bg-gray-800"
              onClick={handleConfirmSubmit}
            >
              Confirm & Add Item
            </Button>
          </div>
        </div>
      </Modal>

      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="✓ Success"
      >
        <div className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
          
          <p className="text-gray-700 font-medium">
            {successMessage}
          </p>
          
          <p className="text-sm text-gray-500">
            Redirecting...
          </p>
        </div>
      </Modal>
    </form>
  )
}