# Housekeeping Account Implementation

## Overview
Housekeeping accounts are specialized user accounts with limited access focused solely on room inspection and bundle management. These accounts handle the physical verification and stock tracking of consumable items in guest rooms.

## Account Type & Permissions

### Housekeeping User Role
- **Role Name**: `housekeeping`
- **Access Level**: Limited to housekeeping module only
- **Capabilities**:
  - View rooms with assigned bundles
  - Perform post-checkout inspections
  - Record consumed vs. remaining items
  - Update bundle status (needs-inspection → ready)
  - View room status and bundle assignments

### Restricted Access
Housekeeping accounts CANNOT:
- Assign bundles to rooms (admin/inventory only)
- Create or edit bundles (admin/inventory only)
- Access inventory management
- Access purchasing module
- Access kitchen module
- Modify room information
- View financial data or reports

## Bundle Workflow with Real Stock Management

### 1. Bundle Assignment (Admin/Inventory Staff) - PERMANENT
**Who**: Admin or Inventory Manager
**When**: Initial room setup (one-time assignment)
**Process**:
1. Navigate to Bundle Management page
2. Select bundle type (Standard, Deluxe, Suite, etc.)
3. Choose room category (Standard Room, Deluxe Room, Suite, etc.)
4. Select specific rooms for assignment
5. System assigns bundle to room(s) PERMANENTLY
6. **Stock Status**: NO stock deduction - bundle is just "assigned" to the room
7. Bundle is physically placed in the room (full quantities)

**Database Changes**:
```javascript
// Firebase: room_bundle_assignments/{roomId}
{
  bundleId: "bundle_123",
  bundleName: "Standard Room Kit",
  assignedAt: "2026-03-04T10:30:00Z",
  assignedBy: "admin_user_id",
  items: [
    { itemId: "inv_001", name: "Toothpaste", quantity: 2 },
    { itemId: "inv_002", name: "Toothbrush", quantity: 2 },
    // ... all bundle items
  ]
}

// Firebase: room_bundle_status/{roomId}
{
  status: "ready", // ready, pending, needs-inspection
  lastUpdated: "2026-03-04T10:30:00Z"
}
```

**Important**: Bundle assignment is PERMANENT. The room will always have this bundle until manually removed or changed.

### 2. Room Booking (Automatic)
**Who**: System (triggered by room status change)
**When**: Room status changes from "available" to "occupied"
**Process**:
1. System detects room booking
2. Bundle status changes: `ready` → `pending`
3. **NO STOCK DEDUCTION** - Bundle is already in the room, just being used
4. Room card shows AMBER (pending/in use) in housekeeping dashboard

**Stock Status**: No changes - items are already in the room from initial assignment

### 3. Guest Checkout (Automatic)
**Who**: System (triggered by room status change)
**When**: Room status changes from "occupied" to "available"
**Process**:
1. System detects checkout
2. Bundle status changes: `pending` → `needs-inspection`
3. Room card turns RED in housekeeping dashboard
4. Housekeeping notification triggered
5. **No stock changes yet** - waiting for inspection

### 4. Post-Checkout Inspection (Housekeeping Staff) - CONSUMPTION TRACKING
**Who**: Housekeeping Account User
**When**: After guest checkout, before next booking
**Process**:

#### Step 1: Login
- Housekeeping staff logs in with their credentials
- Redirected to Housekeeping Dashboard (only accessible module)

#### Step 2: View Rooms Needing Inspection
- Dashboard shows all rooms with `needs-inspection` status (RED cards)
- Rooms grouped by floor
- Each card shows:
  - Room number
  - Room type
  - Bundle name
  - "Inspection Needed" badge

#### Step 3: Start Inspection
- Click on RED room card
- Inspection checklist modal opens
- Shows all items from the assigned bundle
- For each item, housekeeping staff records:
  - **Consumed**: How many units were used by the guest

#### Step 4: Record Item Consumption
**Example Checklist**:
```
Bundle: Standard Room Kit
Room: 101

Item                 | In Bundle | Consumed | Need to Refurbish
---------------------|-----------|----------|-------------------
Toothpaste          |     2     |    1     |        1
Toothbrush          |     2     |    2     |        2
Shampoo             |     1     |    1     |        1
Body Wash           |     1     |    0     |        0
Soap Bar            |     2     |    1     |        1
Towels              |     4     |    0     |        0 (cleaned)
Tissues             |     1     |    1     |        1
Toilet Paper        |     4     |    2     |        2
```

