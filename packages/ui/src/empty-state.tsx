import * as React from 'react'
import { Button } from './button'
import { cn } from './utils'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    variant?:
      | 'default'
      | 'destructive'
      | 'outline'
      | 'secondary'
      | 'ghost'
      | 'link'
  }
  className?: string
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ icon, title, description, action, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col items-center justify-center py-16 text-center',
          className
        )}
        {...props}
      >
        {icon && (
          <div className="w-16 h-16 text-gray-300 mx-auto mb-4 flex items-center justify-center">
            {icon}
          </div>
        )}
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
          {title}
        </h3>
        {description && (
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
            {description}
          </p>
        )}
        {action && (
          <Button
            onClick={action.onClick}
            variant={action.variant || 'default'}
          >
            {action.label}
          </Button>
        )}
      </div>
    )
  }
)

EmptyState.displayName = 'EmptyState'

export { EmptyState }
