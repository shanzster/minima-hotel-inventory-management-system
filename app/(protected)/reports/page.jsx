'use client'

import { useState, useEffect } from 'react'
import { usePageTitle } from '../../../hooks/usePageTitle'
import InventoryTable from '../../../components/inventory/InventoryTable'
import FilterBar from '../../../components/inventory/FilterBar'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import Modal from '../../../components/ui/Modal'
import { formatCurrency } from '../../../lib/utils'
import { 
  mockInventoryItems,
  mockPurchaseOrders,
  mockTransactions,
  mockAudits,
  mockSuppliers,
  getLowStockItems,
  getCriticalStockItems,
  getExpiringItems
} from '../../../lib/mockData'

export default function ReportsPage() {
  const { setTitle } = usePageTitle()
  const [selectedReport, setSelectedReport] = useState('inventory-summary')
  const [dateRange, setDateRange] = useState('last-30-days')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [sortDirection, setSortDirection] = useState('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [showExportModal, setShowExportModal] = useState(false)
  const pageSize = 25

  // Set page title
  useEffect(() => {
    setTitle('Reports')
  }, [setTitle])

  // Generate report data based on selected report type
  const generateReportData = () => {
    switch (selectedReport) {
      case 'inventory-summary':
        return generateInventorySummaryReport()
      case 'stock-levels':
        return generateStockLevelsReport()
      case 'purchase-orders':
        return generatePurchaseOrdersReport()
      case 'supplier-performance':
        return generateSupplierPerformanceReport()
      case 'audit-compliance':
        return generateAuditComplianceReport()
      case 'transaction-history':
        return generateTransactionHistoryReport()
      case 'expiry-tracking':
        return generateExpiryTrackingReport()
      default:
        return { data: [], summary: {} }
    }
  }

  // Generate data for all report types to show counts in cards
  const getAllReportCounts = () => {
    return {
      'inventory-summary': generateInventorySummaryReport().data.length,
      'stock-levels': generateStockLevelsReport().data.length,
      'purchase-orders': generatePurchaseOrdersReport().data.length,
      'supplier-performance': generateSupplierPerformanceReport().data.length,
      'audit-compliance': generateAuditComplianceReport().data.length,
      'transaction-history': generateTransactionHistoryReport().data.length,
      'expiry-tracking': generateExpiryTrackingReport().data.length
    }
  }

  const generateInventorySummaryReport = () => {
    const totalItems = mockInventoryItems.length
    const totalValue = mockInventoryItems.reduce((sum, item) => sum + (item.cost * item.currentStock || 0), 0)
    const lowStockItems = getLowStockItems()
    const criticalStockItems = getCriticalStockItems()
    const expiringItems = getExpiringItems(30)

    return {
      data: mockInventoryItems.map(item => ({
        ...item,
        totalValue: (item.cost || 0) * item.currentStock,
        stockStatus: item.currentStock === 0 ? 'Critical' : 
                    item.currentStock <= item.restockThreshold ? 'Low' : 'Normal'
      })),
      summary: {
        totalItems,
        totalValue,
        lowStockCount: lowStockItems.length,
        criticalStockCount: criticalStockItems.length,
        expiringCount: expiringItems.length
      }
    }
  }

  const generateStockLevelsReport = () => {
    const data = mockInventoryItems.map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      currentStock: item.currentStock,
      restockThreshold: item.restockThreshold,
      maxStock: item.maxStock,
      unit: item.unit,
      location: item.location,
      stockStatus: item.currentStock === 0 ? 'Critical' : 
                  item.currentStock <= item.restockThreshold ? 'Low' : 
                  item.maxStock && item.currentStock > item.maxStock ? 'Excess' : 'Normal',
      stockPercentage: item.maxStock ? Math.round((item.currentStock / item.maxStock) * 100) : 
                      Math.round((item.currentStock / (item.restockThreshold * 2)) * 100)
    }))

    return {
      data,
      summary: {
        normalStock: data.filter(item => item.stockStatus === 'Normal').length,
        lowStock: data.filter(item => item.stockStatus === 'Low').length,
        criticalStock: data.filter(item => item.stockStatus === 'Critical').length,
        excessStock: data.filter(item => item.stockStatus === 'Excess').length
      }
    }
  }

  const generatePurchaseOrdersReport = () => {
    const data = mockPurchaseOrders.map(po => ({
      ...po,
      supplierName: po.supplier.name,
      itemCount: po.items.length,
      daysToDelivery: Math.ceil((new Date(po.expectedDelivery) - new Date()) / (1000 * 60 * 60 * 24))
    }))

    const totalValue = data.reduce((sum, po) => sum + po.totalAmount, 0)
    const pendingValue = data.filter(po => po.status === 'pending').reduce((sum, po) => sum + po.totalAmount, 0)

    return {
      data,
      summary: {
        totalOrders: data.length,
        totalValue,
        pendingOrders: data.filter(po => po.status === 'pending').length,
        pendingValue,
        approvedOrders: data.filter(po => po.status === 'approved').length,
        deliveredOrders: data.filter(po => po.status === 'delivered').length
      }
    }
  }

  const generateSupplierPerformanceReport = () => {
    const data = mockSuppliers.filter(supplier => supplier.isActive).map(supplier => ({
      id: supplier.id,
      name: supplier.name,
      contactPerson: supplier.contactPerson,
      categories: supplier.categories.join(', '),
      overallRating: supplier.performanceMetrics.overallRating,
      deliveryReliability: supplier.performanceMetrics.deliveryReliability,
      qualityRating: supplier.performanceMetrics.qualityRating,
      responseTime: supplier.performanceMetrics.responseTime,
      totalOrders: supplier.performanceMetrics.totalOrders,
      qualityIssues: supplier.performanceMetrics.qualityIssues,
      performanceGrade: supplier.performanceMetrics.overallRating >= 4.5 ? 'Excellent' :
                       supplier.performanceMetrics.overallRating >= 4.0 ? 'Good' :
                       supplier.performanceMetrics.overallRating >= 3.0 ? 'Fair' : 'Poor'
    }))

    return {
      data,
      summary: {
        totalSuppliers: data.length,
        excellentSuppliers: data.filter(s => s.performanceGrade === 'Excellent').length,
        goodSuppliers: data.filter(s => s.performanceGrade === 'Good').length,
        averageRating: data.reduce((sum, s) => sum + s.overallRating, 0) / data.length,
        averageDeliveryReliability: data.reduce((sum, s) => sum + s.deliveryReliability, 0) / data.length
      }
    }
  }

  const generateAuditComplianceReport = () => {
    const data = mockAudits.map(audit => ({
      ...audit,
      itemsAudited: audit.items?.length || 0,
      discrepancyCount: audit.discrepancies?.length || 0,
      complianceGrade: audit.complianceScore >= 95 ? 'Excellent' :
                      audit.complianceScore >= 85 ? 'Good' :
                      audit.complianceScore >= 70 ? 'Fair' : 'Poor',
      daysAgo: Math.ceil((new Date() - new Date(audit.auditDate)) / (1000 * 60 * 60 * 24))
    }))

    return {
      data,
      summary: {
        totalAudits: data.length,
        averageComplianceScore: data.reduce((sum, audit) => sum + (audit.complianceScore || 0), 0) / data.length,
        excellentAudits: data.filter(audit => audit.complianceGrade === 'Excellent').length,
        totalDiscrepancies: data.reduce((sum, audit) => sum + audit.discrepancyCount, 0),
        completedAudits: data.filter(audit => audit.status === 'completed' || audit.status === 'approved').length
      }
    }
  }

  const generateTransactionHistoryReport = () => {
    const data = mockTransactions.map(transaction => ({
      ...transaction,
      itemName: mockInventoryItems.find(item => item.id === transaction.itemId)?.name || 'Unknown Item',
      transactionValue: (mockInventoryItems.find(item => item.id === transaction.itemId)?.cost || 0) * transaction.quantity,
      daysAgo: Math.ceil((new Date() - new Date(transaction.createdAt)) / (1000 * 60 * 60 * 24))
    }))

    return {
      data,
      summary: {
        totalTransactions: data.length,
        stockInTransactions: data.filter(t => t.type === 'stock-in').length,
        stockOutTransactions: data.filter(t => t.type === 'stock-out').length,
        adjustmentTransactions: data.filter(t => t.type === 'adjustment').length,
        totalValue: data.reduce((sum, t) => sum + t.transactionValue, 0),
        pendingApprovals: data.filter(t => !t.approved).length
      }
    }
  }

  const generateExpiryTrackingReport = () => {
    const expiringItems = mockInventoryItems.filter(item => item.expirationDate)
    const data = expiringItems.map(item => {
      const daysToExpiry = Math.ceil((new Date(item.expirationDate) - new Date()) / (1000 * 60 * 60 * 24))
      return {
        ...item,
        daysToExpiry,
        expiryStatus: daysToExpiry < 0 ? 'Expired' :
                     daysToExpiry <= 7 ? 'Critical' :
                     daysToExpiry <= 30 ? 'Warning' : 'Good',
        potentialLoss: (item.cost || 0) * item.currentStock
      }
    }).sort((a, b) => a.daysToExpiry - b.daysToExpiry)

    return {
      data,
      summary: {
        totalTrackingItems: data.length,
        expiredItems: data.filter(item => item.expiryStatus === 'Expired').length,
        criticalItems: data.filter(item => item.expiryStatus === 'Critical').length,
        warningItems: data.filter(item => item.expiryStatus === 'Warning').length,
        potentialLoss: data.filter(item => item.expiryStatus === 'Expired' || item.expiryStatus === 'Critical')
                          .reduce((sum, item) => sum + item.potentialLoss, 0)
      }
    }
  }

  // Get column definitions based on report type
  const getReportColumns = () => {
    switch (selectedReport) {
      case 'inventory-summary':
        return [
          { key: 'name', label: 'Item Name', sortable: true },
          { key: 'category', label: 'Category', sortable: true },
          { key: 'currentStock', label: 'Current Stock', sortable: true },
          { key: 'unit', label: 'Unit', sortable: false },
          { key: 'totalValue', label: 'Total Value', sortable: true, render: (value) => formatCurrency(value) },
          { key: 'stockStatus', label: 'Status', sortable: true, render: (value) => (
            <Badge variant={value === 'Critical' ? 'error' : value === 'Low' ? 'warning' : 'success'}>
              {value}
            </Badge>
          )}
        ]

      case 'stock-levels':
        return [
          { key: 'name', label: 'Item Name', sortable: true },
          { key: 'category', label: 'Category', sortable: true },
          { key: 'currentStock', label: 'Current', sortable: true },
          { key: 'restockThreshold', label: 'Threshold', sortable: true },
          { key: 'maxStock', label: 'Max Stock', sortable: true },
          { key: 'stockPercentage', label: 'Stock %', sortable: true, render: (value) => `${value}%` },
          { key: 'stockStatus', label: 'Status', sortable: true, render: (value) => (
            <Badge variant={value === 'Critical' ? 'error' : value === 'Low' ? 'warning' : value === 'Excess' ? 'info' : 'success'}>
              {value}
            </Badge>
          )}
        ]

      case 'purchase-orders':
        return [
          { key: 'orderNumber', label: 'Order #', sortable: true },
          { key: 'supplierName', label: 'Supplier', sortable: true },
          { key: 'totalAmount', label: 'Amount', sortable: true, render: (value) => formatCurrency(value) },
          { key: 'status', label: 'Status', sortable: true, render: (value) => (
            <Badge variant={value === 'pending' ? 'warning' : value === 'approved' ? 'info' : value === 'delivered' ? 'success' : 'default'}>
              {value.charAt(0).toUpperCase() + value.slice(1)}
            </Badge>
          )},
          { key: 'expectedDelivery', label: 'Expected Delivery', sortable: true, render: (value) => new Date(value).toLocaleDateString() },
          { key: 'daysToDelivery', label: 'Days to Delivery', sortable: true }
        ]

      case 'supplier-performance':
        return [
          { key: 'name', label: 'Supplier Name', sortable: true },
          { key: 'overallRating', label: 'Overall Rating', sortable: true, render: (value) => `${value.toFixed(1)}/5` },
          { key: 'deliveryReliability', label: 'Delivery %', sortable: true, render: (value) => `${value}%` },
          { key: 'qualityRating', label: 'Quality', sortable: true, render: (value) => `${value.toFixed(1)}/5` },
          { key: 'totalOrders', label: 'Total Orders', sortable: true },
          { key: 'qualityIssues', label: 'Issues', sortable: true },
          { key: 'performanceGrade', label: 'Grade', sortable: true, render: (value) => (
            <Badge variant={value === 'Excellent' ? 'success' : value === 'Good' ? 'info' : value === 'Fair' ? 'warning' : 'error'}>
              {value}
            </Badge>
          )}
        ]

      case 'audit-compliance':
        return [
          { key: 'auditNumber', label: 'Audit #', sortable: true },
          { key: 'auditType', label: 'Type', sortable: true },
          { key: 'auditDate', label: 'Date', sortable: true, render: (value) => new Date(value).toLocaleDateString() },
          { key: 'complianceScore', label: 'Score', sortable: true, render: (value) => `${value}%` },
          { key: 'itemsAudited', label: 'Items Audited', sortable: true },
          { key: 'discrepancyCount', label: 'Discrepancies', sortable: true },
          { key: 'complianceGrade', label: 'Grade', sortable: true, render: (value) => (
            <Badge variant={value === 'Excellent' ? 'success' : value === 'Good' ? 'info' : value === 'Fair' ? 'warning' : 'error'}>
              {value}
            </Badge>
          )}
        ]

      case 'transaction-history':
        return [
          { key: 'itemName', label: 'Item', sortable: true },
          { key: 'type', label: 'Type', sortable: true, render: (value) => (
            <Badge variant={value === 'stock-in' ? 'success' : value === 'stock-out' ? 'info' : 'warning'}>
              {value.replace('-', ' ').toUpperCase()}
            </Badge>
          )},
          { key: 'quantity', label: 'Quantity', sortable: true },
          { key: 'reason', label: 'Reason', sortable: false },
          { key: 'performedBy', label: 'Performed By', sortable: true },
          { key: 'createdAt', label: 'Date', sortable: true, render: (value) => new Date(value).toLocaleDateString() },
          { key: 'approved', label: 'Approved', sortable: true, render: (value) => (
            <Badge variant={value ? 'success' : 'warning'}>
              {value ? 'Yes' : 'Pending'}
            </Badge>
          )}
        ]

      case 'expiry-tracking':
        return [
          { key: 'name', label: 'Item Name', sortable: true },
          { key: 'currentStock', label: 'Stock', sortable: true },
          { key: 'expirationDate', label: 'Expiry Date', sortable: true, render: (value) => new Date(value).toLocaleDateString() },
          { key: 'daysToExpiry', label: 'Days to Expiry', sortable: true },
          { key: 'potentialLoss', label: 'Potential Loss', sortable: true, render: (value) => formatCurrency(value) },
          { key: 'expiryStatus', label: 'Status', sortable: true, render: (value) => (
            <Badge variant={value === 'Expired' ? 'error' : value === 'Critical' ? 'warning' : value === 'Warning' ? 'info' : 'success'}>
              {value}
            </Badge>
          )}
        ]

      default:
        return []
    }
  }

  const reportData = generateReportData()
  const allReportCounts = getAllReportCounts()
  
  // Apply filters and search
  const getFilteredData = () => {
    let filtered = [...reportData.data]
    
    // Search filter - contextual to report type
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(item => {
        switch (selectedReport) {
          case 'inventory-summary':
          case 'stock-levels':
          case 'expiry-tracking':
            return (item.name && item.name.toLowerCase().includes(query)) ||
                   (item.category && item.category.toLowerCase().includes(query)) ||
                   (item.location && item.location.toLowerCase().includes(query))
          
          case 'purchase-orders':
            return (item.orderNumber && item.orderNumber.toLowerCase().includes(query)) ||
                   (item.supplierName && item.supplierName.toLowerCase().includes(query))
          
          case 'supplier-performance':
            return (item.name && item.name.toLowerCase().includes(query)) ||
                   (item.contactPerson && item.contactPerson.toLowerCase().includes(query)) ||
                   (item.categories && item.categories.toLowerCase().includes(query))
          
          case 'audit-compliance':
            return (item.auditNumber && item.auditNumber.toLowerCase().includes(query)) ||
                   (item.auditType && item.auditType.toLowerCase().includes(query))
          
          case 'transaction-history':
            return (item.itemName && item.itemName.toLowerCase().includes(query)) ||
                   (item.reason && item.reason.toLowerCase().includes(query)) ||
                   (item.performedBy && item.performedBy.toLowerCase().includes(query))
          
          default:
            return true
        }
      })
    }
    
    // Status filter - contextual to report type
    if (statusFilter) {
      filtered = filtered.filter(item => {
        switch (selectedReport) {
          case 'inventory-summary':
          case 'stock-levels':
            return item.stockStatus === statusFilter
          
          case 'purchase-orders':
            return item.status === statusFilter
          
          case 'supplier-performance':
            return item.performanceGrade === statusFilter
          
          case 'audit-compliance':
            return item.complianceGrade === statusFilter
          
          case 'transaction-history':
            return item.type === statusFilter
          
          case 'expiry-tracking':
            return item.expiryStatus === statusFilter
          
          default:
            return true
        }
      })
    }
    
    // Sort
    filtered.sort((a, b) => {
      let aValue = a[sortBy]
      let bValue = b[sortBy]
      
      // Handle date sorting
      if (sortBy.includes('Date') || sortBy === 'createdAt') {
        aValue = new Date(aValue)
        bValue = new Date(bValue)
      }
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
    
    return filtered
  }
  
  // Get paginated data
  const getPaginatedData = () => {
    const filteredData = getFilteredData()
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return filteredData.slice(startIndex, endIndex)
  }
  
  // Get pagination info
  const getPaginationInfo = () => {
    return {
      page: currentPage,
      pageSize: pageSize,
      total: getFilteredData().length
    }
  }
  
  // Handle page change
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage)
  }
  
  // Reset to page 1 when report changes
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedReport])

  const reportTypes = [
    { value: 'inventory-summary', label: 'Inventory Summary' },
    { value: 'stock-levels', label: 'Stock Levels' },
    { value: 'purchase-orders', label: 'Purchase Orders' },
    { value: 'supplier-performance', label: 'Supplier Performance' },
    { value: 'audit-compliance', label: 'Audit & Compliance' },
    { value: 'transaction-history', label: 'Transaction History' },
    { value: 'expiry-tracking', label: 'Expiry Tracking' }
  ]

  // Get filter options based on report type
  const getFilterOptions = () => {
    switch (selectedReport) {
      case 'inventory-summary':
        return {
          statusOptions: [
            { label: 'All Status', value: '' },
            { label: 'Critical Stock', value: 'Critical' },
            { label: 'Low Stock', value: 'Low' },
            { label: 'Normal Stock', value: 'Normal' }
          ],
          dateLabel: 'Date Range',
          sortOptions: [
            { label: 'Item Name A-Z', value: 'name' },
            { label: 'Item Name Z-A', value: 'name-desc' },
            { label: 'Total Value High-Low', value: 'totalValue-desc' },
            { label: 'Current Stock High-Low', value: 'currentStock-desc' }
          ]
        }

      case 'stock-levels':
        return {
          statusOptions: [
            { label: 'All Status', value: '' },
            { label: 'Critical Stock', value: 'Critical' },
            { label: 'Low Stock', value: 'Low' },
            { label: 'Normal Stock', value: 'Normal' },
            { label: 'Excess Stock', value: 'Excess' }
          ],
          dateLabel: 'Date Range',
          sortOptions: [
            { label: 'Item Name A-Z', value: 'name' },
            { label: 'Stock Level Low-High', value: 'currentStock' },
            { label: 'Stock Level High-Low', value: 'currentStock-desc' },
            { label: 'Stock Percentage Low-High', value: 'stockPercentage' }
          ]
        }

      case 'purchase-orders':
        return {
          statusOptions: [
            { label: 'All Status', value: '' },
            { label: 'Pending', value: 'pending' },
            { label: 'Approved', value: 'approved' },
            { label: 'Delivered', value: 'delivered' },
            { label: 'Cancelled', value: 'cancelled' }
          ],
          dateLabel: 'Order Date Range',
          sortOptions: [
            { label: 'Order Number', value: 'orderNumber' },
            { label: 'Amount High-Low', value: 'totalAmount-desc' },
            { label: 'Expected Delivery', value: 'expectedDelivery' },
            { label: 'Supplier Name A-Z', value: 'supplierName' }
          ]
        }

      case 'supplier-performance':
        return {
          statusOptions: [
            { label: 'All Grades', value: '' },
            { label: 'Excellent', value: 'Excellent' },
            { label: 'Good', value: 'Good' },
            { label: 'Fair', value: 'Fair' },
            { label: 'Poor', value: 'Poor' }
          ],
          dateLabel: 'Performance Period',
          sortOptions: [
            { label: 'Supplier Name A-Z', value: 'name' },
            { label: 'Overall Rating High-Low', value: 'overallRating-desc' },
            { label: 'Delivery Reliability High-Low', value: 'deliveryReliability-desc' },
            { label: 'Total Orders High-Low', value: 'totalOrders-desc' }
          ]
        }

      case 'audit-compliance':
        return {
          statusOptions: [
            { label: 'All Grades', value: '' },
            { label: 'Excellent', value: 'Excellent' },
            { label: 'Good', value: 'Good' },
            { label: 'Fair', value: 'Fair' },
            { label: 'Poor', value: 'Poor' }
          ],
          dateLabel: 'Audit Date Range',
          sortOptions: [
            { label: 'Audit Date Recent', value: 'auditDate-desc' },
            { label: 'Compliance Score High-Low', value: 'complianceScore-desc' },
            { label: 'Audit Number', value: 'auditNumber' },
            { label: 'Discrepancies High-Low', value: 'discrepancyCount-desc' }
          ]
        }

      case 'transaction-history':
        return {
          statusOptions: [
            { label: 'All Types', value: '' },
            { label: 'Stock In', value: 'stock-in' },
            { label: 'Stock Out', value: 'stock-out' },
            { label: 'Adjustment', value: 'adjustment' }
          ],
          dateLabel: 'Transaction Date Range',
          sortOptions: [
            { label: 'Most Recent', value: 'createdAt-desc' },
            { label: 'Item Name A-Z', value: 'itemName' },
            { label: 'Quantity High-Low', value: 'quantity-desc' },
            { label: 'Performed By A-Z', value: 'performedBy' }
          ]
        }

      case 'expiry-tracking':
        return {
          statusOptions: [
            { label: 'All Status', value: '' },
            { label: 'Expired', value: 'Expired' },
            { label: 'Critical', value: 'Critical' },
            { label: 'Warning', value: 'Warning' },
            { label: 'Good', value: 'Good' }
          ],
          dateLabel: 'Expiry Date Range',
          sortOptions: [
            { label: 'Days to Expiry (Urgent First)', value: 'daysToExpiry' },
            { label: 'Expiry Date', value: 'expirationDate' },
            { label: 'Potential Loss High-Low', value: 'potentialLoss-desc' },
            { label: 'Item Name A-Z', value: 'name' }
          ]
        }

      default:
        return {
          statusOptions: [{ label: 'All Status', value: '' }],
          dateLabel: 'Date Range',
          sortOptions: [{ label: 'Name A-Z', value: 'name' }]
        }
    }
  }

  const dateRangeOptions = [
    { value: 'last-7-days', label: 'Last 7 Days' },
    { value: 'last-30-days', label: 'Last 30 Days' },
    { value: 'last-90-days', label: 'Last 90 Days' },
    { value: 'current-month', label: 'Current Month' },
    { value: 'last-month', label: 'Last Month' },
    { value: 'current-year', label: 'Current Year' }
  ]

  const exportReport = () => {
    // In a real application, this would generate and download a CSV/PDF
    const csvContent = [
      getReportColumns().map(col => col.label).join(','),
      ...getFilteredData().map(row => 
        getReportColumns().map(col => {
          const value = row[col.key]
          return typeof value === 'string' ? `"${value}"` : value
        }).join(',')
      )
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedReport}-report-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    
    // Close modal
    setShowExportModal(false)
  }

  const handleExportClick = () => {
    setShowExportModal(true)
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <p className="text-gray-500 font-body">
          Generate reports and analytics
        </p>
      </div>
      
      {/* Report Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {reportTypes.slice(0, 5).map(type => (
          <div 
            key={type.value}
            className={`bg-white rounded-lg border p-6 cursor-pointer transition-all duration-200 ease-out hover:shadow-sm ${
              selectedReport === type.value ? 'border-slate-700 bg-slate-50' : 'border-gray-200'
            }`}
            onClick={() => setSelectedReport(type.value)}
          >
            <div className="flex items-start justify-between mb-0 h-12">
              <h3 className="font-heading font-medium text-lg leading-tight">{type.label}</h3>
            </div>
            <p className="text-3xl font-heading font-medium text-slate-700 mb-1">
              {allReportCounts[type.value]}
            </p>
            <p className="text-sm text-gray-500">records</p>
          </div>
        ))}
      </div>

      {/* Additional Report Types Row */}
      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {reportTypes.slice(5).map(type => (
          <div 
            key={type.value}
            className={`bg-white rounded-lg border p-6 cursor-pointer transition-all duration-200 ease-out hover:shadow-sm ${
              selectedReport === type.value ? 'border-slate-700 bg-slate-50' : 'border-gray-200'
            }`}
            onClick={() => setSelectedReport(type.value)}
          >
            <div className="flex items-start justify-between mb-0 h-12">
              <h3 className="font-heading font-medium text-lg leading-tight">{type.label}</h3>
            </div>
            <p className="text-3xl font-heading font-medium text-slate-700 mb-1">
              {allReportCounts[type.value]}
            </p>
            <p className="text-sm text-gray-500">records</p>
          </div>
        ))}
      </div>

      {/* Report Data Table */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h3 className="font-heading font-medium text-lg">
            {reportTypes.find(type => type.value === selectedReport)?.label} Report
            <span className="text-gray-500 font-normal ml-2">
              ({getFilteredData().length} records)
            </span>
          </h3>
          <Button
            onClick={handleExportClick}
            className="bg-black text-white hover:bg-gray-800"
          >
            Export Report
          </Button>
        </div>
        
        {/* Filter Bar */}
        <div className="border-b border-gray-200 p-6">
          <FilterBar
            searchQuery={searchQuery}
            onSearch={setSearchQuery}
            selectedCategory={statusFilter}
            onCategoryFilter={setStatusFilter}
            categoryOptions={getFilterOptions().statusOptions}
            expiryFilter={dateRange}
            onExpiryFilter={setDateRange}
            expiryOptions={dateRangeOptions}
            expiryLabel={getFilterOptions().dateLabel}
            onSortChange={(sortValue) => {
              const [field, direction = 'asc'] = sortValue.split('-')
              setSortBy(field)
              setSortDirection(direction === 'desc' ? 'desc' : 'asc')
            }}
            sortOptions={getFilterOptions().sortOptions}
          />
        </div>
        
        <InventoryTable
          data={getPaginatedData()}
          columns={getReportColumns()}
          showSearch={false} // Using FilterBar instead
          showFilters={false} // Using FilterBar instead
          showQuickFilters={false} // Using FilterBar instead
          sortBy={sortBy}
          sortDirection={sortDirection}
          onSort={(column, direction) => {
            setSortBy(column)
            setSortDirection(direction)
          }}
          pagination={getPaginationInfo()}
          onPageChange={handlePageChange}
        />
      </div>

      {/* Export Confirmation Modal */}
      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Export Report Data"
        size="md"
      >
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            <p className="mb-3">
              You are about to export <span className="font-medium text-black">{getFilteredData().length} records</span> from the <span className="font-medium text-black">{reportTypes.find(type => type.value === selectedReport)?.label}</span> report to a CSV file.
            </p>
            <div className="bg-gray-50 rounded-lg p-3 space-y-1">
              <p className="text-xs text-gray-500 font-medium">Export will include:</p>
              <ul className="text-xs text-gray-600 space-y-0.5">
                {getReportColumns().slice(0, 4).map(col => (
                  <li key={col.key}>• {col.label}</li>
                ))}
                {getReportColumns().length > 4 && (
                  <li>• And {getReportColumns().length - 4} more columns</li>
                )}
              </ul>
            </div>
            <p className="mt-3 text-xs text-gray-500">
              File will be saved as: {selectedReport}-report-{new Date().toISOString().split('T')[0]}.csv
            </p>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button
              variant="ghost"
              onClick={() => setShowExportModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={exportReport}
            >
              Export CSV
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}