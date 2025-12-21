// Comprehensive error handling utilities for Minima Hotel Inventory System
import { APIError } from './api.js'

// Error types for classification
export const ERROR_TYPES = {
  NETWORK: 'network',
  VALIDATION: 'validation',
  AUTHENTICATION: 'authentication',
  AUTHORIZATION: 'authorization',
  DATA_CONSISTENCY: 'data_consistency',
  NOT_FOUND: 'not_found',
  SERVER: 'server',
  UNKNOWN: 'unknown'
}

// Error severity levels
export const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
}

// Error classification function
export function classifyError(error) {
  if (!error) {
    return { type: ERROR_TYPES.UNKNOWN, severity: ERROR_SEVERITY.LOW }
  }

  // Network errors
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return { type: ERROR_TYPES.NETWORK, severity: ERROR_SEVERITY.HIGH }
  }
  
  if (error.message === 'Request timeout') {
    return { type: ERROR_TYPES.NETWORK, severity: ERROR_SEVERITY.MEDIUM }
  }

  // API errors
  if (error instanceof APIError) {
    if (error.status === 401) {
      return { type: ERROR_TYPES.AUTHENTICATION, severity: ERROR_SEVERITY.CRITICAL }
    }
    if (error.status === 403) {
      return { type: ERROR_TYPES.AUTHORIZATION, severity: ERROR_SEVERITY.HIGH }
    }
    if (error.status === 404) {
      return { type: ERROR_TYPES.NOT_FOUND, severity: ERROR_SEVERITY.MEDIUM }
    }
    if (error.status === 409) {
      return { type: ERROR_TYPES.DATA_CONSISTENCY, severity: ERROR_SEVERITY.HIGH }
    }
    if (error.status >= 400 && error.status < 500) {
      return { type: ERROR_TYPES.VALIDATION, severity: ERROR_SEVERITY.MEDIUM }
    }
    if (error.status >= 500) {
      return { type: ERROR_TYPES.SERVER, severity: ERROR_SEVERITY.HIGH }
    }
  }

  // Validation errors
  if (error.name === 'ValidationError' || error.message.includes('validation')) {
    return { type: ERROR_TYPES.VALIDATION, severity: ERROR_SEVERITY.MEDIUM }
  }

  return { type: ERROR_TYPES.UNKNOWN, severity: ERROR_SEVERITY.MEDIUM }
}

// User-friendly error messages
export function getUserFriendlyMessage(error) {
  const { type } = classifyError(error)

  const messages = {
    [ERROR_TYPES.NETWORK]: 'Unable to connect to the server. Please check your internet connection and try again.',
    [ERROR_TYPES.VALIDATION]: 'Please check the form fields and correct any errors.',
    [ERROR_TYPES.AUTHENTICATION]: 'Your session has expired. Please log in again.',
    [ERROR_TYPES.AUTHORIZATION]: 'You do not have permission to perform this action.',
    [ERROR_TYPES.DATA_CONSISTENCY]: 'The data has been updated by another user. Please refresh and try again.',
    [ERROR_TYPES.NOT_FOUND]: 'The requested item could not be found.',
    [ERROR_TYPES.SERVER]: 'A server error occurred. Please try again later.',
    [ERROR_TYPES.UNKNOWN]: 'An unexpected error occurred. Please try again.'
  }

  return messages[type] || messages[ERROR_TYPES.UNKNOWN]
}

// Error recovery strategies
export const RECOVERY_STRATEGIES = {
  RETRY: 'retry',
  REFRESH: 'refresh',
  REDIRECT: 'redirect',
  ROLLBACK: 'rollback',
  MANUAL: 'manual'
}

export function getRecoveryStrategy(error) {
  const { type, severity } = classifyError(error)

  // Critical authentication errors require redirect
  if (type === ERROR_TYPES.AUTHENTICATION) {
    return RECOVERY_STRATEGIES.REDIRECT
  }

  // Network errors can be retried
  if (type === ERROR_TYPES.NETWORK && severity !== ERROR_SEVERITY.CRITICAL) {
    return RECOVERY_STRATEGIES.RETRY
  }

  // Data consistency errors need refresh
  if (type === ERROR_TYPES.DATA_CONSISTENCY) {
    return RECOVERY_STRATEGIES.REFRESH
  }

  // Server errors can be retried for non-critical cases
  if (type === ERROR_TYPES.SERVER && severity === ERROR_SEVERITY.MEDIUM) {
    return RECOVERY_STRATEGIES.RETRY
  }

  // Default to manual intervention
  return RECOVERY_STRATEGIES.MANUAL
}

// Validation error utilities
export class ValidationError extends Error {
  constructor(message, field = null, value = null) {
    super(message)
    this.name = 'ValidationError'
    this.field = field
    this.value = value
  }
}

export class ValidationErrors extends Error {
  constructor(errors = {}) {
    const message = Object.keys(errors).length > 0 
      ? `Validation failed for: ${Object.keys(errors).join(', ')}`
      : 'Validation failed'
    
    super(message)
    this.name = 'ValidationErrors'
    this.errors = errors
  }

  hasError(field) {
    return field in this.errors
  }

