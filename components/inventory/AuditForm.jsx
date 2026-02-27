'use client'

import { useState, useEffect } from 'react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { INVENTORY_CATEGORIES } from '../../lib/constants'
import inventoryApi from '../../lib/inventoryApi'
import toast from '../../lib/toast'
import { printAuditWorksheet } from '../../lib/auditReport'

export default function AuditForm({
  audit = null,
  onSubmit,
  onCancel,
  isPrintMode = false
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
  const [availableLocations, setAvailableLocations] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPrinting, setIsPrinting] = useState(false)

  // Fetch unique locations from real inventory items
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setIsLoading(true)
        const items = await inventoryApi.getAll()
        const locations = [...new Set(items.map(item => item.location).filter(Boolean))].sort()
        setAvailableLocations(locations)
      } catch (error) {
        console.error('Error fetching locations:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLocations()
  }, [])

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

  const handlePrintWorksheet = async (blank = false) => {
    if (!blank && !validateForm()) return

    try {
      setIsPrinting(true)
      let filtered = []

      if (!blank) {
        const allItems = await inventoryApi.getAll()

        // Filter items based on scope
        filtered = allItems.filter(item =>
          formData.categories.includes(item.category) &&
          formData.locations.includes(item.location)
        )

        // Filter expired if needed
        if (!formData.includeExpiredItems) {
          const now = new Date()
          filtered = filtered.filter(item => !item.expirationDate || new Date(item.expirationDate) >= now)
        }

        // Handle sampling
        if (formData.samplingPercentage < 100) {
          const count = Math.max(1, Math.floor(filtered.length * (formData.samplingPercentage / 100)))
          filtered = filtered.sort(() => 0.5 - Math.random()).slice(0, count)
        }

        if (filtered.length === 0) {
          toast.warning('No items found matching the selected categories and locations.')
          return
        }
      }

      printAuditWorksheet(formData, filtered)
    } catch (error) {
      console.error('Error preparing worksheet:', error)
      toast.error('Failed to generate printer worksheet.')
    } finally {
      setIsPrinting(false)
    }
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

  const handleBulkSelect = (field, type) => {
    if (field === 'categories') {
      if (type === 'all') {
        setFormData(prev => ({ ...prev, categories: Object.keys(INVENTORY_CATEGORIES) }))
      } else {
        setFormData(prev => ({ ...prev, categories: [] }))
      }
    } else if (field === 'locations') {
      if (type === 'all') {
        setFormData(prev => ({ ...prev, locations: [...availableLocations] }))
      } else {
        setFormData(prev => ({ ...prev, locations: [] }))
      }
    }
  }

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-full">
      {/* Basic Information */}
      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-4">
        <h4 className="font-heading font-semibold text-gray-900 border-b border-gray-200 pb-2">
          {isPrintMode ? 'Worksheet Configuration' : 'Audit Details'}
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
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
              className={`h-12 ${errors.auditType ? 'border-red-500' : ''}`}
            />
            {errors.auditType && (
              <p className="text-red-500 text-xs mt-1 font-medium">{errors.auditType}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Audit Date *
            </label>
            <Input
              type="date"
              value={formData.auditDate}
              onChange={(value) => updateField('auditDate', value)}
              className={`h-12 ${errors.auditDate ? 'border-red-500' : ''}`}
            />
            {errors.auditDate && (
              <p className="text-red-500 text-xs mt-1 font-medium">{errors.auditDate}</p>
            )}
          </div>
        </div>
      </div>

      {/* Audit Scope */}
      <div className="space-y-6">
        {/* Categories */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <label className="block text-sm font-bold text-gray-900 uppercase tracking-wider">
              Item Categories *
            </label>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => handleBulkSelect('categories', 'all')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={() => handleBulkSelect('categories', 'clear')}
                className="text-xs font-semibold text-gray-500 hover:text-gray-700"
              >
                Clear
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.keys(INVENTORY_CATEGORIES).map(category => {
              const isSelected = formData.categories.includes(category)
              return (
                <label
                  key={category}
                  className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${isSelected
                    ? 'border-black bg-black text-white shadow-md'
                    : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
                    }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleCategoryToggle(category)}
                    className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black mr-3"
                  />
                  <span className="text-sm font-semibold truncate leading-none">
                    {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
                  </span>
                </label>
              )
            })}
          </div>
          {errors.categories && (
            <p className="text-red-500 text-xs mt-1 font-medium">{errors.categories}</p>
          )}
        </div>

        {/* Locations */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <label className="block text-sm font-bold text-gray-900 uppercase tracking-wider">
              Locations *
            </label>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => handleBulkSelect('locations', 'all')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={() => handleBulkSelect('locations', 'clear')}
                className="text-xs font-semibold text-gray-500 hover:text-gray-700"
              >
                Clear
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {availableLocations.map(location => {
              const isSelected = formData.locations.includes(location)
              return (
                <label
                  key={location}
                  className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${isSelected
                    ? 'border-black bg-black text-white shadow-md'
                    : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
                    }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleLocationToggle(location)}
                    className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black mr-3"
                  />
                  <span className="text-sm font-semibold truncate leading-none">{location}</span>
                </label>
              )
            })}
          </div>
          {errors.locations && (
            <p className="text-red-500 text-xs mt-1 font-medium">{errors.locations}</p>
          )}
        </div>

        {/* Options */}
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h5 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Inventory Filter</h5>
            <label className="flex items-center p-3 rounded-lg hover:bg-white transition-colors cursor-pointer group">
              <input
                type="checkbox"
                checked={formData.includeAssets}
                onChange={(e) => updateField('includeAssets', e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black mr-3"
              />
              <span className="text-sm font-semibold text-gray-700 group-hover:text-black">Include Assets</span>
            </label>

            <label className="flex items-center p-3 rounded-lg hover:bg-white transition-colors cursor-pointer group">
              <input
                type="checkbox"
                checked={formData.includeExpiredItems}
                onChange={(e) => updateField('includeExpiredItems', e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black mr-3"
              />
              <span className="text-sm font-semibold text-gray-700 group-hover:text-black">Include Expired Items</span>
            </label>
          </div>

          {!isPrintMode && (
            <div>
              <h5 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Quality Control</h5>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Sampling Percentage
              </label>
              <Input
                type="number"
                value={formData.samplingPercentage}
                onChange={(value) => updateField('samplingPercentage', value)}
                placeholder="100"
                min="1"
                max="100"
                className={`h-12 text-lg font-bold ${errors.samplingPercentage ? 'border-red-500' : ''}`}
              />
              <p className="text-[10px] text-gray-500 mt-2 font-medium">
                * Select a percentage if conducting a partial stock count (e.g., 20% spot check).
              </p>
              {errors.samplingPercentage && (
                <p className="text-red-500 text-xs mt-1 font-medium">{errors.samplingPercentage}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <label className="block text-sm font-bold text-gray-900 uppercase tracking-wider px-1">
          Special Instructions / Notes
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => updateField('notes', e.target.value)}
          placeholder="e.g., 'Targeting specific high-value items' or 'Double-check batch numbers'..."
          rows={3}
          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-black transition-all resize-none text-sm"
        />
      </div>

      {/* Form Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 pt-8 border-t-2 border-gray-100">
        <div className="flex flex-col sm:flex-row gap-3">
          {isPrintMode ? (
            <Button
              type="button"
              onClick={() => handlePrintWorksheet(false)}
              disabled={isPrinting || isLoading}
              className="h-14 sm:h-auto py-4 px-8 bg-black text-white hover:bg-gray-800 rounded-xl shadow-lg active:scale-[0.98] transition-all font-bold text-base"
            >
              {isPrinting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </span>
              ) : '🖨️ Print Worksheet'}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => handlePrintWorksheet(false)}
              disabled={isPrinting || isLoading}
              className="h-14 sm:h-auto py-4 px-8 bg-white text-black border-2 border-black hover:bg-gray-50 rounded-xl font-bold text-base"
            >
              Print Worksheet
            </Button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            className="h-14 sm:h-auto py-4 px-8 rounded-xl font-bold"
          >
            Cancel
          </Button>
          {!isPrintMode && (
            <Button
              type="submit"
              className="h-14 sm:h-auto py-4 px-10 rounded-xl font-bold text-base transition-all bg-black text-white hover:bg-gray-800 shadow-lg active:scale-[0.98]"
            >
              {audit ? 'Update Audit' : 'Start Digital Audit'}
            </Button>
          )}
        </div>
      </div>
    </form>
  )
}