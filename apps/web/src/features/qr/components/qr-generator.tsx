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
import { Copy, Download, QrCode } from 'lucide-react'
import { useState } from 'react'
import QRCode from 'react-qr-code'
import { toast } from 'sonner'
import {
  type QRData,
  qrDataSchema,
} from '@/shared/lib/validations/auth.schemas'

interface Guest {
  id: string
  name: string
  email: string | null
  photosCount: number
}

interface QRGeneratorProps {
  guestId?: string
  onGenerate?: (qrData: QRData) => void
  onGuestCreated?: (guest: Guest) => void
}

export function QRGenerator({
  guestId: _guestId,
  onGenerate,
  onGuestCreated,
}: QRGeneratorProps) {
  const { _ } = useLingui()
  const [guestName, setGuestName] = useState('')
  const [qrData, setQrData] = useState<QRData | null>(null)
  const [createdGuest, setCreatedGuest] = useState<Guest | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const generateQR = async () => {
    if (!guestName.trim()) return

    setIsGenerating(true)

    try {
      // First, create guest in database
      // Try photographer endpoint first, fallback to studio-admin
      let response = await fetch('/api/photographer/guests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: guestName.trim(),
        }),
      })

      // If photographer endpoint doesn't exist, try studio-admin
      if (response.status === 404) {
        response = await fetch('/api/studio-admin/guests', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: guestName.trim(),
          }),
        })
      }

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create guest')
      }

      const result = await response.json()
      const guest = result.guest as Guest

      // Data for QR code using the real guest ID
      const qrPayload: QRData = {
        id: guest.id,
        name: guest.name,
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
        toast.error(`QR code validation errors: ${errorMessages}`)
        return
      }

      setQrData(qrPayload)
      setCreatedGuest(guest)

      toast.success(_(`Guest ${guest.name} created successfully!`))

      if (onGenerate) {
        onGenerate(qrPayload)
      }

      if (onGuestCreated) {
        onGuestCreated(guest)
      }
    } catch (error) {
      console.error('Error generating QR:', error)
      toast.error(
        error instanceof Error ? error.message : 'Error creating guest'
      )
    } finally {
      setIsGenerating(false)
    }
  }

  const copyGuestId = async () => {
    if (!createdGuest) return

    try {
      await navigator.clipboard.writeText(createdGuest.id)
      toast.success(_('Guest ID copied to clipboard!'))
    } catch (error) {
      console.error('Failed to copy Guest ID:', error)
      toast.error(_('Failed to copy Guest ID'))
    }
  }

  const resetForm = () => {
    setGuestName('')
    setQrData(null)
    setCreatedGuest(null)
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
          className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <Trans>Generating...</Trans>
          ) : (
            <Trans>Generate QR Code</Trans>
          )}
        </Button>

        {qrData && createdGuest && (
          <div className="space-y-4">
            {/* Guest Info */}
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">
                <Trans>Guest Created Successfully!</Trans>
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">
                    <Trans>Name:</Trans>
                  </span>
                  <span className="font-medium">{createdGuest.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">
                    <Trans>Guest ID:</Trans>
                  </span>
                  <div className="flex items-center gap-2">
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                      {createdGuest.id}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={copyGuestId}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* QR Code */}
            <div className="flex justify-center p-4 bg-white rounded-lg border">
              <QRCode
                value={JSON.stringify(qrData)}
                size={200}
                style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
              />
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button onClick={downloadQR} variant="outline" className="w-full">
                <Download className="w-4 h-4 mr-2" />
                <Trans>Download QR Code</Trans>
              </Button>

              <Button onClick={resetForm} variant="outline" className="w-full">
                <Trans>Create Another Guest</Trans>
              </Button>

              <div className="text-center text-sm text-gray-600 space-y-1">
                <p>
                  <Trans>Now you can upload photos for this guest!</Trans>
                </p>
                <p className="text-xs">
                  <Trans>Go to Upload tab and use Guest ID:</Trans>{' '}
                  <code className="bg-gray-100 px-1 rounded">
                    {createdGuest.id}
                  </code>
                </p>
              </div>
            </div>

            <details className="text-xs">
              <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                <Trans>Show QR Code Data</Trans>
              </summary>
              <div className="mt-2 p-2 bg-gray-50 rounded text-xs break-all">
                {JSON.stringify(qrData, null, 2)}
              </div>
            </details>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
