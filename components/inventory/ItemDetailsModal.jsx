'use client'

import { useState, useEffect } from 'react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Badge from '../ui/Badge'
import StockIndicator from './StockIndicator'
import Modal from '../ui/Modal'
import ImageUpload from './ImageUpload'
import inventoryApi from '../../lib/inventoryApi'
import supplierApi from '../../lib/supplierApi'
import { INVENTORY_CATEGORIES } from '../../lib/constants'
import { useAuth } from '../../hooks/useAuth'
import toast from '../../lib/toast'

export default function ItemDetailsModal({
  isOpen,
  onClose,
  item,
  onUpdateStock,
  onUpdateItem,
  isLoading = false
}) {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [showStockAdjustment, setShowStockAdjustment] = useState(false)
  const [stockAdjustment, setStockAdjustment] = useState({
    quantity: 0,
    reason: '',
    notes: ''
  })
  const [editForm, setEditForm] = useState({})
  const [suppliers, setSuppliers] = useState([])
  const [loadingSuppliers, setLoadingSuppliers] = useState(false)
  const [transactions, setTransactions] = useState([])
  const [loadingTransactions, setLoadingTransactions] = useState(false)

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

  // Load transaction history for this item
  useEffect(() => {
    const loadTransactions = async () => {
      if (item && item.id) {
        try {
          setLoadingTransactions(true)
          const itemTransactions = await inventoryApi.getTransactions(item.id)
          setTransactions(itemTransactions)
        } catch (error) {
          console.error('Error loading transactions:', error)
          setTransactions([])
        } finally {
          setLoadingTransactions(false)
        }
      }
    }

    loadTransactions()
  }, [item])
  useEffect(() => {
    if (item) {
      setEditForm({
        name: item.name || '',
        description: item.description || '',
        category: item.category || '',
        unit: item.unit || '',
        restockThreshold: item.restockThreshold || 0,
        maxStock: item.maxStock || '',
        location: item.location || '',
        supplier: item.supplier || '',
        cost: item.cost || 0,
        notes: item.notes || '',
        imageUrl: item.imageUrl || ''
      })
    }
  }, [item])

  const handleStockAdjustment = async () => {
    if (!stockAdjustment.quantity || !stockAdjustment.reason) {
      toast.warning('Please enter quantity and reason for stock adjustment')
      return
    }

    try {
      await onUpdateStock(item.id, stockAdjustment.quantity, {
        reason: stockAdjustment.reason,
        notes: stockAdjustment.notes,
        type: 'adjustment',
        performedBy: user?.id || 'inventory-controller',
        performedByName: user?.name || user?.email || 'Inventory Controller',
        performedByRole: user?.role || 'inventory-controller',
        timestamp: new Date().toISOString()
      })

      toast.success(`Stock adjusted by ${stockAdjustment.quantity > 0 ? '+' : ''}${stockAdjustment.quantity} ${item.unit}`)
      setShowStockAdjustment(false)
      setStockAdjustment({ quantity: 0, reason: '', notes: '' })
      
      // Reload transactions to show the new adjustment
      if (item && item.id) {
        try {
          const itemTransactions = await inventoryApi.getTransactions(item.id)
          setTransactions(itemTransactions)
        } catch (error) {
          console.error('Error reloading transactions:', error)
        }
      }
    } catch (error) {
      console.error('Error adjusting stock:', error)
      toast.error('Failed to adjust stock. Please try again.')
    }
  }

  const handleEditItem = async () => {
    try {
      const updatedData = {
        ...editForm,
        restockThreshold: parseFloat(editForm.restockThreshold) || 0,
        maxStock: editForm.maxStock ? parseFloat(editForm.maxStock) : null,
        cost: parseFloat(editForm.cost) || 0
      }

      await onUpdateItem(item.id, updatedData)
      toast.success('Item updated successfully!')
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating item:', error)
      toast.error('Failed to update item. Please try again.')
    }
  }

  const handleEditFormChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleImageUpload = (imageData) => {
    setEditForm(prev => ({
      ...prev,
      imageUrl: imageData.url
    }))
  }

  if (!item) return null

  const getStockStatus = (item) => {
    const stock = item.currentStock || 0
    if (stock === 0) return { status: 'critical', label: 'Out of Stock' }
    if (stock <= item.restockThreshold) return { status: 'low', label: 'Low Stock' }
    if (item.maxStock && stock > item.maxStock) return { status: 'excess', label: 'Overstocked' }
    return { status: 'normal', label: 'In Stock' }
  }

  const stockStatus = getStockStatus(item)
  const categoryOptions = Object.entries(INVENTORY_CATEGORIES).map(([value, label]) => ({
    label,
    value
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${item.name} - Details`}
      size="2xl"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {item.type !== 'assigned-asset' && (
              <Badge variant={stockStatus.status}>
                {stockStatus.label}
              </Badge>
            )}
            {item.type === 'assigned-asset' && (
              <Badge variant="normal">
                Assigned to {item.location}
              </Badge>
            )}
            <span className="text-sm text-gray-500">
              ID: {item.id}
            </span>
          </div>
        </div>

        {/* Stock Adjustment Modal */}
        {showStockAdjustment && (
          <Modal
            isOpen={showStockAdjustment}
            onClose={() => {
              setShowStockAdjustment(false)
              setStockAdjustment({ quantity: 0, reason: '', notes: '' })
            }}
            title="Adjust Stock"
            size="md"
          >
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Current Stock</p>
                    <p className="text-2xl font-bold text-gray-900">{item.currentStock || 0} {item.unit}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-700">After Adjustment</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {(item.currentStock || 0) + (stockAdjustment.quantity || 0)} {item.unit}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity Change *
                </label>
                <input
                  type="number"
                  value={stockAdjustment.quantity || ''}
                  onChange={(e) => setStockAdjustment(prev => ({
                    ...prev,
                    quantity: e.target.value === '' ? 0 : parseFloat(e.target.value)
                  }))}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                  placeholder="e.g., 10 or -5"
                  step="1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use positive numbers to add stock, negative to remove
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason *
                </label>
                <select
                  value={stockAdjustment.reason}
                  onChange={(e) => setStockAdjustment(prev => ({
                    ...prev,
                    reason: e.target.value
                  }))}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                >
                  <option value="">Select reason</option>
                  <option value="physical-count">Physical Count</option>
                  <option value="damaged">Damaged/Lost</option>
                  <option value="expired">Expired</option>
                  <option value="correction">Correction</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={stockAdjustment.notes}
                  onChange={(e) => setStockAdjustment(prev => ({
                    ...prev,
                    notes: e.target.value
                  }))}
                  rows={3}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                  placeholder="Optional notes about this adjustment"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowStockAdjustment(false)
                    setStockAdjustment({ quantity: 0, reason: '', notes: '' })
                  }}
                  disabled={isLoading}
                  className="hover:bg-gray-100"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleStockAdjustment}
                  disabled={isLoading || !stockAdjustment.quantity || !stockAdjustment.reason}
                  className="bg-black text-white hover:bg-gray-800"
                >
                  {isLoading ? 'Adjusting...' : 'Confirm Adjustment'}
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* Product Image Upload/Display */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Product Image</h3>
          {isEditing ? (
            <ImageUpload
              onImageUpload={handleImageUpload}
              imageUrl={editForm.imageUrl}
              imageAlt={item.name}
            />
          ) : (
            item.imageUrl ? (
              <div className="flex justify-center">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="max-h-48 rounded-lg object-contain"
                />
              </div>
            ) : (
              <div className="flex justify-center items-center h-32 text-gray-400 text-sm">
                No image available
              </div>
            )
          )}
        </div>

        {/* Item Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>

            <div className="grid grid-cols-1 gap-4">
              <Input
                label="Item Name"
                value={isEditing ? editForm.name : item.name}
                onChange={(value) => handleEditFormChange('name', value)}
                disabled={!isEditing}
              />

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
                    {item.description || 'No description'}
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
                      {categoryOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-md">
                      {item.category?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A'}
                    </p>
                  )}
                </div>

                <Input
                  label="Unit"
                  value={isEditing ? editForm.unit : item.unit}
                  onChange={(value) => handleEditFormChange('unit', value)}
                  disabled={!isEditing}
                />
              </div>
            </div>
          </div>

          {/* Right Column - Stock & Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">
              {item.type === 'assigned-asset' ? 'Assignment Information' : 'Stock Information'}
            </h3>

            <div className="grid grid-cols-1 gap-4">
              {item.type !== 'assigned-asset' ? (
                <>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Current Stock</span>
                      <StockIndicator
                        currentStock={item.currentStock || 0}
                        restockThreshold={item.restockThreshold}
                        maxStock={item.maxStock}
                        showLabel={false}
                      />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {item.currentStock || 0} {item.unit}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Restock Threshold"
                      type="number"
                      value={isEditing ? editForm.restockThreshold : item.restockThreshold}
                      onChange={(value) => handleEditFormChange('restockThreshold', parseFloat(value) || 0)}
                      disabled={!isEditing}
                    />

                    <Input
                      label="Maximum Stock"
                      type="number"
                      value={isEditing ? editForm.maxStock : item.maxStock || ''}
                      onChange={(value) => handleEditFormChange('maxStock', value)}
                      disabled={!isEditing}
                      placeholder="No limit"
                    />
                  </div>
                </>
              ) : (
                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-indigo-700">Assignment Status</span>
                    <Badge variant="success">Active</Badge>
                  </div>
                  <p className="text-lg font-bold text-indigo-900">
                    Currently in {item.location}
                  </p>
                </div>
              )}

              <Input
                label="Location"
                value={isEditing ? editForm.location : item.location}
                onChange={(value) => handleEditFormChange('location', value)}
                disabled={!isEditing}
              />
            </div>
          </div>
        </div>

        {/* Additional Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Additional Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isEditing ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supplier
                </label>
                <select
                  value={editForm.supplier}
                  onChange={(e) => handleEditFormChange('supplier', e.target.value)}
                  disabled={loadingSuppliers}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20 disabled:bg-gray-100"
                >
                  <option value="">{loadingSuppliers ? 'Loading suppliers...' : 'Select Supplier'}</option>
                  {suppliers.map(supplier => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <Input
                label="Supplier"
                value={item.supplier ? suppliers.find(s => s.id === item.supplier)?.name || item.supplier : '-'}
                disabled
              />
            )}

            <Input
              label="Cost per Unit (₱)"
              type="number"
              step="0.01"
              value={isEditing ? editForm.cost : item.cost}
              onChange={(value) => handleEditFormChange('cost', parseFloat(value) || 0)}
              disabled={!isEditing}
            />
          </div>

          <Input
            label="Notes"
            value={isEditing ? editForm.notes : item.notes}
            onChange={(value) => handleEditFormChange('notes', value)}
            disabled={!isEditing}
          />
        </div>

        {/* Stock Movement History */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Stock Movement History
          </h3>

          {loadingTransactions ? (
            <div className="text-center py-8 text-gray-500">
              Loading stock movement history...
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
              No stock movement history available for this item
            </div>
          ) : (
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Date</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Type</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-700">Change</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-700">Previous</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-700">New Stock</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">By</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactions.map((txn) => {
                    const isBundleConsumption = txn.type === 'bundle-consumption'
                    const isAdjustment = txn.type === 'adjustment'
                    const isStockOut = txn.type === 'stock-out'
                    const change = isAdjustment ? txn.newStock - txn.previousStock : txn.quantity

                    return (
                      <tr key={txn.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-600">
                          {new Date(txn.createdAt).toLocaleDateString()}
                          <div className="text-xs text-gray-400">
                            {new Date(txn.createdAt).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {isBundleConsumption ? (
                            <div className="flex flex-col">
                              <span className="font-semibold text-purple-700">Bundle Consumption</span>
                              {txn.bundleName && (
                                <span className="text-xs text-gray-500">{txn.bundleName}</span>
                              )}
                            </div>
                          ) : isAdjustment ? (
                            <div className="flex flex-col">
                              <span className="font-semibold text-orange-700">Adjustment</span>
                            </div>
                          ) : (
                            <span className="font-semibold capitalize">
                              {txn.type.replace('-', ' ')}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`font-bold ${
                            change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {change > 0 ? '+' : ''}{change}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-600">
                          {txn.previousStock}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-semibold text-gray-900">{txn.newStock}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900">{txn.performedByName}</span>
                            {isBundleConsumption && txn.roomNumber && (
                              <span className="text-xs text-gray-500">Room {txn.roomNumber}</span>
                            )}
                            {txn.performedByRole && (
                              <span className="text-xs text-gray-500 capitalize">{txn.performedByRole}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-start space-x-1">
                            {isBundleConsumption ? (
                              <svg className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                            ) : isAdjustment ? (
                              <svg className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                              </svg>
                            ) : null}
                            <span className="text-sm text-gray-600">{txn.reason || '-'}</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Timestamps */}
        <div className="border-t pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
            <div>
              <span className="font-medium">Created:</span> {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'N/A'}
            </div>
            <div>
              <span className="font-medium">Last Updated:</span> {item.updatedAt ? new Date(item.updatedAt).toLocaleString() : 'N/A'}
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

        {/* Action Buttons - Bottom */}
        {user?.role === 'inventory-controller' && !isEditing && (
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              disabled={isLoading}
              className="bg-black text-white hover:bg-gray-800"
            >
              Edit Details
            </Button>
            {item.type !== 'assigned-asset' && (
              <Button
                size="sm"
                onClick={() => setShowStockAdjustment(!showStockAdjustment)}
                disabled={isLoading}
                className="bg-black text-white hover:bg-gray-800"
              >
                Adjust Stock
              </Button>
            )}
          </div>
        )}
      </div>
    </Modal >
  )
}