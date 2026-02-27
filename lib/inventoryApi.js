// Inventory API using Firebase Realtime Database
import firebaseDB, { database } from './firebase'
import { mockInventoryItems } from './mockData'

// Check if Firebase is properly configured and initialized
const useFirebase = database !== null

// Debug logging
if (typeof window !== 'undefined') {
  console.log('🔥 Firebase Status:', useFirebase ? 'Connected' : 'Not configured - using mock data')
  if (!useFirebase) {
    console.log('📝 To use real database data:')
    console.log('1. Create a Firebase project at https://console.firebase.google.com/')
    console.log('2. Enable Realtime Database')
    console.log('3. Get your config from Project Settings > General > Your apps')
    console.log('4. Create .env.local file with your Firebase config values')
  }
}

export const inventoryApi = {
  // Get all inventory items
  async getAll() {
    if (!useFirebase) {
      return Promise.resolve([])
    }

    try {
      const items = await firebaseDB.getInventoryItems()
      return items || []
    } catch (error) {
      console.error('Error fetching inventory items:', error)
      return []
    }
  },

  // Get single inventory item by ID
  async getById(id) {
    if (!useFirebase) {
      return null
    }

    try {
      return await firebaseDB.getInventoryItem(id)
    } catch (error) {
      console.error('Error fetching inventory item:', error)
      return null
    }
  },

  // Create new inventory item
  async create(itemData) {
    if (!useFirebase) {
      // For mock data, just add to the array (this won't persist)
      const newItem = {
        ...itemData,
        id: `mock-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      mockInventoryItems.push(newItem)
      return newItem
    }

    try {
      const newItem = await firebaseDB.createInventoryItem(itemData)
      await firebaseDB.logActivity({
        type: 'CREATE_ITEM',
        itemId: newItem.id,
        itemName: newItem.name,
        details: 'Manual item creation',
        userRole: 'inventory-controller'
      })
      return newItem
    } catch (error) {
      console.error('Error creating inventory item:', error)
      throw error
    }
  },

  // Update inventory item
  async update(id, itemData) {
    if (!useFirebase) {
      // For mock data, find and update the item
      const index = mockInventoryItems.findIndex(item => item.id === id)
      if (index !== -1) {
        mockInventoryItems[index] = {
          ...mockInventoryItems[index],
          ...itemData,
          updatedAt: new Date()
        }
        return mockInventoryItems[index]
      }
      throw new Error('Item not found')
    }

    try {
      // Get the current item first to have the name for logging
      const currentItem = await firebaseDB.getInventoryItem(id)

      await firebaseDB.updateInventoryItem(id, itemData)

      // Log activity with the item name from current item
      await firebaseDB.logActivity({
        type: 'UPDATE_ITEM',
        itemId: id,
        itemName: currentItem?.name || 'Unknown Item',
        details: itemData.isActive !== undefined
          ? `Item ${itemData.isActive ? 'activated' : 'deactivated'}`
          : 'Manual item update',
        userRole: 'inventory-controller'
      })

      return { ...currentItem, ...itemData }
    } catch (error) {
      console.error('Error updating inventory item:', error)
      throw error
    }
  },

  // Delete inventory item
  async delete(id) {
    if (!useFirebase) {
      // For mock data, remove from array
      const index = mockInventoryItems.findIndex(item => item.id === id)
      if (index !== -1) {
        mockInventoryItems.splice(index, 1)
        return true
      }
      return false
    }

    try {
      const result = await firebaseDB.deleteInventoryItem(id)
      if (result) {
        await firebaseDB.logActivity({
          type: 'DELETE_ITEM',
          itemId: id,
          details: 'Manual item deletion',
          userRole: 'inventory-controller'
        })
      }
      return result
    } catch (error) {
      console.error('Error deleting inventory item:', error)
      throw error
    }
  },

  // Update inventory stock and create transaction
  async updateStock(itemId, quantityChange, transactionData) {
    if (!useFirebase) {
      return { itemId, newStock: quantityChange }
    }

    try {
      return await firebaseDB.updateInventoryStock(itemId, quantityChange, transactionData)
    } catch (error) {
      console.error('Error updating inventory stock:', error)
      throw error
    }
  },

  // Update batch-specific stock
  async updateBatchStock(itemId, batchDetails, quantityChange, transactionData) {
    if (!useFirebase) {
      // Mock fallback: just update main stock
      return this.updateStock(itemId, quantityChange, transactionData)
    }

    try {
      return await firebaseDB.updateBatchStock(itemId, batchDetails, quantityChange, transactionData)
    } catch (error) {
      console.error('Error updating batch stock:', error)
      throw error
    }
  },

  // Get all batches for an item
  async getBatches(itemId) {
    if (!useFirebase) {
      return []
    }

    try {
      const batchesData = await firebaseDB.read(`inventory/${itemId}/batches`)
      if (!batchesData) return []

      return Object.entries(batchesData).map(([id, data]) => ({
        id,
        ...data
      }))
    } catch (error) {
      console.error('Error fetching batches:', error)
      return []
    }
  },

  // Real-time listener for inventory changes
  onInventoryChange(callback) {
    if (!useFirebase) {
      // For mock data, return a no-op function
      return () => { }
    }

    return firebaseDB.onInventoryChange(callback)
  },

  // Get items by category
  async getByCategory(category) {
    const allItems = await this.getAll()
    return allItems.filter(item => item.category === category)
  },

  // Get low stock items
  async getLowStockItems() {
    const allItems = await this.getAll()
    return allItems.filter(item => item.currentStock <= item.restockThreshold)
  },

  // Get critical stock items (out of stock)
  async getCriticalStockItems() {
    const allItems = await this.getAll()
    return allItems.filter(item => item.currentStock === 0)
  },

  // Get expiring items within days
  async getExpiringItems(days = 7) {
    const allItems = await this.getAll()
    const now = new Date()
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)

    return allItems.filter(item => {
      if (!item.expirationDate) return false
      const expiryDate = new Date(item.expirationDate)
      return expiryDate >= now && expiryDate <= futureDate
    })
  },

  // Get expired items
  async getExpiredItems() {
    const allItems = await this.getAll()
    const now = new Date()

    return allItems.filter(item => {
      if (!item.expirationDate) return false
      const expiryDate = new Date(item.expirationDate)
      return expiryDate < now
    })
  },

  // Search items
  async search(query) {
    const allItems = await this.getAll()
    const searchTerm = query.toLowerCase()

    return allItems.filter(item =>
      item.name.toLowerCase().includes(searchTerm) ||
      item.description?.toLowerCase().includes(searchTerm) ||
      item.category.toLowerCase().includes(searchTerm) ||
      item.location?.toLowerCase().includes(searchTerm)
    )
  },

  // Get items by supplier name
  async getItemsBySupplier(supplierName) {
    const allItems = await this.getAll()
    if (!supplierName) return []

    // Import supplierApi to get supplier details
    const supplierApi = (await import('./supplierApi.js')).default
    const allSuppliers = await supplierApi.getAll()

    // Find supplier IDs that match the supplier name
    const matchingSupplierIds = allSuppliers
      .filter(s => s.name?.toLowerCase() === supplierName.toLowerCase())
      .map(s => s.id)

    // Filter items that match either by supplier name or supplier ID
    return allItems.filter(item => {
      // Check if supplier field matches the name directly (old format)
      const matchesByName =
        item.supplier?.toLowerCase() === supplierName.toLowerCase() ||
        item.supplierName?.toLowerCase() === supplierName.toLowerCase()

      // Check if supplier field is an ID that matches (new format)
      const matchesById = matchingSupplierIds.includes(item.supplier)

      return matchesByName || matchesById
    })
  },

  // Get assets by room ID or room number
  async getAssetsByRoom(roomId, roomNumber = null) {
    if (!useFirebase) {
      return []
    }

    try {
      const allItems = await this.getAll()
      return allItems.filter(item => {
        // Check if it's an asset instance
        if (item.type !== 'asset-instance') {
          return false
        }
        
        // Match by roomId (exact match)
        if (item.roomId === roomId) {
          return true
        }
        
        // Also match by room number/name (for backward compatibility)
        if (roomNumber && item.room === roomNumber) {
          return true
        }
        
        return false
      })
    } catch (error) {
      console.error('Error fetching assets by room:', error)
      return []
    }
  },

  // Create asset instance (references a master item but tracks individual unit)
  async createAssetInstance(masterItemId, assetData) {
    if (!useFirebase) {
      return null
    }

    try {
      // Get the master item
      const masterItem = await this.getById(masterItemId)
      if (!masterItem) {
        throw new Error('Master item not found')
      }

      // Create asset instance with reference to master item
      const assetInstance = {
        ...assetData,
        masterItemId: masterItemId,
        masterItemName: masterItem.name,
        type: 'asset-instance',
        category: masterItem.category,
        imageUrl: masterItem.imageUrl || assetData.imageUrl,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      const newAsset = await firebaseDB.createInventoryItem(assetInstance)
      
      await firebaseDB.logActivity({
        type: 'ASSIGN_ASSET',
        itemId: newAsset.id,
        itemName: newAsset.masterItemName,
        details: `Assigned to ${assetData.room}`,
        userRole: 'inventory-controller'
      })

      return newAsset
    } catch (error) {
      console.error('Error creating asset instance:', error)
      throw error
    }
  }
}

export default inventoryApi