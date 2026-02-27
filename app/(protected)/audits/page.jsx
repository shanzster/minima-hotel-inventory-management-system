'use client'

import { useState, useEffect } from 'react'
import { usePageTitle } from '../../../hooks/usePageTitle'
import InventoryTable from '../../../components/inventory/InventoryTable'
import FilterBar from '../../../components/inventory/FilterBar'
import Button from '../../../components/ui/Button'
import Modal from '../../../components/ui/Modal'
import Badge from '../../../components/ui/Badge'
import AuditForm from '../../../components/inventory/AuditForm'
import AuditExecutionModal from '../../../components/inventory/AuditExecutionModal'
import auditApi from '../../../lib/auditApi'
import inventoryApi from '../../../lib/inventoryApi'
import toast from '../../../lib/toast'

export default function AuditsPage() {
  const { setTitle } = usePageTitle()
  const [audits, setAudits] = useState([])
  const [filteredData, setFilteredData] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [sortBy, setSortBy] = useState('auditDate')
  const [sortDirection, setSortDirection] = useState('desc')
  const [showCreateAuditModal, setShowCreateAuditModal] = useState(false)
  const [showExecutionModal, setShowExecutionModal] = useState(false)
  const [selectedAudit, setSelectedAudit] = useState(null)
  const [isPrintMode, setIsPrintMode] = useState(false)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const pageSize = 25

  // Set page title
  useEffect(() => {
    setTitle('Audits & Compliance')
  }, [setTitle])

  // Load data and setup listeners
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true)
        const auditsData = await auditApi.getAll()
        setAudits(auditsData)
      } catch (error) {
        console.error('Error loading audit data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadInitialData()

    // Setup real-time listeners
    const unsubscribeAudits = auditApi.onAuditsChange((items) => {
      setAudits(items)
    })

    return () => {
      unsubscribeAudits()
    }
  }, [])

  // Calculate summary metrics
  const activeAuditsCount = audits.filter(a => a.status === 'in-progress').length
  const completedAuditsCount = audits.filter(a => a.status === 'completed' || a.status === 'approved').length
  const criticalDiscrepancies = audits.reduce((count, audit) =>
    count + (audit.discrepancies || []).filter(d => !d.resolvedAt).length, 0
  )



  // Apply filters and search
  useEffect(() => {
    let filtered = audits

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(audit =>
        audit.auditNumber.toLowerCase().includes(query) ||
        audit.performedBy.toLowerCase().includes(query) ||
        audit.notes?.toLowerCase().includes(query)
      )
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(item => item.status === statusFilter)
    }

    // Type filter
    if (typeFilter) {
      filtered = filtered.filter(audit => audit.auditType === typeFilter)
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
  }, [audits, searchQuery, statusFilter, typeFilter, sortBy, sortDirection])

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
    setSelectedAudit(item)
    setShowExecutionModal(true)
  }

  // Handle update audit (from execution modal)
  const handleUpdateAudit = async (updatedAudit) => {
    try {
      await auditApi.update(updatedAudit.id, updatedAudit)
      setShowExecutionModal(false)
      setSelectedAudit(null)
    } catch (error) {
      console.error('Error updating audit:', error)
      toast.error('Failed to update audit results.')
    }
  }

  // Handle create audit
  const handleCreateAudit = async (auditData) => {
    try {
      // Fetch items for snapshot based on scope
      const allItems = await inventoryApi.getAll()
      const scope = auditData.scope || {}

      let itemsSnapshot = allItems.filter(item =>
        (scope.categories || []).includes(item.category) &&
        (scope.locations || []).includes(item.location)
      )

      // Filter expired if needed
      if (!scope.includeExpiredItems) {
        const now = new Date()
        itemsSnapshot = itemsSnapshot.filter(item => !item.expirationDate || new Date(item.expirationDate) >= now)
      }

      // Handle sampling
      if (scope.samplingPercentage && scope.samplingPercentage < 100) {
        const count = Math.max(1, Math.floor(itemsSnapshot.length * (scope.samplingPercentage / 100)))
        itemsSnapshot = itemsSnapshot.sort(() => 0.5 - Math.random()).slice(0, count)
      }

      const newAudit = {
        ...auditData,
        auditDate: auditData.auditDate instanceof Date ? auditData.auditDate.toISOString() : auditData.auditDate,
        auditNumber: `AUD-2024-${String(audits.length + 1).padStart(3, '0')}`,
        performedBy: 'inventory-controller-001', // Should ideally come from auth
        status: 'in-progress',
        items: itemsSnapshot.map(item => ({
          itemId: item.id,
          itemName: item.name,
          category: item.category,
          location: item.location,
          expectedStock: item.currentStock || 0, // Default to 0 if undefined
          actualStock: null, // To be filled during audit
          discrepancy: 0,
          condition: 'good',
          remarks: ''
        })),
        discrepancies: [],
        recommendations: [],
        complianceScore: 0,
        createdAt: new Date().toISOString()
      }

      await auditApi.create(newAudit)
      setShowCreateAuditModal(false)
      toast.success('Audit started. A snapshot of current stock levels has been recorded.')
    } catch (error) {
      console.error('Error creating audit:', error)
      toast.error('Failed to start audit')
    }
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
            <span className={`font-medium ${discrepanciesArray.length > 0 ? 'text-red-600' : 'text-green-600'
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



  return (
    <div className="p-4 mx-2">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <p className="text-gray-500 font-body">
            Conduct audits and manage compliance
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={() => {
              setIsPrintMode(true)
              setShowCreateAuditModal(true)
            }}
            className="bg-black text-white hover:bg-gray-800 hover:shadow-lg hover:scale-105 transition-all duration-200 ease-out backdrop-blur-sm"
          >
            Print Audit Form
          </Button>
          <Button
            onClick={() => {
              setIsPrintMode(false)
              setShowCreateAuditModal(true)
            }}
            className="bg-black text-white hover:bg-gray-800 hover:shadow-lg hover:scale-105 transition-all duration-200 ease-out backdrop-blur-sm"
          >
            Start New Audit
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Active Audits Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-0 h-12">
            <h3 className="font-heading font-medium text-lg leading-tight">Active Audits</h3>
          </div>
          <p className={`text-4xl font-heading font-bold mb-1 ${activeAuditsCount > 0 ? 'text-blue-600' : 'text-slate-700'
            }`}>
            {activeAuditsCount}
          </p>
          <p className="text-sm text-gray-500 font-medium">
            {activeAuditsCount > 0 ? 'In progress' : 'No active audits'}
          </p>
        </div>

        {/* Completed Audits Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-0 h-12">
            <h3 className="font-heading font-medium text-lg leading-tight">Completed</h3>
          </div>
          <p className="text-4xl font-heading font-bold text-green-600 mb-1">
            {completedAuditsCount}
          </p>
          <p className="text-sm text-gray-500 font-medium">This month</p>
        </div>

        {/* Critical Discrepancies Card */}
        <div className={`bg-white rounded-lg border p-6 shadow-sm hover:shadow-md transition-shadow ${criticalDiscrepancies > 0 ? 'border-red-200 bg-red-50/10' : 'border-gray-200'
          }`}>
          <div className="flex items-start justify-between mb-0 h-12">
            <h3 className="font-heading font-medium text-lg leading-tight">Unresolved Issues</h3>
          </div>
          <p className={`text-4xl font-heading font-bold mb-1 ${criticalDiscrepancies > 0 ? 'text-red-800' : 'text-slate-700'
            }`}>
            {criticalDiscrepancies}
          </p>
          <p className="text-sm text-gray-500 font-medium">
            {criticalDiscrepancies > 0 ? 'Require attention' : 'All resolved'}
          </p>
        </div>
      </div>



      {/* Table Header */}
      <div className="border-b border-gray-200 px-6 py-4 bg-gray-50/50 rounded-t-lg flex items-center justify-between">
        <h3 className="font-heading font-semibold text-gray-800">
          Audit Records
          <span className="text-gray-500 font-normal ml-2 text-sm">
            ({filteredData.length} {filteredData.length === 1 ? 'record' : 'records'})
          </span>
        </h3>
        <div className="flex items-center space-x-3">
          {/* Search Bar */}
          <div className="relative w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search audits..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all"
            />
          </div>
        </div>
      </div>



      <InventoryTable
        data={getPaginatedData()}
        columns={auditColumns}
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
      {/* Audit Execution Modal (Digital Entry) */}
      <Modal
        isOpen={showExecutionModal}
        onClose={() => {
          setShowExecutionModal(false)
          setSelectedAudit(null)
        }}
        title="Conduct Digital Audit"
        size="full"
        noPadding
      >
        {selectedAudit && (
          <AuditExecutionModal
            audit={selectedAudit}
            onSubmit={handleUpdateAudit}
            onCancel={() => {
              setShowExecutionModal(false)
              setSelectedAudit(null)
            }}
          />
        )}
      </Modal>

      {/* Filter Modal */}
      <Modal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        title="Filter Options"
      >
        <div className="space-y-4 py-2">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
              Audit Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-black transition-all font-medium"
            >
              <option value="">All Types</option>
              <option value="scheduled">Scheduled</option>
              <option value="spot-check">Spot Check</option>
              <option value="annual">Annual</option>
              <option value="compliance">Compliance</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-black transition-all font-medium"
            >
              <option value="">All Statuses</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="approved">Approved</option>
              <option value="requires-review">Requires Review</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-black transition-all font-medium"
              >
                <option value="auditDate">Date</option>
                <option value="auditNumber">Audit Number</option>
                <option value="status">Status</option>
                <option value="complianceScore">Compliance Score</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                Direction
              </label>
              <select
                value={sortDirection}
                onChange={(e) => setSortDirection(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-black transition-all font-medium"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex space-x-3">
            <Button
              variant="ghost"
              className="flex-1 py-4 border-2 border-gray-100 rounded-xl font-bold"
              onClick={() => {
                setTypeFilter('')
                setStatusFilter('')
                setSortBy('auditDate')
                setSortDirection('desc')
              }}
            >
              Reset
            </Button>
            <Button
              className="flex-1 py-4 bg-black text-white rounded-xl font-bold"
              onClick={() => setShowFilterModal(false)}
            >
              Apply filters
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create Audit Modal */}
      <Modal
        isOpen={showCreateAuditModal}
        onClose={() => setShowCreateAuditModal(false)}
        title={isPrintMode ? "Generate Printable Audit Form" : "Start New Digital Audit"}
        size="lg"
      >
        <AuditForm
          isPrintMode={isPrintMode}
          onSubmit={handleCreateAudit}
          onCancel={() => setShowCreateAuditModal(false)}
        />
      </Modal>
    </div>
  )
}