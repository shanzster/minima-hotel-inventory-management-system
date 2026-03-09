# Bundle Stock Movement Tracking

## Overview
Complete integration of bundle consumption tracking into the inventory system, showing real-time stock deductions from housekeeping inspections in product details pages.

---

## How It Works

### Stock Deduction Flow

1. **Guest Checks Out**
   - Room status changes to "available"
   - Bundle status changes to "needs-inspection"
   - Room card turns RED in housekeeping dashboard

2. **Housekeeping Inspection**
   - Housekeeping staff clicks room card
   - Records consumed items in checklist
   - Completes inspection

3. **Stock Deduction** (Automatic)
   ```javascript
   // For each consumed item:
   - Get current inventory item
   - Check if sufficient stock exists
   - Deduct consumed quantity: newStock = currentStock - consumed
   - Update inventory item with new stock level
   - Create bundle transaction record
   - Create inspection record
   ```

4. **Transaction Recording**
   ```javascript
   {
     type: 'bundle-consumption',
     itemId: 'inv_001',
     itemName: 'Toothpaste',
     quantity: -2, // Negative for consumption
     previousStock: 100,
     newStock: 98,
     reason: 'Bundle consumption - Room room_101',
     roomId: 'room_101',
     bundleName: 'Standard Room Kit',
     performedBy: 'user_housekeeping_123',
     performedByName: 'Maria Santos',
     performedByRole: 'housekeeping',
     createdAt: '2026-03-09T16:30:00Z',
     approved: true,
     notes: 'Room in good condition'
   }
   ```

---

## Product Details Page Enhancements

### Bundle Consumption Stats Card

**Location**: Top of product details page (after header, before alerts)

**Displays When**: Item has bundle consumption transactions

**Information Shown**:
- Total units consumed across all inspections
- Number of unique rooms where item was consumed
- Total number of inspections that consumed this item
- Date of last consumption

**Visual Design**:
- Purple theme (distinguishes from other alerts)
- Icon: Building/hotel icon
- 4 stat boxes in a grid
- "View Details" button to open transaction manager

**Example**:
```
┌─────────────────────────────────────────────────────────────┐
│ 🏨 Bundle Consumption Tracking                    View Details│
│ This item is being consumed through housekeeping inspections │
│                                                               │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│ │    45    │ │    12    │ │    23    │ │ Mar 9    │        │
│ │ Consumed │ │  Rooms   │ │Inspections│ │   2026   │        │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
└─────────────────────────────────────────────────────────────┘
```

### Transaction History Enhancements

**Bundle Consumption Transactions Display**:

**Type Column**:
- Shows "Bundle Consumption" in purple
- Displays bundle name below type

**Quantity Column**:
- Shows negative number in red (e.g., "-2")
- Indicates stock reduction

**Performed By Column**:
- Shows housekeeping staff name
- Displays room number below name

**Reason Column**:
- Shows hotel icon
- Displays "Bundle consumption - Room [number]"

**Status Column**:
- Purple badge: "Auto-Approved"
- Bundle consumptions don't require manual approval

**Example Transaction Row**:
```
┌──────────────────────────────────────────────────────────────────────────┐
│ Date       │ Type              │ Qty │ Prev │ New │ By          │ Status │
├──────────────────────────────────────────────────────────────────────────┤
│ Mar 9 2026 │ Bundle Consumption│ -2  │ 100  │ 98  │ Maria Santos│ Auto-  │
│            │ Standard Room Kit │     │      │     │ Room 101    │Approved│
└──────────────────────────────────────────────────────────────────────────┘
```

---

## API Implementation

### inventoryApi.getTransactions(itemId)

**Purpose**: Fetch all transactions for an item, including bundle consumptions

**Process**:
1. Read all bundle transactions from Firebase
2. Filter transactions that consumed this specific item
3. Transform bundle transactions to standard transaction format
4. Fetch regular inventory transactions
5. Combine both types of transactions
6. Sort by date (newest first)
7. Resolve user IDs to user names
8. Return combined array

**Returns**:
```javascript
[
  {
    id: 'trans_123',
    type: 'bundle-consumption',
    itemId: 'inv_001',
    itemName: 'Toothpaste',
    quantity: -2,
    previousStock: 100,
    newStock: 98,
    reason: 'Bundle consumption - Room room_101',
    roomId: 'room_101',
    bundleName: 'Standard Room Kit',
    performedBy: 'user_123',
    performedByName: 'Maria Santos',
    performedByRole: 'housekeeping',
    createdAt: '2026-03-09T16:30:00Z',
    approved: true,
    notes: 'Room in good condition'
  },
  // ... more transactions
]
```

---

## Visual Indicators

### Color Coding

**Bundle Consumption Transactions**:
- Purple theme throughout
- Purple badge for "Auto-Approved"
- Purple icon for bundle type
- Red text for negative quantities

**Regular Transactions**:
- Standard colors (blue, green, etc.)
- Standard badges
- Standard icons

### Icons

**Bundle Consumption**:
```
🏨 Building/Hotel icon
```

**Regular Transactions**:
```
📦 Box icon (stock-in)
📤 Upload icon (stock-out)
⚙️ Settings icon (adjustment)
```

---

## Benefits

### 1. Complete Transparency
- See exactly where stock is going
- Track consumption by room
- Identify high-consumption items
- Monitor housekeeping patterns

