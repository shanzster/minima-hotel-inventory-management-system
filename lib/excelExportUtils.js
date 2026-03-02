/**
 * Utility functions for exporting data to Excel using SheetJS
 */

/**
 * Generic Excel export function
 * @param {Array} data - Array of data rows (including header)
 * @param {String} sheetName - Name of the worksheet
 * @param {String} fileName - Name of the file to download
 * @param {Array} columnWidths - Array of column widths
 * @param {Object} summary - Optional summary data { rows: [[label, value], ...] }
 */
export async function exportToExcel(data, sheetName, fileName, columnWidths = [], summary = null) {
  const XLSX = await import('xlsx')

  // Add summary if provided
  if (summary && summary.rows) {
    data.push([])
    data.push([])
    data.push(['SUMMARY'])
    summary.rows.forEach(row => data.push(row))
  }

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(data)

  // Set column widths
  if (columnWidths.length > 0) {
    ws['!cols'] = columnWidths.map(w => ({ wch: w }))
  }

  // Style header row
  const headerRange = XLSX.utils.decode_range(ws['!ref'])
  for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col })
    if (!ws[cellAddress]) continue
    ws[cellAddress].s = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "1F2937" } },
      alignment: { horizontal: "center", vertical: "center" }
    }
  }

  // Create workbook
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)

  // Generate Excel file
  XLSX.writeFile(wb, fileName)
}

/**
 * Export inventory items to Excel
 */
export async function exportInventoryToExcel(items, getSupplierName) {
  const data = [
    ['Image URL', 'Item Name', 'SKU', 'Category', 'Type', 'Current Stock', 'Unit', 'Reorder Point', 'Unit Cost', 'Total Value', 'Stock Status', 'Supplier', 'Description']
  ]

  items.forEach(item => {
    const totalValue = (item.currentStock || 0) * (item.unitCost || 0)
    let stockStatus = 'Good'
    if (item.currentStock <= item.reorderPoint) {
      stockStatus = 'Low Stock - Reorder Now'
    } else if (item.currentStock <= item.reorderPoint * 1.5) {
      stockStatus = 'Medium - Monitor'
    }

    data.push([
      item.imageUrl || 'No Image',
      item.name || '-',
      item.sku || '-',
      item.category || '-',
      item.type || '-',
      item.currentStock || 0,
      item.unit || '-',
      item.reorderPoint || 0,
      item.unitCost || 0,
      totalValue,
      stockStatus,
      getSupplierName(item.supplierId),
      item.description || '-'
    ])
  })

  const summary = {
    rows: [
      ['Total Items:', items.length],
      ['Low Stock Items:', items.filter(i => i.currentStock <= i.reorderPoint).length],
      ['Total Inventory Value:', items.reduce((sum, i) => sum + ((i.currentStock || 0) * (i.unitCost || 0)), 0)]
    ]
  }

  await exportToExcel(
    data,
    'Inventory Items',
    `inventory-items-${new Date().toISOString().split('T')[0]}.xlsx`,
    [40, 30, 15, 20, 15, 15, 12, 15, 15, 15, 25, 25, 40],
    summary
  )
}

/**
 * Export suppliers to Excel
 */
export async function exportSuppliersToExcel(suppliers) {
  const data = [
    ['Supplier Name', 'Contact Person', 'Email', 'Phone', 'Categories', 'Status', 'Performance Rating', 'Total Orders', 'Address']
  ]

  suppliers.forEach(supplier => {
    data.push([
      supplier.name || '-',
      supplier.contactPerson || '-',
      supplier.email || '-',
      supplier.phone || '-',
      supplier.categories?.join(', ') || '-',
      supplier.status || 'active',
      supplier.performanceRating || 'N/A',
      supplier.totalOrders || 0,
      supplier.address || '-'
    ])
  })

  const summary = {
    rows: [
      ['Total Suppliers:', suppliers.length],
      ['Active Suppliers:', suppliers.filter(s => s.status === 'active').length]
    ]
  }

  await exportToExcel(
    data,
    'Suppliers',
    `suppliers-${new Date().toISOString().split('T')[0]}.xlsx`,
    [30, 25, 30, 20, 30, 15, 20, 15, 40],
    summary
  )
}

/**
 * Export purchase orders to Excel
 */
