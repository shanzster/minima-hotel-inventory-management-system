'use client'

import { usePageTitle } from '../../hooks/usePageTitle'

export default function PageContainer({ 
  children, 
  title,
  subtitle,
  actions,
  className = '',
  maxWidth = '7xl',
  padding = true,
  background = 'whitesmoke'
}) {
  const { setTitle } = usePageTitle()

  // Set page title if provided
  if (title && setTitle) {
    setTitle(title)
  }

  const maxWidthClasses = {
    'sm': 'max-w-sm',
    'md': 'max-w-md',
    'lg': 'max-w-lg',
    'xl': 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    'full': 'max-w-full'
  }

  const backgroundClasses = {
    'white': 'bg-white',
    'whitesmoke': 'bg-whitesmoke',
    'gray-50': 'bg-gray-50',
    'transparent': 'bg-transparent'
  }

  return (
    <div className={`min-h-full ${backgroundClasses[background]} ${className}`}>
      <div className={`${maxWidthClasses[maxWidth]} mx-auto ${padding ? 'px-4 sm:px-6 lg:px-8' : ''}`}>
        {/* Page Header */}
        {(title || subtitle || actions) && (
          <div className={`${padding ? 'py-6 sm:py-8' : 'py-6'} border-b border-gray-200 bg-white`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex-1 min-w-0">
                {title && (
                  <h1 className="text-2xl sm:text-3xl font-heading font-medium text-black truncate">
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="mt-2 text-sm sm:text-base text-gray-600">
                    {subtitle}
                  </p>
                )}
              </div>
              
              {actions && (
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                  {actions}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Page Content */}
        <div className={`${padding ? 'py-6 sm:py-8' : ''}`}>
          {children}
        </div>
      </div>
    </div>
  )
}