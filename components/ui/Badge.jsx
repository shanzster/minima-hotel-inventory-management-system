export default function Badge({ 
  variant = 'default', 
  children,
  className = ''
}) {
  // Simplified variant styles following Japanese minimalism and clear visual hierarchy
  const variantStyles = {
    default: 'bg-gray-100 text-gray-700 border-gray-300',
    success: 'bg-gray-100 text-black border-gray-300',
    warning: 'bg-accent-sand text-gray-700 border-gray-300',
    error: 'bg-gray-100 text-gray-500 border-gray-300',
    info: 'bg-gray-100 text-gray-700 border-gray-300',
    // Legacy variants mapped to new system
    pending: 'bg-accent-sand text-gray-700 border-gray-300', // warning
    approved: 'bg-gray-100 text-black border-gray-300', // success
    'in-transit': 'bg-gray-100 text-gray-700 border-gray-300', // info
    delivered: 'bg-gray-100 text-black border-gray-300', // success
    cancelled: 'bg-gray-100 text-gray-500 border-gray-300', // error
    normal: 'bg-gray-100 text-black border-gray-300', // success
    low: 'bg-accent-sand text-gray-700 border-gray-300', // warning
    critical: 'bg-gray-100 text-gray-500 border-gray-300', // error
    excess: 'bg-gray-100 text-gray-700 border-gray-300', // info
    excellent: 'bg-gray-100 text-black border-gray-300', // success
    good: 'bg-gray-100 text-gray-700 border-gray-300', // info
    fair: 'bg-accent-sand text-gray-700 border-gray-300', // warning
    poor: 'bg-gray-100 text-gray-500 border-gray-300', // error
    'stock-in': 'bg-gray-100 text-black border-gray-300', // success
    'stock-out': 'bg-gray-100 text-gray-700 border-gray-300', // info
    adjustment: 'bg-accent-sand text-gray-700 border-gray-300', // warning
    completed: 'bg-gray-100 text-black border-gray-300', // success
    'pending-approval': 'bg-accent-sand text-gray-700 border-gray-300' // warning
  }
  
  return (
    <span 
      className={`
        inline-flex items-center px-2 py-1 rounded-sm text-xs font-body
        border transition-all duration-200 ease-out
        ${variantStyles[variant] || variantStyles.default}
        ${className}
      `}
    >
      {children}
    </span>
  )
}