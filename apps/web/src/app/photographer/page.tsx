'use client'

import { useLingui } from '@lingui/react'
import { Trans } from '@lingui/react/macro'
import { Button } from '@repo/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs'
import { Camera, QrCode, Upload, Users } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { QRGenerator } from '@/features/qr/components/qr-generator'
import { QRScanner } from '@/features/qr/components/qr-scanner'

interface Guest {
  id: string
  name: string
  email?: string
  photosCount?: number
}

export default function PhotographerPage() {
  const { _ } = useLingui()
  const [scannedGuests, setScannedGuests] = useState<Guest[]>([])
  const [activeTab, setActiveTab] = useState('scan')

  const handleQRScan = async (qrData: string) => {
    try {
      const response = await fetch('/api/qr/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qrData }),
      })

      const result = await response.json()

      if (result.success) {
        // Добавляем гостя в список отсканированных
        const newGuest: Guest = {
          id: result.guest.id,
          name: result.guest.name,
          email: result.guest.email,
          photosCount: 0,
        }

        setScannedGuests((prev) => {
          // Проверяем, не добавлен ли уже этот гость
          if (prev.find((g) => g.id === newGuest.id)) {
            return prev
          }
          return [...prev, newGuest]
        })

        toast.success(_(`Guest ${result.guest.name} successfully added!`))
      } else {
        toast.error(_(`Error: ${result.error}`))
      }
    } catch (error) {
      console.error('Error scanning QR:', error)
      toast.error(_('Error scanning QR code'))
    }
  }

  const handleQRGenerate = (qrData: {
    id: string
    name: string
    type: string
    timestamp: string
  }) => {
    console.log('Generated QR:', qrData)
    // Здесь можно сохранить QR в базу данных или показать для печати
  }

  const handleUploadPhotos = (guestId: string) => {
    // Переход к загрузке фото для конкретного гостя
    console.log('Upload photos for guest:', guestId)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900">
      <div className="container mx-auto px-4 py-6 lg:py-8">
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">
            <Trans>Event Management</Trans>
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
            <Trans>Manage guests and upload photos</Trans>
          </p>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-3 h-12 p-1 bg-white/80 backdrop-blur-md border border-white/30 shadow-lg">
            <TabsTrigger
              value="scan"
              className="flex items-center gap-2 font-medium text-slate-600 hover:text-slate-800 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 rounded-md"
            >
              <Camera className="w-4 h-4" />
              <Trans>Scan</Trans>
            </TabsTrigger>
            <TabsTrigger
              value="generate"
              className="flex items-center gap-2 font-medium text-slate-600 hover:text-slate-800 data-[state=active]:bg-gradient-to-r data-[state=active]:from-secondary data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 rounded-md"
            >
              <QrCode className="w-4 h-4" />
              <Trans>Create QR</Trans>
            </TabsTrigger>
            <TabsTrigger
              value="guests"
              className="flex items-center gap-2 font-medium text-slate-600 hover:text-slate-800 data-[state=active]:bg-gradient-to-r data-[state=active]:from-accent data-[state=active]:to-amber-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 rounded-md"
            >
              <Users className="w-4 h-4" />
              <Trans>Guests</Trans> ({scannedGuests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scan" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <QRScanner onScan={handleQRScan} />

              <Card>
                <CardHeader>
                  <CardTitle>
                    <Trans>Instructions</Trans>
                  </CardTitle>
                  <CardDescription>
                    <Trans>How to scan guest QR codes</Trans>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">
                      <Trans>Step 1: Preparation</Trans>
                    </h4>
                    <p className="text-sm text-gray-600">
                      <Trans>Make sure you have camera access</Trans>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">
                      <Trans>Step 2: Scanning</Trans>
                    </h4>
                    <p className="text-sm text-gray-600">
                      <Trans>Point camera at guest QR code</Trans>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">
                      <Trans>Step 3: Confirmation</Trans>
                    </h4>
                    <p className="text-sm text-gray-600">
                      <Trans>System will automatically add guest to list</Trans>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="generate" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <QRGenerator onGenerate={handleQRGenerate} />

              <Card>
                <CardHeader>
                  <CardTitle>
                    <Trans>QR Code Creation</Trans>
                  </CardTitle>
                  <CardDescription>
                    <Trans>Generate QR codes for new guests</Trans>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">
                      <Trans>Why do we need QR codes?</Trans>
                    </h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>
                        • <Trans>Fast guest identification</Trans>
                      </li>
                      <li>
                        • <Trans>Automatic personal gallery creation</Trans>
                      </li>
                      <li>
                        • <Trans>Convenient photo access</Trans>
                      </li>
                      <li>
                        • <Trans>Order tracking</Trans>
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">
                      <Trans>How to use</Trans>:
                    </h4>
                    <ol className="text-sm text-gray-600 space-y-1">
                      <li>
                        1. <Trans>Enter guest name</Trans>
                      </li>
                      <li>
                        2. <Trans>Click Generate</Trans>
                      </li>
                      <li>
                        3. <Trans>Print or send QR code</Trans>
                      </li>
                      <li>
                        4. <Trans>Guest can scan it at the event</Trans>
                      </li>
                    </ol>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="guests" className="space-y-6">
            <div className="grid gap-4">
              {scannedGuests.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Users className="w-12 h-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      <Trans>No scanned guests</Trans>
                    </h3>
                    <p className="text-gray-600 text-center mb-4">
                      <Trans>Scan guest QR codes to add them to the list</Trans>
                    </p>
                    <Button
                      onClick={() => setActiveTab('scan')}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Trans>Start Scanning</Trans>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                scannedGuests.map((guest) => (
                  <Card key={guest.id}>
                    <CardContent className="flex items-center justify-between p-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {guest.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {guest.email || <Trans>Email not specified</Trans>}
                          </p>
                          <p className="text-xs text-gray-500">
                            <Trans>Photos</Trans>: {guest.photosCount || 0}
                          </p>
                        </div>
                      </div>

                      <Button
                        onClick={() => handleUploadPhotos(guest.id)}
                        size="sm"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        <Trans>Upload Photos</Trans>
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
