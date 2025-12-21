// Error display component for showing user-friendly error messages
import React from 'react'
import { 
  classifyError, 
  getUserFriendlyMessage, 
  getRecoveryStrategy, 
  RECOVERY_STRATEGIES,
  ERROR_TYPES,
  ERROR_SEVERITY 
} from '../../lib/errorHandling'
import Button from './Button'

export function ErrorDisplay({ 
  error, 
  onRetry, 
  onDismiss, 
  onRefresh,
  showDetails = false,
  className = ''
}) {
  if (!error) return null

  const classification = classifyError(error)
  const userMessage = getUserFriendlyMessage(error)
  const recoveryStrategy = getRecoveryStrategy(error)

  // Get appropriate styling based on error type and severity
  const getErrorStyles = () => {
    const baseStyles = 'rounded-md border p-4 mb-4'
    
    switch (classification.severity) {
      case ERROR_SEVERITY.CRITICAL:
        return `${baseStyles} bg-red-50 border-red-200 text-red-800`
      case ERROR_SEVERITY.HIGH:
        return `${baseStyles} bg-orange-50 border-orange-200 text-orange-800`
      case ERROR_SEVERITY.MEDIUM:
        return `${baseStyles} bg-yellow-50 border-yellow-200 text-yellow-800`
      default:
        return `${baseStyles} bg-gray-50 border-gray-200 text-gray-800`
    }
  }

  const getIconForError = () => {
    switch (classification.type) {
      case ERROR_TYPES.NETWORK:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
          </svg>
        )
      case ERROR_TYPES.AUTHENTICATION:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        )
      case ERROR_TYPES.VALIDATION:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        )
      case ERROR_TYPES.DATA_CONSISTENCY:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        )
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
    }
  }

  const renderRecoveryActions = () => {
    const actions = []

    switch (recoveryStrategy) {
      case RECOVERY_STRATEGIES.RETRY:
        if (onRetry) {
          actions.push(
            <Button
              key="retry"
              variant="primary"
              size="sm"
              onClick={onRetry}
            >
              Try Again
            </Button>
          )
        }
        break

      case RECOVERY_STRATEGIES.REFRESH:
        if (onRefresh) {
          actions.push(
            <Button
              key="refresh"
              variant="primary"
              size="sm"
              onClick={onRefresh}
            >
              Refresh Data
            </Button>
          )
        }
        break

      case RECOVERY_STRATEGIES.REDIRECT:
        actions.push(
          <Button
            key="login"
            variant="primary"
            size="sm"
            onClick={() => window.location.href = '/login'}
          >
            Go to Login
          </Button>
        )
        break

      default:
        // Manual recovery - just show dismiss option
        break
    }

    if (onDismiss) {
      actions.push(
        <Button
          key="dismiss"
          variant="ghost"
          size="sm"
          onClick={onDismiss}
        >
          Dismiss
        </Button>
      )
    }

    return actions
  }

  return (
    <div className={`${getErrorStyles()} ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-3 mt-0.5">
          {getIconForError()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="mb-2">
            <h4 className="font-medium text-sm">
              {classification.type === ERROR_TYPES.NETWORK && 'Connection Error'}
              {classification.type === ERROR_TYPES.AUTHENTICATION && 'Authentication Required'}
              {classification.type === ERROR_TYPES.AUTHORIZATION && 'Access Denied'}
              {classification.type === ERROR_TYPES.VALIDATION && 'Validation Error'}
              {classification.type === ERROR_TYPES.DATA_CONSISTENCY && 'Data Conflict'}
              {classification.type === ERROR_TYPES.NOT_FOUND && 'Not Found'}
              {classification.type === ERROR_TYPES.SERVER && 'Server Error'}
              {classification.type === ERROR_TYPES.UNKNOWN && 'Error'}
            </h4>
            <p className="text-sm opacity-90">
              {userMessage}
            </p>
          </div>

          {showDetails && error.message && (
            <details className="mb-3">
              <summary className="cursor-pointer text-xs opacity-75 hover:opacity-100">
                Technical Details
              </summary>
              <div className="mt-2 p-2 bg-black bg-opacity-10 rounded text-xs font-mono">
                {error.message}
                {error.status && (
                  <div className="mt-1">Status: {error.status}</div>
                )}
              </div>
            </details>
          )}

          <div className="flex flex-wrap gap-2">
            {renderRecoveryActions()}
          </div>
        </div>
      </div>
    </div>
  )
}

// Specialized error displays for common scenarios
export function NetworkErrorDisplay({ onRetry, onDismiss }) {
  const networkError = new Error('Network connection failed')
  networkError.name = 'TypeError'
  
  return (
    <ErrorDisplay
      error={networkError}
      onRetry={onRetry}
      onDismiss={onDismiss}
    />
  )
}

export function ValidationErrorDisplay({ errors, onDismiss }) {
  const validationError = new Error('Please correct the form errors')
  validationError.name = 'ValidationError'
  
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-3">
          <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        
        <div className="flex-1">
          <h4 className="font-medium text-sm text-yellow-800 mb-2">
            Please correct the following errors:
          </h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            {Object.entries(errors).map(([field, message]) => (
              <li key={field} className="flex items-center">
                <span className="w-1 h-1 bg-yellow-600 rounded-full mr-2"></span>
                <span className="font-medium mr-1">{field}:</span>
                <span>{message}</span>
              </li>
            ))}
          </ul>
          
          {onDismiss && (
            <div className="mt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
              >
                Dismiss
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function DataConflictDisplay({ 
  expectedValue, 
  actualValue, 
  onAcceptCurrent, 
  onForceUpdate, 
  onRefresh 
}) {
  return (
    <div className="bg-orange-50 border border-orange-200 rounded-md p-4 mb-4">
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-3">
          <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        
        <div className="flex-1">
          <h4 className="font-medium text-sm text-orange-800 mb-2">
            Data Conflict Detected
          </h4>
          <p className="text-sm text-orange-700 mb-3">
            The data has been updated by another user. Please choose how to proceed:
          </p>
          
          <div className="bg-white bg-opacity-50 rounded p-3 mb-3 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-medium text-orange-800">Your value:</span>
                <div className="text-orange-700">{expectedValue}</div>
              </div>
              <div>
                <span className="font-medium text-orange-800">Current value:</span>
                <div className="text-orange-700">{actualValue}</div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {onAcceptCurrent && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onAcceptCurrent}
              >
                Use Current Value
              </Button>
            )}
            {onForceUpdate && (
              <Button
                variant="primary"
                size="sm"
                onClick={onForceUpdate}
              >
                Override with My Value
              </Button>
            )}
            {onRefresh && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
              >
                Refresh & Try Again
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}