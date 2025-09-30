'use client'

import { msg } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Activity, AlertCircle, CheckCircle, Download } from 'lucide-react'
import { PageLayout } from '@/shared/components/page-layout'

export default function AdminMonitoringPage() {
  const { _ } = useLingui()
  return (
    <PageLayout
      title={_(msg`Monitoring & Logs`)}
      description={_(msg`System monitoring and log viewer`)}
      action={{
        label: _(msg`Download Logs`),
        onClick: () => alert('Download logs functionality to be implemented'),
        icon: <Download className="w-4 h-4" />,
      }}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <p className="text-sm text-green-700">
                  {_(msg`System Status`)}
                </p>
                <p className="font-semibold text-green-800">
                  {_(msg`Operational`)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Activity className="w-6 h-6 text-blue-600" />
              <div>
                <p className="text-sm text-blue-700">{_(msg`CPU Load`)}</p>
                <p className="font-semibold text-blue-800">-</p>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-orange-600" />
              <div>
                <p className="text-sm text-orange-700">{_(msg`Warnings`)}</p>
                <p className="font-semibold text-orange-800">0</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center py-12 text-slate-500">
          <p>{_(msg`Monitoring interface will be added later`)}</p>
        </div>
      </div>
    </PageLayout>
  )
}
