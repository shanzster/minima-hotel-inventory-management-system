import { useState } from 'react'
import Button from '../ui/Button'
import Badge from '../ui/Badge'

export default function AlertBanner({ 
  type = 'info', 
  message, 
  items = [], 
  onAcknowledge, 
  onAction,
  actionLabel = 'Take Action',
  dismissible = true,
  className = ''
}) {
  const [isDismissed, setIsDismissed] = useState(false)
  
  if (isDismissed) return null
  
  const handleAcknowledge = () => {
    if (onAcknowledge) {
      onAcknowledge()
    }
    if (dismissible) {
      setIsDismissed(true)
    }
  }
  
  const getAlertStyles = () => {
    const baseStyles = 'border-l-4 transition-all duration-200 ease-out'
    
    // Using approved Japanese minimalism color palette
    switch (type) {
      case 'low-stock':
      case 'warning':
        return `${baseStyles} bg-accent-sand border-gray-500 text-gray-900`
      case 'critical-stock':
      case 'error':
        return `${baseStyles} bg-gray-100 border-gray-700 text-gray-900`
      case 'excess-stock':
      case 'maintenance-due':
      case 'audit-required':
        return `${baseStyles} bg-gray-50 border-gray-500 text-gray-900`
      case 'success':
        return `${baseStyles} bg-gray-100 border-gray-500 text-gray-900`
      case 'info':
      default:
        return `${baseStyles} bg-gray-50 border-gray-300 text-gray-900`
    }
  }
  
  const getIcon = () => {
    // Using subtle SVG icons instead of emojis for minimalist aesthetic
    const iconClass = "w-4 h-4 text-gray-700"
    
    switch (type) {
      case 'low-stock':
      case 'critical-stock':
      case 'warning':
      case 'error':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        )
      case 'excess-stock':
      case 'maintenance-due':
      case 'audit-required':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'success':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'info':
      default:
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
    }
  }
  
  const getAlertTitle = () => {
    switch (type) {
      case 'low-stock': return 'Low Stock Alert'
      case 'critical-stock': return 'Critical Stock Alert'
      case 'excess-stock': return 'Excess Stock Alert'
      case 'maintenance-due': return 'Maintenance Due'
      case 'audit-required': return 'Audit Required'
      case 'success': return 'Success'
      case 'warning': return 'Warning'
      case 'error': return 'Error'
      case 'info': return 'Information'
      default: return 'Alert'
    }
  }
  
  return (
    <div className={`alert-banner ${getAlertStyles()} p-6 rounded-md ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className="flex-shrink-0 mt-0.5">
            {getIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="font-heading font-medium text-sm">
                {getAlertTitle()}
              </h4>
              
              {items.length > 0 && (
                <Badge variant="default" className="text-xs">
                  {items.length} item{items.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            
            <p className="alert-message text-sm font-body mb-2">
              {message}
            </p>
            
            {items.length > 0 && (
              <div className="alert-items">
                <ul className="text-xs space-y-1">
                  {items.slice(0, 5).map((item, index) => (
                    <li key={`${item.id || 'item'}-${index}`} className="flex items-center justify-between">
                      <span className="truncate">{item.name}</span>
                      {item.currentStock !== undefined && (
                        <span className="ml-2 text-gray-600">
                          Stock: {item.currentStock}
                        </span>
                      )}
                    </li>
                  ))}
                  {items.length > 5 && (
                    <li key="more-items" className="text-gray-600 italic">
                      ...and {items.length - 5} more items
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
        
        <div className="alert-actions flex items-center space-x-2 ml-4">
          {onAction && (
            <Button
              variant="primary"
              size="sm"
              onClick={onAction}
            >
              {actionLabel}
            </Button>
          )}
          
          {(onAcknowledge || dismissible) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAcknowledge}
            >
              {onAcknowledge ? 'Acknowledge' : 'Dismiss'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}