'use client'

import { useState, useEffect } from 'react'
import { usePageTitle } from '../../../../hooks/usePageTitle'
import { useAuth } from '../../../../hooks/useAuth'
import { formatCurrency } from '../../../../lib/utils'
import inventoryApi from '../../../../lib/inventoryApi'
import menuApi from '../../../../lib/menuApi'
import purchaseOrderApi from '../../../../lib/purchaseOrderApi'
import budgetApi from '../../../../lib/budgetApi'

export default function InventoryControllerDashboardPage() {
  const { setTitle } = usePageTitle()
  const { user, hasRole } = useAuth()
  const [inventoryItems, setInventoryItems] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [purchaseOrders, setPurchaseOrders] = useState([])
  const [monthlyBudget, setMonthlyBudget] = useState({
    allocated: 0,
    spent: 0,
    remaining: 0,
    percentage: 0
  })
  const [loading, setLoading] = useState(true)

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [inventoryData, menuData, poData, budgetData] = await Promise.all([
          inventoryApi.getAll(),
          menuApi.getAll(),
          purchaseOrderApi.getPendingOrders(),
          budgetApi.getCurrentMonthBudget()
        ])

        setInventoryItems(inventoryData)
        setMenuItems(menuData)
        setPurchaseOrders(poData.slice(0, 3)) // Only show first 3

        // Set budget data
        const allocated = budgetData.amount || 0
        const spent = budgetData.spent || 0
        const remaining = allocated - spent
        const percentage = allocated > 0 ? ((spent / allocated) * 100).toFixed(1) : 0

        setMonthlyBudget({
          allocated,
          spent,
          remaining,
          percentage: parseFloat(percentage)
        })
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Set page title
  useEffect(() => {
    setTitle('Inventory Dashboard')
  }, [setTitle])

  // Calculate metrics from real data
  const lowStockItems = inventoryItems.filter(item =>
    item.currentStock <= item.restockThreshold && item.currentStock > 0
  )

  const criticalStockItems = inventoryItems.filter(item =>
    item.currentStock === 0
  )

  const expiringItems = inventoryItems.filter(item => {
    if (!item.expirationDate) return false
    const now = new Date()
    const expiryDate = new Date(item.expirationDate)
    const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry >= 0 && daysUntilExpiry <= 7
  })

  const expiredItems = inventoryItems.filter(item => {
    if (!item.expirationDate) return false
    const expiryDate = new Date(item.expirationDate)
    return expiryDate < new Date()
  })

  const assetsNeedingMaintenance = inventoryItems.filter(item =>
    (item.type === 'asset' || item.type === 'assigned-asset') &&
    (item.maintenanceStatus === 'overdue' ||
      item.maintenanceStatus === 'due-soon' ||
      item.condition === 'needs-maintenance' ||
      item.condition === 'damaged')
  )

  const menuAvailableToday = menuItems.filter(item => item.isAvailable).length

  return (
    <div className="p-4 mx-2">
      {/* Page Header */}
      <div className="mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900 mb-1">Inventory Dashboard</h1>
          <p className="text-gray-500 font-body text-sm">
            Monitor stock levels and manage daily operations
          </p>
        </div>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Assets Needing Maintenance */}
        <div className={`bg-white/80 backdrop-blur-xl rounded-lg border p-4 shadow-xl ${assetsNeedingMaintenance.length > 0 ? 'border-red-200 bg-red-50/50' : 'border-white/20'
          }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${assetsNeedingMaintenance.length > 0
                ? 'bg-gradient-to-br from-red-100 to-red-200'
                : 'bg-gradient-to-br from-gray-100 to-gray-200'
                }`}>
                <svg className={`w-5 h-5 ${assetsNeedingMaintenance.length > 0 ? 'text-red-700' : 'text-gray-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h3 className={`font-heading font-medium text-sm ${assetsNeedingMaintenance.length > 0 ? 'text-red-700' : 'text-gray-600'
                  }`}>Assets Maintenance</h3>
                <p className={`text-2xl font-heading font-bold ${assetsNeedingMaintenance.length > 0 ? 'text-red-600' : 'text-gray-700'
                  }`}>
                  {assetsNeedingMaintenance.length}
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500">Need attention</p>
        </div>

        {/* Kitchen Menu Available */}
        <div className="bg-white/80 backdrop-blur-xl rounded-lg border border-white/20 p-4 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h3 className="font-heading font-medium text-sm text-gray-600">Menu Available</h3>
                <p className="text-2xl font-heading font-bold text-green-600">
                  {menuAvailableToday}
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500">Items today</p>
        </div>

        {/* Low Stock Items */}
        <div className={`bg-white/80 backdrop-blur-xl rounded-lg border p-4 shadow-xl ${lowStockItems.length > 0 ? 'border-amber-200 bg-amber-50/50' : 'border-white/20'
          }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${lowStockItems.length > 0
                ? 'bg-gradient-to-br from-amber-100 to-amber-200'
                : 'bg-gradient-to-br from-gray-100 to-gray-200'
                }`}>
                <svg className={`w-5 h-5 ${lowStockItems.length > 0 ? 'text-amber-700' : 'text-gray-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M9 21V9l3-2 3 2v12" />
                </svg>
              </div>
              <div>
                <h3 className={`font-heading font-medium text-sm ${lowStockItems.length > 0 ? 'text-amber-700' : 'text-gray-600'
                  }`}>Low Stock</h3>
                <p className={`text-2xl font-heading font-bold ${lowStockItems.length > 0 ? 'text-amber-600' : 'text-gray-700'
                  }`}>
                  {lowStockItems.length}
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500">Items below threshold</p>
        </div>

        {/* Expiring Soon */}
        <div className={`bg-white/80 backdrop-blur-xl rounded-lg border p-4 shadow-xl ${expiringItems.length > 0 ? 'border-orange-200 bg-orange-50/50' : 'border-white/20'
          }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${expiringItems.length > 0
                ? 'bg-gradient-to-br from-orange-100 to-orange-200'
                : 'bg-gradient-to-br from-gray-100 to-gray-200'
                }`}>
                <svg className={`w-5 h-5 ${expiringItems.length > 0 ? 'text-orange-700' : 'text-gray-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className={`font-heading font-medium text-sm ${expiringItems.length > 0 ? 'text-orange-700' : 'text-gray-600'
                  }`}>Expiring Soon</h3>
                <p className={`text-2xl font-heading font-bold ${expiringItems.length > 0 ? 'text-orange-600' : 'text-gray-700'
                  }`}>
                  {expiringItems.length}
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500">Within 7 days</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white/80 backdrop-blur-xl rounded-lg border border-white/20 p-4 mb-6 shadow-xl">
        <h3 className="font-heading font-medium text-base mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/inventory"
            className="flex items-center justify-center px-4 py-3 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M9 21V9l3-2 3 2v12" />
            </svg>
            Manage Inventory
          </a>
          <a
            href="/purchase-orders"
            className="flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Purchase Orders
          </a>
          <a
            href="/audits"
            className="flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Audits
          </a>
        </div>
      </div>

      {/* Budget and Purchase Orders Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Monthly Budget Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-lg border border-white/20 p-4 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-medium text-base">Monthly Budget</h3>
            <span className="text-xs text-gray-500">February 2026</span>
          </div>

          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Allocated</span>
              <span className="text-lg font-heading font-bold text-gray-900">
                {formatCurrency(monthlyBudget.allocated)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Spent</span>
              <span className="text-lg font-heading font-bold text-gray-900">
                {formatCurrency(monthlyBudget.spent)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Remaining</span>
              <span className={`text-lg font-heading font-bold ${monthlyBudget.percentage < 60 ? 'text-green-600' :
                monthlyBudget.percentage < 80 ? 'text-amber-600' :
                  'text-red-600'
                }`}>
                {formatCurrency(monthlyBudget.remaining)}
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-600">Budget Usage</span>
              <span className="text-xs font-medium text-gray-900">{monthlyBudget.percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${monthlyBudget.percentage < 60 ? 'bg-gradient-to-r from-green-400 to-green-600' :
                  monthlyBudget.percentage < 80 ? 'bg-gradient-to-r from-amber-400 to-amber-600' :
                    'bg-gradient-to-r from-red-400 to-red-600'
                  }`}
                style={{ width: `${monthlyBudget.percentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Pending Purchase Orders Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-lg border border-white/20 shadow-xl">
          <div className="border-b border-white/20 px-4 py-3">
            <h3 className="font-heading font-medium text-base">
              Pending Purchase Orders
              <span className="text-gray-500 font-normal ml-2 text-sm">
                ({purchaseOrders.length} orders)
              </span>
            </h3>
          </div>
          <div className="p-4">
            {purchaseOrders.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No pending orders</p>
            ) : (
              <div className="space-y-3">
                {purchaseOrders.map((po) => (
                  <div
                    key={po.id}
                    className="flex items-center justify-between p-3 border border-blue-200 bg-blue-50/50 rounded-lg hover:bg-blue-100/50 cursor-pointer transition-colors"
                    onClick={() => window.location.href = '/purchase-orders'}
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{po.orderNumber || po.id}</h4>
                      <p className="text-sm text-gray-600">{po.supplier?.name || po.supplier || 'Unknown Supplier'}</p>
                      <p className="text-xs text-gray-500 mt-1">{po.items?.length || 0} items</p>
                    </div>
                    <div className="text-right ml-3">
                      <p className="text-sm font-bold text-blue-600">{formatCurrency(po.totalAmount || 0)}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {po.expectedDelivery ? new Date(po.expectedDelivery).toLocaleDateString() : 'TBD'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Critical Items Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Assets Needing Maintenance with Room Locations */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-lg shadow-xl">
          <div className="border-b border-white/20 px-4 py-3">
            <h3 className="font-heading font-medium text-base">
              Assets Needing Maintenance
              <span className="text-gray-500 font-normal ml-2 text-sm">
                ({assetsNeedingMaintenance.length} assets)
              </span>
            </h3>
          </div>
          <div className="p-4">
            {assetsNeedingMaintenance.length === 0 ? (
              <p className="text-center text-gray-500 py-8">All assets are well maintained</p>
            ) : (
              <div className="space-y-3">
                {assetsNeedingMaintenance.slice(0, 5).map((item) => (
                  <div key={item.id} className={`flex items-center justify-between p-3 border rounded-lg hover:opacity-80 cursor-pointer transition-colors ${item.maintenanceStatus === 'overdue'
                    ? 'border-red-200 bg-red-50/50'
                    : 'border-amber-200 bg-amber-50/50'
                    }`}
                    onClick={() => window.location.href = `/inventory/${item.id}`}>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.name}</h4>
                      <div className="flex items-center mt-1 space-x-2">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <p className="text-sm text-gray-600 font-medium">{item.location || 'No location'}</p>
                      </div>
                    </div>
                    <div className="text-right ml-3">
                      <span className={`inline-block px-2 py-1 text-xs font-bold rounded ${(item.maintenanceStatus === 'overdue' || item.condition === 'damaged')
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                        }`}>
                        {item.condition === 'damaged' ? 'DAMAGED' :
                          item.condition === 'needs-maintenance' ? 'MAINTENANCE' :
                            item.maintenanceStatus === 'overdue' ? 'OVERDUE' : 'DUE SOON'}
                      </span>
                      {item.nextMaintenanceDate && (
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(item.nextMaintenanceDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Items */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-lg shadow-xl">
          <div className="border-b border-white/20 px-4 py-3">
            <h3 className="font-heading font-medium text-base">
              Low Stock Items
              <span className="text-gray-500 font-normal ml-2 text-sm">
                ({lowStockItems.length} items)
              </span>
            </h3>
          </div>
          <div className="p-4">
            {lowStockItems.length === 0 ? (
              <p className="text-center text-gray-500 py-8">All items are well stocked</p>
            ) : (
              <div className="space-y-3">
                {lowStockItems.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border border-amber-200 bg-amber-50/50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">{item.name}</h4>
                      <p className="text-sm text-gray-500">{item.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-amber-600">{item.currentStock} {item.unit}</p>
                      <p className="text-xs text-gray-500">Min: {item.restockThreshold}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Expiring Soon */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-lg shadow-xl">
          <div className="border-b border-white/20 px-4 py-3">
            <h3 className="font-heading font-medium text-base">
              Expiring Soon
              <span className="text-gray-500 font-normal ml-2 text-sm">
                ({expiringItems.length} items)
              </span>
            </h3>
          </div>
          <div className="p-4">
            {expiringItems.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No items expiring soon</p>
            ) : (
              <div className="space-y-3">
                {expiringItems.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border border-orange-200 bg-orange-50/50 rounded-lg hover:bg-orange-100/50 cursor-pointer transition-colors"
                    onClick={() => window.location.href = `/inventory/${item.id}`}>
                    <div>
                      <h4 className="font-medium text-gray-900">{item.name}</h4>
                      <p className="text-sm text-gray-500">{item.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-orange-600">
                        {item.expirationDate ? new Date(item.expirationDate).toLocaleDateString() : 'N/A'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.expirationDate ?
                          `${Math.ceil((new Date(item.expirationDate) - new Date()) / (1000 * 60 * 60 * 24))} days`
                          : 'No expiry'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
