'use client'

import { Button } from '@repo/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { PageLayout } from '@repo/ui/page-layout'
// Components not available
// import { Separator, ColorPicker } from '@repo/ui'
import { Camera, CreditCard, Loader2, Mail, Palette, Save } from 'lucide-react'
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
  }
}

export default function StudioAdminSettingsPage() {
  const [settings, setSettings] = useState<StudioSettings>({
    studioName: '',
    contactEmail: '',
    contactPhone: '',
    contactAddress: '',
    brandColor: '#000000',
    logoUrl: '',
    welcomeMessage: '',
    pricing: {
      digital: 25,
      print: 50,
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
          toast.error('Ошибка при загрузке настроек')
        }
      } catch (error) {
        console.error('Error fetching settings:', error)
        toast.error('Ошибка при загрузке настроек')
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

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
        toast.success('Настройки сохранены успешно')
      } else {
        toast.error(data.error || 'Ошибка при сохранении настроек')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Ошибка при сохранении настроек')
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

  const handlePricingChange = (type: 'digital' | 'print', value: number) => {
    setSettings((prev) => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        [type]: value,
      },
    }))
  }

  if (loading) {
    return (
      <PageLayout
        title="Настройки студии"
        description="Настройка брендинга, цен и общих параметров"
      >
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout
      title="Настройки студии"
      description="Настройка брендинга, цен и общих параметров"
    >
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex justify-end mb-6">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Сохранение...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Сохранить
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
                Информация о студии
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="studioName">Название студии</Label>
                <Input
                  id="studioName"
                  name="studioName"
                  value={settings.studioName}
                  onChange={handleInputChange}
                  placeholder="Например: Photo Studio Pro"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="welcomeMessage">Приветственное сообщение</Label>
                <Input
                  id="welcomeMessage"
                  name="welcomeMessage"
                  value={settings.welcomeMessage}
                  onChange={handleInputChange}
                  placeholder="Сообщение для отображения на странице галереи"
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
                Контактная информация
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Email</Label>
                  <Input
                    id="contactEmail"
                    name="contactEmail"
                    type="email"
                    value={settings.contactEmail}
                    onChange={handleInputChange}
                    placeholder="your@email.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Телефон</Label>
                  <Input
                    id="contactPhone"
                    name="contactPhone"
                    value={settings.contactPhone}
                    onChange={handleInputChange}
                    placeholder="+7 (XXX) XXX-XXXX"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactAddress">Адрес</Label>
                <Input
                  id="contactAddress"
                  name="contactAddress"
                  value={settings.contactAddress}
                  onChange={handleInputChange}
                  placeholder="Город, улица, номер дома"
                />
              </div>
            </CardContent>
          </Card>

          <div className="border-t my-8"></div>

          {/* Branding */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Брендинг
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="logoUrl">URL логотипа</Label>
                <Input
                  id="logoUrl"
                  name="logoUrl"
                  value={settings.logoUrl}
                  onChange={handleInputChange}
                  placeholder="https://example.com/logo.png"
                />
              </div>

              <div className="space-y-2">
                <Label>Цвет бренда</Label>
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    value={settings.brandColor}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        brandColor: e.target.value,
                      }))
                    }
                    className="w-10 h-10 border border-slate-300 rounded cursor-pointer"
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {settings.brandColor}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="border-t my-8"></div>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Цены
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="digitalPrice">
                    Цена за цифровую копию ($)
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
                  <Label htmlFor="printPrice">Цена за печатную копию ($)</Label>
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
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  )
}
