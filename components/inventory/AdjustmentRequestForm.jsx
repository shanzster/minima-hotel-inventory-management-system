'use client'

import { useState } from 'react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { mockInventoryItems } from '../../lib/mockData'

export default function AdjustmentRequestForm({ 
  adjustment = null, 
  onSubmit, 
  onCancel 
}) {
  const [formData, setFormData] = useState({
    itemId: adjustment?.itemId || '',
    requestType: adjustment?.requestType || 'stock-adjustment',
    currentStock: adjustment?.currentStock || 0,
    proposedStock: adjustment?.proposedStock || 0,
    reason: adjustment?.reason || '',
    priority: adjustment?.priority || 'normal',
    auditId: adjustment?.auditId || ''
  })
  
  const [errors, setErrors] = useState({})
  const [selectedItem, setSelectedItem] = useState(null)
  
  // Get inventory items for selection
  const inventoryItems = mockInventoryItems.map(item => ({
    label: `${item.name} (Current: ${item.currentStock} ${item.unit})`,
    value: item.id,
    item: item
  }))
  
  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.itemId) {
      newErrors.itemId = 'Item selection is required'
    }
    
    if (!formData.requestType) {
      newErrors.requestType = 'Request type is required'
    }
    
    if (formData.requestType === 'stock-adjustment' || formData.requestType === 'write-off') {
      if (formData.proposedStock < 0) {
        newErrors.proposedStock = 'Proposed stock cannot be negative'
      }
    }
    
    if (!formData.reason.trim()) {
      newErrors.reason = 'Reason is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    const variance = formData.proposedStock - formData.currentStock
    
    const adjustmentData = {
      itemId: formData.itemId,
      itemName: selectedItem?.name || '',
      requestType: formData.requestType,
      currentStock: parseInt(formData.currentStock),
      proposedStock: parseInt(formData.proposedStock),
      variance: variance,
      reason: formData.reason.trim(),
      priority: formData.priority,
      auditId: formData.auditId || null
    }
    
    onSubmit(adjustmentData)
  }
  
  const handleItemChange = (itemId) => {
    const item = mockInventoryItems.find(i => i.id === itemId)
    if (item) {
      setSelectedItem(item)
      setFormData(prev => ({
        ...prev,
        itemId: itemId,
        currentStock: item.currentStock,
        proposedStock: item.currentStock
      }))
    }
  }
  
  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }
  
  const getVariance = () => {
    return formData.proposedStock - formData.currentStock
  }
  
  const getVarianceColor = () => {
    const variance = getVariance()
    if (variance > 0) return 'text-green-600'
    if (variance < 0) return 'text-red-600'
    return 'text-gray-600'
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Item Selection */}
      <div className="space-y-4">
        <h4 className="font-heading font-medium text-lg">Adjustment Details</h4>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Item *
          </label>
          <Input
            type="select"
            value={formData.itemId}
            onChange={handleItemChange}
            options={[
              { label: 'Select an item...', value: '' },
              ...inventoryItems
            ]}
            className={errors.itemId ? 'border-red-500' : ''}
          />
          {errors.itemId && (
            <p className="text-red-500 text-sm mt-1">{errors.itemId}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Request Type *
          </label>
          <Input
            type="select"
            value={formData.requestType}
            onChange={(value) => updateField('requestType', value)}
            options={[
              { label: 'Stock Adjustment', value: 'stock-adjustment' },
              { label: 'Write Off', value: 'write-off' },
              { label: 'Condition Update', value: 'condition-update' }
            ]}
            className={errors.requestType ? 'border-red-500' : ''}
          />
          {errors.requestType && (
            <p className="text-red-500 text-sm mt-1">{errors.requestType}</p>
          )}
        </div>
      </div>
      
      {/* Stock Adjustment */}
      {selectedItem && (formData.requestType === 'stock-adjustment' || formData.requestType === 'write-off') && (
        <div className="space-y-4">
          <h4 className="font-heading font-medium text-lg">Stock Changes</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Stock
              </label>
              <Input
                type="number"
                value={formData.currentStock}
                onChange={(value) => updateField('currentStock', value)}
                disabled
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500 mt-1">
                {selectedItem.unit}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Proposed Stock *
              </label>
              <Input
                type="number"
                value={formData.proposedStock}
                onChange={(value) => updateField('proposedStock', value)}
                min="0"
                className={errors.proposedStock ? 'border-red-500' : ''}
              />
              <p className="text-xs text-gray-500 mt-1">
                {selectedItem.unit}
              </p>
              {errors.proposedStock && (
                <p className="text-red-500 text-sm mt-1">{errors.proposedStock}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Variance
              </label>
              <div className={`text-2xl font-medium ${getVarianceColor()}`}>
                {getVariance() > 0 ? '+' : ''}{getVariance()}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {selectedItem.unit}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Additional Details */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reason *
          </label>
          <textarea
            value={formData.reason}
            onChange={(e) => updateField('reason', e.target.value)}
            placeholder="Explain the reason for this adjustment request..."
            rows={3}
            className={`w-full border rounded-sm px-3 py-2 focus:outline-none focus:border-black ${
              errors.reason ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.reason && (
            <p className="text-red-500 text-sm mt-1">{errors.reason}</p>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <Input
              type="select"
              value={formData.priority}
              onChange={(value) => updateField('priority', value)}
              options={[
                { label: 'Low', value: 'low' },
                { label: 'Normal', value: 'normal' },
                { label: 'Medium', value: 'medium' },
                { label: 'High', value: 'high' }
              ]}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Related Audit ID (Optional)
            </label>
            <Input
              type="text"
              value={formData.auditId}
              onChange={(value) => updateField('auditId', value)}
              placeholder="e.g., audit-001"
            />
            <p className="text-xs text-gray-500 mt-1">
              Link this request to a specific audit
            </p>
          </div>
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
          {adjustment ? 'Update Request' : 'Create Request'}
        </Button>
      </div>
    </form>
  )
}