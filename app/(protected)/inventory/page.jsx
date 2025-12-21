'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import InventoryTable from '../../../components/inventory/InventoryTable'
import FilterBar from '../../../components/inventory/FilterBar'
import Button from '../../../components/ui/Button'
import Modal from '../../../components/ui/Modal'
import RestockForm from '../../../components/inventory/RestockForm'
import { usePageTitle } from '../../../hooks/usePageTitle'
import { 
  mockInventoryItems,
  getLowStockItems,
  getCriticalStockItems,
  getExpiringItems,
  getExpiredItems
} from '../../../lib/mockData'
import { INVENTORY_CATEGORIES } from '../../../lib/constants'

export default function InventoryPage() {
  const router = useRouter()
  const { setTitle } = usePageTitle()
  const [filteredItems, setFilteredItems] = useState(mockInventoryItems)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [expiryFilter, setExpiryFilter] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [sortDirection, setSortDirection] = useState('asc')
  const [selectedItem, setSelectedItem] = useState(null)
  const [showAddItemModal, setShowAddItemModal] = useState(false)
  const [showRestockModal, setShowRestockModal] = useState(false)
  const [restockType, setRestockType] = useState('stock-in')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 25 // Optimal size for inventory review
  
  // Set page title
  useEffect(() => {
    setTitle('Inventory')
  }, [setTitle])
  

  
  // Handle card clicks - simple one-way filtering
  const handleAllItemsClick = () => {
    setStatusFilter('')
    setExpiryFilter('')
  }
  
  const handleCriticalClick = () => {
    setExpiryFilter('')
    setStatusFilter('critical')
  }
  
  const handleExpiredClick = () => {
    setStatusFilter('')
    setExpiryFilter('expired')
  }
  
  const handleExpiringSoonClick = () => {
    setStatusFilter('')
    setExpiryFilter('expiring-soon')
  }
  
  const handleLowStockClick = () => {
    setExpiryFilter('')
    setStatusFilter('low')
  }
  
  // Get unique locations for filter
  const locations = [...new Set(mockInventoryItems.map(item => item.location))].sort()
  
  // Calculate alerts
  const lowStockItems = getLowStockItems()
  const criticalStockItems = getCriticalStockItems()
  const expiringItems = getExpiringItems(7)
  const expiredItems = getExpiredItems()
  
  // Apply filters and search
  useEffect(() => {
    let filtered = [...mockInventoryItems]
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.location.toLowerCase().includes(query)
      )
    }
    
    // Category filter
    if (categoryFilter) {
      filtered = filtered.filter(item => item.category === categoryFilter)
    }
    
    // Status filter (from alert cards)
    if (statusFilter) {
      filtered = filtered.filter(item => {
        const status = getStockStatus(item)
        return status === statusFilter
      })
    }
    
    // Expiry filter
    if (expiryFilter) {
      const now = new Date()
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      
      filtered = filtered.filter(item => {
        if (!item.expirationDate && expiryFilter === 'no-expiration') return true
        if (!item.expirationDate) return false
        
        const expiryDate = new Date(item.expirationDate)
        
        switch (expiryFilter) {
          case 'expired':
            return expiryDate < now
          case 'expiring-soon':
            return expiryDate >= now && expiryDate <= sevenDaysFromNow
          case 'expiring-month':
            return expiryDate >= now && expiryDate <= thirtyDaysFromNow
          case 'no-expiration':
            return false // Already handled above
          default:
            return true
        }
      })
    }
    
    // Sort
    filtered.sort((a, b) => {
      let aValue = a[sortBy]
      let bValue = b[sortBy]
      
      // Handle special sorting cases
      if (sortBy === 'expirationDate') {
        aValue = a.expirationDate ? new Date(a.expirationDate) : new Date('9999-12-31')
        bValue = b.expirationDate ? new Date(b.expirationDate) : new Date('9999-12-31')
      }
      
      if (sortBy === 'createdAt') {
        // Mock created dates for sorting
        aValue = new Date(2024, 0, Math.floor(Math.random() * 30) + 1)
        bValue = new Date(2024, 0, Math.floor(Math.random() * 30) + 1)
      }
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
    
    setFilteredItems(filtered)
    setCurrentPage(1) // Reset to page 1 when filters change
  }, [searchQuery, categoryFilter, statusFilter, expiryFilter, sortBy, sortDirection])
  
  // Get paginated data
  const getPaginatedData = () => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return filteredItems.slice(startIndex, endIndex)
  }
  
  // Get pagination info
  const getPaginationInfo = () => {
    return {
      page: currentPage,
      pageSize: pageSize,
      total: filteredItems.length
    }
  }
  
  // Handle page change
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage)
  }
  
  const getStockStatus = (item) => {
    if (item.currentStock === 0) return 'critical'
    if (item.currentStock <= item.restockThreshold) return 'low'
    if (item.maxStock && item.currentStock > item.maxStock) return 'excess'
    return 'normal'
  }
  
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortDirection('asc')
    }
  }
  
  const handleRowClick = (item) => {
    router.push(`/inventory/${item.id}`)
  }
  
  const handleRestockClick = (item, type) => {
    setSelectedItem(item)
    setRestockType(type)
    setShowRestockModal(true)
  }
  
  const handleRestockSubmit = (transactionData) => {
    // This will be implemented with real API calls in later tasks
    console.log('Restock transaction:', transactionData)
    setShowRestockModal(false)
    setSelectedItem(null)
    
    // For now, just show a success message
    alert(`${restockType} transaction recorded successfully`)
  }
  
  const columns = [
    { key: 'name', label: 'Item Name', sortable: true },
    { key: 'category', label: 'Category', sortable: true, render: (value) => value.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) },
    { key: 'currentStock', label: 'Current Stock', sortable: true, render: (value, item) => `${value} ${item.unit}` },
    { key: 'stockLevel', label: 'Stock Status', sortable: false },
    { key: 'location', label: 'Location', sortable: true },
    { key: 'expirationDate', label: 'Expiry Date', sortable: true },
    { 
      key: 'actions', 
      label: 'Actions', 
      sortable: false,
      render: (value, item) => (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              handleRestockClick(item, 'stock-in')
            }}
          >
            Stock In
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              handleRestockClick(item, 'stock-out')
            }}
          >
            Stock Out
          </Button>
        </div>
      )
    }
  ]
  
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <p className="text-gray-500 font-body">
            View and manage inventory items
          </p>
        </div>
        <Button
          onClick={() => setShowAddItemModal(true)}
          className="bg-black text-white hover:bg-gray-800"
        >
          Add New Item
        </Button>
      </div>
      
      {/* Alert Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {/* All Items Card */}
        <div 
          className={`bg-white rounded-lg border p-6 cursor-pointer transition-all duration-200 ease-out hover:shadow-sm ${
            !statusFilter && !expiryFilter ? 'border-slate-700 bg-slate-50' : 'border-gray-200'
          }`}
          onClick={handleAllItemsClick}
        >
          <div className="flex items-start justify-between mb-0 h-12">
            <h3 className="font-heading font-medium text-lg leading-tight">All Items</h3>
          </div>
          <p className="text-3xl font-heading font-medium text-slate-700 mb-1">{mockInventoryItems.length}</p>
          <p className="text-sm text-gray-500">Complete inventory</p>
        </div>
        
        {/* Critical Stock Card - RED (Critical) */}
        <div 
          className={`bg-white rounded-lg border p-6 cursor-pointer transition-all duration-200 ease-out hover:shadow-sm ${
            statusFilter === 'critical' ? 'border-red-800 bg-red-50' :
            criticalStockItems.length > 0 ? 'border-red-200' : 'border-gray-200'
          }`}
          onClick={handleCriticalClick}
        >
          <div className="flex items-start justify-between mb-0 h-12">
            <h3 className="font-heading font-medium text-lg leading-tight">Critical Stock</h3>
          </div>
          <p className="text-3xl font-heading font-medium text-red-800 mb-1">{criticalStockItems.length}</p>
          <p className="text-sm text-gray-500">
            {criticalStockItems.length > 0 ? 'Items out of stock' : 'No critical issues'}
          </p>
        </div>
        
        {/* Expired Items Card - RED (Critical) */}
        <div 
          className={`bg-white rounded-lg border p-6 cursor-pointer transition-all duration-200 ease-out hover:shadow-sm ${
            expiryFilter === 'expired' ? 'border-red-800 bg-red-50' :
            expiredItems.length > 0 ? 'border-red-200' : 'border-gray-200'
          }`}
          onClick={handleExpiredClick}
        >
          <div className="flex items-start justify-between mb-0 h-12">
            <h3 className="font-heading font-medium text-lg leading-tight">Expired Items</h3>
          </div>
          <p className="text-3xl font-heading font-medium text-red-800 mb-1">{expiredItems.length}</p>
          <p className="text-sm text-gray-500">
            {expiredItems.length > 0 ? 'Items past expiry date' : 'No expired items'}
          </p>
        </div>
        
        {/* Expiring Soon Card - ORANGE (Expiring) */}
        <div 
          className={`bg-white rounded-lg border p-6 cursor-pointer transition-all duration-200 ease-out hover:shadow-sm ${
            expiryFilter === 'expiring-soon' ? 'border-orange-800 bg-orange-50' :
            expiringItems.length > 0 ? 'border-orange-200' : 'border-gray-200'
          }`}
          onClick={handleExpiringSoonClick}
        >
          <div className="flex items-start justify-between mb-0 h-12">
            <h3 className="font-heading font-medium text-lg leading-tight">Expiring Soon</h3>
          </div>
          <p className="text-3xl font-heading font-medium text-orange-800 mb-1">{expiringItems.length}</p>
          <p className="text-sm text-gray-500">
            {expiringItems.length > 0 ? 'Items expire within 7 days' : 'No items expiring soon'}
          </p>
        </div>
        
        {/* Low Stock Card - AMBER (Warning) */}
        <div 
          className={`bg-white rounded-lg border p-6 cursor-pointer transition-all duration-200 ease-out hover:shadow-sm ${
            statusFilter === 'low' ? 'border-amber-700 bg-amber-50' :
            lowStockItems.length > 0 ? 'border-amber-200' : 'border-gray-200'
          }`}
          onClick={handleLowStockClick}
        >
          <div className="flex items-start justify-between mb-0 h-12">
            <h3 className="font-heading font-medium text-lg leading-tight">Low Stock</h3>
          </div>
          <p className="text-3xl font-heading font-medium text-amber-700 mb-1">{lowStockItems.length}</p>
          <p className="text-sm text-gray-500">
            {lowStockItems.length > 0 ? 'Items need restocking' : 'All items well stocked'}
          </p>
        </div>
      </div>
      
      {/* Inventory Table with FilterBar */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="font-heading font-medium text-lg">
            Inventory Items
            <span className="text-gray-500 font-normal ml-2">
              ({filteredItems.length} items)
            </span>
          </h3>
        </div>
        
        {/* Filter Bar */}
        <div className="border-b border-gray-200 p-6">
          <FilterBar
            searchQuery={searchQuery}
            onSearch={setSearchQuery}
            selectedCategory={categoryFilter}
            onCategoryFilter={setCategoryFilter}
            categoryOptions={[
              { label: 'All Categories', value: '' },
              ...INVENTORY_CATEGORIES.map(cat => ({
                label: cat.charAt(0).toUpperCase() + cat.slice(1).replace('-', ' '),
                value: cat
              }))
            ]}
            expiryFilter={expiryFilter}
            onExpiryFilter={setExpiryFilter}
            expiryOptions={[
              { label: 'All Items', value: '' },
              { label: 'Expired', value: 'expired' },
              { label: 'Expiring Soon (7 days)', value: 'expiring-soon' },
              { label: 'Expiring This Month', value: 'expiring-month' },
              { label: 'No Expiration', value: 'no-expiration' }
            ]}
            onSortChange={(sortValue) => {
              // Handle FilterBar sort changes
              switch (sortValue) {
                case 'name':
                  setSortBy('name')
                  setSortDirection('asc')
                  break
                case 'name-desc':
                  setSortBy('name')
                  setSortDirection('desc')
                  break
                case 'stock':
                  setSortBy('currentStock')
                  setSortDirection('desc')
                  break
                case 'expiry':
                  setSortBy('expirationDate')
                  setSortDirection('asc')
                  break
                case 'recent':
                  setSortBy('createdAt')
                  setSortDirection('desc')
                  break
                default:
                  setSortBy('name')
                  setSortDirection('asc')
              }
            }}
          />
        </div>
        
        <InventoryTable
          data={getPaginatedData()}
          columns={columns}
          onRowClick={handleRowClick}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onSort={handleSort}
          pagination={getPaginationInfo()}
          onPageChange={handlePageChange}
          showSearch={false} // Using FilterBar instead
          showFilters={false} // Using FilterBar instead
          showQuickFilters={false} // Using FilterBar instead
        />
      </div>
      
      {/* Restock Modal */}
      <Modal
        isOpen={showRestockModal}
        onClose={() => {
          setShowRestockModal(false)
          setSelectedItem(null)
        }}
        title={`${restockType === 'stock-in' ? 'Stock In' : 'Stock Out'} - ${selectedItem?.name}`}
        size="md"
      >
        {selectedItem && (
          <RestockForm
            item={selectedItem}
            transactionType={restockType}
            onSubmit={handleRestockSubmit}
            onCancel={() => {
              setShowRestockModal(false)
              setSelectedItem(null)
            }}
          />
        )}
      </Modal>
    </div>
  )
}