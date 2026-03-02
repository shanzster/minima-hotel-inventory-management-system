// Seed 10 inventory items with stock (2 items per category)
// This follows the system structure to avoid bugs

import inventoryApi from './inventoryApi'

export const seedItemsWithStock = [
  // TOILETRIES (2 items)
  {
    name: 'Shampoo 30ml',
    description: 'Hotel shampoo bottles for guest rooms',
    category: 'toiletries',
    type: 'consumable',
    variant: '30ml',
    unit: 'bottles',
    currentStock: 250,
    restockThreshold: 100,
    maxStock: 500,
    location: 'Housekeeping Storage',
    supplier: '',
    cost: 15,
    notes: 'Guest bathroom amenity',
    imageUrl: '',
    isActive: true
  },
  {
    name: 'Bath Towel',
    description: 'Large white cotton bath towels',
    category: 'toiletries',
    type: 'consumable',
    variant: 'White',
    unit: 'pcs',
    currentStock: 180,
    restockThreshold: 100,
    maxStock: 500,
    location: 'Linen Storage',
    supplier: '',
    cost: 150,
    notes: 'Bathroom linen',
    imageUrl: '',
    isActive: true
  },

  // FOOD & BEVERAGE (2 items)
  {
    name: 'Bottled Water 500ml',
    description: 'Complimentary bottled water for guest rooms',
    category: 'food-beverage',
    type: 'consumable',
    variant: '500ml',
    unit: 'bottles',
    currentStock: 450,
    restockThreshold: 200,
    maxStock: 1000,
    location: 'Kitchen Storage',
    supplier: '',
    cost: 15,
    notes: 'Room amenity',
    imageUrl: '',
    isActive: true
  },
  {
    name: 'Coffee Ground 250g',
    description: 'Premium ground coffee for breakfast service',
    category: 'food-beverage',
    type: 'consumable',
    variant: '250g',
    unit: 'packs',
    currentStock: 75,
    restockThreshold: 30,
    maxStock: 150,
    location: 'Kitchen Storage',
    supplier: '',
    cost: 180,
    notes: 'Breakfast beverage',
    imageUrl: '',
    isActive: true
  },

  // CLEANING SUPPLIES (2 items)
  {
    name: 'All-Purpose Cleaner 1L',
    description: 'Multi-surface cleaning solution',
    category: 'cleaning-supplies',
    type: 'consumable',
    variant: '1L',
    unit: 'bottles',
    currentStock: 45,
    restockThreshold: 20,
    maxStock: 100,
    location: 'Housekeeping Storage',
    supplier: '',
    cost: 120,
    notes: 'General room cleaning',
    imageUrl: '',
    isActive: true
  },
  {
    name: 'Disinfectant Spray 400ml',
    description: 'Surface disinfectant spray for sanitization',
    category: 'cleaning-supplies',
    type: 'consumable',
    variant: '400ml',
    unit: 'cans',
    currentStock: 85,
    restockThreshold: 30,
    maxStock: 150,
    location: 'Housekeeping Storage',
    supplier: '',
    cost: 180,
    notes: 'Room sanitization',
    imageUrl: '',
    isActive: true
  },

  // OFFICE SUPPLIES (2 items)
  {
    name: 'Hotel Notepad A5',
    description: 'Hotel branded notepad for guest rooms',
    category: 'office-supplies',
    type: 'consumable',
    variant: 'A5',
    unit: 'pcs',
    currentStock: 120,
    restockThreshold: 50,
    maxStock: 300,
    location: 'Office Storage',
    supplier: '',
    cost: 25,
    notes: 'Room stationery',
    imageUrl: '',
    isActive: true
  },
  {
    name: 'Key Card RFID',
    description: 'RFID room key cards',
    category: 'office-supplies',
    type: 'consumable',
    variant: 'Blank',
    unit: 'pcs',
    currentStock: 280,
    restockThreshold: 100,
    maxStock: 500,
    location: 'Front Desk',
    supplier: '',
    cost: 35,
    notes: 'Room access cards',
    imageUrl: '',
    isActive: true
  },

  // KITCHEN CONSUMABLES (2 items)
  {
    name: 'Cooking Oil 1L',
    description: 'Vegetable cooking oil for kitchen use',
    category: 'kitchen-consumables',
    type: 'consumable',
    variant: '1L',
    unit: 'bottles',
    currentStock: 35,
    restockThreshold: 15,
    maxStock: 80,
    location: 'Kitchen Storage',
    supplier: '',
    cost: 95,
    notes: 'Kitchen cooking supplies',
    imageUrl: '',
    isActive: true
  },
  {
    name: 'Salt 1kg',
    description: 'Iodized table salt for cooking',
    category: 'kitchen-consumables',
    type: 'consumable',
    variant: '1kg',
    unit: 'packs',
    currentStock: 22,
    restockThreshold: 10,
    maxStock: 50,
    location: 'Kitchen Storage',
    supplier: '',
    cost: 45,
    notes: 'Kitchen seasoning',
    imageUrl: '',
    isActive: true
  }
]

// Function to seed the database with items that have stock
export async function seedInventoryWithStock() {
  console.log('🌱 Starting inventory seed with stock...')
  console.log('🗑️  Clearing existing inventory...')
  
  // Delete all existing items first
  try {
    const existingItems = await inventoryApi.getAll()
    let deletedCount = 0
    
    for (const item of existingItems) {
      try {
        await inventoryApi.delete(item.id)
        deletedCount++
      } catch (error) {
        console.error(`Failed to delete ${item.name}:`, error.message)
      }
    }
    
    console.log(`✅ Deleted ${deletedCount} existing items`)
  } catch (error) {
    console.error('Error clearing inventory:', error)
  }
  
  console.log('📦 Adding new items with stock...')
  let successCount = 0
  let errorCount = 0
  const errors = []

  for (const item of seedItemsWithStock) {
    try {
      // Create the item with stock already set
      const newItem = await inventoryApi.create({
        ...item,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      
      successCount++
      console.log(`✅ Added: ${item.name} (Stock: ${item.currentStock} ${item.unit})`)
    } catch (error) {
      errorCount++
      errors.push({ item: item.name, error: error.message })
      console.error(`❌ Failed to add ${item.name}:`, error.message)
    }
  }

  console.log('\n📊 Seed Summary:')
  console.log(`✅ Success: ${successCount} items`)
  console.log(`❌ Errors: ${errorCount} items`)
  console.log(`📦 Total: ${seedItemsWithStock.length} items`)
  
  if (errors.length > 0) {
    console.log('\n⚠️ Error Details:')
    errors.forEach(({ item, error }) => {
      console.log(`  - ${item}: ${error}`)
    })
  }
  
  return { 
    successCount, 
    errorCount, 
    total: seedItemsWithStock.length,
    errors 
  }
}

export default seedInventoryWithStock
