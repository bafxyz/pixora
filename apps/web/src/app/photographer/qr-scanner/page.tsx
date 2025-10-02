'use client'

import { Trans } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Button } from '@repo/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'
import { Spinner } from '@repo/ui/spinner'
import { ArrowLeft, Clock, ShoppingCart, User as UserIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { QRScanner } from '@/features/qr/components/qr-scanner'

interface GuestData {
  id: string
  email: string
  name?: string
  phone?: string
  qrCode?: string
  lastAccessAt?: string
  createdAt: string
  session?: {
    id: string
    name: string
  }
  orders?: Array<{
    id: string
    status: string
    totalAmount: string
    createdAt: string
  }>
}

export default function QRScannerPage() {
  const { _ } = useLingui()
  const router = useRouter()
  const [scannedGuest, setScannedGuest] = useState<GuestData | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleScan = async (qrData: string) => {
    try {
      setIsProcessing(true)
      setError(null)

      const response = await fetch('/api/qr/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qrData }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Failed to process QR code')
        return
      }

      if (result.success && result.type === 'guest') {
        setScannedGuest(result.guest)
      } else if (result.success && result.type === 'session') {
        // Redirect to session page
        router.push(`/photographer/sessions/${result.session.id}`)
      }
    } catch (err) {
      console.error('Error processing QR scan:', err)
      setError('Failed to process QR code')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleError = (errorMessage: string) => {
    setError(errorMessage)
  }

  const handleNewScan = () => {
    setScannedGuest(null)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900">
      <div className="container mx-auto px-4 py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Button
              onClick={() => router.back()}
              variant="outline"
              size="sm"
              className="bg-white/70 backdrop-blur-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              <Trans>Back</Trans>
            </Button>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
              <Trans>QR Code Scanner</Trans>
            </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            <Trans>
              Scan guest QR codes to quickly access their information and order
              history
            </Trans>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* QR Scanner */}
          <div>
            <QRScanner onScan={handleScan} onError={handleError} />

            {error && (
              <Card className="mt-4 border-red-200 bg-red-50">
                <CardContent className="p-4">
                  <p className="text-red-800 text-sm">{error}</p>
                </CardContent>
              </Card>
            )}

            {isProcessing && (
              <Card className="mt-4">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Spinner size="sm" />
                    <p className="text-sm text-slate-600">
                      <Trans>Processing QR code...</Trans>
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Guest Information */}
          <div>
            {scannedGuest ? (
              <Card className="bg-white/70 backdrop-blur-sm border border-white/20 shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <UserIcon className="w-5 h-5" />
                      <Trans>Guest Information</Trans>
                    </CardTitle>
                    <Button onClick={handleNewScan} size="sm" variant="outline">
                      <Trans>New Scan</Trans>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Guest Details */}
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-slate-600 block">
                        <Trans>Name</Trans>
                      </span>
                      <p className="text-slate-800">
                        {scannedGuest.name || _('Not specified')}
                      </p>
                    </div>

                    <div>
                      <span className="text-sm font-medium text-slate-600 block">
                        <Trans>Email</Trans>
                      </span>
                      <p className="text-slate-800">{scannedGuest.email}</p>
                    </div>

                    {scannedGuest.phone && (
                      <div>
                        <span className="text-sm font-medium text-slate-600 block">
                          <Trans>Phone</Trans>
                        </span>
                        <p className="text-slate-800">{scannedGuest.phone}</p>
                      </div>
                    )}

                    {scannedGuest.session && (
                      <div>
                        <span className="text-sm font-medium text-slate-600 block">
                          <Trans>Current Session</Trans>
                        </span>
                        <p className="text-slate-800">
                          {scannedGuest.session.name}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-slate-600 block">
                          <Trans>Last Access</Trans>
                        </span>
                        <p className="text-slate-800 text-sm">
                          {scannedGuest.lastAccessAt
                            ? new Date(
                                scannedGuest.lastAccessAt
                              ).toLocaleString()
                            : _('Never')}
                        </p>
                      </div>

                      <div>
                        <span className="text-sm font-medium text-slate-600 block">
                          <Trans>Registered</Trans>
                        </span>
                        <p className="text-slate-800 text-sm">
                          {new Date(
                            scannedGuest.createdAt
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Recent Orders */}
                  {scannedGuest.orders && scannedGuest.orders.length > 0 && (
                    <div>
                      <h4 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4" />
                        <Trans>Recent Orders</Trans>
                      </h4>
                      <div className="space-y-2">
                        {scannedGuest.orders.map((order) => (
                          <div
                            key={order.id}
                            className="p-3 bg-slate-50 rounded-lg border border-slate-200"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-slate-800">
                                  {order.status}
                                </p>
                                <p className="text-xs text-slate-600 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {new Date(
                                    order.createdAt
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                              <p className="font-medium text-slate-800">
                                ¥{order.totalAmount}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t border-slate-200">
                    {scannedGuest.session && (
                      <Button
                        onClick={() =>
                          router.push(
                            `/photographer/sessions/${scannedGuest.session?.id}`
                          )
                        }
                        className="flex-1"
                      >
                        <Trans>View Session</Trans>
                      </Button>
                    )}
                    <Button
                      onClick={() => router.push('/admin/orders')}
                      variant="outline"
                      className="flex-1"
                    >
                      <Trans>View Orders</Trans>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white/70 backdrop-blur-sm border border-white/20 shadow-lg">
                <CardContent className="py-12 text-center">
                  <UserIcon className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">
                    <Trans>No Guest Scanned</Trans>
                  </h3>
                  <p className="text-slate-600">
                    <Trans>Scan a QR code to view guest information</Trans>
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
