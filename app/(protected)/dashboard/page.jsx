'use client'

import { useState, useEffect } from 'react'
import InventoryTable from '../../../components/inventory/InventoryTable'
import { usePageTitle } from '../../../hooks/usePageTitle'
import { formatCurrency } from '../../../lib/utils'
import { 
  mockInventoryItems, 
  mockPurchaseOrders,
  getItemsByCategory,
  getLowStockItems,
  getCriticalStockItems,
  getExpiringItems,
  getExpiredItems,
  getPendingPurchaseOrders
} from '../../../lib/mockData'
import { INVENTORY_CATEGORIES } from '../../../lib/constants'

export default function DashboardPage() {
  const { setTitle } = usePageTitle()
  const [selectedSection, setSelectedSection] = useState('overview')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 25 // Optimal size for inventory review
  
  // Set page title
  useEffect(() => {
    setTitle('Dashboard')
  }, [setTitle])
  
  // Calculate dashboard metrics
  const totalItems = mockInventoryItems.length
  const lowStockItems = getLowStockItems()
  const criticalStockItems = getCriticalStockItems()
  const expiringItems = getExpiringItems(7)
  const expiredItems = getExpiredItems()
  const pendingOrders = getPendingPurchaseOrders()
  
  // Calculate operational metrics
  const calculateItemsNeedingAttention = () => {
    // Combine all items that need attention without duplicates
    const allIssues = new Set([
      ...criticalStockItems.map(item => item.id),
      ...expiredItems.map(item => item.id),
      ...lowStockItems.map(item => item.id),
      ...expiringItems.map(item => item.id)
    ])
    return allIssues.size
  }
  
  const calculateRecentActivity = () => {
    // Mock calculation - in real app this would come from transaction history
    // Simulating transactions from today
    return {
      stockIn: 8,
      stockOut: 12,
      adjustments: 2
    }
  }
  
  const calculatePendingActions = () => {
    // Mock calculation - in real app this would come from various pending items
    return {
      ordersAwaitingApproval: pendingOrders.filter(order => order.status === 'pending').length,
      auditsOverdue: 1, // Mock overdue audits
      adjustmentsToReview: 3 // Mock pending adjustments
    }
  }
  
  const getCategoryBreakdown = () => {
    const categories = {
      'menu-items': getItemsByCategory('menu-items').length,
      'consumables': mockInventoryItems.filter(item => 
        ['toiletries', 'beverages', 'cleaning-supplies', 'kitchen-consumables', 'office-supplies'].includes(item.category)
      ).length,
      'assets': mockInventoryItems.filter(item => 
        ['equipment', 'furniture'].includes(item.category)
      ).length
    }
    return categories
  }
  
  // Operational metrics
  const itemsNeedingAttention = calculateItemsNeedingAttention()
  const recentActivity = calculateRecentActivity()
  const pendingActions = calculatePendingActions()
  const categoryBreakdown = getCategoryBreakdown()
  
  // Column definitions for different sections
  const overviewColumns = [
    { key: 'name', label: 'Item Name', sortable: true },
    { key: 'category', label: 'Category', sortable: true },
    { key: 'currentStock', label: 'Current Stock', sortable: true },
    { key: 'stockLevel', label: 'Stock Status', sortable: false },
    { key: 'location', label: 'Location', sortable: true },
    { key: 'expirationDate', label: 'Expiry Date', sortable: true }
  ]
  
  const purchaseOrderColumns = [
    { key: 'orderNumber', label: 'Order #', sortable: true },
    { 
      key: 'supplier', 
      label: 'Supplier', 
      sortable: true,
      render: (value) => value.name
    },
    { key: 'totalAmount', label: 'Amount', sortable: true, render: (value) => formatCurrency(value) },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'expectedDelivery', label: 'Expected Delivery', sortable: true, render: (value) => new Date(value).toLocaleDateString() }
  ]
  
  // Get data based on selected section
  const getSectionData = () => {
    switch (selectedSection) {
      case 'menu-items':
        return getItemsByCategory('menu-items')
      case 'consumables':
        return mockInventoryItems.filter(item => 
          ['toiletries', 'beverages', 'cleaning-supplies', 'kitchen-consumables', 'office-supplies'].includes(item.category)
        )
      case 'assets':
        return mockInventoryItems.filter(item => 
          ['equipment', 'furniture'].includes(item.category)
        )
      case 'purchase-orders':
        return mockPurchaseOrders
      case 'critical':
        // Combine all items needing attention
        const criticalIds = new Set([
          ...criticalStockItems.map(item => item.id),
          ...expiredItems.map(item => item.id),
          ...lowStockItems.map(item => item.id),
          ...expiringItems.map(item => item.id)
        ])
        return mockInventoryItems.filter(item => criticalIds.has(item.id))
      case 'low-stock':
        return lowStockItems
      case 'expiring':
        return expiringItems
      case 'expired':
        return expiredItems
      default:
        return mockInventoryItems
    }
  }
  
  // Get paginated data
  const getPaginatedData = () => {
    const allData = getSectionData()
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return allData.slice(startIndex, endIndex)
  }
  
  // Get pagination info
  const getPaginationInfo = () => {
    const totalItems = getSectionData().length
    return {
      page: currentPage,
      pageSize: pageSize,
      total: totalItems
    }
  }
  
  // Handle page change
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage)
  }
  
  // Reset to page 1 when section changes
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedSection])
  
  const getColumns = () => {
    return selectedSection === 'purchase-orders' ? purchaseOrderColumns : overviewColumns
  }
  
  const getSectionDisplayName = () => {
    switch (selectedSection) {
      case 'overview':
        return 'Overview'
      case 'menu-items':
        return 'Menu Items'
      case 'consumables':
        return 'Consumables'
      case 'assets':
        return 'Assets'
      case 'purchase-orders':
        return 'Purchase Orders'
      case 'critical':
        return 'Critical Issues'
      case 'low-stock':
        return 'Low Stock'
      case 'expired':
        return 'Expired Items'
      default:
        return 'Overview'
    }
  }
  
  const handleRowClick = (item) => {
    if (selectedSection === 'purchase-orders') {
      // Navigate to purchase order details (will be implemented in later tasks)
      console.log('Navigate to purchase order:', item.id)
    } else {
      // Navigate to inventory item details
      window.location.href = `/inventory/${item.id}`
    }
  }
  
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <p className="text-gray-500 font-body">
          Monitor stock levels and manage daily operations
        </p>
      </div>
      
      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Items with Category Breakdown */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-0 h-12">
            <h3 className="font-heading font-medium text-lg leading-tight">Total Items</h3>
          </div>
          <p className="text-3xl font-heading font-medium text-black mb-1">{totalItems}</p>
          <div className="text-sm text-gray-500 space-y-1">
            <p>Menu: {categoryBreakdown['menu-items']}</p>
            <p>Consumables: {categoryBreakdown['consumables']}</p>
            <p>Assets: {categoryBreakdown['assets']}</p>
          </div>
        </div>
        
        {/* Items Needing Attention */}
        <div className={`bg-white rounded-lg border p-6 ${
          itemsNeedingAttention > 0 ? 'border-red-800' : 'border-gray-200'
        }`}>
          <div className="flex items-start justify-between mb-0 h-12">
            <h3 className="font-heading font-medium text-lg leading-tight">Need Attention</h3>
          </div>
          <p className={`text-3xl font-heading font-medium mb-1 ${
            itemsNeedingAttention > 0 ? 'text-red-800' : 'text-slate-700'
          }`}>
            {itemsNeedingAttention}
          </p>
          <div className="text-sm text-gray-500 space-y-1">
            <p>Critical: {criticalStockItems.length}</p>
            <p>Low Stock: {lowStockItems.length}</p>
            <p>Expiring: {expiringItems.length}</p>
          </div>
        </div>
        
        {/* Recent Activity */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-0 h-12">
            <h3 className="font-heading font-medium text-lg leading-tight">Today's Activity</h3>
          </div>
          <p className="text-3xl font-heading font-medium text-slate-700 mb-1">
            {recentActivity.stockIn + recentActivity.stockOut + recentActivity.adjustments}
          </p>
          <div className="text-sm text-gray-500 space-y-1">
            <p>Stock In: {recentActivity.stockIn}</p>
            <p>Stock Out: {recentActivity.stockOut}</p>
            <p>Adjustments: {recentActivity.adjustments}</p>
          </div>
        </div>
        
        {/* Pending Actions */}
        <div className={`bg-white rounded-lg border p-6 ${
          pendingActions.ordersAwaitingApproval > 0 || pendingActions.auditsOverdue > 0 || pendingActions.adjustmentsToReview > 0 
            ? 'border-amber-700' : 'border-gray-200'
        }`}>
          <div className="flex items-start justify-between mb-0 h-12">
            <h3 className="font-heading font-medium text-lg leading-tight">Pending Actions</h3>
          </div>
          <p className={`text-3xl font-heading font-medium mb-1 ${
            pendingActions.ordersAwaitingApproval > 0 || pendingActions.auditsOverdue > 0 || pendingActions.adjustmentsToReview > 0
              ? 'text-amber-700' : 'text-slate-700'
          }`}>
            {pendingActions.ordersAwaitingApproval + pendingActions.auditsOverdue + pendingActions.adjustmentsToReview}
          </p>
          <div className="text-sm text-gray-500 space-y-1">
            <p>Orders: {pendingActions.ordersAwaitingApproval}</p>
            <p>Audits: {pendingActions.auditsOverdue}</p>
            <p>Adjustments: {pendingActions.adjustmentsToReview}</p>
          </div>
        </div>
      </div>
      
      {/* Data Table with Section Navigation and Quick Filters */}
      <div className="bg-white border border-gray-200 rounded-lg">
        {/* Section Navigation */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedSection('overview')}
              className={`px-5 py-3 rounded-sm text-sm font-medium transition-all duration-200 ease-out ${
                selectedSection === 'overview'
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setSelectedSection('menu-items')}
              className={`px-5 py-3 rounded-sm text-sm font-medium transition-all duration-200 ease-out ${
                selectedSection === 'menu-items'
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Menu Items ({getItemsByCategory('menu-items').length})
            </button>

            <button
              onClick={() => setSelectedSection('consumables')}
              className={`px-5 py-3 rounded-sm text-sm font-medium transition-all duration-200 ease-out ${
                selectedSection === 'consumables'
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Consumables ({mockInventoryItems.filter(item => 
                ['toiletries', 'beverages', 'cleaning-supplies', 'kitchen-consumables', 'office-supplies'].includes(item.category)
              ).length})
            </button>
            <button
              onClick={() => setSelectedSection('assets')}
              className={`px-5 py-3 rounded-sm text-sm font-medium transition-all duration-200 ease-out ${
                selectedSection === 'assets'
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Assets ({mockInventoryItems.filter(item => 
                ['equipment', 'furniture'].includes(item.category)
              ).length})
            </button>
            <button
              onClick={() => setSelectedSection('purchase-orders')}
              className={`px-5 py-3 rounded-sm text-sm font-medium transition-all duration-200 ease-out ${
                selectedSection === 'purchase-orders'
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Purchase Orders ({mockPurchaseOrders.length})
            </button>
          </div>
        </div>
        
        {/* Table Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="font-heading font-medium text-lg">
            {getSectionDisplayName()}
            <span className="text-gray-500 font-normal ml-2">
              ({getSectionData().length} items)
            </span>
          </h3>
        </div>
        
        <InventoryTable
          data={getPaginatedData()}
          columns={getColumns()}
          onRowClick={handleRowClick}
          showSearch={true}
          searchPlaceholder="Search items..."
          showFilters={selectedSection === 'overview'}
          filterOptions={selectedSection === 'overview' ? [
            { label: 'All Categories', value: '' },
            ...INVENTORY_CATEGORIES.map(cat => ({
              label: cat.charAt(0).toUpperCase() + cat.slice(1).replace('-', ' '),
              value: cat
            }))
          ] : []}
          pagination={getPaginationInfo()}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  )
}