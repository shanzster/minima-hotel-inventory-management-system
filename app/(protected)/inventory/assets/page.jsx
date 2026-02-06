'use client'

import { useState, useEffect } from 'react'
import { usePageTitle } from '../../../../hooks/usePageTitle'
import { useAuth } from '../../../../hooks/useAuth'
import AssetManager from '../../../../components/inventory/AssetManager'
import AlertBanner from '../../../../components/inventory/AlertBanner'
import Button from '../../../../components/ui/Button'
import Modal from '../../../../components/ui/Modal'
import AddAssetWithRoomMap from '../../../../components/inventory/AddAssetWithRoomMap'
import { mockInventoryItems } from '../../../../lib/mockData'
import inventoryApi from '../../../../lib/inventoryApi'

export default function AssetsPage() {
  const { setTitle } = usePageTitle()
  const { user } = useAuth()
  const [assets, setAssets] = useState([])
  const [workflowEntries, setWorkflowEntries] = useState([])
  const [conditionFilter, setConditionFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showAddAssetModal, setShowAddAssetModal] = useState(false)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [sortDirection, setSortDirection] = useState('asc')

  // Set page title
  useEffect(() => {
    setTitle('Asset Management')
  }, [setTitle])

  // Filter assets from inventory items
  useEffect(() => {
    const assetItems = mockInventoryItems.filter(item => item.type === 'asset')
    setAssets(assetItems)
  }, [])

  // Calculate asset metrics
  const totalAssets = assets.length
  const equipmentAssets = assets.filter(asset => asset.category === 'equipment')
  const furnitureAssets = assets.filter(asset => asset.category === 'furniture')
  const goodConditionAssets = assets.filter(asset => asset.condition === 'good' || !asset.condition)
  const needsMaintenanceAssets = assets.filter(asset => asset.condition === 'needs-maintenance')
  const damagedAssets = assets.filter(asset => asset.condition === 'damaged')

  // Handle card clicks for filtering
  const handleAllAssetsClick = () => {
    setConditionFilter('')
    setCategoryFilter('')
  }

  const handleEquipmentClick = () => {
    setCategoryFilter('equipment')
    setConditionFilter('')
  }

  const handleFurnitureClick = () => {
    setCategoryFilter('furniture')
    setConditionFilter('')
  }

  const handleMaintenanceClick = () => {
    setConditionFilter('needs-maintenance')
    setCategoryFilter('')
  }

  const handleDamagedClick = () => {
    setConditionFilter('damaged')
    setCategoryFilter('')
  }

  // Get filtered assets for display count
  const getFilteredAssets = () => {
    let filtered = [...assets]
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(asset =>
        asset.name.toLowerCase().includes(query) ||
        asset.description?.toLowerCase().includes(query) ||
        asset.category?.toLowerCase().includes(query) ||
        asset.location?.toLowerCase().includes(query) ||
        asset.room?.toLowerCase().includes(query)
      )
    }
    
    if (conditionFilter) {
      filtered = filtered.filter(asset => asset.condition === conditionFilter)
    }
    
    if (categoryFilter) {
      filtered = filtered.filter(asset => asset.category === categoryFilter)
    }
    
    return filtered
  }

  const filteredAssets = getFilteredAssets()
  
  // Export to CSV function
  const exportToCSV = () => {
    const headers = ['Asset Name', 'Category', 'Condition', 'Room', 'Location', 'Purchase Date', 'Value']
    const csvData = filteredAssets.map(asset => {
      return [
        asset.name,
        asset.category || '-',
        asset.condition || 'good',
        asset.room || '-',
        asset.location || '-',
        asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : '-',
        asset.value ? `₱${asset.value.toFixed(2)}` : '-'
      ]
    })
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `assets-${new Date().toISOString().split('T')[0]}.csv`)
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
          <title>Asset Report</title>
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
            
            .asset-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 16px;
            }
            
            .asset-table th {
              font-family: 'Poppins', sans-serif;
              background: #f9fafb;
              padding: 8px 6px;
              text-align: left;
              font-weight: 500;
              font-size: 10px;
              color: #374151;
              border-bottom: 1px solid #e5e7eb;
            }
            
            .asset-table td {
              font-family: 'Poppins', sans-serif;
              padding: 6px;
              font-size: 10px;
              font-weight: 400;
              color: #1f2937;
              border-bottom: 1px solid #f3f4f6;
            }
            
            .asset-table tr:nth-child(even) {
              background: #fafafa;
            }
            
            .condition-good { font-family: 'Poppins', sans-serif; color: #059669; font-weight: 500; }
            .condition-maintenance { font-family: 'Poppins', sans-serif; color: #d97706; font-weight: 500; }
            .condition-damaged { font-family: 'Poppins', sans-serif; color: #dc2626; font-weight: 500; }
            
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
          <div class="report-header">
            <h1 class="report-title">Asset Management Report</h1>
            <p class="report-subtitle">Comprehensive asset status and tracking</p>
          </div>
          
          <div class="report-meta">
            <div>
              <strong>Generated by:</strong> Inventory Controller<br>
              <strong>Generated on:</strong> ${generatedDate} at ${generatedTime}
            </div>
            <div>
              <strong>Total Assets:</strong> ${filteredAssets.length}<br>
              <strong>Report Type:</strong> Asset Status
            </div>
          </div>
          
          <div class="summary-section">
            <h2 class="summary-title">Executive Summary</h2>
            <div class="summary-grid">
              <div class="summary-item">
                <p class="summary-number">${totalAssets}</p>
                <p class="summary-label">Total Assets</p>
              </div>
              <div class="summary-item">
                <p class="summary-number" style="color: #059669;">${goodConditionAssets.length}</p>
                <p class="summary-label">Good Condition</p>
              </div>
              <div class="summary-item">
                <p class="summary-number" style="color: #d97706;">${needsMaintenanceAssets.length}</p>
                <p class="summary-label">Needs Maintenance</p>
              </div>
              <div class="summary-item">
                <p class="summary-number" style="color: #dc2626;">${damagedAssets.length}</p>
                <p class="summary-label">Damaged</p>
              </div>
            </div>
          </div>
          
          <div class="table-section">
            <h2 class="table-title">Asset Details</h2>
            <table class="asset-table">
              <thead>
                <tr>
                  <th style="width: 25%;">Asset Name</th>
                  <th style="width: 15%;">Category</th>
                  <th style="width: 12%;">Condition</th>
                  <th style="width: 15%;">Room</th>
                  <th style="width: 18%;">Location</th>
                  <th style="width: 15%;">Value</th>
                </tr>
              </thead>
              <tbody>
                ${filteredAssets.map(asset => {
                  const condition = asset.condition || 'good'
                  const conditionText = condition === 'good' ? 'Good' :
                                       condition === 'needs-maintenance' ? 'Needs Maintenance' :
                                       condition === 'damaged' ? 'Damaged' : 'Good'
                  const conditionClass = `condition-${condition}`
                  
                  return `
                    <tr>
                      <td><strong>${asset.name}</strong></td>
                      <td><span class="category-badge">${asset.category || '-'}</span></td>
                      <td><span class="${conditionClass}">${conditionText}</span></td>
                      <td>${asset.room || '-'}</td>
                      <td>${asset.location || '-'}</td>
                      <td>${asset.value ? '₱' + asset.value.toFixed(2) : '-'}</td>
                    </tr>
                  `
                }).join('')}
              </tbody>
            </table>
          </div>
          
          <div class="footer">
            <p>This report was generated automatically by the Asset Management System</p>
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

  // Handle asset workflow updates
  const handleAssetUpdate = (assetAction, user) => {
    try {
      // Validate asset action
      if (!assetAction || !assetAction.assetId || !assetAction.type) {
        throw new Error('Invalid asset action data')
      }
      
      if (!user || !user.id || !user.role) {
        throw new Error('Invalid user data')
      }
      
      // Check if action requires approval
      const requiresApproval = determineApprovalRequirement(assetAction, user)
      
      // Create workflow entry
      const workflowEntry = {
        id: `asset-workflow-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        assetId: assetAction.assetId,
        type: assetAction.type,
        details: assetAction.details || {},
        performedBy: user.id,
        performedByName: user.name,
        performedByRole: user.role,
        timestamp: new Date().toISOString(),
        requiresApproval,
        approved: requiresApproval ? false : true,
        approvedBy: requiresApproval ? null : user.id,
        status: requiresApproval ? 'pending-approval' : 'completed'
      }
      
      // Add to workflow entries
      setWorkflowEntries(prev => [...prev, workflowEntry])
      
      // Update asset data if approved immediately
      if (!requiresApproval) {
        updateAssetData(assetAction, workflowEntry)
      }
      
      // Show success message
      const message = requiresApproval 
        ? `${assetAction.type} request submitted for approval`
        : `${assetAction.type} completed successfully`
      
      alert(message)
      
    } catch (error) {
      alert(`Error: ${error.message}`)
    }
  }

  const determineApprovalRequirement = (assetAction, user) => {
    // Inventory Controllers can approve their own actions for most cases
    if (user.role === 'inventory-controller') {
      // High-value adjustments or write-offs require additional approval
      if ((assetAction.type === 'adjustment' || assetAction.type === 'write-off') && 
          assetAction.details?.value > 5000) {
        return true
      }
      return false
    }
    
    // Other roles require approval for most asset actions
    return true
  }

  const updateAssetData = (assetAction, workflowEntry) => {
    setAssets(prevAssets => {
      return prevAssets.map(asset => {
        if (asset.id === assetAction.assetId) {
          const updatedAsset = { ...asset }
          
          switch (assetAction.type) {
            case 'assignment':
              updatedAsset.assignedTo = assetAction.details.assignedTo
              updatedAsset.assignedDepartment = assetAction.details.assignedDepartment
              break
            case 'condition-update':
              updatedAsset.condition = assetAction.details.newCondition
              break
            case 'maintenance-schedule':
              // In a real app, this would update maintenance schedule
              break
            case 'adjustment':
            case 'write-off':
              // In a real app, this would update asset value/status
              break
          }
          
          updatedAsset.updatedAt = new Date()
          updatedAsset.updatedBy = workflowEntry.performedBy
          
          return updatedAsset
        }
        return asset
      })
    })
  }

  // Get maintenance alerts (mock implementation)
  const getMaintenanceAlerts = () => {
    // In a real app, this would check maintenance schedules
    return []
  }

  const maintenanceAlerts = getMaintenanceAlerts()

  return (
    <div className="p-4 mx-2">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold text-gray-900 mb-1">Asset Management</h1>
            <p className="text-gray-500 font-body text-sm">
              Track assets and maintenance schedules
            </p>
          </div>
          
          {/* Add Asset Button - Top Right */}
          <Button
            onClick={() => setShowAddAssetModal(true)}
            className="bg-black text-white hover:bg-gray-800"
          >
            <svg className="w-4 h-4 mr-2 text-white inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add New Asset
          </Button>
        </div>
      </div>

      {/* Asset Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {/* All Assets Card */}
        <div 
          className={`bg-white/80 backdrop-blur-xl rounded-lg border p-4 cursor-pointer transition-all duration-200 ease-out hover:shadow-xl shadow-xl ${
            !conditionFilter && !categoryFilter ? 'border-slate-700 bg-slate-50/80' : 'border-white/20'
          }`}
          onClick={handleAllAssetsClick}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M9 21V9l3-2 3 2v12" />
                </svg>
              </div>
              <div>
                <h3 className="font-heading font-medium text-sm text-gray-600">All Assets</h3>
                <p className="text-2xl font-heading font-bold text-black">{totalAssets}</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500">Total assets</p>
        </div>

        {/* Equipment Card */}
        <div 
          className={`bg-white/80 backdrop-blur-xl rounded-lg border p-4 cursor-pointer transition-all duration-200 ease-out hover:shadow-xl shadow-xl ${
            categoryFilter === 'equipment' ? 'border-blue-800 bg-blue-50/80' :
            equipmentAssets.length > 0 ? 'border-blue-200 bg-blue-50/50' : 'border-white/20'
          }`}
          onClick={handleEquipmentClick}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className={`font-heading font-medium text-sm ${equipmentAssets.length > 0 ? 'text-blue-700' : 'text-gray-600'}`}>Equipment</h3>
                <p className={`text-2xl font-heading font-bold ${equipmentAssets.length > 0 ? 'text-blue-600' : 'text-gray-700'}`}>
                  {equipmentAssets.length}
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500">Operational equipment</p>
        </div>

        {/* Furniture Card */}
        <div 
          className={`bg-white/80 backdrop-blur-xl rounded-lg border p-4 cursor-pointer transition-all duration-200 ease-out hover:shadow-xl shadow-xl ${
            categoryFilter === 'furniture' ? 'border-green-800 bg-green-50/80' :
            furnitureAssets.length > 0 ? 'border-green-200 bg-green-50/50' : 'border-white/20'
          }`}
          onClick={handleFurnitureClick}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <div>
                <h3 className={`font-heading font-medium text-sm ${furnitureAssets.length > 0 ? 'text-green-700' : 'text-gray-600'}`}>Furniture</h3>
                <p className={`text-2xl font-heading font-bold ${furnitureAssets.length > 0 ? 'text-green-600' : 'text-gray-700'}`}>
                  {furnitureAssets.length}
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500">Furniture items</p>
        </div>

        {/* Needs Maintenance Card */}
        <div 
          className={`bg-white/80 backdrop-blur-xl rounded-lg border p-4 cursor-pointer transition-all duration-200 ease-out hover:shadow-xl shadow-xl ${
            conditionFilter === 'needs-maintenance' ? 'border-amber-800 bg-amber-50/80' :
            needsMaintenanceAssets.length > 0 ? 'border-amber-200 bg-amber-50/50' : 'border-white/20'
          }`}
          onClick={handleMaintenanceClick}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h3 className={`font-heading font-medium text-sm ${needsMaintenanceAssets.length > 0 ? 'text-amber-700' : 'text-gray-600'}`}>Needs Maintenance</h3>
                <p className={`text-2xl font-heading font-bold ${needsMaintenanceAssets.length > 0 ? 'text-amber-600' : 'text-gray-700'}`}>
                  {needsMaintenanceAssets.length}
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            {needsMaintenanceAssets.length > 0 ? 'Requires attention' : 'All maintained'}
          </p>
        </div>

        {/* Damaged Assets Card */}
        <div 
          className={`bg-white/80 backdrop-blur-xl rounded-lg border p-4 cursor-pointer transition-all duration-200 ease-out hover:shadow-xl shadow-xl ${
            conditionFilter === 'damaged' ? 'border-red-800 bg-red-50/80' :
            damagedAssets.length > 0 ? 'border-red-200 bg-red-50/50' : 'border-white/20'
          }`}
          onClick={handleDamagedClick}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className={`font-heading font-medium text-sm ${damagedAssets.length > 0 ? 'text-red-700' : 'text-gray-600'}`}>Damaged</h3>
                <p className={`text-2xl font-heading font-bold ${damagedAssets.length > 0 ? 'text-red-600' : 'text-gray-700'}`}>
                  {damagedAssets.length}
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            {damagedAssets.length > 0 ? 'Needs repair/replacement' : 'No damaged assets'}
          </p>
        </div>
      </div>

      {/* Maintenance Alerts */}
      {maintenanceAlerts.length > 0 && (
        <div className="mb-6">
          <AlertBanner
            type="warning"
            title="Maintenance Due"
            message={`${maintenanceAlerts.length} asset(s) require maintenance attention`}
          />
        </div>
      )}

      {/* Pending Approvals Alert */}
      {workflowEntries.filter(entry => entry.status === 'pending-approval').length > 0 && (
        <div className="mb-6">
          <AlertBanner
            type="info"
            title="Pending Approvals"
            message={`${workflowEntries.filter(entry => entry.status === 'pending-approval').length} asset workflow(s) pending approval`}
          />
        </div>
      )}

      {/* Asset Manager */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-lg shadow-xl">
        <div className="border-b border-white/20 px-4 py-3">
          <h3 className="font-heading font-medium text-base">
            Asset Management
            <span className="text-gray-500 font-normal ml-2 text-sm">
              ({filteredAssets.length} {filteredAssets.length === 1 ? 'asset' : 'assets'})
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
                  placeholder="Search assets..."
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
        
        <AssetManager
          assets={assets}
          onAssetUpdate={handleAssetUpdate}
          conditionFilter={conditionFilter}
          categoryFilter={categoryFilter}
        />
      </div>

      {/* Workflow History */}
      {workflowEntries.length > 0 && (
        <div className="mt-8 bg-white border border-gray-200 rounded-lg">
          <div className="border-b border-gray-200 px-6 py-4">
            <h3 className="font-heading font-medium text-lg">
              Recent Asset Activities
            </h3>
          </div>
          
          <div className="divide-y divide-gray-200">
            {workflowEntries.slice(-10).reverse().map((entry) => (
              <div key={entry.id} className="px-6 py-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {entry.type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                    <p className="text-sm text-gray-500">
                      Asset: {assets.find(a => a.id === entry.assetId)?.name || entry.assetId}
                    </p>
                    <p className="text-xs text-gray-400">
                      By {entry.performedByName} • {new Date(entry.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      entry.status === 'completed' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {entry.status.replace('-', ' ')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Add Asset Modal */}
      <Modal
        isOpen={showAddAssetModal}
        onClose={() => setShowAddAssetModal(false)}
        title="Add New Asset"
        size="xl"
      >
        <AddAssetWithRoomMap
          onSubmit={async (assetData) => {
            try {
              await inventoryApi.create(assetData)
              setShowAddAssetModal(false)
            } catch (error) {
              console.error('Error adding asset:', error)
              alert('Failed to add asset. Please try again.')
            }
          }}
          onCancel={() => setShowAddAssetModal(false)}
        />
      </Modal>

      {/* Filter Modal */}
      <Modal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        title="Filter Assets"
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
              <option value="equipment">Equipment</option>
              <option value="furniture">Furniture</option>
            </select>
          </div>
          
          {/* Condition Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Condition
            </label>
            <select
              value={conditionFilter}
              onChange={(e) => setConditionFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20"
            >
              <option value="">All Conditions</option>
              <option value="good">Good</option>
              <option value="needs-maintenance">Needs Maintenance</option>
              <option value="damaged">Damaged</option>
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
              <option value="condition">Condition</option>
              <option value="room">Room</option>
              <option value="purchaseDate">Purchase Date</option>
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
                setConditionFilter('')
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