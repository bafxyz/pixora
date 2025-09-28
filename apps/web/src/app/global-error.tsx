'use client'

import { Button } from '@repo/ui/button'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error occurred:', {
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      timestamp: new Date().toISOString(),
    })
  }, [error])

  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center bg-red-50 p-4">
        <div className="max-w-md text-center">
          <h2 className="text-2xl font-bold text-red-800 mb-4">
            Something went wrong!
          </h2>
          <p className="text-red-600 mb-6">
            {error.message || 'An unexpected error occurred'}
          </p>

          <Button
            variant="destructive"
            onClick={(): void => {
              // Attempt to recover by trying to re-render the segment
              reset()
            }}
          >
            Try again
          </Button>
        </div>
      </body>
    </html>
  )
}
