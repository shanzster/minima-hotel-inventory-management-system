'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import { useRouter, usePathname } from 'next/navigation'

// Navigation Context
const NavigationContext = createContext()

// Navigation Provider
export function NavigationProvider({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const [navigationHistory, setNavigationHistory] = useState([])
  const [isNavigating, setIsNavigating] = useState(false)

  // Track navigation history
  useEffect(() => {
    setNavigationHistory(prev => {
      const newHistory = [...prev, pathname]
      // Keep only last 10 entries
      return newHistory.slice(-10)
    })
  }, [pathname])

  // Navigation helper functions
  const navigateTo = (href, options = {}) => {
    const { replace = false, scroll = true } = options
    
    setIsNavigating(true)
    
    if (replace) {
      router.replace(href, { scroll })
    } else {
      router.push(href, { scroll })
    }
    
    // Reset navigating state after a short delay
    setTimeout(() => setIsNavigating(false), 100)
  }

  const goBack = () => {
    if (navigationHistory.length > 1) {
      router.back()
    } else {
      // Fallback to dashboard if no history
      navigateTo('/dashboard')
    }
  }

  const isActive = (href, exact = false) => {
    if (exact) {
      return pathname === href
    }
    
    // Special handling for inventory routes
    if (href === '/inventory') {
      return pathname === '/inventory'
    }
    
    // For other routes, check if current path starts with href
    return pathname.startsWith(href)
  }

  const getActiveSection = () => {
    const segments = pathname.split('/').filter(Boolean)
    return segments[0] || 'dashboard'
  }

  const getBreadcrumbs = () => {
    const segments = pathname.split('/').filter(Boolean)
    const breadcrumbs = []
    
    let currentPath = ''
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`
      
      // Convert segment to readable name
      const name = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
      
      breadcrumbs.push({
        name,
        href: currentPath,
        isLast: index === segments.length - 1
      })
    })
    
    return breadcrumbs
  }

  const value = {
    pathname,
    navigationHistory,
    isNavigating,
    navigateTo,
    goBack,
    isActive,
    getActiveSection,
    getBreadcrumbs
  }

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  )
}

// Hook to use navigation context
export function useNavigation() {
  const context = useContext(NavigationContext)
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider')
  }
  return context
}

// Breadcrumb component
export function Breadcrumbs({ className = '' }) {
  const { getBreadcrumbs, navigateTo } = useNavigation()
  const breadcrumbs = getBreadcrumbs()

  if (breadcrumbs.length <= 1) {
    return null
  }

  return (
    <nav className={`flex items-center space-x-2 text-sm ${className}`}>
      <button
        onClick={() => navigateTo('/dashboard')}
        className="text-gray-500 hover:text-gray-700 transition-colors"
      >
        Dashboard
      </button>
      
      {breadcrumbs.map((breadcrumb, index) => (
        <div key={breadcrumb.href} className="flex items-center space-x-2">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          
          {breadcrumb.isLast ? (
            <span className="text-gray-900 font-medium">
              {breadcrumb.name}
            </span>
          ) : (
            <button
              onClick={() => navigateTo(breadcrumb.href)}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              {breadcrumb.name}
            </button>
          )}
        </div>
      ))}
    </nav>
  )
}

// Quick navigation component
export function QuickNavigation({ className = '' }) {
  const { navigateTo, getActiveSection } = useNavigation()
  const activeSection = getActiveSection()

  const quickLinks = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Inventory', href: '/inventory', icon: '📦' },
    { name: 'Orders', href: '/purchase-orders', icon: '📋' },
    { name: 'Suppliers', href: '/suppliers', icon: '🏢' },
    { name: 'Audits', href: '/audits', icon: '🔍' }
  ]

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {quickLinks.map((link) => (
        <button
          key={link.href}
          onClick={() => navigateTo(link.href)}
          className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            activeSection === link.href.slice(1) || (link.href === '/dashboard' && activeSection === 'dashboard')
              ? 'bg-gray-100 text-black'
              : 'text-gray-600 hover:text-black hover:bg-gray-50'
          }`}
          title={link.name}
        >
          <span className="mr-2">{link.icon}</span>
          <span className="hidden sm:inline">{link.name}</span>
        </button>
      ))}
    </div>
  )
}