'use client'

import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { usePageTitle } from '../../hooks/usePageTitle'
import Button from '../ui/Button'
import NotificationDropdown from './NotificationDropdown'

export default function Header({ isMobileMenuOpen, isAnimating, onOpenMobileMenu }) {
  const { title } = usePageTitle()
  const { user, logout } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const handleLogout = () => {
    // Close the dropdown first
    setShowUserMenu(false)
    
    // Clear authentication
    logout()
    
    // Force a full page reload to clear all state and redirect to login
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  }

  const getUserInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'inventory-controller':
        return 'Super Admin'
      case 'kitchen-staff':
        return 'Kitchen Staff'
      case 'purchasing-officer':
        return 'Purchasing Officer'
      default:
        return 'User'
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 fixed top-0 left-0 right-0 lg:relative lg:left-auto z-20 h-[73px] flex items-center">
      <div className="flex items-center justify-between w-full">
        {/* Left - Mobile Menu Button + Title */}
        <div className="flex items-center space-x-3">
          {/* Mobile Menu Button - Only show on mobile when sidebar is not animating in */}
          {!isAnimating && (
            <button
              onClick={onOpenMobileMenu}
              className="lg:hidden p-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
          
          {/* Title */}
          <div className="flex-shrink-0">
            <h1 className="text-lg sm:text-xl font-heading font-medium text-black truncate">
              {title}
            </h1>
          </div>
        </div>

        {/* Right - User Profile & Notifications */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Notification Icon */}
          <NotificationDropdown />

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 sm:space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {/* User Avatar */}
              <div className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {user ? getUserInitials(user.name) : 'U'}
              </div>
              
              {/* User Info - Hidden on small screens */}
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium text-black">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-gray-500">
                  {user ? getRoleDisplayName(user.role) : 'Role'}
                </p>
              </div>

              {/* Dropdown Arrow */}
              <svg 
                className={`h-4 w-4 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-black">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                  <p className="text-xs text-gray-400 mt-1 sm:hidden">
                    {user ? getRoleDisplayName(user.role) : 'Role'}
                  </p>
                </div>
                
                <button
                  onClick={() => {
                    setShowUserMenu(false)
                    // Navigate to profile/settings
                    window.location.href = '/settings'
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Profile Settings
                </button>
                
                <button
                  onClick={() => {
                    setShowUserMenu(false)
                    // Navigate to help
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Help & Support
                </button>
                
                <div className="border-t border-gray-100 mt-2 pt-2">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </header>
  )
}