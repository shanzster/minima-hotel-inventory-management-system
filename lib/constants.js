// Constants - will be expanded in subsequent tasks

// Currency Configuration
export const CURRENCY = {
  CODE: 'PHP',
  SYMBOL: '₱',
  LOCALE: 'en-PH'
}

export const INVENTORY_CATEGORIES = {
  'toiletries': 'Toiletries',
  'food-beverage': 'Food & Beverage',
  'beverages': 'Beverages',
  'cleaning-supplies': 'Cleaning Supplies',
  'kitchen-consumables': 'Kitchen Consumables',
  'office-supplies': 'Office Supplies',
  'menu-items': 'Menu Items',
  'equipment': 'Equipment',
  'furniture': 'Furniture'
}

export const USER_ROLES = [
  'inventory-controller',
  'kitchen-staff', 
  'purchasing-officer'
]

export const STOCK_STATUSES = [
  'normal',
  'low',
  'critical',
  'excess'
]

export const PURCHASE_ORDER_STATUSES = [
  'pending',
  'approved',
  'in-transit',
  'delivered',
  'cancelled'
]

export const TRANSACTION_TYPES = [
  'stock-in',
  'stock-out',
  'adjustment'
]

export const TRANSACTION_REASONS = {
  'stock-out': [
    'guest-usage',
    'kitchen-usage',
    'housekeeping',
    'maintenance',
    'damaged-expired',
    'transfer',
    'other'
  ],
  'adjustment': [
    'physical-count',
    'damaged',
    'expired',
    'lost',
    'system-error',
    'other'
  ]
}