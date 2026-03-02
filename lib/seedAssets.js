// Seed equipment and furniture assets (master items for asset tracking)
// These are master items that can be assigned to rooms as asset instances

import inventoryApi from './inventoryApi'

export const seedAssetItems = [
  // EQUIPMENT (10 items)
  {
    name: 'Samsung 55" Smart TV',
    description: '55-inch 4K UHD Smart LED TV with HDR',
    category: 'equipment',
    type: 'asset',
    brand: 'Samsung',
    model: 'UN55AU7000',
    variant: '55 inch',
    unit: 'unit',
    currentStock: 15,
    restockThreshold: 5,
    maxStock: 30,
    location: 'Electronics Storage',
    supplier: '',
    cost: 25000,
    notes: 'Standard room TV - 4K Smart TV with streaming apps',
    imageUrl: '',
    isActive: true
  },
  {
    name: 'LG 43" LED TV',
    description: '43-inch Full HD LED TV',
    category: 'equipment',
    type: 'asset',
    brand: 'LG',
    model: '43LM5700',
    variant: '43 inch',
    unit: 'unit',
    currentStock: 10,
    restockThreshold: 3,
    maxStock: 20,
    location: 'Electronics Storage',
    supplier: '',
    cost: 18000,
    notes: 'Budget room TV - Full HD LED display',
    imageUrl: '',
    isActive: true
  },
  {
    name: 'Split Type Air Conditioner',
    description: '1.5HP Inverter Split Type AC',
    category: 'equipment',
    type: 'asset',
    brand: 'Carrier',
    model: 'X-Power Gold',
    variant: '1.5HP',
    unit: 'unit',
    currentStock: 20,
    restockThreshold: 5,
    maxStock: 40,
    location: 'Equipment Storage',
    supplier: '',
    cost: 35000,
    notes: 'Standard room AC unit - Inverter technology for energy efficiency',
    imageUrl: '',
    isActive: true
  },
  {
    name: 'Mini Refrigerator',
    description: 'Compact mini fridge for guest rooms',
    category: 'equipment',
    type: 'asset',
    brand: 'Condura',
    model: 'BC-46',
    variant: '46L',
    unit: 'unit',
    currentStock: 18,
    restockThreshold: 5,
    maxStock: 35,
    location: 'Equipment Storage',
    supplier: '',
    cost: 8500,
    notes: 'In-room mini bar refrigerator',
    imageUrl: '',
    isActive: true
  },
  {
    name: 'Electric Kettle',
    description: '1.7L stainless steel electric kettle',
    category: 'equipment',
    type: 'asset',
    brand: 'Philips',
    model: 'HD9350',
    variant: '1.7L',
    unit: 'unit',
    currentStock: 25,
    restockThreshold: 10,
    maxStock: 50,
    location: 'Equipment Storage',
    supplier: '',
    cost: 1200,
    notes: 'For tea/coffee service in guest rooms',
    imageUrl: '',
    isActive: true
  },
  {
    name: 'Hair Dryer',
    description: 'Wall-mounted hair dryer 1200W',
    category: 'equipment',
    type: 'asset',
    brand: 'Panasonic',
    model: 'EH-ND30',
    variant: '1200W',
    unit: 'unit',
    currentStock: 22,
    restockThreshold: 8,
    maxStock: 45,
    location: 'Equipment Storage',
    supplier: '',
    cost: 1500,
    notes: 'Bathroom amenity - wall mounted',
    imageUrl: '',
    isActive: true
  },
  {
    name: 'Digital Safe',
    description: 'Electronic digital safe for guest valuables',
    category: 'equipment',
    type: 'asset',
    brand: 'Yale',
    model: 'YSS/200',
    variant: 'Medium',
    unit: 'unit',
    currentStock: 16,
    restockThreshold: 5,
    maxStock: 30,
    location: 'Equipment Storage',
    supplier: '',
    cost: 4500,
    notes: 'In-room security safe with digital keypad',
    imageUrl: '',
    isActive: true
  },
  {
    name: 'Telephone Set',
    description: 'Corded desk telephone',
    category: 'equipment',
    type: 'asset',
    brand: 'Panasonic',
    model: 'KX-TS500',
    variant: 'Standard',
    unit: 'unit',
    currentStock: 28,
    restockThreshold: 10,
    maxStock: 50,
    location: 'Equipment Storage',
    supplier: '',
    cost: 800,
    notes: 'Room phone for guest services',
    imageUrl: '',
    isActive: true
  },
  {
    name: 'Iron with Ironing Board',
    description: 'Steam iron with foldable ironing board',
    category: 'equipment',
    type: 'asset',
    brand: 'Philips',
    model: 'GC1905',
    variant: 'Standard',
    unit: 'set',
    currentStock: 12,
    restockThreshold: 5,
    maxStock: 25,
    location: 'Equipment Storage',
    supplier: '',
    cost: 2500,
    notes: 'Guest room ironing set',
    imageUrl: '',
    isActive: true
  },
  {
    name: 'Vacuum Cleaner',
    description: 'Upright vacuum cleaner for housekeeping',
    category: 'equipment',
    type: 'asset',
    brand: 'Electrolux',
    model: 'Z1860',
    variant: 'Upright',
    unit: 'unit',
    currentStock: 8,
    restockThreshold: 3,
    maxStock: 15,
    location: 'Equipment Storage',
    supplier: '',
    cost: 6500,
    notes: 'Housekeeping equipment for room cleaning',
    imageUrl: '',
    isActive: true
  },

  // FURNITURE (10 items)
  {
    name: 'Queen Size Bed Frame',
    description: 'Wooden queen size bed frame with headboard',
    category: 'furniture',
    type: 'asset',
    brand: 'Mandaue Foam',
    model: 'QBF-2024',
    variant: 'Queen',
    unit: 'unit',
    currentStock: 20,
    restockThreshold: 5,
    maxStock: 40,
    location: 'Furniture Storage',
    supplier: '',
    cost: 15000,
    notes: 'Standard room bed frame with upholstered headboard',
    imageUrl: '',
    isActive: true
  },
  {
    name: 'King Size Bed Frame',
    description: 'Premium king size bed frame with headboard',
    category: 'furniture',
    type: 'asset',
    brand: 'Mandaue Foam',
    model: 'KBF-2024',
    variant: 'King',
    unit: 'unit',
    currentStock: 12,
    restockThreshold: 3,
    maxStock: 25,
    location: 'Furniture Storage',
    supplier: '',
    cost: 22000,
    notes: 'Deluxe room bed frame - premium finish',
    imageUrl: '',
    isActive: true
  },
  {
    name: 'Bedside Table',
    description: 'Wooden bedside table with drawer',
    category: 'furniture',
    type: 'asset',
    brand: 'SM Home',
    model: 'BST-100',
    variant: 'Standard',
    unit: 'unit',
    currentStock: 35,
    restockThreshold: 10,
    maxStock: 60,
    location: 'Furniture Storage',
    supplier: '',
    cost: 2500,
    notes: 'Bedside table with storage drawer - pair per room',
    imageUrl: '',
    isActive: true
  },
  {
    name: 'Work Desk with Chair',
    description: 'Wooden work desk with ergonomic chair',
    category: 'furniture',
    type: 'asset',
    brand: 'SM Home',
    model: 'WD-200',
    variant: 'Standard',
    unit: 'set',
    currentStock: 18,
    restockThreshold: 5,
    maxStock: 35,
    location: 'Furniture Storage',
    supplier: '',
    cost: 5500,
    notes: 'Study/work area furniture set',
    imageUrl: '',
    isActive: true
  },
  {
    name: 'Wardrobe Cabinet',
    description: 'Wooden wardrobe with hanging space and drawers',
    category: 'furniture',
    type: 'asset',
    brand: 'SM Home',
    model: 'WC-300',
    variant: 'Large',
    unit: 'unit',
    currentStock: 22,
    restockThreshold: 5,
    maxStock: 40,
    location: 'Furniture Storage',
    supplier: '',
    cost: 8000,
    notes: 'Clothes storage with hanging rod and shelves',
    imageUrl: '',
    isActive: true
  },
  {
    name: 'Lounge Chair',
    description: 'Upholstered lounge chair with ottoman',
    category: 'furniture',
    type: 'asset',
    brand: 'SM Home',
    model: 'LC-150',
    variant: 'Standard',
    unit: 'unit',
    currentStock: 15,
    restockThreshold: 5,
    maxStock: 30,
    location: 'Furniture Storage',
    supplier: '',
    cost: 4000,
    notes: 'Reading area chair with footrest',
    imageUrl: '',
    isActive: true
  },
  {
    name: 'Coffee Table',
    description: 'Glass top coffee table with wooden base',
    category: 'furniture',
    type: 'asset',
    brand: 'SM Home',
    model: 'CT-80',
    variant: 'Standard',
    unit: 'unit',
    currentStock: 14,
    restockThreshold: 5,
    maxStock: 28,
    location: 'Furniture Storage',
    supplier: '',
    cost: 3200,
    notes: 'Living area coffee table',
    imageUrl: '',
    isActive: true
  },
  {
    name: 'TV Stand',
    description: 'Wooden TV stand with storage',
    category: 'furniture',
    type: 'asset',
    brand: 'SM Home',
    model: 'TVS-120',
    variant: 'Standard',
    unit: 'unit',
    currentStock: 19,
    restockThreshold: 5,
    maxStock: 35,
    location: 'Furniture Storage',
    supplier: '',
    cost: 2800,
    notes: 'TV console with cable management',
    imageUrl: '',
    isActive: true
  },
  {
    name: 'Luggage Rack',
    description: 'Foldable luggage rack with shelf',
    category: 'furniture',
    type: 'asset',
    brand: 'Generic',
    model: 'LR-50',
    variant: 'Foldable',
    unit: 'unit',
    currentStock: 30,
    restockThreshold: 10,
    maxStock: 50,
    location: 'Furniture Storage',
    supplier: '',
    cost: 1200,
    notes: 'Guest luggage stand - foldable design',
    imageUrl: '',
    isActive: true
  },
  {
    name: 'Full Length Mirror',
    description: 'Standing full length mirror with frame',
    category: 'furniture',
    type: 'asset',
    brand: 'SM Home',
    model: 'FM-180',
    variant: 'Standard',
    unit: 'unit',
    currentStock: 24,
    restockThreshold: 8,
    maxStock: 45,
    location: 'Furniture Storage',
    supplier: '',
    cost: 2200,
    notes: 'Full length dressing mirror',
    imageUrl: '',
    isActive: true
  }
]

