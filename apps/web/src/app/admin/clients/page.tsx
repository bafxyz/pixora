'use client'

import { msg } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { PageLayout } from '@/shared/components/page-layout'

export default function AdminClientsPage() {
  const { _ } = useLingui()

  return (
    <PageLayout
      title={_(msg`Client Management`)}
      description={_(msg`View and manage platform clients`)}
    >
      <div className="space-y-6">
        <div className="text-center py-12 text-slate-500">
          <p>{_(msg`Client management functionality will be added later`)}</p>
        </div>
      </div>
    </PageLayout>
  )
}
