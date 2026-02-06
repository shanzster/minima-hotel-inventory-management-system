'use client'

import { useState, useEffect } from 'react'
import { usePageTitle } from '../../../hooks/usePageTitle'
import InventoryTable from '../../../components/inventory/InventoryTable'
import FilterBar from '../../../components/inventory/FilterBar'
import Button from '../../../components/ui/Button'
import Modal from '../../../components/ui/Modal'
import Badge from '../../../components/ui/Badge'
import EnhancedPurchaseOrderModal from '../../../components/inventory/EnhancedPurchaseOrderModal'
import PurchaseOrderDetailsModal from '../../../components/inventory/PurchaseOrderDetailsModal'
import EmailPurchaseOrderModal from '../../../components/inventory/EmailPurchaseOrderModal'
import ReceivePOModal from '../../../components/inventory/ReceivePOModal'
import { formatCurrency } from '../../../lib/utils'
import purchaseOrderApi from '../../../lib/purchaseOrderApi'
import inventoryApi from '../../../lib/inventoryApi'
import { useAuth } from '../../../hooks/useAuth'

export default function PurchaseOrdersPage() {
  const { setTitle } = usePageTitle()
  const { hasRole, user } = useAuth()
  const isPurchasingOfficer = hasRole('purchasing-officer')
  const [purchaseOrders, setPurchaseOrders] = useState([])
  const [filteredOrders, setFilteredOrders] = useState([])
  const [availableItems, setAvailableItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUsingFirebase, setIsUsingFirebase] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortDirection, setSortDirection] = useState('desc')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showPurchaseOrderDetailsModal, setShowPurchaseOrderDetailsModal] = useState(false)
  const [selectedPurchaseOrder, setSelectedPurchaseOrder] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 25
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [selectedOrderForEmail, setSelectedOrderForEmail] = useState(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [showReceiveModal, setShowReceiveModal] = useState(false)
  const [orderToReceive, setOrderToReceive] = useState(null)

  // Export to CSV function
  const exportToCSV = () => {
    const headers = ['Order Number', 'Supplier', 'Status', 'Priority', 'Total Amount', 'Expected Delivery', 'Created Date']
    const csvData = filteredOrders.map(order => [
      order.orderNumber,
      order.supplier.name,
      order.status,
      order.priority,
      order.totalAmount,
      new Date(order.expectedDelivery).toLocaleDateString(),
      new Date(order.createdAt).toLocaleDateString()
    ])

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `purchase-orders-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Print function
  const handlePrint = () => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank')

    // Get current date and time
    const now = new Date()
    const generatedDate = now.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    const generatedTime = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })

    // Calculate summary statistics
    const totalOrders = filteredOrders.length
    const pendingCount = filteredOrders.filter(order => order.status === 'pending').length
    const approvedCount = filteredOrders.filter(order => order.status === 'approved').length
    const totalValue = filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0)

    // Get active filters
    const activeFilters = []
    if (searchQuery) activeFilters.push(`Search: "${searchQuery}"`)
    if (statusFilter) activeFilters.push(`Status: ${statusFilter}`)
    if (priorityFilter) activeFilters.push(`Priority: ${priorityFilter}`)
    if (sortBy !== 'createdAt' || sortDirection !== 'desc') {
      activeFilters.push(`Sort: ${sortBy} (${sortDirection})`)
    }

    // Generate print HTML
    const printHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Purchase Orders Report</title>
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
              font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              font-size: 11px;
              font-weight: 400;
              line-height: 1.4;
              color: #1f2937;
              margin: 0;
              padding: 0;
              background: white;
            }
            
            .report-header {
              border-bottom: 2px solid #1f2937;
              padding-bottom: 16px;
              margin-bottom: 24px;
            }
            
            .report-title {
              font-family: 'Poppins', sans-serif;
              font-size: 24px;
              font-weight: 600;
              color: #1f2937;
              margin: 0 0 8px 0;
            }
            
            .report-subtitle {
              font-family: 'Poppins', sans-serif;
              font-size: 14px;
              font-weight: 400;
              color: #6b7280;
              margin: 0;
            }
            
            .report-meta {
              display: flex;
              justify-content: space-between;
              margin: 16px 0 24px 0;
              font-size: 10px;
              color: #6b7280;
            }
            
            .summary-section {
              margin-bottom: 24px;
            }
            
            .summary-title {
              font-family: 'Poppins', sans-serif;
              font-size: 14px;
              font-weight: 600;
              color: #1f2937;
              margin: 0 0 12px 0;
            }
            
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 16px;
              margin-bottom: 16px;
            }
            
            .summary-item {
              text-align: center;
              padding: 12px;
              background: #f9fafb;
              border-radius: 6px;
            }
            
            .summary-number {
              font-family: 'Poppins', sans-serif;
              font-size: 18px;
              font-weight: 600;
              color: #1f2937;
              margin: 0;
            }
            
            .summary-label {
              font-family: 'Poppins', sans-serif;
              font-size: 10px;
              font-weight: 400;
              color: #6b7280;
              margin: 4px 0 0 0;
            }
            
            .filters-section {
              margin-bottom: 24px;
            }
            
            .filters-title {
              font-family: 'Poppins', sans-serif;
              font-size: 12px;
              font-weight: 500;
              color: #1f2937;
              margin: 0 0 8px 0;
            }
            
            .filters-list {
              font-size: 10px;
              color: #6b7280;
              line-height: 1.6;
            }
            
            .table-section {
              margin-bottom: 24px;
            }
            
            .table-title {
              font-family: 'Poppins', sans-serif;
              font-size: 14px;
              font-weight: 600;
              color: #1f2937;
              margin: 0 0 16px 0;
            }
            
            .orders-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 16px;
            }
            
            .orders-table th {
              font-family: 'Poppins', sans-serif;
              background: #f9fafb;
              padding: 8px 6px;
              text-align: left;
              font-weight: 500;
              font-size: 10px;
              color: #374151;
              border-bottom: 1px solid #e5e7eb;
            }
            
            .orders-table td {
              font-family: 'Poppins', sans-serif;
              padding: 6px;
              font-size: 10px;
              font-weight: 400;
              color: #1f2937;
              border-bottom: 1px solid #f3f4f6;
            }
            
            .orders-table tr:nth-child(even) {
              background: #fafafa;
            }
            
            .status-pending { font-family: 'Poppins', sans-serif; color: #d97706; font-weight: 500; }
            .status-approved { font-family: 'Poppins', sans-serif; color: #059669; font-weight: 500; }
            .status-in-transit { font-family: 'Poppins', sans-serif; color: #2563eb; font-weight: 500; }
            .status-delivered { font-family: 'Poppins', sans-serif; color: #059669; font-weight: 400; }
            
            .priority-high { font-family: 'Poppins', sans-serif; color: #dc2626; font-weight: 500; }
            .priority-normal { font-family: 'Poppins', sans-serif; color: #374151; font-weight: 400; }
            .priority-low { font-family: 'Poppins', sans-serif; color: #6b7280; font-weight: 400; }
            
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
          <!-- Report Header -->
          <div class="report-header">
            <h1 class="report-title">Purchase Orders Report</h1>
            <p class="report-subtitle">Comprehensive purchase order status and analysis</p>
          </div>
          
          <!-- Report Metadata -->
          <div class="report-meta">
            <div>
              <strong>Generated by:</strong> Purchasing Officer<br>
              <strong>Generated on:</strong> ${generatedDate} at ${generatedTime}
            </div>
            <div>
              <strong>Total Orders:</strong> ${totalOrders}<br>
              <strong>Report Type:</strong> Purchase Orders
            </div>
          </div>
          
          <!-- Summary Section -->
          <div class="summary-section">
            <h2 class="summary-title">Executive Summary</h2>
            <div class="summary-grid">
              <div class="summary-item">
                <p class="summary-number">${totalOrders}</p>
                <p class="summary-label">Total Orders</p>
              </div>
              <div class="summary-item">
                <p class="summary-number" style="color: #d97706;">${pendingCount}</p>
                <p class="summary-label">Pending</p>
              </div>
              <div class="summary-item">
                <p class="summary-number" style="color: #059669;">${approvedCount}</p>
                <p class="summary-label">Approved</p>
              </div>
              <div class="summary-item">
                <p class="summary-number">₱${totalValue.toLocaleString()}</p>
                <p class="summary-label">Total Value</p>
              </div>
            </div>
          </div>
          
          <!-- Active Filters -->
          ${activeFilters.length > 0 ? `
          <div class="filters-section">
            <h3 class="filters-title">Applied Filters</h3>
            <div class="filters-list">
              ${activeFilters.map(filter => `• ${filter}`).join('<br>')}
            </div>
          </div>
          ` : ''}
          
          <!-- Purchase Orders Table -->
          <div class="table-section">
            <h2 class="table-title">Purchase Order Details</h2>
            <table class="orders-table">
              <thead>
                <tr>
                  <th style="width: 15%;">Order Number</th>
                  <th style="width: 20%;">Supplier</th>
                  <th style="width: 12%;">Status</th>
                  <th style="width: 10%;">Priority</th>
                  <th style="width: 15%;">Total Amount</th>
                  <th style="width: 15%;">Expected Delivery</th>
                  <th style="width: 13%;">Created Date</th>
                </tr>
              </thead>
              <tbody>
                ${filteredOrders.map(order => {
      const statusClass = `status-${order.status}`
      const priorityClass = `priority-${order.priority}`

      return `
                    <tr>
                      <td><strong>${order.orderNumber}</strong></td>
                      <td><strong>${order.supplier.name}</strong><br><small>${order.supplier.contactPerson}</small></td>
                      <td><span class="${statusClass}">${order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('-', ' ')}</span></td>
                      <td><span class="${priorityClass}">${order.priority.charAt(0).toUpperCase() + order.priority.slice(1)}</span></td>
                      <td><strong>₱${order.totalAmount.toLocaleString()}</strong></td>
                      <td>${new Date(order.expectedDelivery).toLocaleDateString()}</td>
                      <td>${new Date(order.createdAt).toLocaleDateString()}</td>
                    </tr>
                  `
    }).join('')}
              </tbody>
            </table>
          </div>
          
          <!-- Footer -->
          <div class="footer">
            <p>This report was generated automatically by the Purchase Order Management System</p>
            <p>Confidential - For internal use only</p>
          </div>
        </body>
      </html>
    `

    // Write content and print
    printWindow.document.write(printHTML)
    printWindow.document.close()

    // Wait for content to load then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 250)
    }
  }

  // Set page title
  useEffect(() => {
    setTitle('Purchase Orders')
  }, [setTitle])

  // Load purchase orders and inventory data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        const [orders, items] = await Promise.all([
          purchaseOrderApi.getAll(),
          inventoryApi.getAll()
        ])
        setPurchaseOrders(orders)
        setAvailableItems(items)

        // Check if we're using Firebase
        try {
          const testOrders = await purchaseOrderApi.getAll()
          setIsUsingFirebase(testOrders !== null && testOrders.length >= 0)
        } catch {
          setIsUsingFirebase(false)
        }
      } catch (error) {
        console.error('Error loading purchase orders:', error)
        setIsUsingFirebase(false)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()

    // Set up real-time listener for purchase orders
    const unsubscribe = purchaseOrderApi.onPurchaseOrdersChange((orders) => {
      setPurchaseOrders(orders)
    })

    return unsubscribe
  }, [])

  // Calculate summary metrics (using state data)
  const pendingOrders = purchaseOrders.filter(po => po.status === 'pending')
  const approvedOrders = purchaseOrders.filter(po => po.status === 'approved')
  const inTransitOrders = purchaseOrders.filter(po => po.status === 'in-transit')
  const deliveredOrders = purchaseOrders.filter(po => po.status === 'delivered')

  // Handle card clicks for filtering
  const handleAllOrdersClick = () => {
    setStatusFilter('')
  }

  const handlePendingClick = () => {
    setStatusFilter('pending')
  }

  const handleApprovedClick = () => {
    setStatusFilter('approved')
  }

  const handleInTransitClick = () => {
    setStatusFilter('in-transit')
  }

  const handleDeliveredClick = () => {
    setStatusFilter('delivered')
  }

  // Apply filters and search
  useEffect(() => {
    let filtered = [...purchaseOrders]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(order =>
        order.orderNumber.toLowerCase().includes(query) ||
        order.supplier.name.toLowerCase().includes(query) ||
        order.supplier.contactPerson.toLowerCase().includes(query)
      )
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(order => order.status === statusFilter)
    }

    // Priority filter
    if (priorityFilter) {
      filtered = filtered.filter(order => order.priority === priorityFilter)
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue = a[sortBy]
      let bValue = b[sortBy]

      // Handle special sorting cases
      if (sortBy === 'expectedDelivery' || sortBy === 'createdAt') {
        aValue = new Date(aValue)
        bValue = new Date(bValue)
      }

      if (sortBy === 'supplier') {
        aValue = a.supplier.name.toLowerCase()
        bValue = b.supplier.name.toLowerCase()
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    setFilteredOrders(filtered)
    setCurrentPage(1) // Reset to page 1 when filters change
  }, [purchaseOrders, searchQuery, statusFilter, priorityFilter, sortBy, sortDirection])

  // Get paginated data
  const getPaginatedData = () => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return filteredOrders.slice(startIndex, endIndex)
  }

  // Get pagination info
  const getPaginationInfo = () => {
    return {
      page: currentPage,
      pageSize: pageSize,
      total: filteredOrders.length
    }
  }

  // Handle page change
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage)
  }

  // Handle row click to view order details
  const handleRowClick = (order) => {
    setSelectedPurchaseOrder(order)
    setShowPurchaseOrderDetailsModal(true)
  }

  // Handle create purchase order
  const handleCreateOrder = async (orderData) => {
    try {
      console.log('Received order data:', orderData)
      console.log('Expected delivery from orderData:', orderData.expectedDelivery)

      const newOrder = {
        orderNumber: `PO-2024-${String(purchaseOrders.length + 1).padStart(3, '0')}`,
        ...orderData,
        // Ensure expectedDelivery is properly formatted as ISO string
        expectedDelivery: orderData.expectedDelivery ?
          (orderData.expectedDelivery instanceof Date ?
            orderData.expectedDelivery.toISOString() :
            new Date(orderData.expectedDelivery).toISOString()
          ) : null,
        status: 'pending',
        requestedBy: 'purchasing-officer-001', // Would come from auth context
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      console.log('Final order to be created:', newOrder)
      console.log('Final expected delivery:', newOrder.expectedDelivery)

      await purchaseOrderApi.create(newOrder)
      setShowCreateModal(false)

      // Show success modal instead of alert
      setSuccessMessage(`Purchase order ${newOrder.orderNumber} created successfully!`)
      setShowSuccessModal(true)

      // Auto-close success modal after 3 seconds
      setTimeout(() => {
        setShowSuccessModal(false)
      }, 3000)
    } catch (error) {
      console.error('Error creating purchase order:', error)
      alert('Failed to create purchase order. Please try again.')
    }
  }

  // Handle email purchase order
  const handleEmailOrder = (order) => {
    setSelectedOrderForEmail(order)
    setShowEmailModal(true)
  }

  // Column definitions for purchase orders table
  const columns = [
    {
      key: 'orderNumber',
      label: 'Order #',
      sortable: true,
      render: (value, order) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-sm text-gray-500">
            {new Date(order.createdAt).toLocaleDateString()}
          </div>
        </div>
      )
    },
    {
      key: 'supplier',
      label: 'Supplier',
      sortable: true,
      render: (supplier) => (
        <div>
          <div className="font-medium">{supplier.name}</div>
          <div className="text-sm text-gray-500">{supplier.contactPerson}</div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (status) => {
        const variants = {
          'pending': 'warning',
          'approved': 'success',
          'in-transit': 'info',
          'delivered': 'success'
        }
        return (
          <Badge variant={variants[status] || 'normal'}>
            {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
          </Badge>
        )
      }
    },
    {
      key: 'priority',
      label: 'Priority',
      sortable: true,
      render: (priority) => {
        const variants = {
          'high': 'critical',
          'normal': 'normal',
          'low': 'info'
        }
        return (
          <Badge variant={variants[priority] || 'normal'}>
            {priority.charAt(0).toUpperCase() + priority.slice(1)}
          </Badge>
        )
      }
    },
    {
      key: 'totalAmount',
      label: 'Total Amount',
      sortable: true,
      render: (value) => formatCurrency(value)
    },
    {
      key: 'expectedDelivery',
      label: 'Expected Delivery',
      sortable: true,
      render: (value) => {
        const deliveryDate = new Date(value)
        const now = new Date()
        const daysUntilDelivery = Math.ceil((deliveryDate - now) / (1000 * 60 * 60 * 24))

        let colorClass = 'text-gray-700'
        if (daysUntilDelivery < 0) {
          colorClass = 'text-red-600 font-medium'
        } else if (daysUntilDelivery <= 2) {
          colorClass = 'text-orange-600 font-medium'
        }

        return (
          <span className={colorClass}>
            {deliveryDate.toLocaleDateString()}
          </span>
        )
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (value, order) => {
        // Quick action functions
        const handleQuickStatusUpdate = async (newStatus, reason) => {
          try {
            const statusUpdate = {
              status: newStatus,
              statusHistory: [
                ...(order.statusHistory || []),
                {
                  status: newStatus,
                  reason: reason,
                  changedBy: 'inventory-controller-001',
                  changedAt: new Date().toISOString()
                }
              ],
              updatedAt: new Date().toISOString()
            }

            // Add specific timestamps for certain status changes
            if (newStatus === 'approved') {
              statusUpdate.approvedAt = new Date().toISOString()
              statusUpdate.approvedBy = 'inventory-controller-001'
            } else if (newStatus === 'rejected') {
              statusUpdate.rejectedAt = new Date().toISOString()
              statusUpdate.rejectedBy = 'inventory-controller-001'
            }

            await purchaseOrderApi.update(order.id, statusUpdate)

            // Show success feedback
            const statusLabel = newStatus.charAt(0).toUpperCase() + newStatus.slice(1)
            setSuccessMessage(`✅ Order ${statusLabel}!\n\nOrder ${order.orderNumber} has been ${statusLabel.toLowerCase()}.`)
            setShowSuccessModal(true)

            // Auto-close success modal after 3 seconds
            setTimeout(() => {
              setShowSuccessModal(false)
            }, 3000)

          } catch (error) {
            console.error('Error updating status:', error)
            alert('❌ Failed to update status. Please try again.')
          }
        }

        return (
          <div className="flex items-center space-x-2">
            {/* Approve/Reject buttons for pending orders (inventory controllers only) */}
            {hasRole('inventory-controller') && order.status === 'pending' && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleQuickStatusUpdate('approved', 'Order approved for procurement')
                  }}
                  className="inline-flex items-center px-3 py-1 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors shadow-sm"
                  title="Approve this order"
                >
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Approve
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleQuickStatusUpdate('rejected', 'Order rejected by inventory controller')
                  }}
                  className="inline-flex items-center px-3 py-1 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors shadow-sm"
                  title="Reject this order"
                >
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Reject
                </button>
              </>
            )}

            {/* Email button for approved orders */}
            {order.status === 'approved' && order.supplier?.email && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleEmailOrder(order)
                }}
                className="inline-flex items-center px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors backdrop-blur-sm"
                title="Email this order to supplier"
              >
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email
              </button>
            )}

            {/* RECEIVE ITEMS BUTTON - High Visibility for In Transit */}
            {order.status?.toLowerCase()?.includes('transit') && (isPurchasingOfficer || hasRole('inventory-controller')) ? (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setOrderToReceive(order)
                  setShowReceiveModal(true)
                }}
                className="inline-flex items-center px-6 py-2.5 text-[11px] font-black tracking-tighter text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all shadow-[0_0_20px_rgba(37,99,235,0.5)] active:scale-95 animate-pulse"
                title="Receive items from this order"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
                RECEIVE ITEMS NOW
              </button>
            ) : (
              <div className="flex items-center space-x-2 opacity-60">
                <div className={`w-2 h-2 rounded-full ${order.status?.toLowerCase() === 'delivered' ? 'bg-green-400' : 'bg-gray-300'}`}></div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-3 py-1 bg-white border border-gray-100 rounded-md">
                  {order.status?.toLowerCase() === 'delivered' ? 'COMPLETED' : 'VIEW DETAILS'}
                </span>
              </div>
            )}
          </div>
        )
      }
    }
  ]

  return (
    <div className="p-4 mx-2">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold text-gray-900 mb-1">Purchase Orders</h1>
            <p className="text-gray-500 font-body text-sm">
              Create and manage purchase orders
            </p>
          </div>
          <div className="flex flex-col items-end space-y-2">
            {isPurchasingOfficer && (
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-black text-white hover:bg-gray-800 backdrop-blur-sm whitespace-nowrap px-8"
              >
                Create Purchase Order
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Purchase Order Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {/* All Orders Card */}
        <div
          className={`bg-white/80 backdrop-blur-xl rounded-lg border p-4 cursor-pointer transition-all duration-200 ease-out hover:shadow-xl shadow-xl ${!statusFilter ? 'border-slate-700 bg-slate-50/80' : 'border-white/20'
            }`}
          onClick={handleAllOrdersClick}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-heading font-medium text-sm text-gray-600">All Orders</h3>
                <p className="text-2xl font-heading font-bold text-black">
                  {purchaseOrders.length}
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500">Total orders</p>
        </div>

        {/* Pending Orders Card */}
        <div
          className={`bg-white/80 backdrop-blur-xl rounded-lg border p-4 cursor-pointer transition-all duration-200 ease-out hover:shadow-xl shadow-xl ${statusFilter === 'pending' ? 'border-amber-700 bg-amber-50/80' :
            pendingOrders.length > 0 ? 'border-amber-200 bg-amber-50/50' : 'border-white/20'
            }`}
          onClick={handlePendingClick}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className={`font-heading font-medium text-sm ${pendingOrders.length > 0 ? 'text-amber-700' : 'text-gray-600'
                  }`}>Pending</h3>
                <p className={`text-2xl font-heading font-bold ${pendingOrders.length > 0 ? 'text-amber-600' : 'text-gray-700'
                  }`}>
                  {pendingOrders.length}
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            {pendingOrders.length > 0 ? 'Awaiting approval' : 'No pending orders'}
          </p>
        </div>

        {/* Approved Orders Card */}
        <div
          className={`bg-white/80 backdrop-blur-xl rounded-lg border p-4 cursor-pointer transition-all duration-200 ease-out hover:shadow-xl shadow-xl ${statusFilter === 'approved' ? 'border-green-700 bg-green-50/80' :
            approvedOrders.length > 0 ? 'border-green-200 bg-green-50/50' : 'border-white/20'
            }`}
          onClick={handleApprovedClick}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className={`font-heading font-medium text-sm ${approvedOrders.length > 0 ? 'text-green-700' : 'text-gray-600'
                  }`}>Approved</h3>
                <p className={`text-2xl font-heading font-bold ${approvedOrders.length > 0 ? 'text-green-600' : 'text-gray-700'
                  }`}>
                  {approvedOrders.length}
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            {approvedOrders.length > 0 ? 'Ready for delivery' : 'No approved orders'}
          </p>
        </div>

        {/* In Transit Orders Card */}
        <div
          className={`bg-white/80 backdrop-blur-xl rounded-lg border p-4 cursor-pointer transition-all duration-200 ease-out hover:shadow-xl shadow-xl ${statusFilter === 'in-transit' ? 'border-blue-700 bg-blue-50/80' :
            inTransitOrders.length > 0 ? 'border-blue-200 bg-blue-50/50' : 'border-white/20'
            }`}
          onClick={handleInTransitClick}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className={`font-heading font-medium text-sm ${inTransitOrders.length > 0 ? 'text-blue-700' : 'text-gray-600'
                  }`}>In Transit</h3>
                <p className={`text-2xl font-heading font-bold ${inTransitOrders.length > 0 ? 'text-blue-600' : 'text-gray-700'
                  }`}>
                  {inTransitOrders.length}
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            {inTransitOrders.length > 0 ? 'Being delivered' : 'No orders in transit'}
          </p>
        </div>

        {/* Delivered Orders Card */}
        <div
          className={`bg-white/80 backdrop-blur-xl rounded-lg border p-4 cursor-pointer transition-all duration-200 ease-out hover:shadow-xl shadow-xl ${statusFilter === 'delivered' ? 'border-green-700 bg-green-50/80' :
            deliveredOrders.length > 0 ? 'border-green-200 bg-green-50/50' : 'border-white/20'
            }`}
          onClick={handleDeliveredClick}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className={`font-heading font-medium text-sm ${deliveredOrders.length > 0 ? 'text-green-700' : 'text-gray-600'
                  }`}>Delivered</h3>
                <p className={`text-2xl font-heading font-bold ${deliveredOrders.length > 0 ? 'text-green-600' : 'text-gray-700'
                  }`}>
                  {deliveredOrders.length}
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            {deliveredOrders.length > 0 ? 'Completed orders' : 'No delivered orders'}
          </p>
        </div>
      </div>

      {/* Purchase Orders Table */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-lg shadow-xl">
        <div className="border-b border-white/20 px-4 py-3">
          <h3 className="font-heading font-medium text-base">
            Purchase Orders
            <span className="text-gray-500 font-normal ml-2 text-sm">
              ({filteredOrders.length} orders)
            </span>
          </h3>
        </div>

        {/* Search Bar and Action Buttons Row */}
        <div className="border-b border-white/20 p-4">
          <div className="flex items-center justify-between">
            {/* Search Bar */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search purchase orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/60 backdrop-blur-sm border border-white/20 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black/20 transition-all"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3 ml-4">
              {/* Filter Button */}
              <button
                onClick={() => setShowFilterModal(true)}
                className="inline-flex items-center px-3 py-2 bg-white/60 backdrop-blur-sm border border-white/20 rounded-lg text-sm text-gray-700 hover:bg-white/80 transition-all"
              >
                <svg className="w-4 h-4 mr-2 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                </svg>
                Filter
              </button>

              {/* Print Button */}
              <button
                onClick={handlePrint}
                className="inline-flex items-center px-3 py-2 bg-white/60 backdrop-blur-sm border border-white/20 rounded-lg text-sm text-gray-700 hover:bg-white/80 transition-all"
              >
                <svg className="w-4 h-4 mr-2 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print
              </button>

              {/* Export to CSV Button */}
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

        {/* Enhanced Purchase Orders Table */}
        <div className="p-4">
          {getPaginatedData().length === 0 ? (
            <div className="text-center py-12">
              <svg className="h-12 w-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500 mb-4 text-sm">
                {isUsingFirebase && purchaseOrders.length === 0 ? "No purchase orders yet" : "No orders found"}
              </p>
            </div>
          ) : (
            <>
              {/* Modern Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  {/* Table Header */}
                  <thead>
                    <tr className="border-b border-white/20">
                      <th
                        className="text-left py-3 px-4 font-heading font-medium text-sm text-gray-600 cursor-pointer hover:text-gray-900 transition-colors"
                        onClick={() => {
                          if (sortBy === 'orderNumber') {
                            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                          } else {
                            setSortBy('orderNumber')
                            setSortDirection('asc')
                          }
                        }}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Order Number</span>
                          {sortBy === 'orderNumber' && (
                            <svg className={`w-4 h-4 ${sortDirection === 'asc' ? 'rotate-0' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          )}
                        </div>
                      </th>
                      <th
                        className="text-left py-3 px-4 font-heading font-medium text-sm text-gray-600 cursor-pointer hover:text-gray-900 transition-colors"
                        onClick={() => {
                          if (sortBy === 'supplier') {
                            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                          } else {
                            setSortBy('supplier')
                            setSortDirection('asc')
                          }
                        }}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Supplier</span>
                          {sortBy === 'supplier' && (
                            <svg className={`w-4 h-4 ${sortDirection === 'asc' ? 'rotate-0' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          )}
                        </div>
                      </th>
                      <th className="text-left py-3 px-4 font-heading font-medium text-sm text-gray-600">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 font-heading font-medium text-sm text-gray-600">
                        Priority
                      </th>
                      <th
                        className="text-left py-3 px-4 font-heading font-medium text-sm text-gray-600 cursor-pointer hover:text-gray-900 transition-colors"
                        onClick={() => {
                          if (sortBy === 'totalAmount') {
                            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                          } else {
                            setSortBy('totalAmount')
                            setSortDirection('desc')
                          }
                        }}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Total Amount</span>
                          {sortBy === 'totalAmount' && (
                            <svg className={`w-4 h-4 ${sortDirection === 'asc' ? 'rotate-0' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          )}
                        </div>
                      </th>
                      <th
                        className="text-left py-3 px-4 font-heading font-medium text-sm text-gray-600 cursor-pointer hover:text-gray-900 transition-colors"
                        onClick={() => {
                          if (sortBy === 'expectedDelivery') {
                            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                          } else {
                            setSortBy('expectedDelivery')
                            setSortDirection('asc')
                          }
                        }}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Expected Delivery</span>
                          {sortBy === 'expectedDelivery' && (
                            <svg className={`w-4 h-4 ${sortDirection === 'asc' ? 'rotate-0' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          )}
                        </div>
                      </th>
                      <th className="text-left py-3 px-4 font-heading font-medium text-sm text-gray-600">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  {/* Table Body */}
                  <tbody>
                    {getPaginatedData().map((order, index) => {
                      const deliveryDate = new Date(order.expectedDelivery)
                      const now = new Date()
                      const daysUntilDelivery = Math.ceil((deliveryDate - now) / (1000 * 60 * 60 * 24))

                      return (
                        <tr
                          key={order.id}
                          className="border-b border-white/10 hover:bg-white/20 cursor-pointer transition-all duration-200 backdrop-blur-sm"
                          onClick={() => handleRowClick(order)}
                        >
                          {/* Order Number */}
                          <td className="py-4 px-4">
                            <div>
                              <p className="font-heading font-medium text-gray-900">{order.orderNumber}</p>
                              <p className="text-sm text-gray-500">
                                {new Date(order.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </td>

                          {/* Supplier */}
                          <td className="py-4 px-4">
                            <div>
                              <p className="font-heading font-medium text-gray-900">{order.supplier.name}</p>
                              <p className="text-sm text-gray-500">{order.supplier.contactPerson}</p>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-4 px-4">
                            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${order.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                              order.status === 'approved' ? 'bg-green-100 text-green-800' :
                                order.status === 'in-transit' ? 'bg-blue-100 text-blue-800' :
                                  order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                    'bg-gray-100 text-gray-800'
                              }`}>
                              <div className={`w-2 h-2 rounded-full mr-1 ${order.status === 'pending' ? 'bg-amber-500' :
                                order.status === 'approved' ? 'bg-green-500' :
                                  order.status === 'in-transit' ? 'bg-blue-500' :
                                    order.status === 'delivered' ? 'bg-green-500' : 'bg-gray-500'
                                }`}></div>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('-', ' ')}
                            </div>
                          </td>

                          {/* Priority */}
                          <td className="py-4 px-4">
                            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${order.priority === 'high' ? 'bg-red-100 text-red-800' :
                              order.priority === 'normal' ? 'bg-gray-100 text-gray-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                              {order.priority.charAt(0).toUpperCase() + order.priority.slice(1)}
                            </div>
                          </td>

                          {/* Total Amount */}
                          <td className="py-4 px-4">
                            <p className="font-heading font-bold text-lg text-gray-900">
                              {formatCurrency(order.totalAmount)}
                            </p>
                          </td>

                          {/* Expected Delivery */}
                          <td className="py-4 px-4">
                            <div>
                              <p className={`text-sm font-medium ${daysUntilDelivery < 0 ? 'text-red-600' :
                                daysUntilDelivery <= 2 ? 'text-orange-600' : 'text-gray-700'
                                }`}>
                                {deliveryDate.toLocaleDateString()}
                              </p>
                              {daysUntilDelivery < 0 && (
                                <p className="text-xs text-red-500">Overdue</p>
                              )}
                              {daysUntilDelivery >= 0 && daysUntilDelivery <= 2 && (
                                <p className="text-xs text-orange-500">{daysUntilDelivery} days</p>
                              )}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleRowClick(order)
                                }}
                                className="inline-flex items-center px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors backdrop-blur-sm"
                                title="View Details"
                              >
                                <svg className="w-3 h-3 mr-1 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                View
                              </button>

                              {/* Email Button for Approved Orders */}
                              {order.status === 'approved' && order.supplier?.email && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleEmailOrder(order)
                                  }}
                                  className="inline-flex items-center px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors backdrop-blur-sm"
                                  title="Email to Supplier"
                                >
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                  Email
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {filteredOrders.length > pageSize && (
                <div className="flex items-center justify-between border-t border-white/20 pt-4 mt-4">
                  <div className="text-sm text-gray-500">
                    Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredOrders.length)} of {filteredOrders.length} orders
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm bg-white/60 backdrop-blur-sm border border-white/20 rounded-md hover:bg-white/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-600">
                      Page {currentPage} of {Math.ceil(filteredOrders.length / pageSize)}
                    </span>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= Math.ceil(filteredOrders.length / pageSize)}
                      className="px-3 py-1 text-sm bg-white/60 backdrop-blur-sm border border-white/20 rounded-md hover:bg-white/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Enhanced Filter Modal */}
      <Modal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        size="lg"
      >
        <div className="bg-white/80 backdrop-blur-xl rounded-lg p-6">
          {/* Modal Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/20">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-heading font-bold text-gray-900">Filter Purchase Orders</h3>
                <p className="text-sm text-gray-500">Refine your purchase order view</p>
              </div>
            </div>
            <button
              onClick={() => setShowFilterModal(false)}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Filter Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Status Filter */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-heading font-medium text-gray-700">
                <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Status</span>
              </label>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full appearance-none bg-white border-2 border-gray-300 rounded-lg px-4 py-3 pr-10 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-black focus:border-black cursor-pointer transition-all shadow-sm hover:border-gray-400"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">🟡 Pending</option>
                  <option value="approved">🟢 Approved</option>
                  <option value="in-transit">🔵 In Transit</option>
                  <option value="delivered">✅ Delivered</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Priority Filter */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-heading font-medium text-gray-700">
                <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>Priority</span>
              </label>
              <div className="relative">
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="w-full appearance-none bg-white border-2 border-gray-300 rounded-lg px-4 py-3 pr-10 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-black focus:border-black cursor-pointer transition-all shadow-sm hover:border-gray-400"
                >
                  <option value="">All Priorities</option>
                  <option value="high">🔴 High Priority</option>
                  <option value="normal">⚪ Normal Priority</option>
                  <option value="low">🔵 Low Priority</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Sort Options */}
            <div className="space-y-2 md:col-span-2">
              <label className="flex items-center space-x-2 text-sm font-heading font-medium text-gray-700">
                <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                </svg>
                <span>Sort By</span>
              </label>
              <div className="relative">
                <select
                  value={`${sortBy}-${sortDirection}`}
                  onChange={(e) => {
                    const [field, direction] = e.target.value.split('-')
                    setSortBy(field)
                    setSortDirection(direction)
                  }}
                  className="w-full appearance-none bg-white border-2 border-gray-300 rounded-lg px-4 py-3 pr-10 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-black focus:border-black cursor-pointer transition-all shadow-sm hover:border-gray-400"
                >
                  <option value="orderNumber-asc">📝 Order Number (A-Z)</option>
                  <option value="orderNumber-desc">📝 Order Number (Z-A)</option>
                  <option value="createdAt-desc">📅 Recently Created</option>
                  <option value="createdAt-asc">📅 Oldest First</option>
                  <option value="expectedDelivery-asc">🚚 Delivery Date (Earliest)</option>
                  <option value="expectedDelivery-desc">🚚 Delivery Date (Latest)</option>
                  <option value="totalAmount-desc">💰 Amount (High to Low)</option>
                  <option value="totalAmount-asc">💰 Amount (Low to High)</option>
                  <option value="supplier-asc">🏢 Supplier (A-Z)</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Active Filters Display */}
          {(statusFilter || priorityFilter || sortBy !== 'createdAt' || sortDirection !== 'desc') && (
            <div className="mb-6 p-4 bg-gray-50/80 backdrop-blur-sm rounded-lg border border-white/20">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-heading font-medium text-gray-700">Active Filters</h4>
                <button
                  onClick={() => {
                    setStatusFilter('')
                    setPriorityFilter('')
                    setSortBy('createdAt')
                    setSortDirection('desc')
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Clear All
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {statusFilter && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Status: {statusFilter}
                    <button
                      onClick={() => setStatusFilter('')}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                )}
                {priorityFilter && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Priority: {priorityFilter}
                    <button
                      onClick={() => setPriorityFilter('')}
                      className="ml-1 text-green-600 hover:text-green-800"
                    >
                      ×
                    </button>
                  </span>
                )}
                {(sortBy !== 'createdAt' || sortDirection !== 'desc') && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    Sort: {sortBy} ({sortDirection})
                    <button
                      onClick={() => {
                        setSortBy('createdAt')
                        setSortDirection('desc')
                      }}
                      className="ml-1 text-purple-600 hover:text-purple-800"
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Results Preview */}
          <div className="mb-6 p-4 bg-blue-50/80 backdrop-blur-sm rounded-lg border border-blue-200/50">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium text-blue-800">
                {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'} match your filters
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t border-white/20">
            <button
              onClick={() => {
                setStatusFilter('')
                setPriorityFilter('')
                setSortBy('createdAt')
                setSortDirection('desc')
              }}
              className="inline-flex items-center px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors rounded-lg hover:bg-gray-100"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reset All Filters
            </button>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowFilterModal(false)}
                className="px-6 py-2 text-sm bg-white/60 backdrop-blur-sm border border-white/20 text-gray-700 rounded-lg hover:bg-white/80 transition-all shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowFilterModal(false)}
                className="px-6 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800 transition-all shadow-sm backdrop-blur-sm"
              >
                <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Enhanced Create Purchase Order Modal */}
      <EnhancedPurchaseOrderModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateOrder}
        availableItems={availableItems}
      />

      {/* Purchase Order Details Modal */}
      <PurchaseOrderDetailsModal
        isOpen={showPurchaseOrderDetailsModal}
        onClose={() => {
          setShowPurchaseOrderDetailsModal(false)
          setSelectedPurchaseOrder(null)
        }}
        order={selectedPurchaseOrder}
        onUpdateStatus={async (orderId, statusUpdate) => {
          try {
            await purchaseOrderApi.update(orderId, statusUpdate)
            alert('Purchase order status updated successfully!')
            setShowPurchaseOrderDetailsModal(false)
            setSelectedPurchaseOrder(null)
          } catch (error) {
            console.error('Error updating purchase order status:', error)
            alert('Failed to update purchase order status. Please try again.')
          }
        }}
        isLoading={false}
      />

      {/* Email Purchase Order Modal */}
      <EmailPurchaseOrderModal
        isOpen={showEmailModal}
        onClose={() => {
          setShowEmailModal(false)
          setSelectedOrderForEmail(null)
        }}
        order={selectedOrderForEmail}
      />

      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        size="md"
        centered={true}
      >
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-heading font-bold text-gray-900 mb-2">
            Success!
          </h3>
          <p className="text-gray-600">
            {successMessage}
          </p>
        </div>
      </Modal>
      {/* Receive PO Modal */}
      <ReceivePOModal
        isOpen={showReceiveModal}
        onClose={() => {
          setShowReceiveModal(false)
          setOrderToReceive(null)
        }}
        order={orderToReceive}
        onSuccess={() => {
          setShowReceiveModal(false)
          setOrderToReceive(null)
          // Data will refresh via real-time listener
        }}
      />
    </div >
  )
}