// Purchase Orders API using Firebase Realtime Database
import firebaseDB, { database } from './firebase'
import { mockPurchaseOrders } from './mockData'

// Check if Firebase is properly configured and initialized
const useFirebase = database !== null

// Debug logging
if (typeof window !== 'undefined') {
  console.log('🔥 Purchase Orders Firebase Status:', useFirebase ? 'Connected' : 'Not configured - using mock data')
}

export const purchaseOrderApi = {
  // Get all purchase orders
  async getAll() {
    if (!useFirebase) {
      return Promise.resolve(mockPurchaseOrders)
    }

    try {
      const orders = await firebaseDB.read('purchaseOrders')
      return orders || []
    } catch (error) {
      console.error('Error fetching purchase orders:', error)
      return mockPurchaseOrders
    }
  },

  // Get single purchase order by ID
  async getById(id) {
    if (!useFirebase) {
      const order = mockPurchaseOrders.find(order => order.id === id)
      return order || null
    }

    try {
      return await firebaseDB.readById('purchaseOrders', id)
    } catch (error) {
      console.error('Error fetching purchase order:', error)
      return null
    }
  },

  // Create new purchase order
  async create(orderData) {
    if (!useFirebase) {
      // For mock data, just add to the array (this won't persist)
      const newOrder = {
        ...orderData,
        id: `po-${Date.now()}`,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      mockPurchaseOrders.push(newOrder)
      return newOrder
    }

    try {
      const newOrder = await firebaseDB.create('purchaseOrders', orderData)
      await firebaseDB.logActivity({
        type: 'CREATE_PO',
        poId: newOrder.id,
        orderNumber: newOrder.orderNumber,
        details: 'Manual purchase order creation',
        userRole: 'inventory-controller'
      })
      return newOrder
    } catch (error) {
      console.error('Error creating purchase order:', error)
      throw error
    }
  },

  // Update purchase order
  async update(id, orderData) {
    if (!useFirebase) {
      // For mock data, find and update the order
      const index = mockPurchaseOrders.findIndex(order => order.id === id)
      if (index !== -1) {
        mockPurchaseOrders[index] = {
          ...mockPurchaseOrders[index],
          ...orderData,
          updatedAt: new Date()
        }
        return mockPurchaseOrders[index]
      }
      throw new Error('Purchase order not found')
    }

    try {
      // Get the current order first to ensure we have the orderNumber
      const currentOrder = await firebaseDB.get('purchaseOrders', id)
      const updatedOrder = await firebaseDB.update('purchaseOrders', id, orderData)
      await firebaseDB.logActivity({
        type: 'UPDATE_PO',
        poId: id,
        orderNumber: currentOrder?.orderNumber || updatedOrder?.orderNumber || id,
        details: `PO updated: ${orderData.status || 'data changed'}`,
        userRole: 'inventory-controller'
      })
      return updatedOrder
    } catch (error) {
      console.error('Error updating purchase order:', error)
      throw error
    }
  },

  // Delete purchase order
  async delete(id) {
    if (!useFirebase) {
      // For mock data, remove from array
      const index = mockPurchaseOrders.findIndex(order => order.id === id)
      if (index !== -1) {
        mockPurchaseOrders.splice(index, 1)
        return true
      }
      return false
    }

    try {
      return await firebaseDB.delete('purchaseOrders', id)
    } catch (error) {
      console.error('Error deleting purchase order:', error)
      throw error
    }
  },

  // Real-time listener for purchase orders changes
  onPurchaseOrdersChange(callback) {
    if (!useFirebase) {
      // For mock data, return a no-op function
      callback([])
      return () => { }
    }

    return firebaseDB.onValue('purchaseOrders', callback)
  },

  // Get orders by status
  async getByStatus(status) {
    const allOrders = await this.getAll()
    return allOrders.filter(order => order.status === status)
  },

  // Get pending orders
  async getPendingOrders() {
    return await this.getByStatus('pending')
  },

  // Get approved orders
  async getApprovedOrders() {
    return await this.getByStatus('approved')
  },

  // Get orders by priority
  async getByPriority(priority) {
    const allOrders = await this.getAll()
    return allOrders.filter(order => order.priority === priority)
  },

  // Get overdue orders (expected delivery date has passed)
  async getOverdueOrders() {
    const allOrders = await this.getAll()
    const now = new Date()
    return allOrders.filter(order =>
      order.status !== 'delivered' &&
      new Date(order.expectedDelivery) < now
    )
  },

  // Search orders
  async search(query) {
    const allOrders = await this.getAll()
    const searchTerm = query.toLowerCase()

    return allOrders.filter(order =>
      order.orderNumber.toLowerCase().includes(searchTerm) ||
      order.supplier.name.toLowerCase().includes(searchTerm) ||
      order.supplier.contactPerson.toLowerCase().includes(searchTerm) ||
      order.status.toLowerCase().includes(searchTerm)
    )
  }
}

export default purchaseOrderApi