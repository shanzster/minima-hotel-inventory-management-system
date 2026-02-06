// Firebase configuration and initialization
import { initializeApp } from 'firebase/app'
import { getDatabase, ref, set, get, push, update, remove, onValue, off } from 'firebase/database'

// Firebase configuration - Real Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyCBfxKrQaDN3a_pJzK-VScfn2TYd1Dk0LI",
  authDomain: "hotel-minima.firebaseapp.com",
  databaseURL: "https://hotel-minima-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "hotel-minima",
  storageBucket: "hotel-minima.firebasestorage.app",
  messagingSenderId: "1013644211804",
  appId: "1:1013644211804:web:2001aa285dc41b570c1899",
  measurementId: "G-2MKVD6P2HP"
}

// Validate Firebase config - check that we have real values
const isFirebaseConfigured = firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.databaseURL &&
  firebaseConfig.projectId &&
  firebaseConfig.apiKey.startsWith('AIzaSy') && // Firebase API keys start with this
  firebaseConfig.projectId === 'hotel-minima' // Our specific project ID

// Initialize Firebase only if properly configured
let app = null
let database = null

try {
  if (isFirebaseConfigured) {
    app = initializeApp(firebaseConfig)
    database = getDatabase(app)
  }
} catch (error) {
  console.warn('Firebase initialization failed:', error.message)
  console.warn('Falling back to mock data. Please configure Firebase environment variables.')
}

export { database }

// Database references - only create if database is available
export const dbRefs = database ? {
  inventory: ref(database, 'inventory'),
  transactions: ref(database, 'transactions'),
  suppliers: ref(database, 'suppliers'),
  purchaseOrders: ref(database, 'purchaseOrders'),
  audits: ref(database, 'audits')
} : null

