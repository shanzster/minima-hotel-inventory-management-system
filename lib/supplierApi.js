// Suppliers API using Firebase Realtime Database
import firebaseDB, { database } from './firebase'
import { mockSuppliers } from './mockData'

// Check if Firebase is properly configured and initialized
const useFirebase = database !== null

// Debug logging
if (typeof window !== 'undefined') {
  console.log('🔥 Suppliers Firebase Status:', useFirebase ? 'Connected' : 'Not configured - using mock data')
}

export const supplierApi = {
  // Get all suppliers
  async getAll() {
    if (!useFirebase) {
      return Promise.resolve([])
    }

    try {
      const suppliers = await firebaseDB.read('suppliers')
      return suppliers || []
    } catch (error) {
      return []
    }
  },

  // Get single supplier by ID
  async getById(id) {
    if (!useFirebase) {
      return null
    }

    try {
      return await firebaseDB.readById('suppliers', id)
    } catch (error) {
      console.error('Error fetching supplier:', error)
      return null
    }
  },

  // Create new supplier
  async create(supplierData) {
    if (!useFirebase) {
      // For mock data, just add to the array (this won't persist)
      const newSupplier = {
        ...supplierData,
        id: `supplier-${Date.now()}`,
        isActive: false,
        isApproved: false,
        createdAt: new Date(),
        performanceMetrics: {
          overallRating: 0,
          deliveryReliability: 0,
          qualityRating: 0,
          responseTime: 0,
          totalOrders: 0,
          onTimeDeliveries: 0,
          qualityIssues: 0,
          lastEvaluationDate: null
        }
      }
      mockSuppliers.push(newSupplier)
      return newSupplier
    }

    try {
      return await firebaseDB.create('suppliers', supplierData)
    } catch (error) {
      console.error('Error creating supplier:', error)
      throw error
    }
  },

  // Update supplier
  async update(id, supplierData) {
    if (!useFirebase) {
      // For mock data, find and update the supplier
      const index = mockSuppliers.findIndex(supplier => supplier.id === id)
      if (index !== -1) {
        mockSuppliers[index] = {
          ...mockSuppliers[index],
          ...supplierData,
          updatedAt: new Date()
        }
        return mockSuppliers[index]
      }
      throw new Error('Supplier not found')
    }

    try {
      return await firebaseDB.update('suppliers', id, supplierData)
    } catch (error) {
      console.error('Error updating supplier:', error)
      throw error
    }
  },

  // Delete supplier
  async delete(id) {
    if (!useFirebase) {
      // For mock data, remove from array
      const index = mockSuppliers.findIndex(supplier => supplier.id === id)
      if (index !== -1) {
        mockSuppliers.splice(index, 1)
        return true
      }
      return false
    }

    try {
      return await firebaseDB.delete('suppliers', id)
    } catch (error) {
      console.error('Error deleting supplier:', error)
      throw error
    }
  },

  // Real-time listener for suppliers changes
  onSuppliersChange(callback) {
    if (!useFirebase) {
      // For mock data, return a no-op function
      callback([])
      return () => { }
    }

    return firebaseDB.onValue('suppliers', callback)
  },

  // Approve supplier
  async approveSupplier(id, approvedBy) {
    const approvalData = {
      isApproved: true,
      isActive: true,
      approvedBy: approvedBy,
      approvedAt: new Date().toISOString()
    }

    return await this.update(id, approvalData)
  },

  // Get suppliers by status
  async getByStatus(status) {
    const allSuppliers = await this.getAll()
    switch (status) {
      case 'active':
        return allSuppliers.filter(supplier => supplier.isActive && supplier.isApproved)
      case 'pending':
        return allSuppliers.filter(supplier => !supplier.isApproved)
      case 'inactive':
        return allSuppliers.filter(supplier => !supplier.isActive && supplier.isApproved)
      default:
        return allSuppliers
    }
  },

  // Get active suppliers
  async getActiveSuppliers() {
    return await this.getByStatus('active')
  },

  // Get pending suppliers
  async getPendingSuppliers() {
    return await this.getByStatus('pending')
  },

  // Get high performing suppliers
  async getHighPerformingSuppliers() {
    const allSuppliers = await this.getAll()
    return allSuppliers.filter(supplier => supplier.performanceMetrics.overallRating >= 4.5)
  },

  // Get low performing suppliers
  async getLowPerformingSuppliers() {
    const allSuppliers = await this.getAll()
    return allSuppliers.filter(supplier =>
      supplier.performanceMetrics &&
      supplier.performanceMetrics.overallRating > 0 &&
      supplier.performanceMetrics.overallRating < 4.0
    )
  },

  // Search suppliers
  async search(query) {
    const allSuppliers = await this.getAll()
    const searchTerm = query.toLowerCase()

    return allSuppliers.filter(supplier =>
      supplier.name.toLowerCase().includes(searchTerm) ||
      supplier.contactPerson.toLowerCase().includes(searchTerm) ||
      supplier.email.toLowerCase().includes(searchTerm) ||
      (supplier.categories && Array.isArray(supplier.categories) &&
        supplier.categories.some(cat => cat.toLowerCase().includes(searchTerm)))
    )
  },

  // Update supplier performance metrics after receiving a delivery
  async updatePerformanceMetrics(supplierId, deliveryData) {
    try {
      const supplier = await this.getById(supplierId)
      if (!supplier) {
        console.error('Supplier not found:', supplierId)
        return null
      }

      // Get current metrics or initialize
      const currentMetrics = supplier.performanceMetrics || {
        overallRating: 0,
        deliveryReliability: 0,
        qualityRating: 0,
        responseTime: 0,
        totalOrders: 0,
        onTimeDeliveries: 0,
        qualityIssues: 0,
        lastEvaluationDate: null
      }

      // Calculate if delivery was on time
      const expectedDate = new Date(deliveryData.expectedDeliveryDate)
      const actualDate = new Date(deliveryData.actualDeliveryDate)
      expectedDate.setHours(23, 59, 59, 999) // End of expected day
      actualDate.setHours(0, 0, 0, 0) // Start of actual day
      
      const isOnTime = actualDate <= expectedDate

      // Update metrics
      const newTotalOrders = currentMetrics.totalOrders + 1
      const newOnTimeDeliveries = currentMetrics.onTimeDeliveries + (isOnTime ? 1 : 0)
      const newDeliveryReliability = Math.round((newOnTimeDeliveries / newTotalOrders) * 100)

      // Calculate overall rating based on delivery reliability
      // 100% = 5.0, 90% = 4.5, 80% = 4.0, 70% = 3.5, etc.
      const newOverallRating = Math.round((newDeliveryReliability / 20) * 10) / 10

      // Update quality issues if provided
      const newQualityIssues = deliveryData.hasQualityIssue 
        ? currentMetrics.qualityIssues + 1 
        : currentMetrics.qualityIssues

      const updatedMetrics = {
        performanceMetrics: {
          ...currentMetrics,
          totalOrders: newTotalOrders,
          onTimeDeliveries: newOnTimeDeliveries,
          deliveryReliability: newDeliveryReliability,
          overallRating: newOverallRating,
          qualityIssues: newQualityIssues,
          lastEvaluationDate: new Date().toISOString()
        }
      }

      // Update supplier with new metrics
      await this.update(supplierId, updatedMetrics)

      console.log(`✅ Updated performance for supplier ${supplier.name}:`, {
        totalOrders: newTotalOrders,
        onTimeDeliveries: newOnTimeDeliveries,
        deliveryReliability: `${newDeliveryReliability}%`,
        overallRating: newOverallRating,
        wasOnTime: isOnTime
      })

      return updatedMetrics.performanceMetrics
    } catch (error) {
      console.error('Error updating supplier performance:', error)
      throw error
    }
  }
}

export default supplierApi