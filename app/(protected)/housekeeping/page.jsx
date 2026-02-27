'use client'

import { useState, useEffect } from 'react'
import { usePageTitle } from '../../../hooks/usePageTitle'
import { useAuth } from '../../../hooks/useAuth'
import HousekeepingChecklist from '../../../components/inventory/HousekeepingChecklist'
import Modal from '../../../components/ui/Modal'
import roomsApi from '../../../lib/roomsApi'
import toast from '../../../lib/toast'

// Mock storage for completed checklists and room-bundle assignments
const CHECKLISTS_KEY = 'housekeeping_checklists'
const ROOM_BUNDLES_KEY = 'room_bundle_assignments'
const BUNDLES_KEY = 'hotel_inventory_bundles'

export default function HousekeepingPage() {
  const { setTitle } = usePageTitle()
  const { user } = useAuth()
  const [rooms, setRooms] = useState([])
  const [bundles, setBundles] = useState([])
  const [roomBundles, setRoomBundles] = useState({})
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
    setSelectedRoom(room)
    setShowChecklistModal(true)
  }

  const handleCompleteChecklist = async (checklistData) => {
    const newChecklists = [...completedChecklists, checklistData]
    setCompletedChecklists(newChecklists)
    localStorage.setItem(CHECKLISTS_KEY, JSON.stringify(newChecklists))

    setShowChecklistModal(false)
    setSelectedRoom(null)
    
    const roomNum = checklistData.room.number || checklistData.room.roomNumber
    if (checklistData.totalConsumed > 0) {
      toast.success(`Checklist completed for Room ${roomNum}. ${checklistData.totalConsumed} items deducted from inventory.`)
    } else {
      toast.success(`Checklist completed for Room ${roomNum}. No items consumed.`)
    }
  }

  const handlePrintRoomChecklist = (room) => {
    const bundle = getAssignedBundle(room.id)
    if (!bundle) return

    const printWindow = window.open('', '_blank')
    const roomNum = room.roomNumber || room.number
    const today = new Date().toLocaleDateString()

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Housekeeping Checklist - Room ${roomNum}</title>
          <style>
            @media print {
              @page { margin: 1cm; }
              body { margin: 0; }
            }
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              max-width: 800px;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              border-bottom: 3px solid #000;
              padding-bottom: 15px;
              margin-bottom: 20px;
            }
            .header h1 {
              margin: 0 0 5px 0;
              font-size: 24px;
            }
            .header p {
              margin: 5px 0;
              color: #666;
            }
            .room-info {
              background: #f5f5f5;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 20px;
              display: flex;
              justify-content: space-between;
            }
            .room-info div {
              flex: 1;
            }
            .room-info strong {
              display: block;
              color: #333;
              margin-bottom: 5px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            th {
              background: #333;
              color: white;
              padding: 12px;
              text-align: left;
              font-weight: bold;
            }
            td {
              padding: 12px;
              border-bottom: 1px solid #ddd;
            }
            tr:hover {
              background: #f9f9f9;
            }
            .checkbox {
              width: 20px;
              height: 20px;
              border: 2px solid #333;
              display: inline-block;
              margin-right: 10px;
            }
            .signature-section {
              margin-top: 40px;
              display: flex;
              justify-content: space-between;
            }
            .signature-box {
              flex: 1;
              margin: 0 10px;
            }
            .signature-line {
              border-top: 2px solid #000;
              margin-top: 50px;
              padding-top: 5px;
              text-align: center;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 15px;
              border-top: 1px solid #ddd;
              color: #666;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🏨 HOUSEKEEPING CHECKLIST</h1>
            <p>Post-Checkout Inventory Inspection</p>
          </div>

          <div class="room-info">
            <div>
              <strong>Room Number:</strong>
              ${roomNum}
            </div>
            <div>
              <strong>Bundle:</strong>
              ${bundle.name}
            </div>
            <div>
              <strong>Date:</strong>
              ${today}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 50px;">✓</th>
                <th>Item Name</th>
                <th style="width: 100px;">Category</th>
                <th style="width: 120px;">Expected Qty</th>
                <th style="width: 120px;">Remaining Qty</th>
                <th style="width: 120px;">Consumed</th>
              </tr>
            </thead>
            <tbody>
              ${bundle.items.map(item => `
                <tr>
                  <td><span class="checkbox"></span></td>
                  <td><strong>${item.name}</strong></td>
                  <td>${item.category || 'N/A'}</td>
                  <td>${item.quantity} ${item.unit || 'pcs'}</td>
                  <td>_______</td>
                  <td>_______</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="signature-section">
            <div class="signature-box">
              <div class="signature-line">
                Inspected By
              </div>
            </div>
            <div class="signature-box">
              <div class="signature-line">
                Verified By
              </div>
            </div>
          </div>

          <div class="footer">
            <p>This checklist must be completed after every guest checkout.</p>
            <p>Report any discrepancies to the Inventory Manager immediately.</p>
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
    const today = new Date().toLocaleDateString()

    const checklistsHTML = roomsWithBundles.map(room => {
      const bundle = getAssignedBundle(room.id)
      const roomNum = room.roomNumber || room.number

      return `
        <div class="checklist-page">
          <div class="header">
            <h1>🏨 HOUSEKEEPING CHECKLIST</h1>
            <p>Post-Checkout Inventory Inspection</p>
          </div>

          <div class="room-info">
            <div>
              <strong>Room Number:</strong>
              ${roomNum}
            </div>
            <div>
              <strong>Bundle:</strong>
              ${bundle.name}
            </div>
            <div>
              <strong>Date:</strong>
              ${today}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 50px;">✓</th>
                <th>Item Name</th>
                <th style="width: 100px;">Category</th>
                <th style="width: 120px;">Expected Qty</th>
                <th style="width: 120px;">Remaining Qty</th>
                <th style="width: 120px;">Consumed</th>
              </tr>
            </thead>
            <tbody>
              ${bundle.items.map(item => `
                <tr>
                  <td><span class="checkbox"></span></td>
                  <td><strong>${item.name}</strong></td>
                  <td>${item.category || 'N/A'}</td>
                  <td>${item.quantity} ${item.unit || 'pcs'}</td>
                  <td>_______</td>
                  <td>_______</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="signature-section">
            <div class="signature-box">
              <div class="signature-line">
                Inspected By
              </div>
            </div>
            <div class="signature-box">
              <div class="signature-line">
                Verified By
              </div>
            </div>
          </div>

          <div class="footer">
            <p>This checklist must be completed after every guest checkout.</p>
            <p>Report any discrepancies to the Inventory Manager immediately.</p>
          </div>
        </div>
      `
    }).join('')

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>All Housekeeping Checklists</title>
          <style>
            @media print {
              @page { margin: 1cm; }
              body { margin: 0; }
              .checklist-page {
                page-break-after: always;
              }
              .checklist-page:last-child {
                page-break-after: auto;
              }
            }
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
            }
            .checklist-page {
              max-width: 800px;
              margin: 0 auto 40px auto;
            }
            .header {
              text-align: center;
              border-bottom: 3px solid #000;
              padding-bottom: 15px;
              margin-bottom: 20px;
            }
            .header h1 {
              margin: 0 0 5px 0;
              font-size: 24px;
            }
            .header p {
              margin: 5px 0;
              color: #666;
            }
            .room-info {
              background: #f5f5f5;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 20px;
              display: flex;
              justify-content: space-between;
            }
            .room-info div {
              flex: 1;
            }
            .room-info strong {
              display: block;
              color: #333;
              margin-bottom: 5px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            th {
              background: #333;
              color: white;
              padding: 12px;
              text-align: left;
              font-weight: bold;
            }
            td {
              padding: 12px;
              border-bottom: 1px solid #ddd;
            }
            tr:hover {
              background: #f9f9f9;
            }
            .checkbox {
              width: 20px;
              height: 20px;
              border: 2px solid #333;
              display: inline-block;
              margin-right: 10px;
            }
            .signature-section {
              margin-top: 40px;
              display: flex;
              justify-content: space-between;
            }
            .signature-box {
              flex: 1;
              margin: 0 10px;
            }
            .signature-line {
              border-top: 2px solid #000;
              margin-top: 50px;
              padding-top: 5px;
              text-align: center;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 15px;
              border-top: 1px solid #ddd;
              color: #666;
              font-size: 12px;
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

  const getRoomStatus = (room) => {
    if (isCompletedToday(room.id)) return 'completed'
    return 'pending'
  }

  const getAssignedBundle = (roomId) => {
    const bundleId = roomBundles[roomId]
    if (!bundleId) return null
    return bundles.find(b => b.id === bundleId)
  }

  const filteredRooms = rooms.filter(room => {
    if (filterStatus === 'all') return true
    const status = getRoomStatus(room)
    return status === filterStatus
  })

  const roomsByFloor = {}
  filteredRooms.forEach(room => {
    const floor = room.floor || 1
    if (!roomsByFloor[floor]) roomsByFloor[floor] = []
    roomsByFloor[floor].push(room)
  })

  const totalRooms = rooms.length
  const completedToday = rooms.filter(room => isCompletedToday(room.id)).length
  const pendingRooms = totalRooms - completedToday
  const completionRate = totalRooms > 0 ? Math.round((completedToday / totalRooms) * 100) : 0

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
              <p className="text-sm text-green-600">Completed Today</p>
              <p className="text-2xl font-bold text-green-700">{completedToday}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-lg border border-amber-200 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-amber-600">Pending</p>
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
          Completed ({completedToday})
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
                const status = getRoomStatus(room)
                const isCompleted = status === 'completed'
                const hasBundle = !!getAssignedBundle(room.id)

                return (
                  <button
                    key={room.id}
                    onClick={() => !isCompleted && handleStartChecklist(room)}
                    disabled={isCompleted || !hasBundle}
                    className={`relative p-4 rounded-xl border-2 transition-all ${
                      isCompleted
                        ? 'border-green-500 bg-green-50 cursor-not-allowed'
                        : hasBundle
                        ? 'border-gray-200 bg-white hover:border-purple-400 hover:shadow-md'
                        : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                    }`}
                  >
                    {hasBundle && !isCompleted && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handlePrintRoomChecklist(room)
                        }}
                        className="absolute top-2 right-2 p-1 bg-white rounded-md shadow-sm hover:bg-gray-50 transition-all"
                        title="Print checklist"
                      >
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                      </button>
                    )}
                    <div className="flex flex-col items-center space-y-2">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        isCompleted ? 'bg-green-100' : hasBundle ? 'bg-purple-100' : 'bg-gray-200'
                      }`}>
                        {isCompleted ? (
                          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : hasBundle ? (
                          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M9 21V9l3-2 3 2v12" />
                          </svg>
                        ) : (
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        )}
                      </div>
                      <span className="text-base font-bold text-gray-900">
                        {room.roomNumber || room.number}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        isCompleted ? 'bg-green-100 text-green-700' : hasBundle ? 'bg-amber-100 text-amber-700' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {isCompleted ? 'Done' : hasBundle ? 'Pending' : 'No Bundle'}
                      </span>
                    </div>
                  </button>
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
