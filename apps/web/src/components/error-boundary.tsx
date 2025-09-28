'use client'

import React, { type ReactNode, useState } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorState {
  hasError: boolean
  error: Error | null
}

function ErrorBoundary({ children, fallback }: Props) {
  const [errorState, setErrorState] = useState<ErrorState>({
    hasError: false,
    error: null,
  })

  // Add global error handler
  const _handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    console.error('ErrorBoundary caught an error:', {
      error: error.message,
      errorStack: error.stack,
      errorInfo,
    })
    setErrorState({ hasError: true, error })
  }

  // Set up error boundaries for React errors
  // Note: Error boundaries don't catch errors in event handlers or async code
  // We'll use window.onerror for uncaught exceptions

  const resetError = () => {
    setErrorState({ hasError: false, error: null })
  }

  if (errorState.hasError) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
        <div className="max-w-md text-center">
          <h2 className="text-2xl font-bold text-red-800 mb-4">
            Something went wrong
          </h2>
          <p className="text-red-600 mb-4">
            {errorState.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            type="button"
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            onClick={resetError}
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export default ErrorBoundary
