'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../../hooks/useAuth'
import { usePageTitle } from '../../../../hooks/usePageTitle'
import InventoryTable from '../../../../components/inventory/InventoryTable'
import AlertBanner from '../../../../components/inventory/AlertBanner'
import Button from '../../../../components/ui/Button'
import Badge from '../../../../components/ui/Badge'
import Modal from '../../../../components/ui/Modal'
import { mockTransactions, mockInventoryItems } from '../../../../lib/mockData'

export default function TransactionsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { setTitle } = usePageTitle()
  const [transactions, setTransactions] = useState([])
  const [filteredTransactions, setFilteredTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [selectedUser, setSelectedUser] = useState('')
  const [approvalFilter, setApprovalFilter] = useState('') // 'pending' or ''
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [alerts, setAlerts] = useState([])
  const [showExportModal, setShowExportModal] = useState(false)

  useEffect(() => {
    setTitle('Transaction History')
  }, [setTitle])

  useEffect(() => {
    loadTransactions()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [transactions, searchQuery, selectedType, selectedUser, approvalFilter, dateRange])

  const loadTransactions = async () => {
    try {
      setLoading(true)
      
      // Enhance mock transactions with item names
      const enhancedTransactions = mockTransactions.map(txn => {
        const item = mockInventoryItems.find(item => item.id === txn.itemId)
        return {
          ...txn,
          itemName: item?.name || 'Unknown Item',
          itemCategory: item?.category || 'unknown'
        }
      })

      setTransactions(enhancedTransactions)
      
      // Check for pending approvals
      const pendingApprovals = enhancedTransactions.filter(txn => !txn.approved)
      if (pendingApprovals.length > 0 && user?.role === 'inventory-controller') {
        setAlerts([{
          type: 'info',
          message: 'Transactions pending approval',
          items: pendingApprovals.map(txn => ({
            id: txn.id,
            name: txn.itemName,
            currentStock: txn.newStock
          }))
        }])
      }
    } catch (error) {
      setAlerts([{
        type: 'error',
        message: 'Failed to load transaction history',
        items: []
      }])
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...transactions]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(txn => 
        txn.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        txn.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
        txn.performedBy.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Type filter
    if (selectedType) {
      filtered = filtered.filter(txn => txn.type === selectedType)
    }

    // User filter
    if (selectedUser) {
      filtered = filtered.filter(txn => txn.performedBy === selectedUser)
    }

    // Date range filter
    if (dateRange.start) {
      filtered = filtered.filter(txn => 
        new Date(txn.createdAt) >= new Date(dateRange.start)
      )
    }
    if (dateRange.end) {
      filtered = filtered.filter(txn => 
        new Date(txn.createdAt) <= new Date(dateRange.end)
      )
    }

    // Approval filter
    if (approvalFilter === 'pending') {
      filtered = filtered.filter(txn => !txn.approved)
    }

    setFilteredTransactions(filtered)
  }

  const approveTransaction = async (transactionId) => {
    if (user?.role !== 'inventory-controller') {
      setAlerts([{
        type: 'error',
        message: 'Only Inventory Controllers can approve transactions',
        items: []
      }])
      return
    }

    try {
      // Update transaction approval status
      setTransactions(prev => prev.map(txn => 
        txn.id === transactionId 
          ? { 
              ...txn, 
              approved: true, 
              approvedBy: user.id,
              approvedAt: new Date()
            }
          : txn
      ))

      setAlerts([{
        type: 'success',
        message: 'Transaction approved successfully',
        items: []
      }])
    } catch (error) {
      setAlerts([{
        type: 'error',
        message: 'Failed to approve transaction',
        items: []
      }])
    }
  }

  const exportTransactions = () => {
    // Create CSV content
    const headers = ['Date', 'Item', 'Type', 'Quantity', 'Previous Stock', 'New Stock', 'Performed By', 'Reason', 'Status']
    const csvContent = [
      headers.join(','),
      ...filteredTransactions.map(txn => [
        new Date(txn.createdAt).toLocaleDateString(),
        txn.itemName,
        txn.type,
        txn.quantity,
        txn.previousStock,
        txn.newStock,
        txn.performedBy,
        txn.reason || '',
        txn.approved ? 'Approved' : 'Pending'
      ].join(','))
    ].join('\n')

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    
    // Close modal and show success message
    setShowExportModal(false)
    setAlerts([{
      type: 'success',
      message: 'Transaction data exported successfully',
      items: []
    }])
  }

  const handleExportClick = () => {
    setShowExportModal(true)
  }

  const getTransactionColumns = () => [
    { 
      key: 'createdAt', 
      label: 'Transaction Date', 
      render: (value) => new Date(value).toLocaleDateString() 
    },
    { key: 'itemName', label: 'Item Name' },
    { 
      key: 'type', 
      label: 'Transaction Type', 
      render: (value) => (
        <Badge variant={value === 'stock-in' ? 'success' : value === 'stock-out' ? 'info' : 'warning'}>
          {value.replace('-', ' ').toUpperCase()}
        </Badge>
      )
    },
    { key: 'quantity', label: 'Quantity' },
    { key: 'previousStock', label: 'Previous Stock' },
    { key: 'newStock', label: 'New Stock' },
    { key: 'performedBy', label: 'Performed By' },
    { key: 'reason', label: 'Reason' },
    { 
      key: 'approved', 
      label: 'Status', 
      render: (value, row) => (
        <div className="flex items-center space-x-2">
          <Badge variant={value ? 'success' : 'warning'}>
            {value ? 'Approved' : 'Pending'}
          </Badge>
          {!value && user?.role === 'inventory-controller' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => approveTransaction(row.id)}
            >
              Approve
            </Button>
          )}
        </div>
      )
    }
  ]

  const transactionTypes = [
    { label: 'All Types', value: '' },
    { label: 'Stock In', value: 'stock-in' },
    { label: 'Stock Out', value: 'stock-out' },
    { label: 'Adjustment', value: 'adjustment' }
  ]

  const uniqueUsers = [...new Set(transactions.map(txn => txn.performedBy))]
  const userOptions = [
    { label: 'All Users', value: '' },
    ...uniqueUsers.map(user => ({ label: user, value: user }))
  ]

  const handleTransactionRowClick = (transaction) => {
    // Navigate to the inventory item that this transaction relates to
    router.push(`/inventory/${transaction.itemId}`)
  }

  // Handle card clicks for filtering
  const handleAllTransactionsClick = () => {
    setSelectedType('')
    setSelectedUser('')
    setApprovalFilter('')
  }
  
  const handleStockInClick = () => {
    setSelectedType('stock-in')
    setSelectedUser('')
    setApprovalFilter('')
  }
  
  const handleStockOutClick = () => {
    setSelectedType('stock-out')
    setSelectedUser('')
    setApprovalFilter('')
  }
  
  const handlePendingApprovalClick = () => {
    setSelectedType('')
    setSelectedUser('')
    setApprovalFilter('pending')
  }

  const dismissAlert = (index) => {
    setAlerts(prev => prev.filter((_, i) => i !== index))
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading transaction history...</div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <p className="text-gray-500 font-body">
          Track transaction history and approvals
        </p>
        <Button
          variant="primary"
          onClick={handleExportClick}
        >
          Export CSV
        </Button>
      </div>

      {/* Alerts */}
      {alerts.map((alert, index) => (
        <div key={index} className="mb-6">
          <AlertBanner
            type={alert.type}
            message={alert.message}
            items={alert.items}
            onAcknowledge={() => dismissAlert(index)}
            dismissible={true}
          />
        </div>
      ))}



      {/* Transaction Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div 
          className={`bg-white border border-gray-200 rounded-lg p-6 cursor-pointer transition-all duration-200 ease-out hover:shadow-sm ${
            !selectedType && !approvalFilter ? 'border-slate-700 bg-slate-50' : 'border-gray-200'
          }`}
          onClick={handleAllTransactionsClick}
        >
          <div className="flex items-start justify-between mb-0 h-12">
            <h3 className="font-heading font-medium text-lg leading-tight">Total Transactions</h3>
          </div>
          <p className="text-3xl font-heading font-medium text-black mb-1">
            {transactions.length}
          </p>
          <div className="text-sm text-gray-500">All transaction records</div>
        </div>
        <div 
          className={`bg-white border border-gray-200 rounded-lg p-6 cursor-pointer transition-all duration-200 ease-out hover:shadow-sm ${
            selectedType === 'stock-in' ? 'border-green-700 bg-green-50' :
            transactions.filter(txn => txn.type === 'stock-in').length > 0 ? 'border-green-200' : 'border-gray-200'
          }`}
          onClick={handleStockInClick}
        >
          <div className="flex items-start justify-between mb-0 h-12">
            <h3 className="font-heading font-medium text-lg leading-tight">Stock In</h3>
          </div>
          <p className={`text-3xl font-heading font-medium mb-1 ${
            selectedType === 'stock-in' ? 'text-green-700' : 'text-green-600'
          }`}>
            {transactions.filter(txn => txn.type === 'stock-in').length}
          </p>
          <div className="text-sm text-gray-500">Inventory additions</div>
        </div>
        <div 
          className={`bg-white border border-gray-200 rounded-lg p-6 cursor-pointer transition-all duration-200 ease-out hover:shadow-sm ${
            selectedType === 'stock-out' ? 'border-red-700 bg-red-50' :
            transactions.filter(txn => txn.type === 'stock-out').length > 0 ? 'border-red-200' : 'border-gray-200'
          }`}
          onClick={handleStockOutClick}
        >
          <div className="flex items-start justify-between mb-0 h-12">
            <h3 className="font-heading font-medium text-lg leading-tight">Stock Out</h3>
          </div>
          <p className={`text-3xl font-heading font-medium mb-1 ${
            selectedType === 'stock-out' ? 'text-red-700' : 'text-red-600'
          }`}>
            {transactions.filter(txn => txn.type === 'stock-out').length}
          </p>
          <div className="text-sm text-gray-500">Inventory reductions</div>
        </div>
        <div 
          className={`bg-white rounded-lg p-6 cursor-pointer transition-all duration-200 ease-out hover:shadow-sm ${
            approvalFilter === 'pending' ? 'border border-amber-700 bg-amber-50' :
            transactions.filter(txn => !txn.approved).length > 0 ? 'border border-amber-200' : 'border border-gray-200'
          }`}
          onClick={handlePendingApprovalClick}
        >
          <div className="flex items-start justify-between mb-0 h-12">
            <h3 className="font-heading font-medium text-lg leading-tight">Pending Approval</h3>
          </div>
          <p className={`text-3xl font-heading font-medium mb-1 ${
            approvalFilter === 'pending' ? 'text-amber-700' : 'text-yellow-600'
          }`}>
            {transactions.filter(txn => !txn.approved).length}
          </p>
          <div className="text-sm text-gray-500">Awaiting authorization</div>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="font-heading font-medium text-lg">
            Transaction History
            <span className="text-gray-500 font-normal ml-2">
              ({filteredTransactions.length} transactions)
            </span>
          </h3>
        </div>
        
        {/* Filter Bar - Custom for Transactions */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            {/* Left - Title */}
            <div className="flex-shrink-0">
              <h2 className="text-lg font-heading font-medium text-black">
                Transactions
              </h2>
            </div>

            {/* Center - Search Bar */}
            <div className="flex-1 max-w-md mx-8">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg 
                    className="h-4 w-4 text-gray-400" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search items, reasons, users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
            </div>

            {/* Right - Filter Dropdowns */}
            <div className="flex items-center space-x-4">
              {/* Transaction Type Filter */}
              <div className="relative">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 pr-8 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent cursor-pointer"
                >
                  {transactionTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* User Filter */}
              <div className="relative">
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 pr-8 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent cursor-pointer"
                >
                  {userOptions.map(user => (
                    <option key={user.value} value={user.value}>
                      {user.label}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Date Range Filters */}
              <div className="flex items-center space-x-2">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                />
                <span className="text-gray-400">to</span>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>
        
        <InventoryTable
          data={filteredTransactions}
          columns={getTransactionColumns()}
          onRowClick={handleTransactionRowClick}
          emptyMessage="No transactions found matching your filters"
          showSearch={false} // Using custom filter bar instead
          pagination={{
            page: 1,
            pageSize: 50,
            total: filteredTransactions.length
          }}
          onPageChange={() => {}} // Placeholder for pagination
        />
      </div>

      {/* Export Confirmation Modal */}
      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Export Transaction Data"
        size="md"
      >
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            <p className="mb-3">
              You are about to export <span className="font-medium text-black">{filteredTransactions.length} transactions</span> to a CSV file.
            </p>
            <div className="bg-gray-50 rounded-lg p-3 space-y-1">
              <p className="text-xs text-gray-500 font-medium">Export will include:</p>
              <ul className="text-xs text-gray-600 space-y-0.5">
                <li>• Transaction dates and details</li>
                <li>• Item names and quantities</li>
                <li>• Stock changes and reasons</li>
                <li>• Approval status and performed by</li>
              </ul>
            </div>
            <p className="mt-3 text-xs text-gray-500">
              File will be saved as: transactions-{new Date().toISOString().split('T')[0]}.csv
            </p>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button
              variant="ghost"
              onClick={() => setShowExportModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={exportTransactions}
            >
              Export CSV
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}