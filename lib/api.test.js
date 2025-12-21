import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  APIError,
  fetchInventoryItems,
  fetchInventoryItem,
  updateInventoryItem,
  fetchPurchaseOrders,
  createPurchaseOrder,
  updatePurchaseOrder,
  fetchSuppliers,
  createSupplier,
  updateSupplier,
  fetchTransactions,
  createTransaction,
  updateStockLevel,
  fetchTransactionHistory,
  approveTransaction,
  fetchAudits,
  createAudit,
  updateAudit,
  fetchAdjustmentRequests,
  createAdjustmentRequest,
  updateAdjustmentRequest
} from './api'

// Mock fetch globally
global.fetch = vi.fn()

describe('API Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Set development environment for mock data
    process.env.NODE_ENV = 'development'
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('APIError', () => {
    it('should create APIError with message and status', () => {
      const error = new APIError('Test error', 404, { detail: 'Not found' })
      
      expect(error.name).toBe('APIError')
      expect(error.message).toBe('Test error')
      expect(error.status).toBe(404)
      expect(error.data).toEqual({ detail: 'Not found' })
    })
  })

  describe('Inventory Items API', () => {
    it('should fetch inventory items successfully', async () => {
      const items = await fetchInventoryItems()
      
      expect(Array.isArray(items)).toBe(true)
      expect(items.length).toBeGreaterThan(0)
      expect(items[0]).toHaveProperty('id')
      expect(items[0]).toHaveProperty('name')
      expect(items[0]).toHaveProperty('currentStock')
    })

    it('should filter inventory items by category', async () => {
      const items = await fetchInventoryItems({ category: 'menu-items' })
      
      expect(Array.isArray(items)).toBe(true)
      items.forEach(item => {
        expect(item.category).toBe('menu-items')
      })
    })

    it('should filter inventory items by location', async () => {
      const items = await fetchInventoryItems({ location: 'Kitchen Storage' })
      
      expect(Array.isArray(items)).toBe(true)
      items.forEach(item => {
        expect(item.location).toBe('Kitchen Storage')
      })
    })

    it('should filter low stock items', async () => {
      const items = await fetchInventoryItems({ lowStock: true })
      
      expect(Array.isArray(items)).toBe(true)
      items.forEach(item => {
        expect(item.currentStock).toBeLessThanOrEqual(item.restockThreshold)
      })
    })

    it('should search inventory items by name', async () => {
      const items = await fetchInventoryItems({ search: 'coffee' })
      
      expect(Array.isArray(items)).toBe(true)
      items.forEach(item => {
        expect(
          item.name.toLowerCase().includes('coffee') ||
          item.description.toLowerCase().includes('coffee')
        ).toBe(true)
      })
    })

    it('should fetch single inventory item', async () => {
      const item = await fetchInventoryItem('menu-001')
      
      expect(item).toBeDefined()
      expect(item.id).toBe('menu-001')
      expect(item).toHaveProperty('name')
      expect(item).toHaveProperty('currentStock')
    })

    it('should throw error for non-existent item', async () => {
      await expect(fetchInventoryItem('non-existent')).rejects.toThrow(APIError)
      await expect(fetchInventoryItem('non-existent')).rejects.toThrow('Item not found')
    })

    it('should update inventory item', async () => {
      const updates = { currentStock: 25, updatedBy: 'test-user' }
      const updatedItem = await updateInventoryItem('menu-001', updates)
      
      expect(updatedItem).toBeDefined()
      expect(updatedItem.currentStock).toBe(25)
      expect(updatedItem.updatedBy).toBe('test-user')
      expect(updatedItem.updatedAt).toBeInstanceOf(Date)
    })

    it('should throw error when updating non-existent item', async () => {
      await expect(updateInventoryItem('non-existent', {})).rejects.toThrow(APIError)
    })
  })

  describe('Purchase Orders API', () => {
    it('should fetch purchase orders successfully', async () => {
      const orders = await fetchPurchaseOrders()
      
      expect(Array.isArray(orders)).toBe(true)
      expect(orders.length).toBeGreaterThan(0)
      expect(orders[0]).toHaveProperty('id')
      expect(orders[0]).toHaveProperty('orderNumber')
      expect(orders[0]).toHaveProperty('status')
    })

    it('should filter purchase orders by status', async () => {
      const orders = await fetchPurchaseOrders({ status: 'pending' })
      
      expect(Array.isArray(orders)).toBe(true)
      orders.forEach(order => {
        expect(order.status).toBe('pending')
      })
    })

    it('should create purchase order', async () => {
      const orderData = {
        supplier: { id: 'supplier-001', name: 'Test Supplier' },
        items: [{ inventoryItemId: 'menu-001', quantity: 10, unitCost: 25.50 }],
        totalAmount: 255.00,
        requestedBy: 'test-user',
        expectedDelivery: new Date('2024-02-01')
      }
      
      const newOrder = await createPurchaseOrder(orderData)
      
      expect(newOrder).toBeDefined()
      expect(newOrder.id).toMatch(/^po-\d+$/)
      expect(newOrder.orderNumber).toMatch(/^PO-2024-\d{3}$/)
      expect(newOrder.status).toBe('pending')
      expect(newOrder.supplier.name).toBe('Test Supplier')
      expect(newOrder.totalAmount).toBe(255.00)
    })

    it('should update purchase order', async () => {
      const updates = { status: 'approved', approvedBy: 'test-approver' }
      const updatedOrder = await updatePurchaseOrder('po-001', updates)
      
      expect(updatedOrder).toBeDefined()
      expect(updatedOrder.status).toBe('approved')
      expect(updatedOrder.approvedBy).toBe('test-approver')
      expect(updatedOrder.updatedAt).toBeInstanceOf(Date)
    })
  })

  describe('Suppliers API', () => {
    it('should fetch suppliers successfully', async () => {
      const suppliers = await fetchSuppliers()
      
      expect(Array.isArray(suppliers)).toBe(true)
      expect(suppliers.length).toBeGreaterThan(0)
      expect(suppliers[0]).toHaveProperty('id')
      expect(suppliers[0]).toHaveProperty('name')
      expect(suppliers[0]).toHaveProperty('categories')
    })

    it('should filter suppliers by category', async () => {
      const suppliers = await fetchSuppliers({ category: 'menu-items' })
      
      expect(Array.isArray(suppliers)).toBe(true)
      suppliers.forEach(supplier => {
        expect(supplier.categories).toContain('menu-items')
      })
    })

    it('should filter suppliers by active status', async () => {
      const suppliers = await fetchSuppliers({ active: true })
      
      expect(Array.isArray(suppliers)).toBe(true)
      suppliers.forEach(supplier => {
        expect(supplier.isActive).toBe(true)
      })
    })

    it('should create supplier', async () => {
      const supplierData = {
        name: 'New Test Supplier',
        contactPerson: 'John Doe',
        email: 'john@test.com',
        phone: '+1-555-0123',
        categories: ['menu-items']
      }
      
      const newSupplier = await createSupplier(supplierData)
      
      expect(newSupplier).toBeDefined()
      expect(newSupplier.id).toMatch(/^supplier-\d+$/)
      expect(newSupplier.name).toBe('New Test Supplier')
      expect(newSupplier.isActive).toBe(false)
      expect(newSupplier.isApproved).toBe(false)
      expect(newSupplier.performanceMetrics.overallRating).toBe(0)
    })

    it('should update supplier', async () => {
      const updates = { isApproved: true, approvedBy: 'test-approver' }
      const updatedSupplier = await updateSupplier('supplier-001', updates)
      
      expect(updatedSupplier).toBeDefined()
      expect(updatedSupplier.isApproved).toBe(true)
      expect(updatedSupplier.approvedBy).toBe('test-approver')
    })
  })

  describe('Transactions API', () => {
    it('should fetch transactions successfully', async () => {
      const transactions = await fetchTransactions()
      
      expect(Array.isArray(transactions)).toBe(true)
      expect(transactions.length).toBeGreaterThan(0)
      expect(transactions[0]).toHaveProperty('id')
      expect(transactions[0]).toHaveProperty('type')
      expect(transactions[0]).toHaveProperty('quantity')
    })

    it('should filter transactions by item ID', async () => {
      const transactions = await fetchTransactions({ itemId: 'menu-001' })
      
      expect(Array.isArray(transactions)).toBe(true)
      transactions.forEach(txn => {
        expect(txn.itemId).toBe('menu-001')
      })
    })

    it('should filter transactions by type', async () => {
      const transactions = await fetchTransactions({ type: 'stock-out' })
      
      expect(Array.isArray(transactions)).toBe(true)
      transactions.forEach(txn => {
        expect(txn.type).toBe('stock-out')
      })
    })

    it('should create transaction', async () => {
      const transactionData = {
        itemId: 'menu-001',
        type: 'stock-in',
        quantity: 10,
        previousStock: 15,
        newStock: 25,
        reason: 'Test restock',
        performedBy: 'test-user'
      }
      
      const newTransaction = await createTransaction(transactionData)
      
      expect(newTransaction).toBeDefined()
      expect(newTransaction.id).toMatch(/^txn-\d+$/)
      expect(newTransaction.type).toBe('stock-in')
      expect(newTransaction.quantity).toBe(10)
      expect(newTransaction.createdAt).toBeInstanceOf(Date)
    })

    it('should update stock level', async () => {
      const transaction = {
        type: 'stock-adjustment',
        quantity: 5,
        previousStock: 20,
        newStock: 25,
        reason: 'Inventory adjustment',
        performedBy: 'test-user'
      }
      
      const result = await updateStockLevel('menu-001', transaction)
      
      expect(result).toBeDefined()
      expect(result.itemId).toBe('menu-001')
      expect(result.type).toBe('stock-adjustment')
    })

    it('should fetch transaction history for item', async () => {
      const history = await fetchTransactionHistory('menu-001')
      
      expect(Array.isArray(history)).toBe(true)
      history.forEach(txn => {
        expect(txn.itemId).toBe('menu-001')
      })
    })

    it('should approve transaction', async () => {
      const approvedTransaction = await approveTransaction('txn-001', 'test-approver')
      
      expect(approvedTransaction).toBeDefined()
      expect(approvedTransaction.status).toBe('approved')
      expect(approvedTransaction.approvedBy).toBe('test-approver')
      expect(approvedTransaction.approvedAt).toBeInstanceOf(Date)
    })
  })

  describe('Audits API', () => {
    it('should fetch audits successfully', async () => {
      const audits = await fetchAudits()
      
      expect(Array.isArray(audits)).toBe(true)
      expect(audits.length).toBeGreaterThan(0)
      expect(audits[0]).toHaveProperty('id')
      expect(audits[0]).toHaveProperty('auditNumber')
      expect(audits[0]).toHaveProperty('status')
    })

    it('should filter audits by status', async () => {
      const audits = await fetchAudits({ status: 'in-progress' })
      
      expect(Array.isArray(audits)).toBe(true)
      audits.forEach(audit => {
        expect(audit.status).toBe('in-progress')
      })
    })

    it('should create audit', async () => {
      const auditData = {
        auditType: 'scheduled',
        auditDate: new Date('2024-02-01'),
        performedBy: 'test-auditor',
        scope: {
          categories: ['menu-items'],
          locations: ['Kitchen Storage'],
          includeAssets: false,
          samplingPercentage: 100
        },
        notes: 'Test audit'
      }
      
      const newAudit = await createAudit(auditData)
      
      expect(newAudit).toBeDefined()
      expect(newAudit.id).toMatch(/^audit-\d+$/)
      expect(newAudit.auditNumber).toMatch(/^AUD-2024-\d{3}$/)
      expect(newAudit.status).toBe('in-progress')
      expect(newAudit.auditType).toBe('scheduled')
    })

    it('should update audit', async () => {
      const updates = { status: 'completed', complianceScore: 95 }
      const updatedAudit = await updateAudit('audit-001', updates)
      
      expect(updatedAudit).toBeDefined()
      expect(updatedAudit.status).toBe('completed')
      expect(updatedAudit.complianceScore).toBe(95)
    })
  })

  describe('Adjustment Requests API', () => {
    it('should fetch adjustment requests successfully', async () => {
      const requests = await fetchAdjustmentRequests()
      
      expect(Array.isArray(requests)).toBe(true)
      expect(requests.length).toBeGreaterThan(0)
      expect(requests[0]).toHaveProperty('id')
      expect(requests[0]).toHaveProperty('requestType')
      expect(requests[0]).toHaveProperty('status')
    })

    it('should filter adjustment requests by status', async () => {
      const requests = await fetchAdjustmentRequests({ status: 'pending' })
      
      expect(Array.isArray(requests)).toBe(true)
      requests.forEach(request => {
        expect(request.status).toBe('pending')
      })
    })

    it('should create adjustment request', async () => {
      const requestData = {
        itemId: 'menu-001',
        itemName: 'Test Item',
        requestType: 'stock-adjustment',
        currentStock: 15,
        proposedStock: 20,
        variance: 5,
        reason: 'Test adjustment',
        priority: 'normal',
        requestedBy: 'test-user'
      }
      
      const newRequest = await createAdjustmentRequest(requestData)
      
      expect(newRequest).toBeDefined()
      expect(newRequest.id).toMatch(/^adj-\d+$/)
      expect(newRequest.status).toBe('pending')
      expect(newRequest.requestType).toBe('stock-adjustment')
      expect(newRequest.variance).toBe(5)
    })

    it('should update adjustment request', async () => {
      const updates = { status: 'approved', approvedBy: 'test-approver' }
      const updatedRequest = await updateAdjustmentRequest('adj-001', updates)
      
      expect(updatedRequest).toBeDefined()
      expect(updatedRequest.status).toBe('approved')
      expect(updatedRequest.approvedBy).toBe('test-approver')
    })
  })

  describe('Error Handling', () => {
    it('should handle HTTP errors', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({ message: 'Resource not found' })
      })
      
      process.env.NODE_ENV = 'production'
      
      await expect(fetchInventoryItems()).rejects.toThrow(APIError)
      await expect(fetchInventoryItems()).rejects.toThrow('Resource not found')
    })

    it('should handle malformed JSON responses', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.reject(new Error('Invalid JSON'))
      })
      
      process.env.NODE_ENV = 'production'
      
      await expect(fetchInventoryItems()).rejects.toThrow(APIError)
    }, 10000) // 10 second timeout for this test

    it('should retry on server errors', async () => {
      let callCount = 0
      global.fetch.mockImplementation(() => {
        callCount++
        if (callCount < 3) {
          return Promise.resolve({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
            json: () => Promise.resolve({ message: 'Server error' })
          })
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        })
      })
      
      process.env.NODE_ENV = 'production'
      
      const result = await fetchInventoryItems()
      expect(result).toEqual([])
      expect(callCount).toBe(3)
    })

    it('should not retry on client errors', async () => {
      let callCount = 0
      global.fetch.mockImplementation(() => {
        callCount++
        return Promise.resolve({
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          json: () => Promise.resolve({ message: 'Invalid request' })
        })
      })
      
      process.env.NODE_ENV = 'production'
      
      await expect(fetchInventoryItems()).rejects.toThrow(APIError)
      expect(callCount).toBe(1) // Should not retry
    })
  })

  describe('Data Transformation and Validation', () => {
    it('should validate required fields in inventory items', async () => {
      const items = await fetchInventoryItems()
      
      items.forEach(item => {
        expect(item).toHaveProperty('id')
        expect(item).toHaveProperty('name')
        expect(item).toHaveProperty('category')
        expect(item).toHaveProperty('currentStock')
        expect(item).toHaveProperty('unit')
        expect(typeof item.currentStock).toBe('number')
        expect(item.currentStock).toBeGreaterThanOrEqual(0)
      })
    })

    it('should validate purchase order structure', async () => {
      const orders = await fetchPurchaseOrders()
      
      orders.forEach(order => {
        expect(order).toHaveProperty('id')
        expect(order).toHaveProperty('orderNumber')
        expect(order).toHaveProperty('supplier')
        expect(order).toHaveProperty('items')
        expect(order).toHaveProperty('status')
        expect(order).toHaveProperty('totalAmount')
        expect(Array.isArray(order.items)).toBe(true)
        expect(typeof order.totalAmount).toBe('number')
        expect(order.totalAmount).toBeGreaterThan(0)
      })
    })

    it('should validate transaction data integrity', async () => {
      const transactions = await fetchTransactions()
      
      transactions.forEach(txn => {
        expect(txn).toHaveProperty('id')
        expect(txn).toHaveProperty('itemId')
        expect(txn).toHaveProperty('type')
        expect(txn).toHaveProperty('quantity')
        expect(txn).toHaveProperty('createdAt')
        expect(['stock-in', 'stock-out', 'stock-adjustment']).toContain(txn.type)
        expect(typeof txn.quantity).toBe('number')
        expect(txn.quantity).toBeGreaterThan(0)
      })
    })
  })
})