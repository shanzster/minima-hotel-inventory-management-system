'use client'

import { useState, useEffect } from 'react'
import { usePageTitle } from '../../../../hooks/usePageTitle'
import { useAuth } from '../../../../hooks/useAuth'
import AssetManager from '../../../../components/inventory/AssetManager'
import AlertBanner from '../../../../components/inventory/AlertBanner'
import Button from '../../../../components/ui/Button'
import { mockInventoryItems } from '../../../../lib/mockData'

export default function AssetsPage() {
  const { setTitle } = usePageTitle()
  const { user } = useAuth()
  const [assets, setAssets] = useState([])
  const [workflowEntries, setWorkflowEntries] = useState([])
  const [conditionFilter, setConditionFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showAddAssetModal, setShowAddAssetModal] = useState(false)

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
    
    if (conditionFilter) {
      filtered = filtered.filter(asset => asset.condition === conditionFilter)
    }
    
    if (categoryFilter) {
      filtered = filtered.filter(asset => asset.category === categoryFilter)
    }
    
    return filtered
  }

  const filteredAssets = getFilteredAssets()

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
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <p className="text-gray-500 font-body">
            Track assets and maintenance schedules
          </p>
        </div>
        <Button
          onClick={() => setShowAddAssetModal(true)}
          className="bg-black text-white hover:bg-gray-800"
        >
          Add New Asset
        </Button>
      </div>

      {/* Asset Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {/* All Assets Card */}
        <div 
          className={`bg-white rounded-lg border p-6 cursor-pointer transition-all duration-200 ease-out hover:shadow-sm ${
            !conditionFilter && !categoryFilter ? 'border-slate-700 bg-slate-50' : 'border-gray-200'
          }`}
          onClick={handleAllAssetsClick}
        >
          <div className="flex items-start justify-between mb-0 h-12">
            <h3 className="font-heading font-medium text-lg leading-tight">All Assets</h3>
          </div>
          <p className="text-3xl font-heading font-medium text-slate-700 mb-1">{totalAssets}</p>
          <p className="text-sm text-gray-500">Total assets</p>
        </div>

        {/* Equipment Card */}
        <div 
          className={`bg-white rounded-lg border p-6 cursor-pointer transition-all duration-200 ease-out hover:shadow-sm ${
            categoryFilter === 'equipment' ? 'border-blue-700 bg-blue-50' :
            equipmentAssets.length > 0 ? 'border-blue-200' : 'border-gray-200'
          }`}
          onClick={handleEquipmentClick}
        >
          <div className="flex items-start justify-between mb-0 h-12">
            <h3 className="font-heading font-medium text-lg leading-tight">Equipment</h3>
          </div>
          <p className={`text-3xl font-heading font-medium mb-1 ${
            categoryFilter === 'equipment' ? 'text-blue-700' : 'text-blue-600'
          }`}>
            {equipmentAssets.length}
          </p>
          <p className="text-sm text-gray-500">Operational equipment</p>
        </div>

        {/* Furniture Card */}
        <div 
          className={`bg-white rounded-lg border p-6 cursor-pointer transition-all duration-200 ease-out hover:shadow-sm ${
            categoryFilter === 'furniture' ? 'border-green-700 bg-green-50' :
            furnitureAssets.length > 0 ? 'border-green-200' : 'border-gray-200'
          }`}
          onClick={handleFurnitureClick}
        >
          <div className="flex items-start justify-between mb-0 h-12">
            <h3 className="font-heading font-medium text-lg leading-tight">Furniture</h3>
          </div>
          <p className={`text-3xl font-heading font-medium mb-1 ${
            categoryFilter === 'furniture' ? 'text-green-700' : 'text-green-600'
          }`}>
            {furnitureAssets.length}
          </p>
          <p className="text-sm text-gray-500">Furniture items</p>
        </div>

        {/* Needs Maintenance Card */}
        <div 
          className={`bg-white rounded-lg border p-6 cursor-pointer transition-all duration-200 ease-out hover:shadow-sm ${
            conditionFilter === 'needs-maintenance' ? 'border-amber-700 bg-amber-50' :
            needsMaintenanceAssets.length > 0 ? 'border-amber-200' : 'border-gray-200'
          }`}
          onClick={handleMaintenanceClick}
        >
          <div className="flex items-start justify-between mb-0 h-12">
            <h3 className="font-heading font-medium text-lg leading-tight">Needs Maintenance</h3>
          </div>
          <p className={`text-3xl font-heading font-medium mb-1 ${
            conditionFilter === 'needs-maintenance' ? 'text-amber-700' : 'text-amber-600'
          }`}>
            {needsMaintenanceAssets.length}
          </p>
          <p className="text-sm text-gray-500">
            {needsMaintenanceAssets.length > 0 ? 'Requires attention' : 'All maintained'}
          </p>
        </div>

        {/* Damaged Assets Card */}
        <div 
          className={`bg-white rounded-lg border p-6 cursor-pointer transition-all duration-200 ease-out hover:shadow-sm ${
            conditionFilter === 'damaged' ? 'border-red-800 bg-red-50' :
            damagedAssets.length > 0 ? 'border-red-200' : 'border-gray-200'
          }`}
          onClick={handleDamagedClick}
        >
          <div className="flex items-start justify-between mb-0 h-12">
            <h3 className="font-heading font-medium text-lg leading-tight">Damaged</h3>
          </div>
          <p className={`text-3xl font-heading font-medium mb-1 ${
            conditionFilter === 'damaged' ? 'text-red-800' : 'text-red-600'
          }`}>
            {damagedAssets.length}
          </p>
          <p className="text-sm text-gray-500">
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
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="font-heading font-medium text-lg">
            Asset Management
            <span className="text-gray-500 font-normal ml-2">
              ({filteredAssets.length} assets)
            </span>
          </h3>
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
    </div>
  )
}