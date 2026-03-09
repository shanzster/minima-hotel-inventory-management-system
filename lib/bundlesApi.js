import { firebaseDB, database } from './firebase'
import { ref, onValue, off } from 'firebase/database'
import { inventoryApi } from './inventoryApi'

const BUNDLES_PATH = 'bundles'
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
      // Initialize with empty room assignments
      const bundleWithAssignments = {
        ...bundleData,
        roomAssignments: {}, // { roomId: { assignedAt, assignedBy, status } }
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      return await firebaseDB.create(BUNDLES_PATH, bundleWithAssignments)
    } catch (error) {
      console.error('Error creating bundle:', error)
      throw error
    }
  },

  async update(id, bundleData) {
    try {
      return await firebaseDB.update(BUNDLES_PATH, id, {
        ...bundleData,
        updatedAt: new Date().toISOString()
      })
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

  // Room bundle assignments (stored within bundle document)
  async getRoomAssignments() {
    try {
      const bundles = await this.getAll()
      const assignments = {}
      
      // Build room assignments map from all bundles
      bundles.forEach(bundle => {
        if (bundle.roomAssignments) {
          Object.keys(bundle.roomAssignments).forEach(roomId => {
            assignments[roomId] = {
              bundleId: bundle.id,
              bundleName: bundle.name,
              bundleType: bundle.type,
              bundleDescription: bundle.description,
              items: bundle.items,
              ...bundle.roomAssignments[roomId]
            }
          })
        }
      })
      
      return assignments
    } catch (error) {
      console.error('Error fetching room assignments:', error)
      throw error
    }
  },

  async assignBundleToRooms(bundleId, roomIds, bundleData) {
    try {
      // Get the bundle
      const bundle = await this.getById(bundleId)
      if (!bundle) {
        throw new Error('Bundle not found')
      }

      // Get existing room assignments or initialize
      const roomAssignments = bundle.roomAssignments || {}
      
      // Add new room assignments
      for (const roomId of roomIds) {
        roomAssignments[roomId] = {
          assignedAt: new Date().toISOString(),
          assignedBy: bundleData.assignedBy || 'Unknown User',
          status: 'ready', // ready, pending, needs-inspection
          lastUpdated: new Date().toISOString()
        }
      }
      
      // Update bundle with new room assignments
      await this.update(bundleId, {
        roomAssignments
      })
      
      return roomAssignments
    } catch (error) {
      console.error('Error assigning bundle to rooms:', error)
      throw error
    }
  },

  async removeBundleFromRoom(bundleId, roomId) {
    try {
      const bundle = await this.getById(bundleId)
      if (!bundle) {
        throw new Error('Bundle not found')
      }

      const roomAssignments = bundle.roomAssignments || {}
      delete roomAssignments[roomId]
      
      await this.update(bundleId, {
        roomAssignments
      })
      
      return true
    } catch (error) {
      console.error('Error removing bundle from room:', error)
      throw error
    }
  },

  async clearAllAssignments(bundleId) {
    try {
      await this.update(bundleId, {
        roomAssignments: {}
      })
      return true
    } catch (error) {
      console.error('Error clearing all assignments:', error)
      throw error
    }
  },

  async clearAllBundleAssignments() {
    try {
      const bundles = await this.getAll()
      for (const bundle of bundles) {
        await this.update(bundle.id, {
          roomAssignments: {}
        })
      }
      return true
    } catch (error) {
      console.error('Error clearing all bundle assignments:', error)
      throw error
    }
  },

  // Room bundle status
  async getRoomStatuses() {
    try {
      const bundles = await this.getAll()
      const statuses = {}
      
      // Build status map from all bundles
      bundles.forEach(bundle => {
        if (bundle.roomAssignments) {
          Object.keys(bundle.roomAssignments).forEach(roomId => {
            statuses[roomId] = bundle.roomAssignments[roomId].status || 'ready'
          })
        }
      })
      
      return statuses
    } catch (error) {
      console.error('Error fetching room statuses:', error)
      throw error
    }
  },

  async updateRoomStatus(bundleId, roomId, status) {
    try {
      const bundle = await this.getById(bundleId)
      if (!bundle) {
        throw new Error('Bundle not found')
      }

      const roomAssignments = bundle.roomAssignments || {}
      if (!roomAssignments[roomId]) {
        throw new Error('Room not assigned to this bundle')
      }

      roomAssignments[roomId] = {
        ...roomAssignments[roomId],
        status,
        lastUpdated: new Date().toISOString()
      }
      
      await this.update(bundleId, {
        roomAssignments
      })
      
      return true
    } catch (error) {
      console.error('Error updating room status:', error)
      throw error
    }
  },

  async removeRoomStatus(bundleId, roomId) {
    try {
      return await this.removeBundleFromRoom(bundleId, roomId)
    } catch (error) {
      console.error('Error removing room status:', error)
      throw error
    }
  },

  async clearAllStatuses() {
    try {
      return await this.clearAllBundleAssignments()
    } catch (error) {
      console.error('Error clearing all statuses:', error)
      throw error
    }
  },

  // Helper: Get bundle for a specific room
  async getBundleForRoom(roomId) {
    try {
      const bundles = await this.getAll()
      
      for (const bundle of bundles) {
        if (bundle.roomAssignments && bundle.roomAssignments[roomId]) {
          return {
            ...bundle,
            roomStatus: bundle.roomAssignments[roomId]
          }
        }
      }
      
      return null
    } catch (error) {
      console.error('Error getting bundle for room:', error)
      throw error
    }
  },

  // Stock Management - Consumption tracking
  async recordConsumption(roomId, bundleId, consumedItems, userId, notes = '') {
    try {
      // Get bundle details
      const bundle = await this.getById(bundleId)
      if (!bundle) {
        throw new Error('Bundle not found')
      }

      const deductedItems = []
      const errors = []

      // Deduct stock for each consumed item
      for (const item of consumedItems) {
        if (item.consumed <= 0) continue

        try {
          // Get current inventory item
          const inventoryItem = await inventoryApi.getById(item.itemId)
          if (!inventoryItem) {
            errors.push(`Item ${item.name} not found in inventory`)
            continue
          }

          // Check if sufficient stock
          if (inventoryItem.currentStock < item.consumed) {
            errors.push(`Insufficient stock for ${item.name}. Available: ${inventoryItem.currentStock}, Required: ${item.consumed}`)
            continue
          }

          // Deduct consumed stock
          const newStock = inventoryItem.currentStock - item.consumed
          await inventoryApi.update(item.itemId, {
            currentStock: newStock
          })

          deductedItems.push({
            itemId: item.itemId,
            name: item.name,
            bundleQuantity: item.bundleQuantity,
            consumed: item.consumed,
            previousStock: inventoryItem.currentStock,
            newStock: newStock
          })
        } catch (error) {
          errors.push(`Error deducting ${item.name}: ${error.message}`)
        }
      }

      // Create transaction record
      const transaction = await firebaseDB.create(BUNDLE_TRANSACTIONS_PATH, {
        type: 'bundle-consumption',
        roomId,
        bundleId,
        bundleName: bundle.name,
        consumedItems: deductedItems,
        errors: errors.length > 0 ? errors : null,
        inspectedBy: userId,
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
        items: consumedItems.map(item => ({
          itemId: item.itemId,
          name: item.name,
          bundleQuantity: item.bundleQuantity,
          consumed: item.consumed,
          needsRefurbish: item.consumed
        })),
        totalConsumed: consumedItems.reduce((sum, item) => sum + item.consumed, 0),
        totalRefurbished: consumedItems.reduce((sum, item) => sum + item.consumed, 0),
        notes
      })

      // Update room status to 'ready'
      await this.updateRoomStatus(bundleId, roomId, 'ready')

      return {
        success: errors.length === 0,
        deductedItems,
        errors,
        transactionId: transaction.id,
        inspectionId: inspection.id
      }
    } catch (error) {
      console.error('Error recording consumption:', error)
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
  },

  // Real-time listener for room statuses
  onRoomStatusesChange(callback) {
    try {
      if (!database) {
        callback({})
        return () => { }
      }

      const bundlesRef = ref(database, 'bundles')

      const unsubscribe = onValue(bundlesRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val()
          const bundles = Object.keys(data).map(key => ({
            id: key,
            ...data[key]
          }))
          
          const statuses = {}
          
          // Build status map from all bundles
          bundles.forEach(bundle => {
            if (bundle.roomAssignments) {
              Object.keys(bundle.roomAssignments).forEach(roomId => {
                statuses[roomId] = bundle.roomAssignments[roomId].status || 'ready'
              })
            }
          })
          
          callback(statuses)
        } else {
          callback({})
        }
      })

      return () => off(bundlesRef)
    } catch (error) {
      console.error('Error setting up room statuses listener:', error)
      callback({})
      return () => { }
    }
  }
}

export default bundlesApi
