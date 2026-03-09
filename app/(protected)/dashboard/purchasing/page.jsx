'use client'

import { useState, useEffect } from 'react'
import { usePageTitle } from '../../../../hooks/usePageTitle'
import { useAuth } from '../../../../hooks/useAuth'
import { formatCurrency } from '../../../../lib/utils'
import inventoryApi from '../../../../lib/inventoryApi'

export default function PurchasingOfficerDashboardPage() {
  const { setTitle } = usePageTitle()
  const { user, hasRole } = useAuth()
  const [purchaseOrders, setPurchaseOrders] = useState([])
  const [inventoryItems, setInventoryItems] = useState([])
  const [lowStockItems, setLowStockItems] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const purchaseOrderApi = (await import('../../../../lib/purchaseOrderApi')).default
        const [ordersData, inventoryData] = await Promise.all([
          purchaseOrderApi.getAll(),
          inventoryApi.getAll()
        ])
        setPurchaseOrders(ordersData)
        setInventoryItems(inventoryData)
        
        // Calculate real low stock items
        const realLowStockItems = inventoryData.filter(item => {
          // Exclude asset instances
          if (item.type === 'asset-instance' || item.type === 'assigned-asset') return false
          
          // Check if current stock is at or below minimum stock or restock threshold
          const currentStock = parseFloat(item.currentStock) || 0
          const minStock = parseFloat(item.minStock) || 0
          const restockThreshold = parseFloat(item.restockThreshold) || 0
          
          return currentStock <= minStock || currentStock <= restockThreshold
        })
        
        setLowStockItems(realLowStockItems)
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
    setTitle('Purchasing Dashboard')
  }, [setTitle])

  // Calculate metrics
  const pendingOrders = purchaseOrders.filter(po => po.status === 'pending')
  const approvedOrders = purchaseOrders.filter(po => po.status === 'approved')
  const inTransitOrders = purchaseOrders.filter(po => po.status === 'in-transit')
  const deliveredOrders = purchaseOrders.filter(po => po.status === 'delivered')
  
  const totalOrderValue = purchaseOrders
    .filter(po => po.status !== 'rejected')
    .reduce((sum, po) => sum + po.totalAmount, 0)

  return (
    <div className="p-4 mx-2">
      {/* Page Header */}
      <div className="mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900 mb-1">Purchasing Dashboard</h1>
          <p className="text-gray-500 font-body text-sm">
            Manage purchase orders and supplier relationships
          </p>
        </div>
      </div>
      
      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {/* Total Orders */}
        <div className="bg-white/80 backdrop-blur-xl rounded-lg border border-white/20 p-4 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-heading font-medium text-sm text-gray-600">Total Orders</h3>
                <p className="text-2xl font-heading font-bold text-black">
                  {purchaseOrders.length}
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500">All purchase orders</p>
        </div>

        {/* Pending Orders */}
        <div className={`bg-white/80 backdrop-blur-xl rounded-lg border p-4 shadow-xl ${
          pendingOrders.length > 0 ? 'border-amber-200 bg-amber-50/50' : 'border-white/20'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                pendingOrders.length > 0 
                  ? 'bg-gradient-to-br from-amber-100 to-amber-200' 
                  : 'bg-gradient-to-br from-gray-100 to-gray-200'
              }`}>
                <svg className={`w-5 h-5 ${pendingOrders.length > 0 ? 'text-amber-700' : 'text-gray-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className={`font-heading font-medium text-sm ${
                  pendingOrders.length > 0 ? 'text-amber-700' : 'text-gray-600'
                }`}>Pending</h3>
                <p className={`text-2xl font-heading font-bold ${
                  pendingOrders.length > 0 ? 'text-amber-600' : 'text-gray-700'
                }`}>
                  {pendingOrders.length}
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500">Awaiting approval</p>
        </div>

        {/* Approved Orders */}
        <div className={`bg-white/80 backdrop-blur-xl rounded-lg border p-4 shadow-xl ${
          approvedOrders.length > 0 ? 'border-green-200 bg-green-50/50' : 'border-white/20'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                approvedOrders.length > 0 
                  ? 'bg-gradient-to-br from-green-100 to-green-200' 
                  : 'bg-gradient-to-br from-gray-100 to-gray-200'
              }`}>
                <svg className={`w-5 h-5 ${approvedOrders.length > 0 ? 'text-green-700' : 'text-gray-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className={`font-heading font-medium text-sm ${
                  approvedOrders.length > 0 ? 'text-green-700' : 'text-gray-600'
                }`}>Approved</h3>
                <p className={`text-2xl font-heading font-bold ${
                  approvedOrders.length > 0 ? 'text-green-600' : 'text-gray-700'
                }`}>
                  {approvedOrders.length}
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500">Ready to send</p>
        </div>

        {/* In Transit */}
        <div className={`bg-white/80 backdrop-blur-xl rounded-lg border p-4 shadow-xl ${
          inTransitOrders.length > 0 ? 'border-blue-200 bg-blue-50/50' : 'border-white/20'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                inTransitOrders.length > 0 
                  ? 'bg-gradient-to-br from-blue-100 to-blue-200' 
                  : 'bg-gradient-to-br from-gray-100 to-gray-200'
              }`}>
                <svg className={`w-5 h-5 ${inTransitOrders.length > 0 ? 'text-blue-700' : 'text-gray-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                </svg>
              </div>
              <div>
                <h3 className={`font-heading font-medium text-sm ${
                  inTransitOrders.length > 0 ? 'text-blue-700' : 'text-gray-600'
                }`}>In Transit</h3>
                <p className={`text-2xl font-heading font-bold ${
                  inTransitOrders.length > 0 ? 'text-blue-600' : 'text-gray-700'
                }`}>
                  {inTransitOrders.length}
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500">On the way</p>
        </div>

        {/* Total Order Value */}
        <div className="bg-white/80 backdrop-blur-xl rounded-lg border border-white/20 p-4 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-heading font-medium text-sm text-gray-600">Total Value</h3>
                <p className="text-2xl font-heading font-bold text-purple-600">
                  {formatCurrency(totalOrderValue)}
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500">Active orders</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white/80 backdrop-blur-xl rounded-lg border border-white/20 p-4 mb-6 shadow-xl">
        <h3 className="font-heading font-medium text-base mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <a
            href="/purchase-orders"
            className="flex items-center justify-center px-4 py-3 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Order
          </a>
          <a
            href="/suppliers"
            className="flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Manage Suppliers
          </a>
          <a
            href="/inventory"
            className="flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M9 21V9l3-2 3 2v12" />
            </svg>
            View Inventory
          </a>
          <a
            href="/reports"
            className="flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Reports
          </a>
        </div>
      </div>

      {/* Recent Orders and Low Stock Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recent Purchase Orders */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-lg shadow-xl">
          <div className="border-b border-white/20 px-4 py-3">
            <h3 className="font-heading font-medium text-base">
              Recent Purchase Orders
              <span className="text-gray-500 font-normal ml-2 text-sm">
                ({purchaseOrders.length} total)
              </span>
            </h3>
          </div>
          <div className="p-4">
            {purchaseOrders.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No purchase orders yet</p>
            ) : (
              <div className="space-y-3">
                {purchaseOrders.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => window.location.href = `/purchase-orders`}>
                    <div>
                      <h4 className="font-medium text-gray-900">{order.orderNumber}</h4>
                      <p className="text-sm text-gray-500">{order.supplier.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{formatCurrency(order.totalAmount)}</p>
                      <p className={`text-xs font-medium ${
                        order.status === 'pending' ? 'text-amber-600' :
                        order.status === 'approved' ? 'text-green-600' :
                        order.status === 'in-transit' ? 'text-blue-600' :
                        'text-gray-600'
                      }`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('-', ' ')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Items Needing Restock */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-lg shadow-xl">
          <div className="border-b border-white/20 px-4 py-3">
            <h3 className="font-heading font-medium text-base">
              Items Needing Restock
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
                  <div key={item.id} className="flex items-center justify-between p-3 border border-amber-200 bg-amber-50/50 rounded-lg hover:bg-amber-100/50 cursor-pointer transition-colors"
                    onClick={() => window.location.href = `/inventory/${item.id}`}>
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
      </div>
    </div>
  )
}
