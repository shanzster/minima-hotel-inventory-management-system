// Unit tests for ErrorBoundary component
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ErrorBoundary, { withErrorBoundary, useErrorHandler } from './ErrorBoundary'

// Mock the error handling utilities
vi.mock('../../lib/errorHandling', () => ({
  logError: vi.fn(() => 'error-id-123'),
  classifyError: vi.fn(() => ({ type: 'unknown', severity: 'medium' })),
  getUserFriendlyMessage: vi.fn(() => 'Something went wrong. Please try again.'),
  ERROR_SEVERITY: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
  }
}))

// Mock Button component
vi.mock('./Button', () => ({
  default: ({ children, onClick, variant, className }) => (
    <button onClick={onClick} className={`btn-${variant} ${className}`}>
      {children}
    </button>
  )
}))

// Component that throws an error for testing
function ThrowError({ shouldThrow = false, errorType = 'generic' }) {
  if (shouldThrow) {
    if (errorType === 'api') {
      const error = new Error('API Error')
      error.status = 500
      throw error
    }
    throw new Error('Test error')
  }
  return <div>No error</div>
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Suppress console.error for cleaner test output
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    )

    expect(screen.getByText('No error')).toBeInTheDocument()
  })

  it('renders error UI when error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Component Error')).toBeInTheDocument()
    expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument()
  })

  it('renders page-level error UI for critical errors', async () => {
    const { classifyError, getUserFriendlyMessage } = await import('../../lib/errorHandling')
    
    classifyError.mockReturnValue({ type: 'authentication', severity: 'critical' })
    getUserFriendlyMessage.mockReturnValue('Your session has expired')

    render(
      <ErrorBoundary level="page">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reload Page' })).toBeInTheDocument()
  })

  it('calls onError callback when error occurs', () => {
    const onError = vi.fn()

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String)
      })
    )
  })

  it('calls onRetry callback when retry button is clicked', () => {
    const onRetry = vi.fn()

    render(
      <ErrorBoundary onRetry={onRetry}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    fireEvent.click(screen.getByRole('button', { name: 'Try Again' }))
    expect(onRetry).toHaveBeenCalled()
  })

  it('resets error state when retry is clicked', async () => {
    const { classifyError, getUserFriendlyMessage } = await import('../../lib/errorHandling')
    
    // Reset to component-level error
    classifyError.mockReturnValue({ type: 'unknown', severity: 'medium' })
    getUserFriendlyMessage.mockReturnValue('Something went wrong. Please try again.')

    const TestComponent = () => {
      const [shouldThrow, setShouldThrow] = React.useState(true)
      
      return (
        <ErrorBoundary onRetry={() => setShouldThrow(false)}>
          <ThrowError shouldThrow={shouldThrow} />
        </ErrorBoundary>
      )
    }

    render(<TestComponent />)

    // Error should be displayed initially
    expect(screen.getByText('Component Error')).toBeInTheDocument()

    // Click retry
    fireEvent.click(screen.getByRole('button', { name: 'Try Again' }))

    // Component should render normally
    expect(screen.getByText('No error')).toBeInTheDocument()
  })

  it('uses custom fallback component when provided', () => {
    const CustomFallback = ({ error, onRetry }) => (
      <div>
        <h1>Custom Error UI</h1>
        <p>{error.message}</p>
        <button onClick={onRetry}>Custom Retry</button>
      </div>
    )

    render(
      <ErrorBoundary fallback={CustomFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Custom Error UI')).toBeInTheDocument()
    expect(screen.getByText('Test error')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Custom Retry' })).toBeInTheDocument()
  })

  it('shows error details in development mode', async () => {
    const { classifyError, getUserFriendlyMessage } = await import('../../lib/errorHandling')
    
    // Reset to component-level error
    classifyError.mockReturnValue({ type: 'unknown', severity: 'medium' })
    getUserFriendlyMessage.mockReturnValue('Something went wrong. Please try again.')

    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Debug Info')).toBeInTheDocument()

    process.env.NODE_ENV = originalEnv
  })

  it('logs error with context information', async () => {
    const { logError } = await import('../../lib/errorHandling')
    const onError = vi.fn()

    render(
      <ErrorBoundary name="TestBoundary" context={{ page: 'inventory' }} onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(logError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
        errorBoundary: 'TestBoundary',
        props: { page: 'inventory' }
      })
    )
  })
})

describe('withErrorBoundary HOC', () => {
  it('wraps component with error boundary', () => {
    const TestComponent = () => <div>Test Component</div>
    const WrappedComponent = withErrorBoundary(TestComponent, { name: 'TestWrapper' })

    render(<WrappedComponent />)
    expect(screen.getByText('Test Component')).toBeInTheDocument()
  })

  it('catches errors in wrapped component', async () => {
    const { classifyError, getUserFriendlyMessage } = await import('../../lib/errorHandling')
    
    // Reset to component-level error
    classifyError.mockReturnValue({ type: 'unknown', severity: 'medium' })
    getUserFriendlyMessage.mockReturnValue('Something went wrong. Please try again.')

    const WrappedComponent = withErrorBoundary(ThrowError, { name: 'TestWrapper' })

    render(<WrappedComponent shouldThrow={true} />)
    expect(screen.getByText('Component Error')).toBeInTheDocument()
  })

  it('sets correct display name', () => {
    const TestComponent = () => <div>Test</div>
    TestComponent.displayName = 'TestComponent'
    
    const WrappedComponent = withErrorBoundary(TestComponent)
    expect(WrappedComponent.displayName).toBe('withErrorBoundary(TestComponent)')
  })
})

describe('useErrorHandler hook', () => {
  it('provides error handling functions', () => {
    let hookResult
    
    function TestComponent() {
      hookResult = useErrorHandler()
      return <div>Test</div>
    }

    render(
      <ErrorBoundary>
        <TestComponent />
      </ErrorBoundary>
    )

    expect(hookResult.handleError).toBeInstanceOf(Function)
    expect(hookResult.resetError).toBeInstanceOf(Function)
  })

  it('throws error to be caught by error boundary', async () => {
    const { classifyError, getUserFriendlyMessage } = await import('../../lib/errorHandling')
    
    // Reset to component-level error
    classifyError.mockReturnValue({ type: 'unknown', severity: 'medium' })
    getUserFriendlyMessage.mockReturnValue('Something went wrong. Please try again.')

    function TestComponent() {
      const { handleError } = useErrorHandler()
      
      React.useEffect(() => {
        handleError(new Error('Hook error'))
      }, [handleError])
      
      return <div>Test</div>
    }

    render(
      <ErrorBoundary>
        <TestComponent />
      </ErrorBoundary>
    )

    expect(screen.getByText('Component Error')).toBeInTheDocument()
  })

  it('logs error when handleError is called', async () => {
    const { logError } = await import('../../lib/errorHandling')
    
    function TestComponent() {
      const { handleError } = useErrorHandler()
      
      React.useEffect(() => {
        handleError(new Error('Hook error'))
      }, [handleError])
      
      return <div>Test</div>
    }

    render(
      <ErrorBoundary>
        <TestComponent />
      </ErrorBoundary>
    )

    expect(logError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        source: 'useErrorHandler'
      })
    )
  })
})