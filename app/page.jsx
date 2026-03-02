'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../hooks/useAuth'

export default function HomePage() {
  const router = useRouter()
  const { isAuthenticated, user, loading } = useAuth()

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated && user) {
        // Role-based redirection for authenticated users
        switch (user.role) {
          case 'inventory-controller':
            router.push('/dashboard')
            break
          case 'kitchen-staff':
            router.push('/dashboard/kitchen')
            break
          case 'purchasing-officer':
            router.push('/dashboard/purchasing')
            break
          default:
            router.push('/dashboard')
        }
      } else {
        // Redirect to login page if not authenticated
        router.push('/login')
      }
    }
  }, [isAuthenticated, user, loading, router])

  // Show loading state while checking authentication
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="text-center">
        <div className="inline-flex items-center justify-center mb-6">
          <img 
            src="/icons/images/minima-logo.png" 
            alt="Minima Hotel Logo" 
            className="w-24 h-24 object-contain animate-pulse"
          />
        </div>
        <div className="flex items-center justify-center space-x-2">
          <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    </div>
  )
}
