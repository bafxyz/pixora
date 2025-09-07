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
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { Download, QrCode } from 'lucide-react'
import { useState } from 'react'
import QRCode from 'react-qr-code'
import {
  type QRData,
  qrDataSchema,
} from '@/shared/lib/validations/auth.schemas'

interface QRGeneratorProps {
  guestId?: string
  onGenerate?: (qrData: QRData) => void
}

export function QRGenerator({ guestId, onGenerate }: QRGeneratorProps) {
  const { _ } = useLingui()
  const [guestName, setGuestName] = useState('')
  const [qrData, setQrData] = useState<QRData | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const generateQR = async () => {
    if (!guestName.trim()) return

    setIsGenerating(true)

    try {
      // Create unique ID for guest
      const uniqueId =
        guestId ||
        `guest-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`

      // Data for QR code
      const qrPayload: QRData = {
        id: uniqueId,
        name: guestName.trim(),
        type: 'guest',
        timestamp: new Date().toISOString(),
      }

      // Validate data
      const validationResult = qrDataSchema.safeParse(qrPayload)
      if (!validationResult.success) {
        console.error('Invalid QR data:', validationResult.error.issues)
        const errorMessages = validationResult.error.issues
          .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
          .join('\n')
        alert(`QR code validation errors:\n${errorMessages}`)
        return
      }

      setQrData(qrPayload)

      if (onGenerate) {
        onGenerate(qrPayload)
      }
    } catch (error) {
      console.error('Error generating QR:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadQR = () => {
    if (!qrData) return

    // Create canvas for QR code
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const size = 256
    canvas.width = size
    canvas.height = size

    // Create QR code on canvas
    const qrCanvas = document.querySelector('canvas') as HTMLCanvasElement
    if (qrCanvas) {
      ctx.drawImage(qrCanvas, 0, 0, size, size)

      // Download as image
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `qr-${qrData.name || 'guest'}.png`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
        }
      })
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="w-5 h-5" />
          <Trans>QR Code Generator</Trans>
        </CardTitle>
        <CardDescription>
          <Trans>Create QR code for photo session guest</Trans>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="guestName">
            <Trans>Guest Name</Trans>
          </Label>
          <Input
            id="guestName"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder={_('Enter guest name')}
          />
        </div>

        <Button
          onClick={generateQR}
          disabled={!guestName.trim() || isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <Trans>Generating...</Trans>
          ) : (
            <Trans>Generate QR Code</Trans>
          )}
        </Button>

        {qrData && (
          <div className="space-y-4">
            <div className="flex justify-center p-4 bg-white rounded-lg border">
              <QRCode
                value={JSON.stringify(qrData)}
                size={200}
                style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
              />
            </div>

            <div className="space-y-2">
              <Button onClick={downloadQR} variant="outline" className="w-full">
                <Download className="w-4 h-4 mr-2" />
                <Trans>Download QR Code</Trans>
              </Button>

              <details className="text-xs">
                <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                  <Trans>Show QR Code Data</Trans>
                </summary>
                <div className="mt-2 p-2 bg-gray-50 rounded text-xs break-all">
                  {JSON.stringify(qrData, null, 2)}
                </div>
              </details>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
