'use client'

import { msg, Trans } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import {
  Bell,
  Clock,
  Database,
  DollarSign,
  Globe,
  Lock,
  Mail,
  Save,
  Server,
  Shield,
  Zap,
} from 'lucide-react'
import { PageLayout } from '@/shared/components/page-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { Button } from '@repo/ui/button'
import { Badge } from '@repo/ui/badge'
import { useState } from 'react'
import { toast } from 'sonner'

interface SystemConfig {
  // Platform settings
  platformName: string
  supportEmail: string
  maxUploadSize: number
  sessionTimeout: number

  // Pricing
  pricePerPhoto: number
  bulkDiscountThreshold: number
  bulkDiscountPercent: number

  // Features
  enableGuestRegistration: boolean
  enableEmailNotifications: boolean
  enableAnalytics: boolean
  maintenanceMode: boolean

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
    pricePerPhoto: 5,
    bulkDiscountThreshold: 20,
    bulkDiscountPercent: 15,
    enableGuestRegistration: true,
    enableEmailNotifications: true,
    enableAnalytics: true,
    maintenanceMode: false,
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

  const toggleFeature = (key: keyof SystemConfig) => {
    setConfig((prev) => ({ ...prev, [key]: !prev[key] }))
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

        {/* Pricing Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              <Trans>Pricing Settings</Trans>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pricePerPhoto">
                  <Trans>Price per Photo ($)</Trans>
                </Label>
                <Input
                  id="pricePerPhoto"
                  type="number"
                  step="0.01"
                  value={config.pricePerPhoto}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      pricePerPhoto: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bulkDiscountThreshold">
                  <Trans>Bulk Discount Threshold</Trans>
                </Label>
                <Input
                  id="bulkDiscountThreshold"
                  type="number"
                  value={config.bulkDiscountThreshold}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      bulkDiscountThreshold: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bulkDiscountPercent">
                  <Trans>Bulk Discount (%)</Trans>
                </Label>
                <Input
                  id="bulkDiscountPercent"
                  type="number"
                  value={config.bulkDiscountPercent}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      bulkDiscountPercent: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <Trans>
                  Current pricing: ${config.pricePerPhoto}/photo, with{' '}
                  {config.bulkDiscountPercent}% discount for orders of{' '}
                  {config.bulkDiscountThreshold}+ photos
                </Trans>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Feature Toggles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              <Trans>Feature Toggles</Trans>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                className="flex items-center justify-between p-4 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => toggleFeature('enableGuestRegistration')}
              >
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-slate-600" />
                  <div>
                    <p className="font-medium text-slate-800">
                      <Trans>Guest Registration</Trans>
                    </p>
                    <p className="text-xs text-slate-500">
                      <Trans>Allow guests to register accounts</Trans>
                    </p>
                  </div>
                </div>
                <Badge
                  className={
                    config.enableGuestRegistration
                      ? 'bg-green-500'
                      : 'bg-slate-400'
                  }
                >
                  {config.enableGuestRegistration ? (
                    <Trans>ON</Trans>
                  ) : (
                    <Trans>OFF</Trans>
                  )}
                </Badge>
              </div>

              <div
                className="flex items-center justify-between p-4 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => toggleFeature('enableEmailNotifications')}
              >
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-slate-600" />
                  <div>
                    <p className="font-medium text-slate-800">
                      <Trans>Email Notifications</Trans>
                    </p>
                    <p className="text-xs text-slate-500">
                      <Trans>Send email notifications to users</Trans>
                    </p>
                  </div>
                </div>
                <Badge
                  className={
                    config.enableEmailNotifications
                      ? 'bg-green-500'
                      : 'bg-slate-400'
                  }
                >
                  {config.enableEmailNotifications ? (
                    <Trans>ON</Trans>
                  ) : (
                    <Trans>OFF</Trans>
                  )}
                </Badge>
              </div>

              <div
                className="flex items-center justify-between p-4 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => toggleFeature('enableAnalytics')}
              >
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-slate-600" />
                  <div>
                    <p className="font-medium text-slate-800">
                      <Trans>Analytics</Trans>
                    </p>
                    <p className="text-xs text-slate-500">
                      <Trans>Track user behavior and metrics</Trans>
                    </p>
                  </div>
                </div>
                <Badge
                  className={
                    config.enableAnalytics ? 'bg-green-500' : 'bg-slate-400'
                  }
                >
                  {config.enableAnalytics ? (
                    <Trans>ON</Trans>
                  ) : (
                    <Trans>OFF</Trans>
                  )}
                </Badge>
              </div>

              <div
                className="flex items-center justify-between p-4 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => toggleFeature('maintenanceMode')}
              >
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-slate-600" />
                  <div>
                    <p className="font-medium text-slate-800">
                      <Trans>Maintenance Mode</Trans>
                    </p>
                    <p className="text-xs text-slate-500">
                      <Trans>Disable platform for maintenance</Trans>
                    </p>
                  </div>
                </div>
                <Badge
                  className={
                    config.maintenanceMode ? 'bg-red-500' : 'bg-slate-400'
                  }
                >
                  {config.maintenanceMode ? (
                    <Trans>ON</Trans>
                  ) : (
                    <Trans>OFF</Trans>
                  )}
                </Badge>
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
            {isSaving ? <Trans>Saving...</Trans> : <Trans>Save All Changes</Trans>}
          </Button>
        </div>
      </div>
    </PageLayout>
  )
}
