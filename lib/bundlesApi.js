import { firebaseDB } from './firebase'
import { inventoryApi } from './inventoryApi'

const BUNDLES_PATH = 'bundles'
const ROOM_BUNDLE_ASSIGNMENTS_PATH = 'room_bundle_assignments'
const ROOM_BUNDLE_STATUS_PATH = 'room_bundle_status'
const BUNDLE_TRANSACTIONS_PATH = 'bundle_transactions'
const INSPECTION_RECORDS_PATH = 'inspection_records'

export const bundlesApi = {
  // Bundle CRUD operations
  async getAll() {
    try {
      const bundles = await firebaseDB.read(BUNDLES_PATH)
      return bundles || []
    } catch (error) {
      console.error('Error fetching bundles:', error)
      throw error
    }
  },

  async getById(id) {
    try {
      return await firebaseDB.readById(BUNDLES_PATH, id)
    } catch (error) {
      console.error('Error fetching bundle:', error)
      throw error
    }
  },

  async create(bundleData) {
    try {
      return await firebaseDB.create(BUNDLES_PATH, bundleData)
    } catch (error) {
      console.error('Error creating bundle:', error)
      throw error
    }
  },

  async update(id, bundleData) {
    try {
      return await firebaseDB.update(BUNDLES_PATH, id, bundleData)
    } catch (error) {
      console.error('Error updating bundle:', error)
      throw error
    }
  },

  async delete(id) {
    try {
      return await firebaseDB.delete(BUNDLES_PATH, id)
    } catch (error) {
      console.error('Error deleting bundle:', error)
      throw error
    }
  },

  // Room bundle assignments
  async getRoomAssignments() {
    try {
      const assignments = await firebaseDB.read(ROOM_BUNDLE_ASSIGNMENTS_PATH)
      return assignments || {}
    } catch (error) {
      console.error('Error fetching room assignments:', error)
      throw error
    }
  },

  async assignBundleToRooms(bundleId, roomIds, bundleData) {
    try {
      const assignments = await this.getRoomAssignments()
      
      // Assign bundle to each room with complete data
      for (const roomId of roomIds) {
        assignments[roomId] = {
          bundleId,
          bundleName: bundleData.bundleName,
          bundleType: bundleData.bundleType,
          bundleDescription: bundleData.bundleDescription || '',
          assignedAt: new Date().toISOString(),
          assignedBy: bundleData.assignedBy || 'admin',
          items: bundleData.items || []
        }
      }
      
      // Save all assignments
      await firebaseDB.update(ROOM_BUNDLE_ASSIGNMENTS_PATH, '', assignments)
      
      // Initialize bundle status for each room as 'ready'
      const statuses = await this.getRoomStatuses()
      for (const roomId of roomIds) {
        statuses[roomId] = {
          status: 'ready',
          lastUpdated: new Date().toISOString()
        }
      }
      await firebaseDB.update(ROOM_BUNDLE_STATUS_PATH, '', statuses)
      
      return assignments
    } catch (error) {
      console.error('Error assigning bundle to rooms:', error)
      throw error
    }
  },

  async removeBundleFromRoom(roomId) {
    try {
      await firebaseDB.delete(`${ROOM_BUNDLE_ASSIGNMENTS_PATH}/${roomId}`)
      return true
    } catch (error) {
      console.error('Error removing bundle from room:', error)
      throw error
    }
  },

  async clearAllAssignments() {
    try {
      await firebaseDB.delete(ROOM_BUNDLE_ASSIGNMENTS_PATH, '')
      return true
    } catch (error) {
      console.error('Error clearing all assignments:', error)
      throw error
    }
  },

  // Room bundle status
  async getRoomStatuses() {
    try {
      const statuses = await firebaseDB.read(ROOM_BUNDLE_STATUS_PATH)
      return statuses || {}
    } catch (error) {
      console.error('Error fetching room statuses:', error)
      throw error
    }
  },

  async updateRoomStatus(roomId, status) {
    try {
      await firebaseDB.update(`${ROOM_BUNDLE_STATUS_PATH}/${roomId}`, '', status)
      return true
    } catch (error) {
      console.error('Error updating room status:', error)
      throw error
    }
  },

  async removeRoomStatus(roomId) {
    try {
      await firebaseDB.delete(`${ROOM_BUNDLE_STATUS_PATH}/${roomId}`)
      return true
    } catch (error) {
      console.error('Error removing room status:', error)
      throw error
    }
  },

  async clearAllStatuses() {
    try {
      await firebaseDB.delete(ROOM_BUNDLE_STATUS_PATH, '')
      return true
    } catch (error) {
      console.error('Error clearing all statuses:', error)
      throw error
    }
  },

  // Stock Management - Real deductions and returns
  async deductBundleStock(roomId, bundleId, userId = 'system') {
    try {
      // Get bundle details
      const bundle = await this.getById(bundleId)
      if (!bundle) {
        throw new Error('Bundle not found')
      }

      const deductedItems = []
      const errors = []

      // Deduct stock for each item in the bundle
      for (const item of bundle.items) {
        try {
          // Get current inventory item
          const inventoryItem = await inventoryApi.getById(item.itemId)
          if (!inventoryItem) {
            errors.push(`Item ${item.name} not found in inventory`)
            continue
          }

          // Check if sufficient stock
          if (inventoryItem.currentStock < item.quantity) {
            errors.push(`Insufficient stock for ${item.name}. Available: ${inventoryItem.currentStock}, Required: ${item.quantity}`)
            continue
          }

          // Deduct stock
          const newStock = inventoryItem.currentStock - item.quantity
          await inventoryApi.update(item.itemId, {
            currentStock: newStock
          })

          deductedItems.push({
            itemId: item.itemId,
            name: item.name,
            quantity: item.quantity,
            previousStock: inventoryItem.currentStock,
            newStock: newStock
          })
        } catch (error) {
          errors.push(`Error deducting ${item.name}: ${error.message}`)
        }
      }

      // Create transaction record
      const transaction = await firebaseDB.create(BUNDLE_TRANSACTIONS_PATH, {
        type: 'bundle-deployment',
        roomId,
        bundleId,
        bundleName: bundle.name,
        items: deductedItems,
        errors: errors.length > 0 ? errors : null,
        triggeredBy: userId,
        timestamp: new Date().toISOString()
      })

      return {
        success: errors.length === 0,
        deductedItems,
        errors,
        transactionId: transaction.id
      }
    } catch (error) {
      console.error('Error deducting bundle stock:', error)
      throw error
    }
  },

  async returnBundleStock(roomId, bundleId, returnedItems, consumedItems, userId, notes = '') {
    try {
      // Get bundle details
      const bundle = await this.getById(bundleId)
      if (!bundle) {
        throw new Error('Bundle not found')
      }

      const returnedStockItems = []
      const errors = []

      // Return stock for each unused item
      for (const returnItem of returnedItems) {
        if (returnItem.quantity <= 0) continue

        try {
          // Get current inventory item
          const inventoryItem = await inventoryApi.getById(returnItem.itemId)
          if (!inventoryItem) {
            errors.push(`Item ${returnItem.name} not found in inventory`)
            continue
          }

          // Add stock back
          const newStock = inventoryItem.currentStock + returnItem.quantity
          await inventoryApi.update(returnItem.itemId, {
            currentStock: newStock
          })

          returnedStockItems.push({
            itemId: returnItem.itemId,
            name: returnItem.name,
            quantity: returnItem.quantity,
            previousStock: inventoryItem.currentStock,
            newStock: newStock
          })
        } catch (error) {
          errors.push(`Error returning ${returnItem.name}: ${error.message}`)
        }
      }

      // Create transaction record
      const transaction = await firebaseDB.create(BUNDLE_TRANSACTIONS_PATH, {
        type: 'bundle-inspection-return',
        roomId,
        bundleId,
        bundleName: bundle.name,
        returnedItems: returnedStockItems,
        consumedItems,
        errors: errors.length > 0 ? errors : null,
        triggeredBy: userId,
        notes,
        timestamp: new Date().toISOString()
      })

      // Create inspection record
      const inspection = await firebaseDB.create(INSPECTION_RECORDS_PATH, {
        roomId,
        bundleId,
        bundleName: bundle.name,
        inspectedBy: userId,
        inspectedAt: new Date().toISOString(),
        items: [...returnedItems, ...consumedItems].map(item => ({
          itemId: item.itemId,
          name: item.name,
          deployed: item.deployed || item.quantity,
          consumed: consumedItems.find(c => c.itemId === item.itemId)?.quantity || 0,
          remaining: returnedItems.find(r => r.itemId === item.itemId)?.quantity || 0
        })),
        totalConsumed: consumedItems.reduce((sum, item) => sum + item.quantity, 0),
        totalReturned: returnedItems.reduce((sum, item) => sum + item.quantity, 0),
        notes
      })

      return {
        success: errors.length === 0,
        returnedItems: returnedStockItems,
        errors,
        transactionId: transaction.id,
        inspectionId: inspection.id
      }
    } catch (error) {
      console.error('Error returning bundle stock:', error)
      throw error
    }
  },

  // Get transactions for a room
  async getRoomTransactions(roomId) {
    try {
      const allTransactions = await firebaseDB.read(BUNDLE_TRANSACTIONS_PATH)
      if (!allTransactions) return []
      
      return allTransactions.filter(t => t.roomId === roomId)
    } catch (error) {
      console.error('Error fetching room transactions:', error)
      throw error
    }
  },

  // Get inspection records for a room
  async getRoomInspections(roomId) {
    try {
      const allInspections = await firebaseDB.read(INSPECTION_RECORDS_PATH)
      if (!allInspections) return []
      
      return allInspections.filter(i => i.roomId === roomId)
    } catch (error) {
      console.error('Error fetching room inspections:', error)
      throw error
    }
  }
}

export default bundlesApi
