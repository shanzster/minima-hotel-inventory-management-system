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
    categories: supplier?.categories || [],
    paymentTerms: supplier?.contractDetails?.paymentTerms || 'Net 30',
    deliveryTerms: supplier?.contractDetails?.deliveryTerms || 'FOB Destination',
    minimumOrderValue: supplier?.contractDetails?.minimumOrderValue || 0
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
    
    if (formData.categories.length === 0) {
      newErrors.categories = 'At least one category is required'
    }
    
    if (formData.minimumOrderValue < 0) {
      newErrors.minimumOrderValue = 'Minimum order value cannot be negative'
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
      categories: formData.categories,
      contractDetails: {
        startDate: new Date(),
        paymentTerms: formData.paymentTerms,
        deliveryTerms: formData.deliveryTerms,
        minimumOrderValue: parseFloat(formData.minimumOrderValue) || 0
      }
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
      
      {/* Contract Details */}
      <div className="space-y-4">
        <h4 className="font-heading font-medium text-lg">Contract Details</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Terms
            </label>
            <Input
              type="select"
              value={formData.paymentTerms}
              onChange={(value) => updateField('paymentTerms', value)}
              options={[
                { label: 'Net 15', value: 'Net 15' },
                { label: 'Net 30', value: 'Net 30' },
                { label: 'Net 45', value: 'Net 45' },
                { label: 'Net 60', value: 'Net 60' },
                { label: 'COD', value: 'COD' },
                { label: 'Prepaid', value: 'Prepaid' }
              ]}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Delivery Terms
            </label>
            <Input
              type="select"
              value={formData.deliveryTerms}
              onChange={(value) => updateField('deliveryTerms', value)}
              options={[
                { label: 'FOB Destination', value: 'FOB Destination' },
                { label: 'FOB Origin', value: 'FOB Origin' },
                { label: 'CIF', value: 'CIF' },
                { label: 'DDP', value: 'DDP' }
              ]}
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Minimum Order Value ({CURRENCY.SYMBOL})
          </label>
          <Input
            type="number"
            value={formData.minimumOrderValue}
            onChange={(value) => updateField('minimumOrderValue', value)}
            placeholder="0"
            min="0"
            step="0.01"
            className={errors.minimumOrderValue ? 'border-red-500' : ''}
          />
          {errors.minimumOrderValue && (
            <p className="text-red-500 text-sm mt-1">{errors.minimumOrderValue}</p>
          )}
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