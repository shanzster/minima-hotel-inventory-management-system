# Bundle Implementation Guide

## Overview

The bundle system allows you to create reusable item bundles (consumables like toiletries), assign them to rooms, and track inventory consumption through housekeeping inspections after guest checkout.

## System Flow

```
1. Create Bundle → 2. Assign to Rooms → 3. Guest Checkout → 4. Housekeeping Inspection → 5. Inventory Deduction
```

---

## 1. Bundle Creation

### Location
- **Page**: `/inventory/bundles`
- **Component**: `BundleManager.jsx`

### Process

1. Navigate to Inventory → Bundles
2. Click "Create Bundle" button
3. Fill in bundle details:
   - **Bundle Type**: Standard, Deluxe, Suite, or Custom
   - **Bundle Name**: e.g., "Standard Room Kit"
   - **Description**: Optional description
   - **Items**: Add consumable items with quantities

### Bundle Structure
```javascript
{
  id: unique_id,
  name: "Standard Room Kit",
  description: "Essential toiletries for standard rooms",
  type: "standard", // standard, deluxe, suite, custom
  items: [
    {
      id: item_id,
      itemId: inventory_item_id,  // Reference to master inventory item
      name: "Toothpaste",
      category: "Toiletries",
      unit: "pcs",
      quantity: 2  // Expected quantity per room
    }
  ],
  createdAt: timestamp
}
```

### Storage
- **Key**: `hotel_inventory_bundles`
- **Location**: localStorage (can be migrated to Firebase)

---

## 2. Bundle Assignment to Rooms

### Location
- **Page**: `/inventory/bundles`
- **Component**: `BundleManager.jsx`

### Process

1. In the bundles page, click "Assign to Room" on any bundle
2. Select one or multiple rooms from the floor-organized grid
3. Click "Assign to X Room(s)"

### Assignment Structure
```javascript
// Storage Key: room_bundle_assignments
{
  "room_id_1": bundle_id,
  "room_id_2": bundle_id,
  "room_id_3": bundle_id
}
```

### Visual Indicators
- Rooms are organized by floor
- Selected rooms are highlighted
- Shows room number, type, and floor

---

## 3. Housekeeping Inspection (Post-Checkout)

### Location
- **Page**: `/housekeeping`
- **Component**: `HousekeepingChecklist.jsx`

### Process

1. Navigate to Housekeeping page
2. View room status:
   - **Green (Completed)**: Inspection done today
   - **Purple (Pending)**: Has bundle assigned, needs inspection
   - **Gray (No Bundle)**: No bundle assigned
3. Click on a pending room to start inspection
4. For each item in the bundle:
   - View expected quantity
   - Adjust remaining quantity using +/- buttons or direct input
   - System automatically calculates consumed items
5. Report issues/damages (optional)
6. Add additional notes (optional)
7. Click "Complete Inspection & Restock"

### Inspection Data Structure
```javascript
{
  room: {
    id: room_id,
    number: "101",
    floor: 1,
    type: "Standard"
  },
  bundle: bundle_object,
  itemsStatus: {
    item_id: {
      name: "Toothpaste",
      expectedQuantity: 2,
      remainingQuantity: 1,  // What's left in room
      consumed: 1,            // Automatically calculated
      status: "partial"       // full, partial, empty
    }
  },
  consumedItems: [...],  // Items with consumed > 0
  totalConsumed: 5,      // Total items consumed
  notes: "Additional observations",
  issues: [
    {
      id: issue_id,
      text: "Broken glass in bathroom",
      timestamp: timestamp
    }
  ],
  completedAt: timestamp
}
```

### Storage
- **Key**: `housekeeping_checklists`
- **Location**: localStorage

### Visual Features
- Color-coded item status:
  - **Green**: Full (no consumption)
  - **Amber**: Partial (some consumed)
  - **Red**: Empty (all consumed)
- Real-time consumption calculation
- Issue tracking with timestamps
- Summary of items to be restocked

---

## 4. Inventory Deduction (Critical Missing Step)

### Current Gap
The system currently:
✅ Creates bundles
✅ Assigns bundles to rooms
✅ Tracks consumption in housekeeping
❌ **Does NOT automatically deduct from inventory**

### Required Implementation

#### Step 1: Update `handleCompleteChecklist` in `/housekeeping/page.jsx`

```javascript
const handleCompleteChecklist = async (checklistData) => {
  // Save checklist
  const newChecklists = [...completedChecklists, checklistData]
  setCompletedChecklists(newChecklists)
  localStorage.setItem(CHECKLISTS_KEY, JSON.stringify(newChecklists))

  // NEW: Deduct consumed items from inventory
  if (checklistData.totalConsumed > 0) {
    await deductConsumedItemsFromInventory(checklistData)
  }

  setShowChecklistModal(false)
  setSelectedRoom(null)
  
  const roomNum = checklistData.room.number || checklistData.room.roomNumber
  toast.success(`Checklist completed for Room ${roomNum}. ${checklistData.totalConsumed} items deducted from inventory.`)
}
```

