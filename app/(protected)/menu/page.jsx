'use client'

import { useState, useEffect } from 'react'
import { usePageTitle } from '../../../hooks/usePageTitle'
import InventoryTable from '../../../components/inventory/InventoryTable'
import FilterBar from '../../../components/inventory/FilterBar'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import { 
  mockInventoryItems, 
  getItemsByCategory,
  getLowStockItems,
  getCriticalStockItems,
  getExpiringItems,
  getExpiredItems
} from '../../../lib/mockData'

export default function MenuManagementPage() {
  const { setTitle } = usePageTitle()
  const [menuItems, setMenuItems] = useState([])
  const [filteredItems, setFilteredItems] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [expiryFilter, setExpiryFilter] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [sortDirection, setSortDirection] = useState('asc')
  const [alerts, setAlerts] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [showAddMenuItemModal, setShowAddMenuItemModal] = useState(false)
  const pageSize = 25 // Optimal size for menu review
  
  // Set page title
  useEffect(() => {
    setTitle('Menu Management')
  }, [setTitle])
  
  // Icon component for menu cards - "open/view" indicator
  // Handle card clicks - simple one-way filtering
  const handleAllItemsClick = () => {
    setExpiryFilter('')
  }
  
  const handleUnavailableClick = () => {
    setExpiryFilter('unavailable-items')
  }
  
  const handleIngredientIssuesClick = () => {
    setExpiryFilter('ingredient-issues')
  }
  
  const handleExpiringSoonClick = () => {
    setExpiryFilter('expiring-soon')
  }
  
  // Get reason for unavailable items based on alerts
  const getUnavailableReason = () => {
    const criticalAlert = alerts.find(alert => alert.type === 'critical-stock')
    const expiredAlert = alerts.find(alert => alert.type === 'error')
    const lowStockAlert = alerts.find(alert => alert.type === 'low-stock')
    
    if (criticalAlert && criticalAlert.items.length > 0) {
      return ` (${criticalAlert.items.length} due to out-of-stock ingredients)`
    }
    if (expiredAlert && expiredAlert.items.length > 0) {
      return ` (${expiredAlert.items.length} due to expired ingredients)`
    }
    if (lowStockAlert && lowStockAlert.items.length > 0) {
      return ` (${lowStockAlert.items.length} due to low stock ingredients)`
    }
    return ''
  }
  
  // Initialize menu items with availability status
  useEffect(() => {
    const menuItemsData = getItemsByCategory('menu-items').map(item => ({
      ...item,
      isAvailable: item.currentStock > 0, // Default availability based on stock
      requiredIngredients: getRequiredIngredients(item.id),
      category: getMenuCategory(item.name),
      preparationTime: getPreparationTime(item.name)
    }))
    
    setMenuItems(menuItemsData)
    setFilteredItems(menuItemsData)
  }, [])
  
  // Generate alerts for menu items affected by low stock ingredients
  useEffect(() => {
    const newAlerts = []
    const lowStockItems = getLowStockItems()
    const criticalStockItems = getCriticalStockItems()
    const expiringItems = getExpiringItems(3) // 3 days for menu items
    const expiredItems = getExpiredItems()
    
    // Alert for menu items affected by critical stock ingredients
    const affectedByOutOfStock = menuItems.filter(menuItem => 
      menuItem.requiredIngredients.some(ingredient => 
        criticalStockItems.some(stockItem => stockItem.id === ingredient.ingredientId)
      )
    )
    
    if (affectedByOutOfStock.length > 0) {
      newAlerts.push({
        id: 'menu-out-of-stock',
        type: 'critical-stock',
        message: `${affectedByOutOfStock.length} menu items are affected by out-of-stock ingredients and should be marked unavailable.`,
        items: affectedByOutOfStock,
        actionLabel: 'Review Items',
        onAction: () => {
          // Auto-disable affected menu items
          setMenuItems(prev => prev.map(item => 
            affectedByOutOfStock.some(affected => affected.id === item.id)
              ? { ...item, isAvailable: false }
              : item
          ))
        }
      })
    }
    
    // Alert for menu items with low stock ingredients
    const affectedByLowStock = menuItems.filter(menuItem => 
      menuItem.requiredIngredients.some(ingredient => 
        lowStockItems.some(stockItem => stockItem.id === ingredient.ingredientId)
      )
    )
    
    if (affectedByLowStock.length > 0) {
      newAlerts.push({
        id: 'menu-low-stock',
        type: 'low-stock',
        message: `${affectedByLowStock.length} menu items may be affected by low stock ingredients.`,
        items: affectedByLowStock,
        actionLabel: 'Review Stock',
        onAction: () => setExpiryFilter('low-stock-ingredients')
      })
    }
    
    // Alert for expired ingredients affecting menu items
    if (expiredItems.length > 0) {
      const affectedByExpired = menuItems.filter(menuItem => 
        menuItem.requiredIngredients.some(ingredient => 
          expiredItems.some(expiredItem => expiredItem.id === ingredient.ingredientId)
        )
      )
      
      if (affectedByExpired.length > 0) {
        newAlerts.push({
          id: 'menu-expired-ingredients',
          type: 'error',
          message: `${affectedByExpired.length} menu items have expired ingredients and must be disabled.`,
          items: affectedByExpired,
          actionLabel: 'Disable Items',
          onAction: () => {
            setMenuItems(prev => prev.map(item => 
              affectedByExpired.some(affected => affected.id === item.id)
                ? { ...item, isAvailable: false }
                : item
            ))
          }
        })
      }
    }
    
    setAlerts(newAlerts)
  }, [menuItems])
  
  // Filter items based on search and filters
  useEffect(() => {
    let filtered = menuItems
    
    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(item => item.category === selectedCategory)
    }
    
    // Expiry filter
    if (expiryFilter) {
      const now = new Date()
      switch (expiryFilter) {
        case 'expiring-soon':
          filtered = filtered.filter(item => {
            if (!item.expirationDate) return false
            const daysUntilExpiry = Math.ceil((new Date(item.expirationDate) - now) / (1000 * 60 * 60 * 24))
            return daysUntilExpiry <= 3 && daysUntilExpiry >= 0
          })
          break
        case 'expired':
          filtered = filtered.filter(item => 
            item.expirationDate && new Date(item.expirationDate) < now
          )
          break
        case 'unavailable-items':
          filtered = filtered.filter(item => !item.isAvailable)
          break
        case 'ingredient-issues':
          // Combine all ingredient-related problems
          const lowStockItems = getLowStockItems()
          const criticalStockItems = getCriticalStockItems()
          const expiredItems = getExpiredItems()
          
          filtered = filtered.filter(item => 
            item.requiredIngredients.some(ingredient => 
              lowStockItems.some(stockItem => stockItem.id === ingredient.ingredientId) ||
              criticalStockItems.some(stockItem => stockItem.id === ingredient.ingredientId) ||
              expiredItems.some(expiredItem => expiredItem.id === ingredient.ingredientId)
            )
          )
          break
        default:
          break
      }
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
  }, [menuItems, searchQuery, selectedCategory, expiryFilter, sortBy, sortDirection])
  
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
  
  // Handle availability toggle
  const handleAvailabilityToggle = (itemId, newAvailability) => {
    setMenuItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, isAvailable: newAvailability }
        : item
    ))
  }
  
  // Handle row click to view item details
  const handleRowClick = (item) => {
    window.location.href = `/inventory/${item.id}`
  }
  
  // Column definitions for menu items table
  const columns = [
    { 
      key: 'name', 
      label: 'Menu Item', 
      sortable: true,
      render: (value, item) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-sm text-gray-500">{item.category}</div>
        </div>
      )
    },
    { 
      key: 'isAvailable', 
      label: 'Available', 
      sortable: true,
      render: (value, item) => (
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={value}
            onChange={(e) => {
              e.stopPropagation()
              handleAvailabilityToggle(item.id, e.target.checked)
            }}
            className="rounded border-gray-300 text-black focus:ring-black"
          />
          <span className={`text-sm ${value ? 'text-green-600' : 'text-red-600'}`}>
            {value ? 'Available' : 'Unavailable'}
          </span>
        </label>
      )
    },
    { 
      key: 'currentStock', 
      label: 'Stock Level', 
      sortable: true,
      render: (value, item) => (
        <div className="flex items-center space-x-2">
          <span className={`font-medium ${
            value === 0 ? 'text-red-600' : 
            value <= item.restockThreshold ? 'text-yellow-600' : 
            'text-green-600'
          }`}>
            {value} {item.unit}
          </span>
          <div className={`w-2 h-2 rounded-full ${
            value === 0 ? 'bg-red-500' : 
            value <= item.restockThreshold ? 'bg-yellow-500' : 
            'bg-green-500'
          }`}></div>
        </div>
      )
    },
    { 
      key: 'expirationDate', 
      label: 'Expiry Date', 
      sortable: true,
      render: (value) => {
        if (!value) return <span className="text-gray-400">No expiry</span>
        
        const expiryDate = new Date(value)
        const now = new Date()
        const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24))
        
        let colorClass = 'text-gray-700'
        let urgencyIndicator = null
        
        if (daysUntilExpiry < 0) {
          colorClass = 'text-red-600 font-medium'
          urgencyIndicator = <Badge variant="critical" className="ml-2">EXPIRED</Badge>
        } else if (daysUntilExpiry <= 3) {
          colorClass = 'text-orange-600 font-medium'
          urgencyIndicator = <Badge variant="low" className="ml-2">URGENT</Badge>
        } else if (daysUntilExpiry <= 7) {
          colorClass = 'text-yellow-600'
          urgencyIndicator = <Badge variant="low" className="ml-2">SOON</Badge>
        }
        
        return (
          <div className="flex items-center">
            <span className={colorClass}>
              {expiryDate.toLocaleDateString()}
            </span>
            {urgencyIndicator}
          </div>
        )
      }
    },
    { 
      key: 'preparationTime', 
      label: 'Prep Time', 
      sortable: true,
      render: (value) => `${value} min`
    },
    { 
      key: 'requiredIngredients', 
      label: 'Ingredients Status', 
      sortable: false,
      render: (ingredients) => {
        const lowStockItems = getLowStockItems()
        const criticalStockItems = getCriticalStockItems()
        
        const criticalIngredients = ingredients.filter(ing => 
          criticalStockItems.some(item => item.id === ing.ingredientId)
        )
        const lowStockIngredients = ingredients.filter(ing => 
          lowStockItems.some(item => item.id === ing.ingredientId)
        )
        
        if (criticalIngredients.length > 0) {
          return (
            <Badge variant="critical">
              {criticalIngredients.length} Critical
            </Badge>
          )
        } else if (lowStockIngredients.length > 0) {
          return (
            <Badge variant="low">
              {lowStockIngredients.length} Low Stock
            </Badge>
          )
        } else {
          return (
            <Badge variant="normal">
              All Good
            </Badge>
          )
        }
      }
    }
  ]
  
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <p className="text-gray-500 font-body">
            Manage menu availability and ingredients
          </p>
        </div>
        <Button
          onClick={() => setShowAddMenuItemModal(true)}
          className="bg-black text-white hover:bg-gray-800"
        >
          Add Menu Item
        </Button>
      </div>
      
      {/* Menu Management Cards - Single Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
        {/* All Menu Items Card */}
        <div 
          className={`bg-white rounded-lg border p-6 cursor-pointer transition-all duration-200 ease-out hover:shadow-sm ${
            !expiryFilter ? 'border-slate-700 bg-slate-50' : 'border-gray-200'
          }`}
          onClick={handleAllItemsClick}
        >
          <div className="flex items-start justify-between mb-0 h-12">
            <h3 className="font-heading font-medium text-lg leading-tight">All Items</h3>
          </div>
          <p className="text-3xl font-heading font-medium text-slate-700 mb-1">{menuItems.length}</p>
          <p className="text-sm text-gray-500">Menu items</p>
        </div>
        
        {/* Available Items Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-0 h-12">
            <h3 className="font-heading font-medium text-lg leading-tight">Available</h3>
          </div>
          <p className="text-3xl font-heading font-medium text-green-600 mb-1">
            {menuItems.filter(item => item.isAvailable).length}
          </p>
          <p className="text-sm text-gray-500">Currently offered</p>
        </div>
        
        {/* Unavailable Items Card */}
        <div 
          className={`bg-white rounded-lg border p-6 cursor-pointer transition-all duration-200 ease-out hover:shadow-sm ${
            expiryFilter === 'unavailable-items' ? 'border-red-800 bg-red-50' :
            menuItems.filter(item => !item.isAvailable).length > 0 ? 'border-red-200' : 'border-gray-200'
          }`}
          onClick={handleUnavailableClick}
        >
          <div className="flex items-start justify-between mb-0 h-12">
            <h3 className="font-heading font-medium text-lg leading-tight">Unavailable</h3>
          </div>
          <p className={`text-3xl font-heading font-medium mb-1 ${
            menuItems.filter(item => !item.isAvailable).length > 0 ? 'text-red-800' : 'text-slate-700'
          }`}>
            {menuItems.filter(item => !item.isAvailable).length}
          </p>
          <p className="text-sm text-gray-500">
            {menuItems.filter(item => !item.isAvailable).length > 0 ? 
              'Items disabled' : 
              'All available'
            }
          </p>
        </div>
        
        {/* Combined Ingredient Issues Card */}
        <div 
          className={`bg-white rounded-lg border p-6 cursor-pointer transition-all duration-200 ease-out hover:shadow-sm ${
            expiryFilter === 'ingredient-issues' ? 'border-red-800 bg-red-50' :
            (alerts.find(alert => alert.type === 'critical-stock') || alerts.find(alert => alert.type === 'low-stock')) ? 'border-red-200' : 'border-gray-200'
          }`}
          onClick={handleIngredientIssuesClick}
        >
          <div className="flex items-start justify-between mb-0 h-12">
            <h3 className="font-heading font-medium text-lg leading-tight">Ingredient Issues</h3>
          </div>
          <p className={`text-3xl font-heading font-medium mb-1 ${
            (alerts.find(alert => alert.type === 'critical-stock') || alerts.find(alert => alert.type === 'low-stock')) ? 'text-red-800' : 'text-slate-700'
          }`}>
            {(alerts.find(alert => alert.type === 'critical-stock')?.items.length || 0) + (alerts.find(alert => alert.type === 'low-stock')?.items.length || 0)}
          </p>
          <p className="text-sm text-gray-500">
            {(alerts.find(alert => alert.type === 'critical-stock') || alerts.find(alert => alert.type === 'low-stock')) ? 
              'Stock issues detected' : 
              'All ingredients good'
            }
          </p>
        </div>
        
        {/* Expiring Soon Card */}
        <div 
          className={`bg-white rounded-lg border p-6 cursor-pointer transition-all duration-200 ease-out hover:shadow-sm ${
            expiryFilter === 'expiring-soon' ? 'border-orange-800 bg-orange-50' :
            getExpiringItems(3).length > 0 ? 'border-orange-200' : 'border-gray-200'
          }`}
          onClick={handleExpiringSoonClick}
        >
          <div className="flex items-start justify-between mb-0 h-12">
            <h3 className="font-heading font-medium text-lg leading-tight">Expiring Soon</h3>
          </div>
          <p className={`text-3xl font-heading font-medium mb-1 ${
            getExpiringItems(3).length > 0 ? 'text-orange-800' : 'text-slate-700'
          }`}>
            {getExpiringItems(3).length}
          </p>
          <p className="text-sm text-gray-500">
            {getExpiringItems(3).length > 0 ? 'Within 3 days' : 'None expiring'}
          </p>
        </div>
      </div>
      
      {/* Menu Management Table */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="font-heading font-medium text-lg">
            Menu Items
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
            selectedCategory={selectedCategory}
            onCategoryFilter={setSelectedCategory}
            categoryOptions={[
              { label: 'All Categories', value: '' },
              { label: 'Appetizer', value: 'appetizer' },
              { label: 'Main Course', value: 'main-course' },
              { label: 'Dessert', value: 'dessert' },
              { label: 'Beverage', value: 'beverage' }
            ]}
            expiryFilter={expiryFilter}
            onExpiryFilter={setExpiryFilter}
            expiryOptions={[
              { label: 'All Items', value: '' },
              { label: 'Expiring Soon (3 days)', value: 'expiring-soon' },
              { label: 'Expired', value: 'expired' },
              { label: 'Ingredient Issues', value: 'ingredient-issues' }
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
          showSearch={false} // Using FilterBar instead
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
      
    </div>
  )
}

// Helper functions to simulate menu item data
function getRequiredIngredients(menuItemId) {
  // Mock ingredient requirements for menu items
  const ingredientMap = {
    'menu-001': [
      { ingredientId: 'menu-001', quantityRequired: 0.05, unit: 'kg', isCritical: true }
    ],
    'menu-002': [
      { ingredientId: 'menu-002', quantityRequired: 0.2, unit: 'kg', isCritical: true },
      { ingredientId: 'menu-003', quantityRequired: 0.1, unit: 'kg', isCritical: false }
    ],
    'menu-003': [
      { ingredientId: 'menu-003', quantityRequired: 0.15, unit: 'kg', isCritical: true }
    ],
    'menu-004': [
      { ingredientId: 'menu-004', quantityRequired: 0.25, unit: 'kg', isCritical: true },
      { ingredientId: 'menu-003', quantityRequired: 0.1, unit: 'kg', isCritical: false }
    ],
    'menu-005': [
      { ingredientId: 'menu-005', quantityRequired: 0.15, unit: 'kg', isCritical: true }
    ],
    'menu-006': [
      { ingredientId: 'menu-006', quantityRequired: 0.01, unit: 'bottles', isCritical: false }
    ]
  }
  
  return ingredientMap[menuItemId] || []
}

function getMenuCategory(itemName) {
  // Categorize menu items based on name
  if (itemName.toLowerCase().includes('coffee')) return 'beverage'
  if (itemName.toLowerCase().includes('salmon') || itemName.toLowerCase().includes('wagyu') || itemName.toLowerCase().includes('beef')) return 'main-course'
  if (itemName.toLowerCase().includes('vegetables')) return 'appetizer'
  if (itemName.toLowerCase().includes('pasta')) return 'main-course'
  if (itemName.toLowerCase().includes('truffle')) return 'appetizer'
  return 'main-course'
}

function getPreparationTime(itemName) {
  // Mock preparation times
  if (itemName.toLowerCase().includes('coffee')) return 5
  if (itemName.toLowerCase().includes('salmon')) return 25
  if (itemName.toLowerCase().includes('vegetables')) return 15
  if (itemName.toLowerCase().includes('wagyu') || itemName.toLowerCase().includes('beef')) return 35
  if (itemName.toLowerCase().includes('pasta')) return 20
  if (itemName.toLowerCase().includes('truffle')) return 10
  return 20
}