**Validation Rules**:
- Consumed cannot exceed bundle quantity
- Consumed must be 0 or positive number
- All items must be checked

#### Step 5: Complete Inspection & Refurbish
- Housekeeping clicks "Complete Inspection"
- **REAL STOCK DEDUCTION**: Only consumed items are deducted from inventory
- System shows what needs to be refurbished
- Housekeeping physically restocks the consumed items in the room
- Bundle status changes: `needs-inspection` → `ready`
- Room card turns GREEN
- Room is ready for next booking

**Stock Deduction Example** (Only consumed items):
```javascript
// Based on checklist above, deduct consumed items from inventory:
Toothpaste: 100 → 99 (-1 consumed)
Toothbrush: 150 → 148 (-2 consumed)
Shampoo: 80 → 79 (-1 consumed)
Soap Bar: 200 → 199 (-1 consumed)
Tissues: 50 → 49 (-1 consumed)
Toilet Paper: 200 → 198 (-2 consumed)

// Body Wash and Towels: NO deduction (not consumed)

// Transaction created:
{
  type: "bundle-consumption",
  roomId: "room_101",
  bundleId: "bundle_123",
  consumedItems: [
    { itemId: "inv_001", name: "Toothpaste", quantity: 1 },
    { itemId: "inv_002", name: "Toothbrush", quantity: 2 },
    { itemId: "inv_003", name: "Shampoo", quantity: 1 },
    { itemId: "inv_005", name: "Soap Bar", quantity: 1 },
    { itemId: "inv_007", name: "Tissues", quantity: 1 },
    { itemId: "inv_008", name: "Toilet Paper", quantity: 2 }
  ],
  inspectedBy: "housekeeping_user_id",
  timestamp: "2026-03-04T16:30:00Z",
  notes: "Refurbished consumed items"
}
```

### 5. Cycle Repeats
- Room is now `ready` (GREEN card)
- Bundle is fully stocked again (housekeeping refurbished it)
- When room is booked again, cycle repeats from Step 2

## Key Differences from Previous Implementation

### OLD (Incorrect) Workflow:
- ❌ Stock deducted when room is booked
- ❌ Unused items returned to stock after inspection
- ❌ Bundle "deployed" and "returned" each booking

### NEW (Correct) Workflow:
- ✅ Bundle permanently assigned to room
- ✅ Stock deducted only when items are consumed
- ✅ Housekeeping refurbishes consumed items
- ✅ Bundle stays in room, just gets restocked

## Database Schema

### Users Collection
```javascript
// Firebase: users/{userId}
{
  id: "user_123",
  email: "housekeeping1@hotel.com",
  role: "housekeeping", // New role type
  name: "Maria Santos",
  department: "Housekeeping",
  createdAt: "2026-03-01T00:00:00Z",
  active: true
}
```

### Bundles Collection
```javascript
// Firebase: bundles/{bundleId}
{
  id: "bundle_123",
  name: "Standard Room Kit",
  description: "Essential toiletries for standard rooms",
  type: "standard",
  items: [
    {
      id: "item_1",
      itemId: "inv_001", // Reference to inventory item
      name: "Toothpaste",
      category: "toiletries",
      quantity: 2,
      unit: "pcs"
    },
    // ... more items
  ],
  createdAt: "2026-03-01T00:00:00Z",
  updatedAt: "2026-03-01T00:00:00Z"
}
```

### Room Bundle Assignments (PERMANENT)
```javascript
// Firebase: room_bundle_assignments/{roomId}
{
  bundleId: "bundle_123",
  bundleName: "Standard Room Kit",
  bundleType: "standard",
  assignedAt: "2026-03-04T10:30:00Z",
  assignedBy: "admin_user_id",
  items: [
    {
      id: "item_1",
      itemId: "inv_001", // Reference to inventory item
      name: "Toothpaste",
      category: "toiletries",
      quantity: 2, // Full quantity in bundle
      unit: "pcs"
    },
    {
      id: "item_2",
      itemId: "inv_002",
      name: "Toothbrush",
      category: "toiletries",
      quantity: 2,
      unit: "pcs"
    }
    // ... more items
  ]
}
```

