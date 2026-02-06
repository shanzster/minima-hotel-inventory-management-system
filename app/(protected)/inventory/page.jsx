'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import InventoryTable from '../../../components/inventory/InventoryTable'
import FilterBar from '../../../components/inventory/FilterBar'
import Button from '../../../components/ui/Button'
import Modal from '../../../components/ui/Modal'
import RestockForm from '../../../components/inventory/RestockForm'
import AddItemForm from '../../../components/inventory/AddItemForm'
import ItemDetailsModal from '../../../components/inventory/ItemDetailsModal'
import { usePageTitle } from '../../../hooks/usePageTitle'
import inventoryApi from '../../../lib/inventoryApi'
import { INVENTORY_CATEGORIES } from '../../../lib/constants'

// Debug helper to check if using Firebase
const isUsingFirebase = () => {
  return typeof window !== 'undefined' &&
         console.log &&
         console.log.toString().includes('Firebase Status: Connected')
}

export default function InventoryPage() {
  const router = useRouter()
  const { setTitle } = usePageTitle()
  const [inventoryItems, setInventoryItems] = useState([])
  const [filteredItems, setFilteredItems] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [expiryFilter, setExpiryFilter] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [sortDirection, setSortDirection] = useState('asc')
  const [selectedItem, setSelectedItem] = useState(null)
  const [showAddItemModal, setShowAddItemModal] = useState(false)
  const [showRestockModal, setShowRestockModal] = useState(false)
  const [showItemDetailsModal, setShowItemDetailsModal] = useState(false)
  const [restockType, setRestockType] = useState('stock-in')
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isAddingItem, setIsAddingItem] = useState(false)
  const [isUpdatingItem, setIsUpdatingItem] = useState(false)
  const [isUsingFirebase, setIsUsingFirebase] = useState(false)
  const [showFilterModal, setShowFilterModal] = useState(false)
  
  // Export to CSV function
  const exportToCSV = () => {
    const headers = ['Item Name', 'Category', 'Current Stock', 'Unit', 'Stock Status', 'Location', 'Expiry Date']
    const csvData = filteredItems.map(item => {
      const stockStatus = getStockStatus(item)
      const statusText = stockStatus === 'critical' ? 'Critical' :
                        stockStatus === 'low' ? 'Low Stock' :
                        stockStatus === 'excess' ? 'Excess' : 'Normal'
      
      return [
        item.name,
        item.category.replace('-', ' '),
        item.currentStock,
        item.unit,
        statusText,
        item.location,
        item.expirationDate ? new Date(item.expirationDate).toLocaleDateString() : '-'
      ]
    })
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `inventory-${new Date().toISOString().split('T')[0]}.csv`)
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
    const totalItems = filteredItems.length
    const criticalItems = filteredItems.filter(item => getStockStatus(item) === 'critical').length
    const lowStockItems = filteredItems.filter(item => getStockStatus(item) === 'low').length
    const expiredItems = filteredItems.filter(item => {
      if (!item.expirationDate) return false
      return new Date(item.expirationDate) < new Date()
    }).length
    const expiringItems = filteredItems.filter(item => {
      if (!item.expirationDate) return false
      const expiryDate = new Date(item.expirationDate)
      const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      return expiryDate >= new Date() && expiryDate <= sevenDaysFromNow
    }).length
    
    // Get active filters
    const activeFilters = []
    if (searchQuery) activeFilters.push(`Search: "${searchQuery}"`)
    if (categoryFilter) activeFilters.push(`Category: ${categoryFilter.replace('-', ' ')}`)
    if (statusFilter) activeFilters.push(`Status: ${statusFilter}`)
    if (expiryFilter) activeFilters.push(`Expiry: ${expiryFilter.replace('-', ' ')}`)
    if (sortBy !== 'name' || sortDirection !== 'asc') {
      activeFilters.push(`Sort: ${sortBy} (${sortDirection})`)
    }
    
    // Generate print HTML
    const printHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Inventory Report</title>
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
            
            .inventory-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 16px;
            }
            
            .inventory-table th {
              font-family: 'Poppins', sans-serif;
              background: #f9fafb;
              padding: 8px 6px;
              text-align: left;
              font-weight: 500;
              font-size: 10px;
              color: #374151;
              border-bottom: 1px solid #e5e7eb;
            }
            
            .inventory-table td {
              font-family: 'Poppins', sans-serif;
              padding: 6px;
              font-size: 10px;
              font-weight: 400;
              color: #1f2937;
              border-bottom: 1px solid #f3f4f6;
            }
            
            .inventory-table tr:nth-child(even) {
              background: #fafafa;
            }
            
            .status-critical { font-family: 'Poppins', sans-serif; color: #dc2626; font-weight: 500; }
            .status-low { font-family: 'Poppins', sans-serif; color: #d97706; font-weight: 500; }
            .status-normal { font-family: 'Poppins', sans-serif; color: #059669; font-weight: 400; }
            .status-excess { font-family: 'Poppins', sans-serif; color: #2563eb; font-weight: 400; }
            
            .category-badge {
              background: #f3f4f6;
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 9px;
              color: #374151;
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
          <!-- Report Header -->
          <div class="report-header">
            <h1 class="report-title">Inventory Report</h1>
            <p class="report-subtitle">Comprehensive inventory status and analysis</p>
          </div>
          
          <!-- Report Metadata -->
          <div class="report-meta">
            <div>
              <strong>Generated by:</strong> Purchasing Officer<br>
              <strong>Generated on:</strong> ${generatedDate} at ${generatedTime}
            </div>
            <div>
              <strong>Total Items:</strong> ${totalItems}<br>
              <strong>Report Type:</strong> Inventory Status
            </div>
          </div>
          
          <!-- Summary Section -->
          <div class="summary-section">
            <h2 class="summary-title">Executive Summary</h2>
            <div class="summary-grid">
              <div class="summary-item">
                <p class="summary-number">${totalItems}</p>
                <p class="summary-label">Total Items</p>
              </div>
              <div class="summary-item">
                <p class="summary-number" style="color: #dc2626;">${criticalItems}</p>
                <p class="summary-label">Critical Stock</p>
              </div>
              <div class="summary-item">
                <p class="summary-number" style="color: #d97706;">${lowStockItems}</p>
                <p class="summary-label">Low Stock</p>
              </div>
              <div class="summary-item">
                <p class="summary-number" style="color: #dc2626;">${expiredItems + expiringItems}</p>
                <p class="summary-label">Expiry Issues</p>
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
          
          <!-- Inventory Table -->
          <div class="table-section">
            <h2 class="table-title">Inventory Details</h2>
            <table class="inventory-table">
              <thead>
                <tr>
                  <th style="width: 25%;">Item Name</th>
                  <th style="width: 15%;">Category</th>
                  <th style="width: 12%;">Current Stock</th>
                  <th style="width: 12%;">Status</th>
                  <th style="width: 15%;">Location</th>
                  <th style="width: 21%;">Expiry Date</th>
                </tr>
              </thead>
              <tbody>
                ${filteredItems.map(item => {
                  const stockStatus = getStockStatus(item)
                  const statusText = stockStatus === 'critical' ? 'Critical' :
                                   stockStatus === 'low' ? 'Low Stock' :
                                   stockStatus === 'excess' ? 'Excess' : 'Normal'
                  const statusClass = `status-${stockStatus}`
                  
                  const expiryDate = item.expirationDate ? new Date(item.expirationDate) : null
                  const expiryText = expiryDate ? expiryDate.toLocaleDateString() : '-'
                  
                  let expiryClass = ''
                  if (expiryDate) {
                    const now = new Date()
                    const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24))
                    if (daysUntilExpiry <= 0) expiryClass = 'status-critical'
                    else if (daysUntilExpiry <= 7) expiryClass = 'status-low'
                  }
                  
                  return `
                    <tr>
                      <td><strong>${item.name}</strong></td>
                      <td><span class="category-badge">${item.category.replace('-', ' ')}</span></td>
                      <td><strong>${item.currentStock}</strong> ${item.unit}</td>
                      <td><span class="${statusClass}">${statusText}</span></td>
                      <td>${item.location}</td>
                      <td><span class="${expiryClass}">${expiryText}</span></td>
                    </tr>
                  `
                }).join('')}
              </tbody>
            </table>
          </div>
          
          <!-- Footer -->
          <div class="footer">
            <p>This report was generated automatically by the Inventory Management System</p>
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
  const pageSize = 25 // Optimal size for inventory review

  // Set page title
  useEffect(() => {
    setTitle('Inventory')
  }, [setTitle])

  // Load inventory data
  useEffect(() => {
    const loadInventory = async () => {
      try {
        setIsLoading(true)
        const items = await inventoryApi.getAll()
        setInventoryItems(items)

        // Check if we're using Firebase by trying to access it
        try {
          const testItems = await inventoryApi.getAll()
          setIsUsingFirebase(testItems !== null && testItems.length >= 0)
        } catch {
          setIsUsingFirebase(false)
        }
      } catch (error) {
        console.error('Error loading inventory:', error)
        setIsUsingFirebase(false)
      } finally {
        setIsLoading(false)
      }
    }

    loadInventory()

    // Set up real-time listener if using Firebase
    const unsubscribe = inventoryApi.onInventoryChange((items) => {
      setInventoryItems(items)
    })

    return unsubscribe
  }, [])
  

  
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
  const locations = [...new Set(inventoryItems.map(item => item.location))].sort()

  // Calculate alerts (using async functions)
  const [alerts, setAlerts] = useState({
    lowStockItems: [],
    criticalStockItems: [],
    expiringItems: [],
    expiredItems: []
  })

  useEffect(() => {
    const loadAlerts = async () => {
      try {
        const [lowStock, criticalStock, expiring, expired] = await Promise.all([
          inventoryApi.getLowStockItems(),
          inventoryApi.getCriticalStockItems(),
          inventoryApi.getExpiringItems(7),
          inventoryApi.getExpiredItems()
        ])

        setAlerts({
          lowStockItems: lowStock,
          criticalStockItems: criticalStock,
          expiringItems: expiring,
          expiredItems: expired
        })
      } catch (error) {
        console.error('Error loading alerts:', error)
      }
    }

    if (inventoryItems.length > 0) {
      loadAlerts()
    }
  }, [inventoryItems])

  const { lowStockItems, criticalStockItems, expiringItems, expiredItems } = alerts
  
  // Apply filters and search
  useEffect(() => {
    let filtered = [...inventoryItems]
    
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
  }, [inventoryItems, searchQuery, categoryFilter, statusFilter, expiryFilter, sortBy, sortDirection])
  
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
    setSelectedItem(item)
    setShowItemDetailsModal(true)
  }
  
  const handleRestockClick = (item, type) => {
    setSelectedItem(item)
    setRestockType(type)
    setShowRestockModal(true)
  }
  
  const handleRestockSubmit = async (transactionData) => {
    try {
      if (selectedItem) {
        let quantityChange
        
        if (restockType === 'adjustment') {
          // For adjustments, calculate the difference between new quantity and current stock
          // The form should ask for the NEW total quantity, not the change
          quantityChange = transactionData.quantity - selectedItem.currentStock
        } else {
          // For stock-in and stock-out, use the quantity as a change
          quantityChange = restockType === 'stock-in' ? transactionData.quantity : -transactionData.quantity
        }
        
        await inventoryApi.updateStock(selectedItem.id, quantityChange, transactionData)
        
        const actionText = restockType === 'stock-in' ? 'Stock In' : 
                          restockType === 'stock-out' ? 'Stock Out' : 
                          'Stock Adjustment'
        alert(`${actionText} transaction recorded successfully`)
      }
    } catch (error) {
      console.error('Error processing restock transaction:', error)
      alert('Failed to process transaction. Please try again.')
    }
    setShowRestockModal(false)
    setSelectedItem(null)
  }

  const handleAddItemSubmit = async (itemData) => {
    try {
      setIsAddingItem(true)
      await inventoryApi.create(itemData)
      setShowAddItemModal(false)
      alert('Item added successfully!')
    } catch (error) {
      console.error('Error adding item:', error)
      alert('Failed to add item. Please try again.')
    } finally {
      setIsAddingItem(false)
    }
  }

  const handleUpdateStock = async (itemId, quantityChange, transactionData) => {
    try {
      await inventoryApi.updateStock(itemId, quantityChange, transactionData)
      alert(`Stock updated successfully!`)
      // Refresh the inventory data
      const items = await inventoryApi.getAll()
      setInventoryItems(items)
    } catch (error) {
      console.error('Error updating stock:', error)
      throw error
    }
  }

  const handleUpdateItem = async (itemId, itemData) => {
    try {
      setIsUpdatingItem(true)
      await inventoryApi.update(itemId, itemData)
      alert('Item updated successfully!')
      setShowItemDetailsModal(false)
      // Refresh the inventory data
      const items = await inventoryApi.getAll()
      setInventoryItems(items)
    } catch (error) {
      console.error('Error updating item:', error)
      throw error
    } finally {
      setIsUpdatingItem(false)
    }
  }
  
  const columns = [
    { key: 'name', label: 'Item Name', sortable: true },
    { key: 'category', label: 'Category', sortable: true, render: (value) => value.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) },
    { 
      key: 'currentStock', 
      label: 'Current Stock', 
      sortable: true, 
      render: (value, item) => {
        // Ensure we're displaying the numeric value with unit
        const stock = typeof value === 'number' ? value : (parseFloat(value) || 0)
        const unit = item.unit || ''
        return `${stock} ${unit}`
      }
    },
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
            className="text-xs px-2 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 backdrop-blur-sm"
          >
            <svg className="w-3 h-3 mr-1 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Stock In
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              handleRestockClick(item, 'stock-out')
            }}
            className="text-xs px-2 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 backdrop-blur-sm"
          >
            <svg className="w-3 h-3 mr-1 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
            </svg>
            Stock Out
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              handleRestockClick(item, 'adjustment')
            }}
            className="text-xs px-2 py-1 bg-amber-100 text-amber-700 hover:bg-amber-200 backdrop-blur-sm"
            title="Force adjust stock quantity"
          >
            <svg className="w-3 h-3 mr-1 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            Adjust
          </Button>
        </div>
      )
    }
  ]
  
  return (
    <div className="p-4 mx-2">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold text-gray-900 mb-1">Inventory Management</h1>
            <p className="text-gray-500 font-body text-sm">
              View and monitor inventory levels for procurement planning
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

        </div>
      </div>
      
      {/* Alert Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {/* All Items Card */}
        <div 
          className={`bg-white/80 backdrop-blur-xl rounded-lg border p-4 cursor-pointer transition-all duration-200 ease-out hover:shadow-xl shadow-xl ${
            !statusFilter && !expiryFilter ? 'border-slate-700 bg-slate-50/80' : 'border-white/20'
          }`}
          onClick={handleAllItemsClick}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M9 21V9l3-2 3 2v12" />
                </svg>
              </div>
              <div>
                <h3 className="font-heading font-medium text-sm text-gray-600">All Items</h3>
                <p className="text-2xl font-heading font-bold text-black">
                  {inventoryItems.length}
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500">Complete inventory</p>
        </div>
        
        {/* Critical Stock Card - RED (Critical) */}
        <div 
          className={`bg-white/80 backdrop-blur-xl rounded-lg border p-4 cursor-pointer transition-all duration-200 ease-out hover:shadow-xl shadow-xl ${
            statusFilter === 'critical' ? 'border-red-800 bg-red-50/80' :
            criticalStockItems.length > 0 ? 'border-red-200 bg-red-50/50' : 'border-white/20'
          }`}
          onClick={handleCriticalClick}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className={`font-heading font-medium text-sm ${
                  criticalStockItems.length > 0 ? 'text-red-700' : 'text-gray-600'
                }`}>Critical Stock</h3>
                <p className={`text-2xl font-heading font-bold ${
                  criticalStockItems.length > 0 ? 'text-red-600' : 'text-gray-700'
                }`}>
                  {criticalStockItems.length}
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            {inventoryItems.length === 0
              ? 'Add items to start tracking'
              : criticalStockItems.length > 0
                ? 'Items out of stock'
                : 'No critical issues'
            }
          </p>
        </div>
        
        {/* Expired Items Card - RED (Critical) */}
        <div 
          className={`bg-white/80 backdrop-blur-xl rounded-lg border p-4 cursor-pointer transition-all duration-200 ease-out hover:shadow-xl shadow-xl ${
            expiryFilter === 'expired' ? 'border-red-800 bg-red-50/80' :
            expiredItems.length > 0 ? 'border-red-200 bg-red-50/50' : 'border-white/20'
          }`}
          onClick={handleExpiredClick}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 4v10a2 2 0 002 2h4a2 2 0 002-2V11M8 7h8m-8 0H6a2 2 0 00-2 2v10a2 2 0 002 2h2M16 7h2a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
                </svg>
              </div>
              <div>
                <h3 className={`font-heading font-medium text-sm ${
                  expiredItems.length > 0 ? 'text-red-700' : 'text-gray-600'
                }`}>Expired Items</h3>
                <p className={`text-2xl font-heading font-bold ${
                  expiredItems.length > 0 ? 'text-red-600' : 'text-gray-700'
                }`}>
                  {expiredItems.length}
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            {inventoryItems.length === 0
              ? 'Add items to track expiry dates'
              : expiredItems.length > 0
                ? 'Items past expiry date'
                : 'No expired items'
            }
          </p>
        </div>
        
        {/* Expiring Soon Card - ORANGE (Expiring) */}
        <div 
          className={`bg-white/80 backdrop-blur-xl rounded-lg border p-4 cursor-pointer transition-all duration-200 ease-out hover:shadow-xl shadow-xl ${
            expiryFilter === 'expiring-soon' ? 'border-orange-800 bg-orange-50/80' :
            expiringItems.length > 0 ? 'border-orange-200 bg-orange-50/50' : 'border-white/20'
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
                <h3 className={`font-heading font-medium text-sm ${
                  expiringItems.length > 0 ? 'text-orange-700' : 'text-gray-600'
                }`}>Expiring Soon</h3>
                <p className={`text-2xl font-heading font-bold ${
                  expiringItems.length > 0 ? 'text-orange-600' : 'text-gray-700'
                }`}>
                  {expiringItems.length}
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            {inventoryItems.length === 0
              ? 'Add items with expiry dates'
              : expiringItems.length > 0
                ? 'Items expire within 7 days'
                : 'No items expiring soon'
            }
          </p>
        </div>
        
        {/* Low Stock Card - AMBER (Warning) */}
        <div 
          className={`bg-white/80 backdrop-blur-xl rounded-lg border p-4 cursor-pointer transition-all duration-200 ease-out hover:shadow-xl shadow-xl ${
            statusFilter === 'low' ? 'border-amber-700 bg-amber-50/80' :
            lowStockItems.length > 0 ? 'border-amber-200 bg-amber-50/50' : 'border-white/20'
          }`}
          onClick={handleLowStockClick}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
              </div>
              <div>
                <h3 className={`font-heading font-medium text-sm ${
                  lowStockItems.length > 0 ? 'text-amber-700' : 'text-gray-600'
                }`}>Low Stock</h3>
                <p className={`text-2xl font-heading font-bold ${
                  lowStockItems.length > 0 ? 'text-amber-600' : 'text-gray-700'
                }`}>
                  {lowStockItems.length}
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            {inventoryItems.length === 0
              ? 'Add items to track stock levels'
              : lowStockItems.length > 0
                ? 'Items need restocking'
                : 'All items well stocked'
            }
          </p>
        </div>
      </div>
      
      {/* Inventory Table with FilterBar */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-lg shadow-xl">
        <div className="border-b border-white/20 px-4 py-3">
          <h3 className="font-heading font-medium text-base">
            Inventory Items
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
                  placeholder="Search inventory items..."
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
        
        {/* Enhanced Inventory Table */}
        <div className="p-4">
          {getPaginatedData().length === 0 ? (
            <div className="text-center py-12">
              <svg className="h-12 w-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M9 21V9l3-2 3 2v12" />
              </svg>
              <p className="text-gray-500 mb-4 text-sm">
                {isUsingFirebase && inventoryItems.length === 0 ? "No data yet" : "No items found"}
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
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Item Name</span>
                          {sortBy === 'name' && (
                            <svg className={`w-4 h-4 ${sortDirection === 'asc' ? 'rotate-0' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          )}
                        </div>
                      </th>
                      <th 
                        className="text-left py-3 px-4 font-heading font-medium text-sm text-gray-600 cursor-pointer hover:text-gray-900 transition-colors"
                        onClick={() => handleSort('category')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Category</span>
                          {sortBy === 'category' && (
                            <svg className={`w-4 h-4 ${sortDirection === 'asc' ? 'rotate-0' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          )}
                        </div>
                      </th>
                      <th 
                        className="text-left py-3 px-4 font-heading font-medium text-sm text-gray-600 cursor-pointer hover:text-gray-900 transition-colors"
                        onClick={() => handleSort('currentStock')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Current Stock</span>
                          {sortBy === 'currentStock' && (
                            <svg className={`w-4 h-4 ${sortDirection === 'asc' ? 'rotate-0' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          )}
                        </div>
                      </th>
                      <th className="text-left py-3 px-4 font-heading font-medium text-sm text-gray-600">
                        Stock Status
                      </th>
                      <th className="text-left py-3 px-4 font-heading font-medium text-sm text-gray-600">
                        Location
                      </th>
                      <th 
                        className="text-left py-3 px-4 font-heading font-medium text-sm text-gray-600 cursor-pointer hover:text-gray-900 transition-colors"
                        onClick={() => handleSort('expirationDate')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Expiry Date</span>
                          {sortBy === 'expirationDate' && (
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
                    {getPaginatedData().map((item, index) => {
                      const stockStatus = getStockStatus(item)
                      const expiryDate = item.expirationDate ? new Date(item.expirationDate) : null
                      const now = new Date()
                      const daysUntilExpiry = expiryDate ? Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24)) : null
                      
                      return (
                        <tr
                          key={item.id}
                          className="border-b border-white/10 hover:bg-white/20 cursor-pointer transition-all duration-200 backdrop-blur-sm"
                          onClick={() => handleRowClick(item)}
                        >
                          {/* Item Name */}
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-3">
                              <div className={`w-3 h-3 rounded-full ${
                                stockStatus === 'critical' ? 'bg-red-500' :
                                stockStatus === 'low' ? 'bg-amber-500' :
                                stockStatus === 'excess' ? 'bg-blue-500' : 'bg-green-500'
                              }`}></div>
                              <div>
                                <p className="font-heading font-medium text-gray-900">{item.name}</p>
                                {item.description && (
                                  <p className="text-sm text-gray-500 truncate max-w-xs">{item.description}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          
                          {/* Category */}
                          <td className="py-4 px-4">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                              {item.category.replace('-', ' ')}
                            </span>
                          </td>
                          
                          {/* Current Stock */}
                          <td className="py-4 px-4">
                            <div className="text-right">
                              <p className={`font-heading font-bold text-lg ${
                                stockStatus === 'critical' ? 'text-red-600' :
                                stockStatus === 'low' ? 'text-amber-600' : 'text-gray-900'
                              }`}>
                                {item.currentStock}
                              </p>
                              <p className="text-xs text-gray-500">{item.unit}</p>
                            </div>
                          </td>
                          
                          {/* Stock Status */}
                          <td className="py-4 px-4">
                            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              stockStatus === 'critical' ? 'bg-red-100 text-red-800' :
                              stockStatus === 'low' ? 'bg-amber-100 text-amber-800' :
                              stockStatus === 'excess' ? 'bg-blue-100 text-blue-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              <div className={`w-2 h-2 rounded-full mr-1 ${
                                stockStatus === 'critical' ? 'bg-red-500' :
                                stockStatus === 'low' ? 'bg-amber-500' :
                                stockStatus === 'excess' ? 'bg-blue-500' : 'bg-green-500'
                              }`}></div>
                              {stockStatus === 'critical' ? 'Critical' :
                               stockStatus === 'low' ? 'Low Stock' :
                               stockStatus === 'excess' ? 'Excess' : 'Normal'}
                            </div>
                          </td>
                          
                          {/* Location */}
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-1">
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span className="text-sm text-gray-700">{item.location}</span>
                            </div>
                          </td>
                          
                          {/* Expiry Date */}
                          <td className="py-4 px-4">
                            {expiryDate ? (
                              <div>
                                <p className={`text-sm font-medium ${
                                  daysUntilExpiry <= 0 ? 'text-red-600' :
                                  daysUntilExpiry <= 7 ? 'text-orange-600' :
                                  daysUntilExpiry <= 30 ? 'text-yellow-600' : 'text-gray-700'
                                }`}>
                                  {expiryDate.toLocaleDateString()}
                                </p>
                                {daysUntilExpiry <= 30 && (
                                  <p className="text-xs text-gray-500">
                                    {daysUntilExpiry <= 0 ? 'Expired' : `${daysUntilExpiry} days`}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </td>
                          
                          {/* Actions - View Only for Purchasing Officers */}
                          <td className="py-4 px-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRowClick(item)
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
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {filteredItems.length > pageSize && (
                <div className="flex items-center justify-between border-t border-white/20 pt-4 mt-4">
                  <div className="text-sm text-gray-500">
                    Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredItems.length)} of {filteredItems.length} items
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
                      Page {currentPage} of {Math.ceil(filteredItems.length / pageSize)}
                    </span>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= Math.ceil(filteredItems.length / pageSize)}
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
      
      {/* Add Item Modal */}
      <Modal
        isOpen={showAddItemModal}
        onClose={() => setShowAddItemModal(false)}
        title="Add New Inventory Item"
        size="lg"
      >
        <AddItemForm
          onSubmit={handleAddItemSubmit}
          onCancel={() => setShowAddItemModal(false)}
          isLoading={isAddingItem}
        />
      </Modal>

      {/* Item Details Modal */}
      <ItemDetailsModal
        isOpen={showItemDetailsModal}
        onClose={() => {
          setShowItemDetailsModal(false)
          setSelectedItem(null)
        }}
        item={selectedItem}
        onUpdateStock={handleUpdateStock}
        onUpdateItem={handleUpdateItem}
        isLoading={isUpdatingItem}
      />

      {/* Restock Modal */}
      <Modal
        isOpen={showRestockModal}
        onClose={() => {
          setShowRestockModal(false)
          setSelectedItem(null)
        }}
        title={`${restockType === 'stock-in' ? 'Stock In' : restockType === 'stock-out' ? 'Stock Out' : 'Force Adjust Stock'} - ${selectedItem?.name}`}
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
                <h3 className="text-lg font-heading font-bold text-gray-900">Filter Inventory</h3>
                <p className="text-sm text-gray-500">Refine your inventory view</p>
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
            {/* Category Filter */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-heading font-medium text-gray-700">
                <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <span>Category</span>
              </label>
              <div className="relative">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full appearance-none bg-white border-2 border-gray-300 rounded-lg px-4 py-3 pr-10 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-black focus:border-black cursor-pointer transition-all shadow-sm hover:border-gray-400"
                >
                  <option value="">All Categories</option>
                  {INVENTORY_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1).replace('-', ' ')}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Stock Status Filter */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-heading font-medium text-gray-700">
                <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>Stock Status</span>
              </label>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full appearance-none bg-white border-2 border-gray-300 rounded-lg px-4 py-3 pr-10 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-black focus:border-black cursor-pointer transition-all shadow-sm hover:border-gray-400"
                >
                  <option value="">All Status</option>
                  <option value="critical">🔴 Critical Stock</option>
                  <option value="low">🟡 Low Stock</option>
                  <option value="normal">🟢 Normal Stock</option>
                  <option value="excess">🔵 Excess Stock</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Expiry Filter */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-heading font-medium text-gray-700">
                <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Expiry Status</span>
              </label>
              <div className="relative">
                <select
                  value={expiryFilter}
                  onChange={(e) => setExpiryFilter(e.target.value)}
                  className="w-full appearance-none bg-white border-2 border-gray-300 rounded-lg px-4 py-3 pr-10 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-black focus:border-black cursor-pointer transition-all shadow-sm hover:border-gray-400"
                >
                  <option value="">All Items</option>
                  <option value="expired">⚠️ Expired Items</option>
                  <option value="expiring-soon">🟠 Expiring Soon (7 days)</option>
                  <option value="expiring-month">🟡 Expiring This Month</option>
                  <option value="no-expiration">📅 No Expiration Date</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Sort Options */}
            <div className="space-y-2">
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
                  <option value="name-asc">📝 Name (A-Z)</option>
                  <option value="name-desc">📝 Name (Z-A)</option>
                  <option value="currentStock-desc">📊 Stock Level (High to Low)</option>
                  <option value="currentStock-asc">📊 Stock Level (Low to High)</option>
                  <option value="expirationDate-asc">📅 Expiry Date (Earliest First)</option>
                  <option value="expirationDate-desc">📅 Expiry Date (Latest First)</option>
                  <option value="category-asc">🏷️ Category (A-Z)</option>
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
          {(categoryFilter || statusFilter || expiryFilter || sortBy !== 'name' || sortDirection !== 'asc') && (
            <div className="mb-6 p-4 bg-gray-50/80 backdrop-blur-sm rounded-lg border border-white/20">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-heading font-medium text-gray-700">Active Filters</h4>
                <button
                  onClick={() => {
                    setCategoryFilter('')
                    setStatusFilter('')
                    setExpiryFilter('')
                    setSortBy('name')
                    setSortDirection('asc')
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Clear All
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {categoryFilter && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Category: {categoryFilter.replace('-', ' ')}
                    <button
                      onClick={() => setCategoryFilter('')}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                )}
                {statusFilter && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Status: {statusFilter}
                    <button
                      onClick={() => setStatusFilter('')}
                      className="ml-1 text-green-600 hover:text-green-800"
                    >
                      ×
                    </button>
                  </span>
                )}
                {expiryFilter && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    Expiry: {expiryFilter.replace('-', ' ')}
                    <button
                      onClick={() => setExpiryFilter('')}
                      className="ml-1 text-orange-600 hover:text-orange-800"
                    >
                      ×
                    </button>
                  </span>
                )}
                {(sortBy !== 'name' || sortDirection !== 'asc') && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    Sort: {sortBy} ({sortDirection})
                    <button
                      onClick={() => {
                        setSortBy('name')
                        setSortDirection('asc')
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
                {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'} match your filters
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t border-white/20">
            <button
              onClick={() => {
                setCategoryFilter('')
                setStatusFilter('')
                setExpiryFilter('')
                setSortBy('name')
                setSortDirection('asc')
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
    </div>
  )
}