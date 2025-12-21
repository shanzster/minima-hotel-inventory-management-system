// Unit tests for ErrorDisplay component
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { 
  ErrorDisplay, 
  NetworkErrorDisplay, 
  ValidationErrorDisplay, 
  DataConflictDisplay 
} from './ErrorDisplay'
import { APIError } from '../../lib/api'

// Mock the error handling utilities
vi.mock('../../lib/errorHandling', async () => {
  const actual = await vi.importActual('../../lib/errorHandling')
  return {
    ...actual,
    classifyError: vi.fn(() => ({ type: 'unknown', severity: 'medium' })),
    getUserFriendlyMessage: vi.fn(() => 'An error occurred'),
    getRecoveryStrategy: vi.fn(() => 'manual')
  }
})

describe('ErrorDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing when no error is provided', () => {
    const { container } = render(<ErrorDisplay error={null} />)
    expect(container.firstChild).toBeNull()
  })

  it('displays network error with retry option', async () => {
    const { classifyError, getUserFriendlyMessage, getRecoveryStrategy } = await import('../../lib/errorHandling')
    
    classifyError.mockReturnValue({ type: 'network', severity: 'high' })
    getUserFriendlyMessage.mockReturnValue('Network connection failed')
    getRecoveryStrategy.mockReturnValue('retry')

    const onRetry = vi.fn()
    const networkError = new Error('Network error')

    render(<ErrorDisplay error={networkError} onRetry={onRetry} />)

    expect(screen.getByText('Connection Error')).toBeInTheDocument()
    expect(screen.getByText('Network connection failed')).toBeInTheDocument()
    
    const retryButton = screen.getByRole('button', { name: 'Try Again' })
    expect(retryButton).toBeInTheDocument()
    
    fireEvent.click(retryButton)
    expect(onRetry).toHaveBeenCalled()
  })

  it('displays authentication error with login redirect', async () => {
    const { classifyError, getUserFriendlyMessage, getRecoveryStrategy } = await import('../../lib/errorHandling')
    
    classifyError.mockReturnValue({ type: 'authentication', severity: 'critical' })
    getUserFriendlyMessage.mockReturnValue('Your session has expired')
    getRecoveryStrategy.mockReturnValue('redirect')

    // Mock window.location
    delete window.location
    window.location = { href: '' }

    const authError = new APIError('Unauthorized', 401)
    render(<ErrorDisplay error={authError} />)

    expect(screen.getByText('Authentication Required')).toBeInTheDocument()
    expect(screen.getByText('Your session has expired')).toBeInTheDocument()
    
    const loginButton = screen.getByRole('button', { name: 'Go to Login' })
    fireEvent.click(loginButton)
    expect(window.location.href).toBe('/login')
  })

  it('displays validation error', async () => {
    const { classifyError, getUserFriendlyMessage, getRecoveryStrategy } = await import('../../lib/errorHandling')
    
    classifyError.mockReturnValue({ type: 'validation', severity: 'medium' })
    getUserFriendlyMessage.mockReturnValue('Please check the form fields')
    getRecoveryStrategy.mockReturnValue('manual')

    const validationError = new Error('Validation failed')
    const onDismiss = vi.fn()

    render(<ErrorDisplay error={validationError} onDismiss={onDismiss} />)

    expect(screen.getByText('Validation Error')).toBeInTheDocument()
    expect(screen.getByText('Please check the form fields')).toBeInTheDocument()
    
    const dismissButton = screen.getByRole('button', { name: 'Dismiss' })
    fireEvent.click(dismissButton)
    expect(onDismiss).toHaveBeenCalled()
  })

  it('displays data consistency error with refresh option', async () => {
    const { classifyError, getUserFriendlyMessage, getRecoveryStrategy } = await import('../../lib/errorHandling')
    
    classifyError.mockReturnValue({ type: 'data_consistency', severity: 'high' })
    getUserFriendlyMessage.mockReturnValue('Data has been updated by another user')
    getRecoveryStrategy.mockReturnValue('refresh')

    const conflictError = new APIError('Conflict', 409)
    const onRefresh = vi.fn()

    render(<ErrorDisplay error={conflictError} onRefresh={onRefresh} />)

    expect(screen.getByText('Data Conflict')).toBeInTheDocument()
    expect(screen.getByText('Data has been updated by another user')).toBeInTheDocument()
    
    const refreshButton = screen.getByRole('button', { name: 'Refresh Data' })
    fireEvent.click(refreshButton)
    expect(onRefresh).toHaveBeenCalled()
  })

  it('shows technical details when showDetails is true', async () => {
    const { classifyError, getUserFriendlyMessage, getRecoveryStrategy } = await import('../../lib/errorHandling')
    
    classifyError.mockReturnValue({ type: 'server', severity: 'high' })
    getUserFriendlyMessage.mockReturnValue('Server error occurred')
    getRecoveryStrategy.mockReturnValue('manual')

    const serverError = new APIError('Internal Server Error', 500)
    render(<ErrorDisplay error={serverError} showDetails={true} />)

    expect(screen.getByText('Technical Details')).toBeInTheDocument()
    expect(screen.getByText('Internal Server Error')).toBeInTheDocument()
    expect(screen.getByText('Status: 500')).toBeInTheDocument()
  })

  it('applies custom className', async () => {
    const { classifyError, getUserFriendlyMessage, getRecoveryStrategy } = await import('../../lib/errorHandling')
    
    classifyError.mockReturnValue({ type: 'unknown', severity: 'medium' })
    getUserFriendlyMessage.mockReturnValue('An error occurred')
    getRecoveryStrategy.mockReturnValue('manual')

    const error = new Error('Test error')
    const { container } = render(<ErrorDisplay error={error} className="custom-class" />)

    expect(container.firstChild).toHaveClass('custom-class')
  })
})

