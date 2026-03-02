# Loading Spinners Implementation Guide

This document tracks all buttons and forms that interact with Firebase and require loading spinners to prevent spam submissions.

## Priority: CRITICAL (Prevents Firebase Spam)

---

## 1. Authentication Forms

### Login Pages
- **File**: `app/login/page.jsx`
- **Action**: User login
- **Button**: "Sign In"
- **Status**: ✅ IMPLEMENTED (already had loading)

- **File**: `app/login/inventory/page.jsx`
- **Action**: Inventory controller login
- **Button**: "Sign In"
- **Status**: ⚠️ NEEDS IMPLEMENTATION

- **File**: `app/login/kitchen/page.jsx`
- **Action**: Kitchen staff login
- **Button**: "Sign In"
- **Status**: ⚠️ NEEDS IMPLEMENTATION

- **File**: `app/login/purchasing/page.jsx`
- **Action**: Purchasing officer login
- **Button**: "Sign In"
- **Status**: ⚠️ NEEDS IMPLEMENTATION

---

## 2. Inventory Management

### Main Inventory Page
- **File**: `app/(protected)/inventory/page.jsx`
- **Actions**:
  - Add new item (`handleAddItem`)
  - Update stock (`handleUpdateStock`)
  - Update item details (`handleUpdateItem`)
  - Restock operations
- **Buttons**: 
  - "Add Item"
  - "Stock In/Out/Transfer"
  - "Save Changes"
- **Status**: ⚠️ NEEDS IMPLEMENTATION

### Items Page
- **File**: `app/(protected)/inventory/items/page.jsx`
- **Actions**:
  - Create item (`handleAddItem`)
  - Update item (`handleUpdateItem`)
  - Toggle active status
  - Stock adjustments
- **Buttons**:
  - "Add Item"
  - "Save"
  - Toggle switches
- **Status**: ⚠️ NEEDS IMPLEMENTATION

### Assets Page
- **File**: `app/(protected)/inventory/assets/page.jsx`
- **Actions**:
  - Create asset instances
  - Update assets
  - Delete assets
  - Bulk operations
- **Buttons**:
  - "Assign to Room"
  - "Save Changes"
  - "Delete"
- **Status**: ⚠️ NEEDS IMPLEMENTATION

### Budget Page
- **File**: `app/(protected)/inventory/budget/page.jsx`
- **Actions**:
  - Update budget spent
  - Delete budget
- **Buttons**:
  - "Save Budget"
  - "Delete"
- **Status**: ⚠️ NEEDS IMPLEMENTATION

### Bulk Stock Page
- **File**: `app/(protected)/inventory/bulk/page.jsx`
- **Actions**:
  - Bulk stock updates
- **Buttons**:
  - "Update All"
  - "Save Changes"
- **Status**: ⚠️ NEEDS IMPLEMENTATION

---

## 3. Purchase Orders & Procurement

### Purchase Orders Page
- **File**: `app/(protected)/purchase-orders/page.jsx`
- **Actions**:
  - Create purchase order (`handleCreateOrder`)
  - Update order status
  - Approve/reject orders
- **Buttons**:
  - "Create Purchase Order"
  - "Approve"
  - "Reject"
  - "Mark as Delivered"
- **Status**: ⚠️ NEEDS IMPLEMENTATION

### Deliveries Page
- **File**: `app/(protected)/deliveries/page.jsx`
- **Actions**:
  - Receive delivery
  - Update inventory from delivery
- **Buttons**:
  - "Receive Delivery"
  - "Confirm Receipt"
- **Status**: ⚠️ NEEDS IMPLEMENTATION

---

## 4. Suppliers

### Suppliers Page
- **File**: `app/(protected)/suppliers/page.jsx`
- **Actions**:
  - Create supplier (`handleCreateSupplier`)
  - Update supplier (`handleUpdateSupplier`)
  - Approve supplier
- **Buttons**:
  - "Add Supplier"
  - "Save Changes"
  - "Approve"
- **Status**: ⚠️ NEEDS IMPLEMENTATION

---

## 5. Menu Management

### Menu Page
- **File**: `app/(protected)/menu/page.jsx`
- **Actions**:
  - Create menu item (`handleCreateMenuItem`)
  - Update menu item (`handleUpdateMenuItem`)
  - Toggle availability (`handleUpdateMenuItemAvailability`)
- **Buttons**:
  - "Add Menu Item"
  - "Save"
  - Toggle switches
- **Status**: ⚠️ NEEDS IMPLEMENTATION

---

## 6. Kitchen Operations

### Kitchen Waste Modal
- **File**: `components/kitchen/KitchenWasteModal.jsx`
- **Action**: Log waste and update inventory
- **Button**: "Log Waste"
- **Status**: ✅ IMPLEMENTED (already had loading)

