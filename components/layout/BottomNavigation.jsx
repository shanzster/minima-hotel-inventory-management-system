'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '../../hooks/useAuth'
import { useState, useEffect } from 'react'

export default function BottomNavigation() {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0)

  useEffect(() => {
    const loadPendingCount = async () => {
      try {
        const { default: purchaseOrderApi } = await import('../../lib/purchaseOrderApi')
        const orders = await purchaseOrderApi.getAll()
        const pendingCount = orders.filter(order => order.status === 'pending').length
        setPendingOrdersCount(pendingCount)
      } catch (error) {
        console.error('Error loading pending orders count:', error)
        setPendingOrdersCount(0)
      }
    }

    if (user) {
      loadPendingCount()
      const setupListener = async () => {
        try {
          const { default: purchaseOrderApi } = await import('../../lib/purchaseOrderApi')
          const unsubscribe = purchaseOrderApi.onPurchaseOrdersChange((orders) => {
            const pendingCount = orders.filter(order => order.status === 'pending').length
            setPendingOrdersCount(pendingCount)
          })
          return unsubscribe
        } catch (error) {
          console.error('Error setting up purchase orders listener:', error)
        }
      }
      const listenerPromise = setupListener()
      return () => {
        listenerPromise.then(unsubscribe => {
          if (unsubscribe) unsubscribe()
        })
      }
    }
  }, [user])

  const allNavItems = [
    { name: 'Dashboard', href: '/dashboard', icon: (<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" /></svg>), roles: ['inventory-controller', 'kitchen-staff', 'purchasing-officer'] },
    { name: 'Inventory', href: '/inventory', icon: (<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M9 21V9l3-2 3 2v12" /></svg>), roles: ['inventory-controller', 'kitchen-staff', 'purchasing-officer'] },
    { name: 'Items', href: '/inventory/items', icon: (<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>), roles: ['inventory-controller'] },
    { name: 'Assets', href: '/inventory/assets', icon: (<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>), roles: ['inventory-controller'] },
    { name: 'Bundles', href: '/inventory/bundles', icon: (<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M9 21V9l3-2 3 2v12" /></svg>), roles: ['inventory-controller'] },
    { name: 'Budget', href: '/inventory/budget', icon: (<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>), roles: ['inventory-controller'] },
    { name: 'PO', href: '/purchase-orders', icon: (<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>), roles: ['inventory-controller', 'purchasing-officer'], badge: pendingOrdersCount > 0 ? { text: pendingOrdersCount, color: 'bg-red-500' } : null },
    { name: 'Deliveries', href: '/deliveries', icon: (<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>), roles: ['purchasing-officer', 'inventory-controller'] },
    { name: 'Suppliers', href: '/suppliers', icon: (<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>), roles: ['inventory-controller', 'purchasing-officer'] },
    { name: 'Housekeeping', href: '/housekeeping', icon: (<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>), roles: ['inventory-controller'] },
    { name: 'Menu', href: '/menu', icon: (<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>), roles: ['kitchen-staff', 'inventory-controller'] },
    { name: 'Audits', href: '/audits', icon: (<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>), roles: ['inventory-controller'] },
    { name: 'Help', href: '/help', icon: (<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>), roles: ['inventory-controller', 'kitchen-staff', 'purchasing-officer'] }
  ]

  const getFilteredItems = () => {
    if (!user) return []
    return allNavItems.filter(item => !item.roles || item.roles.includes(user.role))
  }

  const isActive = (href) => {
    if (href === '/dashboard') return pathname === href
    if (href === '/inventory') return pathname === '/inventory'
    return pathname.startsWith(href)
  }

  const filteredItems = getFilteredItems()

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-200 shadow-2xl z-30">
      <div className="flex items-center h-16 px-1 overflow-x-auto overflow-y-hidden scrollbar-hide">
        <div className="flex items-center justify-start min-w-max">
          {filteredItems.map((item) => (
            <button
              key={item.name}
              onClick={() => router.push(item.href)}
              className={`flex flex-col items-center justify-center h-full px-3 py-2 transition-all duration-200 relative group min-w-[60px] ${
                isActive(item.href) ? 'text-blue-600' : 'text-gray-500 hover:text-gray-800'
              }`}
              title={item.name}
            >
              <div className={`transition-all ${isActive(item.href) ? 'text-blue-600 scale-110' : 'text-gray-400 group-hover:text-gray-600 group-hover:scale-105'}`}>
                {item.icon}
              </div>
              {isActive(item.href) && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-blue-600 rounded-t-full" />
              )}
              {item.badge && (
                <span className={`absolute top-1 right-1 inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-xs font-bold text-white ${item.badge.color} min-w-[18px]`}>
                  {item.badge.text}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
