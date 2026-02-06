'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '../../hooks/useAuth'

export default function Sidebar({ isMobileMenuOpen, isAnimating, onCloseMobileMenu }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0)

  // Load pending purchase orders count
  useEffect(() => {
    const loadPendingCount = async () => {
      try {
        // Import the purchase order API
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
      
      // Set up real-time listener for purchase orders
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
  
  // Filter navigation categories based on user role
  const getFilteredCategories = () => {
    if (!user) return navigationCategories
    
    return navigationCategories.map(category => ({
      ...category,
      items: category.items.filter(item => {
        // If no roles specified, show to everyone
        if (!item.roles) return true
        // Check if user's role is in the allowed roles
        return item.roles.includes(user.role)
      })
    })).filter(category => category.items.length > 0) // Only show categories with visible items
  }

  // Navigation organized by categories
  const navigationCategories = [
    {
      id: 'overview',
      name: 'Overview',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
      items: [
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
          roles: ['inventory-controller', 'kitchen-staff', 'purchasing-officer'],
          badge: null
        }
      ]
    },
    {
      id: 'inventory',
      name: 'Inventory Management',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M9 21V9l3-2 3 2v12" />
        </svg>
      ),
      items: [
        {
          name: 'Inventory',
          href: '/inventory',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M9 21V9l3-2 3 2v12" />
            </svg>
          ),
          roles: ['inventory-controller', 'kitchen-staff', 'purchasing-officer'],
          badge: null
        },
        {
          name: 'Items',
          href: '/inventory/items',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          ),
          roles: ['inventory-controller'],
          badge: null
        },
        {
          name: 'Assets',
          href: '/inventory/assets',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          ),
          roles: ['inventory-controller'],
          badge: null
        },
        {
          name: 'Budget Management',
          href: '/inventory/budget',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          roles: ['inventory-controller'],
          badge: null
        }
      ]
    },
    {
      id: 'procurement',
      name: 'Procurement',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
      items: [
        {
          name: 'Purchase Orders',
          href: '/purchase-orders',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ),
          roles: ['purchasing-officer', 'inventory-controller'],
          badge: pendingOrdersCount > 0 ? { text: pendingOrdersCount.toString(), color: 'bg-blue-500' } : null
        },
        {
          name: 'Deliveries',
          href: '/deliveries',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
          ),
          roles: ['purchasing-officer', 'inventory-controller'],
          badge: null
        },
        {
          name: 'Suppliers',
          href: '/suppliers',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          ),
          roles: ['purchasing-officer', 'inventory-controller'],
          badge: null
        }
      ]
    },
    {
      id: 'operations',
      name: 'Operations',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
        </svg>
      ),
      items: [
        {
          name: 'Menu Management',
          href: '/menu',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          ),
          roles: ['kitchen-staff', 'inventory-controller'],
          badge: null
        },
        {
          name: 'Audits',
          href: '/audits',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          ),
          roles: ['inventory-controller'],
          badge: { text: '2', color: 'bg-orange-500' }
        },
        {
          name: 'Reports',
          href: '/reports',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ),
          roles: ['inventory-controller'],
          badge: null
        }
      ]
    }
  ]

  const supportItems = [
    {
      name: 'Settings',
      href: '/settings',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      roles: ['inventory-controller']
    },
    {
      name: 'Help & Support',
      href: '/help',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ]

  // Filter support items based on user role
  const getFilteredSupportItems = () => {
    if (!user) return supportItems
    
    return supportItems.filter(item => {
      // If no roles specified, show to everyone
      if (!item.roles) return true
      
      // Check if user's role is in the allowed roles
      return item.roles.includes(user.role)
    })
  }

  const handleNavigation = (href) => {
    router.push(href)
    if (isMobileMenuOpen) {
      onCloseMobileMenu()
    }
  }

  const isActive = (href) => {
    // Exact match first
    if (pathname === href) return true
    
    // For sub-routes, only match if it's a direct child, not a deeper nested route
    // This prevents /inventory from matching /inventory/transactions or /inventory/assets
    if (href === '/inventory') {
      return pathname === '/inventory'
    }
    
    // For other routes, allow sub-routes
    return pathname.startsWith(href + '/')
  }

  const SidebarContent = () => (
    <>
      {/* Logo/Brand */}
      <div className="h-16 px-6 border-b border-white/10 flex items-center justify-start bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-gradient-to-br from-gray-900 to-black rounded-lg flex items-center justify-center shadow-lg overflow-hidden">
            <img 
              src="/icons/images/logo.png" 
              alt="Minima Hotel Logo" 
              className="w-7 h-7 object-contain"
            />
          </div>
          <div>
            <span className="text-xl font-heading font-semibold text-gray-900">Minima</span>
            <div className="text-xs text-gray-500 font-medium">Hotel Inventory</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto">
        <nav className="p-4 space-y-6">
          {getFilteredCategories().map((category) => (
            <div key={category.id} className="space-y-2">
              {/* Category Header - Non-clickable, always visible, left-aligned */}
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left">
                <div className="flex items-center space-x-2">
                  {category.icon}
                  <span>{category.name}</span>
                </div>
              </div>
              
              {/* Category Items - Always visible */}
              <div className="space-y-1">
                {category.items.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => handleNavigation(item.href)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group text-left ${
                      isActive(item.href)
                        ? 'bg-blue-500/20 text-blue-700 border border-blue-200/50 shadow-sm backdrop-blur-sm'
                        : 'text-gray-700 hover:bg-white/20 hover:text-gray-900 backdrop-blur-sm'
                    }`}
                  >
                    <div className="flex items-center space-x-3 text-left">
                      <div className={`${
                        isActive(item.href) ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                      }`}>
                        {item.icon}
                      </div>
                      <span>{item.name}</span>
                    </div>
                    
                    {item.badge && (
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white ${item.badge.color} backdrop-blur-sm`}>
                        {item.badge.text}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Support Section */}
        <div className="border-t border-white/10 mt-4">
          <nav className="p-4 space-y-1">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left">
              Support
            </div>
            {getFilteredSupportItems().map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavigation(item.href)}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group text-left ${
                  isActive(item.href)
                    ? 'bg-blue-500/20 text-blue-700 border border-blue-200/50 shadow-sm backdrop-blur-sm'
                    : 'text-gray-700 hover:bg-white/20 hover:text-gray-900 backdrop-blur-sm'
                }`}
              >
                <div className={`${
                  isActive(item.href) ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                }`}>
                  {item.icon}
                </div>
                <span>{item.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-64 bg-white/80 backdrop-blur-xl border-r border-white/20 h-screen flex-col fixed left-0 top-0 z-30 shadow-xl">
        <SidebarContent />
      </div>

      {/* Mobile & Tablet Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          {/* Backdrop */}
          <div 
            className={`fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ease-out ${
              isAnimating ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={onCloseMobileMenu}
          />
          
          {/* Sidebar */}
          <div className={`relative flex flex-col w-64 bg-white/90 backdrop-blur-xl border-r border-white/20 h-full transform transition-transform duration-300 ease-out shadow-2xl ${
            isAnimating ? 'translate-x-0' : '-translate-x-full'
          }`}>
            {/* Close Button */}
            <div className="absolute top-0 right-0 h-16 flex items-center pr-4 z-10">
              <button
                onClick={onCloseMobileMenu}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/20 rounded-lg backdrop-blur-sm transition-all duration-200 flex items-center justify-center"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  )
}