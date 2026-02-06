'use client'

import { useState } from 'react'
import { CURRENCY } from '../../lib/constants.js'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { INVENTORY_CATEGORIES } from '../../lib/constants'

export default function SupplierForm({ 
  supplier = null, 
  onSubmit, 
  onCancel 
}) {
  const [formData, setFormData] = useState({
    name: supplier?.name || '',
    contactPerson: supplier?.contactPerson || '',
    email: supplier?.email || '',
    phone: supplier?.phone || '',
    address: supplier?.address || '',
    leadTimeDays: supplier?.leadTimeDays || 1,
    paymentTerms: supplier?.paymentTerms || 'COD',
    rating: supplier?.rating || 0,
    categories: supplier?.categories || []
  })
  
  const [errors, setErrors] = useState({})
  
  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Supplier name is required'
    }
    
    if (!formData.contactPerson.trim()) {
      newErrors.contactPerson = 'Contact person is required'
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    }
    
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required'
    }

    if (formData.leadTimeDays < 1) {
      newErrors.leadTimeDays = 'Lead time must be at least 1 day'
    }

    if (formData.rating < 0 || formData.rating > 5) {
      newErrors.rating = 'Rating must be between 0 and 5'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    const supplierData = {
      name: formData.name.trim(),
      contactPerson: formData.contactPerson.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      address: formData.address.trim(),
      leadTimeDays: parseInt(formData.leadTimeDays) || 1,
      paymentTerms: formData.paymentTerms,
      rating: parseFloat(formData.rating) || 0,
      categories: formData.categories,
      totalOrders: supplier?.totalOrders || 0,
      isActive: supplier?.isActive || false,
      isApproved: supplier?.isApproved || false
    }
    
    onSubmit(supplierData)
  }
  
  const handleCategoryToggle = (category) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(cat => cat !== category)
        : [...prev.categories, category]
    }))
  }
  
  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h4 className="font-heading font-medium text-lg">Basic Information</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Supplier Name *
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(value) => updateField('name', value)}
              placeholder="Enter supplier name"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Person *
            </label>
            <Input
              type="text"
              value={formData.contactPerson}
              onChange={(value) => updateField('contactPerson', value)}
              placeholder="Enter contact person name"
              className={errors.contactPerson ? 'border-red-500' : ''}
            />
            {errors.contactPerson && (
              <p className="text-red-500 text-sm mt-1">{errors.contactPerson}</p>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(value) => updateField('email', value)}
              placeholder="Enter email address"
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone *
            </label>
            <Input
              type="text"
              value={formData.phone}
              onChange={(value) => updateField('phone', value)}
              placeholder="Enter phone number"
              className={errors.phone ? 'border-red-500' : ''}
            />
            {errors.phone && (
              <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
            )}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address *
          </label>
          <textarea
            value={formData.address}
            onChange={(e) => updateField('address', e.target.value)}
            placeholder="Enter full address"
            rows={3}
            className={`w-full border rounded-sm px-3 py-2 focus:outline-none focus:border-black ${
              errors.address ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.address && (
            <p className="text-red-500 text-sm mt-1">{errors.address}</p>
          )}
        </div>
      </div>
      
      {/* Categories */}
      <div className="space-y-4">
        <h4 className="font-heading font-medium text-lg">Product Categories *</h4>
        <p className="text-sm text-gray-500">
          Select the categories of products this supplier can provide
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {INVENTORY_CATEGORIES.map(category => (
            <label key={category} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.categories.includes(category)}
                onChange={() => handleCategoryToggle(category)}
                className="rounded border-gray-300 text-black focus:ring-black"
              />
              <span className="text-sm">
                {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
              </span>
            </label>
          ))}
        </div>
        
        {errors.categories && (
          <p className="text-red-500 text-sm">{errors.categories}</p>
        )}
      </div>
      
      {/* Supplier Details */}
      <div className="space-y-4">
        <h4 className="font-heading font-medium text-lg">Supplier Details</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lead Time (Days) *
            </label>
            <Input
              type="number"
              value={formData.leadTimeDays}
              onChange={(value) => updateField('leadTimeDays', parseInt(value) || 1)}
              placeholder="e.g., 3"
              min="1"
              className={errors.leadTimeDays ? 'border-red-500' : ''}
            />
            {errors.leadTimeDays && (
              <p className="text-red-500 text-sm mt-1">{errors.leadTimeDays}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Terms
            </label>
            <select
              value={formData.paymentTerms}
              onChange={(e) => updateField('paymentTerms', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="COD">Cash on Delivery</option>
              <option value="Net 15">Net 15</option>
              <option value="Net 30">Net 30</option>
              <option value="Net 45">Net 45</option>
              <option value="Net 60">Net 60</option>
              <option value="Prepaid">Prepaid</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Initial Rating (0-5)
          </label>
          <Input
            type="number"
            value={formData.rating}
            onChange={(value) => updateField('rating', Math.max(0, Math.min(5, parseFloat(value) || 0)))}
            placeholder="0.0"
            min="0"
            max="5"
            step="0.1"
            className={errors.rating ? 'border-red-500' : ''}
          />
          {errors.rating && (
            <p className="text-red-500 text-sm mt-1">{errors.rating}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">Rating will be updated based on performance over time</p>
        </div>
      </div>
      
      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
        >
          {supplier ? 'Update Supplier' : 'Add Supplier'}
        </Button>
      </div>
    </form>
  )
}