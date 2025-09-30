'use client'

import { msg } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { BarChart, Camera, TrendingUp, Users } from 'lucide-react'
import { PageLayout } from '@/shared/components/page-layout'

export default function AdminStatsPage() {
  const { _ } = useLingui()
  return (
    <PageLayout
      title={_(msg`Platform Statistics`)}
      description={_(msg`Overall statistics for all studios and users`)}
      action={{
        label: _(msg`Export Report`),
        onClick: () => alert('Export report functionality to be implemented'),
        icon: <BarChart className="w-4 h-4" />,
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-primary/5 rounded-lg p-6 border border-primary/20">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {_(msg`Users`)}
              </p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                -
              </p>
            </div>
          </div>
        </div>

        <div className="bg-secondary/5 rounded-lg p-6 border border-secondary/20">
          <div className="flex items-center gap-3">
            <Camera className="w-8 h-8 text-secondary" />
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {_(msg`Studios`)}
              </p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                -
              </p>
            </div>
          </div>
        </div>

        <div className="bg-accent/5 rounded-lg p-6 border border-accent/20">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-accent" />
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {_(msg`Revenue`)}
              </p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                -
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="text-center py-12 text-slate-500">
          <p>{_(msg`Detailed statistics will be added later`)}</p>
        </div>
      </div>
    </PageLayout>
  )
}
