'use client'

import { Button } from '@repo/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/card'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { Download, QrCode } from 'lucide-react'
import { useState } from 'react'

interface QRGeneratorProps {
  guestId?: string
  onGenerate?: (qrData: string) => void
}

export function QRGenerator({ guestId, onGenerate }: QRGeneratorProps) {
  const [guestName, setGuestName] = useState('')
  const [qrData, setQrData] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const generateQR = async () => {
    if (!guestName.trim()) return

    setIsGenerating(true)

    try {
      // Создаем уникальный ID для гостя
      const uniqueId =
        guestId ||
        `guest-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`

      // Данные для QR-кода
      const qrPayload = {
        id: uniqueId,
        name: guestName,
        type: 'guest',
        timestamp: new Date().toISOString(),
      }

      const qrString = JSON.stringify(qrPayload)
      setQrData(qrString)

      if (onGenerate) {
        onGenerate(qrString)
      }
    } catch (error) {
      console.error('Error generating QR:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadQR = () => {
    if (!qrData) return

    // Создаем ссылку для скачивания
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Здесь можно интегрировать библиотеку для генерации QR (например, qrcode)
    // Пока просто создаем текстовый файл
    const blob = new Blob([qrData], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `qr-${guestName || 'guest'}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="w-5 h-5" />
          Генератор QR-кодов
        </CardTitle>
        <CardDescription>Создайте QR-код для гостя фото-сессии</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="guestName">Имя гостя</Label>
          <Input
            id="guestName"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder="Введите имя гостя"
          />
        </div>

        <Button
          onClick={generateQR}
          disabled={!guestName.trim() || isGenerating}
          className="w-full"
        >
          {isGenerating ? 'Генерируем...' : 'Сгенерировать QR-код'}
        </Button>

        {qrData && (
          <div className="space-y-2">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 break-all">{qrData}</p>
            </div>

            <Button onClick={downloadQR} variant="outline" className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Скачать QR-данные
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
