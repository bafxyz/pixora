import * as React from 'react'
import { Card, CardContent } from './card'
import { cn } from './utils'
import type { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  gradient: string
  className?: string
}

export const StatsCard = React.forwardRef<HTMLDivElement, StatsCardProps>(
  ({ title, value, icon: Icon, gradient, className }, ref) => {
    return (
      <Card
        ref={ref}
        className={cn(
          'bg-white/70 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300',
          className
        )}
      >
        <CardContent className="p-4 sm:p-5 lg:p-6">
          <div className="flex items-center gap-3 lg:gap-4">
            <div
              className={cn(
                'w-10 h-10 lg:w-12 lg:h-12 rounded-lg flex items-center justify-center flex-shrink-0',
                gradient
              )}
            >
              <Icon className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs lg:text-sm font-medium text-slate-600 truncate mb-0.5">
                {title}
              </p>
              <p className="text-xl lg:text-2xl font-bold text-slate-800 truncate">
                {value}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }
)

StatsCard.displayName = 'StatsCard'
