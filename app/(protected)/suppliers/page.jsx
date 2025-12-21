'use client'

import { useState, useEffect } from 'react'
import { usePageTitle } from '../../../hooks/usePageTitle'
import InventoryTable from '../../../components/inventory/InventoryTable'
import FilterBar from '../../../components/inventory/FilterBar'
import Button from '../../../components/ui/Button'
import Modal from '../../../components/ui/Modal'
import Badge from '../../../components/ui/Badge'
import SupplierForm from '../../../components/inventory/SupplierForm'
import { 
  mockSuppliers,
  getActiveSuppliers,
  getPendingSuppliers
} from '../../../lib/mockData'
import { INVENTORY_CATEGORIES } from '../../../lib/constants'

export default function SuppliersPage() {
  const { setTitle } = usePageTitle()
  const [suppliers, setSuppliers] = useState(mockSuppliers)
  const [filteredSuppliers, setFilteredSuppliers] = useState(mockSuppliers)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [sortDirection, setSortDirection] = useState('asc')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 25
  
  // Set page title
  useEffect(() => {
    setTitle('Suppliers')
  }, [setTitle])
  
  // Calculate summary metrics
  const activeSuppliers = getActiveSuppliers()
  const pendingSuppliers = getPendingSuppliers()
  const highPerformingSuppliers = suppliers.filter(s => s.performanceMetrics.overallRating >= 4.5)
  const lowPerformingSuppliers = suppliers.filter(s => s.performanceMetrics.overallRating > 0 && s.performanceMetrics.overallRating < 4.0)
  
  // Handle card clicks for filtering
  const handleAllSuppliersClick = () => {
    setStatusFilter('')
  }
  
  const handleActiveClick = () => {
    setStatusFilter('active')
  }
  
  const handlePendingClick = () => {
    setStatusFilter('pending')
  }
  
  const handleHighPerformingClick = () => {
    setStatusFilter('high-performing')
  }
  
  const handleLowPerformingClick = () => {
    setStatusFilter('low-performing')
  }
  
  // Apply filters and search
  useEffect(() => {
    let filtered = [...suppliers]
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(supplier =>
        supplier.name.toLowerCase().includes(query) ||
        supplier.contactPerson.toLowerCase().includes(query) ||
        supplier.email.toLowerCase().includes(query) ||
        supplier.categories.some(cat => cat.toLowerCase().includes(query))
      )
    }
    
    // Status filter
    if (statusFilter) {
      switch (statusFilter) {
        case 'active':
          filtered = filtered.filter(supplier => supplier.isActive && supplier.isApproved)
          break
        case 'pending':
          filtered = filtered.filter(supplier => !supplier.isApproved)
          break
        case 'high-performing':
          filtered = filtered.filter(supplier => supplier.performanceMetrics.overallRating >= 4.5)
          break
        case 'low-performing':
          filtered = filtered.filter(supplier => supplier.performanceMetrics.overallRating > 0 && supplier.performanceMetrics.overallRating < 4.0)
          break
        default:
          break
      }
    }
    
    // Category filter
    if (categoryFilter) {
      filtered = filtered.filter(supplier => supplier.categories.includes(categoryFilter))
    }
    
    // Sort
    filtered.sort((a, b) => {
      let aValue = a[sortBy]
      let bValue = b[sortBy]
      
      // Handle special sorting cases
      if (sortBy === 'performanceRating') {
        aValue = a.performanceMetrics.overallRating
        bValue = b.performanceMetrics.overallRating
      }
      
      if (sortBy === 'deliveryReliability') {
        aValue = a.performanceMetrics.deliveryReliability
        bValue = b.performanceMetrics.deliveryReliability
      }
      
      if (sortBy === 'createdAt') {
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
    
    setFilteredSuppliers(filtered)
    setCurrentPage(1) // Reset to page 1 when filters change
  }, [suppliers, searchQuery, statusFilter, categoryFilter, sortBy, sortDirection])
  
  // Get paginated data
  const getPaginatedData = () => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return filteredSuppliers.slice(startIndex, endIndex)
  }
  
  // Get pagination info
  const getPaginationInfo = () => {
    return {
      page: currentPage,
      pageSize: pageSize,
      total: filteredSuppliers.length
    }
  }
  
  // Handle page change
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage)
  }
  
  // Handle row click to view supplier details
  const handleRowClick = (supplier) => {
    // For now, just show supplier details in console
    // In a real app, this would navigate to a supplier detail page
    console.log('View supplier details:', supplier.id)
  }
  
  // Handle create supplier
  const handleCreateSupplier = (supplierData) => {
    const newSupplier = {
      id: `supplier-${Date.now()}`,
      ...supplierData,
      performanceMetrics: {
        overallRating: 0,
        deliveryReliability: 0,
        qualityRating: 0,
        responseTime: 0,
        totalOrders: 0,
        onTimeDeliveries: 0,
        qualityIssues: 0,
        lastEvaluationDate: null
      },
      isActive: false,
      isApproved: false,
      approvedBy: null,
      approvedAt: null,
      createdAt: new Date()
    }
    
    setSuppliers(prev => [newSupplier, ...prev])
    setShowCreateModal(false)
    
    // Show success message
    alert('Supplier created successfully and sent for approval')
  }
  
  // Handle supplier approval
  const handleApproveSupplier = (supplierId) => {
    setSuppliers(prev => prev.map(supplier => 
      supplier.id === supplierId 
        ? { 
            ...supplier, 
            isApproved: true, 
            isActive: true,
            approvedBy: 'inventory-controller-001',
            approvedAt: new Date()
          }
        : supplier
    ))
    
    alert('Supplier approved successfully')
  }
  
  // Column definitions for suppliers table
  const columns = [
    { 
      key: 'name', 
      label: 'Supplier Name', 
      sortable: true,
      render: (value, supplier) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-sm text-gray-500">{supplier.contactPerson}</div>
        </div>
      )
    },
    { 
      key: 'email', 
      label: 'Contact', 
      sortable: true,
      render: (value, supplier) => (
        <div>
          <div className="text-sm">{value}</div>
          <div className="text-sm text-gray-500">{supplier.phone}</div>
        </div>
      )
    },
    { 
      key: 'categories', 
      label: 'Categories', 
      sortable: false,
      render: (categories) => (
        <div className="flex flex-wrap gap-1">
          {categories.slice(0, 2).map(category => (
            <Badge key={category} variant="normal" className="text-xs">
              {category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Badge>
          ))}
          {categories.length > 2 && (
            <Badge variant="normal" className="text-xs">
              +{categories.length - 2}
            </Badge>
          )}
        </div>
      )
    },
    { 
      key: 'status', 
      label: 'Status', 
      sortable: true,
      render: (value, supplier) => {
        if (!supplier.isApproved) {
          return <Badge variant="warning">Pending Approval</Badge>
        }
        if (supplier.isActive) {
          return <Badge variant="success">Active</Badge>
        }
        return <Badge variant="normal">Inactive</Badge>
      }
    },
    { 
      key: 'performanceRating', 
      label: 'Performance', 
      sortable: true,
      render: (value, supplier) => {
        const rating = supplier.performanceMetrics.overallRating
        if (rating === 0) {
          return <span className="text-gray-400">No data</span>
        }
        
        let colorClass = 'text-gray-700'
        if (rating >= 4.5) colorClass = 'text-green-600'
        else if (rating >= 4.0) colorClass = 'text-blue-600'
        else if (rating >= 3.5) colorClass = 'text-yellow-600'
        else colorClass = 'text-red-600'
        
        return (
          <div>
            <span className={`font-medium ${colorClass}`}>
              {rating.toFixed(1)}/5.0
            </span>
            <div className="text-sm text-gray-500">
              {supplier.performanceMetrics.deliveryReliability}% on-time
            </div>
          </div>
        )
      }
    },
    { 
      key: 'actions', 
      label: 'Actions', 
      sortable: false,
      render: (value, supplier) => (
        <div className="flex space-x-2">
          {!supplier.isApproved && (
            <Button
              variant="primary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                handleApproveSupplier(supplier.id)
              }}
            >
              Approve
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              console.log('Edit supplier:', supplier.id)
            }}
          >
            Edit
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
            Manage suppliers and performance
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-black text-white hover:bg-gray-800"
        >
          Add New Supplier
        </Button>
      </div>
      
      {/* Supplier Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {/* All Suppliers Card */}
        <div 
          className={`bg-white rounded-lg border p-6 cursor-pointer transition-all duration-200 ease-out hover:shadow-sm ${
            !statusFilter ? 'border-slate-700 bg-slate-50' : 'border-gray-200'
          }`}
          onClick={handleAllSuppliersClick}
        >
          <div className="flex items-start justify-between mb-0 h-12">
            <h3 className="font-heading font-medium text-lg leading-tight">All Suppliers</h3>
          </div>
          <p className="text-3xl font-heading font-medium text-slate-700 mb-1">{suppliers.length}</p>
          <p className="text-sm text-gray-500">Total suppliers</p>
        </div>
        
        {/* Active Suppliers Card */}
        <div 
          className={`bg-white rounded-lg border p-6 cursor-pointer transition-all duration-200 ease-out hover:shadow-sm ${
            statusFilter === 'active' ? 'border-green-700 bg-green-50' :
            activeSuppliers.length > 0 ? 'border-green-200' : 'border-gray-200'
          }`}
          onClick={handleActiveClick}
        >
          <div className="flex items-start justify-between mb-0 h-12">
            <h3 className="font-heading font-medium text-lg leading-tight">Active</h3>
          </div>
          <p className={`text-3xl font-heading font-medium mb-1 ${
            activeSuppliers.length > 0 ? 'text-green-700' : 'text-slate-700'
          }`}>
            {activeSuppliers.length}
          </p>
          <p className="text-sm text-gray-500">
            {activeSuppliers.length > 0 ? 'Approved suppliers' : 'No active suppliers'}
          </p>
        </div>
        
        {/* Pending Approval Card */}
        <div 
          className={`bg-white rounded-lg border p-6 cursor-pointer transition-all duration-200 ease-out hover:shadow-sm ${
            statusFilter === 'pending' ? 'border-amber-700 bg-amber-50' :
            pendingSuppliers.length > 0 ? 'border-amber-200' : 'border-gray-200'
          }`}
          onClick={handlePendingClick}
        >
          <div className="flex items-start justify-between mb-0 h-12">
            <h3 className="font-heading font-medium text-lg leading-tight">Pending</h3>
          </div>
          <p className={`text-3xl font-heading font-medium mb-1 ${
            pendingSuppliers.length > 0 ? 'text-amber-700' : 'text-slate-700'
          }`}>
            {pendingSuppliers.length}
          </p>
          <p className="text-sm text-gray-500">
            {pendingSuppliers.length > 0 ? 'Awaiting approval' : 'No pending suppliers'}
          </p>
        </div>
        
        {/* High Performing Card */}
        <div 
          className={`bg-white rounded-lg border p-6 cursor-pointer transition-all duration-200 ease-out hover:shadow-sm ${
            statusFilter === 'high-performing' ? 'border-green-700 bg-green-50' :
            highPerformingSuppliers.length > 0 ? 'border-green-200' : 'border-gray-200'
          }`}
          onClick={handleHighPerformingClick}
        >
          <div className="flex items-start justify-between mb-0 h-12">
            <h3 className="font-heading font-medium text-lg leading-tight">High Performing</h3>
          </div>
          <p className={`text-3xl font-heading font-medium mb-1 ${
            highPerformingSuppliers.length > 0 ? 'text-green-700' : 'text-slate-700'
          }`}>
            {highPerformingSuppliers.length}
          </p>
          <p className="text-sm text-gray-500">
            {highPerformingSuppliers.length > 0 ? '4.5+ rating' : 'No high performers'}
          </p>
        </div>
        
        {/* Low Performing Card */}
        <div 
          className={`bg-white rounded-lg border p-6 cursor-pointer transition-all duration-200 ease-out hover:shadow-sm ${
            statusFilter === 'low-performing' ? 'border-red-700 bg-red-50' :
            lowPerformingSuppliers.length > 0 ? 'border-red-200' : 'border-gray-200'
          }`}
          onClick={handleLowPerformingClick}
        >
          <div className="flex items-start justify-between mb-0 h-12">
            <h3 className="font-heading font-medium text-lg leading-tight">Low Performing</h3>
          </div>
          <p className={`text-3xl font-heading font-medium mb-1 ${
            lowPerformingSuppliers.length > 0 ? 'text-red-700' : 'text-slate-700'
          }`}>
            {lowPerformingSuppliers.length}
          </p>
          <p className="text-sm text-gray-500">
            {lowPerformingSuppliers.length > 0 ? 'Below 4.0 rating' : 'No low performers'}
          </p>
        </div>
      </div>
      
      {/* Suppliers Table */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="font-heading font-medium text-lg">
            Suppliers
            <span className="text-gray-500 font-normal ml-2">
              ({filteredSuppliers.length} suppliers)
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
            expiryFilter={statusFilter}
            onExpiryFilter={setStatusFilter}
            expiryOptions={[
              { label: 'All Suppliers', value: '' },
              { label: 'Active', value: 'active' },
              { label: 'Pending Approval', value: 'pending' },
              { label: 'High Performing', value: 'high-performing' },
              { label: 'Low Performing', value: 'low-performing' }
            ]}
            onSortChange={(sortValue) => {
              switch (sortValue) {
                case 'name':
                  setSortBy('name')
                  setSortDirection('asc')
                  break
                case 'name-desc':
                  setSortBy('name')
                  setSortDirection('desc')
                  break
                case 'performance':
                  setSortBy('performanceRating')
                  setSortDirection('desc')
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
      
      {/* Create Supplier Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add New Supplier"
        size="lg"
      >
        <SupplierForm
          onSubmit={handleCreateSupplier}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>
    </div>
  )
}