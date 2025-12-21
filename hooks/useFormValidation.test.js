// Unit tests for useFormValidation hook
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFormValidation, commonValidationRules, inventoryValidationRules } from './useFormValidation'

describe('useFormValidation', () => {
  const initialValues = {
    email: '',
    password: '',
    name: ''
  }

  const validationRules = {
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
      label: 'Name'
    }
  }

  it('initializes with provided values', () => {
    const { result } = renderHook(() => 
      useFormValidation(initialValues, validationRules)
    )

    expect(result.current.values).toEqual(initialValues)
    expect(result.current.errors).toEqual({})
    expect(result.current.touched).toEqual({})
    expect(result.current.isSubmitting).toBe(false)
    expect(result.current.hasErrors).toBe(false)
    expect(result.current.isDirty).toBe(false)
  })

  it('handles field value changes', () => {
    const { result } = renderHook(() => 
      useFormValidation(initialValues, validationRules)
    )

    act(() => {
      result.current.handleChange('email', 'test@example.com')
    })

    expect(result.current.values.email).toBe('test@example.com')
    expect(result.current.isDirty).toBe(true)
  })

  it('validates field on blur', () => {
    const { result } = renderHook(() => 
      useFormValidation(initialValues, validationRules)
    )

    act(() => {
      result.current.handleBlur('email')
    })

    expect(result.current.touched.email).toBe(true)
    expect(result.current.errors.email).toBe('Email is required')
  })

  it('validates field after change when touched', () => {
    const { result } = renderHook(() => 
      useFormValidation(initialValues, validationRules)
    )

    // First blur to mark as touched
    act(() => {
      result.current.handleBlur('email')
    })

    // Then change value
    act(() => {
      result.current.handleChange('email', 'invalid-email')
    })

    expect(result.current.errors.email).toBe('Email must be a valid email address')
  })

  it('clears validation errors when valid value is entered', () => {
    const { result } = renderHook(() => 
      useFormValidation(initialValues, validationRules)
    )

    // Mark as touched and set invalid value
    act(() => {
      result.current.handleBlur('email')
      result.current.handleChange('email', 'invalid')
    })

    expect(result.current.errors.email).toBeTruthy()

    // Set valid value
    act(() => {
      result.current.handleChange('email', 'test@example.com')
    })

    expect(result.current.errors.email).toBeNull()
  })

  it('validates entire form', () => {
    const { result } = renderHook(() => 
      useFormValidation(initialValues, validationRules)
    )

    act(() => {
      const isValid = result.current.validateForm()
      expect(isValid).toBe(false)
    })

    expect(result.current.errors.email).toBe('Email is required')
    expect(result.current.errors.password).toBe('Password is required')
    expect(result.current.errors.name).toBe('Name is required')
  })

  it('handles form submission with validation', async () => {
    const onSubmit = vi.fn().mockResolvedValue()
    const { result } = renderHook(() => 
      useFormValidation(initialValues, validationRules)
    )

    // Submit invalid form
    let submitResult
    await act(async () => {
      submitResult = await result.current.handleSubmit(onSubmit)
    })

    expect(submitResult).toBe(false)
    expect(onSubmit).not.toHaveBeenCalled()
    expect(result.current.hasErrors).toBe(true)

    // Fill valid values
    act(() => {
      result.current.handleChange('email', 'test@example.com')
      result.current.handleChange('password', 'password123')
      result.current.handleChange('name', 'John Doe')
    })

    // Submit valid form
    await act(async () => {
      submitResult = await result.current.handleSubmit(onSubmit)
    })

    expect(submitResult).toBe(true)
    expect(onSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
      name: 'John Doe'
    })
  })

  it('handles submission errors', async () => {
    const submitError = new Error('Submission failed')
    const onSubmit = vi.fn().mockRejectedValue(submitError)
    
    const { result } = renderHook(() => 
      useFormValidation(initialValues, validationRules)
    )

    // Fill valid values
    act(() => {
      result.current.handleChange('email', 'test@example.com')
      result.current.handleChange('password', 'password123')
      result.current.handleChange('name', 'John Doe')
    })

    let submitResult
    await act(async () => {
      submitResult = await result.current.handleSubmit(onSubmit)
    })

    expect(submitResult).toBe(false)
    expect(result.current.submitError).toBe(submitError)
    expect(result.current.isSubmitting).toBe(false)
  })

  it('resets form to initial state', () => {
    const { result } = renderHook(() => 
      useFormValidation(initialValues, validationRules)
    )

    // Make changes
    act(() => {
      result.current.handleChange('email', 'test@example.com')
      result.current.handleBlur('email')
      result.current.setFieldError('name', 'Custom error')
    })

    expect(result.current.values.email).toBe('test@example.com')
    expect(result.current.touched.email).toBe(true)
    expect(result.current.errors.name).toBe('Custom error')

    // Reset
    act(() => {
      result.current.reset()
    })

    expect(result.current.values).toEqual(initialValues)
    expect(result.current.errors).toEqual({})
    expect(result.current.touched).toEqual({})
  })

  it('resets form with new values', () => {
    const newValues = { email: 'new@example.com', password: '', name: '' }
    const { result } = renderHook(() => 
      useFormValidation(initialValues, validationRules)
    )

    act(() => {
      result.current.reset(newValues)
    })

    expect(result.current.values).toEqual(newValues)
  })

  it('manages field errors manually', () => {
    const { result } = renderHook(() => 
      useFormValidation(initialValues, validationRules)
    )

    act(() => {
      result.current.setFieldError('email', 'Custom error')
    })

    expect(result.current.errors.email).toBe('Custom error')

    act(() => {
      result.current.clearFieldError('email')
    })

    expect(result.current.errors.email).toBeUndefined()
  })

  it('provides field props for easy integration', () => {
    const { result } = renderHook(() => 
      useFormValidation(initialValues, validationRules)
    )

    const emailProps = result.current.getFieldProps('email')

    expect(emailProps).toEqual({
      value: '',
      onChange: expect.any(Function),
      onBlur: expect.any(Function),
      error: undefined,
      hasError: false,
      touched: false
    })

    // Test onChange
    act(() => {
      emailProps.onChange('test@example.com')
    })

    expect(result.current.values.email).toBe('test@example.com')

    // Test onBlur
    act(() => {
      emailProps.onBlur()
    })

    expect(result.current.touched.email).toBe(true)
  })

  it('validates custom validation functions', () => {
    const customRules = {
      password: {
        required: true,
        label: 'Password',
        validate: (value) => {
          if (value.length < 8) {
            return 'Password must be at least 8 characters long'
          }
          return true
        }
      }
    }

    const { result } = renderHook(() => 
      useFormValidation({ password: '' }, customRules)
    )

    // First blur to mark as touched - this will trigger required validation first
    act(() => {
      result.current.handleBlur('password')
    })

    // Should show required error first
    expect(result.current.errors.password).toBe('Password is required')

    // Now set a short password
    act(() => {
      result.current.handleChange('password', 'short')
    })

    // Should now show custom validation error
    expect(result.current.errors.password).toBe('Password must be at least 8 characters long')

    act(() => {
      result.current.handleChange('password', 'longenough')
    })

    expect(result.current.errors.password).toBeNull()
  })

  it('validates pattern matching', () => {
    const phoneRules = {
      phone: {
        required: false, // Make it optional so we test pattern validation
        pattern: /^[\+]?[1-9][\d]{0,15}$/,
        patternMessage: 'Invalid phone number',
        label: 'Phone'
      }
    }

    const { result } = renderHook(() => 
      useFormValidation({ phone: '' }, phoneRules)
    )

    // Set invalid phone and mark as touched
    act(() => {
      result.current.handleChange('phone', 'invalid-phone')
    })
    
    act(() => {
      result.current.handleBlur('phone')
    })

    expect(result.current.errors.phone).toBe('Invalid phone number')

    act(() => {
      result.current.handleChange('phone', '+1234567890')
    })

    expect(result.current.errors.phone).toBeNull()
  })

  it('clears submit error when user starts typing', async () => {
    const { result } = renderHook(() => 
      useFormValidation(initialValues, validationRules)
    )

    // Fill valid values first
    act(() => {
      result.current.handleChange('email', 'test@example.com')
      result.current.handleChange('password', 'password123')
      result.current.handleChange('name', 'John Doe')
    })

    // Set submit error by calling handleSubmit with failing function
    await act(async () => {
      await result.current.handleSubmit(vi.fn().mockRejectedValue(new Error('Submit error')))
    })

    expect(result.current.submitError).toBeTruthy()

    // Start typing
    act(() => {
      result.current.handleChange('email', 'test2@example.com')
    })

    expect(result.current.submitError).toBeNull()
  })
})