### 2. Accurate Stock Levels
- Real-time deductions
- No manual stock adjustments needed
- Automatic inventory updates
- Prevents stock discrepancies

### 3. Audit Trail
- Every consumption logged
- Inspector name recorded
- Room number tracked
- Timestamp captured

### 4. Analytics Ready
- Consumption trends per item
- Room-based consumption patterns
- Inspector performance data
- Forecasting data available

### 5. Inventory Planning
- Know which items are consumed most
- Plan reorders based on actual usage
- Optimize bundle contents
- Reduce waste

---

## User Workflows

### Inventory Controller Workflow

1. **Navigate to Inventory**
   - Go to `/inventory`
   - See all inventory items

2. **Select Item**
   - Click on item (e.g., "Toothpaste")
   - View item details page

3. **Check Bundle Consumption**
   - See purple stats card at top
   - View total consumed, rooms, inspections
   - Check last consumption date

4. **View Transaction History**
   - Click "Manage Transactions" or "View Details"
   - See all transactions including bundle consumptions
   - Filter by type if needed
   - Export data if needed

5. **Analyze Patterns**
   - Identify high-consumption rooms
   - Track consumption trends
   - Plan reorders accordingly

### Housekeeping Staff Workflow

1. **Perform Inspection**
   - Complete room inspection
   - Record consumed items
   - Submit inspection

2. **System Automatically**:
   - Deducts stock from inventory
   - Creates transaction record
   - Updates item stock levels
   - Logs inspector information

3. **No Additional Steps**:
   - Housekeeping doesn't need to access inventory
   - Stock updates happen automatically
   - Focus on inspection quality

---

## Database Structure

### Bundle Transactions
```javascript
// Firebase: bundle_transactions/{transactionId}
{
  id: "trans_123",
  type: "bundle-consumption",
  roomId: "room_101",
  bundleId: "bundle_123",
  bundleName: "Standard Room Kit",
  consumedItems: [
    {
      itemId: "inv_001",
      name: "Toothpaste",
      consumed: 2,
      previousStock: 100,
      newStock: 98
    }
    // ... more items
  ],
  inspectedBy: "user_housekeeping_123",
  timestamp: "2026-03-09T16:30:00Z",
  notes: "Room in good condition"
}
```

### Inventory Items (Updated Stock)
```javascript
// Firebase: inventory/{itemId}
{
  id: "inv_001",
  name: "Toothpaste",
  currentStock: 98, // Updated from 100
  restockThreshold: 20,
  // ... other fields
}
```

---

## Testing Scenarios

### Scenario 1: Single Item Consumption
1. Item has 100 units in stock
2. Guest checks out of Room 101
3. Housekeeping inspects, records 2 toothpaste consumed
4. Complete inspection
5. Verify:
   - Item stock reduced to 98
   - Transaction created with type "bundle-consumption"
   - Transaction shows -2 quantity
   - Previous stock: 100, New stock: 98
   - Inspector name shown
   - Room 101 shown

### Scenario 2: Multiple Items Consumption
1. Bundle has 5 different items
2. Guest checks out
3. Housekeeping records consumption for all 5 items
4. Complete inspection
5. Verify:
   - All 5 items have reduced stock
   - 5 separate transactions created
   - All transactions linked to same room
   - All transactions show same inspector
   - All transactions have same timestamp

### Scenario 3: View Product Details
1. Navigate to Toothpaste product page
2. Verify purple stats card shows:
   - Total consumed: 45 units
   - Rooms: 12 unique rooms
   - Inspections: 23 total
   - Last consumption date
3. Click "View Details"
4. Verify transaction history shows:
   - Bundle consumption transactions in purple
   - Regular transactions in standard colors
   - All sorted by date
   - Inspector names resolved

### Scenario 4: Insufficient Stock
1. Item has 1 unit in stock
2. Guest checks out
3. Housekeeping tries to record 2 units consumed
4. Complete inspection
5. Verify:
   - Error message shown
   - Stock not deducted
   - Transaction not created
   - Alert shown to reorder

---

## Future Enhancements

### Analytics Dashboard
- Consumption trends chart
- Top consumed items
- Room consumption heatmap
- Inspector performance metrics

### Alerts & Notifications
- Low stock alerts based on consumption rate
- High consumption room alerts
- Unusual consumption pattern detection
- Automatic reorder suggestions

### Reporting
- Monthly consumption reports
- Cost analysis per room
- Bundle efficiency reports
- Waste reduction recommendations

### Mobile App
- Real-time stock updates on mobile
- Push notifications for low stock
- Mobile-friendly transaction history
- Barcode scanning for verification

---

## Files Modified

1. **lib/inventoryApi.js**
   - Added `getTransactions()` method
   - Fetches bundle consumption transactions
   - Combines with regular transactions
   - Resolves user names

2. **components/inventory/TransactionManager.jsx**
   - Enhanced transaction display
   - Added bundle consumption formatting
   - Purple theme for bundle transactions
   - Room number display

3. **app/(protected)/inventory/[id]/page.jsx**
   - Added bundle consumption stats card
   - Added `loadBundleConsumptionStats()` function
   - Enhanced visual indicators

---

**Status**: ✅ Production Ready  
**Implementation Date**: March 9, 2026  
**Verified**: Stock deductions working correctly  
**Tracking**: Complete audit trail maintained
