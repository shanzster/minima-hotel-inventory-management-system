export default function Button({ 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  isLoading = false,
  onClick, 
  children,
  className = '',
  type = 'button',
  ...props
}) {
  // Variant styles following Japanese minimalism design principles
  const variantStyles = {
    primary: 'bg-black text-white hover:bg-gray-900 disabled:bg-gray-300 disabled:cursor-not-allowed',
    secondary: 'bg-white text-black border border-gray-300 hover:border-black disabled:border-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed',
    ghost: 'bg-transparent text-black hover:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed'
  }
  
  // Size styles following 8px grid spacing system
  const sizeStyles = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-5 py-3 text-base',
    lg: 'px-6 py-4 text-lg'
  }
  
  const buttonClasses = [
    'font-body',
    'rounded-sm',
    'transition-all',
    'duration-200',
    'ease-out',
    variantStyles[variant],
    sizeStyles[size],
    className
  ].filter(Boolean).join(' ')
  
  return (
    <button 
      type={type}
      className={buttonClasses}
      disabled={disabled || isLoading}
      onClick={onClick}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {children}
        </span>
      ) : children}
    </button>
  )
}