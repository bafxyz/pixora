'use client'

import { msg, Trans } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Button } from '@repo/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { PageLayout } from '@repo/ui/page-layout'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/select'
// Components not available
// import { Separator, ColorPicker } from '@repo/ui'
import { Camera, CreditCard, Loader2, Mail, Save } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface StudioSettings {
  studioName: string
  contactEmail: string
  contactPhone: string
  contactAddress: string
  brandColor: string
  logoUrl: string
  welcomeMessage: string
  pricing: {
    digital: number
    print: number
    magnet: number
    currency: string
  }
}

export default function StudioAdminSettingsPage() {
  const { _ } = useLingui()
  const [settings, setSettings] = useState<StudioSettings>({
    studioName: '',
    contactEmail: '',
    contactPhone: '',
    contactAddress: '',
    brandColor: '#000000',
    logoUrl: '',
    welcomeMessage: '',
    pricing: {
      digital: 500,
      print: 750,
      magnet: 750,
      currency: 'RUB',
    },
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/studio-admin/settings')
        const data = await response.json()

        if (response.ok) {
          setSettings(data.settings || data)
        } else {
          console.error('Failed to fetch settings:', data.error)
          toast.error(_(msg`Error loading settings`))
        }
      } catch (error) {
        console.error('Error fetching settings:', error)
        toast.error(_(msg`Error loading settings`))
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [_])

  const handleSave = async () => {
    setSaving(true)

    try {
      const response = await fetch('/api/studio-admin/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(_(msg`Settings saved successfully`))
      } else {
        toast.error(data.error || _(msg`Error saving settings`))
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error(_(msg`Error saving settings`))
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setSettings((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handlePricingChange = (
    type: 'digital' | 'print' | 'magnet',
    value: number
  ) => {
    setSettings((prev) => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        [type]: value,
      },
    }))
  }

  const handleCurrencyChange = (currency: string) => {
    setSettings((prev) => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        currency,
      },
    }))
  }

  if (loading) {
    return (
      <PageLayout
        title={_(msg`Studio Settings`)}
        description={_(msg`Configure branding, pricing and general settings`)}
      >
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout
      title={_(msg`Studio Settings`)}
      description={_(msg`Configure branding, pricing and general settings`)}
    >
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex justify-end mb-6">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                <Trans>Saving...</Trans>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                <Trans>Save</Trans>
              </>
            )}
          </Button>
        </div>

        <div className="space-y-8">
          {/* Studio Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5" />
                <Trans>Studio Information</Trans>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="studioName">
                  <Trans>Studio Name</Trans>
                </Label>
                <Input
                  id="studioName"
                  name="studioName"
                  value={settings.studioName}
                  onChange={handleInputChange}
                  placeholder={_(msg`e.g., Photo Studio Pro`)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="welcomeMessage">
                  <Trans>Welcome Message</Trans>
                </Label>
                <Input
                  id="welcomeMessage"
                  name="welcomeMessage"
                  value={settings.welcomeMessage}
                  onChange={handleInputChange}
                  placeholder={_(msg`Message to display on gallery page`)}
                />
              </div>
            </CardContent>
          </Card>

          <div className="border-t my-8"></div>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                <Trans>Contact Information</Trans>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">
                    <Trans>Email</Trans>
                  </Label>
                  <Input
                    id="contactEmail"
                    name="contactEmail"
                    type="email"
                    value={settings.contactEmail}
                    onChange={handleInputChange}
                    placeholder={_(msg`your@email.com`)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPhone">
                    <Trans>Phone</Trans>
                  </Label>
                  <Input
                    id="contactPhone"
                    name="contactPhone"
                    value={settings.contactPhone}
                    onChange={handleInputChange}
                    placeholder={_(msg`+1 (XXX) XXX-XXXX`)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactAddress">
                  <Trans>Address</Trans>
                </Label>
                <Input
                  id="contactAddress"
                  name="contactAddress"
                  value={settings.contactAddress}
                  onChange={handleInputChange}
                  placeholder={_(msg`City, street, building number`)}
                />
              </div>
            </CardContent>
          </Card>

          <div className="border-t my-8"></div>

          <div className="border-t my-8"></div>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                <Trans>Pricing</Trans>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currency">
                  <Trans>Currency</Trans>
                </Label>
                <Select
                  value={settings.pricing.currency}
                  onValueChange={handleCurrencyChange}
                >
                  <SelectTrigger id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RUB">₽ RUB (Рубли)</SelectItem>
                    <SelectItem value="USD">$ USD (Dollars)</SelectItem>
                    <SelectItem value="EUR">€ EUR (Euros)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="digitalPrice">
                    <Trans>Digital Copy Price</Trans>
                  </Label>
                  <Input
                    id="digitalPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={settings.pricing.digital}
                    onChange={(e) =>
                      handlePricingChange(
                        'digital',
                        parseFloat(e.target.value) || 0
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="printPrice">
                    <Trans>Print Copy Price</Trans>
                  </Label>
                  <Input
                    id="printPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={settings.pricing.print}
                    onChange={(e) =>
                      handlePricingChange(
                        'print',
                        parseFloat(e.target.value) || 0
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="magnetPrice">
                    <Trans>Magnet Copy Price</Trans>
                  </Label>
                  <Input
                    id="magnetPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={settings.pricing.magnet}
                    onChange={(e) =>
                      handlePricingChange(
                        'magnet',
                        parseFloat(e.target.value) || 0
                      )
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  )
}