// Function to seed equipment and furniture assets
export async function seedAssets() {
  console.log('🪑 Starting equipment and furniture asset seed...')
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
  
  console.log('📦 Adding new assets...')
  let successCount = 0
  let errorCount = 0
  const errors = []

  for (const item of seedAssetItems) {
    try {
      // Create the asset master item
      const newItem = await inventoryApi.create({
        ...item,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      
      successCount++
      console.log(`✅ Added: ${item.name} (${item.category})`)
    } catch (error) {
      errorCount++
      errors.push({ item: item.name, error: error.message })
      console.error(`❌ Failed to add ${item.name}:`, error.message)
    }
  }

  console.log('\n📊 Asset Seed Summary:')
  console.log(`✅ Success: ${successCount} items`)
  console.log(`❌ Errors: ${errorCount} items`)
  console.log(`📦 Total: ${seedAssetItems.length} items`)
  console.log(`   - Equipment: 10 items`)
  console.log(`   - Furniture: 10 items`)
  
  if (errors.length > 0) {
    console.log('\n⚠️ Error Details:')
    errors.forEach(({ item, error }) => {
      console.log(`  - ${item}: ${error}`)
    })
  }
  
  return { 
    successCount, 
    errorCount, 
    total: seedAssetItems.length,
    errors 
  }
}

export default seedAssets
