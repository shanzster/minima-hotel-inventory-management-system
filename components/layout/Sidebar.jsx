'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '../../hooks/useAuth'

export default function Sidebar({ isMobileMenuOpen, isAnimating, onCloseMobileMenu }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()
  const [isTrackingOpen, setIsTrackingOpen] = useState(false)
  
  // Filter navigation items based on user role
  const getFilteredNavigationItems = () => {
    if (!user) return navigationItems
    
    return navigationItems.filter(item => {
      // If no roles specified, show to everyone
      if (!item.roles) return true
      
      // Check if user's role is in the allowed roles
      return item.roles.includes(user.role)
    })
  }

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

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
      roles: ['inventory-controller'] // Dashboard should be for inventory controllers primarily
    },
    {
      name: 'Inventory',
      href: '/inventory',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M9 21V9l3-2 3 2v12" />
        </svg>
      ),
      roles: ['inventory-controller', 'kitchen-staff', 'purchasing-officer'] // All roles need some inventory access
    },
    {
      name: 'Transactions',
      href: '/inventory/transactions',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      roles: ['inventory-controller'] // Only show for inventory controllers
    },
    {
      name: 'Menu Management',
      href: '/menu',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      roles: ['kitchen-staff', 'inventory-controller'] // Only show for these roles
    },
    {
      name: 'Purchase Orders',
      href: '/purchase-orders',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      roles: ['purchasing-officer', 'inventory-controller'] // Only show for these roles
    },
    {
      name: 'Assets',
      href: '/inventory/assets',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      roles: ['inventory-controller'] // Only show for inventory controllers
    },
    {
      name: 'Suppliers',
      href: '/suppliers',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      roles: ['purchasing-officer', 'inventory-controller'] // Only show for these roles
    },
    {
      name: 'Audits',
      href: '/audits',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      roles: ['inventory-controller'] // Only show for inventory controllers
    },
    {
      name: 'Reports',
      href: '/reports',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      roles: ['inventory-controller'] // Reports should be restricted to inventory controllers
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
      roles: ['inventory-controller'] // Settings should be restricted to inventory controllers
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

  const handleNavigation = (href) => {
    router.push(href)
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
      <div className="h-[73px] px-6 border-b border-gray-200 flex items-center justify-start">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">M</span>
          </div>
          <span className="text-xl font-heading font-medium text-black">Minima</span>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search"
            className="w-full h-11 pl-10 pr-8 bg-gray-50 border border-gray-300 rounded-sm text-sm placeholder-gray-400 focus:outline-none focus:border-black transition-all duration-200 ease-out"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-xs text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded hidden sm:block">⌘K</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto">
        <nav className="p-4 space-y-1">
          {getFilteredNavigationItems().map((item) => (
            <div key={item.name}>
              <button
                onClick={() => {
                  if (item.hasSubmenu) {
                    setIsTrackingOpen(!isTrackingOpen)
                  } else {
                    handleNavigation(item.href)
                  }
                }}
                className={`w-full flex items-center justify-between px-5 py-3 text-sm font-medium rounded-sm transition-all duration-200 ease-out ${
                  isActive(item.href)
                    ? 'bg-gray-100 text-black'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-black'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {item.icon}
                  <span>{item.name}</span>
                </div>
                
                {item.hasSubmenu && (
                  <svg 
                    className={`w-4 h-4 transition-transform ${isTrackingOpen ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </button>
              
              {item.hasSubmenu && isTrackingOpen && (
                <div className="ml-8 mt-1 space-y-1">
                  {item.submenu.map((subItem) => (
                    <button
                      key={subItem.name}
                      onClick={() => handleNavigation(subItem.href)}
                      className={`w-full text-left px-5 py-3 text-sm rounded-sm transition-all duration-200 ease-out ${
                        isActive(subItem.href)
                          ? 'bg-gray-100 text-black'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-black'
                      }`}
                    >
                      {subItem.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Support Section */}
        <div className="border-t border-gray-200 mt-4">
          <nav className="p-4 space-y-1">
            {getFilteredSupportItems().map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavigation(item.href)}
                className={`w-full flex items-center space-x-3 px-5 py-3 text-sm font-medium rounded-sm transition-all duration-200 ease-out ${
                  isActive(item.href)
                    ? 'bg-gray-100 text-black'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-black'
                }`}
              >
                {item.icon}
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
      <div className="hidden lg:flex w-64 bg-white border-r border-gray-200 h-screen flex-col fixed left-0 top-0 z-30">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          {/* Backdrop */}
          <div 
            className={`fixed inset-0 bg-black transition-opacity duration-300 ease-out ${
              isAnimating ? 'bg-opacity-50' : 'bg-opacity-0'
            }`}
            onClick={onCloseMobileMenu}
          />
          
          {/* Sidebar */}
          <div className={`relative flex flex-col w-64 bg-white border-r border-gray-200 h-full transform transition-transform duration-300 ease-out ${
            isAnimating ? 'translate-x-0' : '-translate-x-full'
          }`}>
            {/* Close Button - Aligned with logo section */}
            <div className="absolute top-0 right-0 h-[73px] flex items-center pr-4 z-10">
              <button
                onClick={onCloseMobileMenu}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center"
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