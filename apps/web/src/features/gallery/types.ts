export type Photo = {
  id: string
  title: string
  url: string
  thumbnailUrl?: string
  photographerId: string
  photographerName?: string
  tags?: string[]
  uploadedAt: string
  dimensions?: {
    width: number
    height: number
  }
}

export type Gallery = {
  id: string
  name: string
  description?: string
  coverPhoto?: string
  photos: Photo[]
  createdAt: string
  updatedAt: string
  isPublic: boolean
  accessCode?: string
}

export type GalleryFilters = {
  photographerId?: string
  tags?: string[]
  dateFrom?: Date
  dateTo?: Date
  searchQuery?: string
}
