// Menu API using Firebase Realtime Database
import firebaseDB, { database } from './firebase'
import { mockInventoryItems } from './mockData'

// Check if Firebase is properly configured and initialized
const useFirebase = database !== null

// Debug logging
if (typeof window !== 'undefined') {
  console.log('🔥 Menu Firebase Status:', useFirebase ? 'Connected' : 'Not configured - using mock data')
}

export const menuApi = {
  // Get all menu items
  async getAll() {
    if (!useFirebase) {
      // Return mock menu items from inventory
      return mockInventoryItems
        .filter(item => item.category === 'menu-items')
        .map(item => ({
          ...item,
          isAvailable: item.currentStock > 0,
          requiredIngredients: getRequiredIngredients(item.id),
          category: getMenuCategory(item.name),
          preparationTime: getPreparationTime(item.name)
        }))
    }

    try {
      const menuItems = await firebaseDB.read('menu')
      if (!menuItems || menuItems.length === 0) {
        // Initialize with default menu items if none exist
        await this.initializeDefaultMenuItems()
        return await firebaseDB.read('menu')
      }
      return menuItems || []
    } catch (error) {
      console.error('Error fetching menu items:', error)
      // Fallback to mock data
      return mockInventoryItems
        .filter(item => item.category === 'menu-items')
        .map(item => ({
          ...item,
          isAvailable: item.currentStock > 0,
          requiredIngredients: getRequiredIngredients(item.id),
          category: getMenuCategory(item.name),
          preparationTime: getPreparationTime(item.name)
        }))
    }
  },

  // Get single menu item by ID
  async getById(id) {
    if (!useFirebase) {
      const item = mockInventoryItems.find(item => item.id === id && item.category === 'menu-items')
      if (item) {
        return {
          ...item,
          isAvailable: item.currentStock > 0,
          requiredIngredients: getRequiredIngredients(item.id),
          category: getMenuCategory(item.name),
          preparationTime: getPreparationTime(item.name)
        }
      }
      return null
    }

    try {
      return await firebaseDB.readById('menu', id)
    } catch (error) {
      console.error('Error fetching menu item:', error)
      return null
    }
  },

  // Create new menu item
  async create(menuItemData) {
    if (!useFirebase) {
      // For mock data, just add to the array (this won't persist)
      const newItem = {
        ...menuItemData,
        id: `menu-${Date.now()}`,
        category: 'menu-items',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      const menuIndex = mockInventoryItems.findIndex(item => item.category === 'menu-items')
      if (menuIndex >= 0) {
        mockInventoryItems.splice(menuIndex, 0, newItem)
      } else {
        mockInventoryItems.push(newItem)
      }
      return newItem
    }

    try {
      const menuData = {
        ...menuItemData,
        category: 'menu-items',
        isAvailable: menuItemData.isAvailable !== undefined ? menuItemData.isAvailable : true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      return await firebaseDB.create('menu', menuData)
    } catch (error) {
      console.error('Error creating menu item:', error)
      throw error
    }
  },

  // Update menu item
  async update(id, menuItemData) {
    if (!useFirebase) {
      // For mock data, find and update the item
      const index = mockInventoryItems.findIndex(item => item.id === id)
      if (index !== -1) {
        mockInventoryItems[index] = {
          ...mockInventoryItems[index],
          ...menuItemData,
          updatedAt: new Date()
        }
        return mockInventoryItems[index]
      }
      throw new Error('Menu item not found')
    }

    try {
      const updateData = {
        ...menuItemData,
        updatedAt: new Date().toISOString()
      }
      return await firebaseDB.update('menu', id, updateData)
    } catch (error) {
      console.error('Error updating menu item:', error)
      throw error
    }
  },

  // Update menu item availability (toggle on/off)
  async updateAvailability(id, isAvailable) {
    return await this.update(id, { isAvailable })
  },

  // Delete menu item
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
      return await firebaseDB.delete('menu', id)
    } catch (error) {
      console.error('Error deleting menu item:', error)
      throw error
    }
  },

  // Real-time listener for menu changes
  onMenuChange(callback) {
    if (!useFirebase) {
      // For mock data, return a no-op function
      callback([])
      return () => {}
    }

    return firebaseDB.onValue('menu', callback)
  },

  // Get menu items by availability
  async getByAvailability(isAvailable) {
    const allItems = await this.getAll()
    return allItems.filter(item => item.isAvailable === isAvailable)
  },

  // Get available menu items
  async getAvailableItems() {
    return await this.getByAvailability(true)
  },

  // Get unavailable menu items
  async getUnavailableItems() {
    return await this.getByAvailability(false)
  },

  // Get menu items by category
  async getByCategory(category) {
    const allItems = await this.getAll()
    return allItems.filter(item => item.category === category)
  },

  // Initialize default menu items if none exist
  async initializeDefaultMenuItems() {
    if (!useFirebase) return

    try {
      const existingItems = await firebaseDB.read('menu')
      if (!existingItems || existingItems.length === 0) {
        const defaultItems = [
          {
            id: 'menu-001',
            name: 'Premium Coffee Beans',
            description: 'Arabica coffee beans for breakfast service',
            category: 'beverage',
            currentStock: 15,
            unit: 'kg',
            restockThreshold: 20,
            maxStock: 100,
            location: 'Kitchen Storage',
            supplier: 'Coffee Roasters Ltd',
            cost: 1275.00,
            isAvailable: true,
            preparationTime: 5,
            requiredIngredients: [
              { ingredientId: 'menu-001', quantityRequired: 0.05, unit: 'kg', isCritical: true }
            ]
          },
          {
            id: 'menu-002',
            name: 'Fresh Salmon Fillets',
            description: 'Atlantic salmon for dinner menu',
            category: 'main-course',
            currentStock: 0,
            unit: 'kg',
            restockThreshold: 5,
            maxStock: 25,
            location: 'Walk-in Freezer',
            supplier: 'Ocean Fresh Seafood',
            cost: 2250.00,
            isAvailable: false,
            preparationTime: 25,
            requiredIngredients: [
              { ingredientId: 'menu-002', quantityRequired: 0.2, unit: 'kg', isCritical: true }
            ]
          },
          {
            id: 'menu-003',
            name: 'Organic Vegetables Mix',
            description: 'Seasonal vegetables for side dishes',
            category: 'appetizer',
            currentStock: 8,
            unit: 'kg',
            restockThreshold: 10,
            maxStock: 30,
            location: 'Cold Storage',
            supplier: 'Green Valley Farms',
            cost: 637.50,
            isAvailable: true,
            preparationTime: 15,
            requiredIngredients: [
              { ingredientId: 'menu-003', quantityRequired: 0.15, unit: 'kg', isCritical: true }
            ]
          },
          {
            id: 'menu-004',
            name: 'Wagyu Beef Steaks',
            description: 'Premium wagyu beef for signature dishes',
            category: 'main-course',
            currentStock: 12,
            unit: 'kg',
            restockThreshold: 8,
            maxStock: 20,
            location: 'Walk-in Freezer',
            supplier: 'Premium Meats Co',
            cost: 6000.00,
            isAvailable: true,
            preparationTime: 35,
            requiredIngredients: [
              { ingredientId: 'menu-004', quantityRequired: 0.25, unit: 'kg', isCritical: true }
            ]
          },
          {
            id: 'menu-005',
            name: 'Fresh Pasta',
            description: 'House-made pasta for Italian dishes',
            category: 'main-course',
            currentStock: 5,
            unit: 'kg',
            restockThreshold: 10,
            maxStock: 25,
            location: 'Kitchen Storage',
            supplier: 'Artisan Pasta Co',
            cost: 925.00,
            isAvailable: true,
            preparationTime: 20,
            requiredIngredients: [
              { ingredientId: 'menu-005', quantityRequired: 0.15, unit: 'kg', isCritical: true }
            ]
          }
        ]

        // Create all default items
        for (const item of defaultItems) {
          await firebaseDB.create('menu', item)
        }
      }
    } catch (error) {
      console.error('Error initializing default menu items:', error)
    }
  },

  // Search menu items
  async search(query) {
    const allItems = await this.getAll()
    const searchTerm = query.toLowerCase()

    return allItems.filter(item =>
      item.name.toLowerCase().includes(searchTerm) ||
      item.description?.toLowerCase().includes(searchTerm) ||
      item.category.toLowerCase().includes(searchTerm)
    )
  }
}

