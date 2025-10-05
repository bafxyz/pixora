'use client'

import { msg, Trans } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Button } from '@repo/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'
import { Dropzone } from '@repo/ui/dropzone'
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
import {
  Camera,
  CreditCard,
  Loader2,
  Mail,
  Save,
  Upload,
  X,
} from 'lucide-react'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/shared/lib/supabase/client'

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
    enableDigital: boolean
    enablePrint: boolean
    enableMagnet: boolean
  }
}

export default function StudioAdminSettingsPage() {
  const { _ } = useLingui()
  const supabase = createClient()
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
      enableDigital: true,
      enablePrint: true,
      enableMagnet: true,
    },
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/studio-admin/settings')
        const data = await response.json()

        if (response.ok) {
          const settingsData = data.settings || data
          setSettings(settingsData)
          if (settingsData.logoUrl) {
            setLogoPreview(settingsData.logoUrl)
          }
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

  const handleLogoUpload = async (files: File[]) => {
    if (files.length === 0) return

    const file = files[0]
    if (!file) return

    setUploadingLogo(true)

    try {
      // Get studio ID from settings API
      const settingsResponse = await fetch('/api/studio-admin/settings')
      const settingsData = await settingsResponse.json()
      const studioId = settingsData.studioId

      if (!studioId) {
        throw new Error('Studio ID not found')
      }

      // Create file name
      const fileExt = file.name.split('.').pop() || 'png'
      const fileName = `logos/${studioId}/logo-${Date.now()}.${fileExt}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(fileName, file as File, {
          cacheControl: '3600',
          upsert: true,
        })

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('photos')
        .getPublicUrl(fileName)

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get public URL')
      }

      // Update settings with new logo URL
      setSettings((prev) => ({
        ...prev,
        logoUrl: urlData.publicUrl,
      }))
      setLogoPreview(urlData.publicUrl)
      toast.success(_(msg`Logo uploaded successfully`))
    } catch (error) {
      console.error('Logo upload error:', error)
      toast.error(
        error instanceof Error ? error.message : _(msg`Failed to upload logo`)
      )
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleRemoveLogo = () => {
    setSettings((prev) => ({
      ...prev,
      logoUrl: '',
    }))
    setLogoPreview(null)
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

          {/* Branding */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5" />
                <Trans>Branding</Trans>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="brandColor">
                  <Trans>Brand Color</Trans>
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="brandColor"
                    name="brandColor"
                    type="color"
                    value={settings.brandColor}
                    onChange={handleInputChange}
                    className="w-20 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={settings.brandColor}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        brandColor: e.target.value,
                      }))
                    }
                    placeholder="#000000"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>
                  <Trans>Logo</Trans>
                </Label>
                {settings.logoUrl || logoPreview ? (
                  <div className="space-y-3">
                    <div className="relative w-48 h-48 bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
                      <Image
                        src={logoPreview || settings.logoUrl}
                        alt="Studio Logo"
                        fill
                        className="object-contain p-4"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRemoveLogo}
                        disabled={uploadingLogo}
                      >
                        <X className="w-4 h-4 mr-2" />
                        <Trans>Remove Logo</Trans>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          handleRemoveLogo()
                        }}
                        disabled={uploadingLogo}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        <Trans>Change Logo</Trans>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Dropzone
                    onFilesSelected={handleLogoUpload}
                    accept="image/*"
                    multiple={false}
                    maxSize={5 * 1024 * 1024}
                    disabled={uploadingLogo}
                  >
                    <div className="flex flex-col items-center justify-center p-6 text-center">
                      {uploadingLogo ? (
                        <>
                          <Loader2 className="w-8 h-8 text-gray-400 mx-auto mb-2 animate-spin" />
                          <p className="text-gray-600 mb-2">
                            <Trans>Uploading logo...</Trans>
                          </p>
                        </>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-600 mb-2">
                            <Trans>
                              Drag & drop logo here or click to select
                            </Trans>
                          </p>
                          <p className="text-sm text-gray-500 mb-2">
                            <Trans>Upload your studio logo</Trans>
                          </p>
                          <div className="text-xs text-gray-400 space-y-1">
                            <p>
                              <Trans>Accepts: PNG, JPG, SVG</Trans>
                            </p>
                            <p>
                              <Trans>Max size: 5MB</Trans>
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </Dropzone>
                )}
              </div>
            </CardContent>
          </Card>

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
                    <SelectValue>
                      {settings.pricing.currency === 'RUB' && '₽ RUB (Рубли)'}
                      {settings.pricing.currency === 'USD' && '$ USD (Dollars)'}
                      {settings.pricing.currency === 'EUR' && '€ EUR (Euros)'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RUB">₽ RUB (Рубли)</SelectItem>
                    <SelectItem value="USD">$ USD (Dollars)</SelectItem>
                    <SelectItem value="EUR">€ EUR (Euros)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="enableDigital"
                        checked={settings.pricing.enableDigital}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            pricing: {
                              ...prev.pricing,
                              enableDigital: e.target.checked,
                            },
                          }))
                        }
                        className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2"
                      />
                      <Label htmlFor="enableDigital" className="cursor-pointer">
                        <Trans>Enable Digital Copy</Trans>
                      </Label>
                    </div>
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
                        disabled={!settings.pricing.enableDigital}
                        onChange={(e) =>
                          handlePricingChange(
                            'digital',
                            parseFloat(e.target.value) || 0
                          )
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="enablePrint"
                        checked={settings.pricing.enablePrint}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            pricing: {
                              ...prev.pricing,
                              enablePrint: e.target.checked,
                            },
                          }))
                        }
                        className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2"
                      />
                      <Label htmlFor="enablePrint" className="cursor-pointer">
                        <Trans>Enable Print</Trans>
                      </Label>
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
                        disabled={!settings.pricing.enablePrint}
                        onChange={(e) =>
                          handlePricingChange(
                            'print',
                            parseFloat(e.target.value) || 0
                          )
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="enableMagnet"
                        checked={settings.pricing.enableMagnet}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            pricing: {
                              ...prev.pricing,
                              enableMagnet: e.target.checked,
                            },
                          }))
                        }
                        className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2"
                      />
                      <Label htmlFor="enableMagnet" className="cursor-pointer">
                        <Trans>Enable Magnet</Trans>
                      </Label>
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
                        disabled={!settings.pricing.enableMagnet}
                        onChange={(e) =>
                          handlePricingChange(
                            'magnet',
                            parseFloat(e.target.value) || 0
                          )
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  )
}
