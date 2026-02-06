import { useEffect } from 'react'
import Button from './Button'

export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  className = '',
  centered = false
}) {
  // Size variants following design system
  const sizeStyles = {
    sm: 'max-w-md',
    md: 'max-w-lg', 
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-none w-full h-full max-h-none m-0 rounded-none lg:max-w-[80vw] lg:max-h-[90vh] lg:m-4 lg:rounded-lg'
  }
  
  // Handle escape key press
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])
  
  if (!isOpen) return null
  
  return (
    <div 
      className={`fixed inset-0 z-50 flex ${centered ? 'items-center' : 'items-start'} justify-center overflow-y-auto ${
        size === 'full' ? 'p-0 lg:p-4' : 'p-4'
      }`}
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
    >
      {/* Overlay */}
      <div 
        className="absolute inset-0" 
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div 
        className={`
          relative bg-white shadow-lg w-full flex flex-col
          ${size === 'full' ? 'h-full lg:my-8 lg:max-h-[90vh] lg:rounded-lg' : 'rounded-md max-h-[90vh]'}
          ${centered ? '' : 'my-8'}
          ${sizeStyles[size]}
          ${className}
        `}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-gray-300 flex-shrink-0">
            <h3 id="modal-title" className="text-lg font-heading font-medium text-black">
              {title}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-2 hover:bg-gray-100"
              aria-label="Close modal"
            >
              ×
            </Button>
          </div>
        )}
        
        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  )
}