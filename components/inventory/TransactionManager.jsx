import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import RestockForm from './RestockForm'
import InventoryTable from './InventoryTable'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import AlertBanner from './AlertBanner'
import inventoryApi from '../../lib/inventoryApi'

export default function TransactionManager({
  selectedItem = null,
  onClose = () => { },
  onTransactionComplete = () => { }
}) {
  const [transactions, setTransactions] = useState([])
  const [showTransactionForm, setShowTransactionForm] = useState(false)
  const [transactionType, setTransactionType] = useState('stock-in')
  const [currentItem, setCurrentItem] = useState(selectedItem)
  const [alerts, setAlerts] = useState([])
  const [pendingApprovals, setPendingApprovals] = useState([])

  useEffect(() => {
    setCurrentItem(selectedItem)
    if (selectedItem?.id) {
      loadTransactions(selectedItem.id)
    }
  }, [selectedItem])

  const loadTransactions = async (itemId) => {
    try {
      const data = await inventoryApi.getTransactions(itemId)
      setTransactions(data)
    } catch (error) {
      console.error('Error loading transactions:', error)
    }
  }

  // Mock suppliers for the form
  const suppliers = [
    { label: 'Coffee Roasters Ltd', value: 'coffee-roasters-ltd' },
    { label: 'Ocean Fresh Seafood', value: 'ocean-fresh-seafood' },
    { label: 'Green Valley Farms', value: 'green-valley-farms' },
    { label: 'Premium Meats Co', value: 'premium-meats-co' },
    { label: 'Hotel Amenities Co', value: 'hotel-amenities-co' },
    { label: 'CleanPro Solutions', value: 'cleanpro-solutions' }
  ]

  const processTransaction = async (transactionData) => {
    if (!user) {
      setAlerts([{
        type: 'error',
        message: 'User authentication required to process transactions',
        items: []
      }])
      return
    }

    try {
      // Create transaction record
      const transaction = {
        id: `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        itemId: transactionData.itemId,
        itemName: transactionData.itemName,
        type: transactionData.type,
        quantity: transactionData.quantity,
        previousStock: currentItem?.currentStock || 0,
        newStock: calculateNewStock(transactionData),
        reason: transactionData.reason || '',
        supplier: transactionData.supplier || null,
        destination: transactionData.destination || null,
        performedBy: user.id,
        performedByName: user.name || user.email,
        performedByRole: user.role,
        createdAt: new Date().toISOString(),
        approved: requiresApproval(transactionData) ? false : true,
        approvedBy: requiresApproval(transactionData) ? null : user.id,
        approvedByName: requiresApproval(transactionData) ? null : (user.name || user.email)
      }

      // Save transaction to Firebase
      const firebaseDB = (await import('../../lib/firebase')).default
      await firebaseDB.create(`inventory_transactions/${transactionData.itemId}`, transaction)

      // Update item stock in Firebase
      await inventoryApi.update(transactionData.itemId, {
        currentStock: transaction.newStock,
        updatedAt: new Date().toISOString(),
        updatedBy: user.id
      })

      // Add to local transactions list
      setTransactions(prev => [transaction, ...prev])

      // Update local item state
      if (currentItem) {
        const updatedItem = {
          ...currentItem,
          currentStock: transaction.newStock,
          updatedAt: new Date(),
          updatedBy: user.id
        }
        setCurrentItem(updatedItem)
      }

      // Generate alerts based on new stock level
      generateStockAlerts(transaction)

      // Handle approval workflow
      if (requiresApproval(transactionData)) {
        setPendingApprovals(prev => [...prev, transaction])
        setAlerts(prev => [...prev, {
          type: 'info',
          message: 'Transaction submitted for approval',
          items: [{ name: transactionData.itemName, id: transactionData.itemId }]
        }])
      } else {
        setAlerts(prev => [...prev, {
          type: 'success',
          message: `${transactionData.type} transaction completed successfully`,
          items: [{ name: transactionData.itemName, id: transactionData.itemId }]
        }])
      }

      // Close form and notify parent
      setShowTransactionForm(false)
      onTransactionComplete(transaction)
    } catch (error) {
      console.error('Error processing transaction:', error)
      setAlerts(prev => [...prev, {
        type: 'error',
        message: `Failed to process transaction: ${error.message}`,
        items: []
      }])
    }
  }

  const calculateNewStock = (transactionData) => {
    const previousStock = currentItem?.currentStock || 0

    switch (transactionData.type) {
      case 'stock-in':
        return previousStock + transactionData.quantity
      case 'stock-out':
        return Math.max(0, previousStock - transactionData.quantity)
      case 'adjustment':
        return transactionData.quantity
      default:
        return previousStock
    }
  }

  const requiresApproval = (transactionData) => {
    // Inventory Controllers can approve their own transactions
    if (user?.role === 'inventory-controller') {
      return false
    }

    // Large adjustments require approval
    if (transactionData.type === 'adjustment' && transactionData.quantity > 100) {
      return true
    }

    // High-value transactions require approval
    if (currentItem?.cost && transactionData.quantity * currentItem.cost > 1000) {
      return true
    }

    return false
  }

  const generateStockAlerts = (transaction) => {
    if (!currentItem) return

    const newStock = transaction.newStock
    const restockThreshold = currentItem.restockThreshold || 0
    const maxStock = currentItem.maxStock

    // Critical stock alert
    if (newStock === 0) {
      setAlerts(prev => [...prev, {
        type: 'critical-stock',
        message: 'Critical stock level reached',
        items: [{
          name: currentItem.name,
          id: currentItem.id,
          currentStock: newStock
        }]
      }])
    }
    // Low stock alert
    else if (newStock <= restockThreshold) {
      setAlerts(prev => [...prev, {
        type: 'low-stock',
        message: 'Low stock level detected',
        items: [{
          name: currentItem.name,
          id: currentItem.id,
          currentStock: newStock
        }]
      }])
    }
    // Excess stock alert
    else if (maxStock && newStock > maxStock) {
      setAlerts(prev => [...prev, {
        type: 'excess-stock',
        message: 'Excess stock level detected',
        items: [{
          name: currentItem.name,
          id: currentItem.id,
          currentStock: newStock
        }]
      }])
    }
  }

  const approveTransaction = (transactionId) => {
    if (user?.role !== 'inventory-controller') {
      setAlerts(prev => [...prev, {
        type: 'error',
        message: 'Only Inventory Controllers can approve transactions',
        items: []
      }])
      return
    }

    setTransactions(prev => prev.map(txn =>
      txn.id === transactionId
        ? { ...txn, approved: true, approvedBy: user.id, approvedAt: new Date() }
        : txn
    ))

    setPendingApprovals(prev => prev.filter(txn => txn.id !== transactionId))

    setAlerts(prev => [...prev, {
      type: 'success',
      message: 'Transaction approved successfully',
      items: []
    }])
  }

  const getTransactionColumns = () => [
    { key: 'createdAt', label: 'Date', render: (value) => new Date(value).toLocaleDateString() },
    { 
      key: 'type', 
      label: 'Type', 
      render: (value, row) => {
        if (value === 'bundle-consumption') {
          return (
            <div className="flex flex-col">
              <span className="font-semibold text-purple-700">Bundle Consumption</span>
              {row.bundleName && (
                <span className="text-xs text-gray-500">{row.bundleName}</span>
              )}
            </div>
          )
        }
        if (value === 'adjustment') {
          return (
            <div className="flex flex-col">
              <span className="font-semibold text-orange-700">Stock Adjustment</span>
              {row.reason && (
                <span className="text-xs text-gray-500">{row.reason}</span>
              )}
            </div>
          )
        }
        return (
          <span className="font-semibold capitalize">
            {value.replace('-', ' ')}
          </span>
        )
      }
    },
    { 
      key: 'quantity', 
      label: 'Quantity',
      render: (value, row) => {
        const isConsumption = row.type === 'bundle-consumption'
        const isAdjustment = row.type === 'adjustment'
        const isStockOut = row.type === 'stock-out'
        
        if (isAdjustment) {
          const change = value - row.previousStock
          return (
            <div className="flex flex-col">
              <span className={`font-semibold ${change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                {change > 0 ? '+' : ''}{change}
              </span>
              <span className="text-xs text-gray-500">New: {value}</span>
            </div>
          )
        }
        
        return (
          <span className={`font-semibold ${isConsumption || isStockOut ? 'text-red-600' : 'text-green-600'}`}>
            {value > 0 ? '+' : ''}{value}
          </span>
        )
      }
    },
    { key: 'previousStock', label: 'Previous Stock' },
    { 
      key: 'newStock', 
      label: 'New Stock',
      render: (value, row) => {
        const change = value - row.previousStock
        return (
          <div className="flex items-center space-x-2">
            <span className="font-semibold">{value}</span>
            {change !== 0 && (
              <span className={`text-xs ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                ({change > 0 ? '+' : ''}{change})
              </span>
            )}
          </div>
        )
      }
    },
    { 
      key: 'performedByName', 
      label: 'Performed By',
      render: (value, row) => {
        if (row.type === 'bundle-consumption') {
          return (
            <div className="flex flex-col">
              <span className="font-medium">{value}</span>
              {row.roomId && (
                <span className="text-xs text-gray-500">Room {row.roomId}</span>
              )}
            </div>
          )
        }
        if (row.type === 'adjustment') {
          return (
            <div className="flex flex-col">
              <span className="font-medium">{value}</span>
              <span className="text-xs text-orange-600">Adjusted Stock</span>
            </div>
          )
        }
        return (
          <div className="flex flex-col">
            <span className="font-medium">{value}</span>
            {row.performedByRole && (
              <span className="text-xs text-gray-500 capitalize">{row.performedByRole}</span>
            )}
          </div>
        )
      }
    },
    { 
      key: 'reason', 
      label: 'Reason',
      render: (value, row) => {
        if (row.type === 'bundle-consumption') {
          return (
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span>{value}</span>
            </div>
          )
        }
        if (row.type === 'adjustment') {
          return (
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <span className="text-sm">{value || 'Manual adjustment'}</span>
            </div>
          )
        }
        return value || '-'
      }
    },
    { 
      key: 'approved', 
      label: 'Status', 
      render: (value, row) => {
        if (row.type === 'bundle-consumption') {
          return (
            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded">
              Auto-Approved
            </span>
          )
        }
        if (row.type === 'adjustment') {
          return (
            <div className="flex flex-col">
              <span className={`px-2 py-1 text-xs font-semibold rounded ${
                value ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {value ? 'Approved' : 'Pending'}
              </span>
              {value && row.approvedByName && (
                <span className="text-xs text-gray-500 mt-1">by {row.approvedByName}</span>
              )}
            </div>
          )
        }
        return value ? 'Approved' : 'Pending'
      }
    }
  ]

  const getItemTransactions = () => {
    if (!currentItem) return []
    return transactions.filter(txn => txn.itemId === currentItem.id)
  }

  const dismissAlert = (index) => {
    setAlerts(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="transaction-manager space-y-6">
      {/* Alerts */}
      {alerts.map((alert, index) => (
        <AlertBanner
          key={index}
          type={alert.type}
          message={alert.message}
          items={alert.items}
          onAcknowledge={() => dismissAlert(index)}
          dismissible={true}
        />
      ))}

      {/* Current Item Info */}
      {currentItem && (
        <div className="bg-white border border-gray-300 rounded-md p-4">
          <h3 className="text-lg font-heading font-medium text-black mb-2">
            {currentItem.name}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Current Stock:</span>
              <span className="ml-2 font-medium">{currentItem.currentStock} {currentItem.unit}</span>
            </div>
            <div>
              <span className="text-gray-500">Restock Threshold:</span>
              <span className="ml-2 font-medium">{currentItem.restockThreshold} {currentItem.unit}</span>
            </div>
            <div>
              <span className="text-gray-500">Location:</span>
              <span className="ml-2 font-medium">{currentItem.location}</span>
            </div>
            <div>
              <span className="text-gray-500">Category:</span>
              <span className="ml-2 font-medium">{currentItem.category}</span>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Actions */}
      <div className="flex flex-wrap gap-3">
        <Button
          variant="primary"
          onClick={() => {
            setTransactionType('stock-in')
            setShowTransactionForm(true)
          }}
        >
          Stock In
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            setTransactionType('stock-out')
            setShowTransactionForm(true)
          }}
        >
          Stock Out
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            setTransactionType('adjustment')
            setShowTransactionForm(true)
          }}
        >
          Adjustment
        </Button>
      </div>

      {/* Pending Approvals (for Inventory Controllers) */}
      {user?.role === 'inventory-controller' && pendingApprovals.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-md p-4">
          <h4 className="font-heading font-medium text-black mb-3">
            Pending Approvals ({pendingApprovals.length})
          </h4>
          <div className="space-y-2">
            {pendingApprovals.map(txn => (
              <div key={txn.id} className="flex justify-between items-center bg-white p-3 rounded border">
                <div>
                  <span className="font-medium">{txn.itemName}</span>
                  <span className="text-gray-500 ml-2">
                    {txn.type} - {txn.quantity} units
                  </span>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => approveTransaction(txn.id)}
                >
                  Approve
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div>
        <h4 className="text-lg font-heading font-medium text-black mb-4">
          Transaction History
        </h4>
        <InventoryTable
          data={getItemTransactions()}
          columns={getTransactionColumns()}
          emptyMessage="No transactions found for this item"
        />
      </div>

      {/* Transaction Form Modal */}
      <Modal
        isOpen={showTransactionForm}
        onClose={() => setShowTransactionForm(false)}
        title={`${transactionType.replace('-', ' ').toUpperCase()} Transaction`}
        size="lg"
      >
        <RestockForm
          item={currentItem}
          transactionType={transactionType}
          suppliers={suppliers}
          onSubmit={processTransaction}
          onCancel={() => setShowTransactionForm(false)}
        />
      </Modal>
    </div>
  )
}