#### Step 2: Create Inventory Deduction Function

```javascript
const deductConsumedItemsFromInventory = async (checklistData) => {
  try {
    // Get all consumed items
    const consumedItems = Object.values(checklistData.itemsStatus)
      .filter(item => item.consumed > 0)

    // Process each consumed item
    for (const item of consumedItems) {
      // Find the inventory item by name or ID
      const inventoryItem = await inventoryApi.getById(item.itemId)
      
      if (inventoryItem) {
        // Create transaction for stock deduction
        await inventoryApi.updateStock(
          inventoryItem.id,
          -item.consumed,  // Negative for deduction
          {
            type: 'stock-out',
            reason: 'housekeeping-consumption',
            destination: `Room ${checklistData.room.number || checklistData.room.roomNumber}`,
            notes: `Guest checkout - ${item.consumed} ${item.name} consumed`,
            performedBy: user?.id || 'housekeeping',
            performedByRole: 'housekeeping',
            bundleName: checklistData.bundle.name,
            checklistId: checklistData.completedAt,
            createdAt: new Date().toISOString()
          }
        )
      }
    }

    // Log activity
    await firebaseDB.logActivity({
      type: 'HOUSEKEEPING_DEDUCTION',
      details: `${checklistData.totalConsumed} items deducted from Room ${checklistData.room.number}`,
      itemCount: checklistData.totalConsumed,
      roomNumber: checklistData.room.number,
      bundleName: checklistData.bundle.name,
      userRole: 'housekeeping'
    })

  } catch (error) {
    console.error('Error deducting inventory:', error)
    toast.error('Failed to update inventory. Please contact inventory manager.')
  }
}
```

#### Step 3: Update Bundle Items to Include Item IDs

When creating bundles, ensure each item includes the `itemId` reference:

```javascript
// In BundleManager.jsx - handleAddItem function
const handleAddItem = () => {
  if (!selectedItemId) return

  const selectedItem = inventoryItems.find(item => item.id === selectedItemId)
  if (!selectedItem) return

  const existingItem = bundleItems.find(item => item.itemId === selectedItemId)
  if (existingItem) {
    setBundleItems(bundleItems.map(item => 
      item.itemId === selectedItemId 
        ? { ...item, quantity: item.quantity + newItemQuantity }
        : item
    ))
  } else {
    setBundleItems([...bundleItems, {
      id: Date.now(),
      itemId: selectedItemId,  // ✅ Critical: Store inventory item ID
      name: selectedItem.name,
      category: selectedItem.category || 'Uncategorized',
      unit: selectedItem.unit || 'pcs',
      quantity: newItemQuantity
    }])
  }
  
  setSelectedItemId('')
  setNewItemQuantity(1)
}
```

---

## 5. Inventory Tracking & Reporting

### Transaction Records

Each housekeeping deduction creates a transaction:

```javascript
{
  id: transaction_id,
  itemId: inventory_item_id,
  itemName: "Toothpaste",
  type: "stock-out",
  quantity: -2,  // Negative for deduction
  previousStock: 100,
  newStock: 98,
  reason: "housekeeping-consumption",
  destination: "Room 101",
  bundleName: "Standard Room Kit",
  checklistId: checklist_timestamp,
  performedBy: user_id,
  performedByRole: "housekeeping",
  createdAt: timestamp,
  approved: true
}
```

### Reports Available

1. **Consumption by Room**: Track which rooms consume most items
2. **Consumption by Item**: Identify most consumed items
3. **Consumption by Bundle Type**: Compare standard vs deluxe consumption
4. **Restock Needs**: Items below threshold due to housekeeping consumption
5. **Cost Analysis**: Calculate cost of consumed items per room/stay

---

## 6. Print Functionality

### Individual Room Checklist
- Click printer icon on any room card
- Generates printable checklist with:
  - Room details
  - Bundle items with expected quantities
  - Empty fields for manual recording
  - Signature sections

### Bulk Print All Checklists
- Click "Print All Checklists" button
- Generates multi-page document
- One page per room with assigned bundle
- Useful for daily housekeeping rounds

---

## 7. Data Flow Diagram

