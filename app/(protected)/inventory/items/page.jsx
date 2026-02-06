'use client'

import { useState, useEffect } from 'react'
import { usePageTitle } from '../../../../hooks/usePageTitle'
import InventoryTable from '../../../../components/inventory/InventoryTable'
import Button from '../../../../components/ui/Button'
import Modal from '../../../../components/ui/Modal'
import AddItemForm from '../../../../components/inventory/AddItemForm'
import ItemDetailsModal from '../../../../components/inventory/ItemDetailsModal'
import Badge from '../../../../components/ui/Badge'
import inventoryApi from '../../../../lib/inventoryApi'
import { INVENTORY_CATEGORIES } from '../../../../lib/constants'

export default function ItemsPage() {
  const { setTitle } = usePageTitle()
  const [items, setItems] = useState([])
  const [filteredItems, setFilteredItems] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [sortDirection, setSortDirection] = useState('asc')
  const [showAddItemModal, setShowAddItemModal] = useState(false)
  const [showItemDetailsModal, setShowItemDetailsModal] = useState(false)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const pageSize = 25

  // Set page title
  useEffect(() => {
    setTitle('Items Master List')
  }, [setTitle])

  // Load all items
  useEffect(() => {
    const loadItems = async () => {
      try {
        setIsLoading(true)
        const allItems = await inventoryApi.getAll()
        setItems(allItems)
      } catch (error) {
        console.error('Error loading items:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadItems()

    // Set up real-time listener
    const unsubscribe = inventoryApi.onInventoryChange((updatedItems) => {
      setItems(updatedItems)
    })

    return unsubscribe
  }, [])

  // Calculate summary metrics
  const totalItems = items.length
  const consumableItems = items.filter(item => item.type === 'consumable').length
  const activeItems = items.filter(item => item.isActive !== false).length
  const inactiveItems = items.filter(item => item.isActive === false).length

  // Apply filters and search
  useEffect(() => {
    let filtered = [...items]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.sku?.toLowerCase().includes(query)
      )
    }

    // Category filter
    if (categoryFilter) {
      filtered = filtered.filter(item => item.category === categoryFilter)
    }

    // Type/Status filter
    if (typeFilter) {
      if (typeFilter === 'active') {
        filtered = filtered.filter(item => item.isActive !== false)
      } else if (typeFilter === 'inactive') {
        filtered = filtered.filter(item => item.isActive === false)
      } else if (typeFilter === 'consumable' || typeFilter === 'asset') {
        filtered = filtered.filter(item => item.type === typeFilter)
      }
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue = a[sortBy]
      let bValue = b[sortBy]

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    setFilteredItems(filtered)
    setCurrentPage(1)
  }, [items, searchQuery, categoryFilter, sortBy, sortDirection])

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

  // Handle row click
  const handleRowClick = (item) => {
    setSelectedItem(item)
    setShowItemDetailsModal(true)
  }

  // Handle add item
  const handleAddItem = async (itemData) => {
    try {
      await inventoryApi.create(itemData)
      setShowAddItemModal(false)
    } catch (error) {
      console.error('Error adding item:', error)
      alert('Failed to add item. Please try again.')
    }
  }

  // Handle update item
  const handleUpdateItem = async (itemId, itemData) => {
    try {
      await inventoryApi.update(itemId, itemData)
      setShowItemDetailsModal(false)
    } catch (error) {
      console.error('Error updating item:', error)
      throw error
    }
  }

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Name', 'SKU', 'Category', 'Unit', 'Description', 'Supplier']
    const csvData = filteredItems.map(item => {
      return [
        item.name,
        item.sku || '-',
        item.category,
        item.unit,
        item.description || '-',
        item.supplier || '-'
      ]
    })

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `items-masterlist-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Print function
  const handlePrint = () => {
    const printWindow = window.open('', '_blank')

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

    const printHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Items Master List</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
            
            @media print {
              @page {
                margin: 0.75in;
                size: A4 landscape;
              }
              
              * {
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
            }
            
            body {
              font-family: 'Poppins', sans-serif;
              font-size: 10px;
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
              font-size: 24px;
              font-weight: 600;
              color: #1f2937;
              margin: 0 0 8px 0;
            }
            
            .report-subtitle {
              font-size: 14px;
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
            
            .items-table {
              width: 100%;
              border-collapse: collapse;
            }
            
            .items-table th {
              background: #f9fafb;
              padding: 8px 6px;
              text-align: left;
              font-weight: 500;
              font-size: 9px;
              color: #374151;
              border-bottom: 1px solid #e5e7eb;
            }
            
            .items-table td {
              padding: 6px;
              font-size: 9px;
              color: #1f2937;
              border-bottom: 1px solid #f3f4f6;
            }
            
            .items-table tr:nth-child(even) {
              background: #fafafa;
            }
            
            .badge {
              background: #f3f4f6;
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 8px;
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
          <div class="report-header">
            <h1 class="report-title">Items Master List</h1>
            <p class="report-subtitle">Complete inventory of all hotel items</p>
          </div>
          
          <div class="report-meta">
            <div>
              <strong>Generated by:</strong> Inventory Controller<br>
              <strong>Generated on:</strong> ${generatedDate} at ${generatedTime}
            </div>
            <div>
              <strong>Total Items:</strong> ${filteredItems.length}<br>
              <strong>Categories:</strong> ${categories}
            </div>
          </div>
          
          <table class="items-table">
            <thead>
              <tr>
                <th>Item Name</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Unit</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              ${filteredItems.map(item => `
                <tr>
                  <td><strong>${item.name}</strong></td>
                  <td>${item.sku || '-'}</td>
                  <td><span class="badge">${item.category.replace('-', ' ')}</span></td>
                  <td>${item.unit}</td>
                  <td>${item.description || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="footer">
            <p>This report was generated automatically by the Inventory Management System</p>
            <p>Confidential - For internal use only</p>
          </div>
        </body>
      </html>
    `

    printWindow.document.write(printHTML)
    printWindow.document.close()

    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 250)
    }
  }

  // Handle toggle item status
  const handleToggleStatus = async (itemId, currentStatus) => {
    try {
      const newStatus = !currentStatus
      await inventoryApi.update(itemId, { isActive: newStatus })
      // Update is handled by real-time listener
    } catch (error) {
      console.error('Error toggling item status:', error)
      alert('Failed to update item status. Please try again.')
    }
  }

  // Column definitions
  const columns = [
    {
      key: 'image',
      label: 'Image',
      sortable: false,
      render: (value, item) => (
        item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="h-10 w-10 rounded object-cover"
          />
        ) : (
          <div className="h-10 w-10 rounded bg-gray-200 flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )
      )
    },
    {
      key: 'name',
      label: 'Item Name',
      sortable: true,
      render: (value, item) => (
        <div>
          <div className="font-medium">{value}</div>
          {item.sku && <div className="text-sm text-gray-500">SKU: {item.sku}</div>}
        </div>
      )
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      render: (value) => (
        <Badge variant="normal">
          {value.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </Badge>
      )
    },
    {
      key: 'unit',
      label: 'Unit',
      sortable: true,
      render: (value) => value || '-'
    },
    {
      key: 'description',
      label: 'Description',
      sortable: false,
      render: (value) => (
        <div className="max-w-xs truncate" title={value}>
          {value || '-'}
        </div>
      )
    },
    {
      key: 'supplier',
      label: 'Supplier',
      sortable: true,
      render: (value) => value || '-'
    },
    {
      key: 'isActive',
      label: 'Status',
      sortable: true,
      render: (value, item) => (
        <label 
          className="flex items-center space-x-2"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={value !== false}
            onChange={(e) => {
              e.stopPropagation()
              handleToggleStatus(item.id, value !== false)
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-10 h-6 bg-gray-200 rounded-full appearance-none checked:bg-green-500 transition-colors cursor-pointer relative before:content-[''] before:absolute before:w-4 before:h-4 before:bg-white before:rounded-full before:top-1 before:left-1 before:transition-transform checked:before:translate-x-4"
          />
          <span className={`text-sm font-bold uppercase tracking-tighter ${value !== false ? 'text-green-600' : 'text-gray-600'}`}>
            {value !== false ? 'Active' : 'Inactive'}
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
            <h1 className="text-2xl font-heading font-bold text-gray-900 mb-1">Items Master List</h1>
            <p className="text-gray-500 font-body text-sm">
              Complete catalog of all hotel items and products
            </p>
          </div>

          {/* Add Item Button */}
          <Button
            onClick={() => setShowAddItemModal(true)}
            className="bg-black text-white hover:bg-gray-800"
          >
            <svg className="w-4 h-4 mr-2 text-white inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add New Item
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Total Items Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-lg border border-white/20 p-4 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </div>
              <div>
                <h3 className="font-heading font-medium text-sm text-gray-600">Total Items</h3>
                <p className="text-2xl font-heading font-bold text-black">{totalItems}</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500">All products</p>
        </div>

        {/* Consumables Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-lg border border-white/20 p-4 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M9 21V9l3-2 3 2v12" />
                </svg>
              </div>
              <div>
                <h3 className="font-heading font-medium text-sm text-gray-600">Consumables</h3>
                <p className="text-2xl font-heading font-bold text-blue-600">{consumableItems}</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500">Stock items</p>
        </div>

        {/* Assets Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-lg border border-white/20 p-4 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-heading font-medium text-sm text-gray-600">Active Items</h3>
                <p className="text-2xl font-heading font-bold text-green-600">{activeItems}</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500">{inactiveItems} inactive</p>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-lg shadow-xl">
        <div className="border-b border-white/20 px-4 py-3">
          <h3 className="font-heading font-medium text-base">
            All Items
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
                  placeholder="Search items..."
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

        <InventoryTable
          data={getPaginatedData()}
          columns={columns}
          onRowClick={handleRowClick}
          showSearch={false}
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

      {/* Add Item Modal */}
      <Modal
        isOpen={showAddItemModal}
        onClose={() => setShowAddItemModal(false)}
        title="Add New Item"
        size="lg"
      >
        <AddItemForm
          onSubmit={handleAddItem}
          onCancel={() => setShowAddItemModal(false)}
        />
      </Modal>

      {/* Item Details Modal */}
      {selectedItem && (
        <ItemDetailsModal
          isOpen={showItemDetailsModal}
          onClose={() => {
            setShowItemDetailsModal(false)
            setSelectedItem(null)
          }}
          item={selectedItem}
          onUpdate={handleUpdateItem}
        />
      )}

      {/* Filter Modal */}
      <Modal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        title="Filter Items"
      >
        <div className="space-y-4">
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20"
            >
              <option value="">All Categories</option>
              {Object.entries(INVENTORY_CATEGORIES).map(([key, label]) => (
                <option key={key} value={key}>
                  {label.replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>


          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20"
            >
              <option value="name">Name</option>
              <option value="category">Category</option>
              <option value="type">Type</option>
              <option value="unit">Unit</option>
              <option value="supplier">Supplier</option>
            </select>
          </div>

          {/* Sort Direction */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort Direction
            </label>
            <select
              value={sortDirection}
              onChange={(e) => setSortDirection(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="ghost"
              onClick={() => {
                setCategoryFilter('')
                setTypeFilter('')
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
    </div>
  )
}
