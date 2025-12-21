'use client'

import { useState } from 'react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { INVENTORY_CATEGORIES } from '../../lib/constants'
import { mockInventoryItems } from '../../lib/mockData'

export default function AuditForm({ 
  audit = null, 
  onSubmit, 
  onCancel 
}) {
  const [formData, setFormData] = useState({
    auditType: audit?.auditType || 'scheduled',
    auditDate: audit?.auditDate ? new Date(audit.auditDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    categories: audit?.scope?.categories || [],
    locations: audit?.scope?.locations || [],
    includeAssets: audit?.scope?.includeAssets || false,
    includeExpiredItems: audit?.scope?.includeExpiredItems || true,
    samplingPercentage: audit?.scope?.samplingPercentage || 100,
    notes: audit?.notes || ''
  })
  
  const [errors, setErrors] = useState({})
  
  // Get unique locations from inventory items
  const availableLocations = [...new Set(mockInventoryItems.map(item => item.location))].sort()
  
  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.auditType) {
      newErrors.auditType = 'Audit type is required'
    }
    
    if (!formData.auditDate) {
      newErrors.auditDate = 'Audit date is required'
    }
    
    if (formData.categories.length === 0) {
      newErrors.categories = 'At least one category must be selected'
    }
    
    if (formData.locations.length === 0) {
      newErrors.locations = 'At least one location must be selected'
    }
    
    if (formData.samplingPercentage < 1 || formData.samplingPercentage > 100) {
      newErrors.samplingPercentage = 'Sampling percentage must be between 1 and 100'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    const auditData = {
      auditType: formData.auditType,
      auditDate: new Date(formData.auditDate),
      scope: {
        categories: formData.categories,
        locations: formData.locations,
        includeAssets: formData.includeAssets,
        includeExpiredItems: formData.includeExpiredItems,
        samplingPercentage: parseInt(formData.samplingPercentage)
      },
      notes: formData.notes.trim()
    }
    
    onSubmit(auditData)
  }
  
  const handleCategoryToggle = (category) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(cat => cat !== category)
        : [...prev.categories, category]
    }))
  }
  
  const handleLocationToggle = (location) => {
    setFormData(prev => ({
      ...prev,
      locations: prev.locations.includes(location)
        ? prev.locations.filter(loc => loc !== location)
        : [...prev.locations, location]
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
        <h4 className="font-heading font-medium text-lg">Audit Details</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Audit Type *
            </label>
            <Input
              type="select"
              value={formData.auditType}
              onChange={(value) => updateField('auditType', value)}
              options={[
                { label: 'Scheduled Audit', value: 'scheduled' },
                { label: 'Spot Check', value: 'spot-check' },
                { label: 'Annual Audit', value: 'annual' },
                { label: 'Compliance Audit', value: 'compliance' }
              ]}
              className={errors.auditType ? 'border-red-500' : ''}
            />
            {errors.auditType && (
              <p className="text-red-500 text-sm mt-1">{errors.auditType}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Audit Date *
            </label>
            <Input
              type="date"
              value={formData.auditDate}
              onChange={(value) => updateField('auditDate', value)}
              className={errors.auditDate ? 'border-red-500' : ''}
            />
            {errors.auditDate && (
              <p className="text-red-500 text-sm mt-1">{errors.auditDate}</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Audit Scope */}
      <div className="space-y-4">
        <h4 className="font-heading font-medium text-lg">Audit Scope</h4>
        
        {/* Categories */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categories to Audit *
          </label>
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
            <p className="text-red-500 text-sm mt-1">{errors.categories}</p>
          )}
        </div>
        
        {/* Locations */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Locations to Audit *
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {availableLocations.map(location => (
              <label key={location} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.locations.includes(location)}
                  onChange={() => handleLocationToggle(location)}
                  className="rounded border-gray-300 text-black focus:ring-black"
                />
                <span className="text-sm">{location}</span>
              </label>
            ))}
          </div>
          {errors.locations && (
            <p className="text-red-500 text-sm mt-1">{errors.locations}</p>
          )}
        </div>
        
        {/* Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.includeAssets}
                onChange={(e) => updateField('includeAssets', e.target.checked)}
                className="rounded border-gray-300 text-black focus:ring-black"
              />
              <span className="text-sm font-medium">Include Assets</span>
            </label>
            
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.includeExpiredItems}
                onChange={(e) => updateField('includeExpiredItems', e.target.checked)}
                className="rounded border-gray-300 text-black focus:ring-black"
              />
              <span className="text-sm font-medium">Include Expired Items</span>
            </label>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sampling Percentage *
            </label>
            <Input
              type="number"
              value={formData.samplingPercentage}
              onChange={(value) => updateField('samplingPercentage', value)}
              placeholder="100"
              min="1"
              max="100"
              className={errors.samplingPercentage ? 'border-red-500' : ''}
            />
            <p className="text-xs text-gray-500 mt-1">
              Percentage of items to audit (1-100%)
            </p>
            {errors.samplingPercentage && (
              <p className="text-red-500 text-sm mt-1">{errors.samplingPercentage}</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => updateField('notes', e.target.value)}
          placeholder="Enter any additional notes or instructions for this audit..."
          rows={3}
          className="w-full border border-gray-300 rounded-sm px-3 py-2 focus:outline-none focus:border-black"
        />
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
          {audit ? 'Update Audit' : 'Start Audit'}
        </Button>
      </div>
    </form>
  )
}