// Seed data for inventory master list
// Run this once to populate your inventory with common hotel items

import inventoryApi from './inventoryApi'

export const seedInventoryItems = [
  // EQUIPMENT - Electronics
  {
    name: 'Samsung 55" Smart TV',
    description: '55-inch 4K UHD Smart LED TV with HDR',
    category: 'equipment',
    type: 'asset',
    brand: 'Samsung',
    model: 'UN55',
    location: 'Electronics Storage',
    supplier: '',
    cost: 25000,
    notes: 'Standard room TV',
    imageUrl: ''
  },
  {
    name: 'LG 43" LED TV',
    description: '43-inch Full HD LED TV',
    category: 'equipment',
    type: 'asset',
    brand: 'LG',
    model: '43LM',
    location: 'Electronics Storage',
    supplier: '',
    cost: 18000,
    notes: 'Budget room TV',
    imageUrl: ''
  },
  {
    name: 'Split Type Air Conditioner',
    description: '1.5HP Inverter Split Type AC',
    category: 'equipment',
    type: 'asset',
    brand: 'Carrier',
    model: 'X-Power Gold',
    location: 'Equipment Storage',
    supplier: '',
    cost: 35000,
    notes: 'Standard room AC unit',
    imageUrl: ''
  },
  {
    name: 'Mini Refrigerator',
    description: 'Compact mini fridge for guest rooms',
    category: 'equipment',
    type: 'asset',
    brand: 'Condura',
    model: 'BC-46',
    location: 'Equipment Storage',
    supplier: '',
    cost: 8500,
    notes: 'In-room mini bar',
    imageUrl: ''
  },
  {
    name: 'Electric Kettle',
    description: '1.7L stainless steel electric kettle',
    category: 'equipment',
    type: 'asset',
    brand: 'Philips',
    model: 'HD9350',
    location: 'Equipment Storage',
    supplier: '',
    cost: 1200,
    notes: 'For tea/coffee service',
    imageUrl: ''
  },
  {
    name: 'Hair Dryer',
    description: 'Wall-mounted hair dryer 1200W',
    category: 'equipment',
    type: 'asset',
    brand: 'Panasonic',
    model: 'EH-ND30',
    location: 'Equipment Storage',
    supplier: '',
    cost: 1500,
    notes: 'Bathroom amenity',
    imageUrl: ''
  },
  {
    name: 'Digital Safe',
    description: 'Electronic digital safe for guest valuables',
    category: 'equipment',
    type: 'asset',
    brand: 'Yale',
    model: 'YSS/200',
    location: 'Equipment Storage',
    supplier: '',
    cost: 4500,
    notes: 'In-room security',
    imageUrl: ''
  },
  {
    name: 'Telephone Set',
    description: 'Corded desk telephone',
    category: 'equipment',
    type: 'asset',
    brand: 'Panasonic',
    model: 'KX-TS500',
    location: 'Equipment Storage',
    supplier: '',
    cost: 800,
    notes: 'Room phone',
    imageUrl: ''
  },

  // FURNITURE
  {
    name: 'Queen Size Bed Frame',
    description: 'Wooden queen size bed frame with headboard',
    category: 'furniture',
    type: 'asset',
    brand: 'Mandaue Foam',
    model: 'QBF-2024',
    location: 'Furniture Storage',
    supplier: '',
    cost: 15000,
    notes: 'Standard room bed',
    imageUrl: ''
  },
  {
    name: 'King Size Bed Frame',
    description: 'Premium king size bed frame',
    category: 'furniture',
    type: 'asset',
    brand: 'Mandaue Foam',
    model: 'KBF-2024',
    location: 'Furniture Storage',
    supplier: '',
    cost: 22000,
    notes: 'Deluxe room bed',
    imageUrl: ''
  },
  {
    name: 'Bedside Table',
    description: 'Wooden bedside table with drawer',
    category: 'furniture',
    type: 'asset',
    brand: 'SM Home',
    model: 'BST-100',
    location: 'Furniture Storage',
    supplier: '',
    cost: 2500,
    notes: 'Pair per room',
    imageUrl: ''
  },
  {
    name: 'Work Desk',
    description: 'Wooden work desk with chair',
    category: 'furniture',
    type: 'asset',
    brand: 'SM Home',
    model: 'WD-200',
    location: 'Furniture Storage',
    supplier: '',
    cost: 5500,
    notes: 'Study/work area',
    imageUrl: ''
  },
  {
    name: 'Wardrobe Cabinet',
    description: 'Wooden wardrobe with hanging space',
    category: 'furniture',
    type: 'asset',
    brand: 'SM Home',
    model: 'WC-300',
    location: 'Furniture Storage',
    supplier: '',
    cost: 8000,
    notes: 'Clothes storage',
    imageUrl: ''
  },
  {
    name: 'Lounge Chair',
    description: 'Upholstered lounge chair',
    category: 'furniture',
    type: 'asset',
    brand: 'SM Home',
    model: 'LC-150',
    location: 'Furniture Storage',
    supplier: '',
    cost: 4000,
    notes: 'Reading area',
    imageUrl: ''
  },

  // TOILETRIES
  {
    name: 'Shampoo',
    description: 'Hotel shampoo 30ml bottles',
    category: 'toiletries',
    type: 'consumable',
    variant: '30ml',
    unit: 'bottles',
    restockThreshold: 100,
    maxStock: 500,
    location: 'Housekeeping Storage',
    supplier: '',
    cost: 15,
    notes: 'Guest amenity',
    imageUrl: ''
  },
  {
    name: 'Conditioner',
    description: 'Hotel conditioner 30ml bottles',
    category: 'toiletries',
    type: 'consumable',
    variant: '30ml',
    unit: 'bottles',
    restockThreshold: 100,
    maxStock: 500,
    location: 'Housekeeping Storage',
    supplier: '',
    cost: 15,
    notes: 'Guest amenity',
    imageUrl: ''
  },
  {
    name: 'Body Wash',
    description: 'Hotel body wash 30ml bottles',
    category: 'toiletries',
    type: 'consumable',
    variant: '30ml',
    unit: 'bottles',
    restockThreshold: 100,
    maxStock: 500,
    location: 'Housekeeping Storage',
    supplier: '',
    cost: 15,
    notes: 'Guest amenity',
    imageUrl: ''
  },
  {
    name: 'Soap Bar',
    description: 'Individually wrapped soap bars',
    category: 'toiletries',
    type: 'consumable',
    variant: '50g',
    unit: 'pcs',
    restockThreshold: 200,
    maxStock: 1000,
    location: 'Housekeeping Storage',
    supplier: '',
    cost: 8,
    notes: 'Guest amenity',
    imageUrl: ''
  },
  {
    name: 'Toothbrush',
    description: 'Disposable toothbrush with toothpaste',
    category: 'toiletries',
    type: 'consumable',
    variant: 'Standard',
    unit: 'sets',
    restockThreshold: 150,
    maxStock: 800,
    location: 'Housekeeping Storage',
    supplier: '',
    cost: 12,
    notes: 'Guest amenity kit',
    imageUrl: ''
  },
  {
    name: 'Dental Kit',
    description: 'Toothbrush and toothpaste set',
    category: 'toiletries',
    type: 'consumable',
    variant: 'Premium',
    unit: 'sets',
    restockThreshold: 100,
    maxStock: 500,
    location: 'Housekeeping Storage',
    supplier: '',
    cost: 20,
    notes: 'Premium rooms',
    imageUrl: ''
  },
  {
    name: 'Shower Cap',
    description: 'Disposable shower caps',
    category: 'toiletries',
    type: 'consumable',
    variant: 'Standard',
    unit: 'pcs',
    restockThreshold: 200,
    maxStock: 1000,
    location: 'Housekeeping Storage',
    supplier: '',
    cost: 3,
    notes: 'Guest amenity',
    imageUrl: ''
  },
  {
    name: 'Cotton Buds',
    description: 'Cotton swabs in dispenser',
    category: 'toiletries',
    type: 'consumable',
    variant: '100pcs',
    unit: 'boxes',
    restockThreshold: 50,
    maxStock: 300,
    location: 'Housekeeping Storage',
    supplier: '',
    cost: 25,
    notes: 'Bathroom amenity',
    imageUrl: ''
  },
  {
    name: 'Facial Tissue',
    description: 'Box of facial tissues',
    category: 'toiletries',
    type: 'consumable',
    variant: '200 pulls',
    unit: 'boxes',
    restockThreshold: 100,
    maxStock: 500,
    location: 'Housekeeping Storage',
    supplier: '',
    cost: 35,
    notes: 'Room amenity',
    imageUrl: ''
  },
  {
    name: 'Toilet Paper',
    description: '2-ply toilet tissue rolls',
    category: 'toiletries',
    type: 'consumable',
    variant: '2-ply',
    unit: 'rolls',
    restockThreshold: 200,
    maxStock: 1000,
    location: 'Housekeeping Storage',
    supplier: '',
    cost: 18,
    notes: 'Bathroom essential',
    imageUrl: ''
  },
  {
    name: 'Hand Towel',
    description: 'White cotton hand towels',
    category: 'toiletries',
    type: 'consumable',
    variant: 'White',
    unit: 'pcs',
    restockThreshold: 100,
    maxStock: 500,
    location: 'Linen Storage',
    supplier: '',
    cost: 80,
    notes: 'Bathroom linen',
    imageUrl: ''
  },
  {
    name: 'Bath Towel',
    description: 'Large white cotton bath towels',
    category: 'toiletries',
    type: 'consumable',
    variant: 'White',
    unit: 'pcs',
    restockThreshold: 100,
    maxStock: 500,
    location: 'Linen Storage',
    supplier: '',
    cost: 150,
    notes: 'Bathroom linen',
    imageUrl: ''
  },
  {
    name: 'Face Towel',
    description: 'Small white cotton face towels',
    category: 'toiletries',
    type: 'consumable',
    variant: 'White',
    unit: 'pcs',
    restockThreshold: 100,
    maxStock: 500,
    location: 'Linen Storage',
    supplier: '',
    cost: 50,
    notes: 'Bathroom linen',
    imageUrl: ''
  },
  {
    name: 'Bed Sheet Set',
    description: 'Queen size bed sheet set (fitted, flat, pillowcases)',
    category: 'toiletries',
    type: 'consumable',
    variant: 'Queen',
    unit: 'sets',
    restockThreshold: 50,
    maxStock: 200,
    location: 'Linen Storage',
    supplier: '',
    cost: 800,
    notes: 'Room linen',
    imageUrl: ''
  },
  {
    name: 'Pillow',
    description: 'Standard bed pillow',
    category: 'toiletries',
    type: 'consumable',
    variant: 'Standard',
    unit: 'pcs',
    restockThreshold: 50,
    maxStock: 300,
    location: 'Linen Storage',
    supplier: '',
    cost: 250,
    notes: 'Bedding',
    imageUrl: ''
  },
  {
    name: 'Duvet/Comforter',
    description: 'Queen size duvet with cover',
    category: 'toiletries',
    type: 'consumable',
    variant: 'Queen',
    unit: 'pcs',
    restockThreshold: 30,
    maxStock: 150,
    location: 'Linen Storage',
    supplier: '',
    cost: 1200,
    notes: 'Bedding',
    imageUrl: ''
  },

  // CLEANING SUPPLIES
  {
    name: 'All-Purpose Cleaner',
    description: 'Multi-surface cleaning solution',
    category: 'cleaning-supplies',
    type: 'consumable',
    variant: '1L',
    unit: 'bottles',
    restockThreshold: 20,
    maxStock: 100,
    location: 'Housekeeping Storage',
    supplier: '',
    cost: 120,
    notes: 'General cleaning',
    imageUrl: ''
  },
  {
    name: 'Glass Cleaner',
    description: 'Window and mirror cleaner',
    category: 'cleaning-supplies',
    type: 'consumable',
    variant: '500ml',
    unit: 'bottles',
    restockThreshold: 15,
    maxStock: 80,
    location: 'Housekeeping Storage',
    supplier: '',
    cost: 85,
    notes: 'Glass surfaces',
    imageUrl: ''
  },
  {
    name: 'Bathroom Cleaner',
    description: 'Disinfectant bathroom cleaner',
    category: 'cleaning-supplies',
    type: 'consumable',
    variant: '1L',
    unit: 'bottles',
    restockThreshold: 20,
    maxStock: 100,
    location: 'Housekeeping Storage',
    supplier: '',
    cost: 150,
    notes: 'Bathroom sanitation',
    imageUrl: ''
  },
  {
    name: 'Floor Cleaner',
    description: 'Floor cleaning solution',
    category: 'cleaning-supplies',
    type: 'consumable',
    variant: '4L',
    unit: 'bottles',
    restockThreshold: 10,
    maxStock: 50,
    location: 'Housekeeping Storage',
    supplier: '',
    cost: 280,
    notes: 'Floor maintenance',
    imageUrl: ''
  },
  {
    name: 'Disinfectant Spray',
    description: 'Surface disinfectant spray',
    category: 'cleaning-supplies',
    type: 'consumable',
    variant: '400ml',
    unit: 'cans',
    restockThreshold: 30,
    maxStock: 150,
    location: 'Housekeeping Storage',
    supplier: '',
    cost: 180,
    notes: 'Sanitization',
    imageUrl: ''
  },
  {
    name: 'Trash Bags',
    description: 'Heavy duty garbage bags',
    category: 'cleaning-supplies',
    type: 'consumable',
    variant: 'Large',
    unit: 'rolls',
    restockThreshold: 20,
    maxStock: 100,
    location: 'Housekeeping Storage',
    supplier: '',
    cost: 120,
    notes: 'Waste management',
    imageUrl: ''
  },
  {
    name: 'Microfiber Cloth',
    description: 'Reusable cleaning cloths',
    category: 'cleaning-supplies',
    type: 'consumable',
    variant: 'Standard',
    unit: 'pcs',
    restockThreshold: 50,
    maxStock: 200,
    location: 'Housekeeping Storage',
    supplier: '',
    cost: 35,
    notes: 'Cleaning supplies',
    imageUrl: ''
  },
  {
    name: 'Mop Head',
    description: 'Replacement mop heads',
    category: 'cleaning-supplies',
    type: 'consumable',
    variant: 'Standard',
    unit: 'pcs',
    restockThreshold: 10,
    maxStock: 50,
    location: 'Housekeeping Storage',
    supplier: '',
    cost: 150,
    notes: 'Floor cleaning',
    imageUrl: ''
  },

  // FOOD & BEVERAGE
  {
    name: 'Coffee (Ground)',
    description: 'Premium ground coffee',
    category: 'food-beverage',
    type: 'consumable',
    variant: '250g',
    unit: 'packs',
    restockThreshold: 30,
    maxStock: 150,
    location: 'Kitchen Storage',
    supplier: '',
    cost: 180,
    notes: 'Breakfast service',
    imageUrl: ''
  },
  {
    name: 'Tea Bags',
    description: 'Assorted tea bags',
    category: 'food-beverage',
    type: 'consumable',
    variant: 'Box of 100',
    unit: 'boxes',
    restockThreshold: 20,
    maxStock: 100,
    location: 'Kitchen Storage',
    supplier: '',
    cost: 250,
    notes: 'Beverage service',
    imageUrl: ''
  },
  {
    name: 'Sugar Sachets',
    description: 'Individual sugar packets',
    category: 'food-beverage',
    type: 'consumable',
    variant: '5g',
    unit: 'boxes',
    restockThreshold: 50,
    maxStock: 300,
    location: 'Kitchen Storage',
    supplier: '',
    cost: 120,
    notes: 'Beverage condiment',
    imageUrl: ''
  },
  {
    name: 'Creamer Sachets',
    description: 'Coffee creamer packets',
    category: 'food-beverage',
    type: 'consumable',
    variant: '3g',
    unit: 'boxes',
    restockThreshold: 50,
    maxStock: 300,
    location: 'Kitchen Storage',
    supplier: '',
    cost: 150,
    notes: 'Beverage condiment',
    imageUrl: ''
  },
  {
    name: 'Bottled Water',
    description: 'Complimentary bottled water',
    category: 'food-beverage',
    type: 'consumable',
    variant: '500ml',
    unit: 'bottles',
    restockThreshold: 200,
    maxStock: 1000,
    location: 'Kitchen Storage',
    supplier: '',
    cost: 15,
    notes: 'Room amenity',
    imageUrl: ''
  },
  {
    name: 'Instant Noodles',
    description: 'Cup noodles for minibar',
    category: 'food-beverage',
    type: 'consumable',
    variant: 'Assorted',
    unit: 'cups',
    restockThreshold: 100,
    maxStock: 500,
    location: 'Kitchen Storage',
    supplier: '',
    cost: 25,
    notes: 'Minibar item',
    imageUrl: ''
  },
  {
    name: 'Potato Chips',
    description: 'Snack chips for minibar',
    category: 'food-beverage',
    type: 'consumable',
    variant: 'Assorted',
    unit: 'packs',
    restockThreshold: 100,
    maxStock: 500,
    location: 'Kitchen Storage',
    supplier: '',
    cost: 35,
    notes: 'Minibar snack',
    imageUrl: ''
  },
  {
    name: 'Chocolate Bar',
    description: 'Chocolate bars for minibar',
    category: 'food-beverage',
    type: 'consumable',
    variant: 'Assorted',
    unit: 'pcs',
    restockThreshold: 100,
    maxStock: 500,
    location: 'Kitchen Storage',
    supplier: '',
    cost: 45,
    notes: 'Minibar item',
    imageUrl: ''
  },

  // OFFICE SUPPLIES
  {
    name: 'Notepad',
    description: 'Hotel branded notepad',
    category: 'office-supplies',
    type: 'consumable',
    variant: 'A5',
    unit: 'pcs',
    restockThreshold: 50,
    maxStock: 300,
    location: 'Office Storage',
    supplier: '',
    cost: 25,
    notes: 'Room stationery',
    imageUrl: ''
  },
  {
    name: 'Pen',
    description: 'Hotel branded ballpoint pen',
    category: 'office-supplies',
    type: 'consumable',
    variant: 'Blue',
    unit: 'pcs',
    restockThreshold: 100,
    maxStock: 500,
    location: 'Office Storage',
    supplier: '',
    cost: 8,
    notes: 'Room stationery',
    imageUrl: ''
  },
  {
    name: 'Do Not Disturb Sign',
    description: 'Door hanger sign',
    category: 'office-supplies',
    type: 'consumable',
    variant: 'Standard',
    unit: 'pcs',
    restockThreshold: 50,
    maxStock: 200,
    location: 'Office Storage',
    supplier: '',
    cost: 15,
    notes: 'Room accessory',
    imageUrl: ''
  },
  {
    name: 'Laundry Bag',
    description: 'Guest laundry bag with form',
    category: 'office-supplies',
    type: 'consumable',
    variant: 'Standard',
    unit: 'pcs',
    restockThreshold: 50,
    maxStock: 300,
    location: 'Office Storage',
    supplier: '',
    cost: 20,
    notes: 'Laundry service',
    imageUrl: ''
  },
  {
    name: 'Key Card',
    description: 'RFID room key cards',
    category: 'office-supplies',
    type: 'consumable',
    variant: 'Blank',
    unit: 'pcs',
    restockThreshold: 100,
    maxStock: 500,
    location: 'Front Desk',
    supplier: '',
    cost: 35,
    notes: 'Room access',
    imageUrl: ''
  },
  {
    name: 'Key Card Holder',
    description: 'Paper key card holders',
    category: 'office-supplies',
    type: 'consumable',
    variant: 'Branded',
    unit: 'pcs',
    restockThreshold: 100,
    maxStock: 500,
    location: 'Front Desk',
    supplier: '',
    cost: 5,
    notes: 'Key card packaging',
    imageUrl: ''
  }
]

// Function to seed the database
export async function seedInventory() {
  console.log('Starting inventory seed...')
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
  
  console.log('📦 Adding new items...')
  let successCount = 0
  let errorCount = 0

  for (const item of seedInventoryItems) {
    try {
      await inventoryApi.create({
        ...item,
        currentStock: 0, // Start with 0 stock
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      successCount++
      console.log(`✓ Added: ${item.name}`)
    } catch (error) {
      errorCount++
      console.error(`✗ Failed to add ${item.name}:`, error.message)
    }
  }

  console.log(`\nSeed completed!`)
  console.log(`Success: ${successCount} items`)
  console.log(`Errors: ${errorCount} items`)
  
  return { successCount, errorCount, total: seedInventoryItems.length }
}

export default seedInventory
