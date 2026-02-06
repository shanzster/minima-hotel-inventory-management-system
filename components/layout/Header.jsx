'use client'

import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { usePageTitle } from '../../hooks/usePageTitle'
import Button from '../ui/Button'

export default function Header({ isMobileMenuOpen, isAnimating, onOpenMobileMenu }) {
  const { title } = usePageTitle()
  const { user, logout } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const handleLogout = () => {
    setShowUserMenu(false)
    logout()
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
        return 'Inventory Controller'
      case 'kitchen-staff':
        return 'Kitchen Staff'
      case 'purchasing-officer':
        return 'Purchasing Officer'
      default:
        return 'User'
    }
  }

  return (
    <header className="bg-white/80 backdrop-blur-xl border-b border-white/20 px-4 sm:px-6 fixed top-0 left-0 right-0 lg:relative lg:left-auto z-20 h-16 flex items-center shadow-xl">
      <div className="flex items-center justify-between w-full">
        {/* Left - Mobile Menu Button */}
        <div className="flex items-center space-x-4">
          {/* Mobile Menu Button */}
          {!isAnimating && (
            <button
              onClick={onOpenMobileMenu}
              className="lg:hidden p-2 text-gray-600 hover:text-gray-800 hover:bg-white/20 rounded-lg backdrop-blur-sm transition-all duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
        </div>

        {/* Right - Actions & User Profile */}
        <div className="flex items-center space-x-3">

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white/20 backdrop-blur-sm transition-all duration-200"
            >
              {/* User Avatar */}
              <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-sm">
                {user ? getUserInitials(user.name) : 'U'}
              </div>
              
              {/* User Info - Hidden on small screens */}
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium text-gray-900">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-gray-500">
                  {user ? getRoleDisplayName(user.role) : 'Role'}
                </p>
              </div>

              {/* Dropdown Arrow */}
              <svg 
                className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white/90 backdrop-blur-xl rounded-lg shadow-2xl border border-white/30 py-2 z-50">
                <div className="px-4 py-3 border-b border-white/20">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                  <p className="text-xs text-blue-600 mt-1 font-medium">
                    {user ? getRoleDisplayName(user.role) : 'Role'}
                  </p>
                </div>
                
                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowUserMenu(false)
                      window.location.href = '/settings'
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-white/20 backdrop-blur-sm transition-colors flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Profile Settings</span>
                  </button>
                  
                  <button
                    onClick={() => setShowUserMenu(false)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-white/20 backdrop-blur-sm transition-colors flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Help & Support</span>
                  </button>
                </div>
                
                <div className="border-t border-white/20 pt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50/50 backdrop-blur-sm transition-colors flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setShowUserMenu(false)
          }}
        />
      )}
    </header>
  )
}