// Helper functions (same as in the menu page)
function getRequiredIngredients(menuItemId) {
  const ingredientMap = {
    'menu-001': [
      { ingredientId: 'menu-001', quantityRequired: 0.05, unit: 'kg', isCritical: true }
    ],
    'menu-002': [
      { ingredientId: 'menu-002', quantityRequired: 0.2, unit: 'kg', isCritical: true },
      { ingredientId: 'menu-003', quantityRequired: 0.1, unit: 'kg', isCritical: false }
    ],
    'menu-003': [
      { ingredientId: 'menu-003', quantityRequired: 0.15, unit: 'kg', isCritical: true }
    ],
    'menu-004': [
      { ingredientId: 'menu-004', quantityRequired: 0.25, unit: 'kg', isCritical: true },
      { ingredientId: 'menu-003', quantityRequired: 0.1, unit: 'kg', isCritical: false }
    ],
    'menu-005': [
      { ingredientId: 'menu-005', quantityRequired: 0.15, unit: 'kg', isCritical: true }
    ]
  }

  return ingredientMap[menuItemId] || []
}

function getMenuCategory(itemName) {
  if (itemName.toLowerCase().includes('coffee')) return 'beverage'
  if (itemName.toLowerCase().includes('salmon') || itemName.toLowerCase().includes('wagyu') || itemName.toLowerCase().includes('beef')) return 'main-course'
  if (itemName.toLowerCase().includes('vegetables')) return 'appetizer'
  if (itemName.toLowerCase().includes('pasta')) return 'main-course'
  if (itemName.toLowerCase().includes('truffle')) return 'appetizer'
  return 'main-course'
}

function getPreparationTime(itemName) {
  if (itemName.toLowerCase().includes('coffee')) return 5
  if (itemName.toLowerCase().includes('salmon')) return 25
  if (itemName.toLowerCase().includes('vegetables')) return 15
  if (itemName.toLowerCase().includes('wagyu') || itemName.toLowerCase().includes('beef')) return 35
  if (itemName.toLowerCase().includes('pasta')) return 20
  if (itemName.toLowerCase().includes('truffle')) return 10
  return 20
}

export default menuApi