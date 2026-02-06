'use client'

import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import SupplierForm from './SupplierForm'
import inventoryApi from '../../lib/inventoryApi'
import { formatCurrency } from '../../lib/utils'

export default function SupplierDetailsModal({
  isOpen,
  onClose,
  supplier,
  onUpdateSupplier,
  onApproveSupplier,
  isLoading = false
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [products, setProducts] = useState([])
  const [isFetchingProducts, setIsFetchingProducts] = useState(false)

  // Fetch products when supplier changes
  useEffect(() => {
    const fetchProducts = async () => {
      if (supplier?.name) {
        setIsFetchingProducts(true)
        try {
          const items = await inventoryApi.getItemsBySupplier(supplier.name)
          setProducts(items)
        } catch (error) {
          console.error('Failed to fetch supplier products:', error)
        } finally {
          setIsFetchingProducts(false)
        }
      }
    }
    fetchProducts()
  }, [supplier])

  if (!supplier) return null

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
  }

  const handleUpdateSupplier = async (supplierData) => {
    try {
      await onUpdateSupplier(supplier.id, supplierData)
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating supplier:', error)
    }
  }

  const handleApprove = async () => {
    try {
      await onApproveSupplier(supplier.id)
    } catch (error) {
      console.error('Error approving supplier:', error)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return 'Invalid date'
    }
  }

  const getStatusBadge = () => {
    if (!supplier.isApproved) {
      return <Badge variant="warning">Pending Approval</Badge>
    }
    if (supplier.isActive) {
      return <Badge variant="success">Active</Badge>
    }
    return <Badge variant="normal">Inactive</Badge>
  }

  const getPerformanceColor = (rating) => {
    if (rating >= 4.5) return 'text-green-600'
    if (rating >= 4.0) return 'text-blue-600'
    if (rating >= 3.5) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setIsEditing(false)
        onClose()
      }}
      size={isEditing ? "xl" : "lg"}
    >
      <div className="bg-white/80 backdrop-blur-xl rounded-lg">
        {isEditing ? (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/20">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-heading font-bold text-gray-900">Edit Supplier</h3>
                  <p className="text-sm text-gray-500">Update supplier information</p>
                </div>
              </div>
              <button
                onClick={handleCancelEdit}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <SupplierForm
              supplier={supplier}
              onSubmit={handleUpdateSupplier}
              onCancel={handleCancelEdit}
            />
          </div>
        ) : (
          <div className="p-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/20">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-heading font-bold text-gray-900">Supplier Details</h3>
                  <p className="text-sm text-gray-500">View supplier information and performance</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Supplier Information */}
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="bg-gray-50/80 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-heading font-medium text-base text-gray-900">Basic Information</h4>
                  {getStatusBadge()}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Supplier Name</label>
                    <p className="text-base font-medium text-gray-900">{supplier.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Contact Person</label>
                    <p className="text-base text-gray-900">{supplier.contactPerson}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <p className="text-base text-gray-900">{supplier.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Phone</label>
                    <p className="text-base text-gray-900">{supplier.phone}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-600">Address</label>
                    <p className="text-base text-gray-900">{supplier.address || 'No address provided'}</p>
                  </div>
                </div>
              </div>

              {/* Categories */}
              <div className="bg-gray-50/80 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <h4 className="font-heading font-medium text-base text-gray-900 mb-3">Product Categories</h4>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(supplier.categories) && supplier.categories.length > 0 ? (
                    supplier.categories.map(category => (
                      <div key={category} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                    ))
                  ) : (
                    <span className="text-gray-500 text-sm">No categories assigned</span>
                  )}
                </div>
              </div>

              {/* Business Details */}
              <div className="bg-gray-50/80 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <h4 className="font-heading font-medium text-base text-gray-900 mb-3">Business Details</h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Lead Time</label>
                    <p className="text-base text-gray-900">{supplier.leadTimeDays || 'Not set'} days</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Payment Terms</label>
                    <p className="text-base text-gray-900">{supplier.paymentTerms || 'Not set'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Total Orders</label>
                    <p className="text-base text-gray-900">{supplier.performanceMetrics?.totalOrders || 0}</p>
                  </div>
                </div>
              </div>

              {/* Performance Metrics - Only show if there's meaningful data */}
              {(supplier.performanceMetrics?.overallRating > 0 ||
                supplier.performanceMetrics?.deliveryReliability > 0 ||
                supplier.performanceMetrics?.qualityRating > 0 ||
                (supplier.performanceMetrics?.onTimeDeliveries && supplier.performanceMetrics.onTimeDeliveries > 0)) && (
                  <div className="bg-gray-50/80 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                    <h4 className="font-heading font-medium text-base text-gray-900 mb-3">Performance Metrics</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {supplier.performanceMetrics?.overallRating > 0 && (
                        <div className="text-center">
                          <label className="text-sm font-medium text-gray-600">Overall Rating</label>
                          <p className={`text-2xl font-bold ${getPerformanceColor(supplier.performanceMetrics.overallRating)}`}>
                            {supplier.performanceMetrics.overallRating.toFixed(1)}/5.0
                          </p>
                        </div>
                      )}

                      {supplier.performanceMetrics?.deliveryReliability > 0 && (
                        <div className="text-center">
                          <label className="text-sm font-medium text-gray-600">Delivery Reliability</label>
                          <p className="text-2xl font-bold text-blue-600">
                            {supplier.performanceMetrics.deliveryReliability}%
                          </p>
                        </div>
                      )}

                      {supplier.performanceMetrics?.qualityRating > 0 && (
                        <div className="text-center">
                          <label className="text-sm font-medium text-gray-600">Quality Rating</label>
                          <p className={`text-2xl font-bold ${getPerformanceColor(supplier.performanceMetrics.qualityRating)}`}>
                            {supplier.performanceMetrics.qualityRating.toFixed(1)}/5.0
                          </p>
                        </div>
                      )}

                      {supplier.performanceMetrics?.onTimeDeliveries > 0 && (
                        <div className="text-center">
                          <label className="text-sm font-medium text-gray-600">On-Time Deliveries</label>
                          <p className="text-2xl font-bold text-green-600">
                            {supplier.performanceMetrics.onTimeDeliveries}
                          </p>
                        </div>
                      )}
                    </div>

                    {supplier.performanceMetrics?.lastEvaluationDate && (
                      <div className="mt-4 pt-4 border-t border-white/20">
                        <p className="text-sm text-gray-600">
                          Last evaluation: {formatDate(supplier.performanceMetrics.lastEvaluationDate)}
                        </p>
                      </div>
                    )}
                  </div>
                )}

              {/* Approval Information */}
              {supplier.isApproved && supplier.approvedBy && (
                <div className="bg-green-50/80 backdrop-blur-sm rounded-lg p-4 border border-green-200/50">
                  <h4 className="font-heading font-medium text-base text-green-800 mb-2">Approval Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-green-700">Approved By</label>
                      <p className="text-base text-green-800">{supplier.approvedBy}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-green-700">Approved Date</label>
                      <p className="text-base text-green-800">{formatDate(supplier.approvedAt)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Offered Products */}
              <div className="bg-gray-50/80 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-heading font-medium text-base text-gray-900">Offered Products</h4>
                  <span className="text-xs text-gray-500 bg-white/50 px-2 py-0.5 rounded border">{products.length} items</span>
                </div>

                {isFetchingProducts ? (
                  <div className="py-8 text-center text-gray-500 italic text-sm">Loading products...</div>
                ) : products.length === 0 ? (
                  <div className="py-8 text-center text-gray-400 italic text-sm">No products currently linked to this supplier in inventory.</div>
                ) : (
                  <div className="overflow-hidden border border-white/10 rounded-lg overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-100/50 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        <tr>
                          <th className="px-3 py-2">Item Name</th>
                          <th className="px-3 py-2">Category</th>
                          <th className="px-3 py-2 text-right">Stock</th>
                          <th className="px-3 py-2 text-right">Unit Cost</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {products.map((product) => (
                          <tr key={product.id} className="hover:bg-white/50 transition-colors">
                            <td className="px-3 py-2 font-medium text-gray-900">{product.name}</td>
                            <td className="px-3 py-2 text-gray-500">{product.category}</td>
                            <td className="px-3 py-2 text-right">
                              <span className={`${product.currentStock <= product.restockThreshold ? 'text-red-600 font-bold' : 'text-gray-900'}`}>
                                {product.currentStock} {product.unit}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-right font-mono">{formatCurrency(product.cost || 0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Timestamps */}
              <div className="bg-gray-50/80 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <h4 className="font-heading font-medium text-base text-gray-900 mb-3">Record Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Created</label>
                    <p className="text-base text-gray-900">{formatDate(supplier.createdAt)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Last Updated</label>
                    <p className="text-base text-gray-900">{formatDate(supplier.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-6 border-t border-white/20 mt-6">
              <div className="flex space-x-3">
                {!supplier.isApproved && (
                  <Button
                    onClick={handleApprove}
                    disabled={isLoading}
                    className="bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Approve Supplier
                  </Button>
                )}
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={onClose}
                  variant="secondary"
                  className="px-6 py-2 text-sm bg-white/60 backdrop-blur-sm border border-white/20 text-gray-700 rounded-lg hover:bg-white/80 transition-all shadow-sm"
                >
                  Close
                </Button>
                <Button
                  onClick={handleEdit}
                  className="px-6 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800 transition-all shadow-sm backdrop-blur-sm"
                >
                  Edit Supplier
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}