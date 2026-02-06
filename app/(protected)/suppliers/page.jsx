'use client'

import { useState, useEffect } from 'react'
import { usePageTitle } from '../../../hooks/usePageTitle'
import Button from '../../../components/ui/Button'
import Modal from '../../../components/ui/Modal'
import Badge from '../../../components/ui/Badge'
import SupplierForm from '../../../components/inventory/SupplierForm'
import SupplierDetailsModal from '../../../components/inventory/SupplierDetailsModal'
import supplierApi from '../../../lib/supplierApi'
import { INVENTORY_CATEGORIES } from '../../../lib/constants'

export default function SuppliersPage() {
  const { setTitle } = usePageTitle()
  const [suppliers, setSuppliers] = useState([])
  const [filteredSuppliers, setFilteredSuppliers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUsingFirebase, setIsUsingFirebase] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [sortDirection, setSortDirection] = useState('asc')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 25
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  // Export to CSV function
  const exportToCSV = () => {
    const headers = ['Supplier Name', 'Contact Person', 'Email', 'Phone', 'Categories', 'Status', 'Performance Rating']
    const csvData = filteredSuppliers.map(supplier => [
      supplier.name,
      supplier.contactPerson,
      supplier.email,
      supplier.phone,
      Array.isArray(supplier.categories) ? supplier.categories.join('; ') : '',
      !supplier.isApproved ? 'Pending Approval' : supplier.isActive ? 'Active' : 'Inactive',
      supplier.performanceMetrics?.overallRating || 0
    ])

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `suppliers-${new Date().toISOString().split('T')[0]}.csv`)
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
    const totalSuppliers = filteredSuppliers.length
    const activeCount = filteredSuppliers.filter(supplier => supplier.isActive && supplier.isApproved).length
    const pendingCount = filteredSuppliers.filter(supplier => !supplier.isApproved).length
    const highPerformingCount = filteredSuppliers.filter(supplier => supplier.performanceMetrics?.overallRating >= 4.5).length

    // Get active filters
    const activeFilters = []
    if (searchQuery) activeFilters.push(`Search: "${searchQuery}"`)
    if (statusFilter) activeFilters.push(`Status: ${statusFilter}`)
    if (categoryFilter) activeFilters.push(`Category: ${categoryFilter}`)
    if (sortBy !== 'name' || sortDirection !== 'asc') {
      activeFilters.push(`Sort: ${sortBy} (${sortDirection})`)
    }

    // Generate print HTML
    const printHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Suppliers Report</title>
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
            
            .suppliers-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 16px;
            }
            
            .suppliers-table th {
              font-family: 'Poppins', sans-serif;
              background: #f9fafb;
              padding: 8px 6px;
              text-align: left;
              font-weight: 500;
              font-size: 10px;
              color: #374151;
              border-bottom: 1px solid #e5e7eb;
            }
            
            .suppliers-table td {
              font-family: 'Poppins', sans-serif;
              padding: 6px;
              font-size: 10px;
              font-weight: 400;
              color: #1f2937;
              border-bottom: 1px solid #f3f4f6;
            }
            
            .suppliers-table tr:nth-child(even) {
              background: #fafafa;
            }
            
            .status-active { font-family: 'Poppins', sans-serif; color: #059669; font-weight: 500; }
            .status-pending { font-family: 'Poppins', sans-serif; color: #d97706; font-weight: 500; }
            .status-inactive { font-family: 'Poppins', sans-serif; color: #6b7280; font-weight: 400; }
            
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
            <h1 class="report-title">Suppliers Report</h1>
            <p class="report-subtitle">Comprehensive supplier performance and status analysis</p>
          </div>
          
          <!-- Report Metadata -->
          <div class="report-meta">
            <div>
              <strong>Generated by:</strong> Purchasing Officer<br>
              <strong>Generated on:</strong> ${generatedDate} at ${generatedTime}
            </div>
            <div>
              <strong>Total Suppliers:</strong> ${totalSuppliers}<br>
              <strong>Report Type:</strong> Suppliers
            </div>
          </div>
          
          <!-- Summary Section -->
          <div class="summary-section">
            <h2 class="summary-title">Executive Summary</h2>
            <div class="summary-grid">
              <div class="summary-item">
                <p class="summary-number">${totalSuppliers}</p>
                <p class="summary-label">Total Suppliers</p>
              </div>
              <div class="summary-item">
                <p class="summary-number" style="color: #059669;">${activeCount}</p>
                <p class="summary-label">Active</p>
              </div>
              <div class="summary-item">
                <p class="summary-number" style="color: #d97706;">${pendingCount}</p>
                <p class="summary-label">Pending</p>
              </div>
              <div class="summary-item">
                <p class="summary-number" style="color: #059669;">${highPerformingCount}</p>
                <p class="summary-label">High Performing</p>
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
          
          <!-- Suppliers Table -->
          <div class="table-section">
            <h2 class="table-title">Supplier Details</h2>
            <table class="suppliers-table">
              <thead>
                <tr>
                  <th style="width: 20%;">Supplier Name</th>
                  <th style="width: 15%;">Contact Person</th>
                  <th style="width: 20%;">Contact Info</th>
                  <th style="width: 20%;">Categories</th>
                  <th style="width: 12%;">Status</th>
                  <th style="width: 13%;">Performance</th>
                </tr>
              </thead>
              <tbody>
                ${filteredSuppliers.map(supplier => {
      const statusClass = !supplier.isApproved ? 'status-pending' : supplier.isActive ? 'status-active' : 'status-inactive'
      const statusText = !supplier.isApproved ? 'Pending' : supplier.isActive ? 'Active' : 'Inactive'
      const rating = supplier.performanceMetrics?.overallRating || 0
      const categories = Array.isArray(supplier.categories) ? supplier.categories.slice(0, 3).join(', ') : 'No categories'

      return `
                    <tr>
                      <td><strong>${supplier.name}</strong></td>
                      <td>${supplier.contactPerson}</td>
                      <td><strong>${supplier.email}</strong><br><small>${supplier.phone}</small></td>
                      <td><small>${categories}${supplier.categories && supplier.categories.length > 3 ? '...' : ''}</small></td>
                      <td><span class="${statusClass}">${statusText}</span></td>
                      <td>${rating > 0 ? `<strong>${rating.toFixed(1)}/5.0</strong>` : 'No data'}</td>
                    </tr>
                  `
    }).join('')}
              </tbody>
            </table>
          </div>
          
          <!-- Footer -->
          <div class="footer">
            <p>This report was generated automatically by the Supplier Management System</p>
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

  // Set page title
  useEffect(() => {
    setTitle('Suppliers')
  }, [setTitle])

  // Load suppliers data
  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        setIsLoading(true)
        const suppliersData = await supplierApi.getAll()
        setSuppliers(suppliersData)

        // Check if we're using Firebase
        try {
          const testSuppliers = await supplierApi.getAll()
          setIsUsingFirebase(testSuppliers !== null && testSuppliers.length >= 0)
        } catch {
          setIsUsingFirebase(false)
        }
      } catch (error) {
        console.error('Error loading suppliers:', error)
        setIsUsingFirebase(false)
      } finally {
        setIsLoading(false)
      }
    }

    loadSuppliers()

    // Set up real-time listener for suppliers
    const unsubscribe = supplierApi.onSuppliersChange((suppliersData) => {
      setSuppliers(suppliersData)
    })

    return unsubscribe
  }, [])

  // Calculate summary metrics (using state data)
  const activeSuppliers = suppliers.filter(s => s.isActive && s.isApproved)
  const pendingSuppliers = suppliers.filter(s => !s.isApproved)
  const highPerformingSuppliers = suppliers.filter(s => s.performanceMetrics?.overallRating >= 4.5)
  const lowPerformingSuppliers = suppliers.filter(s =>
    s.performanceMetrics?.overallRating > 0 &&
    s.performanceMetrics?.overallRating < 4.0
  )

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
    setSelectedSupplier(supplier)
    setShowDetailsModal(true)
  }

  // Handle update supplier
  const handleUpdateSupplier = async (supplierId, supplierData) => {
    try {
      await supplierApi.update(supplierId, {
        ...supplierData,
        updatedAt: new Date().toISOString()
      })
      setSuccessMessage('Supplier updated successfully!')
      setShowSuccessModal(true)

      // Auto-close success modal after 3 seconds
      setTimeout(() => {
        setShowSuccessModal(false)
      }, 3000)
    } catch (error) {
      console.error('Error updating supplier:', error)
      alert('Failed to update supplier. Please try again.')
    }
  }

  // Handle create supplier
  const handleCreateSupplier = async (supplierData) => {
    try {
      const newSupplier = {
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
        createdAt: new Date().toISOString()
      }

      await supplierApi.create(newSupplier)
      setShowCreateModal(false)

      // Show success modal instead of alert
      setSuccessMessage('Supplier created successfully and sent for approval!')
      setShowSuccessModal(true)

      // Auto-close success modal after 3 seconds
      setTimeout(() => {
        setShowSuccessModal(false)
      }, 3000)
    } catch (error) {
      console.error('Error creating supplier:', error)
      alert('Failed to create supplier. Please try again.')
    }
  }

  // Handle supplier approval
  const handleApproveSupplier = async (supplierId) => {
    try {
      await supplierApi.approveSupplier(supplierId, 'purchasing-officer-001')
      setSuccessMessage('Supplier approved successfully!')
      setShowSuccessModal(true)

      // Auto-close success modal after 3 seconds
      setTimeout(() => {
        setShowSuccessModal(false)
      }, 3000)
    } catch (error) {
      console.error('Error approving supplier:', error)
      alert('Failed to approve supplier. Please try again.')
    }
  }

  return (
    <div className="p-4 mx-2">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold text-gray-900 mb-1">Suppliers</h1>
            <p className="text-gray-500 font-body text-sm">
              Manage suppliers and performance
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
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-black text-white hover:bg-gray-800 backdrop-blur-sm whitespace-nowrap px-8"
            >
              Add New Supplier
            </Button>
          </div>
        </div>
      </div>

      {/* Supplier Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {/* All Suppliers Card */}
        <div
          className={`bg-white/80 backdrop-blur-xl rounded-lg border p-4 cursor-pointer transition-all duration-200 ease-out hover:shadow-xl shadow-xl ${!statusFilter ? 'border-slate-700 bg-slate-50/80' : 'border-white/20'
            }`}
          onClick={handleAllSuppliersClick}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h3 className="font-heading font-medium text-sm text-gray-600">All Suppliers</h3>
                <p className="text-2xl font-heading font-bold text-black">
                  {suppliers.length}
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500">Total suppliers</p>
        </div>

        {/* Active Suppliers Card */}
        <div
          className={`bg-white/80 backdrop-blur-xl rounded-lg border p-4 cursor-pointer transition-all duration-200 ease-out hover:shadow-xl shadow-xl ${statusFilter === 'active' ? 'border-green-700 bg-green-50/80' :
              activeSuppliers.length > 0 ? 'border-green-200 bg-green-50/50' : 'border-white/20'
            }`}
          onClick={handleActiveClick}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className={`font-heading font-medium text-sm ${activeSuppliers.length > 0 ? 'text-green-700' : 'text-gray-600'
                  }`}>Active</h3>
                <p className={`text-2xl font-heading font-bold ${activeSuppliers.length > 0 ? 'text-green-600' : 'text-gray-700'
                  }`}>
                  {activeSuppliers.length}
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            {activeSuppliers.length > 0 ? 'Approved suppliers' : 'No active suppliers'}
          </p>
        </div>

        {/* Pending Approval Card */}
        <div
          className={`bg-white/80 backdrop-blur-xl rounded-lg border p-4 cursor-pointer transition-all duration-200 ease-out hover:shadow-xl shadow-xl ${statusFilter === 'pending' ? 'border-amber-700 bg-amber-50/80' :
              pendingSuppliers.length > 0 ? 'border-amber-200 bg-amber-50/50' : 'border-white/20'
            }`}
          onClick={handlePendingClick}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className={`font-heading font-medium text-sm ${pendingSuppliers.length > 0 ? 'text-amber-700' : 'text-gray-600'
                  }`}>Pending</h3>
                <p className={`text-2xl font-heading font-bold ${pendingSuppliers.length > 0 ? 'text-amber-600' : 'text-gray-700'
                  }`}>
                  {pendingSuppliers.length}
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            {pendingSuppliers.length > 0 ? 'Awaiting approval' : 'No pending suppliers'}
          </p>
        </div>

        {/* High Performing Card */}
        <div
          className={`bg-white/80 backdrop-blur-xl rounded-lg border p-4 cursor-pointer transition-all duration-200 ease-out hover:shadow-xl shadow-xl ${statusFilter === 'high-performing' ? 'border-green-700 bg-green-50/80' :
              highPerformingSuppliers.length > 0 ? 'border-green-200 bg-green-50/50' : 'border-white/20'
            }`}
          onClick={handleHighPerformingClick}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <div>
                <h3 className={`font-heading font-medium text-sm ${highPerformingSuppliers.length > 0 ? 'text-green-700' : 'text-gray-600'
                  }`}>High Performing</h3>
                <p className={`text-2xl font-heading font-bold ${highPerformingSuppliers.length > 0 ? 'text-green-600' : 'text-gray-700'
                  }`}>
                  {highPerformingSuppliers.length}
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            {highPerformingSuppliers.length > 0 ? '4.5+ rating' : 'No high performers'}
          </p>
        </div>

        {/* Low Performing Card */}
        <div
          className={`bg-white/80 backdrop-blur-xl rounded-lg border p-4 cursor-pointer transition-all duration-200 ease-out hover:shadow-xl shadow-xl ${statusFilter === 'low-performing' ? 'border-red-700 bg-red-50/80' :
              lowPerformingSuppliers.length > 0 ? 'border-red-200 bg-red-50/50' : 'border-white/20'
            }`}
          onClick={handleLowPerformingClick}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className={`font-heading font-medium text-sm ${lowPerformingSuppliers.length > 0 ? 'text-red-700' : 'text-gray-600'
                  }`}>Low Performing</h3>
                <p className={`text-2xl font-heading font-bold ${lowPerformingSuppliers.length > 0 ? 'text-red-600' : 'text-gray-700'
                  }`}>
                  {lowPerformingSuppliers.length}
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            {lowPerformingSuppliers.length > 0 ? 'Below 4.0 rating' : 'No low performers'}
          </p>
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-lg shadow-xl">
        <div className="border-b border-white/20 px-4 py-3">
          <h3 className="font-heading font-medium text-base">
            Suppliers
            <span className="text-gray-500 font-normal ml-2 text-sm">
              ({filteredSuppliers.length} suppliers)
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
                  placeholder="Search suppliers..."
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

        {/* Enhanced Suppliers Table */}
        <div className="p-4">
          {getPaginatedData().length === 0 ? (
            <div className="text-center py-12">
              <svg className="h-12 w-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <p className="text-gray-500 mb-4 text-sm">
                {isUsingFirebase && suppliers.length === 0 ? "No suppliers yet" : "No suppliers found"}
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
                        onClick={() => {
                          if (sortBy === 'name') {
                            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                          } else {
                            setSortBy('name')
                            setSortDirection('asc')
                          }
                        }}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Supplier Name</span>
                          {sortBy === 'name' && (
                            <svg className={`w-4 h-4 ${sortDirection === 'asc' ? 'rotate-0' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          )}
                        </div>
                      </th>
                      <th className="text-left py-3 px-4 font-heading font-medium text-sm text-gray-600">
                        Contact
                      </th>
                      <th className="text-left py-3 px-4 font-heading font-medium text-sm text-gray-600">
                        Categories
                      </th>
                      <th className="text-left py-3 px-4 font-heading font-medium text-sm text-gray-600">
                        Status
                      </th>
                      <th
                        className="text-left py-3 px-4 font-heading font-medium text-sm text-gray-600 cursor-pointer hover:text-gray-900 transition-colors"
                        onClick={() => {
                          if (sortBy === 'performanceRating') {
                            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                          } else {
                            setSortBy('performanceRating')
                            setSortDirection('desc')
                          }
                        }}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Performance</span>
                          {sortBy === 'performanceRating' && (
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
                    {getPaginatedData().map((supplier, index) => {
                      const rating = supplier.rating || (supplier.performanceMetrics && supplier.performanceMetrics.overallRating) || 0

                      return (
                        <tr
                          key={supplier.id}
                          className="border-b border-white/10 hover:bg-white/20 cursor-pointer transition-all duration-200 backdrop-blur-sm"
                          onClick={() => handleRowClick(supplier)}
                        >
                          {/* Supplier Name */}
                          <td className="py-4 px-4">
                            <div>
                              <p className="font-heading font-medium text-gray-900">{supplier.name}</p>
                              <p className="text-sm text-gray-500">{supplier.contactPerson}</p>
                            </div>
                          </td>

                          {/* Contact */}
                          <td className="py-4 px-4">
                            <div>
                              <p className="text-sm text-gray-900">{supplier.email}</p>
                              <p className="text-sm text-gray-500">{supplier.phone}</p>
                            </div>
                          </td>

                          {/* Categories */}
                          <td className="py-4 px-4">
                            <div className="flex flex-wrap gap-1">
                              {Array.isArray(supplier.categories) && supplier.categories.length > 0 ? (
                                <>
                                  {supplier.categories.slice(0, 2).map(category => (
                                    <div key={category} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                      {category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </div>
                                  ))}
                                  {supplier.categories.length > 2 && (
                                    <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                      +{supplier.categories.length - 2}
                                    </div>
                                  )}
                                </>
                              ) : (
                                <span className="text-gray-400 text-sm">No categories</span>
                              )}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-4 px-4">
                            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${!supplier.isApproved ? 'bg-amber-100 text-amber-800' :
                                supplier.isActive ? 'bg-green-100 text-green-800' :
                                  'bg-gray-100 text-gray-800'
                              }`}>
                              {!supplier.isApproved ? 'Pending Approval' : supplier.isActive ? 'Active' : 'Inactive'}
                            </div>
                          </td>

                          {/* Performance */}
                          <td className="py-4 px-4">
                            {rating === 0 || rating === null ? (
                              <span className="text-gray-400 text-sm">No data</span>
                            ) : (
                              <div>
                                <span className={`font-medium ${rating >= 4.5 ? 'text-green-600' :
                                    rating >= 4.0 ? 'text-blue-600' :
                                      rating >= 3.5 ? 'text-yellow-600' : 'text-red-600'
                                  }`}>
                                  {rating.toFixed(1)}/5.0
                                </span>
                                <div className="text-sm text-gray-500">
                                  {supplier.performanceMetrics?.deliveryReliability > 0 ?
                                    `${supplier.performanceMetrics.deliveryReliability}% on-time` :
                                    'No performance data'
                                  }
                                </div>
                              </div>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleRowClick(supplier)
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

                              {!supplier.isApproved && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleApproveSupplier(supplier.id)
                                  }}
                                  className="inline-flex items-center px-3 py-1 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors backdrop-blur-sm"
                                  title="Approve Supplier"
                                >
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Approve
                                </button>
                              )}

                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  console.log('Edit supplier:', supplier.id)
                                  setSelectedSupplier(supplier)
                                  setShowDetailsModal(true)
                                }}
                                className="inline-flex items-center px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors backdrop-blur-sm"
                                title="Edit Supplier"
                              >
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {filteredSuppliers.length > pageSize && (
                <div className="flex items-center justify-between border-t border-white/20 pt-4 mt-4">
                  <div className="text-sm text-gray-500">
                    Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredSuppliers.length)} of {filteredSuppliers.length} suppliers
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
                      Page {currentPage} of {Math.ceil(filteredSuppliers.length / pageSize)}
                    </span>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= Math.ceil(filteredSuppliers.length / pageSize)}
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
                <h3 className="text-lg font-heading font-bold text-gray-900">Filter Suppliers</h3>
                <p className="text-sm text-gray-500">Refine your supplier view</p>
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
            {/* Status Filter */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-heading font-medium text-gray-700">
                <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Status</span>
              </label>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full appearance-none bg-white border-2 border-gray-300 rounded-lg px-4 py-3 pr-10 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-black focus:border-black cursor-pointer transition-all shadow-sm hover:border-gray-400"
                >
                  <option value="">All Suppliers</option>
                  <option value="active">🟢 Active</option>
                  <option value="pending">🟡 Pending Approval</option>
                  <option value="high-performing">⭐ High Performing</option>
                  <option value="low-performing">⚠️ Low Performing</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

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

            {/* Sort Options */}
            <div className="space-y-2 md:col-span-2">
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
                  <option value="name-asc">🏢 Supplier Name (A-Z)</option>
                  <option value="name-desc">🏢 Supplier Name (Z-A)</option>
                  <option value="createdAt-desc">📅 Recently Added</option>
                  <option value="createdAt-asc">📅 Oldest First</option>
                  <option value="performanceRating-desc">⭐ Performance (High to Low)</option>
                  <option value="performanceRating-asc">⭐ Performance (Low to High)</option>
                  <option value="deliveryReliability-desc">🚚 Delivery Reliability (High to Low)</option>
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
          {(statusFilter || categoryFilter || sortBy !== 'name' || sortDirection !== 'asc') && (
            <div className="mb-6 p-4 bg-gray-50/80 backdrop-blur-sm rounded-lg border border-white/20">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-heading font-medium text-gray-700">Active Filters</h4>
                <button
                  onClick={() => {
                    setStatusFilter('')
                    setCategoryFilter('')
                    setSortBy('name')
                    setSortDirection('asc')
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Clear All
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {statusFilter && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Status: {statusFilter}
                    <button
                      onClick={() => setStatusFilter('')}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                )}
                {categoryFilter && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Category: {categoryFilter}
                    <button
                      onClick={() => setCategoryFilter('')}
                      className="ml-1 text-green-600 hover:text-green-800"
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
                {filteredSuppliers.length} {filteredSuppliers.length === 1 ? 'supplier' : 'suppliers'} match your filters
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t border-white/20">
            <button
              onClick={() => {
                setStatusFilter('')
                setCategoryFilter('')
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

      {/* Supplier Details Modal */}
      <SupplierDetailsModal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false)
          setSelectedSupplier(null)
        }}
        supplier={selectedSupplier}
        onUpdateSupplier={handleUpdateSupplier}
        onApproveSupplier={handleApproveSupplier}
        isLoading={false}
      />

      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        size="md"
        centered={true}
      >
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-heading font-bold text-gray-900 mb-2">
            Success!
          </h3>
          <p className="text-gray-600">
            {successMessage}
          </p>
        </div>
      </Modal>
    </div>
  )
}