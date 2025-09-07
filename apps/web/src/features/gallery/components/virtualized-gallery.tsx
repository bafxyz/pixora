import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { Photo } from '@/shared/stores/gallery.store'
import { ImageWithFallback } from './image-with-fallback'

interface VirtualizedGalleryProps {
  photos: Photo[]
  itemHeight?: number
  containerHeight?: number
  overscan?: number
  onPhotoClick?: (photo: Photo) => void
}

interface VisibleRange {
  start: number
  end: number
}

export function VirtualizedGallery({
  photos,
  itemHeight = 300,
  containerHeight = 600,
  overscan = 5,
  onPhotoClick,
}: VirtualizedGalleryProps) {
  // Responsive item height based on screen size
  const responsiveItemHeight =
    typeof window !== 'undefined' && window.innerWidth < 768 ? 200 : itemHeight
  const responsiveContainerHeight =
    typeof window !== 'undefined' && window.innerWidth < 768
      ? 400
      : containerHeight

  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeightState, setContainerHeightState] = useState(
    responsiveContainerHeight
  )
  const containerRef = useRef<HTMLDivElement>(null)
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())

  // Calculate visible range with overscan
  const visibleRange = useMemo((): VisibleRange => {
    const currentItemHeight = responsiveItemHeight
    const start = Math.floor(scrollTop / currentItemHeight)
    const visibleCount = Math.ceil(containerHeightState / currentItemHeight)
    const end = Math.min(start + visibleCount + overscan, photos.length)

    return {
      start: Math.max(0, start - overscan),
      end,
    }
  }, [
    scrollTop,
    responsiveItemHeight,
    containerHeightState,
    overscan,
    photos.length,
  ])

  // Get visible photos
  const visiblePhotos = useMemo(() => {
    return photos.slice(visibleRange.start, visibleRange.end)
  }, [photos, visibleRange])

  // Calculate total height for scrollbar
  const totalHeight = photos.length * responsiveItemHeight

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  // Handle image load
  const handleImageLoad = useCallback((src: string) => {
    setLoadedImages((prev) => new Set(prev).add(src))
  }, [])

  // Update container height on resize
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const newHeight = window.innerWidth < 768 ? 400 : containerHeight
        setContainerHeightState(newHeight)
      }
    }

    updateHeight()
    window.addEventListener('resize', updateHeight)
    return () => window.removeEventListener('resize', updateHeight)
  }, [containerHeight])

  // Calculate offset for visible items
  const offsetY = visibleRange.start * responsiveItemHeight

  return (
    <div
      ref={containerRef}
      className="overflow-auto"
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visiblePhotos.map((photo, index) => {
            const globalIndex = visibleRange.start + index
            return (
              <button
                type="button"
                key={photo.id}
                className="inline-block p-1 lg:p-2 cursor-pointer group border-0 bg-transparent"
                style={{
                  width: window?.innerWidth < 768 ? '33.333%' : '25%',
                  height: responsiveItemHeight,
                }}
                onClick={() => onPhotoClick?.(photo)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onPhotoClick?.(photo)
                  }
                }}
                aria-label={`View photo ${globalIndex + 1}`}
              >
                <div className="relative w-full h-full bg-background rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 border">
                  <div className="aspect-square relative">
                    <ImageWithFallback
                      src={photo.file_path}
                      alt={`Photo ${globalIndex + 1}`}
                      width={300}
                      height={300}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading={globalIndex < 4 ? 'eager' : 'lazy'}
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
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                    <div className="flex justify-end items-center text-white">
                      <span className="text-xs opacity-75">
                        #{globalIndex + 1}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
