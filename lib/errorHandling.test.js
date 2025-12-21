// Unit tests for error handling utilities
import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  classifyError,
  getUserFriendlyMessage,
  getRecoveryStrategy,
  ValidationError,
  ValidationErrors,
  validateRequired,
  validateEmail,
  validateNumber,
  validateDate,
  DataConflictError,
  resolveStockConflict,
  handleAuthenticationError,
  retryWithBackoff,
  ERROR_TYPES,
  ERROR_SEVERITY,
  RECOVERY_STRATEGIES,
  CONFLICT_RESOLUTION_STRATEGIES
} from './errorHandling'
import { APIError } from './api'

describe('Error Classification', () => {
  it('classifies network errors correctly', () => {
    const networkError = new TypeError('fetch failed')
    const classification = classifyError(networkError)
    
    expect(classification.type).toBe(ERROR_TYPES.NETWORK)
    expect(classification.severity).toBe(ERROR_SEVERITY.HIGH)
  })

  it('classifies timeout errors correctly', () => {
    const timeoutError = new Error('Request timeout')
    const classification = classifyError(timeoutError)
    
    expect(classification.type).toBe(ERROR_TYPES.NETWORK)
    expect(classification.severity).toBe(ERROR_SEVERITY.MEDIUM)
  })

  it('classifies authentication errors correctly', () => {
    const authError = new APIError('Unauthorized', 401)
    const classification = classifyError(authError)
    
    expect(classification.type).toBe(ERROR_TYPES.AUTHENTICATION)
    expect(classification.severity).toBe(ERROR_SEVERITY.CRITICAL)
  })

  it('classifies authorization errors correctly', () => {
    const authzError = new APIError('Forbidden', 403)
    const classification = classifyError(authzError)
    
    expect(classification.type).toBe(ERROR_TYPES.AUTHORIZATION)
    expect(classification.severity).toBe(ERROR_SEVERITY.HIGH)
  })

  it('classifies not found errors correctly', () => {
    const notFoundError = new APIError('Not Found', 404)
    const classification = classifyError(notFoundError)
    
    expect(classification.type).toBe(ERROR_TYPES.NOT_FOUND)
    expect(classification.severity).toBe(ERROR_SEVERITY.MEDIUM)
  })

  it('classifies data consistency errors correctly', () => {
    const conflictError = new APIError('Conflict', 409)
    const classification = classifyError(conflictError)
    
    expect(classification.type).toBe(ERROR_TYPES.DATA_CONSISTENCY)
    expect(classification.severity).toBe(ERROR_SEVERITY.HIGH)
  })

  it('classifies validation errors correctly', () => {
    const validationError = new ValidationError('Invalid input', 'field')
    const classification = classifyError(validationError)
    
    expect(classification.type).toBe(ERROR_TYPES.VALIDATION)
    expect(classification.severity).toBe(ERROR_SEVERITY.MEDIUM)
  })

  it('classifies server errors correctly', () => {
    const serverError = new APIError('Internal Server Error', 500)
    const classification = classifyError(serverError)
    
    expect(classification.type).toBe(ERROR_TYPES.SERVER)
    expect(classification.severity).toBe(ERROR_SEVERITY.HIGH)
  })

  it('classifies unknown errors correctly', () => {
    const unknownError = new Error('Something went wrong')
    const classification = classifyError(unknownError)
    
    expect(classification.type).toBe(ERROR_TYPES.UNKNOWN)
    expect(classification.severity).toBe(ERROR_SEVERITY.MEDIUM)
  })
})

describe('User-Friendly Messages', () => {
  it('provides friendly message for network errors', () => {
    const networkError = new TypeError('fetch failed')
    const message = getUserFriendlyMessage(networkError)
    
    expect(message).toContain('connect')
    expect(message).toContain('internet')
  })

  it('provides friendly message for authentication errors', () => {
    const authError = new APIError('Unauthorized', 401)
    const message = getUserFriendlyMessage(authError)
    
    expect(message).toContain('session')
    expect(message).toContain('log in')
  })

  it('provides friendly message for validation errors', () => {
    const validationError = new ValidationError('Invalid input')
    const message = getUserFriendlyMessage(validationError)
    
    expect(message).toContain('form')
    expect(message).toContain('correct')
  })
})

