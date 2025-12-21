import { useState } from 'react'
import Input from '../ui/Input'
import Button from '../ui/Button'

export default function RestockForm({ 
  item, 
  transactionType = 'stock-in', 
  onSubmit, 
  onCancel,
  suppliers = [],
  className = ''
}) {
  const [formData, setFormData] = useState({
    quantity: '',
    reason: '',
    supplier: '',
    batchNumber: '',
    expirationDate: '',
    destination: ''
  })
  
  const [errors, setErrors] = useState({})
  
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }
  
  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.quantity || formData.quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0'
    }
    
    if (transactionType === 'stock-in') {
      if (!formData.supplier) {
        newErrors.supplier = 'Supplier is required for stock-in transactions'
      }
    }
    
    if (transactionType === 'stock-out') {
      if (!formData.reason) {
        newErrors.reason = 'Reason is required for stock-out transactions'
      }
      if (!formData.destination) {
        newErrors.destination = 'Destination is required for stock-out transactions'
      }
    }
    
    if (transactionType === 'adjustment') {
      if (!formData.reason) {
        newErrors.reason = 'Reason is required for adjustments'
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    const transaction = {
      itemId: item?.id,
      itemName: item?.name,
      type: transactionType,
      quantity: parseFloat(formData.quantity),
      reason: formData.reason,
      supplier: formData.supplier,
      batchNumber: formData.batchNumber,
      expirationDate: formData.expirationDate,
      destination: formData.destination,
      timestamp: new Date().toISOString()
    }
    
    onSubmit(transaction)
  }
  
  const getFormTitle = () => {
    switch (transactionType) {
      case 'stock-in': return 'Stock In Transaction'
      case 'stock-out': return 'Stock Out Transaction'
      case 'adjustment': return 'Stock Adjustment'
      default: return 'Stock Transaction'
    }
  }
  
  const reasonOptions = {
    'stock-out': [
      { label: 'Guest Usage', value: 'guest-usage' },
      { label: 'Kitchen Usage', value: 'kitchen-usage' },
      { label: 'Housekeeping', value: 'housekeeping' },
      { label: 'Maintenance', value: 'maintenance' },
      { label: 'Damaged/Expired', value: 'damaged-expired' },
      { label: 'Transfer', value: 'transfer' },
      { label: 'Other', value: 'other' }
    ],
    'adjustment': [
      { label: 'Physical Count Correction', value: 'physical-count' },
      { label: 'Damaged Items', value: 'damaged' },
      { label: 'Expired Items', value: 'expired' },
      { label: 'Lost Items', value: 'lost' },
      { label: 'System Error Correction', value: 'system-error' },
      { label: 'Other', value: 'other' }
    ]
  }
  
  return (
    <form onSubmit={handleSubmit} className={`restock-form space-y-4 ${className}`}>
      <div className="form-header mb-6">
        <h3 className="text-lg font-heading font-medium text-black">
          {getFormTitle()}
        </h3>
        {item && (
          <p className="text-sm text-gray-500 mt-1">
            Item: {item.name} (Current Stock: {item.currentStock || 0})
          </p>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          type="number"
          label="Quantity"
          value={formData.quantity}
          onChange={(value) => handleInputChange('quantity', value)}
          placeholder="Enter quantity"
          required
          error={errors.quantity}
          min="0"
          step="1"
        />
        
        {transactionType === 'stock-in' && (
          <>
            <Input
              type="select"
              label="Supplier"
              value={formData.supplier}
              onChange={(value) => handleInputChange('supplier', value)}
              options={suppliers}
              placeholder="Select supplier"
              required
              error={errors.supplier}
            />
            
            <Input
              type="text"
              label="Batch Number"
              value={formData.batchNumber}
              onChange={(value) => handleInputChange('batchNumber', value)}
              placeholder="Enter batch number"
            />
            
            <Input
              type="date"
              label="Expiration Date"
              value={formData.expirationDate}
              onChange={(value) => handleInputChange('expirationDate', value)}
            />
          </>
        )}
        
        {(transactionType === 'stock-out' || transactionType === 'adjustment') && (
          <Input
            type="select"
            label="Reason"
            value={formData.reason}
            onChange={(value) => handleInputChange('reason', value)}
            options={reasonOptions[transactionType] || []}
            placeholder="Select reason"
            required
            error={errors.reason}
          />
        )}
        
        {transactionType === 'stock-out' && (
          <Input
            type="text"
            label="Destination"
            value={formData.destination}
            onChange={(value) => handleInputChange('destination', value)}
            placeholder="Enter destination"
            required
            error={errors.destination}
          />
        )}
      </div>
      
      <div className="form-actions flex justify-end space-x-3 pt-4 border-t border-gray-300">
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
          {transactionType === 'stock-in' ? 'Add Stock' : 
           transactionType === 'stock-out' ? 'Remove Stock' : 
           'Adjust Stock'}
        </Button>
      </div>
    </form>
  )
}