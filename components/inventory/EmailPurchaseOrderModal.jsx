'use client'

import { useState } from 'react'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import { formatCurrency } from '../../lib/utils'
import emailApi from '../../lib/emailApi'

export default function EmailPurchaseOrderModal({
  isOpen,
  onClose,
  order
}) {
  const [emailData, setEmailData] = useState({
    subject: order ? `Purchase Order ${order.orderNumber} - ${order.supplier?.name}` : '',
    message: order ? `Dear ${order.supplier?.contactPerson || order.supplier?.name},

We are pleased to send you our approved purchase order for your review and processing.

Please confirm receipt of this order and provide us with:
- Confirmation of availability for all items
- Expected delivery timeline
- Any special handling requirements

We look forward to your prompt response and continued partnership.

Best regards,
Minima Hotel Inventory Team` : ''
  })
  const [isSending, setIsSending] = useState(false)
  const [emailStatus, setEmailStatus] = useState(null)

  if (!order) return null

  const handleSendEmail = async () => {
    try {
      setIsSending(true)
      setEmailStatus(null)

      const result = await emailApi.sendPurchaseOrderEmail({
        order: order,
        supplier: order.supplier,
        customSubject: emailData.subject,
        customContent: null // Let server generate the content
      }, emailData.message)

      console.log('✅ Email sent successfully:', result)
      setEmailStatus({ type: 'success', message: 'Email sent successfully!' })
      
      // Close modal after 2 seconds
      setTimeout(() => {
        onClose()
        setEmailStatus(null)
      }, 2000)

    } catch (error) {
      console.error('❌ Failed to send email:', error)
      setEmailStatus({ 
        type: 'error', 
        message: error.message || 'Failed to send email. Please try again.' 
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleClose = () => {
    if (!isSending) {
      setEmailStatus(null)
      onClose()
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="xl"
      className="max-w-4xl"
    >
      <div className="bg-white/90 backdrop-blur-xl rounded-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-heading font-bold text-gray-900">Email Purchase Order</h2>
              <p className="text-sm text-gray-600">Send {order.orderNumber} to {order.supplier?.name}</p>
            </div>
          </div>
          
          <button
            onClick={handleClose}
            disabled={isSending}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Email Status */}
          {emailStatus && (
            <div className={`p-4 rounded-lg border ${
              emailStatus.type === 'success' 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div className="flex items-center space-x-2">
                {emailStatus.type === 'success' ? (
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <span className="font-medium">{emailStatus.message}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Email Form */}
            <div className="space-y-4">
              <h3 className="text-lg font-heading font-semibold text-gray-900">Email Details</h3>
              
              {/* Recipient Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Recipient</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Company:</span> {order.supplier?.name}</p>
                  <p><span className="font-medium">Contact:</span> {order.supplier?.contactPerson}</p>
                  <p><span className="font-medium">Email:</span> {order.supplier?.email}</p>
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Subject
                </label>
                <input
                  type="text"
                  value={emailData.subject}
                  onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter email subject"
                  disabled={isSending}
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Message
                </label>
                <textarea
                  value={emailData.message}
                  onChange={(e) => setEmailData(prev => ({ ...prev, message: e.target.value }))}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Enter your custom message..."
                  disabled={isSending}
                />
                <p className="mt-1 text-xs text-gray-500">
                  This message will be included at the top of the purchase order email.
                </p>
              </div>
            </div>

            {/* Order Preview */}
            <div className="space-y-4">
              <h3 className="text-lg font-heading font-semibold text-gray-900">Order Summary</h3>
              
              <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
                {/* Order Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Order Number:</span>
                    <p className="font-medium">{order.orderNumber}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <p className="font-medium text-green-600">{order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('-', ' ')}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Priority:</span>
                    <p className="font-medium">{order.priority.charAt(0).toUpperCase() + order.priority.slice(1)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Expected Delivery:</span>
                    <p className="font-medium">{order.expectedDelivery ? new Date(order.expectedDelivery).toLocaleDateString() : 'Not set'}</p>
                  </div>
                </div>

                {/* Items Summary */}
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="font-medium text-gray-900 mb-3">Items ({order.items?.length || 0})</h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {order.items?.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {item.itemName || item.name} × {item.quantity}
                        </span>
                        <span className="font-medium">
                          {formatCurrency((item.quantity || 0) * (item.unitCost || item.unitPrice || 0))}
                        </span>
                      </div>
                    )) || (
                      <p className="text-sm text-gray-500">No items listed</p>
                    )}
                  </div>
                </div>

                {/* Total */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-900">Total Amount:</span>
                    <span className="font-bold text-lg text-gray-900">{formatCurrency(order.totalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Email Preview Note */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Email Preview</p>
                    <p>The email will include your custom message above, followed by a detailed purchase order with all items, pricing, and contact information.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <Button
              onClick={handleClose}
              variant="ghost"
              disabled={isSending}
              className="text-gray-600 hover:text-gray-800"
            >
              Cancel
            </Button>
            
            <Button
              onClick={handleSendEmail}
              disabled={isSending || !emailData.subject.trim() || !order.supplier?.email}
              className="bg-blue-600 text-white hover:bg-blue-700 min-w-[120px]"
            >
              {isSending ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Sending...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  <span>Send Email</span>
                </div>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}