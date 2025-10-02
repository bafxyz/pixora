import * as React from 'react'
import { Label } from './label'
import { cn } from './utils'

interface FormFieldProps {
  label: string
  error?: string
  required?: boolean
  description?: string
  children: React.ReactNode
  className?: string
}

const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  (
    { label, error, required, description, children, className, ...props },
    ref
  ) => {
    return (
      <div ref={ref} className={cn('space-y-2', className)} {...props}>
        <Label className={cn(error && 'text-red-600')}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        {children}
        {description && <p className="text-sm text-slate-600">{description}</p>}
        {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
      </div>
    )
  }
)

FormField.displayName = 'FormField'

export { FormField }
