import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import RestockForm from './RestockForm'
import InventoryTable from './InventoryTable'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import AlertBanner from './AlertBanner'
import { mockTransactions, mockInventoryItems } from '../../lib/mockData'

export default function TransactionManager({ 
  selectedItem = null, 
  onClose = () => {},
  onTransactionComplete = () => {} 
}) {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState(mockTransactions)
  const [showTransactionForm, setShowTransactionForm] = useState(false)
  const [transactionType, setTransactionType] = useState('stock-in')
  const [currentItem, setCurrentItem] = useState(selectedItem)
  const [alerts, setAlerts] = useState([])
  const [pendingApprovals, setPendingApprovals] = useState([])

  useEffect(() => {
    setCurrentItem(selectedItem)
  }, [selectedItem])

  // Mock suppliers for the form
  const suppliers = [
    { label: 'Coffee Roasters Ltd', value: 'coffee-roasters-ltd' },
    { label: 'Ocean Fresh Seafood', value: 'ocean-fresh-seafood' },
    { label: 'Green Valley Farms', value: 'green-valley-farms' },
    { label: 'Premium Meats Co', value: 'premium-meats-co' },
    { label: 'Hotel Amenities Co', value: 'hotel-amenities-co' },
    { label: 'CleanPro Solutions', value: 'cleanpro-solutions' }
  ]

  const processTransaction = (transactionData) => {
    if (!user) {
      setAlerts([{
        type: 'error',
        message: 'User authentication required to process transactions',
        items: []
      }])
      return
    }

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
      batchNumber: transactionData.batchNumber || null,
      expirationDate: transactionData.expirationDate || null,
      destination: transactionData.destination || null,
      performedBy: user.id,
      performedByName: user.name,
      performedByRole: user.role,
      createdAt: new Date(),
      approved: requiresApproval(transactionData) ? false : true,
      approvedBy: requiresApproval(transactionData) ? null : user.id
    }

    // Add to transactions list
    setTransactions(prev => [transaction, ...prev])

    // Update item stock level
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
    { key: 'type', label: 'Type', render: (value) => value.replace('-', ' ').toUpperCase() },
    { key: 'quantity', label: 'Quantity' },
    { key: 'previousStock', label: 'Previous Stock' },
    { key: 'newStock', label: 'New Stock' },
    { key: 'performedByName', label: 'Performed By' },
    { key: 'reason', label: 'Reason' },
    { key: 'approved', label: 'Status', render: (value) => value ? 'Approved' : 'Pending' }
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