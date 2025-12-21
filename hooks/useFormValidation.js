// Enhanced form validation hook with error handling and field highlighting
import { useState, useCallback, useRef } from 'react'
import { 
  ValidationError, 
  ValidationErrors, 
  validateRequired, 
  validateEmail, 
  validateNumber, 
  validateDate 
} from '../lib/errorHandling'

export function useFormValidation(initialValues = {}, validationRules = {}) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  
  const validationRulesRef = useRef(validationRules)
  validationRulesRef.current = validationRules

  // Validate a single field
  const validateField = useCallback((fieldName, value) => {
    const rules = validationRulesRef.current[fieldName]
    if (!rules) return null

    try {
      // Required validation
      if (rules.required) {
        validateRequired(value, rules.label || fieldName)
      }

      // Skip other validations if field is empty and not required
      if (!rules.required && (value === '' || value === null || value === undefined)) {
        return null
      }

      // Type-specific validations
      if (rules.type === 'email') {
        validateEmail(value, rules.label || fieldName)
      }

      if (rules.type === 'number') {
        validateNumber(value, rules.label || fieldName, rules.min, rules.max)
      }

      if (rules.type === 'date') {
        validateDate(value, rules.label || fieldName)
      }

      // Pattern validation (only if value is not empty)
      if (rules.pattern && value && !rules.pattern.test(value)) {
        throw new ValidationError(
          rules.patternMessage || `${rules.label || fieldName} format is invalid`,
          fieldName,
          value
        )
      }

      // Custom validation function
      if (rules.validate && typeof rules.validate === 'function') {
        const result = rules.validate(value, values)
        if (result !== true && typeof result === 'string') {
          throw new ValidationError(result, fieldName, value)
        }
      }

      return null
    } catch (error) {
      if (error instanceof ValidationError) {
        return error.message
      }
      return `Validation failed for ${rules.label || fieldName}`
    }
  }, [values])

  // Validate all fields
  const validateForm = useCallback(() => {
    const newErrors = {}
    let isValid = true

    Object.keys(validationRulesRef.current).forEach(fieldName => {
      const error = validateField(fieldName, values[fieldName])
      if (error) {
        newErrors[fieldName] = error
        isValid = false
      }
    })

    setErrors(newErrors)
    return isValid
  }, [values, validateField])

  // Handle field value change
  const handleChange = useCallback((fieldName, value) => {
    setValues(prev => ({ ...prev, [fieldName]: value }))
    
    // Clear submit error when user starts typing
    if (submitError) {
      setSubmitError(null)
    }

    // Validate field if it has been touched
    if (touched[fieldName]) {
      const error = validateField(fieldName, value)
      setErrors(prev => ({
        ...prev,
        [fieldName]: error
      }))
    }
  }, [touched, validateField, submitError])

  // Handle field blur (mark as touched and validate)
  const handleBlur = useCallback((fieldName) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }))
    
    const error = validateField(fieldName, values[fieldName])
    setErrors(prev => ({
      ...prev,
      [fieldName]: error
    }))
  }, [values, validateField])

  // Handle form submission
  const handleSubmit = useCallback(async (onSubmit) => {
    setIsSubmitting(true)
    setSubmitError(null)

    // Mark all fields as touched
    const allTouched = {}
    Object.keys(validationRulesRef.current).forEach(fieldName => {
      allTouched[fieldName] = true
    })
    setTouched(allTouched)

    // Validate form
    const isValid = validateForm()
    
    if (!isValid) {
      setIsSubmitting(false)
      return false
    }

    try {
      await onSubmit(values)
      return true
    } catch (error) {
      setSubmitError(error)
      return false
    } finally {
      setIsSubmitting(false)
    }
  }, [values, validateForm])

  // Reset form
  const reset = useCallback((newValues = initialValues) => {
    setValues(newValues)
    setErrors({})
    setTouched({})
    setIsSubmitting(false)
    setSubmitError(null)
  }, [initialValues])

  // Set field error manually
  const setFieldError = useCallback((fieldName, error) => {
    setErrors(prev => ({
      ...prev,
      [fieldName]: error
    }))
  }, [])

  // Clear field error
  const clearFieldError = useCallback((fieldName) => {
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[fieldName]
      return newErrors
    })
  }, [])

  // Get field props for easy integration with form components
  const getFieldProps = useCallback((fieldName) => {
    return {
      value: values[fieldName] || '',
      onChange: (value) => handleChange(fieldName, value),
      onBlur: () => handleBlur(fieldName),
      error: errors[fieldName],
      hasError: Boolean(errors[fieldName]),
      touched: Boolean(touched[fieldName])
    }
  }, [values, errors, touched, handleChange, handleBlur])

  // Check if form has any errors
  const hasErrors = Object.keys(errors).some(key => errors[key])

  // Check if form is dirty (has changes from initial values)
  const isDirty = Object.keys(values).some(key => values[key] !== initialValues[key])

  return {
    values,
    errors,
    touched,
    isSubmitting,
    submitError,
    hasErrors,
    isDirty,
    handleChange,
    handleBlur,
    handleSubmit,
    validateField,
    validateForm,
    reset,
    setFieldError,
    clearFieldError,
    getFieldProps
  }
}

