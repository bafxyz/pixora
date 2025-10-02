'use client'

import { msg, Trans } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Button } from '@repo/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { PageLayout } from '@repo/ui/page-layout'
import { Database, Globe, Save, Server } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface SystemConfig {
  // Platform settings
  platformName: string
  supportEmail: string
  maxUploadSize: number
  sessionTimeout: number

  // Storage
  storageProvider: string
  maxStoragePerClient: number
  autoCleanupDays: number
}

export default function AdminSystemPage() {
  const { _ } = useLingui()
  const [config, setConfig] = useState<SystemConfig>({
    platformName: 'Pixora',
    supportEmail: 'support@pixora.com',
    maxUploadSize: 10,
    sessionTimeout: 30,
    storageProvider: 'Supabase Storage',
    maxStoragePerClient: 1000,
    autoCleanupDays: 90,
  })
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast.success(_(msg`System settings saved successfully`))
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error(_(msg`Failed to save settings`))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <PageLayout
      title={_(msg`System Settings`)}
      description={_(msg`Configure platform settings, pricing and features`)}
      action={{
        label: _(msg`Save Changes`),
        onClick: handleSave,
        icon: <Save className="w-4 h-4" />,
        disabled: isSaving,
      }}
    >
      <div className="space-y-6">
        {/* Platform Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              <Trans>Platform Configuration</Trans>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="platformName">
                  <Trans>Platform Name</Trans>
                </Label>
                <Input
                  id="platformName"
                  value={config.platformName}
                  onChange={(e) =>
                    setConfig({ ...config, platformName: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supportEmail">
                  <Trans>Support Email</Trans>
                </Label>
                <Input
                  id="supportEmail"
                  type="email"
                  value={config.supportEmail}
                  onChange={(e) =>
                    setConfig({ ...config, supportEmail: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxUploadSize">
                  <Trans>Max Upload Size (MB)</Trans>
                </Label>
                <Input
                  id="maxUploadSize"
                  type="number"
                  value={config.maxUploadSize}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      maxUploadSize: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">
                  <Trans>Session Timeout (minutes)</Trans>
                </Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  value={config.sessionTimeout}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      sessionTimeout: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Storage Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              <Trans>Storage Configuration</Trans>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="storageProvider">
                  <Trans>Storage Provider</Trans>
                </Label>
                <Input
                  id="storageProvider"
                  value={config.storageProvider}
                  disabled
                  className="bg-slate-100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxStoragePerClient">
                  <Trans>Max Storage per Client (GB)</Trans>
                </Label>
                <Input
                  id="maxStoragePerClient"
                  type="number"
                  value={config.maxStoragePerClient}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      maxStoragePerClient: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="autoCleanupDays">
                  <Trans>Auto Cleanup After (days)</Trans>
                </Label>
                <Input
                  id="autoCleanupDays"
                  type="number"
                  value={config.autoCleanupDays}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      autoCleanupDays: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-5 h-5" />
              <Trans>System Information</Trans>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-600 mb-1">
                  <Trans>Platform Version</Trans>
                </p>
                <p className="text-lg font-semibold text-slate-800">v1.0.0</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-600 mb-1">
                  <Trans>Database</Trans>
                </p>
                <p className="text-lg font-semibold text-slate-800">
                  PostgreSQL
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-600 mb-1">
                  <Trans>Last Updated</Trans>
                </p>
                <p className="text-lg font-semibold text-slate-800">
                  {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="px-8"
            size="lg"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? (
              <Trans>Saving...</Trans>
            ) : (
              <Trans>Save All Changes</Trans>
            )}
          </Button>
        </div>
      </div>
    </PageLayout>
  )
}
