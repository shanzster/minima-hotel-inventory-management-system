// API client functions for inventory management
import { mockInventoryItems, mockPurchaseOrders, mockSuppliers, mockTransactions, mockAudits, mockAdjustmentRequests } from './mockData.js'

// Base API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api'
const DEFAULT_TIMEOUT = 10000 // 10 seconds

// API error class
export class APIError extends Error {
  constructor(message, status, data = null) {
    super(message)
    this.name = 'APIError'
    this.status = status
    this.data = data
  }
}

// Generic API request function with error handling and retry logic
async function apiRequest(endpoint, options = {}) {
  const {
    method = 'GET',
    body = null,
    headers = {},
    timeout = DEFAULT_TIMEOUT,
    retries = 3,
    retryDelay = 1000
  } = options

  const url = `${API_BASE_URL}${endpoint}`
  const requestOptions = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    ...(body && { body: JSON.stringify(body) })
  }

  let lastError = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), timeout)
      )

      // Make the request with timeout
      const response = await Promise.race([
        fetch(url, requestOptions),
        timeoutPromise
      ])

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new APIError(
          errorData?.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData
        )
      }

      const data = await response.json()
      return data
    } catch (error) {
      lastError = error

      // Don't retry on client errors (4xx) or the last attempt
      if (error.status >= 400 && error.status < 500 || attempt === retries) {
        throw error
      }

      // Wait before retrying
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)))
      }
    }
  }

  throw lastError
}

// Mock API simulation for development
const MOCK_DELAY = 100 // Reduced delay for tests
const MOCK_ERROR_RATE = 0 // Disable random errors for tests

function simulateNetworkDelay() {
  return new Promise(resolve => setTimeout(resolve, MOCK_DELAY))
}

function simulateRandomError() {
  // Only simulate errors in production or when explicitly testing error scenarios
  if (process.env.NODE_ENV === 'production' && Math.random() < MOCK_ERROR_RATE) {
    throw new APIError('Simulated network error', 500)
  }
}

// Inventory Items API
export async function fetchInventoryItems(filters = {}) {
  try {
    // In development, use mock data
    if (process.env.NODE_ENV === 'development') {
      await simulateNetworkDelay()
      simulateRandomError()

      let items = [...mockInventoryItems]

      // Apply filters
      if (filters.category) {
        items = items.filter(item => item.category === filters.category)
      }
      if (filters.location) {
        items = items.filter(item => item.location === filters.location)
      }
      if (filters.lowStock) {
        items = items.filter(item => item.currentStock <= item.restockThreshold)
      }
      if (filters.search) {
        const query = filters.search.toLowerCase()
        items = items.filter(item =>
          item.name.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query)
        )
      }

      return items
    }

    // Production API call
    const queryParams = new URLSearchParams(filters).toString()
    return await apiRequest(`/inventory${queryParams ? `?${queryParams}` : ''}`)
  } catch (error) {
    console.error('Failed to fetch inventory items:', error)
    throw error
  }
}

export async function fetchInventoryItem(itemId) {
  try {
    if (process.env.NODE_ENV === 'development') {
      await simulateNetworkDelay()
      simulateRandomError()

      const item = mockInventoryItems.find(item => item.id === itemId)
      if (!item) {
        throw new APIError('Item not found', 404)
      }
      return item
    }

    return await apiRequest(`/inventory/${itemId}`)
  } catch (error) {
    console.error(`Failed to fetch inventory item ${itemId}:`, error)
    throw error
  }
}

export async function updateInventoryItem(itemId, updates) {
  try {
    if (process.env.NODE_ENV === 'development') {
      await simulateNetworkDelay()
      simulateRandomError()

      const itemIndex = mockInventoryItems.findIndex(item => item.id === itemId)
      if (itemIndex === -1) {
        throw new APIError('Item not found', 404)
      }

      mockInventoryItems[itemIndex] = {
        ...mockInventoryItems[itemIndex],
        ...updates,
        updatedAt: new Date()
      }

      return mockInventoryItems[itemIndex]
    }

    return await apiRequest(`/inventory/${itemId}`, {
      method: 'PUT',
      body: updates
    })
  } catch (error) {
    console.error(`Failed to update inventory item ${itemId}:`, error)
    throw error
  }
}

