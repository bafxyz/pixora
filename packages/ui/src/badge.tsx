import * as React from 'react'
import { cn } from './utils'

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variantClasses = {
      default: 'bg-blue-100 text-blue-700 border-blue-200',
      secondary: 'bg-slate-100 text-slate-700 border-slate-200',
      destructive: 'bg-red-100 text-red-700 border-red-200',
      outline: 'border-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
    }

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-all duration-200',
          variantClasses[variant],
          className
        )}
        {...props}
      />
    )
  }
)

Badge.displayName = 'Badge'

export { Badge }
