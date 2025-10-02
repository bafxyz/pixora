'use client'

import { msg, Trans } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Button } from '@repo/ui/button'
import { Card, CardContent } from '@repo/ui/card'
import { LoadingScreen } from '@repo/ui/loading-screen'
import { Check, ShoppingCart, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LanguageSwitcher } from '@/shared/components/language-switcher'

interface PhotoSession {
  id: string
  name: string
  description?: string | null
  photographerName: string
  photoCount: number
  photos: Array<{
    id: string
    filePath: string
    fileName: string
    createdAt: string
  }>
}

export default function SessionPage() {
  const { _ } = useLingui()
  const params = useParams()
  const router = useRouter()
  const sessionId = params?.id as string

  const [session, setSession] = useState<PhotoSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cart, setCart] = useState<string[]>([])
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem(`cart_${sessionId}`)
    if (savedCart) {
      setCart(JSON.parse(savedCart))
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

  const toggleCart = (photoId: string) => {
    setCart((prev) =>
      prev.includes(photoId)
        ? prev.filter((id) => id !== photoId)
        : [...prev, photoId]
    )
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
      <header className="bg-white/70 backdrop-blur-sm border-b border-white/20 sticky top-0 z-30 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link
              href="/"
              className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent"
            >
              Pixora
            </Link>

            {/* Right side actions */}
            <div className="flex items-center gap-3">
              {/* Language Switcher */}
              <LanguageSwitcher />

              {/* Cart Button */}
              <Button
                onClick={() => router.push(`/session/${sessionId}/cart`)}
                variant="outline"
                className="relative"
              >
                <ShoppingCart className="w-5 h-5" />
                {cart.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
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
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-4">
            {session.name}
          </h1>

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

        {/* Photos Gallery */}
        {session.photoCount > 0 && (
          <>
            <SessionGallery
              sessionId={sessionId}
              photos={session.photos}
              cart={cart}
              onToggleCart={toggleCart}
              onSelectPhoto={setSelectedPhoto}
            />

            {/* Floating Cart Button */}
            {cart.length > 0 && (
              <div className="fixed bottom-6 right-6 z-40">
                <Button
                  size="lg"
                  onClick={() => router.push(`/session/${sessionId}/cart`)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl hover:shadow-2xl transition-all"
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
  cart,
  onToggleCart,
  onSelectPhoto,
}: {
  sessionId: string
  photos: PhotoSession['photos']
  cart: string[]
  onToggleCart: (photoId: string) => void
  onSelectPhoto: (photoPath: string) => void
}) {
  return (
    <div className="max-w-7xl mx-auto">
      {/* Gallery Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {photos.map((photo, index) => {
          const isInCart = cart.includes(photo.id)

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
                {isInCart && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white p-1.5 rounded-full shadow-lg">
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </button>
              <CardContent className="p-3">
                <Button
                  onClick={() => onToggleCart(photo.id)}
                  className={`w-full transition-all ${
                    isInCart
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                  size="sm"
                >
                  {isInCart ? (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      <Trans>In Cart</Trans>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4 mr-1" />
                      <Trans>Add</Trans>
                    </>
                  )}
                </Button>
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
