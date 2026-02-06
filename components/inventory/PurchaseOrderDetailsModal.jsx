'use client'

import { useState } from 'react'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import Modal from '../ui/Modal'
import EmailPurchaseOrderModal from './EmailPurchaseOrderModal'
import ReceivePOModal from './ReceivePOModal'
import { formatCurrency } from '../../lib/utils'
import { useAuth } from '../../hooks/useAuth'

export default function PurchaseOrderDetailsModal({
  isOpen,
  onClose,
  order,
  onUpdateStatus,
  isLoading = false
}) {
  const { user, hasRole } = useAuth()
  const isInventoryController = hasRole('inventory-controller')
  const isPurchasingOfficer = hasRole('purchasing-officer')
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [showReceiveModal, setShowReceiveModal] = useState(false)

  if (!order) return null

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'pending': return 'warning'
      case 'approved': return 'success'
      case 'in-transit':
      case 'in transit': return 'info'
      case 'delivered': return 'success'
      default: return 'normal'
    }
  }

  const getPriorityBadgeVariant = (priority) => {
    switch (priority) {
      case 'high': return 'critical'
      case 'normal': return 'normal'
      case 'low': return 'info'
      default: return 'normal'
    }
  }

  const isOverdue = () => {
    if (order.status === 'delivered' || !order.expectedDelivery) return false
    const deliveryDate = new Date(order.expectedDelivery)
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    deliveryDate.setHours(0, 0, 0, 0)
    return deliveryDate < now
  }

  const getDaysUntilDelivery = () => {
    if (!order.expectedDelivery) return 0
    const deliveryDate = new Date(order.expectedDelivery)
    const now = new Date()
    now.setHours(0, 0, 0, 0) // Reset time to start of day for accurate comparison
    deliveryDate.setHours(0, 0, 0, 0)
    const diffTime = deliveryDate - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // Only inventory controllers can approve and update order statuses
  const availableStatuses = []
  if (isInventoryController) {
    const status = order.status?.toLowerCase()
    if (status === 'pending') {
      availableStatuses.push({ value: 'approved', label: 'Approve Order' })
    }
    if (status === 'approved') {
      availableStatuses.push({ value: 'in-transit', label: 'Mark as In Transit' })
    }
    if (status === 'in-transit' || status === 'in transit') {
      availableStatuses.push({ value: 'delivered', label: 'Receive Items' })
    }
  }

  // Purchasing Officers can also receive items
  const status = order.status?.toLowerCase()
  if (isPurchasingOfficer && (status === 'in-transit' || status === 'in transit')) {
    if (!availableStatuses.find(s => s.value === 'delivered')) {
      availableStatuses.push({ value: 'delivered', label: 'Receive Items' })
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Purchase Order ${order.orderNumber}`}
      size="xl"
    >
      <div className="space-y-6">
        {/* Header with Status and Priority */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Badge variant={getStatusBadgeVariant(order.status)}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('-', ' ')}
            </Badge>
            <Badge variant={getPriorityBadgeVariant(order.priority)}>
              {order.priority.charAt(0).toUpperCase() + order.priority.slice(1)} Priority
            </Badge>
            <span className="text-sm text-gray-500">
              ID: {order.id}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            {/* Email Button for Approved Orders */}
            {order.status === 'approved' && order.supplier?.email && (
              <Button
                onClick={() => setShowEmailModal(true)}
                variant="secondary"
                size="sm"
                className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email to Supplier
              </Button>
            )}

            {!isInventoryController && (
              <Badge variant="normal" className="text-xs">
                View Only
              </Badge>
            )}
          </div>
        </div>

        {/* Simple Approve/Reject Buttons */}
        {isInventoryController && order.status === 'pending' && (
          <div className="flex items-center justify-center space-x-4 py-6 border-t border-gray-200">
            <button
              onClick={async () => {
                try {
                  const statusUpdate = {
                    status: 'approved',
                    statusHistory: [
                      ...(order.statusHistory || []),
                      {
                        status: 'approved',
                        reason: 'Order approved for procurement',
                        changedBy: 'inventory-controller-001',
                        changedAt: new Date().toISOString()
                      }
                    ],
                    approvedAt: new Date().toISOString(),
                    approvedBy: 'inventory-controller-001',
                    updatedAt: new Date().toISOString()
                  }

                  await onUpdateStatus(order.id, statusUpdate)
                  alert(`✅ Order Approved!\n\nOrder ${order.orderNumber} has been approved successfully.`)

                } catch (error) {
                  console.error('Error approving order:', error)
                  alert('❌ Failed to approve order. Please try again.')
                }
              }}
              disabled={isLoading}
              className="inline-flex items-center px-8 py-3 text-base font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Approve
            </button>

            <button
              onClick={async () => {
                try {
                  const statusUpdate = {
                    status: 'rejected',
                    statusHistory: [
                      ...(order.statusHistory || []),
                      {
                        status: 'rejected',
                        reason: 'Order rejected by inventory controller',
                        changedBy: 'inventory-controller-001',
                        changedAt: new Date().toISOString()
                      }
                    ],
                    rejectedAt: new Date().toISOString(),
                    rejectedBy: 'inventory-controller-001',
                    updatedAt: new Date().toISOString()
                  }

                  await onUpdateStatus(order.id, statusUpdate)
                  alert(`❌ Order Rejected!\n\nOrder ${order.orderNumber} has been rejected.`)

                } catch (error) {
                  console.error('Error rejecting order:', error)
                  alert('❌ Failed to reject order. Please try again.')
                }
              }}
              disabled={isLoading}
              className="inline-flex items-center px-8 py-3 text-base font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Reject
            </button>
          </div>
        )}

        {/* Order Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Order Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Order Details</h3>

            <div className="grid grid-cols-1 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Order Number</span>
                  <span className="text-sm font-mono text-gray-900">{order.orderNumber}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Total Amount</span>
                  <span className="text-lg font-bold text-gray-900">{formatCurrency(order.totalAmount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Items Ordered</span>
                  <span className="text-sm text-gray-900">{order.items?.length || 0} items</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expected Delivery
                </label>
                <div className={`p-3 rounded-lg ${isOverdue() ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
                  <div className="flex items-center justify-between">
                    <span className={`font-medium ${isOverdue() ? 'text-red-700' : 'text-gray-900'}`}>
                      {order.expectedDelivery ? new Date(order.expectedDelivery).toLocaleDateString() : 'Not set'}
                    </span>
                    <span className={`text-sm ${isOverdue() ? 'text-red-600' : 'text-gray-500'}`}>
                      {!order.expectedDelivery ? 'No delivery date' :
                        isOverdue()
                          ? `${Math.abs(getDaysUntilDelivery())} days overdue`
                          : getDaysUntilDelivery() === 0
                            ? 'Due today'
                            : `${getDaysUntilDelivery()} days remaining`
                      }
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <p className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-md">
                  {order.notes || 'No notes provided'}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Supplier & Items */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Supplier Information</h3>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-700">Supplier Name</span>
                  <p className="text-sm text-gray-900 font-medium">{order.supplier?.name}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Contact Person</span>
                  <p className="text-sm text-gray-900">{order.supplier?.contactPerson}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Contact Info</span>
                  <p className="text-sm text-gray-900">{order.supplier?.email}</p>
                  <p className="text-sm text-gray-500">{order.supplier?.phone}</p>
                </div>
              </div>
            </div>

            <h3 className="text-lg font-medium text-gray-900">Order Items</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {order.items?.map((item, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {item.itemName || item.name || 'Unknown Item'}
                      </p>
                      <p className="text-xs text-gray-500">per {item.itemUnit || item.unit || 'unit'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {item.quantity} {item.itemUnit || item.unit || 'units'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatCurrency(item.unitCost || item.unitPrice || 0)} each
                      </p>
                      <p className="text-xs font-medium text-gray-700">
                        Total: {formatCurrency((item.quantity || 0) * (item.unitCost || item.unitPrice || 0))}
                      </p>
                    </div>
                  </div>
                </div>
              )) || (
                  <p className="text-sm text-gray-500 text-center py-4">No items listed</p>
                )}
            </div>
          </div>
        </div>

        {/* Status History */}
        {order.statusHistory && order.statusHistory.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Status History</h3>
            <div className="space-y-3">
              {order.statusHistory.map((history, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <Badge variant={getStatusBadgeVariant(history.status)}>
                        {history.status.charAt(0).toUpperCase() + history.status.slice(1).replace('-', ' ')}
                      </Badge>
                      <p className="text-sm text-gray-600 mt-1">{history.reason}</p>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <p>{new Date(history.changedAt).toLocaleString()}</p>
                      <p>By: {history.changedBy}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timestamps */}
        <div className="border-t pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500">
            <div>
              <span className="font-medium">Requested:</span>
              <br />
              {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}
              {order.requestedBy && (
                <div className="text-xs mt-1">By: {order.requestedBy}</div>
              )}
            </div>
            {order.approvedAt && (
              <div>
                <span className="font-medium">Approved:</span>
                <br />
                {new Date(order.approvedAt).toLocaleString()}
                {order.approvedBy && (
                  <div className="text-xs mt-1">By: {order.approvedBy}</div>
                )}
              </div>
            )}
            <div>
              <span className="font-medium">Last Updated:</span>
              <br />
              {order.updatedAt ? new Date(order.updatedAt).toLocaleString() : 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Email Purchase Order Modal */}
      <EmailPurchaseOrderModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        order={order}
      />
      {/* Receive PO Modal */}
      <ReceivePOModal
        isOpen={showReceiveModal}
        onClose={() => setShowReceiveModal(false)}
        order={order}
        onSuccess={() => {
          setShowReceiveModal(false)
          onClose() // Close details modal too
        }}
      />
    </Modal>
  )
}