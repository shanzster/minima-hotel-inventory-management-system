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
  const [batches, setBatches] = useState([])
  const [isFetchingBatches, setIsFetchingBatches] = useState(false)
  const [suppliers, setSuppliers] = useState([])
  const [loadingSuppliers, setLoadingSuppliers] = useState(false)

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

  // Initialize edit form when item changes
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
        expirationDate: item.expirationDate ? new Date(item.expirationDate).toISOString().split('T')[0] : '',
        batchNumber: item.batchNumber || '',
        notes: item.notes || '',
        imageUrl: item.imageUrl || ''
      })
    }
  }, [item])

  // Fetch batches when item changes
  useEffect(() => {
    const fetchBatches = async () => {
      if (item && item.id) {
        setIsFetchingBatches(true)
        try {
          const itemBatches = await inventoryApi.getBatches(item.id)
          // Sort by expiry date (soonest first)
          const sortedBatches = itemBatches.sort((a, b) => {
            if (!a.expirationDate) return 1
            if (!b.expirationDate) return -1
            return new Date(a.expirationDate) - new Date(b.expirationDate)
          })
          setBatches(sortedBatches)
        } catch (error) {
          console.error('Failed to fetch batches:', error)
        } finally {
          setIsFetchingBatches(false)
        }
      }
    }
    fetchBatches()
  }, [item, showStockAdjustment, isEditing])

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
        performedBy: 'inventory-controller',
        timestamp: new Date().toISOString()
      })

      toast.success(`Stock adjusted by ${stockAdjustment.quantity > 0 ? '+' : ''}${stockAdjustment.quantity} ${item.unit}`)
      setShowStockAdjustment(false)
      setStockAdjustment({ quantity: 0, reason: '', notes: '' })
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
        cost: parseFloat(editForm.cost) || 0,
        expirationDate: editForm.expirationDate ? new Date(editForm.expirationDate).toISOString() : null
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

            <Input
              label="Expiration Date"
              type="date"
              value={isEditing ? editForm.expirationDate : (item.expirationDate ? new Date(item.expirationDate).toISOString().split('T')[0] : '')}
              onChange={(value) => handleEditFormChange('expirationDate', value)}
              disabled={!isEditing}
            />

            <Input
              label="Batch Number"
              value={isEditing ? editForm.batchNumber : item.batchNumber}
              onChange={(value) => handleEditFormChange('batchNumber', value)}
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

        {/* Multi-Batch Expiry Tracking Section - Only show for consumables, not assets */}
        {item.type !== 'asset' && item.type !== 'asset-instance' && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center">
                <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Active Batches & Expiry Tracking
              </h3>
              <Badge variant="normal">{batches.length} active batches</Badge>
            </div>

            <div className="overflow-hidden border border-slate-100 rounded-lg">
              <table className="w-full text-left bg-white">
                <thead className="bg-slate-100/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-4 py-2">Batch #</th>
                    <th className="px-4 py-2">Quantity</th>
                    <th className="px-4 py-2">Expiration</th>
                    <th className="px-4 py-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 italic">
                  {batches.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-4 py-8 text-center text-slate-400 text-sm">
                        {isFetchingBatches ? 'Loading batch data...' : 'No batch data available for this item.'}
                      </td>
                    </tr>
                  ) : (
                    batches.map((batch) => {
                      const isExpired = batch.expirationDate && new Date(batch.expirationDate) < new Date()
                      const isExpiringSoon = batch.expirationDate &&
                        new Date(batch.expirationDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

                      return (
                        <tr key={batch.id} className="text-sm">
                          <td className="px-4 py-3 font-mono text-xs">{batch.batchNumber || batch.id}</td>
                          <td className="px-4 py-3 font-bold">{batch.quantity} {item.unit}</td>
                          <td className="px-4 py-3">
                            {batch.expirationDate ? new Date(batch.expirationDate).toLocaleDateString() : 'No expiry'}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {isExpired ? (
                              <Badge variant="critical">EXPIRED</Badge>
                            ) : isExpiringSoon ? (
                              <Badge variant="warning">SOON</Badge>
                            ) : (
                              <Badge variant="success">HEALTHY</Badge>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

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