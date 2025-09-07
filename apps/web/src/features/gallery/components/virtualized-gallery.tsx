import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ImageWithFallback } from './image-with-fallback'

interface Photo {
  id: string
  fileName: string
  guestId: string
  photographerId: string
  uploadedAt: string
  price: number
  status: string
}

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
  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeightState, setContainerHeightState] =
    useState(containerHeight)
  const containerRef = useRef<HTMLDivElement>(null)
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())

  // Calculate visible range with overscan
  const visibleRange = useMemo((): VisibleRange => {
    const start = Math.floor(scrollTop / itemHeight)
    const visibleCount = Math.ceil(containerHeightState / itemHeight)
    const end = Math.min(start + visibleCount + overscan, photos.length)

    return {
      start: Math.max(0, start - overscan),
      end,
    }
  }, [scrollTop, itemHeight, containerHeightState, overscan, photos.length])

  // Get visible photos
  const visiblePhotos = useMemo(() => {
    return photos.slice(visibleRange.start, visibleRange.end)
  }, [photos, visibleRange])

  // Calculate total height for scrollbar
  const totalHeight = photos.length * itemHeight

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
        setContainerHeightState(containerRef.current.clientHeight)
      }
    }

    updateHeight()
    window.addEventListener('resize', updateHeight)
    return () => window.removeEventListener('resize', updateHeight)
  }, [])

  // Calculate offset for visible items
  const offsetY = visibleRange.start * itemHeight

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
                className="inline-block p-2 cursor-pointer group border-0 bg-transparent"
                style={{ width: '25%', height: itemHeight }}
                onClick={() => onPhotoClick?.(photo)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onPhotoClick?.(photo)
                  }
                }}
                aria-label={`View photo ${globalIndex + 1} - $${photo.price}`}
              >
                <div className="relative w-full h-full bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                  <div className="aspect-square relative">
                    <ImageWithFallback
                      src={photo.fileName}
                      alt={`Photo ${globalIndex + 1}`}
                      width={300}
                      height={300}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading={globalIndex < 4 ? 'eager' : 'lazy'}
                      placeholder="blur"
                      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R+IRjWjBqO6O2mhP//Z"
                      onLoad={() => handleImageLoad(photo.fileName)}
                    />
                    {!loadedImages.has(photo.fileName) && (
                      <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                    <div className="flex justify-between items-center text-white">
                      <span className="text-sm font-medium">
                        ${photo.price}
                      </span>
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
