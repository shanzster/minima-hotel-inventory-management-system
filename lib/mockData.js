// Mock data for development and testing
import { INVENTORY_CATEGORIES, STOCK_STATUSES, PURCHASE_ORDER_STATUSES } from './constants.js'

// Generate mock inventory items
export const mockInventoryItems = [
  // Menu Items
  {
    id: 'menu-001',
    name: 'Premium Coffee Beans',
    description: 'Arabica coffee beans for breakfast service',
    category: 'menu-items',
    type: 'consumable',
    currentStock: 15,
    unit: 'kg',
    restockThreshold: 20,
    maxStock: 100,
    location: 'Kitchen Storage',
    supplier: 'Coffee Roasters Ltd',
    cost: 1275.00, // ₱1,275.00 per kg
    expirationDate: new Date('2024-03-15'),
    batchNumber: 'CR-2024-001',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
    updatedBy: 'kitchen-staff-001'
  },
  {
    id: 'menu-002',
    name: 'Fresh Salmon Fillets',
    description: 'Atlantic salmon for dinner menu',
    category: 'menu-items',
    type: 'consumable',
    currentStock: 0,
    unit: 'kg',
    restockThreshold: 5,
    maxStock: 25,
    location: 'Walk-in Freezer',
    supplier: 'Ocean Fresh Seafood',
    cost: 2250.00, // ₱2,250.00 per kg
    expirationDate: new Date('2024-01-25'),
    batchNumber: 'OFS-2024-003',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-20'),
    updatedBy: 'kitchen-staff-002'
  },
  {
    id: 'menu-003',
    name: 'Organic Vegetables Mix',
    description: 'Seasonal vegetables for side dishes',
    category: 'menu-items',
    type: 'consumable',
    currentStock: 8,
    unit: 'kg',
    restockThreshold: 10,
    maxStock: 30,
    location: 'Cold Storage',
    supplier: 'Green Valley Farms',
    cost: 637.50, // ₱637.50 per kg
    expirationDate: new Date('2024-01-28'),
    batchNumber: 'GVF-2024-007',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-22'),
    updatedBy: 'kitchen-staff-001'
  },
  {
    id: 'menu-004',
    name: 'Wagyu Beef Steaks',
    description: 'Premium wagyu beef for signature dishes',
    category: 'menu-items',
    type: 'consumable',
    currentStock: 12,
    unit: 'kg',
    restockThreshold: 8,
    maxStock: 20,
    location: 'Walk-in Freezer',
    supplier: 'Premium Meats Co',
    cost: 6000.00, // ₱6,000.00 per kg
    expirationDate: new Date('2024-02-10'),
    batchNumber: 'PMC-2024-001',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-20'),
    updatedBy: 'kitchen-staff-001'
  },
  {
    id: 'menu-005',
    name: 'Fresh Pasta',
    description: 'House-made pasta for Italian dishes',
    category: 'menu-items',
    type: 'consumable',
    currentStock: 5,
    unit: 'kg',
    restockThreshold: 10,
    maxStock: 25,
    location: 'Kitchen Storage',
    supplier: 'Artisan Pasta Co',
    cost: 925.00, // ₱925.00 per kg
    expirationDate: new Date('2024-01-26'),
    batchNumber: 'APC-2024-005',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-22'),
    updatedBy: 'kitchen-staff-002'
  },
  {
    id: 'menu-006',
    name: 'Truffle Oil',
    description: 'Premium truffle oil for gourmet dishes',
    category: 'menu-items',
    type: 'consumable',
    currentStock: 3,
    unit: 'bottles',
    restockThreshold: 5,
    maxStock: 15,
    location: 'Kitchen Storage',
    supplier: 'Gourmet Oils Ltd',
    cost: 4250.00, // ₱4,250.00 per bottle
    expirationDate: new Date('2024-12-31'),
    batchNumber: 'GOL-2024-002',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-18'),
    updatedBy: 'kitchen-staff-001'
  },

  // Consumables - Toiletries
  {
    id: 'toiletry-001',
    name: 'Luxury Shampoo Bottles',
    description: 'Premium shampoo for guest rooms',
    category: 'toiletries',
    type: 'consumable',
    currentStock: 45,
    unit: 'bottles',
    restockThreshold: 50,
    maxStock: 200,
    location: 'Housekeeping Storage',
    supplier: 'Hotel Amenities Co',
    cost: 425.00, // ₱425.00 per bottle
    expirationDate: new Date('2025-06-30'),
    batchNumber: 'HAC-2024-012',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-18'),
    updatedBy: 'inventory-controller-001'
  },
  {
    id: 'toiletry-002',
    name: 'Bath Towels',
    description: 'Egyptian cotton bath towels',
    category: 'toiletries',
    type: 'consumable',
    currentStock: 120,
    unit: 'pieces',
    restockThreshold: 100,
    maxStock: 300,
    location: 'Linen Room',
    supplier: 'Luxury Linens Ltd',
    cost: 1750.00, // ₱1,750.00 per piece
    expirationDate: null,
    batchNumber: 'LL-2024-005',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-10'),
    updatedBy: 'inventory-controller-001'
  },

  // Consumables - Cleaning Supplies
  {
    id: 'cleaning-001',
    name: 'Multi-Surface Disinfectant',
    description: 'Hospital-grade disinfectant for room cleaning',
    category: 'cleaning-supplies',
    type: 'consumable',
    currentStock: 25,
    unit: 'liters',
    restockThreshold: 30,
    maxStock: 100,
    location: 'Cleaning Supply Room',
    supplier: 'CleanPro Solutions',
    cost: 787.50, // ₱787.50 per liter
    expirationDate: new Date('2024-12-31'),
    batchNumber: 'CPS-2024-008',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-20'),
    updatedBy: 'inventory-controller-001'
  },

  // Assets - Equipment
  // Room-specific assets with room assignments
  {
    id: 'asset-mini-fridge-b209',
    name: 'Mini Fridge',
    description: 'Compact refrigerator for guest room',
    category: 'equipment',
    type: 'asset',
    currentStock: 1,
    unit: 'unit',
    restockThreshold: 1,
    maxStock: 1,
    location: 'Room B209',
    supplier: 'Hotel Equipment Suppliers',
    cost: 15000.00,
    expirationDate: null,
    serialNumber: 'MF-B209-2024',
    condition: 'excellent',
    purchaseDate: new Date('2024-01-10'),
    warrantyExpiry: new Date('2026-01-10'),
    assignedTo: 'Guest Room',
    assignedDepartment: 'housekeeping',
    assignedRoom: 'room-1767850847281', // B209
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
    updatedBy: 'inventory-controller-001'
  },
  {
    id: 'asset-tv-102',
    name: 'Smart TV 43"',
    description: 'Smart television for standard room',
    category: 'equipment',
    type: 'asset',
    currentStock: 1,
    unit: 'unit',
    restockThreshold: 1,
    maxStock: 1,
    location: 'Room 102',
    supplier: 'Electronics Wholesale',
    cost: 25000.00,
    expirationDate: null,
    serialNumber: 'TV-102-2023',
    condition: 'good',
    purchaseDate: new Date('2023-12-01'),
    warrantyExpiry: new Date('2025-12-01'),
    assignedTo: 'Guest Room',
    assignedDepartment: 'housekeeping',
    assignedRoom: 'room-standard-102',
    createdAt: new Date('2023-12-01'),
    updatedAt: new Date('2024-01-15'),
    updatedBy: 'inventory-controller-001'
  },
  {
    id: 'asset-safe-201',
    name: 'Electronic Safe',
    description: 'Digital safe for guest valuables',
    category: 'equipment',
    type: 'asset',
    currentStock: 1,
    unit: 'unit',
    restockThreshold: 1,
    maxStock: 1,
    location: 'Room 201',
    supplier: 'Security Systems Ltd',
    cost: 12000.00,
    expirationDate: null,
    serialNumber: 'SAFE-201-2024',
    condition: 'excellent',
    purchaseDate: new Date('2024-01-05'),
    warrantyExpiry: new Date('2027-01-05'),
    assignedTo: 'Guest Room',
    assignedDepartment: 'housekeeping',
    assignedRoom: 'room-deluxe-201',
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-05'),
    updatedBy: 'inventory-controller-001'
  },
  {
    id: 'asset-coffee-maker-301',
    name: 'Coffee Maker',
    description: 'Premium coffee maker for suite',
    category: 'equipment',
    type: 'asset',
    currentStock: 1,
    unit: 'unit',
    restockThreshold: 1,
    maxStock: 1,
    location: 'Room 301',
    supplier: 'Hotel Equipment Suppliers',
    cost: 8000.00,
    expirationDate: null,
    serialNumber: 'CM-301-2023',
    condition: 'good',
    purchaseDate: new Date('2023-11-20'),
    warrantyExpiry: new Date('2025-11-20'),
    assignedTo: 'Guest Room',
    assignedDepartment: 'housekeeping',
    assignedRoom: 'room-suite-301',
    createdAt: new Date('2023-11-20'),
    updatedAt: new Date('2024-01-10'),
    updatedBy: 'inventory-controller-001'
  },
  {
    id: 'asset-hairdryer-601',
    name: 'Hair Dryer',
    description: 'Professional hair dryer',
    category: 'equipment',
    type: 'asset',
    currentStock: 1,
    unit: 'unit',
    restockThreshold: 1,
    maxStock: 1,
    location: 'Room 601',
    supplier: 'Hotel Amenities Co',
    cost: 2500.00,
    expirationDate: null,
    serialNumber: 'HD-601-2024',
    condition: 'excellent',
    purchaseDate: new Date('2024-01-12'),
    warrantyExpiry: new Date('2026-01-12'),
    assignedTo: 'Guest Room',
    assignedDepartment: 'housekeeping',
    assignedRoom: 'room-1769065313223-601',
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-12'),
    updatedBy: 'inventory-controller-001'
  },
  {
    id: 'asset-iron-602',
    name: 'Steam Iron',
    description: 'Steam iron with ironing board',
    category: 'equipment',
    type: 'asset',
    currentStock: 1,
    unit: 'unit',
    restockThreshold: 1,
    maxStock: 1,
    location: 'Room 602',
    supplier: 'Hotel Amenities Co',
    cost: 3500.00,
    expirationDate: null,
    serialNumber: 'SI-602-2024',
    condition: 'good',
    purchaseDate: new Date('2024-01-08'),
    warrantyExpiry: new Date('2026-01-08'),
    assignedTo: 'Guest Room',
    assignedDepartment: 'housekeeping',
    assignedRoom: 'room-1769065313222-602',
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-08'),
    updatedBy: 'inventory-controller-001'
  },
  {
    id: 'asset-mini-fridge-603',
    name: 'Mini Fridge',
    description: 'Compact refrigerator for guest room',
    category: 'equipment',
    type: 'asset',
    currentStock: 1,
    unit: 'unit',
    restockThreshold: 1,
    maxStock: 1,
    location: 'Room 603',
    supplier: 'Hotel Equipment Suppliers',
    cost: 15000.00,
    expirationDate: null,
    serialNumber: 'MF-603-2024',
    condition: 'excellent',
    purchaseDate: new Date('2024-01-15'),
    warrantyExpiry: new Date('2026-01-15'),
    assignedTo: 'Guest Room',
    assignedDepartment: 'housekeeping',
    assignedRoom: 'room-1769065313221-603',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    updatedBy: 'inventory-controller-001'
  },
  {
    id: 'asset-tv-604',
    name: 'Smart TV 50"',
    description: 'Large smart television for deluxe room',
    category: 'equipment',
    type: 'asset',
    currentStock: 1,
    unit: 'unit',
    restockThreshold: 1,
    maxStock: 1,
    location: 'Room 604',
    supplier: 'Electronics Wholesale',
    cost: 35000.00,
    expirationDate: null,
    serialNumber: 'TV-604-2024',
    condition: 'excellent',
    purchaseDate: new Date('2024-01-10'),
    warrantyExpiry: new Date('2026-01-10'),
    assignedTo: 'Guest Room',
    assignedDepartment: 'housekeeping',
    assignedRoom: 'room-1769065313220-604',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
    updatedBy: 'inventory-controller-001'
  },
  {
    id: 'asset-safe-605',
    name: 'Electronic Safe',
    description: 'Digital safe for guest valuables',
    category: 'equipment',
    type: 'asset',
    currentStock: 1,
    unit: 'unit',
    restockThreshold: 1,
    maxStock: 1,
    location: 'Room 605',
    supplier: 'Security Systems Ltd',
    cost: 12000.00,
    expirationDate: null,
    serialNumber: 'SAFE-605-2024',
    condition: 'excellent',
    purchaseDate: new Date('2024-01-12'),
    warrantyExpiry: new Date('2027-01-12'),
    assignedTo: 'Guest Room',
    assignedDepartment: 'housekeeping',
    assignedRoom: 'room-1769065313217-605',
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-12'),
    updatedBy: 'inventory-controller-001'
  },
  {
    id: 'asset-microwave-401',
    name: 'Microwave Oven',
    description: 'Microwave for family room',
    category: 'equipment',
    type: 'asset',
    currentStock: 1,
    unit: 'unit',
    restockThreshold: 1,
    maxStock: 1,
    location: 'Room 401',
    supplier: 'Hotel Equipment Suppliers',
    cost: 8500.00,
    expirationDate: null,
    serialNumber: 'MW-401-2023',
    condition: 'good',
    purchaseDate: new Date('2023-12-15'),
    warrantyExpiry: new Date('2025-12-15'),
    assignedTo: 'Guest Room',
    assignedDepartment: 'housekeeping',
    assignedRoom: 'room-family-401',
    createdAt: new Date('2023-12-15'),
    updatedAt: new Date('2024-01-10'),
    updatedBy: 'inventory-controller-001'
  }
]