// Helper functions for Firebase Realtime Database operations
export const firebaseDB = {
  // Generic CRUD operations
  async create(path, data) {
    if (!database) {
      throw new Error('Firebase database not initialized')
    }

    try {
      const newRef = push(ref(database, path))
      await set(newRef, {
        ...data,
        id: newRef.key,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      return { id: newRef.key, ...data }
    } catch (error) {
      console.error('Error creating document:', error)
      throw error
    }
  },

  async read(path) {
    if (!database) {
      throw new Error('Firebase database not initialized')
    }

    try {
      const snapshot = await get(ref(database, path))
      if (snapshot.exists()) {
        const data = snapshot.val()
        // Convert Firebase object to array if it's an object with keys
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          return Object.keys(data).map(key => ({
            id: key,
            ...data[key]
          }))
        }
        return data
      }
      return null
    } catch (error) {
      console.error('Error reading data:', error)
      throw error
    }
  },

  async readById(path, id) {
    if (!database) {
      throw new Error('Firebase database not initialized')
    }

    try {
      const snapshot = await get(ref(database, `${path}/${id}`))
      if (snapshot.exists()) {
        return { id, ...snapshot.val() }
      }
      return null
    } catch (error) {
      console.error('Error reading document:', error)
      throw error
    }
  },

  async update(path, id, data) {
    if (!database) {
      throw new Error('Firebase database not initialized')
    }

    try {
      await update(ref(database, `${path}/${id}`), {
        ...data,
        updatedAt: new Date().toISOString()
      })
      return { id, ...data }
    } catch (error) {
      console.error('Error updating document:', error)
      throw error
    }
  },

  async delete(path, id) {
    if (!database) {
      throw new Error('Firebase database not initialized')
    }

    try {
      await remove(ref(database, `${path}/${id}`))
      return true
    } catch (error) {
      console.error('Error deleting document:', error)
      throw error
    }
  },

  // Real-time listeners
  onValue(path, callback) {
    if (!database) {
      // Return a no-op function if database is not available
      callback([])
      return () => { }
    }

    const dbRef = ref(database, path)
    onValue(dbRef, (snapshot) => {
      const data = snapshot.val()
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        const arrayData = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }))
        callback(arrayData)
      } else {
        callback(data || [])
      }
    })
    return () => off(dbRef)
  },

  // Inventory specific functions
  async createInventoryItem(itemData) {
    if (!database) {
      throw new Error('Firebase database not initialized')
    }
    return await this.create('inventory', itemData)
  },

  async getInventoryItems() {
    if (!database) {
      throw new Error('Firebase database not initialized')
    }
    return await this.read('inventory')
  },

  async getInventoryItem(id) {
    if (!database) {
      throw new Error('Firebase database not initialized')
    }
    return await this.readById('inventory', id)
  },

  async updateInventoryItem(id, itemData) {
    if (!database) {
      throw new Error('Firebase database not initialized')
    }
    return await this.update('inventory', id, itemData)
  },

  async deleteInventoryItem(id) {
    if (!database) {
      throw new Error('Firebase database not initialized')
    }
    return await this.delete('inventory', id)
  },

  // Listen to inventory changes in real-time
  onInventoryChange(callback) {
    return this.onValue('inventory', callback)
  },

  // Transaction functions
  async createTransaction(transactionData) {
    if (!database) {
      throw new Error('Firebase database not initialized')
    }
    return await this.create('transactions', transactionData)
  },

  async getTransactions() {
    if (!database) {
      throw new Error('Firebase database not initialized')
    }
    return await this.read('transactions')
  },

  async updateInventoryStock(itemId, quantityChange, transactionData) {
    if (!database) {
      throw new Error('Firebase database not initialized')
    }

    try {
      // Get current item
      const item = await this.getInventoryItem(itemId)
      if (!item) {
        throw new Error('Item not found')
      }

      // Calculate new stock
      const newStock = item.currentStock + quantityChange

      // Update item stock
      await this.updateInventoryItem(itemId, {
        currentStock: newStock,
        updatedAt: new Date().toISOString()
      })

      // Create transaction record
      await this.createTransaction({
        itemId,
        itemName: item.name,
        type: quantityChange > 0 ? 'stock-in' : 'stock-out',
        quantity: Math.abs(quantityChange),
        previousStock: item.currentStock,
        newStock,
        ...transactionData,
        timestamp: new Date().toISOString()
      })

      return { itemId, newStock }
    } catch (error) {
      console.error('Error updating inventory stock:', error)
      throw error
    }
  },

  async updateBatchStock(itemId, batchDetails, quantityChange, transactionData) {
    if (!database) {
      throw new Error('Firebase database not initialized')
    }

    try {
      const { batchNumber, expirationDate } = batchDetails
      const batchId = batchNumber ? batchNumber.replace(/[^a-zA-Z0-9]/g, '_') : `batch_${Date.now()}`

      // 1. Get current item to calculate aggregate stock
      const item = await this.getInventoryItem(itemId)
      if (!item) throw new Error('Item not found')

      // 2. Read or initialize batch
      const batchPath = `inventory/${itemId}/batches/${batchId}`
      const batchesData = await this.read(`inventory/${itemId}/batches`) || {}
      const existingBatch = batchesData[batchId] || {
        quantity: 0,
        batchNumber: batchNumber || batchId,
        expirationDate: expirationDate || null
      }

      // 3. Update Batch
      const newBatchQuantity = existingBatch.quantity + quantityChange
      await this.set(batchPath, {
        ...existingBatch,
        quantity: newBatchQuantity,
        updatedAt: new Date().toISOString()
      })

      // 4. Update Main Item Aggregate Stock
      const newAggregateStock = item.currentStock + quantityChange
      await this.updateInventoryItem(itemId, {
        currentStock: newAggregateStock,
        updatedAt: new Date().toISOString()
      })

      // 5. Create transaction record
      await this.createTransaction({
        itemId,
        itemName: item.name,
        batchNumber: batchNumber || batchId,
        type: quantityChange > 0 ? 'stock-in' : 'stock-out',
        quantity: Math.abs(quantityChange),
        previousStock: item.currentStock,
        newStock: newAggregateStock,
        ...transactionData,
        timestamp: new Date().toISOString()
      })

      return { itemId, newStock: newAggregateStock, batchId }
    } catch (error) {
      console.error('Error updating batch stock:', error)
      throw error
    }
  },

  // Centralized Activity Logging
  async logActivity(activityData) {
    if (!database) return null;
    try {
      return await this.create('activityLogs', {
        ...activityData,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error logging activity:', error);
      return null;
    }
  }
}

export default firebaseDB