describe('NetworkErrorDisplay', () => {
  it('displays network error with retry and dismiss options', async () => {
    const { classifyError, getUserFriendlyMessage, getRecoveryStrategy } = await import('../../lib/errorHandling')
    
    classifyError.mockReturnValue({ type: 'network', severity: 'high' })
    getUserFriendlyMessage.mockReturnValue('Network connection failed')
    getRecoveryStrategy.mockReturnValue('retry')

    const onRetry = vi.fn()
    const onDismiss = vi.fn()

    render(<NetworkErrorDisplay onRetry={onRetry} onDismiss={onDismiss} />)

    expect(screen.getByText('Connection Error')).toBeInTheDocument()
    
    const retryButton = screen.getByRole('button', { name: 'Try Again' })
    const dismissButton = screen.getByRole('button', { name: 'Dismiss' })
    
    fireEvent.click(retryButton)
    expect(onRetry).toHaveBeenCalled()
    
    fireEvent.click(dismissButton)
    expect(onDismiss).toHaveBeenCalled()
  })
})

describe('ValidationErrorDisplay', () => {
  it('displays validation errors for multiple fields', () => {
    const errors = {
      email: 'Invalid email address',
      password: 'Password is too short',
      name: 'Name is required'
    }

    render(<ValidationErrorDisplay errors={errors} />)

    expect(screen.getByText('Please correct the following errors:')).toBeInTheDocument()
    expect(screen.getByText('Invalid email address')).toBeInTheDocument()
    expect(screen.getByText('Password is too short')).toBeInTheDocument()
    expect(screen.getByText('Name is required')).toBeInTheDocument()
  })

  it('displays field names with errors', () => {
    const errors = {
      email: 'Invalid email address'
    }

    render(<ValidationErrorDisplay errors={errors} />)

    expect(screen.getByText('email:')).toBeInTheDocument()
    expect(screen.getByText('Invalid email address')).toBeInTheDocument()
  })

  it('calls onDismiss when dismiss button is clicked', () => {
    const onDismiss = vi.fn()
    const errors = { field: 'Error message' }

    render(<ValidationErrorDisplay errors={errors} onDismiss={onDismiss} />)

    const dismissButton = screen.getByRole('button', { name: 'Dismiss' })
    fireEvent.click(dismissButton)
    expect(onDismiss).toHaveBeenCalled()
  })
})

describe('DataConflictDisplay', () => {
  it('displays conflict information with resolution options', () => {
    const onAcceptCurrent = vi.fn()
    const onForceUpdate = vi.fn()
    const onRefresh = vi.fn()

    render(
      <DataConflictDisplay
        expectedValue="100"
        actualValue="105"
        onAcceptCurrent={onAcceptCurrent}
        onForceUpdate={onForceUpdate}
        onRefresh={onRefresh}
      />
    )

    expect(screen.getByText('Data Conflict Detected')).toBeInTheDocument()
    expect(screen.getByText('100')).toBeInTheDocument()
    expect(screen.getByText('105')).toBeInTheDocument()

    const acceptButton = screen.getByRole('button', { name: 'Use Current Value' })
    const forceButton = screen.getByRole('button', { name: 'Override with My Value' })
    const refreshButton = screen.getByRole('button', { name: 'Refresh & Try Again' })

    fireEvent.click(acceptButton)
    expect(onAcceptCurrent).toHaveBeenCalled()

    fireEvent.click(forceButton)
    expect(onForceUpdate).toHaveBeenCalled()

    fireEvent.click(refreshButton)
    expect(onRefresh).toHaveBeenCalled()
  })

  it('shows conflict values in separate columns', () => {
    render(
      <DataConflictDisplay
        expectedValue="Original Value"
        actualValue="Updated Value"
      />
    )

    expect(screen.getByText('Your value:')).toBeInTheDocument()
    expect(screen.getByText('Current value:')).toBeInTheDocument()
    expect(screen.getByText('Original Value')).toBeInTheDocument()
    expect(screen.getByText('Updated Value')).toBeInTheDocument()
  })

  it('only renders provided action buttons', () => {
    const onAcceptCurrent = vi.fn()

    render(
      <DataConflictDisplay
        expectedValue="100"
        actualValue="105"
        onAcceptCurrent={onAcceptCurrent}
      />
    )

    expect(screen.getByRole('button', { name: 'Use Current Value' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Override with My Value' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Refresh & Try Again' })).not.toBeInTheDocument()
  })
})