// Generate mock purchase orders
export const mockPurchaseOrders = [
  {
    id: 'po-001',
    orderNumber: 'PO-2024-001',
    supplier: {
      id: 'supplier-001',
      name: 'Coffee Roasters Ltd',
      contactPerson: 'John Smith',
      email: 'john@coffeeroasters.com',
      phone: '+1-555-0123'
    },
    items: [
      {
        inventoryItemId: 'menu-001',
        quantity: 50,
        unitCost: 1275.00,
        totalCost: 63750.00
      }
    ],
    status: 'approved',
    priority: 'normal',
    totalAmount: 63750.00,
    requestedBy: 'purchasing-officer-001',
    approvedBy: 'inventory-controller-001',
    expectedDelivery: new Date('2024-01-30'),
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-21')
  },
  {
    id: 'po-002',
    orderNumber: 'PO-2024-002',
    supplier: {
      id: 'supplier-002',
      name: 'Ocean Fresh Seafood',
      contactPerson: 'Maria Garcia',
      email: 'maria@oceanfresh.com',
      phone: '+1-555-0456'
    },
    items: [
      {
        inventoryItemId: 'menu-002',
        quantity: 20,
        unitCost: 2250.00,
        totalCost: 45000.00
      }
    ],
    status: 'pending',
    priority: 'high',
    totalAmount: 45000.00,
    requestedBy: 'purchasing-officer-001',
    expectedDelivery: new Date('2024-01-28'),
    createdAt: new Date('2024-01-22'),
    updatedAt: new Date('2024-01-22')
  },
  {
    id: 'po-003',
    orderNumber: 'PO-2024-003',
    supplier: {
      id: 'supplier-003',
      name: 'Farm Fresh Produce',
      contactPerson: 'David Wilson',
      email: 'david@farmfresh.com',
      phone: '+1-555-0789'
    },
    items: [
      {
        inventoryItemId: 'menu-003',
        quantity: 30,
        unitCost: 600.00,
        totalCost: 18000.00
      }
    ],
    status: 'in-transit',
    priority: 'normal',
    totalAmount: 18000.00,
    requestedBy: 'purchasing-officer-001',
    approvedBy: 'inventory-controller-001',
    expectedDelivery: new Date('2024-01-26'),
    createdAt: new Date('2024-01-18'),
    updatedAt: new Date('2024-01-20')
  },
  {
    id: 'po-004',
    orderNumber: 'PO-2024-004',
    supplier: {
      id: 'supplier-004',
      name: 'Hotel Supplies Co',
      contactPerson: 'Sarah Johnson',
      email: 'sarah@hotelsupplies.com',
      phone: '+1-555-0321'
    },
    items: [
      {
        inventoryItemId: 'consumable-001',
        quantity: 100,
        unitCost: 125.00,
        totalCost: 12500.00
      }
    ],
    status: 'delivered',
    priority: 'low',
    totalAmount: 12500.00,
    requestedBy: 'purchasing-officer-001',
    approvedBy: 'inventory-controller-001',
    expectedDelivery: new Date('2024-01-15'),
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-15')
  }
]

