'use client'

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
import { QRGenerator } from '@/features/qr/components/qr-generator'
import { QRScanner } from '@/features/qr/components/qr-scanner'

interface Guest {
  id: string
  name: string
  email?: string
  photosCount?: number
}

export default function PhotographerPage() {
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

        alert(`Гость ${result.guest.name} успешно добавлен!`)
      } else {
        alert(`Ошибка: ${result.error}`)
      }
    } catch (error) {
      console.error('Error scanning QR:', error)
      alert('Ошибка при сканировании QR-кода')
    }
  }

  const handleQRGenerate = (qrData: string) => {
    console.log('Generated QR:', qrData)
    // Здесь можно сохранить QR в базу данных или показать для печати
  }

  const handleUploadPhotos = (guestId: string) => {
    // Переход к загрузке фото для конкретного гостя
    console.log('Upload photos for guest:', guestId)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Панель фотографа
          </h1>
          <p className="text-gray-600">
            Управляйте гостями и загружайте фотографии
          </p>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="scan" className="flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Сканировать
            </TabsTrigger>
            <TabsTrigger value="generate" className="flex items-center gap-2">
              <QrCode className="w-4 h-4" />
              Создать QR
            </TabsTrigger>
            <TabsTrigger value="guests" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Гости ({scannedGuests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scan" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <QRScanner onScan={handleQRScan} />

              <Card>
                <CardHeader>
                  <CardTitle>Инструкция</CardTitle>
                  <CardDescription>
                    Как сканировать QR-коды гостей
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Шаг 1: Подготовка</h4>
                    <p className="text-sm text-gray-600">
                      Убедитесь, что у вас есть доступ к камере
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Шаг 2: Сканирование</h4>
                    <p className="text-sm text-gray-600">
                      Наведите камеру на QR-код гостя
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Шаг 3: Подтверждение</h4>
                    <p className="text-sm text-gray-600">
                      Система автоматически добавит гостя в список
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
                  <CardTitle>Создание QR-кодов</CardTitle>
                  <CardDescription>
                    Генерируйте QR-коды для новых гостей
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Для чего нужны QR-коды?</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Быстрая идентификация гостей</li>
                      <li>• Автоматическое создание личных галерей</li>
                      <li>• Удобный доступ к фотографиям</li>
                      <li>• Отслеживание заказов</li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Как использовать:</h4>
                    <ol className="text-sm text-gray-600 space-y-1">
                      <li>1. Введите имя гостя</li>
                      <li>2. Нажмите "Сгенерировать"</li>
                      <li>3. Распечатайте или отправьте QR-код</li>
                      <li>4. Гость сможет сканировать его на мероприятии</li>
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
                      Нет отсканированных гостей
                    </h3>
                    <p className="text-gray-600 text-center mb-4">
                      Отсканируйте QR-коды гостей, чтобы добавить их в список
                    </p>
                    <Button onClick={() => setActiveTab('scan')}>
                      Начать сканирование
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
                            {guest.email || 'Email не указан'}
                          </p>
                          <p className="text-xs text-gray-500">
                            Фото: {guest.photosCount || 0}
                          </p>
                        </div>
                      </div>

                      <Button
                        onClick={() => handleUploadPhotos(guest.id)}
                        size="sm"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Загрузить фото
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
