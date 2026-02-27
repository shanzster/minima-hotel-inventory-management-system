'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '../../hooks/useAuth'
import { useState, useEffect } from 'react'

export default function BottomNavigation() {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0)

  // Load pending purchase orders count
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

  // All navigation items
  const allNavItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5v4" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v4" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 5v4" />
        </svg>
      ),
      roles: ['inventory-controller', 'kitchen-staff', 'purchasing-officer']
    },
    {
      name: 'Inventory',
      href: '/inventory',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M9 21V9l3-2 3 2v12" />
        </svg>
      ),
      roles: ['inventory-controller', 'kitchen-staff', 'purchasing-officer']
    },
    {
      name: 'Items',
      href: '/inventory/items',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      ),
      roles: ['inventory-controller']
    },
    {
      name: 'Assets',
      href: '/inventory/assets',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      roles: ['inventory-controller']
    },
    {
      name: 'Suppliers',
      href: '/suppliers',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      roles: ['inventory-controller', 'purchasing-officer']
    },
    {
      name: 'Purchase Orders',
      href: '/purchase-orders',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      roles: ['inventory-controller', 'purchasing-officer'],
      badge: pendingOrdersCount > 0 ? { text: pendingOrdersCount, color: 'bg-red-500' } : null
    },
    {
      name: 'Menu',
      href: '/menu',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C6.5 6.253 2 10.998 2 17s4.5 10.747 10 10.747c5.5 0 10-4.998 10-10.747 0-6.002-4.5-10.747-10-10.747z" />
        </svg>
      ),
      roles: ['kitchen-staff', 'inventory-controller']
    }
  ]

  // Filter items based on user role
  const getFilteredItems = () => {
    if (!user) return []
    return allNavItems.filter(item => {
      if (!item.roles) return true
      return item.roles.includes(user.role)
    })
  }

  const isActive = (href) => {
    if (href === '/dashboard') {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  const filteredItems = getFilteredItems()

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-white/20 shadow-2xl z-30">
      <div className="flex items-center justify-around h-20 px-2">
        {filteredItems.map((item) => (
          <button
            key={item.name}
            onClick={() => router.push(item.href)}
            className={`flex flex-col items-center justify-center flex-1 h-full px-2 py-2 transition-all duration-200 relative group ${isActive(item.href)
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
              }`}
            title={item.name}
          >
            <div className={`${isActive(item.href) ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`}>
              {item.icon}
            </div>
            <span className="text-xs mt-1 font-medium truncate max-w-full">{item.name}</span>

            {item.badge && (
              <span className={`absolute top-1 right-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-bold text-white ${item.badge.color}`}>
                {item.badge.text}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
