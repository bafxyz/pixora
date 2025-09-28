'use client'

import { Trans } from '@lingui/react/macro'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

// Dynamically import the gallery component for better performance
const _GuestGallery = dynamic(
  () =>
    import('@/features/gallery/components/guest-gallery').then((mod) => ({
      default: mod.GuestGallery,
    })),
  {
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading gallery...</p>
        </div>
      </div>
    ),
    ssr: false, // Disable SSR for this component to improve initial load
  }
)

interface PhotoSession {
  id: string
  name: string
  description?: string
  status: string
  photographer: {
    id: string
    name: string
    branding?: Record<string, unknown>
  }
  client: {
    id: string
    name: string
    branding?: Record<string, unknown>
  }
  photos: Array<{
    id: string
    filePath: string
    fileName: string
    createdAt: string
  }>
  guestCount: number
  photoCount: number
}

export default function SessionPage() {
  const params = useParams()
  const sessionId = params?.id as string

  const [session, setSession] = useState<PhotoSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionId) return

    const fetchSession = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/photo-sessions/${sessionId}`)

        if (response.ok) {
          const data = await response.json()
          setSession(data.photoSession)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            <Trans>Loading your photo session...</Trans>
          </p>
        </div>
      </div>
    )
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
              <Trans>by</Trans>{' '}
              {session.photographer.name || session.client.name}
            </span>
            {session.status !== 'created' && (
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
        {session.status === 'created' && session.photoCount === 0 && (
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
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-gray-400 text-sm">
                    <Trans>Loading your photos...</Trans>
                  </p>
                </div>
              </div>
            }
          >
            <SessionGallery
              sessionId={sessionId}
              photos={session.photos}
              photographer={session.photographer}
            />
          </Suspense>
        )}
      </div>
    </div>
  )
}

// Gallery component specifically for session photos
function SessionGallery({
  photos,
}: {
  sessionId: string
  photos: PhotoSession['photos']
  photographer: PhotoSession['photographer']
}) {
  return (
    <div className="max-w-7xl mx-auto">
      {/* Gallery Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            className="group relative bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
          >
            <div className="aspect-square relative">
              <Image
                src={photo.filePath}
                alt={`${index + 1}`}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                priority={index < 4}
              />
            </div>
            <div className="p-4">
              <div className="flex justify-center">
                <button
                  type="button"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Trans>Add to Cart</Trans>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Cart & Checkout would go here */}
      <div className="mt-8 text-center">
        <p className="text-sm text-slate-500">
          <Trans>Cart and checkout functionality will be integrated soon</Trans>
        </p>
      </div>
    </div>
  )
}
