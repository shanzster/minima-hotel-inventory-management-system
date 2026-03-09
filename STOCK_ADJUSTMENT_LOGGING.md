# Stock Adjustment Logging

## Overview
Complete logging system for all stock adjustments with user tracking, showing who adjusted stocks, when, and why.

---

## Features Implemented

### 1. Transaction Persistence to Firebase
✅ All transactions now saved to Firebase database
✅ Stored in `inventory_transactions/{itemId}` path
✅ Includes complete user information
✅ Permanent audit trail

### 2. User Tracking for All Transaction Types

#### Stock-In Transactions
- Who added stock
- User role
- Supplier information
- Batch details
- Timestamp

#### Stock-Out Transactions
- Who removed stock
- User role
- Destination/reason
- Quantity removed
- Timestamp

#### Stock Adjustments
- Who adjusted stock
- User role
- Previous stock level
- New stock level
- Change amount (+/-)
- Reason for adjustment
- Timestamp
- Approval status
- Who approved (if applicable)

#### Bundle Consumption (Automatic)
- Housekeeping staff who inspected
- Room number
- Bundle name
- Items consumed
- Timestamp

---

## Transaction Data Structure

### Complete Transaction Record
```javascript
{
  id: "txn-1234567890-abc123",
  itemId: "inv_001",
  itemName: "Toothpaste",
  type: "adjustment", // or "stock-in", "stock-out", "bundle-consumption"
  quantity: 50, // For adjustments: new stock level
  previousStock: 45,
  newStock: 50,
  reason: "Physical count correction",
  
  // User Information
  performedBy: "user_admin_123",
  performedByName: "John Smith",
  performedByRole: "inventory-controller",
  
  // Approval Information (for adjustments)
  approved: true,
  approvedBy: "user_admin_123",
  approvedByName: "John Smith",
  
  // Additional Details
  supplier: "supplier_001", // For stock-in
  batchNumber: "BATCH-2026-001", // For stock-in
  expirationDate: "2027-03-09", // For stock-in
  destination: "Kitchen", // For stock-out
  
  // Bundle-specific (for bundle-consumption)
  roomId: "room_101",
  bundleName: "Standard Room Kit",
  
  // Metadata
  createdAt: "2026-03-09T16:30:00Z",
  notes: "Optional notes"
}
```

---

## Visual Display Enhancements

### Transaction History Table

#### Adjustment Transactions Display

**Type Column**:
```
Stock Adjustment
Physical count correction
```
- Orange theme
- Shows adjustment reason below type

**Quantity Column**:
```
+5
New: 50
```
- Green for increases (+)
- Red for decreases (-)
- Shows change amount and new total

**New Stock Column**:
```
50 (+5)
```
- Shows new stock level
- Shows change in parentheses
- Color-coded: green for increase, red for decrease

**Performed By Column**:
```
John Smith
Adjusted Stock
```
- Shows user name
- "Adjusted Stock" label in orange

**Reason Column**:
```
⚙️ Physical count correction
```
- Adjustment icon (sliders)
- Reason text

**Status Column**:
```
Approved
by John Smith
```
- Green badge if approved
- Yellow badge if pending
- Shows approver name

---

## User Workflows

### Inventory Controller - Stock Adjustment

1. **Navigate to Item**
   - Go to Inventory
   - Click on item (e.g., "Toothpaste")

2. **Open Transaction Manager**
   - Click "Manage Transactions"
   - Click "Adjustment" button

3. **Fill Adjustment Form**
   - Enter new stock level (e.g., 50)
   - Select reason (e.g., "Physical count")
   - Add notes (optional)
   - Submit

4. **System Records**:
   - User ID: `user_admin_123`
   - User name: "John Smith"
   - User role: "inventory-controller"
   - Previous stock: 45
   - New stock: 50
   - Change: +5
   - Timestamp: Current time
   - Approved: true (auto-approved for inventory controllers)
   - Approver: Same user

5. **Transaction Saved**:
   - Saved to Firebase: `inventory_transactions/inv_001/{transactionId}`
   - Item stock updated in Firebase
   - Transaction appears in history immediately

6. **View History**:
   - See adjustment in transaction list
   - Orange "Stock Adjustment" badge
   - Shows who made adjustment
   - Shows change amount
   - Shows approval status

### Admin - Review Adjustments

1. **Navigate to Item**
   - Go to Inventory
   - Click on item

2. **View Transaction History**
   - Click "Manage Transactions"
   - Scroll to Transaction History section

3. **Review Adjustments**:
   - See all adjustments with orange theme
   - Check who made each adjustment
   - Verify reasons provided
   - Check approval status
   - View change amounts

4. **Audit Trail**:
   - Complete history of all changes
   - User names for accountability
   - Timestamps for tracking
   - Reasons for transparency

---

## Color Coding System

### Transaction Types

**Bundle Consumption**: Purple
- Purple badge: "Auto-Approved"
- Purple icon: Building/hotel
- Purple text for bundle name

**Stock Adjustment**: Orange
- Orange text for "Stock Adjustment"
- Orange icon: Sliders/settings
- Orange label: "Adjusted Stock"
- Green/Red for increase/decrease

**Stock-In**: Green
- Green text for positive quantities
- Green indicators

**Stock-Out**: Red
- Red text for negative quantities
- Red indicators

---

## Database Structure

