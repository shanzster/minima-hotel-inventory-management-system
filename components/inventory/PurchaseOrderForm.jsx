'use client'

import { useState, useEffect } from 'react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Badge from '../ui/Badge'
import supplierApi from '../../lib/supplierApi'
import { formatCurrency } from '../../lib/utils'
import { CURRENCY } from '../../lib/constants'

export default function PurchaseOrderForm({ onSubmit, onCancel, availableItems = [] }) {
  const [formData, setFormData] = useState({
    supplier: null,
    items: [],
    priority: 'normal',
    expectedDelivery: '',
    notes: ''
  })
  const [availableSuppliers, setAvailableSuppliers] = useState([])
  const [selectedSupplier, setSelectedSupplier] = useState('')
  const [selectedItem, setSelectedItem] = useState('')
  const [itemQuantity, setItemQuantity] = useState('')
  const [itemUnitCost, setItemUnitCost] = useState('')
  const [errors, setErrors] = useState({})
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(true)

  // Load suppliers on component mount
  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        setIsLoadingSuppliers(true)
        const suppliers = await supplierApi.getActiveSuppliers()
        setAvailableSuppliers(suppliers)
      } catch (error) {
        console.error('Error loading suppliers:', error)
        setAvailableSuppliers([])
      } finally {
        setIsLoadingSuppliers(false)
      }
    }

    loadSuppliers()
  }, [])

  // Calculate total amount
  const totalAmount = formData.items.reduce((sum, item) => sum + item.totalCost, 0)
  
  // Handle supplier selection
  const handleSupplierChange = (supplierId) => {
    const supplier = availableSuppliers.find(s => s.id === supplierId)
    setSelectedSupplier(supplierId)
    setFormData(prev => ({
      ...prev,
      supplier: supplier
    }))
    setErrors(prev => ({ ...prev, supplier: '' }))
  }
  
  // Add item to purchase order
  const handleAddItem = () => {
    if (!selectedItem || !itemQuantity || !itemUnitCost) {
      setErrors(prev => ({
        ...prev,
        items: 'Please select an item and enter quantity and unit cost'
      }))
      return
    }
    
    const item = availableItems.find(i => i.id === selectedItem)
    const quantity = parseFloat(itemQuantity)
    const unitCost = parseFloat(itemUnitCost)
    const totalCost = quantity * unitCost
    
    // Check if item already exists in the order
    const existingItemIndex = formData.items.findIndex(i => i.inventoryItemId === selectedItem)
    
    if (existingItemIndex >= 0) {
      // Update existing item
      const updatedItems = [...formData.items]
      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        quantity: updatedItems[existingItemIndex].quantity + quantity,
        totalCost: updatedItems[existingItemIndex].totalCost + totalCost
      }
      setFormData(prev => ({ ...prev, items: updatedItems }))
    } else {
      // Add new item
      const newItem = {
        inventoryItemId: selectedItem,
        itemName: item.name,
        itemUnit: item.unit,
        quantity: quantity,
        unitCost: unitCost,
        totalCost: totalCost
      }
      setFormData(prev => ({
        ...prev,
        items: [...prev.items, newItem]
      }))
    }
    
    // Reset item form
    setSelectedItem('')
    setItemQuantity('')
    setItemUnitCost('')
    setErrors(prev => ({ ...prev, items: '' }))
  }
  
  // Remove item from purchase order
  const handleRemoveItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Validate form
    const newErrors = {}
    
    if (!formData.supplier) {
      newErrors.supplier = 'Please select a supplier'
    }
    
    if (formData.items.length === 0) {
      newErrors.items = 'Please add at least one item to the purchase order'
    }
    
    if (!formData.expectedDelivery) {
      newErrors.expectedDelivery = 'Please select an expected delivery date'
    } else {
      const deliveryDate = new Date(formData.expectedDelivery)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (deliveryDate < today) {
        newErrors.expectedDelivery = 'Expected delivery date cannot be in the past'
      }
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    // Submit the form
    onSubmit({
      ...formData,
      totalAmount,
      expectedDelivery: new Date(formData.expectedDelivery)
    })
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Supplier Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Supplier *
        </label>
        <select
          value={selectedSupplier}
          onChange={(e) => handleSupplierChange(e.target.value)}
          disabled={isLoadingSuppliers}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="">
            {isLoadingSuppliers ? 'Loading suppliers...' : 'Select a supplier...'}
          </option>
          {availableSuppliers.map(supplier => (
            <option key={supplier.id} value={supplier.id}>
              {supplier.name} - {supplier.contactPerson}
            </option>
          ))}
        </select>
        {errors.supplier && (
          <p className="mt-1 text-sm text-red-600">{errors.supplier}</p>
        )}
        {availableSuppliers.length === 0 && !isLoadingSuppliers && (
          <p className="mt-1 text-sm text-blue-600">
            No approved suppliers available. <a href="/suppliers" className="underline">Add suppliers</a>
          </p>
        )}
      </div>
      
      {/* Selected Supplier Details */}
      {formData.supplier && (
        <div className="bg-gray-50 p-4 rounded-md">
          <h4 className="font-medium text-gray-900 mb-2">Supplier Details</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Contact Person:</span>
              <span className="ml-2 font-medium">{formData.supplier.contactPerson}</span>
            </div>
            <div>
              <span className="text-gray-500">Email:</span>
              <span className="ml-2 font-medium">{formData.supplier.email}</span>
            </div>
            <div>
              <span className="text-gray-500">Phone:</span>
              <span className="ml-2 font-medium">{formData.supplier.phone}</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Add Items Section */}
      <div>
        <h4 className="font-medium text-gray-900 mb-4">Add Items</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Item
            </label>
            <select
              value={selectedItem}
              onChange={(e) => setSelectedItem(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="">Select item...</option>
              {availableItems.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.unit})
                </option>
              ))}
            </select>
            {/* Show selected item preview */}
            {selectedItem && (() => {
              const item = availableItems.find(i => i.id === selectedItem)
              return item ? (
                <div className="mt-2 flex items-center space-x-3 p-2 bg-gray-50 rounded-md">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-12 w-12 rounded object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded bg-gray-200 flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.category?.replace('-', ' ')}</p>
                  </div>
                </div>
              ) : null
            })()}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity
            </label>
            <Input
              type="number"
              value={itemQuantity}
              onChange={(value) => setItemQuantity(value)}
              placeholder="0"
              min="0"
              step="0.01"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unit Cost ({CURRENCY.SYMBOL})
            </label>
            <Input
              type="number"
              value={itemUnitCost}
              onChange={(value) => setItemUnitCost(value)}
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>
          
          <div className="flex items-end">
            <Button
              type="button"
              onClick={handleAddItem}
              variant="secondary"
              className="w-full"
            >
              Add Item
            </Button>
          </div>
        </div>
        
        {errors.items && (
          <p className="mb-4 text-sm text-red-600">{errors.items}</p>
        )}
      </div>
      
      {/* Items List */}
      {formData.items.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-4">Order Items</h4>
          <div className="border border-gray-200 rounded-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Item</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Quantity</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Unit Cost</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Total</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {formData.items.map((item, index) => {
                  const inventoryItem = availableItems.find(i => i.id === item.inventoryItemId)
                  return (
                    <tr key={index}>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center space-x-3">
                          {inventoryItem?.imageUrl ? (
                            <img
                              src={inventoryItem.imageUrl}
                              alt={item.itemName}
                              className="h-10 w-10 rounded object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded bg-gray-200 flex items-center justify-center flex-shrink-0">
                              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                          <div>
                            <div className="font-medium">{item.itemName}</div>
                            <div className="text-gray-500">per {item.itemUnit}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">{item.quantity} {item.itemUnit}</td>
                      <td className="px-4 py-3 text-sm">{formatCurrency(item.unitCost)}</td>
                      <td className="px-4 py-3 text-sm font-medium">{formatCurrency(item.totalCost)}</td>
                      <td className="px-4 py-3 text-sm">
                        <Button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-800"
                        >
                          Remove
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan="3" className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                    Total Amount:
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-gray-900">
                    {formatCurrency(totalAmount)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
      
      {/* Order Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Priority
          </label>
          <select
            value={formData.priority}
            onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
          >
            <option value="low">Low Priority</option>
            <option value="normal">Normal Priority</option>
            <option value="high">High Priority</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Expected Delivery Date *
          </label>
          <Input
            type="date"
            value={formData.expectedDelivery}
            onChange={(value) => setFormData(prev => ({ ...prev, expectedDelivery: value }))}
            min={new Date().toISOString().split('T')[0]}
          />
          {errors.expectedDelivery && (
            <p className="mt-1 text-sm text-red-600">{errors.expectedDelivery}</p>
          )}
        </div>
      </div>
      
      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notes (Optional)
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
          placeholder="Additional notes or special instructions..."
        />
      </div>
      
      {/* Form Actions */}
      <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
        <Button
          type="button"
          onClick={onCancel}
          variant="ghost"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-black text-white hover:bg-gray-800"
        >
          Create Purchase Order
        </Button>
      </div>
    </form>
  )
}