// Purchase Orders API
export async function fetchPurchaseOrders(filters = {}) {
  try {
    if (process.env.NODE_ENV === 'development') {
      await simulateNetworkDelay()
      simulateRandomError()

      let orders = [...mockPurchaseOrders]

      if (filters.status) {
        orders = orders.filter(order => order.status === filters.status)
      }
      if (filters.supplier) {
        orders = orders.filter(order => order.supplier.id === filters.supplier)
      }

      return orders
    }

    const queryParams = new URLSearchParams(filters).toString()
    return await apiRequest(`/purchase-orders${queryParams ? `?${queryParams}` : ''}`)
  } catch (error) {
    console.error('Failed to fetch purchase orders:', error)
    throw error
  }
}

export async function createPurchaseOrder(orderData) {
  try {
    if (process.env.NODE_ENV === 'development') {
      await simulateNetworkDelay()
      simulateRandomError()

      const newOrder = {
        id: `po-${Date.now()}`,
        orderNumber: `PO-2024-${String(mockPurchaseOrders.length + 1).padStart(3, '0')}`,
        ...orderData,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockPurchaseOrders.unshift(newOrder)
      return newOrder
    }

    return await apiRequest('/purchase-orders', {
      method: 'POST',
      body: orderData
    })
  } catch (error) {
    console.error('Failed to create purchase order:', error)
    throw error
  }
}

export async function updatePurchaseOrder(orderId, updates) {
  try {
    if (process.env.NODE_ENV === 'development') {
      await simulateNetworkDelay()
      simulateRandomError()

      const orderIndex = mockPurchaseOrders.findIndex(order => order.id === orderId)
      if (orderIndex === -1) {
        throw new APIError('Purchase order not found', 404)
      }

      mockPurchaseOrders[orderIndex] = {
        ...mockPurchaseOrders[orderIndex],
        ...updates,
        updatedAt: new Date()
      }

      return mockPurchaseOrders[orderIndex]
    }

    return await apiRequest(`/purchase-orders/${orderId}`, {
      method: 'PUT',
      body: updates
    })
  } catch (error) {
    console.error(`Failed to update purchase order ${orderId}:`, error)
    throw error
  }
}

// Suppliers API
export async function fetchSuppliers(filters = {}) {
  try {
    if (process.env.NODE_ENV === 'development') {
      await simulateNetworkDelay()
      simulateRandomError()

      let suppliers = [...mockSuppliers]

      if (filters.category) {
        suppliers = suppliers.filter(supplier =>
          supplier.categories.includes(filters.category)
        )
      }
      if (filters.active !== undefined) {
        suppliers = suppliers.filter(supplier => supplier.isActive === filters.active)
      }
      if (filters.approved !== undefined) {
        suppliers = suppliers.filter(supplier => supplier.isApproved === filters.approved)
      }

      return suppliers
    }

    const queryParams = new URLSearchParams(filters).toString()
    return await apiRequest(`/suppliers${queryParams ? `?${queryParams}` : ''}`)
  } catch (error) {
    console.error('Failed to fetch suppliers:', error)
    throw error
  }
}

export async function createSupplier(supplierData) {
  try {
    if (process.env.NODE_ENV === 'development') {
      await simulateNetworkDelay()
      simulateRandomError()

      const newSupplier = {
        id: `supplier-${Date.now()}`,
        ...supplierData,
        isActive: false,
        isApproved: false,
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
        createdAt: new Date()
      }

      mockSuppliers.push(newSupplier)
      return newSupplier
    }

    return await apiRequest('/suppliers', {
      method: 'POST',
      body: supplierData
    })
  } catch (error) {
    console.error('Failed to create supplier:', error)
    throw error
  }
}

export async function updateSupplier(supplierId, updates) {
  try {
    if (process.env.NODE_ENV === 'development') {
      await simulateNetworkDelay()
      simulateRandomError()

      const supplierIndex = mockSuppliers.findIndex(supplier => supplier.id === supplierId)
      if (supplierIndex === -1) {
        throw new APIError('Supplier not found', 404)
      }

      mockSuppliers[supplierIndex] = {
        ...mockSuppliers[supplierIndex],
        ...updates,
        updatedAt: new Date()
      }

      return mockSuppliers[supplierIndex]
    }

    return await apiRequest(`/suppliers/${supplierId}`, {
      method: 'PUT',
      body: updates
    })
  } catch (error) {
    console.error(`Failed to update supplier ${supplierId}:`, error)
    throw error
  }
}

// Transactions API
export async function fetchTransactions(filters = {}) {
  try {
    if (process.env.NODE_ENV === 'development') {
      await simulateNetworkDelay()
      simulateRandomError()

      let transactions = [...mockTransactions]

      if (filters.itemId) {
        transactions = transactions.filter(txn => txn.itemId === filters.itemId)
      }
      if (filters.type) {
        transactions = transactions.filter(txn => txn.type === filters.type)
      }
      if (filters.dateFrom) {
        transactions = transactions.filter(txn =>
          new Date(txn.createdAt) >= new Date(filters.dateFrom)
        )
      }
      if (filters.dateTo) {
        transactions = transactions.filter(txn =>
          new Date(txn.createdAt) <= new Date(filters.dateTo)
        )
      }

      return transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    }

    const queryParams = new URLSearchParams(filters).toString()
    return await apiRequest(`/transactions${queryParams ? `?${queryParams}` : ''}`)
  } catch (error) {
    console.error('Failed to fetch transactions:', error)
    throw error
  }
}

export async function createTransaction(transactionData) {
  try {
    if (process.env.NODE_ENV === 'development') {
      await simulateNetworkDelay()
      simulateRandomError()

      const newTransaction = {
        id: `txn-${Date.now()}`,
        ...transactionData,
        createdAt: new Date()
      }

      mockTransactions.unshift(newTransaction)

      // Update inventory item stock level
      const itemIndex = mockInventoryItems.findIndex(item => item.id === transactionData.itemId)
      if (itemIndex !== -1) {
        mockInventoryItems[itemIndex].currentStock = transactionData.newStock
        mockInventoryItems[itemIndex].updatedAt = new Date()
        mockInventoryItems[itemIndex].updatedBy = transactionData.performedBy
      }

      return newTransaction
    }

    return await apiRequest('/transactions', {
      method: 'POST',
      body: transactionData
    })
  } catch (error) {
    console.error('Failed to create transaction:', error)
    throw error
  }
}

export async function updateStockLevel(itemId, transaction) {
  try {
    const transactionData = {
      itemId,
      ...transaction,
      createdAt: new Date()
    }

    return await createTransaction(transactionData)
  } catch (error) {
    console.error(`Failed to update stock level for item ${itemId}:`, error)
    throw error
  }
}

export async function fetchTransactionHistory(itemId) {
  try {
    return await fetchTransactions({ itemId })
  } catch (error) {
    console.error(`Failed to fetch transaction history for item ${itemId}:`, error)
    throw error
  }
}

export async function approveTransaction(transactionId, approverId) {
  try {
    if (process.env.NODE_ENV === 'development') {
      await simulateNetworkDelay()
      simulateRandomError()

      const transactionIndex = mockTransactions.findIndex(txn => txn.id === transactionId)
      if (transactionIndex === -1) {
        throw new APIError('Transaction not found', 404)
      }

      mockTransactions[transactionIndex] = {
        ...mockTransactions[transactionIndex],
        status: 'approved',
        approvedBy: approverId,
        approvedAt: new Date()
      }

      return mockTransactions[transactionIndex]
    }

    return await apiRequest(`/transactions/${transactionId}/approve`, {
      method: 'POST',
      body: { approverId }
    })
  } catch (error) {
    console.error(`Failed to approve transaction ${transactionId}:`, error)
    throw error
  }
}

// Audits API
export async function fetchAudits(filters = {}) {
  try {
    if (process.env.NODE_ENV === 'development') {
      await simulateNetworkDelay()
      simulateRandomError()

      let audits = [...mockAudits]

      if (filters.status) {
        audits = audits.filter(audit => audit.status === filters.status)
      }
      if (filters.type) {
        audits = audits.filter(audit => audit.auditType === filters.type)
      }

      return audits.sort((a, b) => new Date(b.auditDate) - new Date(a.auditDate))
    }

    const queryParams = new URLSearchParams(filters).toString()
    const audits = await firebaseDB.read('audits')
    if (!audits) return []

    let filteredAudits = [...audits]
    if (filters.status) {
      filteredAudits = filteredAudits.filter(audit => audit.status === filters.status)
    }
    if (filters.type) {
      filteredAudits = filteredAudits.filter(audit => audit.auditType === filters.type)
    }
    return filteredAudits.sort((a, b) => new Date(b.auditDate) - new Date(a.auditDate))
  } catch (error) {
    console.error('Failed to fetch audits:', error)
    throw error
  }
}

export async function createAudit(auditData) {
  try {
    if (process.env.NODE_ENV === 'development') {
      await simulateNetworkDelay()
      simulateRandomError()

      const newAudit = {
        id: `audit-${Date.now()}`,
        auditNumber: `AUD-2024-${String(mockAudits.length + 1).padStart(3, '0')}`,
        ...auditData,
        status: 'in-progress',
        items: [],
        discrepancies: [],
        recommendations: [],
        complianceScore: 0,
        createdAt: new Date()
      }

      mockAudits.unshift(newAudit)
      return newAudit
    }

    return await firebaseDB.create('audits', auditData)
  } catch (error) {
    console.error('Failed to create audit:', error)
    throw error
  }
}

export async function updateAudit(auditId, updates) {
  try {
    if (process.env.NODE_ENV === 'development') {
      await simulateNetworkDelay()
      simulateRandomError()

      const auditIndex = mockAudits.findIndex(audit => audit.id === auditId)
      if (auditIndex === -1) {
        throw new APIError('Audit not found', 404)
      }

      mockAudits[auditIndex] = {
        ...mockAudits[auditIndex],
        ...updates,
        updatedAt: new Date()
      }

      return mockAudits[auditIndex]
    }

    return await apiRequest(`/audits/${auditId}`, {
      method: 'PUT',
      body: updates
    })
  } catch (error) {
    console.error(`Failed to update audit ${auditId}:`, error)
    throw error
  }
}

// Adjustment Requests API
export async function fetchAdjustmentRequests(filters = {}) {
  try {
    if (process.env.NODE_ENV === 'development') {
      await simulateNetworkDelay()
      simulateRandomError()

      let requests = [...mockAdjustmentRequests]

      if (filters.status) {
        requests = requests.filter(req => req.status === filters.status)
      }
      if (filters.type) {
        requests = requests.filter(req => req.requestType === filters.type)
      }

      return requests.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt))
    }

    const queryParams = new URLSearchParams(filters).toString()
    const requests = await firebaseDB.read('adjustmentRequests')
    if (!requests) return []

    let filteredRequests = [...requests]
    if (filters.status) {
      filteredRequests = filteredRequests.filter(req => req.status === filters.status)
    }
    if (filters.type) {
      filteredRequests = filteredRequests.filter(req => req.requestType === filters.type)
    }
    return filteredRequests.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt))
  } catch (error) {
    console.error('Failed to fetch adjustment requests:', error)
    throw error
  }
}