### Shift Report Modal
- **File**: `components/kitchen/ShiftReportModal.jsx`
- **Action**: Save shift report and reconcile inventory
- **Button**: "Submit Report"
- **Status**: ✅ IMPLEMENTED (already had loading)

---

## 7. Audits

### Audits Page
- **File**: `app/(protected)/audits/page.jsx`
- **Actions**:
  - Create audit (`auditApi.create`)
  - Update audit (`handleUpdateAudit`)
- **Buttons**:
  - "Start Audit"
  - "Save Audit"
- **Status**: ⚠️ NEEDS IMPLEMENTATION

---

## 8. Component Forms

### Add Item Form
- **File**: `components/inventory/AddItemForm.jsx`
- **Action**: Create new inventory item
- **Button**: "Add Item"
- **Status**: ⚠️ NEEDS IMPLEMENTATION

### Restock Form
- **File**: `components/inventory/RestockForm.jsx`
- **Action**: Update stock levels
- **Button**: "Submit"
- **Status**: ✅ IMPLEMENTED

### Purchase Order Form
- **File**: `components/inventory/PurchaseOrderForm.jsx`
- **Action**: Create purchase order
- **Button**: "Create Order"
- **Status**: ✅ IMPLEMENTED

### Enhanced Purchase Order Modal
- **File**: `components/inventory/EnhancedPurchaseOrderModal.jsx`
- **Action**: Create detailed purchase order
- **Button**: "Create Purchase Order"
- **Status**: ⚠️ NEEDS IMPLEMENTATION

### Supplier Form
- **File**: `components/inventory/SupplierForm.jsx`
- **Action**: Create/update supplier
- **Button**: "Save Supplier"
- **Status**: ✅ IMPLEMENTED

### Bundle Manager
- **File**: `components/inventory/BundleManager.jsx`
- **Action**: Create bundle
- **Button**: "Create Bundle"
- **Status**: ⚠️ NEEDS IMPLEMENTATION

### Audit Form
- **File**: `components/inventory/AuditForm.jsx`
- **Action**: Create/update audit
- **Button**: "Start Audit"
- **Status**: ⚠️ NEEDS IMPLEMENTATION

### Housekeeping Checklist
- **File**: `components/inventory/HousekeepingChecklist.jsx`
- **Action**: Submit checklist
- **Button**: "Complete Checklist"
- **Status**: ⚠️ NEEDS IMPLEMENTATION

### Receive PO Modal
- **File**: `components/inventory/ReceivePOModal.jsx`
- **Action**: Receive purchase order and update stock
- **Button**: "Receive Items"
- **Status**: ⚠️ NEEDS IMPLEMENTATION

### Asset Manager
- **File**: `components/inventory/AssetManager.jsx`
- **Actions**:
  - Delete asset
  - Update asset
- **Buttons**:
  - "Delete"
  - "Save"
- **Status**: ⚠️ NEEDS IMPLEMENTATION

### Add Multiple Assets to Room
- **File**: `components/inventory/AddMultipleAssetsToRoom.jsx`
- **Action**: Assign multiple assets to room
- **Button**: "Assign to Room"
- **Status**: ⚠️ NEEDS IMPLEMENTATION

### Purchase Order Details Modal
- **File**: `components/inventory/PurchaseOrderDetailsModal.jsx`
- **Actions**:
  - Approve order
  - Reject order
- **Buttons**:
  - "Approve"
  - "Reject"
- **Status**: ⚠️ NEEDS IMPLEMENTATION

---

## Implementation Pattern

All buttons should follow this pattern:

```jsx
const [isLoading, setIsLoading] = useState(false)

const handleSubmit = async (e) => {
  e.preventDefault()
  
  if (isLoading) return // Prevent double submission
  
  setIsLoading(true)
  try {
    // Firebase operation
    await someApi.create(data)
    // Success handling
  } catch (error) {
    // Error handling
  } finally {
    setIsLoading(false)
  }
}

// Button usage
<Button
  onClick={handleSubmit}
  disabled={isLoading}
>
  {isLoading ? 'Processing...' : 'Submit'}
</Button>
```

---

## Total Count
- **Total Files**: 30+
- **Total Buttons**: 50+
- **Implemented**: 6 files
- **Remaining**: 24+ files
- **Status**: Implementation in progress

---

## Summary of Implemented Files

1. ✅ `app/login/page.jsx` - Login form with spinner
2. ✅ `components/kitchen/KitchenWasteModal.jsx` - Waste logging with spinner
3. ✅ `components/kitchen/ShiftReportModal.jsx` - Shift report with spinner
4. ✅ `components/inventory/PurchaseOrderForm.jsx` - PO creation with spinner
5. ✅ `components/inventory/SupplierForm.jsx` - Supplier form with spinner
6. ✅ `components/inventory/RestockForm.jsx` - Restock form with spinner

These implementations prevent Firebase spam by:
- Disabling buttons during submission
- Showing loading spinners
- Preventing double-clicks
- Providing visual feedback to users
