'use client'

import { useState, useEffect } from 'react'
import { CURRENCY } from '../../lib/constants.js'
import { useAuth } from '../../hooks/useAuth'
import { 
  getLowStockItems,
  getCriticalStockItems,
  getExpiringItems,
  getExpiredItems,
  getPendingPurchaseOrders
} from '../../lib/mockData'

export default function NotificationDropdown() {
  const { user } = useAuth()
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState([])

  // Generate real-time notifications based on inventory conditions
  useEffect(() => {
    const generateNotifications = () => {
      const newNotifications = []
      const now = new Date()

      // Critical Stock Alerts (Highest Priority)
      const criticalItems = getCriticalStockItems()
      if (criticalItems.length > 0) {
        newNotifications.push({
          id: 'critical-stock',
          type: 'critical',
          title: 'Critical Stock Alert',
          message: `${criticalItems.length} items are completely out of stock`,
          details: criticalItems.slice(0, 3).map(item => item.name).join(', '),
          timestamp: now,
          priority: 'high',
          icon: '🚨',
          actionUrl: '/inventory?filter=critical'
        })
      }

      // Expiring Items (Time-sensitive)
      const expiringItems = getExpiringItems(3) // 3 days
      if (expiringItems.length > 0) {
        newNotifications.push({
          id: 'expiring-items',
          type: 'warning',
          title: 'Items Expiring Soon',
          message: `${expiringItems.length} items expire within 3 days`,
          details: expiringItems.slice(0, 2).map(item => `${item.name} (${new Date(item.expirationDate).toLocaleDateString()})`).join(', '),
          timestamp: new Date(now.getTime() - 30 * 60000), // 30 minutes ago
          priority: 'medium',
          icon: '⏰',
          actionUrl: '/inventory?filter=expiring'
        })
      }

      // Purchase Order Updates (Role-specific)
      const pendingOrders = getPendingPurchaseOrders()
      if (pendingOrders.length > 0 && ['inventory-controller', 'purchasing-officer'].includes(user?.role)) {
        newNotifications.push({
          id: 'pending-orders',
          type: 'info',
          title: 'Purchase Orders Pending',
          message: `${pendingOrders.length} purchase orders need approval`,
          details: pendingOrders.slice(0, 2).map(po => `${po.orderNumber} - ${CURRENCY.SYMBOL}${po.totalAmount}`).join(', '),
          timestamp: new Date(now.getTime() - 2 * 60 * 60000), // 2 hours ago
          priority: 'medium',
          icon: '📋',
          actionUrl: '/purchase-orders?status=pending'
        })
      }

      // Low Stock Warnings
      const lowStockItems = getLowStockItems()
      if (lowStockItems.length > 0) {
        newNotifications.push({
          id: 'low-stock',
          type: 'warning',
          title: 'Low Stock Warning',
          message: `${lowStockItems.length} items are running low`,
          details: lowStockItems.slice(0, 3).map(item => item.name).join(', '),
          timestamp: new Date(now.getTime() - 4 * 60 * 60000), // 4 hours ago
          priority: 'low',
          icon: '📉',
          actionUrl: '/inventory?filter=low-stock'
        })
      }

      // Menu Item Availability (Kitchen Staff specific)
      if (user?.role === 'kitchen-staff') {
        const unavailableMenuItems = criticalItems.filter(item => item.category === 'menu-items')
        if (unavailableMenuItems.length > 0) {
          newNotifications.push({
            id: 'menu-unavailable',
            type: 'warning',
            title: 'Menu Items Unavailable',
            message: `${unavailableMenuItems.length} menu items affected by stock shortage`,
            details: unavailableMenuItems.map(item => item.name).join(', '),
            timestamp: new Date(now.getTime() - 1 * 60 * 60000), // 1 hour ago
            priority: 'high',
            icon: '🍽️',
            actionUrl: '/menu'
          })
        }
      }

      // Asset Maintenance Due (Inventory Controller specific)
      if (user?.role === 'inventory-controller') {
        newNotifications.push({
          id: 'maintenance-due',
          type: 'info',
          title: 'Equipment Maintenance Due',
          message: 'Coffee machine maintenance scheduled for today',
          details: 'Industrial Coffee Machine - Last serviced 3 months ago',
          timestamp: new Date(now.getTime() - 6 * 60 * 60000), // 6 hours ago
          priority: 'medium',
          icon: '🔧',
          actionUrl: '/assets?filter=maintenance-due'
        })
      }

      // Delivery Notifications (Purchasing Officer specific)
      if (user?.role === 'purchasing-officer') {
        newNotifications.push({
          id: 'delivery-arrived',
          type: 'success',
          title: 'Delivery Arrived',
          message: 'Coffee Roasters Ltd delivery has arrived',
          details: 'PO-2024-001 - 50kg Premium Coffee Beans',
          timestamp: new Date(now.getTime() - 15 * 60000), // 15 minutes ago
          priority: 'medium',
          icon: '📦',
          actionUrl: '/purchase-orders/po-001'
        })
      }

      return newNotifications.sort((a, b) => {
        // Sort by priority first, then by timestamp
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority]
        }
        return new Date(b.timestamp) - new Date(a.timestamp)
      })
    }

    setNotifications(generateNotifications())
  }, [user])

  const getNotificationCount = () => {
    return notifications.filter(n => n.priority === 'high').length || notifications.length
  }

  const getTimeAgo = (timestamp) => {
    const now = new Date()
    const diff = now - new Date(timestamp)
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return 'Just now'
  }

  const getNotificationStyle = (type) => {
    switch (type) {
      case 'critical':
        return 'border-l-red-500 bg-red-50'
      case 'warning':
        return 'border-l-yellow-500 bg-yellow-50'
      case 'success':
        return 'border-l-green-500 bg-green-50'
      case 'info':
      default:
        return 'border-l-blue-500 bg-blue-50'
    }
  }

  const handleNotificationClick = (notification) => {
    setShowNotifications(false)
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl
    }
  }

  return (
    <div className="relative">
      <button 
        onClick={() => setShowNotifications(!showNotifications)}
        className="p-2 text-gray-400 hover:text-gray-600 transition-all duration-200 ease-out"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M15 17h5l-5 5v-5zM10.5 3.5a6 6 0 0 1 6 6v2l1.5 3h-15l1.5-3v-2a6 6 0 0 1 6-6z" 
          />
        </svg>
        {/* Notification Badge */}
        {getNotificationCount() > 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {getNotificationCount() > 9 ? '9+' : getNotificationCount()}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {showNotifications && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-md shadow-lg border border-gray-200 py-2 z-50 max-h-96 overflow-y-auto">
          <div className="px-4 py-2 border-b border-gray-100">
            <h3 className="font-heading font-medium text-black">Notifications</h3>
            <p className="text-xs text-gray-500">{notifications.length} notifications</p>
          </div>
          
          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <div className="text-gray-400 mb-2">
                <svg className="h-8 w-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm text-gray-500">No notifications</p>
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-l-4 ${getNotificationStyle(notification.type)}`}
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-lg">{notification.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-black truncate">
                          {notification.title}
                        </p>
                        <span className="text-xs text-gray-500 ml-2">
                          {getTimeAgo(notification.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mt-1">
                        {notification.message}
                      </p>
                      {notification.details && (
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          {notification.details}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
          
          {notifications.length > 0 && (
            <div className="border-t border-gray-100 px-4 py-2">
              <button 
                onClick={() => setShowNotifications(false)}
                className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
              >
                Mark all as read
              </button>
            </div>
          )}
        </div>
      )}

      {/* Click outside to close dropdown */}
      {showNotifications && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowNotifications(false)}
        />
      )}
    </div>
  )
}