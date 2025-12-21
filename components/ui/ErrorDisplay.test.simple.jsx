// Simplified unit tests for ErrorDisplay component
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorDisplay } from './ErrorDisplay'

// Mock Button component
vi.mock('./Button', () => ({
  default: ({ children, onClick, variant, size }) => (
    <button onClick={onClick} data-variant={variant} data-size={size}>
      {children}
    </button>
  )
}))

// Mock error handling utilities
vi.mock('../../lib/errorHandling', () => ({
  classifyError: vi.fn(() => ({ type: 'unknown', severity: 'medium' })),
  getUserFriendlyMessage: vi.fn(() => 'An error occurred'),
  getRecoveryStrategy: vi.fn(() => 'manual'),
  ERROR_TYPES: {
    NETWORK: 'network',
    AUTHENTICATION: 'authentication',
    VALIDATION: 'validation',
    DATA_CONSISTENCY: 'data_consistency',
    UNKNOWN: 'unknown'
  },
  ERROR_SEVERITY: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
  },
  RECOVERY_STRATEGIES: {
    RETRY: 'retry',
    REFRESH: 'refresh',
    REDIRECT: 'redirect',
    MANUAL: 'manual'
  }
}))

describe('ErrorDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing when no error is provided', () => {
    const { container } = render(<ErrorDisplay error={null} />)
    expect(container.firstChild).toBeNull()
  })

  it('displays error message', () => {
    const error = new Error('Test error')
    render(<ErrorDisplay error={error} />)

    expect(screen.getByText('Error')).toBeInTheDocument()
    expect(screen.getByText('An error occurred')).toBeInTheDocument()
  })

  it('calls onDismiss when dismiss button is clicked', () => {
    const onDismiss = vi.fn()
    const error = new Error('Test error')

    render(<ErrorDisplay error={error} onDismiss={onDismiss} />)

    const dismissButton = screen.getByRole('button', { name: 'Dismiss' })
    fireEvent.click(dismissButton)
    expect(onDismiss).toHaveBeenCalled()
  })

  it('applies custom className', () => {
    const error = new Error('Test error')
    const { container } = render(<ErrorDisplay error={error} className="custom-class" />)

    expect(container.firstChild).toHaveClass('custom-class')
  })
})