// Generate mock transactions
export const mockTransactions = [
  {
    id: 'txn-001',
    itemId: 'menu-001',
    type: 'stock-out',
    quantity: 5,
    previousStock: 20,
    newStock: 15,
    reason: 'Daily breakfast service',
    destination: 'Restaurant Kitchen',
    performedBy: 'kitchen-staff-001',
    approved: true,
    approvedBy: 'inventory-controller-001',
    approvedAt: new Date('2024-01-22'),
    createdAt: new Date('2024-01-22')
  },
  {
    id: 'txn-002',
    itemId: 'menu-002',
    type: 'stock-out',
    quantity: 3,
    previousStock: 3,
    newStock: 0,
    reason: 'Dinner service - salmon special',
    destination: 'Restaurant Kitchen',
    performedBy: 'kitchen-staff-002',
    approved: false, // Pending approval
    approvedBy: null,
    approvedAt: null,
    createdAt: new Date('2024-01-21')
  },
  {
    id: 'txn-003',
    itemId: 'toiletry-001',
    type: 'stock-in',
    quantity: 25,
    previousStock: 20,
    newStock: 45,
    reason: 'Weekly delivery',
    supplier: 'Hotel Amenities Co',
    batchNumber: 'HAC-2024-012',
    performedBy: 'inventory-controller-001',
    approved: false, // Pending approval
    approvedBy: null,
    approvedAt: null,
    createdAt: new Date('2024-01-18')
  }
]

