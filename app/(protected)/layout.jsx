'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '../../hooks/useAuth'
import { NavigationProvider } from '../../hooks/useNavigation'
import Header from '../../components/layout/Header'
import Sidebar from '../../components/layout/Sidebar'
import BottomNavigation from '../../components/layout/BottomNavigation'
import { PageTitleProvider } from '../../hooks/usePageTitle'

export default function ProtectedLayout({ children }) {
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

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
          {/* Desktop Sidebar */}
          <Sidebar />
          
          {/* Bottom Navigation for Mobile/Tablet */}
          <BottomNavigation />
          
          {/* Main Content */}
          <div className="lg:ml-64 flex flex-col min-h-screen lg:pb-0 pb-20">
            <Header />
            <main className="flex-1 pt-20 lg:pt-0">
              {children}
            </main>
          </div>
        </div>
      </PageTitleProvider>
    </NavigationProvider>
  )
}