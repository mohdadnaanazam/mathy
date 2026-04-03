'use client'

import { Component, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Error Boundary for Dynamic Imports
 * Handles chunk load failures with retry functionality.
 * 
 * Requirements: 7.3, 13.1, 13.2, 13.3
 */

// ============================================================================
// Types
// ============================================================================

interface GameErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  maxRetries?: number
}

interface GameErrorBoundaryState {
  hasError: boolean
  error: Error | null
  retryCount: number
}

// ============================================================================
// Error Fallback Component
// ============================================================================

interface ErrorFallbackProps {
  error: Error | null
  retryCount: number
  maxRetries: number
  onRetry: () => void
  onGoHome: () => void
}

function ErrorFallback({ 
  error, 
  retryCount, 
  maxRetries, 
  onRetry, 
  onGoHome 
}: ErrorFallbackProps) {
  const isChunkError = error?.message?.includes('Loading chunk') || 
                       error?.message?.includes('Failed to fetch') ||
                       error?.name === 'ChunkLoadError'
  
  const canRetry = retryCount < maxRetries

  return (
    <div className="w-full min-h-[300px] flex items-center justify-center p-6">
      <div className="text-center space-y-4 max-w-sm">
        {/* Error Icon */}
        <div className="mx-auto w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-zinc-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* Error Message */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-zinc-200">
            {isChunkError ? 'Connection Issue' : 'Something went wrong'}
          </h3>
          <p className="text-sm text-zinc-400">
            {isChunkError
              ? "We couldn't load the game. This might be a network issue."
              : 'An unexpected error occurred while loading the game.'}
          </p>
        </div>

        {/* Retry Info */}
        {retryCount > 0 && (
          <p className="text-xs text-zinc-500">
            Retry attempt {retryCount} of {maxRetries}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          {canRetry ? (
            <button
              onClick={onRetry}
              className="px-6 py-3 bg-[var(--accent-orange)] hover:bg-[var(--accent-orange-hover)] text-white font-semibold rounded-full transition-colors"
            >
              Try Again
            </button>
          ) : (
            <p className="text-sm text-zinc-400 py-2">
              Maximum retries reached
            </p>
          )}
          
          <button
            onClick={onGoHome}
            className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium rounded-full transition-colors border border-zinc-700"
          >
            Go Home
          </button>
        </div>

        {/* Debug Info (development only) */}
        {process.env.NODE_ENV === 'development' && error && (
          <details className="mt-4 text-left">
            <summary className="text-xs text-zinc-500 cursor-pointer hover:text-zinc-400">
              Error Details
            </summary>
            <pre className="mt-2 p-3 bg-zinc-900 rounded-lg text-xs text-zinc-400 overflow-auto max-h-32">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// Wrapper for Navigation Hook
// ============================================================================

function ErrorFallbackWithRouter(props: Omit<ErrorFallbackProps, 'onGoHome'>) {
  const router = useRouter()
  
  const handleGoHome = () => {
    router.push('/')
  }

  return <ErrorFallback {...props} onGoHome={handleGoHome} />
}

// ============================================================================
// Error Boundary Class Component
// ============================================================================

/**
 * GameErrorBoundary
 * Catches errors in child components and provides retry functionality.
 * 
 * @param children - Child components to wrap
 * @param fallback - Optional custom fallback component
 * @param onError - Optional error callback
 * @param maxRetries - Maximum retry attempts (default: 3)
 */
export class GameErrorBoundary extends Component<
  GameErrorBoundaryProps,
  GameErrorBoundaryState
> {
  constructor(props: GameErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      retryCount: 0,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<GameErrorBoundaryState> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error for monitoring
    console.error('[GameErrorBoundary] Caught error:', error, errorInfo)
    
    // Call optional error callback
    this.props.onError?.(error, errorInfo)
  }

  handleRetry = () => {
    const maxRetries = this.props.maxRetries ?? 3
    
    if (this.state.retryCount < maxRetries) {
      this.setState(prev => ({
        hasError: false,
        error: null,
        retryCount: prev.retryCount + 1,
      }))
    }
  }

  render() {
    const { hasError, error, retryCount } = this.state
    const { children, fallback, maxRetries = 3 } = this.props

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback
      }

      // Use default error fallback
      return (
        <ErrorFallbackWithRouter
          error={error}
          retryCount={retryCount}
          maxRetries={maxRetries}
          onRetry={this.handleRetry}
        />
      )
    }

    return children
  }
}

// ============================================================================
// HOC for Wrapping Components
// ============================================================================

/**
 * withErrorBoundary HOC
 * Wraps a component with GameErrorBoundary.
 * 
 * @param Component - Component to wrap
 * @param errorBoundaryProps - Props for the error boundary
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<GameErrorBoundaryProps, 'children'>
) {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component'

  const ComponentWithErrorBoundary = (props: P) => (
    <GameErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </GameErrorBoundary>
  )

  ComponentWithErrorBoundary.displayName = `withErrorBoundary(${displayName})`

  return ComponentWithErrorBoundary
}

export default GameErrorBoundary
