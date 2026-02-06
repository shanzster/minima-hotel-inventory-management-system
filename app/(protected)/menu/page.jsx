'use client'

import { useState, useEffect } from 'react'
import { usePageTitle } from '../../../hooks/usePageTitle'
import InventoryTable from '../../../components/inventory/InventoryTable'
import FilterBar from '../../../components/inventory/FilterBar'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import Modal from '../../../components/ui/Modal'
import AddMenuItemForm from '../../../components/inventory/AddMenuItemForm'
import MenuItemDetailsModal from '../../../components/inventory/MenuItemDetailsModal'
import menuApi from '../../../lib/menuApi'
import inventoryApi from '../../../lib/inventoryApi'

export default function MenuManagementPage() {
  const { setTitle } = usePageTitle()
  const [menuItems, setMenuItems] = useState([])
  const [filteredItems, setFilteredItems] = useState([])
  const [availableItems, setAvailableItems] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [expiryFilter, setExpiryFilter] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [sortDirection, setSortDirection] = useState('asc')
  const [alerts, setAlerts] = useState([])
  const [expiringItemsCount, setExpiringItemsCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [showAddMenuItemModal, setShowAddMenuItemModal] = useState(false)
  const [showMenuItemDetailsModal, setShowMenuItemDetailsModal] = useState(false)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [selectedMenuItem, setSelectedMenuItem] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUsingFirebase, setIsUsingFirebase] = useState(false)
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

  // Load menu items and inventory data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        const [menuData, inventoryData] = await Promise.all([
          menuApi.getAll(),
          inventoryApi.getAll()
        ])

        setMenuItems(menuData)
        setAvailableItems(inventoryData)

        // Check if we're using Firebase
        try {
          const testMenu = await menuApi.getAll()
          setIsUsingFirebase(testMenu !== null && testMenu.length >= 0)
        } catch {
          setIsUsingFirebase(false)
        }
      } catch (error) {
        console.error('Error loading menu data:', error)
        setIsUsingFirebase(false)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()

    // Set up real-time listener for menu changes
    const unsubscribe = menuApi.onMenuChange((items) => {
      setMenuItems(items)
    })

    return unsubscribe
  }, [])

  // Generate alerts for menu items affected by low stock ingredients
  useEffect(() => {
    const generateAlerts = async () => {
      if (availableItems.length === 0) return

      const newAlerts = []
      const lowStockItems = await inventoryApi.getLowStockItems()
      const criticalStockItems = await inventoryApi.getCriticalStockItems()
      const expiringItems = await inventoryApi.getExpiringItems(3) // 3 days for menu items
      setExpiringItemsCount(expiringItems.length)
      const expiredItems = await inventoryApi.getExpiredItems()

      // Alert for menu items affected by critical stock ingredients
      const affectedByOutOfStock = menuItems.filter(menuItem =>
        menuItem.requiredIngredients?.some(ingredient =>
          criticalStockItems.some(stockItem => stockItem.id === ingredient.ingredientId)
        ) || false
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
        menuItem.requiredIngredients?.some(ingredient =>
          lowStockItems.some(stockItem => stockItem.id === ingredient.ingredientId)
        ) || false
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
          menuItem.requiredIngredients?.some(ingredient =>
            expiredItems.some(expiredItem => expiredItem.id === ingredient.ingredientId)
          ) || false
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
    }

    generateAlerts()
  }, [menuItems, availableItems])

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
          // Combine all ingredient-related problems using real data
          filtered = filtered.filter(item =>
            item.requiredIngredients?.some(ingredient => {
              const inventoryItem = availableItems.find(inv => inv.id === ingredient.ingredientId)
              if (!inventoryItem) return false

              const isOutOfStock = inventoryItem.currentStock === 0
              const isLowStock = inventoryItem.currentStock > 0 && inventoryItem.currentStock <= inventoryItem.restockThreshold
              const isExpired = inventoryItem.expirationDate && new Date(inventoryItem.expirationDate) < new Date()

              return isOutOfStock || isLowStock || isExpired
            }) || false
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
  const handleAvailabilityToggle = async (itemId, newAvailability) => {
    try {
      // Update in Firebase first
      await menuApi.updateAvailability(itemId, newAvailability)

      // Update local state
      setMenuItems(prev => prev.map(item =>
        item.id === itemId
          ? { ...item, isAvailable: newAvailability }
          : item
      ))
    } catch (error) {
      console.error('Error updating menu item availability:', error)
      alert('Failed to update menu item. Please try again.')
    }
  }

  // Handle create menu item
  const handleCreateMenuItem = async (menuItemData) => {
    try {
      await menuApi.create(menuItemData)
      setShowAddMenuItemModal(false)
      alert('Menu item created successfully!')
    } catch (error) {
      console.error('Error creating menu item:', error)
      alert('Failed to create menu item. Please try again.')
    }
  }

  // Handle update menu item availability
  const handleUpdateMenuItemAvailability = async (itemId, isAvailable) => {
    try {
      await menuApi.updateAvailability(itemId, isAvailable)
      alert(`Menu item ${isAvailable ? 'enabled' : 'disabled'} successfully!`)

      // Update local state
      setMenuItems(prev => prev.map(item =>
        item.id === itemId ? { ...item, isAvailable } : item
      ))
    } catch (error) {
      console.error('Error updating menu item availability:', error)
      alert('Failed to update menu item. Please try again.')
    }
  }

  // Handle update menu item details
  const handleUpdateMenuItem = async (itemId, itemData) => {
    try {
      await menuApi.update(itemId, itemData)
      alert('Menu item updated successfully!')
      setShowMenuItemDetailsModal(false)
      setSelectedMenuItem(null)

      // Update local state
      setMenuItems(prev => prev.map(item =>
        item.id === itemId ? { ...item, ...itemData } : item
      ))
    } catch (error) {
      console.error('Error updating menu item:', error)
      alert('Failed to update menu item. Please try again.')
    }
  }

  // Handle row click to view menu item details
  const handleRowClick = (menuItem) => {
    setSelectedMenuItem(menuItem)
    setShowMenuItemDetailsModal(true)
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
      key: 'currentStock',
      label: 'Stock Level',
      sortable: true,
      render: (value, item) => (
        <div className="flex items-center space-x-2">
          <span className={`font-medium ${value === 0 ? 'text-red-600' :
              value <= item.restockThreshold ? 'text-yellow-600' :
                'text-green-600'
            }`}>
            {value} {item.unit}
          </span>
          <div className={`w-2 h-2 rounded-full ${value === 0 ? 'bg-red-500' :
              value <= item.restockThreshold ? 'bg-yellow-500' :
                'bg-green-500'
            }`}></div>
        </div>
      )
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
        if (!ingredients || !Array.isArray(ingredients)) {
          return <Badge variant="normal">No ingredients</Badge>
        }

        // Use real inventory data to check stock levels
        const criticalIngredients = ingredients.filter(ing =>
          availableItems.some(item => item.id === ing.ingredientId && item.currentStock === 0)
        )
        const lowStockIngredients = ingredients.filter(ing =>
          availableItems.some(item => item.id === ing.ingredientId && item.currentStock > 0 && item.currentStock <= item.restockThreshold)
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
    },
    {
      key: 'isAvailable',
      label: 'Available',
      sortable: true,
      render: (value, item) => (
        <label 
          className="flex items-center space-x-2"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={value}
            onChange={(e) => {
              e.stopPropagation()
              handleAvailabilityToggle(item.id, e.target.checked)
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-10 h-6 bg-gray-200 rounded-full appearance-none checked:bg-green-500 transition-colors cursor-pointer relative before:content-[''] before:absolute before:w-4 before:h-4 before:bg-white before:rounded-full before:top-1 before:left-1 before:transition-transform checked:before:translate-x-4"
          />
          <span className={`text-sm font-bold uppercase tracking-tighter ${value ? 'text-green-600' : 'text-red-600'}`}>
            {value ? 'Active' : 'Sold Out'}
          </span>
        </label>
      )
    }
  ]

  return (
    <div className="p-4 mx-2">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold text-gray-900 mb-1">Menu Management</h1>
            <p className="text-gray-500 font-body text-sm">
              Manage menu availability and ingredients
            </p>
            {!isLoading && (
              <div className="flex items-center mt-2">
                <div className={`w-2 h-2 rounded-full mr-2 ${isUsingFirebase ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <span className="text-xs text-gray-400">
                  {isUsingFirebase ? 'Connected to Firebase Database' : 'Using mock data - configure Firebase for real data'}
                </span>
              </div>
            )}
          </div>
          
          {/* Add Menu Item Button - Top Right */}
          <Button
            onClick={() => setShowAddMenuItemModal(true)}
            className="bg-black text-white hover:bg-gray-800"
          >
            <svg className="w-4 h-4 mr-2 text-white inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Menu Item
          </Button>
        </div>
      </div>

      {/* Menu Management Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {/* All Menu Items Card */}
        <div
          className={`bg-white/80 backdrop-blur-xl rounded-lg border p-4 cursor-pointer transition-all duration-200 ease-out hover:shadow-xl shadow-xl ${!expiryFilter ? 'border-slate-700 bg-slate-50/80' : 'border-white/20'
            }`}
          onClick={handleAllItemsClick}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h3 className="font-heading font-medium text-sm text-gray-600">All Items</h3>
                <p className="text-2xl font-heading font-bold text-black">{menuItems.length}</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500">Menu items</p>
        </div>

        {/* Available Items Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-lg border border-white/20 p-4 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-heading font-medium text-sm text-gray-600">Available</h3>
                <p className="text-2xl font-heading font-bold text-green-600">
                  {menuItems.filter(item => item.isAvailable).length}
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500">Currently offered</p>
        </div>

        {/* Unavailable Items Card */}
        <div
          className={`bg-white/80 backdrop-blur-xl rounded-lg border p-4 cursor-pointer transition-all duration-200 ease-out hover:shadow-xl shadow-xl ${expiryFilter === 'unavailable-items' ? 'border-red-800 bg-red-50/80' :
              menuItems.filter(item => !item.isAvailable).length > 0 ? 'border-red-200 bg-red-50/50' : 'border-white/20'
            }`}
          onClick={handleUnavailableClick}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
              <div>
                <h3 className={`font-heading font-medium text-sm ${menuItems.filter(item => !item.isAvailable).length > 0 ? 'text-red-700' : 'text-gray-600'}`}>
                  Unavailable
                </h3>
                <p className={`text-2xl font-heading font-bold ${menuItems.filter(item => !item.isAvailable).length > 0 ? 'text-red-600' : 'text-gray-700'
                  }`}>
                  {menuItems.filter(item => !item.isAvailable).length}
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            {menuItems.filter(item => !item.isAvailable).length > 0 ?
              'Items disabled' :
              'All available'
            }
          </p>
        </div>

        {/* Combined Ingredient Issues Card */}
        <div
          className={`bg-white/80 backdrop-blur-xl rounded-lg border p-4 cursor-pointer transition-all duration-200 ease-out hover:shadow-xl shadow-xl ${expiryFilter === 'ingredient-issues' ? 'border-amber-800 bg-amber-50/80' :
              (alerts.find(alert => alert.type === 'critical-stock') || alerts.find(alert => alert.type === 'low-stock')) ? 'border-amber-200 bg-amber-50/50' : 'border-white/20'
            }`}
          onClick={handleIngredientIssuesClick}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className={`font-heading font-medium text-sm ${(alerts.find(alert => alert.type === 'critical-stock') || alerts.find(alert => alert.type === 'low-stock')) ? 'text-amber-700' : 'text-gray-600'}`}>
                  Ingredient Issues
                </h3>
                <p className={`text-2xl font-heading font-bold ${(alerts.find(alert => alert.type === 'critical-stock') || alerts.find(alert => alert.type === 'low-stock')) ? 'text-amber-600' : 'text-gray-700'
                  }`}>
                  {(alerts.find(alert => alert.type === 'critical-stock')?.items.length || 0) + (alerts.find(alert => alert.type === 'low-stock')?.items.length || 0)}
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            {(alerts.find(alert => alert.type === 'critical-stock') || alerts.find(alert => alert.type === 'low-stock')) ?
              'Stock issues detected' :
              'All ingredients good'
            }
          </p>
        </div>

        {/* Expiring Soon Card */}
        <div
          className={`bg-white/80 backdrop-blur-xl rounded-lg border p-4 cursor-pointer transition-all duration-200 ease-out hover:shadow-xl shadow-xl ${expiryFilter === 'expiring-soon' ? 'border-orange-800 bg-orange-50/80' :
              expiringItemsCount > 0 ? 'border-orange-200 bg-orange-50/50' : 'border-white/20'
            }`}
          onClick={handleExpiringSoonClick}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className={`font-heading font-medium text-sm ${expiringItemsCount > 0 ? 'text-orange-700' : 'text-gray-600'}`}>
                  Expiring Soon
                </h3>
                <p className={`text-2xl font-heading font-bold ${expiringItemsCount > 0 ? 'text-orange-600' : 'text-gray-700'
                  }`}>
                  {expiringItemsCount}
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            {expiringItemsCount > 0 ? 'Within 3 days' : 'None expiring'}
          </p>
        </div>
      </div>

      {/* Menu Management Table */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-lg shadow-xl">
        <div className="border-b border-white/20 px-4 py-3">
          <h3 className="font-heading font-medium text-base">
            Menu Items
            <span className="text-gray-500 font-normal ml-2 text-sm">
              ({filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'})
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
                  placeholder="Search menu items..."
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
                onClick={() => alert('Print functionality coming soon')}
                className="inline-flex items-center px-3 py-2 bg-white/60 backdrop-blur-sm border border-white/20 rounded-lg text-sm text-gray-700 hover:bg-white/80 transition-all"
              >
                <svg className="w-4 h-4 mr-2 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print
              </button>
              
              {/* Export to CSV Button */}
              <button
                onClick={() => alert('Export functionality coming soon')}
                className="inline-flex items-center px-3 py-2 bg-white/60 backdrop-blur-sm border border-white/20 rounded-lg text-sm text-gray-700 hover:bg-white/80 transition-all"
              >
                <svg className="w-4 h-4 mr-2 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export CSV
              </button>
            </div>
          </div>
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

      {/* Add Menu Item Modal */}
      <Modal
        isOpen={showAddMenuItemModal}
        onClose={() => setShowAddMenuItemModal(false)}
        title="Add New Menu Item"
        size="lg"
      >
        <AddMenuItemForm
          onSubmit={handleCreateMenuItem}
          onCancel={() => setShowAddMenuItemModal(false)}
          isLoading={false}
        />
      </Modal>

      {/* Filter Modal */}
      <Modal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        title="Filter Menu Items"
        size="md"
      >
        <div className="space-y-4">
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="">All Categories</option>
              <option value="appetizer">Appetizer</option>
              <option value="main-course">Main Course</option>
              <option value="dessert">Dessert</option>
              <option value="beverage">Beverage</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={expiryFilter}
              onChange={(e) => setExpiryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="">All Items</option>
              <option value="expiring-soon">Expiring Soon (3 days)</option>
              <option value="expired">Expired</option>
              <option value="ingredient-issues">Ingredient Issues</option>
              <option value="unavailable-items">Unavailable Items</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
            <select
              value={`${sortBy}-${sortDirection}`}
              onChange={(e) => {
                const [newSortBy, newDirection] = e.target.value.split('-')
                setSortBy(newSortBy)
                setSortDirection(newDirection)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="currentStock-desc">Stock Level</option>
              <option value="createdAt-desc">Recently Added</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="ghost"
              onClick={() => {
                setSelectedCategory('')
                setExpiryFilter('')
                setSortBy('name')
                setSortDirection('asc')
              }}
            >
              Clear Filters
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

      {/* Menu Item Details Modal */}
      <MenuItemDetailsModal
        isOpen={showMenuItemDetailsModal}
        onClose={() => {
          setShowMenuItemDetailsModal(false)
          setSelectedMenuItem(null)
        }}
        menuItem={selectedMenuItem}
        onUpdateAvailability={handleUpdateMenuItemAvailability}
        onUpdateItem={handleUpdateMenuItem}
        isLoading={false}
      />
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