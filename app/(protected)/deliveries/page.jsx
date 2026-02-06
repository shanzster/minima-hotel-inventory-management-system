'use client'

import { useState, useEffect } from 'react'
import { usePageTitle } from '../../../hooks/usePageTitle'
import { useAuth } from '../../../hooks/useAuth'
import Button from '../../../components/ui/Button'
import Modal from '../../../components/ui/Modal'
import Badge from '../../../components/ui/Badge'
import purchaseOrderApi from '../../../lib/purchaseOrderApi'
import inventoryApi from '../../../lib/inventoryApi'

export default function DeliveriesPage() {
  const { setTitle } = usePageTitle()
  const { user } = useAuth()
  const [deliveries, setDeliveries] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDelivery, setSelectedDelivery] = useState(null)
  const [showReceiveModal, setShowReceiveModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  
  // Receive checklist state
  const [receiveChecklist, setReceiveChecklist] = useState([])
  const [receivedBy, setReceivedBy] = useState('')
  const [deliveryNotes, setDeliveryNotes] = useState('')
  const [showPrintPreview, setShowPrintPreview] = useState(false)
  const [completedReceipt, setCompletedReceipt] = useState(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedDeliveryDetails, setSelectedDeliveryDetails] = useState(null)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    setTitle('Deliveries')
    loadDeliveries()
  }, [setTitle])

  const loadDeliveries = async () => {
    try {
      setLoading(true)
      const orders = await purchaseOrderApi.getAll()
      
      // Filter orders that are approved or in-transit (ready for delivery)
      const deliveryOrders = orders.filter(order => 
        order.status === 'approved' || 
        order.status === 'in-transit' ||
        order.status === 'delivered'
      )
      
      setDeliveries(deliveryOrders)
    } catch (error) {
      console.error('Error loading deliveries:', error)
    } finally {
      setLoading(false)
    }
  }

  // Initialize receive checklist
  const initializeChecklist = (order) => {
    const checklist = order.items.map(item => ({
      inventoryItemId: item.inventoryItemId,
      itemName: item.itemName || 'Unknown Item',
      orderedQuantity: item.quantity,
      receivedQuantity: 0,
      unitCost: item.unitCost || 0,
      checked: false,
      condition: 'good',
      notes: ''
    }))
    setReceiveChecklist(checklist)
    setReceivedBy(user?.name || '')
    setDeliveryNotes('')
  }

  // Handle receive delivery
  const handleReceiveDelivery = (order) => {
    setSelectedDelivery(order)
    initializeChecklist(order)
    setShowReceiveModal(true)
  }

  // Update checklist item
  const updateChecklistItem = (index, field, value) => {
    const updated = [...receiveChecklist]
    updated[index][field] = value
    
    // If checking the checkbox, set received quantity to ordered quantity by default
    if (field === 'checked' && value === true) {
      updated[index].receivedQuantity = updated[index].orderedQuantity
    }
    
    // If unchecking, reset received quantity to 0
    if (field === 'checked' && value === false) {
      updated[index].receivedQuantity = 0
    }
    
    setReceiveChecklist(updated)
  }

  // Calculate delivery adjustments
  const calculateAdjustments = () => {
    let shortDeliveries = []
    let overDeliveries = []
    let perfectDeliveries = []
    
    receiveChecklist.forEach(item => {
      if (!item.checked) return
      
      const difference = item.receivedQuantity - item.orderedQuantity
      
      if (difference < 0) {
        shortDeliveries.push({
          ...item,
          shortage: Math.abs(difference)
        })
      } else if (difference > 0) {
        overDeliveries.push({
          ...item,
          excess: difference
        })
      } else {
        perfectDeliveries.push(item)
      }
    })
    
    return { shortDeliveries, overDeliveries, perfectDeliveries }
  }

  // Get summary statistics
  const getSummary = () => {
    const checkedItems = receiveChecklist.filter(item => item.checked)
    const totalOrdered = checkedItems.reduce((sum, item) => sum + item.orderedQuantity, 0)
    const totalReceived = checkedItems.reduce((sum, item) => sum + item.receivedQuantity, 0)
    const totalOrderedCost = checkedItems.reduce((sum, item) => sum + (item.orderedQuantity * item.unitCost), 0)
    const totalReceivedCost = checkedItems.reduce((sum, item) => sum + (item.receivedQuantity * item.unitCost), 0)
    const { shortDeliveries, overDeliveries } = calculateAdjustments()
    
    return {
      itemsChecked: checkedItems.length,
      totalItems: receiveChecklist.length,
      totalOrdered,
      totalReceived,
      totalOrderedCost,
      totalReceivedCost,
      costDifference: totalReceivedCost - totalOrderedCost,
      shortCount: shortDeliveries.length,
      overCount: overDeliveries.length,
      hasDiscrepancies: shortDeliveries.length > 0 || overDeliveries.length > 0
    }
  }

  // Handle confirm button click
  const handleConfirmClick = () => {
    const checkedItems = receiveChecklist.filter(item => item.checked)
    
    if (checkedItems.length === 0) {
      alert('Please check at least one item to receive')
      return
    }
    
    if (!receivedBy.trim()) {
      alert('Please enter who received the delivery')
      return
    }
    
    setShowConfirmModal(true)
  }

  // Submit delivery receipt
  const handleSubmitReceipt = async () => {
    try {
      setShowConfirmModal(false)
      
      // Only process checked items
      const checkedItems = receiveChecklist.filter(item => item.checked)
      
      // Update purchase order status
      await purchaseOrderApi.update(selectedDelivery.id, {
        status: 'delivered',
        deliveredAt: new Date().toISOString(),
        deliveryReceipt: {
          receivedBy,
          receivedAt: new Date().toISOString(),
          items: checkedItems,
          notes: deliveryNotes,
          adjustments: calculateAdjustments()
        }
      })

      // Update inventory stock levels for checked items
      for (const item of checkedItems) {
        const inventoryItem = await inventoryApi.getById(item.inventoryItemId)
        if (inventoryItem) {
          await inventoryApi.update(item.inventoryItemId, {
            currentStock: inventoryItem.currentStock + item.receivedQuantity
          })
        }
      }

      // Prepare completed receipt for printing
      setCompletedReceipt({
        order: selectedDelivery,
        receivedBy,
        receivedAt: new Date(),
        items: checkedItems,
        notes: deliveryNotes,
        adjustments: calculateAdjustments()
      })

      setShowReceiveModal(false)
      
      // Show success toast
      const summary = getSummary()
      setSuccessMessage(`✅ Delivery received successfully!\n\n${summary.itemsChecked} items processed with ${summary.totalReceived} total units.`)
      setShowSuccessToast(true)
      
      // Auto-hide toast after 5 seconds
      setTimeout(() => {
        setShowSuccessToast(false)
      }, 5000)
      
      loadDeliveries()
      
      // Show print preview after a short delay
      setTimeout(() => {
        setShowPrintPreview(true)
      }, 500)
    } catch (error) {
      console.error('Error submitting receipt:', error)
      alert('Failed to submit delivery receipt')
    }
  }

  // Print delivery receipt
  const handlePrintReceipt = () => {
    if (!completedReceipt) return

    const printWindow = window.open('', '_blank')
    const now = new Date()
    
    const printHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Delivery Receipt - ${completedReceipt.order.orderNumber}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
            
            @media print {
              @page {
                margin: 0.75in;
                size: A4;
              }
              
              * {
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
            }
            
            body {
              font-family: 'Poppins', sans-serif;
              font-size: 11px;
              line-height: 1.4;
              color: #1f2937;
              margin: 0;
              padding: 0;
              background: white;
            }
            
            .receipt-header {
              border-bottom: 3px solid #1f2937;
              padding-bottom: 16px;
              margin-bottom: 24px;
            }
            
            .receipt-title {
              font-size: 28px;
              font-weight: 700;
              color: #1f2937;
              margin: 0 0 8px 0;
            }
            
            .receipt-subtitle {
              font-size: 14px;
              font-weight: 400;
              color: #6b7280;
              margin: 0;
            }
            
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 24px;
              margin-bottom: 24px;
            }
            
            .info-section {
              background: #f9fafb;
              padding: 16px;
              border-radius: 8px;
            }
            
            .info-label {
              font-size: 10px;
              font-weight: 600;
              color: #6b7280;
              text-transform: uppercase;
              margin-bottom: 4px;
            }
            
            .info-value {
              font-size: 12px;
              font-weight: 500;
              color: #1f2937;
            }
            
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 24px;
            }
            
            .items-table th {
              background: #1f2937;
              color: white;
              padding: 12px 8px;
              text-align: left;
              font-weight: 600;
              font-size: 10px;
              text-transform: uppercase;
            }
            
            .items-table td {
              padding: 10px 8px;
              font-size: 11px;
              border-bottom: 1px solid #e5e7eb;
            }
            
            .items-table tr:nth-child(even) {
              background: #f9fafb;
            }
            
            .condition-good { color: #059669; font-weight: 600; }
            .condition-damaged { color: #dc2626; font-weight: 600; }
            .condition-partial { color: #d97706; font-weight: 600; }
            
            .notes-section {
              background: #f9fafb;
              padding: 16px;
              border-radius: 8px;
              margin-bottom: 24px;
            }
            
            .signature-section {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 48px;
              margin-top: 48px;
            }
            
            .signature-box {
              text-align: center;
            }
            
            .signature-line {
              border-top: 2px solid #1f2937;
              margin-top: 48px;
              padding-top: 8px;
              font-size: 11px;
              font-weight: 600;
            }
            
            .footer {
              margin-top: 32px;
              padding-top: 16px;
              border-top: 1px solid #e5e7eb;
              font-size: 9px;
              color: #9ca3af;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="receipt-header">
            <h1 class="receipt-title">DELIVERY RECEIPT</h1>
            <p class="receipt-subtitle">Minima Hotel - Inventory Management</p>
          </div>
          
          <div class="info-grid">
            <div class="info-section">
              <div class="info-label">Receipt Number</div>
              <div class="info-value">DR-${completedReceipt.order.orderNumber}</div>
            </div>
            <div class="info-section">
              <div class="info-label">Date Received</div>
              <div class="info-value">${completedReceipt.receivedAt.toLocaleDateString()} at ${completedReceipt.receivedAt.toLocaleTimeString()}</div>
            </div>
            <div class="info-section">
              <div class="info-label">Purchase Order</div>
              <div class="info-value">${completedReceipt.order.orderNumber}</div>
            </div>
            <div class="info-section">
              <div class="info-label">Supplier</div>
              <div class="info-value">${completedReceipt.order.supplier?.name || 'N/A'}</div>
            </div>
            <div class="info-section">
              <div class="info-label">Received By</div>
              <div class="info-value">${completedReceipt.receivedBy}</div>
            </div>
            <div class="info-section">
              <div class="info-label">Expected Delivery</div>
              <div class="info-value">${new Date(completedReceipt.order.expectedDelivery).toLocaleDateString()}</div>
            </div>
          </div>
          
          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 25%;">Item Description</th>
                <th style="width: 10%;">Unit Cost</th>
                <th style="width: 10%;">Ordered Qty</th>
                <th style="width: 10%;">Received Qty</th>
                <th style="width: 10%;">Adjustment</th>
                <th style="width: 10%;">Condition</th>
                <th style="width: 10%;">Total Cost</th>
                <th style="width: 15%;">Notes</th>
              </tr>
            </thead>
            <tbody>
              ${completedReceipt.items.map(item => {
                const difference = item.receivedQuantity - item.orderedQuantity
                const status = difference < 0 ? 'SHORT' : difference > 0 ? 'OVER' : 'OK'
                const statusColor = difference < 0 ? '#dc2626' : difference > 0 ? '#d97706' : '#059669'
                const totalCost = item.receivedQuantity * item.unitCost
                
                return `
                <tr>
                  <td><strong>${item.itemName}</strong></td>
                  <td>₱${item.unitCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td>${item.orderedQuantity}</td>
                  <td><strong>${item.receivedQuantity}</strong></td>
                  <td><span style="color: ${statusColor}; font-weight: 600;">${status}${difference !== 0 ? ` (${difference > 0 ? '+' : ''}${difference})` : ''}</span></td>
                  <td><span class="condition-${item.condition}">${item.condition.toUpperCase()}</span></td>
                  <td><strong>₱${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
                  <td>${item.notes || '-'}</td>
                </tr>
              `}).join('')}
              <tr style="background: #f3f4f6; font-weight: 600;">
                <td colspan="6" style="text-align: right; padding-right: 16px;">TOTAL RECEIVED COST:</td>
                <td colspan="2"><strong style="font-size: 13px;">₱${completedReceipt.items.reduce((sum, item) => sum + (item.receivedQuantity * item.unitCost), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
              </tr>
            </tbody>
          </table>
          
          ${completedReceipt.notes ? `
            <div class="notes-section">
              <div class="info-label">Delivery Notes</div>
              <div class="info-value">${completedReceipt.notes}</div>
            </div>
          ` : ''}
          
          <div class="signature-section">
            <div class="signature-box">
              <div class="signature-line">Received By</div>
              <div style="margin-top: 4px; font-size: 10px; color: #6b7280;">${completedReceipt.receivedBy}</div>
            </div>
            <div class="signature-box">
              <div class="signature-line">Delivered By</div>
              <div style="margin-top: 4px; font-size: 10px; color: #6b7280;">Supplier Representative</div>
            </div>
          </div>
          
          <div class="footer">
            <p>This is an official delivery receipt generated by Minima Hotel Inventory Management System</p>
            <p>Generated on ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}</p>
          </div>
        </body>
      </html>
    `
    
    printWindow.document.write(printHTML)
    printWindow.document.close()
    
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print()
      }, 250)
    }
  }

  // Filter deliveries
  const filteredDeliveries = deliveries.filter(delivery => {
    const matchesSearch = delivery.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         delivery.supplier?.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || delivery.status === statusFilter
    
    // Date range filter
    let matchesDateRange = true
    if (dateFrom || dateTo) {
      const deliveryDate = new Date(delivery.expectedDelivery)
      if (dateFrom) {
        const fromDate = new Date(dateFrom)
        fromDate.setHours(0, 0, 0, 0)
        matchesDateRange = matchesDateRange && deliveryDate >= fromDate
      }
      if (dateTo) {
        const toDate = new Date(dateTo)
        toDate.setHours(23, 59, 59, 999)
        matchesDateRange = matchesDateRange && deliveryDate <= toDate
      }
    }
    
    return matchesSearch && matchesStatus && matchesDateRange
  })

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Order Number', 'Supplier', 'Expected Delivery', 'Status', 'Total Amount', 'Items Count']
    const csvData = filteredDeliveries.map(delivery => [
      delivery.orderNumber,
      delivery.supplier?.name || 'N/A',
      new Date(delivery.expectedDelivery).toLocaleDateString(),
      delivery.status,
      `₱${delivery.totalAmount?.toLocaleString() || '0'}`,
      delivery.items?.length || 0
    ])
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `deliveries-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Print deliveries list
  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    const now = new Date()
    
    const printHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Deliveries Report</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap');
            body { font-family: 'Poppins', sans-serif; padding: 20px; }
            h1 { font-size: 24px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #f3f4f6; font-weight: 600; }
            .status-badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; }
            .status-delivered { background: #d1fae5; color: #065f46; }
            .status-in-transit { background: #fef3c7; color: #92400e; }
            .status-approved { background: #dbeafe; color: #1e40af; }
          </style>
        </head>
        <body>
          <h1>Deliveries Report</h1>
          <p>Generated on: ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}</p>
          <p>Total Deliveries: ${filteredDeliveries.length}</p>
          <table>
            <thead>
              <tr>
                <th>Order #</th>
                <th>Supplier</th>
                <th>Expected Delivery</th>
                <th>Status</th>
                <th>Total Amount</th>
              </tr>
            </thead>
            <tbody>
              ${filteredDeliveries.map(delivery => `
                <tr>
                  <td>${delivery.orderNumber}</td>
                  <td>${delivery.supplier?.name || 'N/A'}</td>
                  <td>${new Date(delivery.expectedDelivery).toLocaleDateString()}</td>
                  <td><span class="status-badge status-${delivery.status}">${delivery.status.toUpperCase()}</span></td>
                  <td>₱${delivery.totalAmount?.toLocaleString() || '0'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `
    
    printWindow.document.write(printHTML)
    printWindow.document.close()
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print()
      }, 250)
    }
  }

  // Handle row click to show details
  const handleRowClick = (delivery) => {
    setSelectedDeliveryDetails(delivery)
    setShowDetailsModal(true)
  }

  // Print single delivery receipt
  const handlePrintSingleReceipt = (delivery) => {
    const printWindow = window.open('', '_blank')
    const now = new Date()
    
    const printHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Delivery Receipt - ${delivery.orderNumber}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
            body { font-family: 'Poppins', sans-serif; padding: 40px; }
            .header { border-bottom: 3px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 28px; font-weight: 700; margin: 0; }
            .subtitle { color: #666; margin-top: 5px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .info-box { background: #f9fafb; padding: 15px; border-radius: 8px; }
            .info-label { font-size: 11px; color: #666; text-transform: uppercase; font-weight: 600; }
            .info-value { font-size: 14px; font-weight: 500; margin-top: 5px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #e5e7eb; padding: 12px; text-align: left; }
            th { background: #1f2937; color: white; font-weight: 600; font-size: 11px; text-transform: uppercase; }
            .total-row { background: #f3f4f6; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">DELIVERY ORDER</h1>
            <p class="subtitle">Minima Hotel - Inventory Management</p>
          </div>
          
          <div class="info-grid">
            <div class="info-box">
              <div class="info-label">Order Number</div>
              <div class="info-value">${delivery.orderNumber}</div>
            </div>
            <div class="info-box">
              <div class="info-label">Expected Delivery</div>
              <div class="info-value">${new Date(delivery.expectedDelivery).toLocaleDateString()}</div>
            </div>
            <div class="info-box">
              <div class="info-label">Supplier</div>
              <div class="info-value">${delivery.supplier?.name || 'N/A'}</div>
            </div>
            <div class="info-box">
              <div class="info-label">Status</div>
              <div class="info-value">${delivery.status.toUpperCase()}</div>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Item Description</th>
                <th>Quantity</th>
                <th>Unit Cost</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${delivery.items?.map(item => `
                <tr>
                  <td>${item.itemName || 'Unknown Item'}</td>
                  <td>${item.quantity}</td>
                  <td>₱${item.unitCost?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}</td>
                  <td>₱${((item.quantity * (item.unitCost || 0))).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                </tr>
              `).join('') || '<tr><td colspan="4">No items</td></tr>'}
              <tr class="total-row">
                <td colspan="3" style="text-align: right;">TOTAL AMOUNT:</td>
                <td>₱${delivery.totalAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}</td>
              </tr>
            </tbody>
          </table>
          
          <p style="margin-top: 40px; font-size: 11px; color: #666;">
            Generated on ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}
          </p>
        </body>
      </html>
    `
    
    printWindow.document.write(printHTML)
    printWindow.document.close()
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print()
      }, 250)
    }
  }

  // Get status counts
  const statusCounts = {
    all: deliveries.length,
    approved: deliveries.filter(d => d.status === 'approved').length,
    'in-transit': deliveries.filter(d => d.status === 'in-transit').length,
    delivered: deliveries.filter(d => d.status === 'delivered').length
  }

  if (loading) {
    return (
      <div className="p-4 mx-2">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading deliveries...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 mx-2">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-gray-900 mb-1">Deliveries</h1>
        <p className="text-gray-500 font-body text-sm">
          Track and receive incoming deliveries
        </p>
      </div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div 
          className={`bg-white/80 backdrop-blur-xl rounded-lg border p-4 cursor-pointer transition-all duration-200 ease-out hover:shadow-xl shadow-xl ${
            statusFilter === 'all' ? 'border-slate-700 bg-slate-50/80' : 'border-white/20'
          }`}
          onClick={() => setStatusFilter('all')}
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
            <div>
              <h3 className="font-heading font-medium text-sm text-gray-600">All Deliveries</h3>
              <p className="text-2xl font-heading font-bold text-black">{statusCounts.all}</p>
            </div>
          </div>
        </div>

        <div 
          className={`bg-white/80 backdrop-blur-xl rounded-lg border p-4 cursor-pointer transition-all duration-200 ease-out hover:shadow-xl shadow-xl ${
            statusFilter === 'approved' ? 'border-blue-800 bg-blue-50/80' : 'border-white/20'
          }`}
          onClick={() => setStatusFilter('approved')}
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-heading font-medium text-sm text-blue-700">Approved</h3>
              <p className="text-2xl font-heading font-bold text-blue-600">{statusCounts.approved}</p>
            </div>
          </div>
        </div>

        <div 
          className={`bg-white/80 backdrop-blur-xl rounded-lg border p-4 cursor-pointer transition-all duration-200 ease-out hover:shadow-xl shadow-xl ${
            statusFilter === 'in-transit' ? 'border-amber-800 bg-amber-50/80' : 'border-white/20'
          }`}
          onClick={() => setStatusFilter('in-transit')}
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="font-heading font-medium text-sm text-amber-700">In Transit</h3>
              <p className="text-2xl font-heading font-bold text-amber-600">{statusCounts['in-transit']}</p>
            </div>
          </div>
        </div>

        <div 
          className={`bg-white/80 backdrop-blur-xl rounded-lg border p-4 cursor-pointer transition-all duration-200 ease-out hover:shadow-xl shadow-xl ${
            statusFilter === 'delivered' ? 'border-green-800 bg-green-50/80' : 'border-white/20'
          }`}
          onClick={() => setStatusFilter('delivered')}
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 className="font-heading font-medium text-sm text-green-700">Delivered</h3>
              <p className="text-2xl font-heading font-bold text-green-600">{statusCounts.delivered}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Deliveries Table */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-lg shadow-xl">
        <div className="border-b border-white/20 px-4 py-3">
          <h3 className="font-heading font-medium text-base">
            Delivery Orders
            <span className="text-gray-500 font-normal ml-2 text-sm">
              ({filteredDeliveries.length} {filteredDeliveries.length === 1 ? 'order' : 'orders'})
            </span>
          </h3>
        </div>

        {/* Search Bar */}
        <div className="border-b border-white/20 p-4">
          <div className="flex items-center justify-between">
            <div className="relative max-w-md flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by order number or supplier..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/60 backdrop-blur-sm border border-white/20 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black/20 transition-all"
              />
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-3 ml-4">
              <button
                onClick={() => setShowFilterModal(true)}
                className="inline-flex items-center px-3 py-2 bg-white/60 backdrop-blur-sm border border-white/20 rounded-lg text-sm text-gray-700 hover:bg-white/80 transition-all"
              >
                <svg className="w-4 h-4 mr-2 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                </svg>
                Filter
              </button>
              
              <button
                onClick={handlePrint}
                className="inline-flex items-center px-3 py-2 bg-white/60 backdrop-blur-sm border border-white/20 rounded-lg text-sm text-gray-700 hover:bg-white/80 transition-all"
              >
                <svg className="w-4 h-4 mr-2 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print
              </button>
              
              <button
                onClick={exportToCSV}
                className="inline-flex items-center px-3 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800 transition-all backdrop-blur-sm"
              >
                <svg className="w-4 h-4 mr-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supplier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expected Delivery
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDeliveries.map((delivery) => (
                <tr 
                  key={delivery.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleRowClick(delivery)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{delivery.orderNumber}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{delivery.supplier?.name || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(delivery.expectedDelivery).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={
                      delivery.status === 'delivered' ? 'success' :
                      delivery.status === 'in-transit' ? 'warning' :
                      'normal'
                    }>
                      {delivery.status.replace('-', ' ').toUpperCase()}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      ₱{delivery.totalAmount?.toLocaleString() || '0'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      {delivery.status !== 'delivered' ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleReceiveDelivery(delivery)
                          }}
                          className="inline-flex items-center px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors backdrop-blur-sm"
                        >
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Receive
                        </button>
                      ) : (
                        <span className="text-gray-400 text-xs">Completed</span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handlePrintSingleReceipt(delivery)
                        }}
                        className="inline-flex items-center px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors backdrop-blur-sm"
                        title="Print Receipt"
                      >
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Print
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredDeliveries.length === 0 && (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500">No deliveries found</p>
            </div>
          )}
        </div>
      </div>

      {/* Receive Delivery Modal */}
      <Modal
        isOpen={showReceiveModal}
        onClose={() => setShowReceiveModal(false)}
        title={`Receive Delivery - ${selectedDelivery?.orderNumber}`}
        size="xl"
      >
        <div className="space-y-6">
          {/* Delivery Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Supplier:</span>
                <span className="ml-2 text-gray-900">{selectedDelivery?.supplier?.name}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Expected:</span>
                <span className="ml-2 text-gray-900">
                  {selectedDelivery && new Date(selectedDelivery.expectedDelivery).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Receive Checklist */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">Items Checklist</h4>
              <div className="text-sm text-gray-600">
                {getSummary().itemsChecked} of {getSummary().totalItems} items checked
              </div>
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {receiveChecklist.map((item, index) => (
                <div 
                  key={index} 
                  className={`border rounded-lg p-4 transition-all ${
                    item.checked 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {/* Checkbox */}
                    <div className="flex items-center pt-1">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={(e) => updateChecklistItem(index, 'checked', e.target.checked)}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </div>
                    
                    {/* Item Details */}
                    <div className="flex-1 space-y-3">
                      {/* Item Name and Ordered Quantity */}
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">{item.itemName}</div>
                          <div className="text-xs text-gray-500">
                            Unit Cost: ₱{item.unitCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600">
                            Ordered: <span className="font-semibold">{item.orderedQuantity}</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            ₱{(item.orderedQuantity * item.unitCost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </div>
                      </div>
                      
                      {/* Input Fields - Only enabled when checked */}
                      {item.checked && (
                        <>
                          <div className="grid grid-cols-12 gap-3">
                            <div className="col-span-3">
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Received Qty *
                              </label>
                              <div className="flex items-center space-x-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newQty = Math.max(0, item.receivedQuantity - 1)
                                    updateChecklistItem(index, 'receivedQuantity', newQty)
                                  }}
                                  className="w-8 h-9 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors border border-gray-300"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                  </svg>
                                </button>
                                <input
                                  type="number"
                                  value={item.receivedQuantity}
                                  onChange={(e) => updateChecklistItem(index, 'receivedQuantity', parseInt(e.target.value) || 0)}
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-center focus:ring-2 focus:ring-blue-500"
                                  min="0"
                                  required
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newQty = item.receivedQuantity + 1
                                    updateChecklistItem(index, 'receivedQuantity', newQty)
                                  }}
                                  className="w-8 h-9 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors border border-gray-300"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                            
                            <div className="col-span-3">
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Difference
                              </label>
                              <div className={`px-3 py-2 rounded-lg text-sm font-semibold ${
                                item.receivedQuantity - item.orderedQuantity < 0 
                                  ? 'bg-red-100 text-red-700' 
                                  : item.receivedQuantity - item.orderedQuantity > 0 
                                  ? 'bg-amber-100 text-amber-700' 
                                  : 'bg-green-100 text-green-700'
                              }`}>
                                {item.receivedQuantity - item.orderedQuantity > 0 ? '+' : ''}
                                {item.receivedQuantity - item.orderedQuantity}
                              </div>
                            </div>
                            
                            <div className="col-span-3">
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Condition
                              </label>
                              <select
                                value={item.condition}
                                onChange={(e) => updateChecklistItem(index, 'condition', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="good">Good</option>
                                <option value="damaged">Damaged</option>
                                <option value="partial">Partial</option>
                              </select>
                            </div>
                            
                            <div className="col-span-3">
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Notes
                              </label>
                              <input
                                type="text"
                                value={item.notes}
                                onChange={(e) => updateChecklistItem(index, 'notes', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                placeholder="Optional"
                              />
                            </div>
                          </div>
                          
                          {/* Total Cost Row */}
                          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                            <span className="text-sm text-gray-600">Received Total:</span>
                            <span className="text-sm font-semibold text-gray-900">
                              ₱{(item.receivedQuantity * item.unitCost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary Section */}
          {getSummary().itemsChecked > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Delivery Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Items Checked:</span>
                  <span className="ml-2 font-semibold text-gray-900">{getSummary().itemsChecked}</span>
                </div>
                <div>
                  <span className="text-gray-600">Total Ordered:</span>
                  <span className="ml-2 font-semibold text-gray-900">{getSummary().totalOrdered} units</span>
                </div>
                <div>
                  <span className="text-gray-600">Total Received:</span>
                  <span className="ml-2 font-semibold text-gray-900">{getSummary().totalReceived} units</span>
                </div>
                <div>
                  <span className="text-gray-600">Discrepancies:</span>
                  <span className={`ml-2 font-semibold ${
                    getSummary().hasDiscrepancies ? 'text-amber-600' : 'text-green-600'
                  }`}>
                    {getSummary().hasDiscrepancies ? `${getSummary().shortCount + getSummary().overCount} items` : 'None'}
                  </span>
                </div>
              </div>
              
              {/* Cost Summary */}
              <div className="mt-4 pt-4 border-t border-gray-300">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Ordered Cost:</span>
                    <span className="ml-2 font-semibold text-gray-900">
                      ₱{getSummary().totalOrderedCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Received Cost:</span>
                    <span className="ml-2 font-semibold text-gray-900">
                      ₱{getSummary().totalReceivedCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600">Cost Difference:</span>
                    <span className={`ml-2 font-semibold ${
                      getSummary().costDifference < 0 ? 'text-red-600' :
                      getSummary().costDifference > 0 ? 'text-amber-600' :
                      'text-green-600'
                    }`}>
                      {getSummary().costDifference > 0 ? '+' : ''}
                      ₱{Math.abs(getSummary().costDifference).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Received By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Received By</label>
            <input
              type="text"
              value={receivedBy}
              onChange={(e) => setReceivedBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Your name"
              required
            />
          </div>

          {/* Delivery Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Notes</label>
            <textarea
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              rows="3"
              placeholder="Any additional notes about the delivery..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="ghost"
              onClick={() => setShowReceiveModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmClick}
              className="bg-black text-white hover:bg-gray-800"
              disabled={getSummary().itemsChecked === 0}
            >
              Confirm Receipt ({getSummary().itemsChecked} items)
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirm Delivery Receipt"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <h4 className="font-medium text-amber-900 mb-1">Confirm Delivery Receipt</h4>
                <p className="text-sm text-amber-800">
                  You are about to confirm receipt of this delivery. This action will update inventory levels and cannot be undone.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Items to receive:</span>
              <span className="font-semibold text-gray-900">{getSummary().itemsChecked}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total units ordered:</span>
              <span className="font-semibold text-gray-900">{getSummary().totalOrdered}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total units received:</span>
              <span className="font-semibold text-gray-900">{getSummary().totalReceived}</span>
            </div>
            <div className="border-t border-gray-200 my-2"></div>
            <div className="flex justify-between">
              <span className="text-gray-600">Ordered cost:</span>
              <span className="font-semibold text-gray-900">
                ₱{getSummary().totalOrderedCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Received cost:</span>
              <span className="font-semibold text-gray-900">
                ₱{getSummary().totalReceivedCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Cost difference:</span>
              <span className={`font-semibold ${
                getSummary().costDifference < 0 ? 'text-red-600' :
                getSummary().costDifference > 0 ? 'text-amber-600' :
                'text-green-600'
              }`}>
                {getSummary().costDifference > 0 ? '+' : ''}
                ₱{Math.abs(getSummary().costDifference).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            {getSummary().hasDiscrepancies && (
              <>
                <div className="border-t border-gray-200 my-2"></div>
                <div className="flex justify-between text-amber-700">
                  <span className="font-medium">⚠️ Discrepancies detected:</span>
                  <span className="font-semibold">{getSummary().shortCount + getSummary().overCount} items</span>
                </div>
                {getSummary().shortCount > 0 && (
                  <div className="flex justify-between text-red-600 text-xs">
                    <span>Short deliveries:</span>
                    <span className="font-semibold">{getSummary().shortCount} items</span>
                  </div>
                )}
                {getSummary().overCount > 0 && (
                  <div className="flex justify-between text-amber-600 text-xs">
                    <span>Over deliveries:</span>
                    <span className="font-semibold">{getSummary().overCount} items</span>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="ghost"
              onClick={() => setShowConfirmModal(false)}
            >
              Go Back
            </Button>
            <Button
              onClick={handleSubmitReceipt}
              className="bg-black text-white hover:bg-gray-800"
            >
              Yes, Confirm Receipt
            </Button>
          </div>
        </div>
      </Modal>

      {/* Print Preview Modal */}
      <Modal
        isOpen={showPrintPreview}
        onClose={() => setShowPrintPreview(false)}
        title="Delivery Receipt Confirmed"
        size="md"
      >
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delivery Received Successfully!</h3>
            <p className="text-sm text-gray-600">
              The delivery has been confirmed and inventory has been updated.
            </p>
          </div>

          <div className="flex justify-center space-x-3 pt-4">
            <Button
              variant="ghost"
              onClick={() => setShowPrintPreview(false)}
            >
              Close
            </Button>
            <Button
              onClick={handlePrintReceipt}
              className="bg-black text-white hover:bg-gray-800"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print Receipt
            </Button>
          </div>
        </div>
      </Modal>

      {/* Filter Modal */}
      <Modal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        title="Filter Deliveries"
        size="md"
      >
        <div className="space-y-6">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <div className="space-y-2">
              {['all', 'approved', 'in-transit', 'delivered'].map((status) => (
                <label key={status} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value={status}
                    checked={statusFilter === status}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-4 h-4 text-black border-gray-300 focus:ring-black"
                  />
                  <span className="text-sm text-gray-700 capitalize">
                    {status === 'all' ? 'All Statuses' : status.replace('-', ' ')}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({statusCounts[status]})
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Date Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Expected Delivery Date Range</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">From</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black/20 focus:border-black/20"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black/20 focus:border-black/20"
                />
              </div>
            </div>
            {(dateFrom || dateTo) && (
              <button
                onClick={() => {
                  setDateFrom('')
                  setDateTo('')
                }}
                className="mt-2 text-xs text-gray-600 hover:text-gray-900 underline"
              >
                Clear date range
              </button>
            )}
          </div>

          {/* Active Filters Summary */}
          {(statusFilter !== 'all' || dateFrom || dateTo) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-xs font-medium text-blue-900 mb-2">Active Filters:</div>
              <div className="flex flex-wrap gap-2">
                {statusFilter !== 'all' && (
                  <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    Status: {statusFilter.replace('-', ' ')}
                  </span>
                )}
                {dateFrom && (
                  <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    From: {new Date(dateFrom).toLocaleDateString()}
                  </span>
                )}
                {dateTo && (
                  <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    To: {new Date(dateTo).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="ghost"
              onClick={() => {
                setStatusFilter('all')
                setDateFrom('')
                setDateTo('')
                setShowFilterModal(false)
              }}
            >
              Reset All
            </Button>
            <Button
              onClick={() => setShowFilterModal(false)}
              className="bg-black text-white hover:bg-gray-800"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delivery Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title={`Delivery Details - ${selectedDeliveryDetails?.orderNumber}`}
        size="xl"
      >
        {selectedDeliveryDetails && (
          <div className="space-y-6">
            {/* Order Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Order Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Order Number:</span>
                  <span className="ml-2 font-semibold text-gray-900">{selectedDeliveryDetails.orderNumber}</span>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <span className="ml-2">
                    <Badge variant={
                      selectedDeliveryDetails.status === 'delivered' ? 'success' :
                      selectedDeliveryDetails.status === 'in-transit' ? 'warning' :
                      'normal'
                    }>
                      {selectedDeliveryDetails.status.replace('-', ' ').toUpperCase()}
                    </Badge>
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Supplier:</span>
                  <span className="ml-2 font-semibold text-gray-900">{selectedDeliveryDetails.supplier?.name || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-600">Expected Delivery:</span>
                  <span className="ml-2 font-semibold text-gray-900">
                    {new Date(selectedDeliveryDetails.expectedDelivery).toLocaleDateString()}
                  </span>
                </div>
                {selectedDeliveryDetails.deliveredAt && (
                  <div>
                    <span className="text-gray-600">Delivered At:</span>
                    <span className="ml-2 font-semibold text-gray-900">
                      {new Date(selectedDeliveryDetails.deliveredAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="ml-2 font-semibold text-gray-900">
                    ₱{selectedDeliveryDetails.totalAmount?.toLocaleString() || '0'}
                  </span>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Order Items</h4>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Cost</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedDeliveryDetails.items?.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{item.itemName || 'Unknown Item'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.quantity}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          ₱{item.unitCost?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                          ₱{((item.quantity * (item.unitCost || 0))).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t border-gray-200">
                    <tr>
                      <td colSpan="3" className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                        Total Amount:
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-900">
                        ₱{selectedDeliveryDetails.totalAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Delivery Receipt Info (if delivered) */}
            {selectedDeliveryDetails.deliveryReceipt && (
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <h4 className="font-medium text-green-900 mb-3">Delivery Receipt</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-green-700">Received By:</span>
                    <span className="ml-2 font-semibold text-green-900">
                      {selectedDeliveryDetails.deliveryReceipt.receivedBy}
                    </span>
                  </div>
                  <div>
                    <span className="text-green-700">Received At:</span>
                    <span className="ml-2 font-semibold text-green-900">
                      {new Date(selectedDeliveryDetails.deliveryReceipt.receivedAt).toLocaleString()}
                    </span>
                  </div>
                  {selectedDeliveryDetails.deliveryReceipt.notes && (
                    <div className="col-span-2">
                      <span className="text-green-700">Notes:</span>
                      <p className="mt-1 text-green-900">{selectedDeliveryDetails.deliveryReceipt.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                variant="ghost"
                onClick={() => setShowDetailsModal(false)}
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  setShowDetailsModal(false)
                  handlePrintSingleReceipt(selectedDeliveryDetails)
                }}
                className="bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print Receipt
              </Button>
              {selectedDeliveryDetails.status !== 'delivered' && (
                <Button
                  onClick={() => {
                    setShowDetailsModal(false)
                    handleReceiveDelivery(selectedDeliveryDetails)
                  }}
                  className="bg-black text-white hover:bg-gray-800"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Receive Delivery
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className="bg-white border-l-4 border-green-500 rounded-lg shadow-2xl p-4 max-w-md">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">Delivery Received!</h4>
                <p className="text-sm text-gray-600 whitespace-pre-line">{successMessage}</p>
              </div>
              <button
                onClick={() => setShowSuccessToast(false)}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