export async function createAdjustmentRequest(requestData) {
  try {
    if (process.env.NODE_ENV === 'development') {
      await simulateNetworkDelay()
      simulateRandomError()

      const newRequest = {
        id: `adj-${Date.now()}`,
        ...requestData,
        status: 'pending',
        requestedAt: new Date()
      }

      mockAdjustmentRequests.unshift(newRequest)
      return newRequest
    }

    return await firebaseDB.create('adjustmentRequests', requestData)
  } catch (error) {
    console.error('Failed to create adjustment request:', error)
    throw error
  }
}

export async function updateAdjustmentRequest(requestId, updates) {
  try {
    if (process.env.NODE_ENV === 'development') {
      await simulateNetworkDelay()
      simulateRandomError()

      const requestIndex = mockAdjustmentRequests.findIndex(req => req.id === requestId)
      if (requestIndex === -1) {
        throw new APIError('Adjustment request not found', 404)
      }

      mockAdjustmentRequests[requestIndex] = {
        ...mockAdjustmentRequests[requestIndex],
        ...updates,
        updatedAt: new Date()
      }

      return mockAdjustmentRequests[requestIndex]
    }

    return await apiRequest(`/adjustment-requests/${requestId}`, {
      method: 'PUT',
      body: updates
    })
  } catch (error) {
    console.error(`Failed to update adjustment request ${requestId}:`, error)
    throw error
  }
}