import * as React from 'react'
import { cn } from './utils'

interface PageHeaderProps {
  title: string | React.ReactNode
  description?: string | React.ReactNode
  className?: string
}

export const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ title, description, className }, ref) => {
    return (
      <div ref={ref} className={cn('mb-6', className)}>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">
          {title}
        </h2>
        {description && (
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
            {description}
          </p>
        )}
      </div>
    )
  }
)

PageHeader.displayName = 'PageHeader'