describe('Recovery Strategies', () => {
  it('suggests redirect for authentication errors', () => {
    const authError = new APIError('Unauthorized', 401)
    const strategy = getRecoveryStrategy(authError)
    
    expect(strategy).toBe(RECOVERY_STRATEGIES.REDIRECT)
  })

  it('suggests retry for network errors', () => {
    const networkError = new TypeError('fetch failed')
    const strategy = getRecoveryStrategy(networkError)
    
    expect(strategy).toBe(RECOVERY_STRATEGIES.RETRY)
  })

  it('suggests refresh for data consistency errors', () => {
    const conflictError = new APIError('Conflict', 409)
    const strategy = getRecoveryStrategy(conflictError)
    
    expect(strategy).toBe(RECOVERY_STRATEGIES.REFRESH)
  })

  it('suggests manual intervention for unknown errors', () => {
    const unknownError = new Error('Something went wrong')
    const strategy = getRecoveryStrategy(unknownError)
    
    expect(strategy).toBe(RECOVERY_STRATEGIES.MANUAL)
  })
})

describe('Validation Utilities', () => {
  describe('validateRequired', () => {
    it('passes for non-empty values', () => {
      expect(() => validateRequired('value', 'Field')).not.toThrow()
      expect(() => validateRequired(0, 'Field')).not.toThrow()
      expect(() => validateRequired(false, 'Field')).not.toThrow()
    })

    it('throws for empty values', () => {
      expect(() => validateRequired('', 'Field')).toThrow(ValidationError)
      expect(() => validateRequired(null, 'Field')).toThrow(ValidationError)
      expect(() => validateRequired(undefined, 'Field')).toThrow(ValidationError)
    })

    it('includes field name in error message', () => {
      try {
        validateRequired('', 'Username')
      } catch (error) {
        expect(error.message).toContain('Username')
        expect(error.field).toBe('Username')
      }
    })
  })

  describe('validateEmail', () => {
    it('passes for valid email addresses', () => {
      expect(() => validateEmail('test@example.com')).not.toThrow()
      expect(() => validateEmail('user.name+tag@example.co.uk')).not.toThrow()
    })

    it('throws for invalid email addresses', () => {
      expect(() => validateEmail('invalid')).toThrow(ValidationError)
      expect(() => validateEmail('invalid@')).toThrow(ValidationError)
      expect(() => validateEmail('@example.com')).toThrow(ValidationError)
      expect(() => validateEmail('invalid@example')).toThrow(ValidationError)
    })
  })

  describe('validateNumber', () => {
    it('passes for valid numbers', () => {
      expect(() => validateNumber(5, 'Age')).not.toThrow()
      expect(() => validateNumber('10', 'Count')).not.toThrow()
      expect(() => validateNumber(0, 'Zero')).not.toThrow()
    })

    it('throws for non-numeric values', () => {
      expect(() => validateNumber('abc', 'Field')).toThrow(ValidationError)
      expect(() => validateNumber('', 'Field')).toThrow(ValidationError)
    })

    it('validates minimum value', () => {
      expect(() => validateNumber(5, 'Age', 0)).not.toThrow()
      expect(() => validateNumber(-1, 'Age', 0)).toThrow(ValidationError)
    })

    it('validates maximum value', () => {
      expect(() => validateNumber(5, 'Age', 0, 10)).not.toThrow()
      expect(() => validateNumber(15, 'Age', 0, 10)).toThrow(ValidationError)
    })
  })

  describe('validateDate', () => {
    it('passes for valid dates', () => {
      expect(() => validateDate('2024-01-01', 'Date')).not.toThrow()
      expect(() => validateDate(new Date(), 'Date')).not.toThrow()
    })

    it('throws for invalid dates', () => {
      expect(() => validateDate('invalid', 'Date')).toThrow(ValidationError)
      expect(() => validateDate('2024-13-01', 'Date')).toThrow(ValidationError)
    })
  })
})

describe('ValidationErrors', () => {
  it('creates validation errors collection', () => {
    const errors = new ValidationErrors({
      email: 'Invalid email',
      password: 'Password too short'
    })
    
    expect(errors.hasErrors()).toBe(true)
    expect(errors.hasError('email')).toBe(true)
    expect(errors.getError('email')).toBe('Invalid email')
  })

  it('adds and removes errors', () => {
    const errors = new ValidationErrors()
    
    expect(errors.hasErrors()).toBe(false)
    
    errors.addError('field', 'Error message')
    expect(errors.hasErrors()).toBe(true)
    expect(errors.hasError('field')).toBe(true)
    
    errors.removeError('field')
    expect(errors.hasErrors()).toBe(false)
  })

  it('returns fields with errors', () => {
    const errors = new ValidationErrors({
      email: 'Invalid email',
      password: 'Password too short'
    })
    
    const fields = errors.getFieldsWithErrors()
    expect(fields).toContain('email')
    expect(fields).toContain('password')
    expect(fields.length).toBe(2)
  })
})

