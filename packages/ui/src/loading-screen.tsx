import * as React from 'react'
import { Spinner } from './spinner'
import { cn } from './utils'

interface LoadingScreenProps {
  message?: string
  className?: string
}

export const LoadingScreen = React.forwardRef<
  HTMLDivElement,
  LoadingScreenProps
>(({ message, className }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'min-h-screen bg-gray-50 flex items-center justify-center',
        className
      )}
    >
      <div className="text-center">
        <Spinner size="lg" className="mx-auto mb-4" />
        {message && <p className="text-gray-600">{message}</p>}
      </div>
    </div>
  )
})

LoadingScreen.displayName = 'LoadingScreen'