**Note**: This stores the complete bundle configuration. The room will always have this bundle until manually removed.

### Room Bundle Status
```javascript
// Firebase: room_bundle_status/{roomId}
{
  status: "ready", // ready | pending | needs-inspection
  lastDeployment: "2026-03-04T14:00:00Z",
  lastInspection: "2026-03-04T16:30:00Z",
  lastInspectedBy: "housekeeping_user_id",
  lastUpdated: "2026-03-04T16:30:00Z"
}
```

### Bundle Transactions (Consumption Only)
```javascript
// Firebase: bundle_transactions/{transactionId}
{
  id: "trans_123",
  type: "bundle-consumption", // Only consumption, no deployment or return
  roomId: "room_101",
  bundleId: "bundle_123",
  consumedItems: [
    {
      itemId: "inv_001",
      name: "Toothpaste",
      quantity: 1, // Amount consumed
      previousStock: 100,
      newStock: 99
    },
    {
      itemId: "inv_002",
      name: "Toothbrush",
      quantity: 2,
      previousStock: 150,
      newStock: 148
    }
  ],
  inspectedBy: "housekeeping_user_id",
  timestamp: "2026-03-04T16:30:00Z",
  notes: "Refurbished consumed items"
}
```

### Inspection Records
```javascript
// Firebase: inspection_records/{inspectionId}
{
  id: "insp_123",
  roomId: "room_101",
  bundleId: "bundle_123",
  inspectedBy: "housekeeping_user_id",
  inspectedAt: "2026-03-04T16:30:00Z",
  items: [
    {
      itemId: "inv_001",
      name: "Toothpaste",
      bundleQuantity: 2, // Full quantity in bundle
      consumed: 1, // Amount consumed by guest
      needsRefurbish: 1 // Amount to restock
    },
    {
      itemId: "inv_002",
      name: "Toothbrush",
      bundleQuantity: 2,
      consumed: 2,
      needsRefurbish: 2
    },
    {
      itemId: "inv_004",
      name: "Body Wash",
      bundleQuantity: 1,
      consumed: 0,
      needsRefurbish: 0 // No restocking needed
    }
  ],
  totalConsumed: 8, // Total items consumed
  totalRefurbished: 8, // Total items restocked
  notes: "Room in good condition, all consumed items restocked"
}
```

## UI Components

### Housekeeping Dashboard
**File**: `app/(protected)/housekeeping/page.jsx`

**Features**:
- Filter tabs: All Rooms | Needs Inspection | Pending | Ready
- Summary cards showing counts
- Room cards color-coded by status:
  - 🔴 RED: Needs Inspection (clickable)
  - 🟠 AMBER: Pending (in use, not clickable)
  - 🟢 GREEN: Ready (not clickable)
  - ⚪ GRAY: No Bundle (not clickable)
- Print checklist button for inspection rooms
- Remove bundle button (top-left corner)

### Inspection Checklist Modal
**Component**: `components/inventory/HousekeepingChecklist.jsx`

**Features**:
- Room information header
- Bundle name and type
- Item-by-item checklist with:
  - Item name and category
  - Deployed quantity (read-only)
  - Consumed input field
  - Remaining input field (auto-calculated)
  - Validation indicators
- Summary section:
  - Total items deployed
  - Total consumed
  - Total returned
- Notes field (optional)
- Complete Inspection button
- Cancel button

## Authentication & Authorization

### Login Flow
1. User enters email/password
2. System checks user role
3. If role = "housekeeping":
   - Redirect to `/housekeeping`
   - Hide all other navigation items
   - Show only Housekeeping module
4. If role = "admin" or "inventory":
   - Full access to all modules

