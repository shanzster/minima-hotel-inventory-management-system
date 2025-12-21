'use client'

import { useState, useEffect } from 'react'
import { usePageTitle } from '../../../hooks/usePageTitle'
import InventoryTable from '../../../components/inventory/InventoryTable'
import FilterBar from '../../../components/inventory/FilterBar'
import Button from '../../../components/ui/Button'
import Modal from '../../../components/ui/Modal'
import Badge from '../../../components/ui/Badge'
import AuditForm from '../../../components/inventory/AuditForm'
import AdjustmentRequestForm from '../../../components/inventory/AdjustmentRequestForm'
import { 
  mockAudits,
  mockAdjustmentRequests,
  getActiveAudits,
  getCompletedAudits,
  getPendingAdjustments
} from '../../../lib/mockData'

export default function AuditsPage() {
  const { setTitle } = usePageTitle()
  const [activeTab, setActiveTab] = useState('audits')
  const [audits, setAudits] = useState(mockAudits)
  const [adjustmentRequests, setAdjustmentRequests] = useState(mockAdjustmentRequests)
  const [filteredData, setFilteredData] = useState(mockAudits)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [sortBy, setSortBy] = useState('auditDate')
  const [sortDirection, setSortDirection] = useState('desc')
  const [showCreateAuditModal, setShowCreateAuditModal] = useState(false)
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 25
  
  // Set page title
  useEffect(() => {
    setTitle('Audits & Compliance')
  }, [setTitle])
  
  // Calculate summary metrics
  const activeAudits = getActiveAudits()
  const completedAudits = getCompletedAudits()
  const pendingAdjustments = getPendingAdjustments()
  const criticalDiscrepancies = audits.reduce((count, audit) => 
    count + (audit.discrepancies || []).filter(d => !d.resolvedAt).length, 0
  )
  
  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setCurrentPage(1)
    setStatusFilter('')
    setTypeFilter('')
    setSearchQuery('')
  }
  
  // Get current data based on active tab
  const getCurrentData = () => {
    return activeTab === 'audits' ? audits : adjustmentRequests
  }
  
  // Apply filters and search
  useEffect(() => {
    let filtered = getCurrentData()
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      if (activeTab === 'audits') {
        filtered = filtered.filter(audit =>
          audit.auditNumber.toLowerCase().includes(query) ||
          audit.performedBy.toLowerCase().includes(query) ||
          audit.notes?.toLowerCase().includes(query)
        )
      } else {
        filtered = filtered.filter(adj =>
          adj.itemName.toLowerCase().includes(query) ||
          adj.reason.toLowerCase().includes(query) ||
          adj.requestedBy.toLowerCase().includes(query)
        )
      }
    }
    
    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(item => item.status === statusFilter)
    }
    
    // Type filter
    if (typeFilter) {
      if (activeTab === 'audits') {
        filtered = filtered.filter(audit => audit.auditType === typeFilter)
      } else {
        filtered = filtered.filter(adj => adj.requestType === typeFilter)
      }
    }
    
    // Sort
    filtered.sort((a, b) => {
      let aValue = a[sortBy]
      let bValue = b[sortBy]
      
      // Handle special sorting cases
      if (sortBy === 'auditDate' || sortBy === 'requestedAt' || sortBy === 'createdAt') {
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
    
    setFilteredData(filtered)
    setCurrentPage(1) // Reset to page 1 when filters change
  }, [audits, adjustmentRequests, activeTab, searchQuery, statusFilter, typeFilter, sortBy, sortDirection])
  
  // Get paginated data
  const getPaginatedData = () => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return filteredData.slice(startIndex, endIndex)
  }
  
  // Get pagination info
  const getPaginationInfo = () => {
    return {
      page: currentPage,
      pageSize: pageSize,
      total: filteredData.length
    }
  }
  
  // Handle page change
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage)
  }
  
  // Handle row click
  const handleRowClick = (item) => {
    console.log('View details:', item.id)
    // In a real app, this would navigate to detail page
  }
  
  // Handle create audit
  const handleCreateAudit = (auditData) => {
    const newAudit = {
      id: `audit-${Date.now()}`,
      auditNumber: `AUD-2024-${String(audits.length + 1).padStart(3, '0')}`,
      ...auditData,
      performedBy: 'inventory-controller-001', // Would come from auth context
      status: 'in-progress',
      items: [],
      discrepancies: [],
      recommendations: [],
      complianceScore: 0,
      createdAt: new Date()
    }
    
    setAudits(prev => [newAudit, ...prev])
    setShowCreateAuditModal(false)
    alert('Audit created successfully')
  }
  
  // Handle create adjustment request
  const handleCreateAdjustment = (adjustmentData) => {
    const newAdjustment = {
      id: `adj-${Date.now()}`,
      ...adjustmentData,
      requestedBy: 'inventory-controller-001', // Would come from auth context
      requestedAt: new Date(),
      status: 'pending'
    }
    
    setAdjustmentRequests(prev => [newAdjustment, ...prev])
    setShowAdjustmentModal(false)
    alert('Adjustment request created successfully')
  }
  
  // Handle approve adjustment
  const handleApproveAdjustment = (adjustmentId) => {
    setAdjustmentRequests(prev => prev.map(adj => 
      adj.id === adjustmentId 
        ? { 
            ...adj, 
            status: 'approved',
            approvedBy: 'inventory-controller-001',
            approvedAt: new Date()
          }
        : adj
    ))
    alert('Adjustment request approved')
  }
  
  // Column definitions for audits
  const auditColumns = [
    { 
      key: 'auditNumber', 
      label: 'Audit #', 
      sortable: true,
      render: (value, audit) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-sm text-gray-500">
            {new Date(audit.auditDate).toLocaleDateString()}
          </div>
        </div>
      )
    },
    { 
      key: 'auditType', 
      label: 'Type', 
      sortable: true,
      render: (value) => (
        <Badge variant="normal">
          {value ? value.charAt(0).toUpperCase() + value.slice(1).replace('-', ' ') : 'Unknown'}
        </Badge>
      )
    },
    { 
      key: 'status', 
      label: 'Status', 
      sortable: true,
      render: (status) => {
        const variants = {
          'in-progress': 'warning',
          'completed': 'info',
          'approved': 'success',
          'requires-review': 'critical'
        }
        return (
          <Badge variant={variants[status] || 'normal'}>
            {status ? status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ') : 'Unknown'}
          </Badge>
        )
      }
    },
    { 
      key: 'complianceScore', 
      label: 'Compliance Score', 
      sortable: true,
      render: (score) => {
        if (score === 0) return <span className="text-gray-400">Pending</span>
        
        let colorClass = 'text-gray-700'
        if (score >= 95) colorClass = 'text-green-600'
        else if (score >= 85) colorClass = 'text-blue-600'
        else if (score >= 75) colorClass = 'text-yellow-600'
        else colorClass = 'text-red-600'
        
        return (
          <span className={`font-medium ${colorClass}`}>
            {score}%
          </span>
        )
      }
    },
    { 
      key: 'discrepancies', 
      label: 'Discrepancies', 
      sortable: false,
      render: (discrepancies) => {
        const discrepanciesArray = discrepancies || []
        return (
          <div className="flex items-center space-x-2">
            <span className={`font-medium ${
              discrepanciesArray.length > 0 ? 'text-red-600' : 'text-green-600'
            }`}>
              {discrepanciesArray.length}
            </span>
            {discrepanciesArray.some(d => !d.resolvedAt) && (
              <Badge variant="critical" className="text-xs">
                Unresolved
              </Badge>
            )}
          </div>
        )
      }
    },
    { 
      key: 'performedBy', 
      label: 'Performed By', 
      sortable: true,
      render: (value) => value ? value.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Unknown'
    }
  ]
  
  // Column definitions for adjustment requests
  const adjustmentColumns = [
    { 
      key: 'itemName', 
      label: 'Item', 
      sortable: true,
      render: (value, adj) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-sm text-gray-500">{adj.requestType?.replace('-', ' ') || 'Unknown'}</div>
        </div>
      )
    },
    { 
      key: 'variance', 
      label: 'Adjustment', 
      sortable: true,
      render: (variance, adj) => (
        <div>
          <span className={`font-medium ${
            variance > 0 ? 'text-green-600' : variance < 0 ? 'text-red-600' : 'text-gray-600'
          }`}>
            {variance > 0 ? '+' : ''}{variance}
          </span>
          <div className="text-sm text-gray-500">
            {adj.currentStock} → {adj.proposedStock}
          </div>
        </div>
      )
    },
    { 
      key: 'reason', 
      label: 'Reason', 
      sortable: false,
      render: (reason) => (
        <div className="max-w-xs truncate" title={reason}>
          {reason}
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
          'rejected': 'critical',
          'requires-review': 'info'
        }
        return (
          <Badge variant={variants[status] || 'normal'}>
            {status ? status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ') : 'Unknown'}
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
          'medium': 'warning',
          'normal': 'normal',
          'low': 'info'
        }
        return (
          <Badge variant={variants[priority] || 'normal'}>
            {priority ? priority.charAt(0).toUpperCase() + priority.slice(1) : 'Unknown'}
          </Badge>
        )
      }
    },
    { 
      key: 'actions', 
      label: 'Actions', 
      sortable: false,
      render: (value, adj) => (
        <div className="flex space-x-2">
          {(adj.status === 'pending' || adj.status === 'requires-review') && (
            <Button
              variant="primary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                handleApproveAdjustment(adj.id)
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
              console.log('View details:', adj.id)
            }}
          >
            Details
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
            Conduct audits and manage compliance
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={() => setShowAdjustmentModal(true)}
            variant="secondary"
          >
            Create Adjustment Request
          </Button>
          <Button
            onClick={() => setShowCreateAuditModal(true)}
            className="bg-black text-white hover:bg-gray-800"
          >
            Start New Audit
          </Button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Active Audits Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-0 h-12">
            <h3 className="font-heading font-medium text-lg leading-tight">Active Audits</h3>
          </div>
          <p className={`text-3xl font-heading font-medium mb-1 ${
            activeAudits.length > 0 ? 'text-blue-600' : 'text-slate-700'
          }`}>
            {activeAudits.length}
          </p>
          <p className="text-sm text-gray-500">
            {activeAudits.length > 0 ? 'In progress' : 'No active audits'}
          </p>
        </div>
        
        {/* Completed Audits Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-0 h-12">
            <h3 className="font-heading font-medium text-lg leading-tight">Completed</h3>
          </div>
          <p className="text-3xl font-heading font-medium text-green-600 mb-1">
            {completedAudits.length}
          </p>
          <p className="text-sm text-gray-500">This month</p>
        </div>
        
        {/* Pending Adjustments Card */}
        <div className={`bg-white rounded-lg border p-6 ${
          pendingAdjustments.length > 0 ? 'border-amber-200' : 'border-gray-200'
        }`}>
          <div className="flex items-start justify-between mb-0 h-12">
            <h3 className="font-heading font-medium text-lg leading-tight">Pending Adjustments</h3>
          </div>
          <p className={`text-3xl font-heading font-medium mb-1 ${
            pendingAdjustments.length > 0 ? 'text-amber-700' : 'text-slate-700'
          }`}>
            {pendingAdjustments.length}
          </p>
          <p className="text-sm text-gray-500">
            {pendingAdjustments.length > 0 ? 'Awaiting approval' : 'No pending requests'}
          </p>
        </div>
        
        {/* Critical Discrepancies Card */}
        <div className={`bg-white rounded-lg border p-6 ${
          criticalDiscrepancies > 0 ? 'border-red-200' : 'border-gray-200'
        }`}>
          <div className="flex items-start justify-between mb-0 h-12">
            <h3 className="font-heading font-medium text-lg leading-tight">Unresolved Issues</h3>
          </div>
          <p className={`text-3xl font-heading font-medium mb-1 ${
            criticalDiscrepancies > 0 ? 'text-red-800' : 'text-slate-700'
          }`}>
            {criticalDiscrepancies}
          </p>
          <p className="text-sm text-gray-500">
            {criticalDiscrepancies > 0 ? 'Require attention' : 'All resolved'}
          </p>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex space-x-1">
            <button
              onClick={() => handleTabChange('audits')}
              className={`px-5 py-3 rounded-sm text-sm font-medium transition-all duration-200 ease-out ${
                activeTab === 'audits'
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Audits ({audits.length})
            </button>
            <button
              onClick={() => handleTabChange('adjustments')}
              className={`px-5 py-3 rounded-sm text-sm font-medium transition-all duration-200 ease-out ${
                activeTab === 'adjustments'
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Adjustment Requests ({adjustmentRequests.length})
            </button>
          </div>
        </div>
        
        {/* Table Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="font-heading font-medium text-lg">
            {activeTab === 'audits' ? 'Inventory Audits' : 'Adjustment Requests'}
            <span className="text-gray-500 font-normal ml-2">
              ({filteredData.length} items)
            </span>
          </h3>
        </div>
        
        {/* Filter Bar */}
        <div className="border-b border-gray-200 p-6">
          <FilterBar
            searchQuery={searchQuery}
            onSearch={setSearchQuery}
            selectedCategory={typeFilter}
            onCategoryFilter={setTypeFilter}
            categoryOptions={
              activeTab === 'audits' 
                ? [
                    { label: 'All Types', value: '' },
                    { label: 'Scheduled', value: 'scheduled' },
                    { label: 'Spot Check', value: 'spot-check' },
                    { label: 'Annual', value: 'annual' },
                    { label: 'Compliance', value: 'compliance' }
                  ]
                : [
                    { label: 'All Types', value: '' },
                    { label: 'Stock Adjustment', value: 'stock-adjustment' },
                    { label: 'Write Off', value: 'write-off' },
                    { label: 'Condition Update', value: 'condition-update' }
                  ]
            }
            expiryFilter={statusFilter}
            onExpiryFilter={setStatusFilter}
            expiryOptions={
              activeTab === 'audits'
                ? [
                    { label: 'All Statuses', value: '' },
                    { label: 'In Progress', value: 'in-progress' },
                    { label: 'Completed', value: 'completed' },
                    { label: 'Approved', value: 'approved' },
                    { label: 'Requires Review', value: 'requires-review' }
                  ]
                : [
                    { label: 'All Statuses', value: '' },
                    { label: 'Pending', value: 'pending' },
                    { label: 'Approved', value: 'approved' },
                    { label: 'Requires Review', value: 'requires-review' },
                    { label: 'Rejected', value: 'rejected' }
                  ]
            }
            onSortChange={(sortValue) => {
              switch (sortValue) {
                case 'name':
                  setSortBy(activeTab === 'audits' ? 'auditNumber' : 'itemName')
                  setSortDirection('asc')
                  break
                case 'recent':
                  setSortBy(activeTab === 'audits' ? 'auditDate' : 'requestedAt')
                  setSortDirection('desc')
                  break
                case 'status':
                  setSortBy('status')
                  setSortDirection('asc')
                  break
                default:
                  setSortBy(activeTab === 'audits' ? 'auditDate' : 'requestedAt')
                  setSortDirection('desc')
              }
            }}
          />
        </div>
        
        <InventoryTable
          data={getPaginatedData()}
          columns={activeTab === 'audits' ? auditColumns : adjustmentColumns}
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
      
      {/* Create Audit Modal */}
      <Modal
        isOpen={showCreateAuditModal}
        onClose={() => setShowCreateAuditModal(false)}
        title="Start New Audit"
        size="lg"
      >
        <AuditForm
          onSubmit={handleCreateAudit}
          onCancel={() => setShowCreateAuditModal(false)}
        />
      </Modal>
      
      {/* Create Adjustment Request Modal */}
      <Modal
        isOpen={showAdjustmentModal}
        onClose={() => setShowAdjustmentModal(false)}
        title="Create Adjustment Request"
        size="md"
      >
        <AdjustmentRequestForm
          onSubmit={handleCreateAdjustment}
          onCancel={() => setShowAdjustmentModal(false)}
        />
      </Modal>
    </div>
  )
}