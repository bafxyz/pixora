import { Trans } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Button } from '@repo/ui/button'
import { ShoppingCart } from 'lucide-react'
import React, { lazy, Suspense, useEffect, useState } from 'react'

import {
  useCartItemCount,
  useGalleryStore,
} from '@/shared/stores/gallery.store'
import { Cart } from './cart'
import { Checkout } from './checkout'
import { ImageWithFallback } from './image-with-fallback'

// Lazy load the virtualized gallery for better performance
const VirtualizedGallery = lazy(() =>
  import('./virtualized-gallery').then((mod) => ({
    default: mod.VirtualizedGallery,
  }))
)

interface GuestGalleryProps {
  guestId: string
}

export function GuestGallery({ guestId }: GuestGalleryProps) {
  const { _ } = useLingui()
  const {
    photos,
    photographer,
    isLoadingPhotos,
    setDemoImages,
    loadPhotos,
    addToCart,
    setShowCart,
  } = useGalleryStore()

  const cartItemCount = useCartItemCount()

  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())

  // Load demo images on mount
  useEffect(() => {
    const images = [
      'https://images.unsplash.com/photo-1753947674135-f7ffb57356e9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWRkaW5nJTIwcGhvdG9ncmFwaHklMjBwcm9mZXNzaW9uYWx8ZW58MXx8fHwxNzU2ODg0Mjk5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      'https://images.unsplash.com/photo-1612052355380-d7c1d631f00f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3J0cmFpdCUyMHBob3RvZ3JhcGh5JTIwc3R1ZGlvfGVufDF8fHx8MTc1Njg0MDYwNHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      'https://images.unsplash.com/photo-1654994009645-9e8849f17727?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYW1pbHklMjBwaG90byUyMHNlc3Npb258ZW58MXx8fHwxNzU2ODg0MzA2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      'https://images.unsplash.com/photo-1636990165439-ad91410514e9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxldmVudCUyMHBob3RvZ3JhcGh5JTIwcHJvZmVzc2lvbmFsfGVufDF8fHx8MTc1NjgwMDA1Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      'https://images.unsplash.com/photo-1587403098488-f1fc1149b1b7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBwaG90b2dyYXBoZXIlMjB3b3JrfGVufDF8fHx8MTc1Njg4NDMxNHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    ]
    setDemoImages(images)
  }, [setDemoImages])

  // Load photos when guestId changes
  useEffect(() => {
    if (guestId) {
      loadPhotos(guestId)
    }
  }, [guestId, loadPhotos])

  const handleImageLoad = (src: string) => {
    setLoadedImages((prev) => new Set(prev).add(src))
  }

  // Simple loading state display
  if (isLoadingPhotos) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            <Trans>Loading photos...</Trans>
          </p>
        </div>
      </div>
    )
  }

  const displayPhotos = photos.length > 0 ? photos : []

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          <Trans>Guest Gallery</Trans> - {guestId}
        </h1>
        {photographer && (
          <p className="text-lg text-muted-foreground">
            <Trans>Photographer</Trans>: {photographer.studioName}
          </p>
        )}
        <div className="flex gap-4 mt-4 text-sm text-muted-foreground items-center">
          <span>
            <Trans>Photos</Trans>: {displayPhotos.length}
          </span>
          <Button
            type="button"
            onClick={() => setShowCart(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
          >
            <ShoppingCart className="w-4 h-4" />
            <Trans>Cart</Trans> ({cartItemCount})
          </Button>
        </div>
      </div>

      {displayPhotos.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">
            <Trans>No photos available yet.</Trans>
          </p>
        </div>
      ) : displayPhotos.length > 50 ? (
        // Use virtualized gallery for large datasets
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-muted-foreground text-sm">
                  <Trans>Loading virtual gallery...</Trans>
                </p>
              </div>
            </div>
          }
        >
          <VirtualizedGallery
            photos={displayPhotos}
            itemHeight={320}
            containerHeight={800}
            overscan={3}
            onPhotoClick={(_photo) => {
              // Handle photo click - could open modal or navigate
            }}
          />
        </Suspense>
      ) : (
        // Use regular grid for smaller datasets
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {displayPhotos.map((photo, index) => (
            <div
              key={photo.id}
              className="group relative bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              <div className="aspect-square relative">
                <ImageWithFallback
                  src={photo.file_path} // Use file_path from database
                  alt={`Photo ${index + 1}`}
                  width={400}
                  height={400}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading={index < 4 ? 'eager' : 'lazy'} // Load first 4 images eagerly
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R+IRjWjBqO6O2mhP//Z"
                  onLoad={() => handleImageLoad(photo.file_path)}
                />
                {!loadedImages.has(photo.file_path) && (
                  <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-muted-foreground/50 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex justify-center">
                  <Button
                    type="button"
                    onClick={() => addToCart(photo, 'digital')}
                    size="sm"
                  >
                    <Trans>Add to Cart</Trans>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Cart />
      <Checkout />
    </div>
  )
}