// Helper functions to get filtered data
export function getItemsByCategory(category) {
  return mockInventoryItems.filter(item => item.category === category)
}

export function getLowStockItems() {
  return mockInventoryItems.filter(item => 
    item.currentStock > 0 && item.currentStock <= item.restockThreshold
  )
}

export function getCriticalStockItems() {
  return mockInventoryItems.filter(item => 
    item.currentStock === 0
  )
}

export function getExcessStockItems() {
  return mockInventoryItems.filter(item => 
    item.maxStock && item.currentStock > item.maxStock
  )
}

export function getExpiringItems(days = 7) {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() + days)
  
  return mockInventoryItems.filter(item => 
    item.expirationDate && 
    new Date(item.expirationDate) <= cutoffDate &&
    new Date(item.expirationDate) >= new Date()
  )
}

export function getExpiredItems() {
  const now = new Date()
  return mockInventoryItems.filter(item => 
    item.expirationDate && new Date(item.expirationDate) < now
  )
}

export function getItemTransactions(itemId) {
  return mockTransactions.filter(txn => txn.itemId === itemId)
}

export function getPendingPurchaseOrders() {
  return mockPurchaseOrders.filter(po => po.status === 'pending')
}

export function getApprovedPurchaseOrders() {
  return mockPurchaseOrders.filter(po => po.status === 'approved')
}