### Route Protection
```javascript
// middleware.js or route guard
const ROLE_PERMISSIONS = {
  admin: ['*'], // All routes
  inventory: ['/inventory', '/suppliers', '/purchase-orders', '/bundles'],
  kitchen: ['/kitchen', '/menu'],
  housekeeping: ['/housekeeping'], // ONLY housekeeping
  purchasing: ['/purchase-orders', '/suppliers']
}

function checkAccess(userRole, requestedPath) {
  const allowedPaths = ROLE_PERMISSIONS[userRole]
  if (allowedPaths.includes('*')) return true
  return allowedPaths.some(path => requestedPath.startsWith(path))
}
```

### Navigation Menu (Housekeeping Role)
```javascript
// Only show these items for housekeeping users:
- Dashboard (redirects to /housekeeping)
- Housekeeping
- Help
- Settings (limited to profile only)
- Logout
```

## Implementation Steps

### Phase 1: User Role System
1. ✅ Add `role` field to user schema
2. ✅ Create housekeeping user accounts
3. ✅ Update authentication to check roles
4. ✅ Implement route guards based on roles
5. ✅ Update navigation menu to show/hide based on role

### Phase 2: Bundle API Integration
1. ✅ Create `lib/bundlesApi.js`
2. ✅ Migrate bundles from localStorage to Firebase
3. ✅ Migrate room assignments to Firebase
4. ✅ Migrate bundle status to Firebase
5. ✅ Update all components to use API

### Phase 3: Real Stock Management
1. ⏳ Implement stock deduction on room booking
2. ⏳ Create bundle deployment transactions
3. ⏳ Implement stock return on inspection completion
4. ⏳ Create inspection return transactions
5. ⏳ Add validation for stock availability

### Phase 4: Inspection System
1. ⏳ Update HousekeepingChecklist component
2. ⏳ Add consumed/remaining input fields
3. ⏳ Implement validation (consumed + remaining = deployed)
4. ⏳ Add auto-calculation for remaining items
5. ⏳ Create inspection records in database

### Phase 5: Reporting & Analytics
1. ⏳ Consumption reports per room
2. ⏳ Consumption reports per bundle type
3. ⏳ Housekeeping performance metrics
4. ⏳ Stock usage trends
5. ⏳ Waste analysis (consumed vs. deployed)

## Testing Scenarios

### Scenario 1: Complete Workflow
1. Admin assigns Standard Room Kit to Room 101
2. Room 101 is booked (status: available → occupied)
3. System deducts stock for all bundle items
4. Guest checks out (status: occupied → available)
5. Room card turns RED in housekeeping dashboard
6. Housekeeping staff logs in
7. Opens Room 101 inspection checklist
8. Records consumed and remaining items
9. Completes inspection
10. System returns unused items to stock
11. Room card turns GREEN
12. Verify inventory stock levels are correct

### Scenario 2: Multiple Rooms
1. Admin assigns bundles to Rooms 101, 102, 103
2. All rooms are booked simultaneously
3. Verify stock deduction for all rooms
4. All guests check out
5. Housekeeping inspects all three rooms
6. Verify stock returns are accurate

### Scenario 3: Insufficient Stock
1. Admin tries to assign bundle to room
2. System checks if sufficient stock exists
3. If insufficient, show warning and prevent assignment
4. Suggest reordering items

### Scenario 4: Housekeeping Access Control
1. Housekeeping user logs in
2. Verify only housekeeping module is accessible
3. Try to access inventory page (should be blocked)
4. Try to access bundle management (should be blocked)
5. Verify can only view and inspect rooms

## Future Enhancements

### Mobile App for Housekeeping
- Native mobile app for housekeeping staff
- Barcode scanning for items
- Photo upload for room condition
- Offline mode with sync

### Smart Notifications
- Push notifications when rooms need inspection
- SMS alerts for urgent inspections
- Email summaries of daily inspections

### Predictive Analytics
- Predict consumption patterns
- Suggest optimal bundle quantities
- Identify high-waste items
- Recommend bundle adjustments

### Integration with PMS
- Automatic room status sync
- Guest preferences (extra towels, etc.)
- VIP guest special bundles
- Housekeeping schedule optimization

## Notes
- All stock movements must be tracked with transactions
- Housekeeping staff cannot modify inventory directly
- Bundle assignments require admin/inventory role
- Inspection records are immutable (audit trail)
- System should handle edge cases (partial inspections, damaged items, etc.)
