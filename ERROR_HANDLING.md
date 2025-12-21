# Comprehensive Error Handling System

This document describes the comprehensive error handling system implemented for the Minima Hotel Inventory Frontend.

## Overview

The error handling system provides multiple layers of error detection, classification, recovery, and user feedback to ensure a robust and user-friendly experience.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Error Handling Layers                   │
├─────────────────────────────────────────────────────────────┤
│  1. Error Boundaries (React Component Errors)              │
│  2. API Error Handling (Network & Server Errors)          │
│  3. Form Validation (Client-side Validation)              │
│  4. Session Management (Authentication Errors)             │
│  5. Data Conflict Resolution (Consistency Errors)          │
└─────────────────────────────────────────────────────────────┘
```

## Components

### 1. Error Classification (`lib/errorHandling.js`)

Automatically classifies errors into types and severity levels:

**Error Types:**
- `NETWORK` - Connection issues, timeouts
- `AUTHENTICATION` - Session expired, unauthorized
- `AUTHORIZATION` - Insufficient permissions
- `VALIDATION` - Form validation failures
- `DATA_CONSISTENCY` - Concurrent update conflicts
- `NOT_FOUND` - Resource not found
- `SERVER` - Internal server errors
- `UNKNOWN` - Unclassified errors

**Severity Levels:**
- `LOW` - Minor issues, non-blocking
- `MEDIUM` - Moderate issues, may affect functionality
- `HIGH` - Significant issues, blocks user actions
- `CRITICAL` - System-level failures, requires immediate attention

### 2. Error Boundaries (`components/ui/ErrorBoundary.jsx`)

React error boundaries that catch component-level errors:

```jsx
// Page-level error boundary
<ErrorBoundary level="page" name="InventoryPage">
  <InventoryManagementPage />
</ErrorBoundary>

// Component-level error boundary
<ErrorBoundary level="component" name="InventoryForm">
  <InventoryItemForm />
</ErrorBoundary>
```

**Features:**
- Automatic error logging with context
- User-friendly fallback UI
- Retry functionality
- Development mode error details
- Custom fallback components

### 3. Error Display Components (`components/ui/ErrorDisplay.jsx`)

Specialized components for displaying different types of errors:

**ErrorDisplay** - Generic error display with recovery actions
**NetworkErrorDisplay** - Network-specific error handling
**ValidationErrorDisplay** - Form validation error summary
**DataConflictDisplay** - Data conflict resolution interface

### 4. Form Validation (`hooks/useFormValidation.js`)

Comprehensive form validation with error handling:

```jsx
const {
  values,
  errors,
  touched,
  hasErrors,
  handleChange,
  handleBlur,
  handleSubmit,
  getFieldProps
} = useFormValidation(initialValues, validationRules)
```

**Features:**
- Real-time validation
- Field-level error display
- Custom validation rules
- Pattern matching
- Async validation support

### 5. Enhanced API Client (`lib/enhancedApi.js`)

API client with comprehensive error handling:

```jsx
const { loading, error, executeRequest } = useEnhancedApi()

await executeRequest(async () => {
  return await EnhancedInventoryAPI.updateItem(itemId, data)
})
```

**Features:**
- Automatic retry with exponential backoff
- Request/response interceptors
- Conflict detection and resolution
- Optimistic updates with rollback
- Caching with error fallback

### 6. Session Management (`lib/sessionManager.js`)

Automatic session management with error handling:

```jsx
const { user, isAuthenticated, login, logout } = useSession()
```

**Features:**
- Automatic token renewal
- Multi-tab synchronization
- Session expiry handling
- Automatic redirect on auth errors

## Error Recovery Strategies

The system automatically determines appropriate recovery strategies:

1. **RETRY** - For transient network errors
2. **REFRESH** - For data consistency issues
3. **REDIRECT** - For authentication errors
4. **ROLLBACK** - For failed optimistic updates
5. **MANUAL** - For errors requiring user intervention

## Data Conflict Resolution

Handles concurrent update conflicts with multiple resolution strategies:

1. **Last Write Wins** - For minor discrepancies (≤5 units)
2. **Manual Resolution** - For significant discrepancies (6-20 units)
3. **Audit Required** - For critical discrepancies (>20 units)

## Usage Examples

### Basic Error Handling

```jsx
import { ErrorDisplay } from '../ui/ErrorDisplay'
import { useEnhancedApi } from '../../lib/enhancedApi'