// Generate mock suppliers
export const mockSuppliers = [
  {
    id: 'supplier-001',
    name: 'Coffee Roasters Ltd',
    contactPerson: 'John Smith',
    email: 'john@coffeeroasters.com',
    phone: '+1-555-0123',
    address: '123 Coffee Street, Bean City, BC 12345',
    categories: ['menu-items'],
    performanceMetrics: {
      overallRating: 4.5,
      deliveryReliability: 95,
      qualityRating: 4.8,
      responseTime: 2,
      totalOrders: 24,
      onTimeDeliveries: 23,
      qualityIssues: 1,
      lastEvaluationDate: new Date('2024-01-15')
    },
    contractDetails: {
      startDate: new Date('2023-01-01'),
      endDate: new Date('2024-12-31'),
      paymentTerms: 'Net 30',
      deliveryTerms: 'FOB Destination',
      minimumOrderValue: 25000 // ₱25,000
    },
    isActive: true,
    isApproved: true,
    approvedBy: 'inventory-controller-001',
    approvedAt: new Date('2023-01-01'),
    createdAt: new Date('2023-01-01')
  },
  {
    id: 'supplier-002',
    name: 'Ocean Fresh Seafood',
    contactPerson: 'Maria Garcia',
    email: 'maria@oceanfresh.com',
    phone: '+1-555-0456',
    address: '456 Harbor Drive, Coastal City, CC 67890',
    categories: ['menu-items'],
    performanceMetrics: {
      overallRating: 4.2,
      deliveryReliability: 88,
      qualityRating: 4.6,
      responseTime: 4,
      totalOrders: 18,
      onTimeDeliveries: 16,
      qualityIssues: 2,
      lastEvaluationDate: new Date('2024-01-10')
    },
    contractDetails: {
      startDate: new Date('2023-03-01'),
      endDate: new Date('2024-12-31'),
      paymentTerms: 'Net 15',
      deliveryTerms: 'FOB Origin',
      minimumOrderValue: 40000 // ₱40,000
    },
    isActive: true,
    isApproved: true,
    approvedBy: 'inventory-controller-001',
    approvedAt: new Date('2023-03-01'),
    createdAt: new Date('2023-02-15')
  },
  {
    id: 'supplier-003',
    name: 'Green Valley Farms',
    contactPerson: 'David Wilson',
    email: 'david@greenvalley.com',
    phone: '+1-555-0789',
    address: '789 Farm Road, Valley Town, VT 13579',
    categories: ['menu-items'],
    performanceMetrics: {
      overallRating: 4.7,
      deliveryReliability: 92,
      qualityRating: 4.9,
      responseTime: 1,
      totalOrders: 32,
      onTimeDeliveries: 30,
      qualityIssues: 0,
      lastEvaluationDate: new Date('2024-01-20')
    },
    contractDetails: {
      startDate: new Date('2023-02-01'),
      endDate: new Date('2024-12-31'),
      paymentTerms: 'Net 30',
      deliveryTerms: 'FOB Destination',
      minimumOrderValue: 15000 // ₱15,000
    },
    isActive: true,
    isApproved: true,
    approvedBy: 'inventory-controller-001',
    approvedAt: new Date('2023-02-01'),
    createdAt: new Date('2023-01-20')
  },
  {
    id: 'supplier-004',
    name: 'Premium Meats Co',
    contactPerson: 'Robert Chen',
    email: 'robert@premiummeats.com',
    phone: '+1-555-0987',
    address: '321 Butcher Lane, Meat District, MD 24680',
    categories: ['menu-items'],
    performanceMetrics: {
      overallRating: 4.8,
      deliveryReliability: 96,
      qualityRating: 4.9,
      responseTime: 1,
      totalOrders: 15,
      onTimeDeliveries: 15,
      qualityIssues: 0,
      lastEvaluationDate: new Date('2024-01-18')
    },
    contractDetails: {
      startDate: new Date('2023-06-01'),
      endDate: new Date('2024-12-31'),
      paymentTerms: 'Net 15',
      deliveryTerms: 'FOB Destination',
      minimumOrderValue: 50000 // ₱50,000
    },
    isActive: true,
    isApproved: true,
    approvedBy: 'inventory-controller-001',
    approvedAt: new Date('2023-06-01'),
    createdAt: new Date('2023-05-15')
  },
  {
    id: 'supplier-005',
    name: 'Hotel Amenities Co',
    contactPerson: 'Lisa Thompson',
    email: 'lisa@hotelamenities.com',
    phone: '+1-555-0654',
    address: '654 Supply Avenue, Commerce City, CC 97531',
    categories: ['toiletries', 'cleaning-supplies'],
    performanceMetrics: {
      overallRating: 4.3,
      deliveryReliability: 89,
      qualityRating: 4.4,
      responseTime: 3,
      totalOrders: 28,
      onTimeDeliveries: 25,
      qualityIssues: 3,
      lastEvaluationDate: new Date('2024-01-12')
    },
    contractDetails: {
      startDate: new Date('2023-01-01'),
      endDate: new Date('2024-12-31'),
      paymentTerms: 'Net 30',
      deliveryTerms: 'FOB Destination',
      minimumOrderValue: 20000 // ₱20,000
    },
    isActive: true,
    isApproved: true,
    approvedBy: 'inventory-controller-001',
    approvedAt: new Date('2023-01-01'),
    createdAt: new Date('2022-12-15')
  },
  {
    id: 'supplier-006',
    name: 'CleanPro Solutions',
    contactPerson: 'Michael Brown',
    email: 'michael@cleanpro.com',
    phone: '+1-555-0321',
    address: '987 Industrial Blvd, Clean City, CL 86420',
    categories: ['cleaning-supplies'],
    performanceMetrics: {
      overallRating: 4.1,
      deliveryReliability: 85,
      qualityRating: 4.3,
      responseTime: 5,
      totalOrders: 22,
      onTimeDeliveries: 19,
      qualityIssues: 2,
      lastEvaluationDate: new Date('2024-01-08')
    },
    contractDetails: {
      startDate: new Date('2023-04-01'),
      endDate: new Date('2024-12-31'),
      paymentTerms: 'Net 45',
      deliveryTerms: 'FOB Origin',
      minimumOrderValue: 30000 // ₱30,000
    },
    isActive: true,
    isApproved: true,
    approvedBy: 'inventory-controller-001',
    approvedAt: new Date('2023-04-01'),
    createdAt: new Date('2023-03-20')
  },
  {
    id: 'supplier-007',
    name: 'Tech Solutions Ltd',
    contactPerson: 'Jennifer Lee',
    email: 'jennifer@techsolutions.com',
    phone: '+1-555-0147',
    address: '147 Technology Park, Tech City, TC 75319',
    categories: ['equipment'],
    performanceMetrics: {
      overallRating: 4.6,
      deliveryReliability: 94,
      qualityRating: 4.7,
      responseTime: 2,
      totalOrders: 8,
      onTimeDeliveries: 8,
      qualityIssues: 0,
      lastEvaluationDate: new Date('2024-01-05')
    },
    contractDetails: {
      startDate: new Date('2023-09-01'),
      endDate: new Date('2025-08-31'),
      paymentTerms: 'Net 30',
      deliveryTerms: 'FOB Destination',
      minimumOrderValue: 75000 // ₱75,000
    },
    isActive: true,
    isApproved: true,
    approvedBy: 'inventory-controller-001',
    approvedAt: new Date('2023-09-01'),
    createdAt: new Date('2023-08-15')
  },
  {
    id: 'supplier-008',
    name: 'New Supplier Pending',
    contactPerson: 'Alex Rodriguez',
    email: 'alex@newsupplier.com',
    phone: '+1-555-0999',
    address: '999 New Street, Pending City, PC 11111',
    categories: ['office-supplies'],
    performanceMetrics: {
      overallRating: 0,
      deliveryReliability: 0,
      qualityRating: 0,
      responseTime: 0,
      totalOrders: 0,
      onTimeDeliveries: 0,
      qualityIssues: 0,
      lastEvaluationDate: null
    },
    contractDetails: {
      startDate: new Date('2024-02-01'),
      paymentTerms: 'Net 30',
      deliveryTerms: 'FOB Destination',
      minimumOrderValue: 10000 // ₱10,000
    },
    isActive: false,
    isApproved: false,
    approvedBy: null,
    approvedAt: null,
    createdAt: new Date('2024-01-22')
  }
]

