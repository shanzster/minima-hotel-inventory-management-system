'use client'

import { useState, useEffect } from 'react'
import { usePageTitle } from '../../../../hooks/usePageTitle'
import { useAuth } from '../../../../hooks/useAuth'
import menuApi from '../../../../lib/menuApi'
import inventoryApi from '../../../../lib/inventoryApi'
import kitchenApi from '../../../../lib/kitchenApi'
import Modal from '../../../../components/ui/Modal'
import Button from '../../../../components/ui/Button'
import PrepChecklist from '../../../../components/kitchen/PrepChecklist'
import KitchenWasteModal from '../../../../components/kitchen/KitchenWasteModal'
import ShiftReportModal from '../../../../components/kitchen/ShiftReportModal'

export default function KitchenDashboardPage() {
  const { setTitle } = usePageTitle()
  const { user, hasRole } = useAuth()
  const [menuItems, setMenuItems] = useState([])
  const [availableItems, setAvailableItems] = useState([])
  const [loading, setLoading] = useState(true)

  // Modal states
  const [showWasteModal, setShowWasteModal] = useState(false)
  const [showShiftReportModal, setShowShiftReportModal] = useState(false)

  // Load data
  const loadData = async () => {
    try {
      setLoading(true)
      const [menuData, inventoryData] = await Promise.all([
        menuApi.getAll(),
        inventoryApi.getAll()
      ])
      setMenuItems(menuData)
      setAvailableItems(inventoryData)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Set page title
  useEffect(() => {
    setTitle('Kitchen Dashboard')
  }, [setTitle])

  const menuWithIssues = menuItems.filter(menuItem =>
    menuItem.requiredIngredients?.some(ingredient => {
      const inventoryItem = availableItems.find(item => item.id === ingredient.ingredientId)
      return !inventoryItem || inventoryItem.currentStock === 0 ||
        (inventoryItem.currentStock > 0 && inventoryItem.currentStock <= inventoryItem.restockThreshold)
    }) || false
  )

  return (
    <div className="p-4 mx-2">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold text-gray-900 mb-1">Kitchen Dashboard</h1>
            <p className="text-gray-500 font-body text-sm">
              Monitor menu availability and manage kitchen operations
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={() => setShowWasteModal(true)}
              variant="secondary"
              className="bg-red-50 text-red-600 border-red-100 hover:bg-red-100"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Log Waste
            </Button>
            <Button
              onClick={() => setShowShiftReportModal(true)}
              variant="primary"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              Shift Report
            </Button>
          </div>
        </div>
      </div>

      {/* Menu Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Menu Items */}
        <div className="bg-white/80 backdrop-blur-xl rounded-lg border border-white/20 p-4 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h3 className="font-heading font-medium text-sm text-gray-600">Active Menu</h3>
                <p className="text-2xl font-heading font-bold text-black">
                  {menuItems.filter(item => item.isAvailable).length}
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500">Currently offered</p>
        </div>

        {/* Ingredient Issues */}
        <div className={`bg-white/80 backdrop-blur-xl rounded-lg border p-4 shadow-xl ${menuWithIssues.length > 0 ? 'border-amber-200 bg-amber-50/50' : 'border-white/20'
          }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${menuWithIssues.length > 0
                ? 'bg-gradient-to-br from-amber-100 to-amber-200'
                : 'bg-gradient-to-br from-gray-100 to-gray-200'
                }`}>
                <svg className={`w-5 h-5 ${menuWithIssues.length > 0 ? 'text-amber-700' : 'text-gray-700'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className={`font-heading font-medium text-sm ${menuWithIssues.length > 0 ? 'text-amber-700' : 'text-gray-600'
                  }`}>Stock Alerts</h3>
                <p className={`text-2xl font-heading font-bold ${menuWithIssues.length > 0 ? 'text-amber-600' : 'text-gray-700'
                  }`}>
                  {menuWithIssues.length}
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500">Items needing attention</p>
        </div>

        {/* Prep Tasks Progress */}
        <div className="bg-white/80 backdrop-blur-xl rounded-lg border border-white/20 p-4 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <h3 className="font-heading font-medium text-sm text-gray-600">Kitchen Pulse</h3>
                <p className="text-2xl font-heading font-bold text-blue-600">Steady</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500">Service operational</p>
        </div>

        {/* Unavailable Menu Items */}
        <div className={`bg-white/80 backdrop-blur-xl rounded-lg border p-4 shadow-xl ${menuItems.filter(item => !item.isAvailable).length > 0 ? 'border-red-200 bg-red-50/50' : 'border-white/20'
          }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${menuItems.filter(item => !item.isAvailable).length > 0
                ? 'bg-gradient-to-br from-red-100 to-red-200'
                : 'bg-gradient-to-br from-gray-100 to-gray-200'
                }`}>
                <svg className={`w-5 h-5 ${menuItems.filter(item => !item.isAvailable).length > 0 ? 'text-red-700' : 'text-gray-700'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className={`font-heading font-medium text-sm ${menuItems.filter(item => !item.isAvailable).length > 0 ? 'text-red-700' : 'text-gray-600'
                  }`}>Sold Out</h3>
                <p className={`text-2xl font-heading font-bold ${menuItems.filter(item => !item.isAvailable).length > 0 ? 'text-red-600' : 'text-gray-700'
                  }`}>
                  {menuItems.filter(item => !item.isAvailable).length}
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500">Disabled from menu</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Prep Checklist Section */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-bold text-lg text-gray-900">Daily Prep Checklist</h3>
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">Shift: Morning</span>
          </div>
          <PrepChecklist />
        </div>

        {/* Sidebar: Menu Issues & Quick Stats */}
        <div className="space-y-6">
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-lg shadow-xl overflow-hidden">
            <div className="border-b border-white/20 px-4 py-3 bg-gray-50">
              <h3 className="font-heading font-bold text-base text-amber-800 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Menu Items at Risk
              </h3>
            </div>
            <div className="p-4">
              {menuWithIssues.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-gray-500">All menu items fully stocked</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {menuWithIssues.slice(0, 5).map(item => (
                    <div key={item.id} className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
                      <h4 className="text-sm font-bold text-amber-900">{item.name}</h4>
                      <p className="text-xs text-amber-700 mt-0.5">Affected by low ingredient stock</p>
                      <button
                        onClick={() => window.location.href = '/menu'}
                        className="mt-2 text-xs font-bold text-amber-900 hover:underline"
                      >
                        REVIEW INGREDIENTS →
                      </button>
                    </div>
                  ))}
                  {menuWithIssues.length > 5 && (
                    <p className="text-center text-xs text-gray-400 pt-2">+ {menuWithIssues.length - 5} more items</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-black text-white rounded-lg shadow-xl p-6">
            <h3 className="font-heading font-bold text-lg mb-4">Quick Links</h3>
            <div className="grid grid-cols-1 gap-3">
              <Button
                onClick={() => window.location.href = '/menu'}
                className="justify-start bg-white/10 hover:bg-white/20 border-white/10 text-white"
              >
                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Menu Availability
              </Button>
              <Button
                onClick={() => window.location.href = '/inventory'}
                className="justify-start bg-white/10 hover:bg-white/20 border-white/10 text-white"
              >
                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M9 21V9l3-2 3 2v12" />
                </svg>
                Check Stock
              </Button>
              <Button
                onClick={() => window.location.href = '/inventory/bulk'}
                className="justify-start bg-white/10 hover:bg-white/20 border-white/10 text-white"
              >
                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                </svg>
                Bulk Stock Transfer
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <Modal
        isOpen={showWasteModal}
        onClose={() => setShowWasteModal(false)}
        title="Log Kitchen Waste"
        size="md"
      >
        <KitchenWasteModal
          onCancel={() => setShowWasteModal(false)}
          onSubmit={() => {
            setShowWasteModal(false)
            loadData()
          }}
        />
      </Modal>

      <Modal
        isOpen={showShiftReportModal}
        onClose={() => setShowShiftReportModal(false)}
        title="End of Shift Reconciliation"
        size="lg"
      >
        <ShiftReportModal
          onCancel={() => setShowShiftReportModal(false)}
          onSubmit={() => {
            setShowShiftReportModal(false)
            loadData()
          }}
        />
      </Modal>
    </div>
  )
}
