'use client'

import { useState, useEffect } from 'react'
import { usePageTitle } from '../../../hooks/usePageTitle'
import { useAuth } from '../../../hooks/useAuth'
import InventoryTable from '../../../components/inventory/InventoryTable'
import { formatCurrency } from '../../../lib/utils'
import MonthlyBudgetCard from '../../../components/inventory/MonthlyBudgetCard'
import menuApi from '../../../lib/menuApi'
import inventoryApi from '../../../lib/inventoryApi'
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
  const { user, hasRole } = useAuth()
  const isKitchenStaff = hasRole('kitchen-staff')
  const isInventoryController = hasRole('inventory-controller')
  const isPurchasingOfficer = hasRole('purchasing-officer')
  
  const [selectedSection, setSelectedSection] = useState('overview')
  const [currentPage, setCurrentPage] = useState(1)
  const [menuItems, setMenuItems] = useState([])
  const [availableItems, setAvailableItems] = useState([])
  const [purchaseOrders, setPurchaseOrders] = useState([])
  const [inventoryItems, setInventoryItems] = useState([])
  const [loading, setLoading] = useState(true)
  const pageSize = 25 // Optimal size for inventory review
  
  // Load data based on role
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        
        if (isKitchenStaff) {
          const [menuData, inventoryData] = await Promise.all([
            menuApi.getAll(),
            inventoryApi.getAll()
          ])
          setMenuItems(menuData)
          setAvailableItems(inventoryData)
        } else if (isPurchasingOfficer) {
          const purchaseOrderApi = (await import('../../../lib/purchaseOrderApi')).default
          const [ordersData, inventoryData] = await Promise.all([
            purchaseOrderApi.getAll(),
            inventoryApi.getAll()
          ])
          setPurchaseOrders(ordersData)
          setInventoryItems(inventoryData)
        } else if (isInventoryController) {
          const inventoryData = await inventoryApi.getAll()
          setInventoryItems(inventoryData)
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [isKitchenStaff, isPurchasingOfficer, isInventoryController])
  
  // Set page title
  useEffect(() => {
    setTitle('Dashboard')
  }, [setTitle])
  
  // Kitchen Staff Dashboard
  if (isKitchenStaff) {
    return (
      <div className="p-6 mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <p className="text-gray-500 font-body text-sm">
            Monitor menu availability and manage kitchen operations
          </p>
        </div>

        {/* Menu Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Menu Items */}
          <div className="bg-white/80 backdrop-blur-xl rounded-lg border border-white/20 p-6 shadow-xl">
            <h3 className="font-heading font-medium text-lg text-gray-700 mb-2">Total Menu Items</h3>
            <p className="text-3xl font-heading font-bold text-black mb-1">
              {menuItems.length}
            </p>
            <p className="text-sm text-gray-500">Items in menu</p>
          </div>

          {/* Available Menu Items */}
          <div className="bg-white/80 backdrop-blur-xl rounded-lg border border-white/20 p-6 shadow-xl">
            <h3 className="font-heading font-medium text-lg text-gray-700 mb-2">Available</h3>
            <p className="text-3xl font-heading font-bold text-green-600 mb-1">
              {menuItems.filter(item => item.isAvailable).length}
            </p>
            <p className="text-sm text-gray-500">Currently offered</p>
          </div>

          {/* Unavailable Menu Items */}
          <div className="bg-white/80 backdrop-blur-xl rounded-lg border border-white/20 p-6 shadow-xl">
            <h3 className="font-heading font-medium text-lg text-gray-700 mb-2">Unavailable</h3>
            <p className={`text-3xl font-heading font-bold mb-1 ${menuItems.filter(item => !item.isAvailable).length > 0 ? 'text-red-600' : 'text-gray-700'}`}>
              {menuItems.filter(item => !item.isAvailable).length}
            </p>
            <p className="text-sm text-gray-500">Items disabled</p>
          </div>

          {/* Menu Items with Issues */}
          <div className="bg-white/80 backdrop-blur-xl rounded-lg border border-white/20 p-6 shadow-xl">
            <h3 className="font-heading font-medium text-lg text-gray-700 mb-2">Ingredient Issues</h3>
            <p className="text-3xl font-heading font-bold text-amber-600 mb-1">
              {menuItems.filter(menuItem =>
                menuItem.requiredIngredients?.some(ingredient => {
                  const inventoryItem = availableItems.find(item => item.id === ingredient.ingredientId)
                  return !inventoryItem || inventoryItem.currentStock === 0 ||
                    (inventoryItem.currentStock > 0 && inventoryItem.currentStock <= inventoryItem.restockThreshold)
                }) || false
              ).length}
            </p>
            <p className="text-sm text-gray-500">Need attention</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white/80 backdrop-blur-xl rounded-lg border border-white/20 p-6 mb-8 shadow-xl">
          <h3 className="font-heading font-medium text-lg mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/menu"
              className="flex items-center justify-center px-4 py-3 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Manage Menu
            </a>
            <button
              onClick={() => window.location.href = '/inventory'}
              className="flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M9 21V9l3-2 3 2v12" />
              </svg>
              Check Inventory
            </button>
            <button
              onClick={() => alert('Daily prep checklist feature coming soon!')}
              className="flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              Prep Checklist
            </button>
          </div>
        </div>

        {/* Menu Items Overview */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-lg shadow-xl">
          <div className="border-b border-white/20 px-6 py-4">
            <h3 className="font-heading font-medium text-lg">
              Menu Items Overview
              <span className="text-gray-500 font-normal ml-2">
                ({menuItems.length} items)
              </span>
            </h3>
          </div>

          <div className="p-6">
            {menuItems.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">No menu items yet</p>
                <a
                  href="/menu"
                  className="inline-flex items-center px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
                >
                  Add Your First Menu Item
                </a>
              </div>
            ) : (
              <div className="space-y-4">
                {menuItems.slice(0, 10).map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => window.location.href = `/menu`}>
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${item.isAvailable ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <div>
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                        <p className="text-sm text-gray-500">{item.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${item.isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                        {item.isAvailable ? 'Available' : 'Unavailable'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }
  
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