// Helper functions for suppliers
export function getActiveSuppliers() {
  return mockSuppliers.filter(supplier => supplier.isActive && supplier.isApproved)
}

export function getPendingSuppliers() {
  return mockSuppliers.filter(supplier => !supplier.isApproved)
}

export function getSuppliersByCategory(category) {
  return mockSuppliers.filter(supplier => 
    supplier.categories.includes(category) && supplier.isActive && supplier.isApproved
  )
}

export function getSupplierPerformanceRating(supplierId) {
  const supplier = mockSuppliers.find(s => s.id === supplierId)
  return supplier ? supplier.performanceMetrics.overallRating : 0
}

// Generate mock audits
export const mockAudits = [
  {
    id: 'audit-001',
    auditNumber: 'AUD-2024-001',
    auditType: 'scheduled',
    auditDate: new Date('2024-01-15'),
    performedBy: 'inventory-controller-001',
    approvedBy: 'inventory-controller-001',
    status: 'approved',
    scope: {
      categories: ['menu-items', 'toiletries'],
      locations: ['Kitchen Storage', 'Housekeeping Storage'],
      includeAssets: false,
      includeExpiredItems: true,
      samplingPercentage: 100
    },
    items: [
      {
        inventoryItemId: 'menu-001',
        expectedStock: 20,
        actualStock: 15,
        variance: -5,
        notes: 'Found 5 units missing from kitchen storage'
      },
      {
        inventoryItemId: 'toiletry-001',
        expectedStock: 50,
        actualStock: 45,
        variance: -5,
        notes: 'Normal usage variance'
      }
    ],
    discrepancies: [
      {
        itemId: 'menu-001',
        type: 'shortage',
        quantity: 5,
        resolution: 'Adjusted stock levels and investigated missing items',
        resolvedBy: 'inventory-controller-001',
        resolvedAt: new Date('2024-01-16')
      }
    ],
    recommendations: [
      'Implement more frequent spot checks for high-value items',
      'Review storage security procedures'
    ],
    complianceScore: 92,
    notes: 'Overall good compliance with minor discrepancies',
    createdAt: new Date('2024-01-15'),
    completedAt: new Date('2024-01-16')
  },
  {
    id: 'audit-002',
    auditNumber: 'AUD-2024-002',
    auditType: 'spot-check',
    auditDate: new Date('2024-01-20'),
    performedBy: 'inventory-controller-001',
    status: 'in-progress',
    scope: {
      categories: ['cleaning-supplies'],
      locations: ['Cleaning Supply Room'],
      includeAssets: false,
      includeExpiredItems: true,
      samplingPercentage: 50
    },
    items: [
      {
        inventoryItemId: 'cleaning-001',
        expectedStock: 30,
        actualStock: 25,
        variance: -5,
        notes: 'Checking usage patterns'
      }
    ],
    discrepancies: [
      {
        itemId: 'cleaning-001',
        type: 'shortage',
        quantity: 5
      }
    ],
    recommendations: [],
    complianceScore: 0,
    notes: 'Audit in progress',
    createdAt: new Date('2024-01-20')
  },
  {
    id: 'audit-003',
    auditNumber: 'AUD-2024-003',
    auditType: 'annual',
    auditDate: new Date('2024-01-22'),
    performedBy: 'inventory-controller-001',
    status: 'requires-review',
    scope: {
      categories: ['equipment', 'furniture'],
      locations: ['Restaurant Kitchen', 'Front Desk', 'Housekeeping Storage'],
      includeAssets: true,
      includeExpiredItems: false,
      samplingPercentage: 100
    },
    items: [
      {
        inventoryItemId: 'equipment-001',
        expectedStock: 1,
        actualStock: 1,
        variance: 0,
        notes: 'Equipment in good condition'
      },
      {
        inventoryItemId: 'equipment-003',
        expectedStock: 3,
        actualStock: 2,
        variance: -1,
        notes: 'One vacuum cleaner needs repair'
      }
    ],
    discrepancies: [
      {
        itemId: 'equipment-003',
        type: 'damaged',
        quantity: 1
      }
    ],
    recommendations: [
      'Schedule maintenance for damaged vacuum cleaner',
      'Review equipment maintenance schedules'
    ],
    complianceScore: 88,
    notes: 'Annual asset audit completed, requires management review',
    createdAt: new Date('2024-01-22'),
    completedAt: new Date('2024-01-23')
  }
]

