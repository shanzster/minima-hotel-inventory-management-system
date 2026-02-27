'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../hooks/useAuth'

export default function DashboardRedirect() {
  const router = useRouter()
  const { user, hasRole } = useAuth()

  useEffect(() => {
    if (!user) return

    // Redirect to role-specific dashboard
    if (hasRole('kitchen-staff')) {
      router.replace('/dashboard/kitchen')
    } else if (hasRole('inventory-controller')) {
      router.replace('/dashboard/inventory')
    } else if (hasRole('purchasing-officer')) {
      router.replace('/dashboard/purchasing')
    } else {
      // Default fallback
      router.replace('/dashboard/inventory')
    }
  }, [user, hasRole, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    </div>
  )
}
