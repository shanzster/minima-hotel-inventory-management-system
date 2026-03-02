'use client'

import { useState, useEffect } from 'react'
import { usePageTitle } from '../../../hooks/usePageTitle'
import { useAuth } from '../../../hooks/useAuth'
import HousekeepingChecklist from '../../../components/inventory/HousekeepingChecklist'
import Modal from '../../../components/ui/Modal'
import roomsApi from '../../../lib/roomsApi'
import toast from '../../../lib/toast'

// Mock storage for completed checklists, room-bundle assignments, and bundle status
const CHECKLISTS_KEY = 'housekeeping_checklists'
const ROOM_BUNDLES_KEY = 'room_bundle_assignments'
const BUNDLES_KEY = 'hotel_inventory_bundles'
const BUNDLE_STATUS_KEY = 'room_bundle_status' // Track bundle status per room

export default function HousekeepingPage() {
  const { setTitle } = usePageTitle()
  const { user } = useAuth()
  const [rooms, setRooms] = useState([])
  const [bundles, setBundles] = useState([])
  const [roomBundles, setRoomBundles] = useState({})
  const [bundleStatus, setBundleStatus] = useState({}) // Track status: 'ready', 'pending', 'needs-inspection'
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [showChecklistModal, setShowChecklistModal] = useState(false)
  const [completedChecklists, setCompletedChecklists] = useState([])
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    setTitle('Housekeeping')
  }, [setTitle])

  useEffect(() => {
    const loadRooms = async () => {
      try {
        const allRooms = await roomsApi.getAll()
        setRooms(allRooms)
      } catch (error) {
        console.error('Error loading rooms:', error)
      }
    }
    loadRooms()
  }, [])

  useEffect(() => {
    const stored = localStorage.getItem(BUNDLES_KEY)
    if (stored) {
      try {
        setBundles(JSON.parse(stored))
      } catch (error) {
        console.error('Error loading bundles:', error)
      }
    }
  }, [])

  useEffect(() => {
    const stored = localStorage.getItem(ROOM_BUNDLES_KEY)
    if (stored) {
      try {
        setRoomBundles(JSON.parse(stored))
      } catch (error) {
        console.error('Error loading room bundles:', error)
      }
    }
  }, [])

  useEffect(() => {
    const stored = localStorage.getItem(BUNDLE_STATUS_KEY)
    if (stored) {
      try {
        setBundleStatus(JSON.parse(stored))
      } catch (error) {
        console.error('Error loading bundle status:', error)
      }
    }
  }, [])

  // Monitor room status changes and update bundle status automatically
  useEffect(() => {
    if (rooms.length === 0 || Object.keys(roomBundles).length === 0) return

    const newBundleStatus = { ...bundleStatus }
    let statusChanged = false

    rooms.forEach(room => {
      const hasBundle = roomBundles[room.id]
      if (!hasBundle) return

      const currentStatus = bundleStatus[room.id]
      let newStatus = currentStatus

      // Determine status based on room status
      if (room.status === 'occupied' && currentStatus !== 'pending') {
        // Room just got booked - deduct stock and set to pending
        newStatus = 'pending'
        statusChanged = true
        deductBundleStock(room.id, roomBundles[room.id])
      } else if (room.status === 'available' && currentStatus === 'pending') {
        // Guest checked out - needs inspection
        newStatus = 'needs-inspection'
        statusChanged = true
      } else if (room.status === 'available' && !currentStatus) {
        // Room is available and ready
        newStatus = 'ready'
        statusChanged = true
      }

      if (newStatus !== currentStatus) {
        newBundleStatus[room.id] = newStatus
      }
    })

    if (statusChanged) {
      setBundleStatus(newBundleStatus)
      localStorage.setItem(BUNDLE_STATUS_KEY, JSON.stringify(newBundleStatus))
    }
  }, [rooms, roomBundles])

  const deductBundleStock = async (roomId, bundleId) => {
    try {
      const bundle = bundles.find(b => b.id === bundleId)
      if (!bundle) return

      const inventoryApi = (await import('../../../lib/inventoryApi')).default
      const allItems = await inventoryApi.getAll()

      for (const item of bundle.items) {
        try {
          const inventoryItem = allItems.find(i => 
            i.name === item.name && i.type !== 'asset-instance'
          )
          
          if (inventoryItem) {
            await inventoryApi.updateStock(inventoryItem.id, -item.quantity, {
              type: 'stock-out',
              reason: 'bundle-pending',
              notes: `Bundle pending for room ${roomId} (guest checked in)`
            })
          }
        } catch (error) {
          console.error(`Error deducting stock for ${item.name}:`, error)
        }
      }
    } catch (error) {
      console.error('Error deducting bundle stock:', error)
    }
  }

  useEffect(() => {
    const stored = localStorage.getItem(CHECKLISTS_KEY)
    if (stored) {
      try {
        setCompletedChecklists(JSON.parse(stored))
      } catch (error) {
        console.error('Error loading checklists:', error)
      }
    }
  }, [])

  const handleStartChecklist = (room) => {
    // Only allow inspection if room needs it
    const status = bundleStatus[room.id]
    if (status !== 'needs-inspection') {
      toast.warning('This room does not need inspection yet')
      return
    }
    
    setSelectedRoom(room)
    setShowChecklistModal(true)
  }

  const handleCompleteChecklist = async (checklistData) => {
    try {
      // Save checklist
      const newChecklists = [...completedChecklists, checklistData]
      setCompletedChecklists(newChecklists)
      localStorage.setItem(CHECKLISTS_KEY, JSON.stringify(newChecklists))

      // Return stock for items that were NOT consumed
      const inventoryApi = (await import('../../../lib/inventoryApi')).default
      const allItems = await inventoryApi.getAll()
      
      let itemsReturned = 0
      
      for (const [itemId, itemStatus] of Object.entries(checklistData.itemsStatus)) {
        // If item was not consumed (remaining = expected), return it to stock
        if (itemStatus.consumed === 0 && itemStatus.remainingQuantity > 0) {
          try {
            // Find the inventory item by name
            const inventoryItem = allItems.find(i => 
              i.name === itemStatus.name && i.type !== 'asset-instance'
            )
            
            if (inventoryItem) {
              await inventoryApi.updateStock(inventoryItem.id, itemStatus.remainingQuantity, {
                type: 'stock-in',
                reason: 'bundle-return',
                notes: `Returned unused items from Room ${checklistData.room.number || checklistData.room.roomNumber}`
              })
              itemsReturned += itemStatus.remainingQuantity
            }
          } catch (error) {
            console.error(`Error returning stock for ${itemStatus.name}:`, error)
          }
        }
      }

      // Update bundle status to 'ready' after inspection
      const newBundleStatus = { ...bundleStatus }
      newBundleStatus[checklistData.room.id] = 'ready'
      setBundleStatus(newBundleStatus)
      localStorage.setItem(BUNDLE_STATUS_KEY, JSON.stringify(newBundleStatus))

      setShowChecklistModal(false)
      setSelectedRoom(null)
      
      const roomNum = checklistData.room.number || checklistData.room.roomNumber
      if (checklistData.totalConsumed > 0 && itemsReturned > 0) {
        toast.success(`Inspection completed for Room ${roomNum}. ${checklistData.totalConsumed} items consumed, ${itemsReturned} items returned. Room is ready for next guest.`)
      } else if (checklistData.totalConsumed > 0) {
        toast.success(`Inspection completed for Room ${roomNum}. ${checklistData.totalConsumed} items consumed. Room is ready for next guest.`)
      } else if (itemsReturned > 0) {
        toast.success(`Inspection completed for Room ${roomNum}. ${itemsReturned} items returned. Room is ready for next guest.`)
      } else {
        toast.success(`Inspection completed for Room ${roomNum}. Room is ready for next guest.`)
      }
    } catch (error) {
      console.error('Error completing checklist:', error)
      toast.error('Failed to complete checklist')
    }
  }

  const handlePrintRoomChecklist = (room) => {
    const bundle = getAssignedBundle(room.id)
    if (!bundle) return

    const printWindow = window.open('', '_blank')
    const roomNum = room.roomNumber || room.number
    const today = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Housekeeping Checklist - Room ${roomNum}</title>
          <style>
            @media print {
              @page { 
                margin: 1.5cm;
                size: A4;
              }
              body { margin: 0; }
            }
            * {
              box-sizing: border-box;
            }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              padding: 20px;
              max-width: 800px;
              margin: 0 auto;
              background: white;
              color: #1a1a1a;
            }
            .header {
              text-align: center;
              border-bottom: 4px solid #2563eb;
              padding-bottom: 20px;
              margin-bottom: 30px;
              background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
              padding: 25px;
              border-radius: 8px 8px 0 0;
            }
            .header h1 {
              margin: 0 0 8px 0;
              font-size: 32px;
              color: #1e40af;
              font-weight: 700;
              letter-spacing: -0.5px;
            }
            .header .subtitle {
              margin: 5px 0;
              color: #475569;
              font-size: 15px;
              font-weight: 500;
            }
            .room-info {
              background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 25px;
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 20px;
              border: 2px solid #e2e8f0;
            }
            .info-item {
              text-align: center;
            }
            .info-item .label {
              display: block;
              color: #64748b;
              font-size: 11px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 6px;
            }
            .info-item .value {
              display: block;
              color: #0f172a;
              font-size: 16px;
              font-weight: 700;
            }
            .instructions {
              background: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 15px 20px;
              margin-bottom: 25px;
              border-radius: 4px;
            }
            .instructions strong {
              color: #92400e;
              font-size: 13px;
            }
            .instructions p {
              margin: 5px 0 0 0;
              color: #78350f;
              font-size: 13px;
              line-height: 1.6;
            }
            table {
              width: 100%;
              border-collapse: separate;
              border-spacing: 0;
              margin-bottom: 30px;
              border: 2px solid #e2e8f0;
              border-radius: 8px;
              overflow: hidden;
            }
            thead {
              background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
            }
            th {
              color: white;
              padding: 14px 12px;
              text-align: left;
              font-weight: 600;
              font-size: 13px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            th.center {
              text-align: center;
            }
            tbody tr {
              border-bottom: 1px solid #e2e8f0;
            }
            tbody tr:last-child {
              border-bottom: none;
            }
            tbody tr:nth-child(even) {
              background: #f8fafc;
            }
            tbody tr:nth-child(odd) {
              background: white;
            }
            td {
              padding: 14px 12px;
              font-size: 14px;
            }
            td.center {
              text-align: center;
            }
            .item-name {
              font-weight: 600;
              color: #0f172a;
              margin-bottom: 3px;
            }
            .item-category {
              font-size: 11px;
              color: #64748b;
              background: #e2e8f0;
              padding: 2px 8px;
              border-radius: 10px;
              display: inline-block;
              font-weight: 500;
            }
            .qty-box {
              width: 70px;
              height: 35px;
              border: 2px solid #334155;
              margin: 0 auto;
              border-radius: 4px;
              background: white;
            }
            .notes-section {
              margin-bottom: 30px;
            }
            .notes-section h3 {
              font-size: 16px;
              font-weight: 700;
              margin-bottom: 12px;
              color: #1e293b;
              display: flex;
              align-items: center;
            }
            .notes-section h3::before {
              content: "📝";
              margin-right: 8px;
              font-size: 18px;
            }
            .notes-box {
              border: 2px solid #cbd5e1;
              min-height: 120px;
              padding: 12px;
              border-radius: 6px;
              background: #f8fafc;
            }
            .signature-section {
              margin-top: 50px;
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 40px;
            }
            .signature-box {
              text-align: center;
            }
            .signature-line {
              border-top: 2px solid #1e293b;
              margin-top: 60px;
              padding-top: 10px;
            }
            .signature-label {
              font-size: 13px;
              font-weight: 600;
              color: #475569;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .signature-sublabel {
              font-size: 11px;
              color: #94a3b8;
              margin-top: 4px;
            }
            .footer {
              text-align: center;
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px solid #e2e8f0;
            }
            .footer-logo {
              font-size: 14px;
              font-weight: 700;
              color: #1e40af;
              margin-bottom: 5px;
            }
            .footer-text {
              font-size: 11px;
              color: #64748b;
            }
            .badge {
              display: inline-block;
              padding: 4px 10px;
              border-radius: 12px;
              font-size: 11px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.3px;
            }
            .badge-primary {
              background: #dbeafe;
              color: #1e40af;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🏨 HOUSEKEEPING CHECKLIST</h1>
            <p class="subtitle">Post-Checkout Inventory Inspection</p>
          </div>

          <div class="room-info">
            <div class="info-item">
              <span class="label">Room Number</span>
              <span class="value">${roomNum}</span>
            </div>
            <div class="info-item">
              <span class="label">Bundle Type</span>
              <span class="value">${bundle.name}</span>
            </div>
            <div class="info-item">
              <span class="label">Inspection Date</span>
              <span class="value">${today}</span>
            </div>
          </div>

          <div class="instructions">
            <strong>⚠️ INSPECTION INSTRUCTIONS</strong>
            <p>After guest checkout, carefully inspect each item and record the quantity remaining in the room. Items consumed or taken by guests will be automatically deducted from inventory. Report any damages or missing items in the notes section below.</p>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 40px;" class="center">#</th>
                <th>Item Description</th>
                <th style="width: 120px;" class="center">Expected</th>
                <th style="width: 120px;" class="center">Remaining</th>
                <th style="width: 120px;" class="center">Consumed</th>
              </tr>
            </thead>
            <tbody>
              ${bundle.items.map((item, index) => `
                <tr>
                  <td class="center" style="font-weight: 600; color: #64748b;">${index + 1}</td>
                  <td>
                    <div class="item-name">${item.name}</div>
                    ${item.category && item.category !== 'N/A' ? `<span class="item-category">${item.category}</span>` : ''}
                  </td>
                  <td class="center" style="font-weight: 700; font-size: 15px;">${item.quantity} ${item.unit || 'pcs'}</td>
                  <td class="center"><div class="qty-box"></div></td>
                  <td class="center"><div class="qty-box"></div></td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="notes-section">
            <h3>Notes / Issues / Damages</h3>
            <div class="notes-box"></div>
          </div>

          <div class="signature-section">
            <div class="signature-box">
              <div class="signature-line">
                <div class="signature-label">Inspector Signature</div>
                <div class="signature-sublabel">Housekeeping Staff</div>
              </div>
            </div>
            <div class="signature-box">
              <div class="signature-line">
                <div class="signature-label">Supervisor Signature</div>
                <div class="signature-sublabel">Department Head</div>
              </div>
            </div>
          </div>

          <div class="footer">
            <div class="footer-logo">Minima Hotel Inventory System</div>
            <div class="footer-text">Housekeeping Department • Confidential Document</div>
          </div>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const handlePrintAllChecklists = () => {
    const roomsWithBundles = rooms.filter(room => getAssignedBundle(room.id))
    
    if (roomsWithBundles.length === 0) {
      toast.error('No rooms have bundles assigned')
      return
    }

    const printWindow = window.open('', '_blank')
    const today = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })

    const checklistsHTML = roomsWithBundles.map(room => {
      const bundle = getAssignedBundle(room.id)
      const roomNum = room.roomNumber || room.number

      return `
        <div class="checklist-page">
          <div class="header">
            <h1>🏨 HOUSEKEEPING CHECKLIST</h1>
            <p class="subtitle">Post-Checkout Inventory Inspection</p>
          </div>

          <div class="room-info">
            <div class="info-item">
              <span class="label">Room Number</span>
              <span class="value">${roomNum}</span>
            </div>
            <div class="info-item">
              <span class="label">Bundle Type</span>
              <span class="value">${bundle.name}</span>
            </div>
            <div class="info-item">
              <span class="label">Inspection Date</span>
              <span class="value">${today}</span>
            </div>
          </div>

          <div class="instructions">
            <strong>⚠️ INSPECTION INSTRUCTIONS</strong>
            <p>After guest checkout, carefully inspect each item and record the quantity remaining in the room. Items consumed or taken by guests will be automatically deducted from inventory. Report any damages or missing items in the notes section below.</p>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 40px;" class="center">#</th>
                <th>Item Description</th>
                <th style="width: 120px;" class="center">Expected</th>
                <th style="width: 120px;" class="center">Remaining</th>
                <th style="width: 120px;" class="center">Consumed</th>
              </tr>
            </thead>
            <tbody>
              ${bundle.items.map((item, index) => `
                <tr>
                  <td class="center" style="font-weight: 600; color: #64748b;">${index + 1}</td>
                  <td>
                    <div class="item-name">${item.name}</div>
                    ${item.category && item.category !== 'N/A' ? `<span class="item-category">${item.category}</span>` : ''}
                  </td>
                  <td class="center" style="font-weight: 700; font-size: 15px;">${item.quantity} ${item.unit || 'pcs'}</td>
                  <td class="center"><div class="qty-box"></div></td>
                  <td class="center"><div class="qty-box"></div></td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="notes-section">
            <h3>Notes / Issues / Damages</h3>
            <div class="notes-box"></div>
          </div>

          <div class="signature-section">
            <div class="signature-box">
              <div class="signature-line">
                <div class="signature-label">Inspector Signature</div>
                <div class="signature-sublabel">Housekeeping Staff</div>
              </div>
            </div>
            <div class="signature-box">
              <div class="signature-line">
                <div class="signature-label">Supervisor Signature</div>
                <div class="signature-sublabel">Department Head</div>
              </div>
            </div>
          </div>

          <div class="footer">
            <div class="footer-logo">Minima Hotel Inventory System</div>
            <div class="footer-text">Housekeeping Department • Confidential Document</div>
          </div>
        </div>
      `
    }).join('')

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>All Housekeeping Checklists - ${today}</title>
          <style>
            @media print {
              @page { 
                margin: 1.5cm;
                size: A4;
              }
              body { margin: 0; }
              .checklist-page {
                page-break-after: always;
              }
              .checklist-page:last-child {
                page-break-after: auto;
              }
            }
            * {
              box-sizing: border-box;
            }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              padding: 20px;
              background: white;
              color: #1a1a1a;
            }
            .checklist-page {
              max-width: 800px;
              margin: 0 auto 40px auto;
            }
            .header {
              text-align: center;
              border-bottom: 4px solid #2563eb;
              padding-bottom: 20px;
              margin-bottom: 30px;
              background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
              padding: 25px;
              border-radius: 8px 8px 0 0;
            }
            .header h1 {
              margin: 0 0 8px 0;
              font-size: 32px;
              color: #1e40af;
              font-weight: 700;
              letter-spacing: -0.5px;
            }
            .header .subtitle {
              margin: 5px 0;
              color: #475569;
              font-size: 15px;
              font-weight: 500;
            }
            .room-info {
              background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 25px;
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 20px;
              border: 2px solid #e2e8f0;
            }
            .info-item {
              text-align: center;
            }
            .info-item .label {
              display: block;
              color: #64748b;
              font-size: 11px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 6px;
            }
            .info-item .value {
              display: block;
              color: #0f172a;
              font-size: 16px;
              font-weight: 700;
            }
            .instructions {
              background: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 15px 20px;
              margin-bottom: 25px;
              border-radius: 4px;
            }
            .instructions strong {
              color: #92400e;
              font-size: 13px;
            }
            .instructions p {
              margin: 5px 0 0 0;
              color: #78350f;
              font-size: 13px;
              line-height: 1.6;
            }
            table {
              width: 100%;
              border-collapse: separate;
              border-spacing: 0;
              margin-bottom: 30px;
              border: 2px solid #e2e8f0;
              border-radius: 8px;
              overflow: hidden;
            }
            thead {
              background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
            }
            th {
              color: white;
              padding: 14px 12px;
              text-align: left;
              font-weight: 600;
              font-size: 13px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            th.center {
              text-align: center;
            }
            tbody tr {
              border-bottom: 1px solid #e2e8f0;
            }
            tbody tr:last-child {
              border-bottom: none;
            }
            tbody tr:nth-child(even) {
              background: #f8fafc;
            }
            tbody tr:nth-child(odd) {
              background: white;
            }
            td {
              padding: 14px 12px;
              font-size: 14px;
            }
            td.center {
              text-align: center;
            }
            .item-name {
              font-weight: 600;
              color: #0f172a;
              margin-bottom: 3px;
            }
            .item-category {
              font-size: 11px;
              color: #64748b;
              background: #e2e8f0;
              padding: 2px 8px;
              border-radius: 10px;
              display: inline-block;
              font-weight: 500;
            }
            .qty-box {
              width: 70px;
              height: 35px;
              border: 2px solid #334155;
              margin: 0 auto;
              border-radius: 4px;
              background: white;
            }
            .notes-section {
              margin-bottom: 30px;
            }
            .notes-section h3 {
              font-size: 16px;
              font-weight: 700;
              margin-bottom: 12px;
              color: #1e293b;
              display: flex;
              align-items: center;
            }
            .notes-section h3::before {
              content: "📝";
              margin-right: 8px;
              font-size: 18px;
            }
            .notes-box {
              border: 2px solid #cbd5e1;
              min-height: 120px;
              padding: 12px;
              border-radius: 6px;
              background: #f8fafc;
            }
            .signature-section {
              margin-top: 50px;
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 40px;
            }
            .signature-box {
              text-align: center;
            }
            .signature-line {
              border-top: 2px solid #1e293b;
              margin-top: 60px;
              padding-top: 10px;
            }
            .signature-label {
              font-size: 13px;
              font-weight: 600;
              color: #475569;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .signature-sublabel {
              font-size: 11px;
              color: #94a3b8;
              margin-top: 4px;
            }
            .footer {
              text-align: center;
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px solid #e2e8f0;
            }
            .footer-logo {
              font-size: 14px;
              font-weight: 700;
              color: #1e40af;
              margin-bottom: 5px;
            }
            .footer-text {
              font-size: 11px;
              color: #64748b;
            }
          </style>
        </head>
        <body>
          ${checklistsHTML}
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const isCompletedToday = (roomId) => {
    const today = new Date().toDateString()
    return completedChecklists.some(checklist => {
      const checklistDate = new Date(checklist.completedAt).toDateString()
      const checklistRoomId = checklist.room.id
      return checklistRoomId === roomId && checklistDate === today
    })
  }

  const getRoomBundleStatus = (roomId) => {
    return bundleStatus[roomId] || 'ready'
  }

  const getAssignedBundle = (roomId) => {
    const bundleId = roomBundles[roomId]
    if (!bundleId) return null
    return bundles.find(b => b.id === bundleId)
  }

  const handleRemoveBundle = (roomId, roomNumber) => {
    if (!confirm(`Remove bundle assignment from Room ${roomNumber}?`)) {
      return
    }

    try {
      // Remove bundle assignment
      const newRoomBundles = { ...roomBundles }
      delete newRoomBundles[roomId]
      setRoomBundles(newRoomBundles)
      localStorage.setItem(ROOM_BUNDLES_KEY, JSON.stringify(newRoomBundles))

      // Remove bundle status
      const newBundleStatus = { ...bundleStatus }
      delete newBundleStatus[roomId]
      setBundleStatus(newBundleStatus)
      localStorage.setItem(BUNDLE_STATUS_KEY, JSON.stringify(newBundleStatus))

      toast.success(`Bundle removed from Room ${roomNumber}`)
    } catch (error) {
      console.error('Error removing bundle:', error)
      toast.error('Failed to remove bundle')
    }
  }

  const filteredRooms = rooms.filter(room => {
    if (filterStatus === 'all') return true
    
    const status = getRoomBundleStatus(room.id)
    
    if (filterStatus === 'pending') {
      return status === 'pending'
    }
    if (filterStatus === 'completed') {
      return status === 'ready'
    }
    if (filterStatus === 'needs-inspection') {
      return status === 'needs-inspection'
    }
    
    return true
  })

  const roomsByFloor = {}
  filteredRooms.forEach(room => {
    const floor = room.floor || 1
    if (!roomsByFloor[floor]) roomsByFloor[floor] = []
    roomsByFloor[floor].push(room)
  })

  const totalRooms = rooms.length
  const needsInspectionCount = rooms.filter(room => bundleStatus[room.id] === 'needs-inspection').length
  const pendingRooms = rooms.filter(room => bundleStatus[room.id] === 'pending').length
  const readyRooms = rooms.filter(room => bundleStatus[room.id] === 'ready').length
  const completionRate = totalRooms > 0 ? Math.round((readyRooms / totalRooms) * 100) : 0

  return (
    <div className="p-4 mx-2">
      <div className="no-print">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900 mb-1">Housekeeping</h1>
          <p className="text-gray-500 font-body text-sm">
            Post-checkout inventory inspection and restocking
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-all flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          <span>Print Checklists</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white/80 backdrop-blur-xl rounded-lg border border-white/20 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Rooms</p>
              <p className="text-2xl font-bold text-gray-900">{totalRooms}</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-lg border border-green-200 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">Ready</p>
              <p className="text-2xl font-bold text-green-700">{readyRooms}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-lg border border-red-200 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600">Needs Inspection</p>
              <p className="text-2xl font-bold text-red-700">{needsInspectionCount}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-lg border border-amber-200 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-amber-600">Pending (In Use)</p>
              <p className="text-2xl font-bold text-amber-700">{pendingRooms}</p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-lg border border-blue-200 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600">Completion Rate</p>
              <p className="text-2xl font-bold text-blue-700">{completionRate}%</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="flex space-x-3 mb-6">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            filterStatus === 'all' ? 'bg-black text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          All Rooms
        </button>
        <button
          onClick={() => setFilterStatus('needs-inspection')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            filterStatus === 'needs-inspection' ? 'bg-red-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Needs Inspection ({needsInspectionCount})
        </button>
        <button
          onClick={() => setFilterStatus('pending')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            filterStatus === 'pending' ? 'bg-amber-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Pending ({pendingRooms})
        </button>
        <button
          onClick={() => setFilterStatus('completed')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            filterStatus === 'completed' ? 'bg-green-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Ready ({readyRooms})
        </button>
        <div className="flex-1"></div>
        <button
          onClick={handlePrintAllChecklists}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 transition-all flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          <span>Print All Checklists</span>
        </button>
      </div>

      <div className="space-y-6">
        {Object.keys(roomsByFloor).sort((a, b) => b - a).map(floor => (
          <div key={floor} className="bg-white/80 backdrop-blur-xl rounded-lg border border-white/20 p-4 shadow-xl">
            <h3 className="font-semibold text-gray-900 mb-4">Floor {floor}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {roomsByFloor[floor].map(room => {
                const hasBundle = !!getAssignedBundle(room.id)
                const status = bundleStatus[room.id] || 'ready'
                const isNeedsInspection = status === 'needs-inspection'
                const isPending = status === 'pending'
                const isReady = status === 'ready'

                // Determine card styling based on status
                let cardStyle = ''
                let iconBg = ''
                let statusBadge = ''
                let statusText = ''
                let icon = null

                if (!hasBundle) {
                  cardStyle = 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                  iconBg = 'bg-gray-200'
                  statusBadge = 'bg-gray-200 text-gray-600'
                  statusText = 'No Bundle'
                  icon = (
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )
                } else if (isNeedsInspection) {
                  cardStyle = 'border-red-500 bg-red-50 hover:border-red-600 hover:shadow-md'
                  iconBg = 'bg-red-100'
                  statusBadge = 'bg-red-100 text-red-700 font-semibold'
                  statusText = 'Inspection Needed'
                  icon = (
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )
                } else if (isPending) {
                  cardStyle = 'border-amber-500 bg-amber-50 cursor-not-allowed'
                  iconBg = 'bg-amber-100'
                  statusBadge = 'bg-amber-100 text-amber-700'
                  statusText = 'Pending (In Use)'
                  icon = (
                    <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )
                } else if (isReady) {
                  cardStyle = 'border-green-500 bg-green-50 cursor-not-allowed'
                  iconBg = 'bg-green-100'
                  statusBadge = 'bg-green-100 text-green-700'
                  statusText = 'Ready'
                  icon = (
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )
                }

                return (
                  <div
                    key={room.id}
                    className="relative"
                  >
                    {hasBundle && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemoveBundle(room.id, room.roomNumber || room.number)
                        }}
                        className="absolute top-2 left-2 p-1 bg-white rounded-md shadow-sm hover:bg-red-50 transition-all z-10 group"
                        title="Remove bundle from room"
                      >
                        <svg className="w-4 h-4 text-gray-600 group-hover:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                    {hasBundle && isNeedsInspection && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handlePrintRoomChecklist(room)
                        }}
                        className="absolute top-2 right-2 p-1 bg-white rounded-md shadow-sm hover:bg-gray-50 transition-all z-10"
                        title="Print checklist"
                      >
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => isNeedsInspection && handleStartChecklist(room)}
                      disabled={!isNeedsInspection}
                      className={`w-full p-4 rounded-xl border-2 transition-all ${cardStyle}`}
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${iconBg}`}>
                          {icon}
                        </div>
                        <span className="text-base font-bold text-gray-900">
                          {room.roomNumber || room.number}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${statusBadge}`}>
                          {statusText}
                        </span>
                      </div>
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      </div>

      {selectedRoom && (
        <Modal
          isOpen={showChecklistModal}
          onClose={() => {
            setShowChecklistModal(false)
            setSelectedRoom(null)
          }}
          title="Post-Checkout Inspection"
          size="2xl"
        >
          <HousekeepingChecklist
            room={selectedRoom}
            assignedBundle={getAssignedBundle(selectedRoom.id)}
            onComplete={handleCompleteChecklist}
            onCancel={() => {
              setShowChecklistModal(false)
              setSelectedRoom(null)
            }}
          />
        </Modal>
      )}

      {/* Printable Checklists - Hidden on screen, visible when printing */}
      <div className="print-only">
        <style jsx>{`
          @media screen {
            .print-only {
              display: none;
            }
          }
          @media print {
            .no-print {
              display: none !important;
            }
            .print-only {
              display: block;
            }
            .page-break {
              page-break-after: always;
            }
          }
        `}</style>

        {rooms.filter(room => getAssignedBundle(room.id)).map((room, index) => {
          const bundle = getAssignedBundle(room.id)
          const roomNum = room.roomNumber || room.number
          
          return (
            <div key={room.id} className={index < rooms.length - 1 ? 'page-break' : ''}>
              <div style={{ padding: '40px', fontFamily: 'Arial, sans-serif' }}>
                {/* Header */}
                <div style={{ borderBottom: '3px solid #000', paddingBottom: '20px', marginBottom: '30px' }}>
                  <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 10px 0' }}>
                    Housekeeping Checklist
                  </h1>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#666' }}>
                    <div>
                      <p style={{ margin: '5px 0' }}><strong>Room:</strong> {roomNum}</p>
                      <p style={{ margin: '5px 0' }}><strong>Floor:</strong> {room.floor || 1}</p>
                      <p style={{ margin: '5px 0' }}><strong>Type:</strong> {room.type}</p>
                    </div>
                    <div>
                      <p style={{ margin: '5px 0' }}><strong>Bundle:</strong> {bundle.name}</p>
                      <p style={{ margin: '5px 0' }}><strong>Date:</strong> _______________</p>
                      <p style={{ margin: '5px 0' }}><strong>Inspector:</strong> _______________</p>
                    </div>
                  </div>
                </div>

                {/* Instructions */}
                <div style={{ backgroundColor: '#f3f4f6', padding: '15px', borderRadius: '8px', marginBottom: '30px' }}>
                  <p style={{ margin: '0', fontSize: '14px', color: '#374151' }}>
                    <strong>Instructions:</strong> After guest checkout, inspect each item and mark the quantity remaining in the room. 
                    Items consumed or taken by guests will be automatically deducted from inventory.
                  </p>
                </div>

                {/* Items Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#000', color: '#fff' }}>
                      <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Item Name</th>
                      <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #ddd', width: '120px' }}>Expected Qty</th>
                      <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #ddd', width: '120px' }}>Remaining</th>
                      <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #ddd', width: '120px' }}>Consumed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bundle.items.map((item, idx) => (
                      <tr key={item.id} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#f9fafb' }}>
                        <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                          <div style={{ fontWeight: '500' }}>{item.name}</div>
                          {item.category && (
                            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                              {item.category}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center', border: '1px solid #ddd', fontWeight: 'bold' }}>
                          {item.quantity}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center', border: '1px solid #ddd', backgroundColor: '#fff' }}>
                          <div style={{ width: '60px', height: '30px', border: '2px solid #000', margin: '0 auto' }}></div>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center', border: '1px solid #ddd', backgroundColor: '#fff' }}>
                          <div style={{ width: '60px', height: '30px', border: '2px solid #000', margin: '0 auto' }}></div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Notes Section */}
                <div style={{ marginBottom: '30px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>Notes / Issues:</h3>
                  <div style={{ border: '2px solid #000', minHeight: '100px', padding: '10px' }}></div>
                </div>

                {/* Signature Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px' }}>
                  <div style={{ width: '45%' }}>
                    <div style={{ borderTop: '2px solid #000', paddingTop: '10px' }}>
                      <p style={{ margin: '0', fontSize: '14px' }}>Inspector Signature</p>
                    </div>
                  </div>
                  <div style={{ width: '45%' }}>
                    <div style={{ borderTop: '2px solid #000', paddingTop: '10px' }}>
                      <p style={{ margin: '0', fontSize: '14px' }}>Supervisor Signature</p>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #ddd', textAlign: 'center', fontSize: '12px', color: '#6b7280' }}>
                  <p style={{ margin: '0' }}>Minima Hotel Inventory System - Housekeeping Department</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
