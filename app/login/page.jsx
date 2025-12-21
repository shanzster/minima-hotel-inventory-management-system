'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../hooks/useAuth'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationErrors, setValidationErrors] = useState({})
  
  const { login, error, isAuthenticated } = useAuth()
  const router = useRouter()

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, router])

  const validateForm = () => {
    const errors = {}
    
    if (!email) {
      errors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Please enter a valid email address'
    }
    
    if (!password) {
      errors.password = 'Password is required'
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters'
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setIsSubmitting(true)
    
    try {
      await login(email, password)
      router.push('/dashboard')
    } catch (err) {
      // Error is handled by useAuth hook
      console.error('Login failed:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--whitesmoke)' }}>
      {/* Background with subtle texture */}
      <div className="absolute inset-0 opacity-30">
        <div className="h-full w-full" style={{ 
          backgroundImage: `radial-gradient(circle at 1px 1px, var(--gray-300) 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }}></div>
      </div>
      
      {/* Main content */}
      <div className="relative flex items-center justify-center min-h-screen px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Logo/Brand area */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-full" 
                 style={{ backgroundColor: 'var(--accent-sand)' }}>
              <div className="w-8 h-8 rounded-sm" style={{ backgroundColor: 'var(--black)' }}></div>
            </div>
            <h1 className="text-2xl font-heading font-medium mb-2" style={{ color: 'var(--black)' }}>
              Minima Hotel
            </h1>
            <p className="text-sm" style={{ color: 'var(--gray-500)' }}>
              Inventory Management System
            </p>
          </div>

          {/* Login form */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            {error && (
              <div className="mb-6 p-4 rounded-md border border-red-200 bg-red-50">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-3" style={{ color: 'var(--gray-700)' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={`w-full px-4 py-3 border rounded-md transition-all duration-200 ease-out focus:outline-none focus:ring-0 ${
                    validationErrors.email 
                      ? 'border-red-400 focus:border-red-500' 
                      : 'border-gray-300 focus:border-black'
                  }`}
                  placeholder="your@email.com"
                  disabled={isSubmitting}
                  style={{ 
                    fontFamily: 'var(--font-body)',
                    backgroundColor: validationErrors.email ? '#fef2f2' : 'white'
                  }}
                />
                {validationErrors.email && (
                  <p className="mt-2 text-sm text-red-600">{validationErrors.email}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-3" style={{ color: 'var(--gray-700)' }}>
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className={`w-full px-4 py-3 pr-12 border rounded-md transition-all duration-200 ease-out focus:outline-none focus:ring-0 ${
                      validationErrors.password 
                        ? 'border-red-400 focus:border-red-500' 
                        : 'border-gray-300 focus:border-black'
                    }`}
                    placeholder="Enter your password"
                    disabled={isSubmitting}
                    style={{ 
                      fontFamily: 'var(--font-body)',
                      backgroundColor: validationErrors.password ? '#fef2f2' : 'white'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    disabled={isSubmitting}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {validationErrors.password && (
                  <p className="mt-2 text-sm text-red-600">{validationErrors.password}</p>
                )}
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-md font-medium transition-all duration-200 ease-out focus:outline-none focus:ring-0 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  backgroundColor: isSubmitting ? 'var(--gray-500)' : 'var(--black)',
                  color: 'white',
                  fontFamily: 'var(--font-body)'
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitting) {
                    e.target.style.backgroundColor = 'var(--gray-900)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSubmitting) {
                    e.target.style.backgroundColor = 'var(--black)'
                  }
                }}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing In...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>
          </div>
          
          {/* Demo accounts info */}
          <div className="mt-8 text-center">
            <div className="inline-block px-6 py-4 rounded-lg border border-gray-200 bg-white/50 backdrop-blur-sm">
              <p className="text-xs font-medium mb-3" style={{ color: 'var(--gray-700)' }}>
                Demo Accounts
              </p>
              <div className="space-y-2 text-xs" style={{ color: 'var(--gray-500)' }}>
                <div>
                  <span className="font-medium">controller@minima.com</span>
                  <span className="block text-xs opacity-75">Inventory Controller</span>
                </div>
                <div>
                  <span className="font-medium">kitchen@minima.com</span>
                  <span className="block text-xs opacity-75">Kitchen Staff</span>
                </div>
                <div>
                  <span className="font-medium">purchasing@minima.com</span>
                  <span className="block text-xs opacity-75">Purchasing Officer</span>
                </div>
                <div className="pt-2 border-t border-gray-200 mt-3">
                  <span className="font-medium">Password:</span> password123
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}