function MyComponent() {
  const { loading, error, executeRequest, clearError } = useEnhancedApi()

  const handleAction = async () => {
    try {
      await executeRequest(() => apiCall())
    } catch (err) {
      // Error is automatically handled by useEnhancedApi
    }
  }

  return (
    <div>
      {error && (
        <ErrorDisplay
          error={error}
          onRetry={handleAction}
          onDismiss={clearError}
        />
      )}
      {/* Component content */}
    </div>
  )
}
```

### Form Validation with Error Handling

```jsx
import { useFormValidation, inventoryValidationRules } from '../../hooks/useFormValidation'
import { ValidationErrorDisplay } from '../ui/ErrorDisplay'
import Input from '../ui/Input'

function MyForm() {
  const {
    values,
    errors,
    hasErrors,
    getFieldProps,
    handleSubmit
  } = useFormValidation(initialValues, {
    name: inventoryValidationRules.itemName,
    email: inventoryValidationRules.email
  })

  return (
    <form onSubmit={(e) => {
      e.preventDefault()
      handleSubmit(onSubmit)
    }}>
      {hasErrors && (
        <ValidationErrorDisplay errors={errors} />
      )}
      
      <Input {...getFieldProps('name')} label="Name" />
      <Input {...getFieldProps('email')} label="Email" />
      
      <button type="submit">Submit</button>
    </form>
  )
}
```

### Data Conflict Resolution

```jsx
import { DataConflictDisplay } from '../ui/ErrorDisplay'

function ConflictResolution({ conflictError, onResolve }) {
  return (
    <DataConflictDisplay
      expectedValue={conflictError.expectedVersion}
      actualValue={conflictError.actualVersion}
      onAcceptCurrent={() => onResolve('accept')}
      onForceUpdate={() => onResolve('force')}
      onRefresh={() => onResolve('refresh')}
    />
  )
}
```

## Testing

The error handling system includes comprehensive unit tests:

- `lib/errorHandling.test.js` - Core error handling utilities
- `components/ui/ErrorBoundary.test.jsx` - Error boundary components
- `components/ui/ErrorDisplay.test.jsx` - Error display components
- `hooks/useFormValidation.test.js` - Form validation hook
- `lib/sessionManager.test.js` - Session management

Run tests with:
```bash
npm test lib/errorHandling.test.js
npm test components/ui/ErrorBoundary.test.jsx
npm test hooks/useFormValidation.test.js
```

## Best Practices

1. **Always use Error Boundaries** - Wrap components that might throw errors
2. **Classify Errors Properly** - Use the error classification system
3. **Provide Recovery Actions** - Always offer users a way to recover
4. **Log Errors with Context** - Include relevant context for debugging
5. **Test Error Scenarios** - Write tests for both success and failure cases
6. **Use Appropriate Error Messages** - Provide user-friendly, actionable messages
7. **Handle Async Errors** - Use try/catch with async operations
8. **Validate Early and Often** - Validate on both client and server
9. **Implement Graceful Degradation** - Provide fallback functionality when possible
10. **Monitor Error Rates** - Track and analyze error patterns

## Configuration

Error handling behavior can be configured through environment variables:

```env
# Development settings
NODE_ENV=development
REACT_APP_ERROR_REPORTING_URL=https://api.example.com/errors
REACT_APP_ENABLE_ERROR_OVERLAY=true

# Production settings
NODE_ENV=production
REACT_APP_ERROR_REPORTING_URL=https://api.example.com/errors
REACT_APP_ENABLE_ERROR_OVERLAY=false
```

## Integration with External Services

The error handling system can be integrated with external error reporting services:

```javascript
// In lib/errorHandling.js
export function logError(error, context = {}) {
  // ... existing logging code ...
  
  // Send to external service in production
  if (process.env.NODE_ENV === 'production') {
    sendToErrorReporting({
      error,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    })
  }
}
```

## Monitoring and Analytics

Key metrics to monitor:

- Error rates by type and severity
- Recovery action success rates
- User abandonment after errors
- Most common error scenarios
- Performance impact of error handling

This comprehensive error handling system ensures that the Minima Hotel Inventory Frontend provides a robust, user-friendly experience even when things go wrong.