```
┌─────────────────┐
│  Create Bundle  │
│  (Bundles Page) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Assign Bundle  │
│   to Rooms      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Guest Checkout  │
│  (External)     │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│ Housekeeping Inspection │
│  (Housekeeping Page)    │
└────────┬────────────────┘
         │
         ├─── Record Remaining Quantities
         ├─── Calculate Consumed Items
         ├─── Report Issues
         │
         ▼
┌─────────────────────────┐
│  Complete Inspection    │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Deduct from Inventory   │  ← CRITICAL STEP
│  (inventoryApi)         │
└────────┬────────────────┘
         │
         ├─── Update Stock Levels
         ├─── Create Transactions
         ├─── Generate Alerts (if low stock)
         │
         ▼
┌─────────────────────────┐
│   Updated Inventory     │
│   (Real-time Stock)     │
└─────────────────────────┘
```

---

## 8. Key Files & Components

### Pages
- `/app/(protected)/inventory/bundles/page.jsx` - Bundle management
- `/app/(protected)/housekeeping/page.jsx` - Housekeeping inspections

### Components
- `/components/inventory/BundleManager.jsx` - Bundle CRUD operations
- `/components/inventory/HousekeepingChecklist.jsx` - Inspection form

### APIs
- `/lib/inventoryApi.js` - Inventory operations
- `/lib/roomsApi.js` - Room data
- `/lib/firebase.js` - Database operations

### Storage Keys
- `hotel_inventory_bundles` - Bundle definitions
- `room_bundle_assignments` - Room-to-bundle mappings
- `housekeeping_checklists` - Completed inspections

---

## 9. Implementation Checklist

### Phase 1: Current (✅ Complete)
- [x] Create bundles with items
- [x] Assign bundles to rooms
- [x] Housekeeping inspection interface
- [x] Track consumed items
- [x] Print checklists

### Phase 2: Critical Missing (❌ To Implement)
- [ ] Automatic inventory deduction on inspection completion
- [ ] Link bundle items to inventory items via `itemId`
- [ ] Create transactions for consumed items
- [ ] Generate low-stock alerts from consumption
- [ ] Activity logging for housekeeping deductions

### Phase 3: Enhancements (Future)
- [ ] Consumption analytics dashboard
- [ ] Predictive restocking based on occupancy
- [ ] Cost tracking per room/stay
- [ ] Bundle templates by room type
- [ ] Automated reorder triggers
- [ ] Mobile app for housekeeping staff
- [ ] Barcode scanning for items
- [ ] Photo documentation of issues

---

## 10. Best Practices

### Bundle Design
- Create bundles by room type (Standard, Deluxe, Suite)
- Include all consumables that guests might use
- Set realistic expected quantities
- Review and update bundles quarterly

### Housekeeping Workflow
- Inspect rooms immediately after checkout
- Be accurate with remaining quantities
- Report all damages and issues
- Complete inspections before restocking

### Inventory Management
- Monitor consumption patterns
- Adjust restock thresholds based on consumption
- Review high-consumption items monthly
- Maintain buffer stock for popular items

### Data Integrity
- Ensure all bundle items have valid `itemId` references
- Validate inventory deductions
- Reconcile physical stock regularly
- Archive old checklists periodically

---

## 11. Troubleshooting

### Bundle Not Showing in Housekeeping
- **Check**: Room has bundle assigned in `/inventory/bundles`
- **Check**: Bundle exists in `hotel_inventory_bundles` localStorage
- **Check**: Room ID matches in `room_bundle_assignments`

### Inventory Not Deducting
- **Check**: `itemId` is stored in bundle items
- **Check**: Inventory item exists with matching ID
- **Check**: `inventoryApi.updateStock()` is called
- **Check**: Firebase connection is active

### Checklist Not Saving
- **Check**: localStorage is not full
- **Check**: Data structure matches expected format
- **Check**: Browser allows localStorage

### Print Not Working
- **Check**: Browser allows pop-ups
- **Check**: Bundle has items
- **Check**: Room data is complete

---

## 12. Migration to Firebase

Currently using localStorage. To migrate to Firebase:

1. Create Firebase collections:
   - `bundles/` - Bundle definitions
   - `roomBundleAssignments/` - Room assignments
   - `housekeepingChecklists/` - Inspection records

2. Update storage functions:
   ```javascript
   // Replace localStorage.setItem()
   await firebaseDB.write('bundles', bundleData)
   
   // Replace localStorage.getItem()
   const bundles = await firebaseDB.read('bundles')
   ```

3. Add real-time listeners:
   ```javascript
   firebaseDB.onBundlesChange((bundles) => {
     setBundles(bundles)
   })
   ```

---

## Summary

The bundle system streamlines housekeeping operations by:
1. Pre-defining item sets for different room types
2. Tracking actual consumption vs expected quantities
3. Automatically updating inventory based on guest usage
4. Providing audit trails for all consumption
5. Generating actionable restocking data

The critical missing piece is the automatic inventory deduction, which should be implemented in Phase 2 to complete the workflow and ensure accurate stock levels.
