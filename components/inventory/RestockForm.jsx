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
    destination: ''
  })

  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (isSubmitting) return // Prevent double submission

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
      destination: formData.destination,
      timestamp: new Date().toISOString()
    }

    setIsSubmitting(true)
    try {
      await onSubmit(transaction)
    } catch (error) {
      console.error('Error submitting restock:', error)
    } finally {
      setIsSubmitting(false)
    }
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
      { label: 'Damaged', value: 'damaged' },
      { label: 'Transfer', value: 'transfer' },
      { label: 'Other', value: 'other' }
    ],
    'adjustment': [
      { label: 'Physical Count Correction', value: 'physical-count' },
      { label: 'Damaged Items', value: 'damaged' },
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
          <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-700">
              <span className="font-medium">Item:</span> {item.name}
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-medium">Current Stock:</span> {item.currentStock || 0} {item.unit}
            </p>
            {transactionType === 'adjustment' && (
              <p className="text-xs text-amber-600 mt-2 font-medium">
                ⚠️ Enter the NEW total quantity (not the change amount)
              </p>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-body text-black mb-1">
            {transactionType === 'adjustment' ? 'New Total Quantity' : 'Quantity'}
            <span className="text-red-500 ml-1">*</span>
          </label>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => {
                const current = parseFloat(formData.quantity) || 0
                if (current > 0) handleInputChange('quantity', (current - 1).toString())
              }}
              className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-gray-100 border border-gray-300 rounded-lg text-2xl font-bold text-gray-700 hover:bg-gray-200 active:bg-gray-300 transition-colors"
            >
              −
            </button>
            <div className="flex-1">
              <Input
                type="number"
                value={formData.quantity}
                onChange={(value) => handleInputChange('quantity', value)}
                placeholder={transactionType === 'adjustment' ? 'Enter new total quantity' : 'Enter quantity'}
                required
                error={errors.quantity}
                min="0"
                step="1"
                className="text-center text-lg font-bold h-12"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                const current = parseFloat(formData.quantity) || 0
                handleInputChange('quantity', (current + 1).toString())
              }}
              className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-gray-100 border border-gray-300 rounded-lg text-2xl font-bold text-gray-700 hover:bg-gray-200 active:bg-gray-300 transition-colors"
            >
              +
            </button>
          </div>
        </div>

        {transactionType === 'stock-in' && (
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
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          disabled={isSubmitting}
        >
          {transactionType === 'stock-in' ? 'Add Stock' :
            transactionType === 'stock-out' ? 'Remove Stock' :
              'Adjust Stock'}
        </Button>
      </div>
    </form>
  )
}