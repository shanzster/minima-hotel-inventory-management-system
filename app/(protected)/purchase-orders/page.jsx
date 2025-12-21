'use client'

import { useState, useEffect } from 'react'
import { usePageTitle } from '../../../hooks/usePageTitle'
import InventoryTable from '../../../components/inventory/InventoryTable'
import FilterBar from '../../../components/inventory/FilterBar'
import Button from '../../../components/ui/Button'
import Modal from '../../../components/ui/Modal'
import Badge from '../../../components/ui/Badge'
import PurchaseOrderForm from '../../../components/inventory/PurchaseOrderForm'
import { formatCurrency } from '../../../lib/utils'
import { 
  mockPurchaseOrders,
  mockInventoryItems,
  getPendingPurchaseOrders,
  getApprovedPurchaseOrders
} from '../../../lib/mockData'

export default function PurchaseOrdersPage() {
  const { setTitle } = usePageTitle()
  const [purchaseOrders, setPurchaseOrders] = useState(mockPurchaseOrders)
  const [filteredOrders, setFilteredOrders] = useState(mockPurchaseOrders)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortDirection, setSortDirection] = useState('desc')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 25
  
  // Set page title
  useEffect(() => {
    setTitle('Purchase Orders')
  }, [setTitle])
  
  // Calculate summary metrics
  const pendingOrders = getPendingPurchaseOrders()
  const approvedOrders = getApprovedPurchaseOrders()
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
    // For now, just show order details in console
    // In a real app, this would navigate to a purchase order detail page
    console.log('View purchase order details:', order.id)
    
    // You could also show a modal with order details here
    // setSelectedOrder(order)
    // setShowOrderModal(true)
  }
  
  // Handle create purchase order
  const handleCreateOrder = (orderData) => {
    const newOrder = {
      id: `po-${Date.now()}`,
      orderNumber: `PO-2024-${String(purchaseOrders.length + 1).padStart(3, '0')}`,
      ...orderData,
      status: 'pending',
      requestedBy: 'purchasing-officer-001', // Would come from auth context
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    setPurchaseOrders(prev => [newOrder, ...prev])
    setShowCreateModal(false)
    
    // Show success message
    alert('Purchase order created successfully')
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
    }
  ]
  
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <p className="text-gray-500 font-body">
            Create and manage purchase orders
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-black text-white hover:bg-gray-800"
        >
          Create Purchase Order
        </Button>
      </div>
      
      {/* Purchase Order Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {/* All Orders Card */}
        <div 
          className={`bg-white rounded-lg border p-6 cursor-pointer transition-all duration-200 ease-out hover:shadow-sm ${
            !statusFilter ? 'border-slate-700 bg-slate-50' : 'border-gray-200'
          }`}
          onClick={handleAllOrdersClick}
        >
          <div className="flex items-start justify-between mb-0 h-12">
            <h3 className="font-heading font-medium text-lg leading-tight">All Orders</h3>
          </div>
          <p className="text-3xl font-heading font-medium text-slate-700 mb-1">{purchaseOrders.length}</p>
          <p className="text-sm text-gray-500">Total orders</p>
        </div>
        
        {/* Pending Orders Card */}
        <div 
          className={`bg-white rounded-lg border p-6 cursor-pointer transition-all duration-200 ease-out hover:shadow-sm ${
            statusFilter === 'pending' ? 'border-amber-700 bg-amber-50' :
            pendingOrders.length > 0 ? 'border-amber-200' : 'border-gray-200'
          }`}
          onClick={handlePendingClick}
        >
          <div className="flex items-start justify-between mb-0 h-12">
            <h3 className="font-heading font-medium text-lg leading-tight">Pending</h3>
          </div>
          <p className={`text-3xl font-heading font-medium mb-1 ${
            pendingOrders.length > 0 ? 'text-amber-700' : 'text-slate-700'
          }`}>
            {pendingOrders.length}
          </p>
          <p className="text-sm text-gray-500">
            {pendingOrders.length > 0 ? 'Awaiting approval' : 'No pending orders'}
          </p>
        </div>
        
        {/* Approved Orders Card */}
        <div 
          className={`bg-white rounded-lg border p-6 cursor-pointer transition-all duration-200 ease-out hover:shadow-sm ${
            statusFilter === 'approved' ? 'border-green-700 bg-green-50' :
            approvedOrders.length > 0 ? 'border-green-200' : 'border-gray-200'
          }`}
          onClick={handleApprovedClick}
        >
          <div className="flex items-start justify-between mb-0 h-12">
            <h3 className="font-heading font-medium text-lg leading-tight">Approved</h3>
          </div>
          <p className={`text-3xl font-heading font-medium mb-1 ${
            approvedOrders.length > 0 ? 'text-green-700' : 'text-slate-700'
          }`}>
            {approvedOrders.length}
          </p>
          <p className="text-sm text-gray-500">
            {approvedOrders.length > 0 ? 'Ready for delivery' : 'No approved orders'}
          </p>
        </div>
        
        {/* In Transit Orders Card */}
        <div 
          className={`bg-white rounded-lg border p-6 cursor-pointer transition-all duration-200 ease-out hover:shadow-sm ${
            statusFilter === 'in-transit' ? 'border-blue-700 bg-blue-50' :
            inTransitOrders.length > 0 ? 'border-blue-200' : 'border-gray-200'
          }`}
          onClick={handleInTransitClick}
        >
          <div className="flex items-start justify-between mb-0 h-12">
            <h3 className="font-heading font-medium text-lg leading-tight">In Transit</h3>
          </div>
          <p className={`text-3xl font-heading font-medium mb-1 ${
            inTransitOrders.length > 0 ? 'text-blue-700' : 'text-slate-700'
          }`}>
            {inTransitOrders.length}
          </p>
          <p className="text-sm text-gray-500">
            {inTransitOrders.length > 0 ? 'Being delivered' : 'No orders in transit'}
          </p>
        </div>
        
        {/* Delivered Orders Card */}
        <div 
          className={`bg-white rounded-lg border p-6 cursor-pointer transition-all duration-200 ease-out hover:shadow-sm ${
            statusFilter === 'delivered' ? 'border-green-700 bg-green-50' :
            deliveredOrders.length > 0 ? 'border-green-200' : 'border-gray-200'
          }`}
          onClick={handleDeliveredClick}
        >
          <div className="flex items-start justify-between mb-0 h-12">
            <h3 className="font-heading font-medium text-lg leading-tight">Delivered</h3>
          </div>
          <p className={`text-3xl font-heading font-medium mb-1 ${
            deliveredOrders.length > 0 ? 'text-green-700' : 'text-slate-700'
          }`}>
            {deliveredOrders.length}
          </p>
          <p className="text-sm text-gray-500">
            {deliveredOrders.length > 0 ? 'Completed orders' : 'No delivered orders'}
          </p>
        </div>
      </div>
      
      {/* Purchase Orders Table */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="font-heading font-medium text-lg">
            Purchase Orders
            <span className="text-gray-500 font-normal ml-2">
              ({filteredOrders.length} orders)
            </span>
          </h3>
        </div>
        
        {/* Filter Bar */}
        <div className="border-b border-gray-200 p-6">
          <FilterBar
            searchQuery={searchQuery}
            onSearch={setSearchQuery}
            selectedCategory={statusFilter}
            onCategoryFilter={setStatusFilter}
            categoryOptions={[
              { label: 'All Statuses', value: '' },
              { label: 'Pending', value: 'pending' },
              { label: 'Approved', value: 'approved' },
              { label: 'In Transit', value: 'in-transit' },
              { label: 'Delivered', value: 'delivered' }
            ]}
            expiryFilter={priorityFilter}
            onExpiryFilter={setPriorityFilter}
            expiryOptions={[
              { label: 'All Priorities', value: '' },
              { label: 'High Priority', value: 'high' },
              { label: 'Normal Priority', value: 'normal' },
              { label: 'Low Priority', value: 'low' }
            ]}
            onSortChange={(sortValue) => {
              switch (sortValue) {
                case 'name':
                  setSortBy('orderNumber')
                  setSortDirection('asc')
                  break
                case 'name-desc':
                  setSortBy('orderNumber')
                  setSortDirection('desc')
                  break
                case 'recent':
                  setSortBy('createdAt')
                  setSortDirection('desc')
                  break
                case 'delivery':
                  setSortBy('expectedDelivery')
                  setSortDirection('asc')
                  break
                default:
                  setSortBy('createdAt')
                  setSortDirection('desc')
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
      
      {/* Create Purchase Order Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Purchase Order"
        size="lg"
      >
        <PurchaseOrderForm
          onSubmit={handleCreateOrder}
          onCancel={() => setShowCreateModal(false)}
          availableItems={mockInventoryItems}
        />
      </Modal>
    </div>
  )
}