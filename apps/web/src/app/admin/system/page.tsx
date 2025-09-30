'use client'

import { msg } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Settings } from 'lucide-react'
import { PageLayout } from '@/shared/components/page-layout'

export default function AdminSystemPage() {
  const { _ } = useLingui()

  return (
    <PageLayout
      title={_(msg`System Settings`)}
      description={_(msg`Configure platform settings, pricing and features`)}
      action={{
        label: _(msg`Configure System`),
        onClick: () =>
          alert('System configuration functionality to be implemented'),
        icon: <Settings className="w-4 h-4" />,
      }}
    >
      <div className="space-y-6">
        <div className="text-center py-12 text-slate-500">
          <p>{_(msg`System configuration will be added later`)}</p>
        </div>
      </div>
    </PageLayout>
  )
}
