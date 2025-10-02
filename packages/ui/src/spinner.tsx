import * as React from 'react'
import { cn } from './utils'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ size = 'md', className, ...props }, ref) => {
    const sizeClasses = {
      sm: 'h-4 w-4 border-2',
      md: 'h-6 w-6 border-2',
      lg: 'h-12 w-12 border-4',
    }

    return (
      <div
        ref={ref}
        className={cn(
          'animate-spin rounded-full border-blue-600 border-t-transparent',
          sizeClasses[size],
          className
        )}
        {...props}
      />
    )
  }
)

Spinner.displayName = 'Spinner'

export { Spinner }
