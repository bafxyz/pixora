'use client'

import { msg, Trans } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Button } from '@repo/ui/button'
import { Card, CardContent } from '@repo/ui/card'
import { LoadingScreen } from '@repo/ui/loading-screen'
import { Check, Download, ShoppingCart, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { LanguageSwitcher } from '@/shared/components/language-switcher'

interface PhotoSession {
  id: string
  name: string
  description?: string | null
  photographerName: string
  photoCount: number
  hasPaidOrder?: boolean
  photos: Array<{
    id: string
    filePath: string
    fileName: string
    createdAt: string
  }>
  studio?: {
    name: string | null
    logoUrl: string | null
    brandColor: string | null
    welcomeMessage: string | null
  }
  pricing?: {
    digital: number
    print: number
    magnet: number
    currency: string
    enableDigital?: boolean
    enablePrint?: boolean
    enableMagnet?: boolean
  }
}

export default function SessionPage() {
  const { _ } = useLingui()
  const params = useParams()
  const router = useRouter()
  const sessionId = params?.id as string

  const [session, setSession] = useState<PhotoSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cart, setCart] = useState<
    Array<{ photoId: string; productType: string }>
  >([])
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem(`cart_${sessionId}`)
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart)
        // Handle legacy format (array of strings)
        if (
          Array.isArray(parsed) &&
          parsed.length > 0 &&
          typeof parsed[0] === 'string'
        ) {
          setCart(parsed.map((id) => ({ photoId: id, productType: 'digital' })))
        } else if (Array.isArray(parsed)) {
          setCart(parsed)
        } else {
          setCart([])
        }
      } catch {
        setCart([])
      }
    }
  }, [sessionId])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (sessionId) {
      localStorage.setItem(`cart_${sessionId}`, JSON.stringify(cart))
    }
  }, [cart, sessionId])

  useEffect(() => {
    if (!sessionId) return

    const fetchSession = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/session/${sessionId}`)

        if (response.ok) {
          const data = await response.json()
          setSession(data.session)
        } else if (response.status === 404) {
          setError('Photo session not found')
        } else {
          setError('Failed to load photo session')
        }
      } catch (err) {
        console.error('Error fetching session:', err)
        setError('Failed to load photo session')
      } finally {
        setLoading(false)
      }
    }

    fetchSession()
  }, [sessionId])

  const addToCart = (photoId: string, productType: string) => {
    setCart((prev) => {
      // Check if this combination already exists
      const exists = prev.some(
        (item) => item.photoId === photoId && item.productType === productType
      )
      if (exists) {
        // Remove it
        return prev.filter(
          (item) =>
            !(item.photoId === photoId && item.productType === productType)
        )
      }
      // Add it
      return [...prev, { photoId, productType }]
    })
  }

  const addDigitalPackage = () => {
    // Check if digital package already exists
    const hasDigital = cart.some((item) => item.productType === 'digital')

    if (hasDigital) {
      // Remove all digital items
      setCart((prev) => prev.filter((item) => item.productType !== 'digital'))
      toast.info(_(msg`Digital package removed from cart`))
    } else {
      // Add digital package (just one item with special ID)
      setCart((prev) => [
        ...prev,
        { photoId: 'digital-package', productType: 'digital' },
      ])
      toast.success(_(msg`Digital package added to cart`))
    }
  }

  const hasDigitalInCart = () => {
    return cart.some((item) => item.productType === 'digital')
  }

  const isInCart = (photoId: string, productType: string) => {
    return cart.some(
      (item) => item.photoId === photoId && item.productType === productType
    )
  }

  const handleDownloadAll = async () => {
    if (!session?.hasPaidOrder) {
      toast.error(_(msg`Payment required to download photos`))
      return
    }

    try {
      setIsDownloading(true)
      toast.loading(_(msg`Preparing your photos for download...`))

      const response = await fetch(`/api/session/${sessionId}/download`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to download photos')
      }

      // Download the ZIP file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${session.name.replace(/[^a-zA-Z0-9]/g, '_')}_photos.zip`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.dismiss()
      toast.success(_(msg`Photos downloaded successfully!`))
    } catch (error) {
      console.error('Error downloading photos:', error)
      toast.dismiss()
      toast.error(
        error instanceof Error
          ? error.message
          : _(msg`Failed to download photos`)
      )
    } finally {
      setIsDownloading(false)
    }
  }

  if (loading) {
    return <LoadingScreen message={_(msg`Loading your photo session...`)} />
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📸</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            <Trans>Session Not Found</Trans>
          </h1>
          <p className="text-gray-600 mb-6">
            {error || (
              <Trans>
                The photo session you're looking for doesn't exist or may have
                been removed.
              </Trans>
            )}
          </p>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-primary to-indigo-600 text-white hover:from-primary/90 hover:to-indigo-600/90 h-12 px-8 font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <Trans>Go Home</Trans>
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900">
      {/* Header */}
      <header
        className="bg-white/70 backdrop-blur-sm border-b border-white/20 sticky top-0 z-30 shadow-sm"
        style={
          session.studio?.brandColor
            ? { borderBottomColor: `${session.studio.brandColor}30` }
            : undefined
        }
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            {session.studio?.logoUrl ? (
              <div className="relative h-12 w-32">
                <Image
                  src={session.studio.logoUrl}
                  alt={session.studio.name || 'Studio Logo'}
                  fill
                  className="object-contain object-left"
                />
              </div>
            ) : (
              <Link
                href="/"
                className="text-2xl font-bold"
                style={
                  session.studio?.brandColor
                    ? { color: session.studio.brandColor }
                    : undefined
                }
              >
                {session.studio?.name || 'Pixora'}
              </Link>
            )}

            {/* Right side actions */}
            <div className="flex items-center gap-3">
              {/* Language Switcher */}
              <LanguageSwitcher />

              {/* Download All Photos Button (shown after payment) */}
              {session.hasPaidOrder && session.photoCount > 0 && (
                <Button
                  onClick={handleDownloadAll}
                  disabled={isDownloading}
                  variant="outline"
                  className="flex items-center gap-2"
                  style={
                    session.studio?.brandColor
                      ? {
                          borderColor: session.studio.brandColor,
                          color: session.studio.brandColor,
                        }
                      : undefined
                  }
                >
                  <Download className="w-5 h-5" />
                  <span className="hidden sm:inline">
                    <Trans>Download All</Trans>
                  </span>
                </Button>
              )}

              {/* Cart Button */}
              <Button
                onClick={() => router.push(`/session/${sessionId}/cart`)}
                variant="outline"
                className="relative"
                style={
                  session.studio?.brandColor
                    ? {
                        borderColor: session.studio.brandColor,
                        color: session.studio.brandColor,
                      }
                    : undefined
                }
              >
                <ShoppingCart className="w-5 h-5" />
                {cart.length > 0 && (
                  <span
                    className="absolute -top-2 -right-2 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
                    style={
                      session.studio?.brandColor
                        ? { backgroundColor: session.studio.brandColor }
                        : { backgroundColor: '#ef4444' }
                    }
                  >
                    {cart.length}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Lightbox */}
      {selectedPhoto && (
        <button
          type="button"
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
          onKeyDown={(e) => e.key === 'Escape' && setSelectedPhoto(null)}
          aria-label="Close lightbox"
        >
          <button
            type="button"
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            onClick={() => setSelectedPhoto(null)}
          >
            <X className="w-8 h-8" />
          </button>
          <div className="relative max-w-7xl max-h-[90vh] w-full h-full">
            <Image
              src={selectedPhoto}
              alt="Preview"
              fill
              className="object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </button>
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Session Header */}
        <div className="mb-8 text-center">
          <h1
            className="text-3xl md:text-4xl font-bold mb-4"
            style={
              session.studio?.brandColor
                ? { color: session.studio.brandColor }
                : undefined
            }
          >
            {session.name}
          </h1>

          {session.studio?.welcomeMessage && (
            <p className="text-lg text-slate-700 dark:text-slate-300 mb-4 max-w-2xl mx-auto font-medium">
              {session.studio.welcomeMessage}
            </p>
          )}

          {session.description && (
            <p className="text-lg text-slate-600 dark:text-slate-300 mb-4 max-w-2xl mx-auto">
              {session.description}
            </p>
          )}

          {/* Studio/Photographer Info */}
          <div className="flex justify-center items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <span>
              <Trans>by</Trans> {session.photographerName}
            </span>
            {session.photoCount > 0 && (
              <>
                <span>•</span>
                <span>
                  {session.photoCount} <Trans>photos available</Trans>
                </span>
              </>
            )}
          </div>
        </div>

        {/* Session Status */}
        {session.photoCount === 0 && (
          <div className="mb-8 bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⏳</span>
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">
              <Trans>Photo Session in Progress</Trans>
            </h2>
            <p className="text-slate-600">
              <Trans>
                Your photos will appear here once the photographer uploads them.
                Check back soon!
              </Trans>
            </p>
          </div>
        )}

        {/* Digital Photos Order Button - if enabled */}
        {session.photoCount > 0 && session.pricing?.enableDigital && (
          <div className="max-w-7xl mx-auto mb-6">
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-1">
                      <Trans>Digital Photos Package</Trans>
                    </h3>
                    <p className="text-sm text-slate-600">
                      <Trans>
                        Order all photos as digital copies and download them as
                        a ZIP archive after payment
                      </Trans>
                    </p>
                  </div>
                  <Button
                    onClick={addDigitalPackage}
                    className="whitespace-nowrap"
                    variant={hasDigitalInCart() ? 'default' : 'outline'}
                    style={
                      session.studio?.brandColor && !hasDigitalInCart()
                        ? {
                            borderColor: session.studio.brandColor,
                            color: session.studio.brandColor,
                          }
                        : session.studio?.brandColor && hasDigitalInCart()
                          ? {
                              backgroundColor: session.studio.brandColor,
                              color: 'white',
                            }
                          : hasDigitalInCart()
                            ? { backgroundColor: '#16a34a', color: 'white' }
                            : undefined
                    }
                  >
                    {hasDigitalInCart() ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        <Trans>In Cart</Trans>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        <Trans>Order All Digital</Trans>
                      </>
                    )}{' '}
                    -{' '}
                    {session.pricing.currency === 'USD'
                      ? '$'
                      : session.pricing.currency === 'EUR'
                        ? '€'
                        : '₽'}
                    {session.pricing.digital}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Photos Gallery */}
        {session.photoCount > 0 && (
          <>
            <SessionGallery
              sessionId={sessionId}
              photos={session.photos}
              cart={cart}
              onAddToCart={addToCart}
              isInCart={isInCart}
              onSelectPhoto={setSelectedPhoto}
              brandColor={session.studio?.brandColor}
              pricing={session.pricing}
            />

            {/* Floating Cart Button */}
            {cart.length > 0 && (
              <div className="fixed bottom-6 right-6 z-40">
                <Button
                  size="lg"
                  onClick={() => router.push(`/session/${sessionId}/cart`)}
                  className="shadow-xl hover:shadow-2xl transition-all text-white"
                  style={
                    session.studio?.brandColor
                      ? {
                          backgroundColor: session.studio.brandColor,
                        }
                      : undefined
                  }
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  <span className="font-semibold">
                    {cart.length} <Trans>photos</Trans>
                  </span>
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// Gallery component specifically for session photos
function SessionGallery({
  sessionId: _sessionId,
  photos,
  cart: _cart,
  onAddToCart,
  isInCart,
  onSelectPhoto,
  brandColor,
  pricing,
}: {
  sessionId: string
  photos: PhotoSession['photos']
  cart: Array<{ photoId: string; productType: string }>
  onAddToCart: (photoId: string, productType: string) => void
  isInCart: (photoId: string, productType: string) => boolean
  onSelectPhoto: (photoPath: string) => void
  brandColor?: string | null
  pricing?: PhotoSession['pricing']
}) {
  return (
    <div className="max-w-7xl mx-auto">
      {/* Gallery Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {photos.map((photo, index) => {
          const inCartPrint = isInCart(photo.id, 'print')
          const inCartMagnet = isInCart(photo.id, 'magnet')
          const inCartDigital = isInCart(photo.id, 'digital')
          const hasAnyInCart = inCartPrint || inCartMagnet || inCartDigital

          return (
            <Card
              key={photo.id}
              className="group relative bg-white/70 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              <button
                type="button"
                className="aspect-square relative cursor-pointer w-full"
                onClick={() => onSelectPhoto(photo.filePath)}
              >
                <Image
                  src={photo.filePath}
                  alt={`Photo ${index + 1}`}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  priority={index < 8}
                />
                {hasAnyInCart && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white p-1.5 rounded-full shadow-lg">
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </button>
              <CardContent className="p-3 space-y-2">
                {/* Show print/magnet buttons based on what's enabled */}
                {(pricing?.enablePrint || pricing?.enableMagnet) && (
                  <div className="flex gap-2 flex-wrap">
                    {pricing?.enablePrint && (
                      <Button
                        onClick={() => onAddToCart(photo.id, 'print')}
                        className="flex-1 transition-all text-xs min-w-[70px]"
                        size="sm"
                        variant={inCartPrint ? 'default' : 'outline'}
                        style={
                          brandColor && inCartPrint
                            ? { backgroundColor: brandColor, color: 'white' }
                            : brandColor && !inCartPrint
                              ? {
                                  borderColor: brandColor,
                                  color: brandColor,
                                }
                              : undefined
                        }
                      >
                        <Trans>Print</Trans>
                      </Button>
                    )}
                    {pricing?.enableMagnet && (
                      <Button
                        onClick={() => onAddToCart(photo.id, 'magnet')}
                        className="flex-1 transition-all text-xs min-w-[70px]"
                        size="sm"
                        variant={inCartMagnet ? 'default' : 'outline'}
                        style={
                          brandColor && inCartMagnet
                            ? { backgroundColor: brandColor, color: 'white' }
                            : brandColor && !inCartMagnet
                              ? {
                                  borderColor: brandColor,
                                  color: brandColor,
                                }
                              : undefined
                        }
                      >
                        <Trans>Magnet</Trans>
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {photos.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-500">
            <Trans>No photos available yet</Trans>
          </p>
        </div>
      )}
    </div>
  )
}
