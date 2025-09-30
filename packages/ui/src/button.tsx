import * as React from 'react'
import { cn } from './utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const baseClasses =
      'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&>svg]:pointer-events-none [&>svg]:shrink-0'

    const variantClasses = {
      default:
        'bg-blue-600 text-white shadow hover:bg-blue-700 hover:shadow-md active:bg-blue-800',
      destructive:
        'bg-red-600 text-white shadow hover:bg-red-700 hover:shadow-md active:bg-red-800',
      outline:
        'border-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 active:bg-slate-100',
      secondary:
        'bg-slate-100 text-slate-900 border border-slate-200 hover:bg-slate-200 active:bg-slate-300',
      ghost: 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200',
      link: 'text-blue-600 underline-offset-4 hover:underline hover:text-blue-700',
    }

    const sizeClasses = {
      default: 'h-10 px-4 py-2 gap-2',
      sm: 'h-8 px-3 py-1.5 text-xs gap-1.5',
      lg: 'h-12 px-6 py-3 text-base gap-2.5',
      icon: 'h-10 w-10 p-0',
    }

    return (
      <button
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

Button.displayName = 'Button'

export { Button }
