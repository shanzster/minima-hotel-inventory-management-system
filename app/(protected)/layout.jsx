'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '../../hooks/useAuth'
import { NavigationProvider } from '../../hooks/useNavigation'
import Header from '../../components/layout/Header'
import Sidebar from '../../components/layout/Sidebar'
import { PageTitleProvider } from '../../hooks/usePageTitle'

export default function ProtectedLayout({ children }) {
  const { isAuthenticated, loading, user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleOpenMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(true)
    // Trigger animation after mount
    setTimeout(() => {
      setIsAnimating(true)
    }, 10)
  }, [])

  const handleCloseMobileMenu = useCallback(() => {
    setIsAnimating(false)
    setTimeout(() => {
      setIsMobileMenuOpen(false)
    }, 300) // Match the animation duration
  }, [])

  // Close mobile menu when route changes
  useEffect(() => {
    if (isMobileMenuOpen) {
      handleCloseMobileMenu()
    }
  }, [pathname, isMobileMenuOpen, handleCloseMobileMenu])

  // Close mobile menu on window resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) { // lg breakpoint
        setIsMobileMenuOpen(false)
        setIsAnimating(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    // Only redirect if we're not loading and user is not authenticated
    if (!loading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, loading, router])

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-whitesmoke flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render children if not authenticated
  if (!isAuthenticated) {
    return null
  }

  return (
    <NavigationProvider>
      <PageTitleProvider>
        <div className="min-h-screen bg-whitesmoke">
          <Sidebar 
            isMobileMenuOpen={isMobileMenuOpen}
            isAnimating={isAnimating}
            onCloseMobileMenu={handleCloseMobileMenu}
          />
          {/* Desktop Layout */}
          <div className="lg:ml-64 flex flex-col min-h-screen">
            <Header 
              isMobileMenuOpen={isMobileMenuOpen}
              isAnimating={isAnimating}
              onOpenMobileMenu={handleOpenMobileMenu}
            />
            <main className="flex-1 pt-20 lg:pt-0">
              {children}
            </main>
          </div>
        </div>
      </PageTitleProvider>
    </NavigationProvider>
  )
}