describe('Data Conflict Resolution', () => {
  it('uses last write wins for minor discrepancies', () => {
    const resolution = resolveStockConflict(100, 103, [])
    
    expect(resolution.strategy).toBe(CONFLICT_RESOLUTION_STRATEGIES.LAST_WRITE_WINS)
    expect(resolution.resolvedValue).toBe(103)
    expect(resolution.requiresApproval).toBe(false)
  })

  it('requires manual resolution for significant discrepancies', () => {
    const resolution = resolveStockConflict(100, 115, [])
    
    expect(resolution.strategy).toBe(CONFLICT_RESOLUTION_STRATEGIES.MANUAL_RESOLUTION)
    expect(resolution.resolvedValue).toBeNull()
    expect(resolution.requiresApproval).toBe(true)
  })

  it('requires audit for critical discrepancies', () => {
    const resolution = resolveStockConflict(100, 150, [])
    
    expect(resolution.strategy).toBe(CONFLICT_RESOLUTION_STRATEGIES.AUDIT_REQUIRED)
    expect(resolution.resolvedValue).toBeNull()
    expect(resolution.requiresApproval).toBe(true)
    expect(resolution.requiresAudit).toBe(true)
  })

  it('includes conflict data in resolution', () => {
    const updates = [{ type: 'stock-in', quantity: 10 }]
    const resolution = resolveStockConflict(100, 115, updates)
    
    expect(resolution.conflictData).toBeDefined()
    expect(resolution.conflictData.expectedStock).toBe(100)
    expect(resolution.conflictData.actualStock).toBe(115)
    expect(resolution.conflictData.concurrentUpdates).toEqual(updates)
  })
})

describe('Authentication Error Handling', () => {
  beforeEach(() => {
    // Mock localStorage
    global.localStorage = {
      removeItem: vi.fn(),
      getItem: vi.fn(),
      setItem: vi.fn(),
      clear: vi.fn()
    }
    
    // Mock sessionStorage
    global.sessionStorage = {
      clear: vi.fn()
    }
  })

  it('clears session for authentication errors', () => {
    const authError = new APIError('Unauthorized', 401)
    const result = handleAuthenticationError(authError)
    
    expect(result).toBe(true)
    expect(localStorage.removeItem).toHaveBeenCalledWith('currentUser')
    expect(sessionStorage.clear).toHaveBeenCalled()
  })

  it('does not clear session for non-authentication errors', () => {
    const otherError = new Error('Some error')
    const result = handleAuthenticationError(otherError)
    
    expect(result).toBe(false)
    expect(localStorage.removeItem).not.toHaveBeenCalled()
  })
})

describe('Retry with Backoff', () => {
  it('succeeds on first attempt', async () => {
    const operation = vi.fn().mockResolvedValue('success')
    
    const result = await retryWithBackoff(operation, 3, 100)
    
    expect(result).toBe('success')
    expect(operation).toHaveBeenCalledTimes(1)
  })

  it('retries on network errors', async () => {
    const operation = vi.fn()
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockResolvedValue('success')
    
    const result = await retryWithBackoff(operation, 3, 100)
    
    expect(result).toBe('success')
    expect(operation).toHaveBeenCalledTimes(2)
  })

  it('does not retry validation errors', async () => {
    const validationError = new ValidationError('Invalid input')
    const operation = vi.fn().mockRejectedValue(validationError)
    
    await expect(retryWithBackoff(operation, 3, 100)).rejects.toThrow(ValidationError)
    expect(operation).toHaveBeenCalledTimes(1)
  })

  it('stops after max retries', async () => {
    const operation = vi.fn().mockRejectedValue(new TypeError('fetch failed'))
    
    await expect(retryWithBackoff(operation, 3, 100)).rejects.toThrow()
    expect(operation).toHaveBeenCalledTimes(4) // Initial + 3 retries
  })
})

describe('DataConflictError', () => {
  it('creates conflict error with version info', () => {
    const error = new DataConflictError('Conflict', 100, 105, { updates: [] })
    
    expect(error.name).toBe('DataConflictError')
    expect(error.expectedVersion).toBe(100)
    expect(error.actualVersion).toBe(105)
    expect(error.conflictData).toBeDefined()
  })
})