import * as React from 'react'
import { cn } from './utils'

interface PageContainerProps {
  children: React.ReactNode
  className?: string
}

export const PageContainer = React.forwardRef<HTMLDivElement, PageContainerProps>(
  ({ children, className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900',
          className
        )}
      >
        <div className="container mx-auto px-4 py-6 lg:py-8">{children}</div>
      </div>
    )
  }
)

PageContainer.displayName = 'PageContainer'