describe('Common Validation Rules', () => {
  it('provides email validation rule', () => {
    const rule = commonValidationRules.email
    
    expect(rule.required).toBe(true)
    expect(rule.type).toBe('email')
    expect(rule.label).toBe('Email')
  })

  it('provides password validation rule', () => {
    const rule = commonValidationRules.password
    
    expect(rule.required).toBe(true)
    expect(rule.label).toBe('Password')
    expect(rule.validate('short')).toBe('Password must be at least 8 characters long')
    expect(rule.validate('longenough')).toBe(true)
  })

  it('provides quantity validation rule', () => {
    const rule = commonValidationRules.quantity
    
    expect(rule.required).toBe(true)
    expect(rule.type).toBe('number')
    expect(rule.min).toBe(0)
    expect(rule.label).toBe('Quantity')
  })

  it('provides future date validation rule', () => {
    const rule = commonValidationRules.futureDate
    
    expect(rule.required).toBe(true)
    expect(rule.type).toBe('date')
    
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    expect(rule.validate(yesterday.toISOString())).toBe('Date must be in the future')
    expect(rule.validate(tomorrow.toISOString())).toBe(true)
  })
})

describe('Inventory Validation Rules', () => {
  it('provides item name validation rule', () => {
    const rule = inventoryValidationRules.itemName
    
    expect(rule.required).toBe(true)
    expect(rule.label).toBe('Item Name')
    expect(rule.validate('a')).toBe('Item name must be at least 2 characters long')
    expect(rule.validate('a'.repeat(101))).toBe('Item name must be less than 100 characters')
    expect(rule.validate('Valid Name')).toBe(true)
  })

  it('provides stock level validation rule', () => {
    const rule = inventoryValidationRules.stockLevel
    
    expect(rule.required).toBe(true)
    expect(rule.type).toBe('number')
    expect(rule.min).toBe(0)
    expect(rule.label).toBe('Stock Level')
  })

  it('provides expiration date validation rule', () => {
    const rule = inventoryValidationRules.expirationDate
    
    expect(rule.type).toBe('date')
    expect(rule.label).toBe('Expiration Date')
    
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    expect(rule.validate('')).toBe(true) // Optional field
    expect(rule.validate(yesterday.toISOString())).toBe('Expiration date must be in the future')
    expect(rule.validate(tomorrow.toISOString())).toBe(true)
  })

  it('provides batch number validation rule', () => {
    const rule = inventoryValidationRules.batchNumber
    
    expect(rule.label).toBe('Batch Number')
    expect(rule.validate('')).toBe(true) // Optional field
    expect(rule.validate('a'.repeat(51))).toBe('Batch number must be less than 50 characters')
    expect(rule.validate('BATCH123')).toBe(true)
  })
})