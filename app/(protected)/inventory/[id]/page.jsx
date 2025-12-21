'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import StockIndicator from '../../../../components/inventory/StockIndicator'
import AlertBanner from '../../../../components/inventory/AlertBanner'
import TransactionManager from '../../../../components/inventory/TransactionManager'
import Button from '../../../../components/ui/Button'
import Badge from '../../../../components/ui/Badge'
import { formatCurrency } from '../../../../lib/utils'
import { 
  mockInventoryItems,
  getItemTransactions
} from '../../../../lib/mockData'

export default function InventoryItemPage({ params }) {
  const router = useRouter()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showTransactionManager, setShowTransactionManager] = useState(false)
  const [itemId, setItemId] = useState(null)
  
  useEffect(() => {
    // Handle async params in Next.js 15
    const resolveParams = async () => {
      const resolvedParams = await params
      setItemId(resolvedParams.id)
    }
    
    if (params) {
      resolveParams()
    }
  }, [params])
  
  useEffect(() => {
    if (itemId) {
      // Find the item by ID
      const foundItem = mockInventoryItems.find(i => i.id === itemId)
      if (foundItem) {
        setItem(foundItem)
      }
      setLoading(false)
    }
  }, [itemId])
  
  const handleTransactionComplete = (transaction) => {
    // Update item stock level based on transaction
    if (item) {
      setItem(prev => ({
        ...prev,
        currentStock: transaction.newStock,
        updatedAt: new Date(),
        updatedBy: transaction.performedBy
      }))
    }
  }
  
  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }
  
  if (!item) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-heading font-medium mb-4">Item Not Found</h1>
          <p className="text-gray-500 mb-6">
            The inventory item with ID "{itemId}" could not be found.
          </p>
          <Button onClick={() => router.push('/inventory')}>
            Back to Inventory
          </Button>
        </div>
      </div>
    )
  }
  
  const getStockStatus = () => {
    if (item.currentStock === 0) return 'critical'
    if (item.currentStock <= item.restockThreshold) return 'low'
    if (item.maxStock && item.currentStock > item.maxStock) return 'excess'
    return 'normal'
  }
  
  const getExpiryStatus = () => {
    if (!item.expirationDate) return null
    
    const now = new Date()
    const expiryDate = new Date(item.expirationDate)
    const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24))
    
    if (daysUntilExpiry < 0) return 'expired'
    if (daysUntilExpiry <= 7) return 'expiring-soon'
    if (daysUntilExpiry <= 30) return 'expiring-month'
    return 'good'
  }
  
  const stockStatus = getStockStatus()
  const expiryStatus = getExpiryStatus()
  
  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <Button
              variant="ghost"
              onClick={() => router.push('/inventory')}
              className="mb-2"
            >
              ← Back to Inventory
            </Button>
            <h1 className="text-3xl font-heading font-medium">
              {item.name}
            </h1>
            <p className="text-gray-500 font-body mt-1">
              {item.description}
            </p>
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="primary"
              onClick={() => setShowTransactionManager(true)}
            >
              Manage Transactions
            </Button>
          </div>
        </div>
        
        {/* Alerts */}
        <div className="space-y-4">
          {stockStatus === 'critical' && (
            <AlertBanner
              type="critical-stock"
              message="This item is out of stock and requires immediate restocking."
              actionLabel="Manage Stock"
              onAction={() => setShowTransactionManager(true)}
            />
          )}
          
          {stockStatus === 'low' && (
            <AlertBanner
              type="low-stock"
              message="This item is running low and may need restocking soon."
              actionLabel="Manage Stock"
              onAction={() => setShowTransactionManager(true)}
            />
          )}
          
          {expiryStatus === 'expired' && (
            <AlertBanner
              type="error"
              message="This item has expired and should be removed from inventory."
              actionLabel="Manage Stock"
              onAction={() => setShowTransactionManager(true)}
            />
          )}
          
          {expiryStatus === 'expiring-soon' && (
            <AlertBanner
              type="warning"
              message="This item is expiring within 7 days."
            />
          )}
        </div>
      </div>
      
      {/* Item Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Basic Information */}
        <div className="bg-white rounded-md border border-gray-300 p-6">
          <h2 className="font-heading font-medium text-xl mb-4">Item Information</h2>
          
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-500">Category:</span>
              <Badge variant="default">
                {item.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Badge>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-500">Type:</span>
              <span className="font-medium capitalize">{item.type}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-500">Location:</span>
              <span className="font-medium">{item.location}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-500">Unit:</span>
              <span className="font-medium">{item.unit}</span>
            </div>
            
            {item.supplier && (
              <div className="flex justify-between">
                <span className="text-gray-500">Supplier:</span>
                <span className="font-medium">{item.supplier}</span>
              </div>
            )}
            
            {item.cost && (
              <div className="flex justify-between">
                <span className="text-gray-500">Unit Cost:</span>
                <span className="font-medium">{formatCurrency(item.cost)}</span>
              </div>
            )}
            
            {item.batchNumber && (
              <div className="flex justify-between">
                <span className="text-gray-500">Batch Number:</span>
                <span className="font-medium">{item.batchNumber}</span>
              </div>
            )}
            
            {item.expirationDate && (
              <div className="flex justify-between">
                <span className="text-gray-500">Expiry Date:</span>
                <span className={`font-medium ${
                  expiryStatus === 'expired' ? 'text-red-600' :
                  expiryStatus === 'expiring-soon' ? 'text-orange-600' :
                  expiryStatus === 'expiring-month' ? 'text-yellow-600' :
                  'text-black'
                }`}>
                  {new Date(item.expirationDate).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Stock Information */}
        <div className="bg-white rounded-md border border-gray-300 p-6">
          <h2 className="font-heading font-medium text-xl mb-4">Stock Information</h2>
          
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-500">Current Stock:</span>
                <span className="text-2xl font-heading font-medium">
                  {item.currentStock} {item.unit}
                </span>
              </div>
              
              <StockIndicator
                currentStock={item.currentStock}
                restockThreshold={item.restockThreshold}
                maxStock={item.maxStock}
                showLabel={false}
                showBar={true}
                className="mb-4"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500 text-sm">Restock Threshold</span>
                <p className="font-medium">{item.restockThreshold} {item.unit}</p>
              </div>
              
              {item.maxStock && (
                <div>
                  <span className="text-gray-500 text-sm">Maximum Stock</span>
                  <p className="font-medium">{item.maxStock} {item.unit}</p>
                </div>
              )}
            </div>
            
            <div className="pt-4 border-t border-gray-200">
              <span className="text-gray-500 text-sm">Stock Status</span>
              <div className="mt-1">
                <StockIndicator
                  currentStock={item.currentStock}
                  restockThreshold={item.restockThreshold}
                  maxStock={item.maxStock}
                  showLabel={true}
                  showBar={false}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Asset-specific information */}
      {item.type === 'asset' && (
        <div className="bg-white rounded-md border border-gray-300 p-6 mb-8">
          <h2 className="font-heading font-medium text-xl mb-4">Asset Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {item.serialNumber && (
              <div>
                <span className="text-gray-500 text-sm">Serial Number</span>
                <p className="font-medium">{item.serialNumber}</p>
              </div>
            )}
            
            {item.condition && (
              <div>
                <span className="text-gray-500 text-sm">Condition</span>
                <Badge variant={
                  item.condition === 'excellent' ? 'success' :
                  item.condition === 'good' ? 'default' :
                  item.condition === 'fair' ? 'warning' : 'error'
                }>
                  {item.condition.charAt(0).toUpperCase() + item.condition.slice(1)}
                </Badge>
              </div>
            )}
            
            {item.assignedTo && (
              <div>
                <span className="text-gray-500 text-sm">Assigned To</span>
                <p className="font-medium">{item.assignedTo}</p>
              </div>
            )}
            
            {item.assignedDepartment && (
              <div>
                <span className="text-gray-500 text-sm">Department</span>
                <p className="font-medium">{item.assignedDepartment}</p>
              </div>
            )}
            
            {item.purchaseDate && (
              <div>
                <span className="text-gray-500 text-sm">Purchase Date</span>
                <p className="font-medium">{new Date(item.purchaseDate).toLocaleDateString()}</p>
              </div>
            )}
            
            {item.warrantyExpiry && (
              <div>
                <span className="text-gray-500 text-sm">Warranty Expiry</span>
                <p className="font-medium">{new Date(item.warrantyExpiry).toLocaleDateString()}</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Transaction Manager Modal */}
      {showTransactionManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-md max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-heading font-medium">
                Transaction Management - {item.name}
              </h2>
              <Button
                variant="ghost"
                onClick={() => setShowTransactionManager(false)}
              >
                ×
              </Button>
            </div>
            <div className="p-6">
              <TransactionManager
                selectedItem={item}
                onClose={() => setShowTransactionManager(false)}
                onTransactionComplete={handleTransactionComplete}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}