export async function exportPurchaseOrdersToExcel(orders) {
  const data = [
    ['Order Number', 'Supplier', 'Status', 'Priority', 'Total Amount', 'Expected Delivery', 'Created Date', 'Items Count', 'Notes']
  ]

  orders.forEach(order => {
    data.push([
      order.orderNumber || '-',
      order.supplier?.name || '-',
      order.status || '-',
      order.priority || 'normal',
      order.totalAmount || 0,
      order.expectedDelivery ? new Date(order.expectedDelivery).toLocaleDateString() : '-',
      order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '-',
      order.items?.length || 0,
      order.notes || '-'
    ])
  })

  const summary = {
    rows: [
      ['Total Orders:', orders.length],
      ['Total Amount:', orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)]
    ]
  }

  await exportToExcel(
    data,
    'Purchase Orders',
    `purchase-orders-${new Date().toISOString().split('T')[0]}.xlsx`,
    [20, 30, 15, 15, 18, 20, 20, 15, 40],
    summary
  )
}

/**
 * Export assets to Excel
 */
export async function exportAssetsToExcel(assets) {
  const data = [
    ['Asset Name', 'Category', 'Condition', 'Room', 'Location', 'Purchase Date', 'Value', 'Status', 'Serial Number']
  ]

  assets.forEach(asset => {
    data.push([
      asset.name || '-',
      asset.category || '-',
      asset.condition || '-',
      asset.room || '-',
      asset.location || '-',
      asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : '-',
      asset.value || 0,
      asset.status || '-',
      asset.serialNumber || '-'
    ])
  })

  const summary = {
    rows: [
      ['Total Assets:', assets.length],
      ['Total Value:', assets.reduce((sum, a) => sum + (a.value || 0), 0)]
    ]
  }

  await exportToExcel(
    data,
    'Assets',
    `assets-${new Date().toISOString().split('T')[0]}.xlsx`,
    [30, 20, 15, 20, 25, 20, 18, 15, 25],
    summary
  )
}

/**
 * Export deliveries to Excel
 */
export async function exportDeliveriesToExcel(deliveries) {
  const data = [
    ['Order Number', 'Supplier', 'Expected Delivery', 'Status', 'Total Amount', 'Items Count', 'Delivered At']
  ]

  deliveries.forEach(delivery => {
    data.push([
      delivery.orderNumber || '-',
      delivery.supplier?.name || '-',
      new Date(delivery.expectedDelivery).toLocaleDateString(),
      delivery.status || '-',
      delivery.totalAmount || 0,
      delivery.items?.length || 0,
      delivery.deliveredAt ? new Date(delivery.deliveredAt).toLocaleDateString() : '-'
    ])
  })

  const summary = {
    rows: [
      ['Total Deliveries:', deliveries.length],
      ['Total Amount:', deliveries.reduce((sum, d) => sum + (d.totalAmount || 0), 0)]
    ]
  }

  await exportToExcel(
    data,
    'Deliveries',
    `deliveries-${new Date().toISOString().split('T')[0]}.xlsx`,
    [20, 30, 20, 15, 18, 15, 20],
    summary
  )
}

/**
 * Export menu items to Excel
 */
export async function exportMenuToExcel(menuItems) {
  const data = [
    ['Item Name', 'Category', 'Price', 'Available', 'Ingredients', 'Description']
  ]

  menuItems.forEach(item => {
    data.push([
      item.name || '-',
      item.category || '-',
      item.price || 0,
      item.available ? 'Yes' : 'No',
      item.ingredients?.join(', ') || '-',
      item.description || '-'
    ])
  })

  const summary = {
    rows: [
      ['Total Menu Items:', menuItems.length],
      ['Available Items:', menuItems.filter(i => i.available).length]
    ]
  }

  await exportToExcel(
    data,
    'Menu Items',
    `menu-items-${new Date().toISOString().split('T')[0]}.xlsx`,
    [30, 20, 15, 15, 40, 40],
    summary
  )
}

/**
 * Export transactions to Excel
 */
export async function exportTransactionsToExcel(transactions) {
  const data = [
    ['Date', 'Item Name', 'Type', 'Quantity', 'Unit', 'Reason', 'Performed By', 'Notes']
  ]

  transactions.forEach(txn => {
    data.push([
      txn.timestamp ? new Date(txn.timestamp).toLocaleString() : '-',
      txn.itemName || '-',
      txn.type || '-',
      txn.quantity || 0,
      txn.unit || '-',
      txn.reason || '-',
      txn.performedBy || '-',
      txn.notes || '-'
    ])
  })

  await exportToExcel(
    data,
    'Transactions',
    `transactions-${new Date().toISOString().split('T')[0]}.xlsx`,
    [25, 30, 15, 12, 12, 25, 20, 40]
  )
}
