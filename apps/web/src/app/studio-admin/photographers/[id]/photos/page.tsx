'use client'

import { msg, Trans } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { Card, CardContent } from '@repo/ui/card'
import { EmptyState } from '@repo/ui/empty-state'
import { Input } from '@repo/ui/input'
import { PageLayout } from '@repo/ui/page-layout'
import { Spinner } from '@repo/ui/spinner'
import {
  ArrowLeft,
  Calendar,
  Camera,
  Download,
  Eye,
  Image as ImageIcon,
  Search,
} from 'lucide-react'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface Photo {
  id: string
  filename: string
  originalUrl: string
  thumbnailUrl: string
  size: number
  createdAt: string
  guestName: string
  guestEmail: string
  sessionName?: string
}

interface PhotographerDetails {
  id: string
  name: string
  email: string
}

export default function PhotographerPhotosPage() {
  const { _ } = useLingui()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [filteredPhotos, setFilteredPhotos] = useState<Photo[]>([])
  const [photographer, setPhotographer] = useState<PhotographerDetails | null>(
    null
  )
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()
  const params = useParams()
  const photographerId = params.id as string

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch photographer details
        const photographerResponse = await fetch(
          `/api/studio-admin/photographers/${photographerId}`
        )
        const photographerData = await photographerResponse.json()

        if (photographerResponse.ok) {
          setPhotographer(photographerData.photographer)
        } else {
          console.error(
            'Failed to fetch photographer details:',
            photographerData.error
          )
          toast.error(_(msg`Error loading photographer data`))
          router.push('/studio-admin/photographers')
          return
        }

        // Fetch photos
        const photosResponse = await fetch(
          `/api/studio-admin/photographers/${photographerId}/photos`
        )
        const photosData = await photosResponse.json()

        if (photosResponse.ok) {
          setPhotos(photosData.photos || [])
          setFilteredPhotos(photosData.photos || [])
        } else {
          console.error('Failed to fetch photos:', photosData.error)
          toast.error(_(msg`Error loading photos`))
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error(_(msg`Error loading data`))
      } finally {
        setLoading(false)
      }
    }

    if (photographerId) {
      fetchData()
    }
  }, [photographerId, router, _])

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredPhotos(photos)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredPhotos(
        photos.filter(
          (photo) =>
            photo.filename.toLowerCase().includes(query) ||
            photo.guestName.toLowerCase().includes(query) ||
            photo.guestEmail.toLowerCase().includes(query) ||
            photo.sessionName?.toLowerCase().includes(query)
        )
      )
    }
  }, [searchQuery, photos])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`
  }

  const handleDownload = async (photo: Photo) => {
    try {
      const response = await fetch(photo.originalUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = photo.filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success(_(msg`Photo downloaded`))
    } catch (error) {
      console.error('Error downloading photo:', error)
      toast.error(_(msg`Error downloading photo`))
    }
  }

  if (loading) {
    return (
      <PageLayout
        title={_(msg`Photographer Photos`)}
        description={_(msg`View photographer photos`)}
      >
        <div className="flex justify-center items-center py-12">
          <Spinner size="lg" />
        </div>
      </PageLayout>
    )
  }

  if (!photographer) {
    return (
      <PageLayout
        title={_(msg`Photographer Not Found`)}
        description={_(msg`The requested photographer does not exist`)}
      >
        <div className="text-center py-16">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
            <Trans>Photographer Not Found</Trans>
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            <Trans>
              The photographer may have been deleted or you may have entered an
              incorrect ID
            </Trans>
          </p>
          <Button onClick={() => router.push('/studio-admin/photographers')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            <Trans>Back to list</Trans>
          </Button>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout
      title={_(msg`Photographer Photos: ${photographer.name}`)}
      description={_(msg`View and manage photographer photos`)}
    >
      <div className="space-y-6">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              type="text"
              placeholder={_(msg`Search by filename, guest, or session...`)}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            variant="outline"
            onClick={() =>
              router.push(`/studio-admin/photographers/${photographerId}`)
            }
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            <Trans>Back to details</Trans>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    <Trans>Total Photos</Trans>
                  </p>
                  <p className="text-2xl font-bold">{photos.length}</p>
                </div>
                <ImageIcon className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    <Trans>Total Size</Trans>
                  </p>
                  <p className="text-2xl font-bold">
                    {formatFileSize(
                      photos.reduce((sum, photo) => sum + photo.size, 0)
                    )}
                  </p>
                </div>
                <Camera className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    <Trans>Unique Guests</Trans>
                  </p>
                  <p className="text-2xl font-bold">
                    {new Set(photos.map((p) => p.guestEmail)).size}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Photos Grid */}
        {filteredPhotos.length === 0 ? (
          <EmptyState
            icon={<ImageIcon className="w-12 h-12" />}
            title={searchQuery ? _(msg`No Photos Found`) : _(msg`No Photos`)}
            description={
              searchQuery
                ? _(msg`No photos found matching your search`)
                : _(msg`This photographer has no photos yet`)
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPhotos.map((photo) => (
              <Card
                key={photo.id}
                className="overflow-hidden hover:shadow-lg transition-shadow group"
              >
                <div className="aspect-square relative overflow-hidden bg-slate-100">
                  <Image
                    src={photo.thumbnailUrl}
                    alt={photo.filename}
                    fill
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => window.open(photo.originalUrl, '_blank')}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleDownload(photo)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <h4
                        className="font-medium text-sm truncate flex-1"
                        title={photo.filename}
                      >
                        {photo.filename}
                      </h4>
                      <Badge variant="outline" className="text-xs ml-2">
                        {formatFileSize(photo.size)}
                      </Badge>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1">
                      <div className="flex items-center gap-1">
                        <span className="font-medium">
                          <Trans>Guest:</Trans>
                        </span>
                        <span className="truncate">{photo.guestName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">
                          <Trans>Email:</Trans>
                        </span>
                        <span className="truncate">{photo.guestEmail}</span>
                      </div>
                      {photo.sessionName && (
                        <div className="flex items-center gap-1">
                          <span className="font-medium">
                            <Trans>Session:</Trans>
                          </span>
                          <span className="truncate">{photo.sessionName}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(photo.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  )
}