  getError(field) {
    return this.errors[field]
  }

  addError(field, message) {
    this.errors[field] = message
  }

  removeError(field) {
    delete this.errors[field]
  }

  hasErrors() {
    return Object.keys(this.errors).length > 0
  }

  getFieldsWithErrors() {
    return Object.keys(this.errors)
  }
}

// Form validation utilities
export function validateRequired(value, fieldName) {
  if (value === null || value === undefined || value === '') {
    throw new ValidationError(`${fieldName} is required`, fieldName, value)
  }
  return true
}

export function validateEmail(email, fieldName = 'Email') {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw new ValidationError(`${fieldName} must be a valid email address`, fieldName, email)
  }
  return true
}

export function validateNumber(value, fieldName, min = null, max = null) {
  // Check for empty string or null/undefined
  if (value === '' || value === null || value === undefined) {
    throw new ValidationError(`${fieldName} must be a valid number`, fieldName, value)
  }
  
  const num = Number(value)
  if (isNaN(num)) {
    throw new ValidationError(`${fieldName} must be a valid number`, fieldName, value)
  }
  if (min !== null && num < min) {
    throw new ValidationError(`${fieldName} must be at least ${min}`, fieldName, value)
  }
  if (max !== null && num > max) {
    throw new ValidationError(`${fieldName} must be no more than ${max}`, fieldName, value)
  }
  return true
}

export function validateDate(date, fieldName) {
  const dateObj = new Date(date)
  if (isNaN(dateObj.getTime())) {
    throw new ValidationError(`${fieldName} must be a valid date`, fieldName, date)
  }
  return true
}

// Data consistency conflict resolution
export class DataConflictError extends Error {
  constructor(message, expectedVersion, actualVersion, conflictData = null) {
    super(message)
    this.name = 'DataConflictError'
    this.expectedVersion = expectedVersion
    this.actualVersion = actualVersion
    this.conflictData = conflictData
  }
}

export const CONFLICT_RESOLUTION_STRATEGIES = {
  LAST_WRITE_WINS: 'last_write_wins',
  MANUAL_RESOLUTION: 'manual_resolution',
  AUDIT_REQUIRED: 'audit_required',
  MERGE_CHANGES: 'merge_changes'
}

export function resolveStockConflict(expectedStock, actualStock, concurrentUpdates = []) {
  const variance = Math.abs(expectedStock - actualStock)
  
  // Minor discrepancies can use last write wins
  if (variance <= 5) {
    return {
      strategy: CONFLICT_RESOLUTION_STRATEGIES.LAST_WRITE_WINS,
      resolvedValue: actualStock,
      requiresApproval: false
    }
  }
  
  // Significant discrepancies need manual resolution
  if (variance <= 20) {
    return {
      strategy: CONFLICT_RESOLUTION_STRATEGIES.MANUAL_RESOLUTION,
      resolvedValue: null,
      requiresApproval: true,
      conflictData: {
        expectedStock,
        actualStock,
        variance,
        concurrentUpdates
      }
    }
  }
  
  // Critical discrepancies require audit
  return {
    strategy: CONFLICT_RESOLUTION_STRATEGIES.AUDIT_REQUIRED,
    resolvedValue: null,
    requiresApproval: true,
    requiresAudit: true,
    conflictData: {
      expectedStock,
      actualStock,
      variance,
      concurrentUpdates
    }
  }
}

// Session management for authentication errors
export function handleAuthenticationError(error, router = null) {
  const { type } = classifyError(error)
  
  if (type === ERROR_TYPES.AUTHENTICATION) {
    // Clear user session
    if (typeof window !== 'undefined') {
      localStorage.removeItem('currentUser')
      sessionStorage.clear()
    }
    
    // Redirect to login if router is available
    if (router && router.push) {
      router.push('/login?reason=session_expired')
    } else if (typeof window !== 'undefined') {
      window.location.href = '/login?reason=session_expired'
    }
    
    return true
  }
  
  return false
}

// Error logging and reporting
export function logError(error, context = {}) {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    name: error.name,
    timestamp: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.href : null,
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : null,
    context,
    classification: classifyError(error)
  }

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error logged:', errorInfo)
  }

  // In production, send to error reporting service
  if (process.env.NODE_ENV === 'production') {
    // TODO: Integrate with error reporting service (e.g., Sentry)
    // sendToErrorReporting(errorInfo)
  }

  return errorInfo
}

// Retry utilities with exponential backoff
export async function retryWithBackoff(
  operation,
  maxRetries = 3,
  baseDelay = 1000,
  maxDelay = 10000
) {
  let lastError = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      
      const { type } = classifyError(error)
      
      // Don't retry client errors or on last attempt
      if (type === ERROR_TYPES.VALIDATION || 
          type === ERROR_TYPES.AUTHORIZATION || 
          type === ERROR_TYPES.NOT_FOUND ||
          attempt === maxRetries) {
        throw error
      }

      // Calculate delay with exponential backoff and jitter
      const delay = Math.min(
        baseDelay * Math.pow(2, attempt) + Math.random() * 1000,
        maxDelay
      )
      
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError
}