### Firebase Path
```
inventory_transactions/
  {itemId}/
    {transactionId}/
      id: "txn-..."
      itemId: "inv_001"
      itemName: "Toothpaste"
      type: "adjustment"
      quantity: 50
      previousStock: 45
      newStock: 50
      reason: "Physical count correction"
      performedBy: "user_admin_123"
      performedByName: "John Smith"
      performedByRole: "inventory-controller"
      approved: true
      approvedBy: "user_admin_123"
      approvedByName: "John Smith"
      createdAt: "2026-03-09T16:30:00Z"
```

### Inventory Item (Updated)
```
inventory/
  {itemId}/
    id: "inv_001"
    name: "Toothpaste"
    currentStock: 50  // Updated
    updatedAt: "2026-03-09T16:30:00Z"  // Updated
    updatedBy: "user_admin_123"  // Updated
    // ... other fields
```

---

## Approval Workflow

### Auto-Approved Transactions
- Inventory Controllers: All transactions auto-approved
- Bundle Consumption: Always auto-approved
- Small adjustments: Auto-approved

### Requires Approval
- Large adjustments (>100 units)
- High-value transactions (>$1000)
- Non-inventory-controller users

### Approval Display
```
Status Column:
┌─────────────┐
│  Approved   │  ← Green badge
│ by John S.  │  ← Approver name
└─────────────┘

or

┌─────────────┐
│   Pending   │  ← Yellow badge
└─────────────┘
```

---

## Benefits

### 1. Complete Accountability
- Every adjustment tracked
- User names recorded
- Roles documented
- Timestamps captured

### 2. Audit Compliance
- Full transaction history
- Who, what, when, why recorded
- Approval trail maintained
- Permanent records

### 3. Fraud Prevention
- Cannot make anonymous adjustments
- All changes attributed to users
- Approval workflow for large changes
- Complete transparency

### 4. Error Tracking
- Identify who made mistakes
- Track correction patterns
- Improve training based on data
- Reduce future errors

### 5. Performance Monitoring
- Track user activity
- Identify frequent adjusters
- Monitor adjustment reasons
- Optimize processes

---

## Reporting Capabilities

### Available Reports (Future)

**Adjustment Summary**:
- Total adjustments per user
- Most common reasons
- Average adjustment size
- Frequency trends

**User Activity**:
- Transactions per user
- Transaction types breakdown
- Approval rates
- Time patterns

**Item History**:
- All changes to specific item
- Stock level trends
- Adjustment patterns
- Consumption vs adjustments

**Audit Report**:
- All transactions in date range
- Filtered by user
- Filtered by type
- Export to CSV/PDF

---

## Testing Scenarios

### Scenario 1: Stock Adjustment by Inventory Controller
1. Login as inventory controller
2. Navigate to item "Toothpaste"
3. Current stock: 45 units
4. Click "Manage Transactions"
5. Click "Adjustment"
6. Enter new stock: 50
7. Reason: "Physical count correction"
8. Submit
9. Verify:
   - Transaction saved to Firebase
   - Item stock updated to 50
   - Transaction shows in history
   - User name: "John Smith"
   - Change: +5
   - Status: Approved
   - Approver: "John Smith"

### Scenario 2: View Adjustment History
1. Login as admin
2. Navigate to item "Toothpaste"
3. Click "Manage Transactions"
4. View transaction history
5. Verify:
   - Adjustment shown with orange theme
   - User name displayed
   - Change amount shown (+5)
   - Reason displayed
   - Approval status shown
   - Timestamp visible

### Scenario 3: Multiple Adjustments
1. Perform 3 adjustments by different users
2. View transaction history
3. Verify:
   - All 3 adjustments listed
   - Different user names shown
   - Chronological order (newest first)
   - Each has unique timestamp
   - All have approval status

### Scenario 4: Bundle Consumption vs Adjustment
1. Perform bundle consumption (housekeeping)
2. Perform stock adjustment (inventory)
3. View transaction history
4. Verify:
   - Bundle consumption: Purple theme
   - Stock adjustment: Orange theme
   - Different icons
   - Different user roles
   - Both show user names

---

## Security Considerations

### User Authentication Required
- Cannot create transactions without login
- User ID validated
- User name captured from session
- Role verified

### Immutable Records
- Transactions cannot be edited
- Transactions cannot be deleted
- Complete audit trail preserved
- Historical data protected

### Role-Based Permissions
- Only authorized users can adjust stock
- Approval workflow enforced
- Access control maintained
- Activity logged

---

## Files Modified

1. **components/inventory/TransactionManager.jsx**
   - Made `processTransaction` async
   - Added Firebase persistence
   - Added `approvedByName` field
   - Enhanced transaction display
   - Added orange theme for adjustments
   - Improved quantity display for adjustments
   - Added approval status with approver name

2. **lib/inventoryApi.js**
   - Already had `getTransactions()` method
   - Fetches from `inventory_transactions/{itemId}`
   - Combines with bundle transactions
   - Resolves user names

---

## API Methods

### Save Transaction
```javascript
const firebaseDB = (await import('../../lib/firebase')).default
await firebaseDB.create(`inventory_transactions/${itemId}`, transaction)
```

### Get Transactions
```javascript
const transactions = await inventoryApi.getTransactions(itemId)
// Returns all transactions including adjustments and bundle consumptions
```

### Update Item Stock
```javascript
await inventoryApi.update(itemId, {
  currentStock: newStock,
  updatedAt: new Date().toISOString(),
  updatedBy: userId
})
```

---

**Status**: ✅ Production Ready  
**Implementation Date**: March 9, 2026  
**Logging**: Complete user tracking for all transaction types  
**Audit Trail**: Permanent records in Firebase
