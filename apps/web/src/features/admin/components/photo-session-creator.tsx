'use client'

import { useLingui } from '@lingui/react'
import { Trans } from '@lingui/macro'
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
import { Textarea } from '@repo/ui/textarea'
import { Calendar, Plus, QrCode } from 'lucide-react'
import { useState } from 'react'
import QRCode from 'react-qr-code'
import { toast } from 'sonner'

interface PhotoSession {
  id: string
  name: string
  description?: string
  status: string
  scheduledAt?: string
  createdAt: string
  photographer: {
    id: string
    name: string
    email: string
  }
  guestCount: number
  photoCount: number
}

interface PhotoSessionCreatorProps {
  onSessionCreated?: (session: PhotoSession) => void
}

export function PhotoSessionCreator({
  onSessionCreated,
}: PhotoSessionCreatorProps) {
  const { _ } = useLingui()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [createdSession, setCreatedSession] = useState<PhotoSession | null>(
    null
  )
  const [showQR, setShowQR] = useState(false)

  const createSession = async () => {
    if (!name.trim()) {
      toast.error(_('Session name is required'))
      return
    }

    setIsCreating(true)

    try {
      const response = await fetch('/api/photo-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          scheduledAt: scheduledAt || undefined,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        const session = result.photoSession

        setCreatedSession(session)
        setShowQR(true)
        toast.success(_('Photo session created successfully!'))

        if (onSessionCreated) {
          onSessionCreated(session)
        }

        // Reset form
        setName('')
        setDescription('')
        setScheduledAt('')
      } else {
        const error = await response.json()
        toast.error(error.error || _('Failed to create photo session'))
      }
    } catch (error) {
      console.error('Error creating photo session:', error)
      toast.error(_('Failed to create photo session'))
    } finally {
      setIsCreating(false)
    }
  }

  const getSessionUrl = (sessionId: string) => {
    return `${window.location.origin}/session/${sessionId}`
  }

  const downloadQR = () => {
    if (!createdSession) return

    // Create canvas for QR code
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const size = 512
    canvas.width = size
    canvas.height = size + 100 // Extra space for text

    // White background
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, size, size + 100)

    // Get QR code SVG and convert to canvas
    const qrElement = document.querySelector('#session-qr svg') as SVGElement
    if (qrElement) {
      const svgData = new XMLSerializer().serializeToString(qrElement)
      const svgBlob = new Blob([svgData], {
        type: 'image/svg+xml;charset=utf-8',
      })
      const svgUrl = URL.createObjectURL(svgBlob)

      const img = new Image()
      img.onload = () => {
        // Draw QR code
        ctx.drawImage(img, 50, 50, size - 100, size - 100)

        // Add text
        ctx.fillStyle = 'black'
        ctx.font = 'bold 24px Arial'
        ctx.textAlign = 'center'
        ctx.fillText(createdSession.name, size / 2, size - 20)

        ctx.font = '16px Arial'
        ctx.fillText('Scan to access your photos', size / 2, size + 20)

        // Download
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `qr-session-${createdSession.name.replace(/\s+/g, '-').toLowerCase()}.png`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
          }
        })

        URL.revokeObjectURL(svgUrl)
      }
      img.src = svgUrl
    }
  }

  if (showQR && createdSession) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <QrCode className="w-5 h-5" />
              <Trans>Photo Session Created!</Trans>
            </CardTitle>
            <CardDescription>
              <Trans>Share this QR code with your clients</Trans>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Session Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">
                {createdSession.name}
              </h3>
              {createdSession.description && (
                <p className="text-gray-600 text-sm mb-2">
                  {createdSession.description}
                </p>
              )}
              <p className="text-xs text-gray-500">
                <Trans>Session ID</Trans>: {createdSession.id}
              </p>
            </div>

            {/* QR Code */}
            <div className="flex justify-center">
              <div className="bg-white p-6 rounded-lg border-2 border-gray-200 shadow-sm">
                <div id="session-qr">
                  <QRCode
                    value={getSessionUrl(createdSession.id)}
                    size={200}
                    style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
                  />
                </div>
              </div>
            </div>

            {/* Session URL */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <Label className="text-sm font-medium text-blue-900">
                <Trans>Direct Link</Trans>:
              </Label>
              <div className="mt-1 flex items-center gap-2">
                <Input
                  value={getSessionUrl(createdSession.id)}
                  readOnly
                  className="text-xs bg-white"
                />
                <Button
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      getSessionUrl(createdSession.id)
                    )
                    toast.success(_('Link copied to clipboard'))
                  }}
                >
                  <Trans>Copy</Trans>
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button onClick={downloadQR} className="flex-1">
                <QrCode className="w-4 h-4 mr-2" />
                <Trans>Download QR Code</Trans>
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowQR(false)
                  setCreatedSession(null)
                }}
                className="flex-1"
              >
                <Plus className="w-4 h-4 mr-2" />
                <Trans>Create Another</Trans>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          <Trans>New Photo Session</Trans>
        </CardTitle>
        <CardDescription>
          <Trans>
            Create a new photo session and generate QR code for client access
          </Trans>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="sessionName">
            <Trans>Session Name</Trans> *
          </Label>
          <Input
            id="sessionName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={_('Wedding, Portrait, Event...')}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="sessionDescription">
            <Trans>Description</Trans>
          </Label>
          <Textarea
            id="sessionDescription"
            value={description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setDescription(e.target.value)
            }
            placeholder={_('Optional description for the photo session')}
            rows={3}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="scheduledAt">
            <Trans>Scheduled Date & Time</Trans>
          </Label>
          <Input
            id="scheduledAt"
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="mt-1"
          />
        </div>

        <Button
          onClick={createSession}
          disabled={!name.trim() || isCreating}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isCreating ? (
            <Trans>Creating Session...</Trans>
          ) : (
            <>
              <QrCode className="w-4 h-4 mr-2" />
              <Trans>Create Session & Generate QR</Trans>
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
