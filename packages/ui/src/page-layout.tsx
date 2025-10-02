import { Plus } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from './button'

interface PageLayoutProps {
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    icon?: ReactNode
    disabled?: boolean
  }
  children: ReactNode
}

export const PageLayout = ({
  title,
  description,
  action,
  children,
}: PageLayoutProps) => {
  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
            {title}
          </h1>
          {description && (
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              {description}
            </p>
          )}
        </div>

        {action && (
          <Button
            onClick={action.onClick}
            disabled={action.disabled}
            className="flex items-center gap-2"
          >
            {action.icon || <Plus className="w-4 h-4" />}
            {action.label}
          </Button>
        )}
      </div>

      <div className="bg-card rounded-lg border shadow-sm p-6">{children}</div>
    </div>
  )
}
