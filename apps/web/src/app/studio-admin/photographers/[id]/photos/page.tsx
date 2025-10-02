'use client'

import { msg, Trans } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'
import { EmptyState } from '@repo/ui/empty-state'
import { Input } from '@repo/ui/input'
import { Spinner } from '@repo/ui/spinner'
import {
  ArrowLeft,
  Calendar,
  Camera,
  Download,
  Eye,
  Image,
  Search,
} from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { PageLayout } from '@repo/ui/page-layout'

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
          toast.error(_(msg`Ошибка при загрузке данных фотографа`))
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
          toast.error(_(msg`Ошибка при загрузке фотографий`))
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error(_(msg`Ошибка при загрузке данных`))
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
            (photo.sessionName &&
              photo.sessionName.toLowerCase().includes(query))
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
      toast.success(_(msg`Фотография загружена`))
    } catch (error) {
      console.error('Error downloading photo:', error)
      toast.error(_(msg`Ошибка при загрузке фотографии`))
    }
  }

  if (loading) {
    return (
      <PageLayout
        title={_(msg`Фотографии фотографа`)}
        description={_(msg`Просмотр фотографий фотографа`)}
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
        title={_(msg`Фотограф не найден`)}
        description={_(msg`Запрашиваемый фотограф не существует`)}
      >
        <div className="text-center py-16">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
            <Trans>Фотограф не найден</Trans>
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            <Trans>
              Возможно, фотограф был удален или вы указали неверный ID
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
      title={_(msg`Фотографии фотографа: ${photographer.name}`)}
      description={_(msg`Просмотр и управление фотографиями фотографа`)}
    >
      <div className="space-y-6">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              type="text"
              placeholder={_(msg`Поиск по имени файла, гостю или сессии...`)}
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
                <Image className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    <Trans>Общий размер</Trans>
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
                    <Trans>Уникальные гости</Trans>
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
            icon={<Image className="w-12 h-12" />}
            title={
              searchQuery
                ? _(msg`Фотографии не найдены`)
                : _(msg`Нет фотографий`)
            }
            description={
              searchQuery
                ? _(msg`Фотографии не найдены по вашему запросу`)
                : _(msg`У этого фотографа пока нет фотографий`)
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
                  <img
                    src={photo.thumbnailUrl}
                    alt={photo.filename}
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
                            <Trans>Сессия:</Trans>
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
