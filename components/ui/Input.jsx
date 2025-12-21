// Enhanced Input component with comprehensive error handling and validation
import React from 'react'

export default function Input({ 
  type = 'text', 
  value, 
  onChange, 
  onBlur,
  placeholder, 
  required = false, 
  options = [],
  className = '',
  error = '',
  hasError = false,
  touched = false,
  label = '',
  helpText = '',
  disabled = false,
  loading = false,
  ...props
}) {
  // Enhanced error detection
  const showError = (error || hasError) && touched
  
  // Base styles following design system with enhanced error states
  const baseStyles = `
    font-body border rounded-sm px-3 py-2 w-full
    focus:outline-none transition-all duration-200 ease-out
    ${disabled ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}
    ${loading ? 'bg-gray-50' : ''}
    ${showError 
      ? 'border-red-500 focus:border-red-600 bg-red-50' 
      : 'border-gray-300 focus:border-black'
    }
  `

  const handleChange = (newValue) => {
    if (onChange && !disabled && !loading) {
      onChange(newValue)
    }
  }

  const handleBlur = (e) => {
    if (onBlur && !disabled) {
      onBlur(e)
    }
  }

  const renderInput = () => {
    if (type === 'select') {
      return (
        <select 
          value={value || ''} 
          onChange={(e) => handleChange(e.target.value)} 
          onBlur={handleBlur}
          required={required}
          disabled={disabled || loading}
          className={`${baseStyles} ${className}`}
          {...props}
        >
          <option value="" disabled>
            {placeholder || 'Select an option...'}
          </option>
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )
    }

    if (type === 'textarea') {
      return (
        <textarea
          value={value || ''}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          placeholder={placeholder}
          required={required}
          disabled={disabled || loading}
          className={`${baseStyles} ${className} min-h-[80px] resize-y`}
          {...props}
        />
      )
    }
    
    return (
      <input
        type={type}
        value={value || ''}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        placeholder={placeholder}
        required={required}
        disabled={disabled || loading}
        className={`${baseStyles} ${className}`}
        {...props}
      />
    )
  }

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-body text-black mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {renderInput()}
        
        {/* Loading indicator */}
        {loading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
          </div>
        )}
      </div>
      
      {/* Error message with icon */}
      {showError && error && (
        <div className="mt-1 flex items-center text-sm text-red-600">
          <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}
      
      {/* Help text (only show when no error) */}
      {helpText && !showError && (
        <div className="mt-1 text-sm text-gray-500">
          {helpText}
        </div>
      )}
    </div>
  )
}

// Specialized input components for common use cases
export function NumberInput({ min, max, step = 1, ...props }) {
  return (
    <Input
      type="number"
      min={min}
      max={max}
      step={step}
      {...props}
    />
  )
}

export function EmailInput(props) {
  return (
    <Input
      type="email"
      placeholder="Enter email address"
      {...props}
    />
  )
}

export function PasswordInput(props) {
  return (
    <Input
      type="password"
      placeholder="Enter password"
      {...props}
    />
  )
}

export function DateInput(props) {
  return (
    <Input
      type="date"
      {...props}
    />
  )
}

export function SearchInput({ onSearch, debounceMs = 300, ...props }) {
  const [searchValue, setSearchValue] = React.useState(props.value || '')
  const timeoutRef = React.useRef(null)

  React.useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      if (onSearch) {
        onSearch(searchValue)
      }
    }, debounceMs)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [searchValue, onSearch, debounceMs])

  return (
    <div className="relative">
      <Input
        type="text"
        value={searchValue}
        onChange={setSearchValue}
        placeholder="Search..."
        className="pl-10"
        {...props}
      />
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
    </div>
  )
}