'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

// Dynamically import the gallery component for better performance
const GuestGallery = dynamic(
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

export default function Gallery() {
  // Generate a valid UUID for demo purposes
  const guestId = crypto.randomUUID()

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-400 text-sm">Preparing gallery...</p>
          </div>
        </div>
      }
    >
      <GuestGallery guestId={guestId} />
    </Suspense>
  )
}