// Generate mock adjustment requests
export const mockAdjustmentRequests = [
  {
    id: 'adj-001',
    itemId: 'menu-001',
    itemName: 'Premium Coffee Beans',
    requestType: 'stock-adjustment',
    currentStock: 15,
    proposedStock: 20,
    variance: 5,
    reason: 'Audit discrepancy - found additional stock in secondary storage',
    requestedBy: 'inventory-controller-001',
    requestedAt: new Date('2024-01-16'),
    status: 'pending',
    priority: 'normal',
    auditId: 'audit-001'
  },
  {
    id: 'adj-002',
    itemId: 'cleaning-001',
    itemName: 'Multi-Surface Disinfectant',
    requestType: 'write-off',
    currentStock: 25,
    proposedStock: 20,
    variance: -5,
    reason: 'Damaged containers found during audit',
    requestedBy: 'inventory-controller-001',
    requestedAt: new Date('2024-01-21'),
    status: 'approved',
    priority: 'high',
    approvedBy: 'inventory-controller-001',
    approvedAt: new Date('2024-01-21'),
    auditId: 'audit-002'
  },
  {
    id: 'adj-003',
    itemId: 'equipment-003',
    itemName: 'Vacuum Cleaner Set',
    requestType: 'condition-update',
    currentStock: 3,
    proposedStock: 3,
    variance: 0,
    reason: 'Update condition status - one unit requires maintenance',
    requestedBy: 'inventory-controller-001',
    requestedAt: new Date('2024-01-23'),
    status: 'requires-review',
    priority: 'medium',
    auditId: 'audit-003'
  }
]

// Helper functions for audits
export function getActiveAudits() {
  return mockAudits.filter(audit => audit.status === 'in-progress')
}

export function getCompletedAudits() {
  return mockAudits.filter(audit => audit.status === 'completed' || audit.status === 'approved')
}

export function getPendingAdjustments() {
  return mockAdjustmentRequests.filter(adj => adj.status === 'pending' || adj.status === 'requires-review')
}

export function getAuditsByType(type) {
  return mockAudits.filter(audit => audit.auditType === type)
}

export function getDiscrepanciesByAudit(auditId) {
  const audit = mockAudits.find(a => a.id === auditId)
  return audit ? audit.discrepancies : []
}