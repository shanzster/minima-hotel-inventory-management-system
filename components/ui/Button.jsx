export default function Button({ 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
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
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  )
}