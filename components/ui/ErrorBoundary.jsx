// Error Boundary component for catching and handling React component errors
import React from 'react'
import { logError, classifyError, getUserFriendlyMessage, ERROR_SEVERITY } from '../../lib/errorHandling'
import Button from './Button'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    }
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error, errorInfo) {
    // Log the error with context
    const errorId = logError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: this.props.name || 'Unknown',
      props: this.props.context || {}
    })

    this.setState({
      errorInfo,
      errorId
    })

    // Call optional error callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    })

    // Call optional retry callback
    if (this.props.onRetry) {
      this.props.onRetry()
    }
  }

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  render() {
    if (this.state.hasError) {
      const { error } = this.state
      const { fallback: FallbackComponent, level = 'component' } = this.props
      const classification = classifyError(error)
      const userMessage = getUserFriendlyMessage(error)

      // Use custom fallback if provided
      if (FallbackComponent) {
        return (
          <FallbackComponent
            error={error}
            errorInfo={this.state.errorInfo}
            onRetry={this.handleRetry}
            onReload={this.handleReload}
          />
        )
      }

      // Default fallback UI based on error severity and boundary level
      if (level === 'page' || classification.severity === ERROR_SEVERITY.CRITICAL) {
        return (
          <div className="min-h-screen bg-whitesmoke flex items-center justify-center p-8">
            <div className="max-w-md w-full bg-white rounded-md border border-gray-300 p-8 text-center">
              <div className="mb-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h2 className="text-xl font-heading font-medium text-black mb-2">
                  Something went wrong
                </h2>
                <p className="text-gray-700 mb-6">
                  {userMessage}
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  variant="primary"
                  onClick={this.handleRetry}
                  className="w-full"
                >
                  Try Again
                </Button>
                <Button
                  variant="secondary"
                  onClick={this.handleReload}
                  className="w-full"
                >
                  Reload Page
                </Button>
              </div>

              {process.env.NODE_ENV === 'development' && (
                <details className="mt-6 text-left">
                  <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                    Error Details (Development)
                  </summary>
                  <div className="mt-2 p-3 bg-gray-50 rounded text-xs font-mono text-gray-600 overflow-auto">
                    <div className="mb-2">
                      <strong>Error:</strong> {error.message}
                    </div>
                    <div className="mb-2">
                      <strong>Type:</strong> {classification.type}
                    </div>
                    <div className="mb-2">
                      <strong>Severity:</strong> {classification.severity}
                    </div>
                    {this.state.errorId && (
                      <div className="mb-2">
                        <strong>Error ID:</strong> {this.state.errorId}
                      </div>
                    )}
                    {error.stack && (
                      <div>
                        <strong>Stack:</strong>
                        <pre className="mt-1 whitespace-pre-wrap">{error.stack}</pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </div>
          </div>
        )
      }

      // Component-level error boundary
      return (
        <div className="bg-white border border-gray-300 rounded-md p-6 text-center">
          <div className="mb-4">
            <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-heading font-medium text-black mb-2">
              Component Error
            </h3>
            <p className="text-gray-700 text-sm mb-4">
              {userMessage}
            </p>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={this.handleRetry}
          >
            Try Again
          </Button>

          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
                Debug Info
              </summary>
              <div className="mt-2 p-2 bg-gray-50 rounded text-xs font-mono text-gray-600">
                {error.message}
              </div>
            </details>
          )}
        </div>
      )
    }

    return this.props.children
  }
}

// Higher-order component for wrapping components with error boundaries
export function withErrorBoundary(Component, errorBoundaryProps = {}) {
  const WrappedComponent = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  return WrappedComponent
}

// Hook for error boundary context
export function useErrorHandler() {
  const [error, setError] = React.useState(null)

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  const handleError = React.useCallback((error) => {
    setError(error)
    logError(error, { source: 'useErrorHandler' })
  }, [])

  // Throw error to be caught by error boundary
  if (error) {
    throw error
  }

  return { handleError, resetError }
}

export default ErrorBoundary