// Predefined validation rules for common fields
export const commonValidationRules = {
  email: {
    required: true,
    type: 'email',
    label: 'Email'
  },
  
  password: {
    required: true,
    label: 'Password',
    validate: (value) => {
      if (value.length < 8) {
        return 'Password must be at least 8 characters long'
      }
      return true
    }
  },
  
  name: {
    required: true,
    label: 'Name',
    validate: (value) => {
      if (value.trim().length < 2) {
        return 'Name must be at least 2 characters long'
      }
      return true
    }
  },
  
  phone: {
    label: 'Phone Number',
    pattern: /^[\+]?[1-9][\d]{0,15}$/,
    patternMessage: 'Please enter a valid phone number'
  },
  
  quantity: {
    required: true,
    type: 'number',
    min: 0,
    label: 'Quantity'
  },
  
  price: {
    required: true,
    type: 'number',
    min: 0,
    label: 'Price'
  },
  
  date: {
    required: true,
    type: 'date',
    label: 'Date'
  },
  
  futureDate: {
    required: true,
    type: 'date',
    label: 'Date',
    validate: (value) => {
      const date = new Date(value)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (date < today) {
        return 'Date must be in the future'
      }
      return true
    }
  }
}

// Inventory-specific validation rules
export const inventoryValidationRules = {
  itemName: {
    required: true,
    label: 'Item Name',
    validate: (value) => {
      if (value.trim().length < 2) {
        return 'Item name must be at least 2 characters long'
      }
      if (value.length > 100) {
        return 'Item name must be less than 100 characters'
      }
      return true
    }
  },
  
  category: {
    required: true,
    label: 'Category'
  },
  
  location: {
    required: true,
    label: 'Location'
  },
  
  supplier: {
    required: true,
    label: 'Supplier'
  },
  
  stockLevel: {
    required: true,
    type: 'number',
    min: 0,
    label: 'Stock Level'
  },
  
  restockThreshold: {
    required: true,
    type: 'number',
    min: 1,
    label: 'Restock Threshold'
  },
  
  expirationDate: {
    type: 'date',
    label: 'Expiration Date',
    validate: (value) => {
      if (!value) return true // Optional field
      
      const date = new Date(value)
      const today = new Date()
      
      if (date <= today) {
        return 'Expiration date must be in the future'
      }
      return true
    }
  },
  
  batchNumber: {
    label: 'Batch Number',
    validate: (value) => {
      if (value && value.length > 50) {
        return 'Batch number must be less than 50 characters'
      }
      return true
    }
  }
}