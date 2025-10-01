'use client'

import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'
import {
  ArrowLeft,
  Calendar,
  Clock,
  Copy,
  Download,
  Eye,
  Image,
  Link2,
  Loader2,
  QrCode,
  Trash2,
  Upload,
} from 'lucide-react'
import NextImage from 'next/image'
import { useRouter } from 'next/navigation'
import { use, useCallback, useEffect, useState } from 'react'
import QRCode from 'react-qr-code'
import { toast } from 'sonner'
import { PageLayout } from '@/shared/components/page-layout'
import type { QRData } from '@/shared/lib/validations/auth.schemas'

interface PhotoSession {
  id: string
  name: string
  description: string | null
  status: string
  scheduledAt: string | null
  createdAt: string
  photographer: {
    id: string
    name: string
    email: string
  }
  photos: Array<{
    id: string
    filePath: string
    fileName: string
    fileSize: number | null
    isSelected: boolean
    createdAt: string
  }>
}

export default function SessionDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const { id: sessionId } = use(params)

  const [session, setSession] = useState<PhotoSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [showQR, setShowQR] = useState(false)
  const [qrData, setQrData] = useState<QRData | null>(null)
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set())
  const [isUpdatingPhotos, setIsUpdatingPhotos] = useState(false)
  const [sessionLink, setSessionLink] = useState<string>('')

  const fetchSessionDetails = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/photographer/sessions/${sessionId}`)

      if (!response.ok) {
        throw new Error('Failed to fetch session details')
      }

      const data = await response.json()
      setSession(data.session)

      // Initialize selected photos
      const selected = new Set<string>(
        data.session.photos
          .filter((photo: { isSelected?: boolean }) => photo.isSelected)
          .map((photo: { id: string }) => photo.id)
      )
      setSelectedPhotos(selected)

      // Generate QR data
      const qrPayload: QRData = {
        id: data.session.id,
        name: data.session.name,
        type: 'session',
        timestamp: new Date().toISOString(),
      }
      setQrData(qrPayload)

      // Generate session link
      const link = `${window.location.origin}/session/${data.session.id}`
      setSessionLink(link)
    } catch (error) {
      console.error('Error fetching session details:', error)
      toast.error('Ошибка при загрузке данных фотосессии')
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  useEffect(() => {
    fetchSessionDetails()
  }, [fetchSessionDetails])

  const togglePhotoSelection = (photoId: string) => {
    setSelectedPhotos((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(photoId)) {
        newSet.delete(photoId)
      } else {
        newSet.add(photoId)
      }
      return newSet
    })
  }

  const savePhotoSelection = async () => {
    if (!session) return

    try {
      setIsUpdatingPhotos(true)

      // Update each photo's selection status
      const updates = session.photos.map((photo) => ({
        photoId: photo.id,
        isSelected: selectedPhotos.has(photo.id),
      }))

      const response = await fetch(
        `/api/photographer/sessions/${sessionId}/photos`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ updates }),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to update photo selection')
      }

      toast.success('Выбор фотографий сохранен')
      await fetchSessionDetails() // Refresh data
    } catch (error) {
      console.error('Error updating photo selection:', error)
      toast.error('Ошибка при сохранении выбора фотографий')
    } finally {
      setIsUpdatingPhotos(false)
    }
  }

  const deletePhoto = async (photoId: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту фотографию?')) {
      return
    }

    try {
      const response = await fetch(`/api/photographer/photos/${photoId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: 'Unknown error' }))
        console.error('Delete photo error:', response.status, errorData)
        throw new Error(errorData.error || 'Failed to delete photo')
      }

      toast.success('Фотография удалена')
      await fetchSessionDetails() // Refresh data
    } catch (error) {
      console.error('Error deleting photo:', error)
      toast.error(
        error instanceof Error
          ? error.message
          : 'Ошибка при удалении фотографии'
      )
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Не запланировано'
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      case 'archived':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'created':
        return 'Создана'
      case 'active':
        return 'Активна'
      case 'completed':
        return 'Завершена'
      case 'archived':
        return 'Архив'
      default:
        return status
    }
  }

  if (loading) {
    return (
      <PageLayout
        title="Детали фотосессии"
        description="Просмотр и управление фотосессией"
      >
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    )
  }

  if (!session) {
    return (
      <PageLayout
        title="Фотосессия не найдена"
        description="Запрашиваемая фотосессия не существует"
      >
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Фотосессия не найдена</p>
          <Button onClick={() => router.push('/photographer/sessions')}>
            Вернуться к списку сессий
          </Button>
        </div>
      </PageLayout>
    )
  }

  const hasChanges = session.photos.some(
    (photo) => photo.isSelected !== selectedPhotos.has(photo.id)
  )

  return (
    <PageLayout
      title={session.name}
      description="Детали фотосессии и управление фотографиями"
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            onClick={() => router.push('/photographer/sessions')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад к сессиям
          </Button>

          <div className="flex gap-2">
            <Button
              onClick={() => {
                navigator.clipboard.writeText(sessionLink)
                toast.success('Ссылка скопирована в буфер обмена')
              }}
              variant="outline"
              className="flex items-center gap-2"
              disabled={!sessionLink}
            >
              <Link2 className="w-4 h-4" />
              Копировать ссылку
            </Button>
            <Button
              onClick={() => setShowQR(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <QrCode className="w-4 h-4" />
              QR код
            </Button>
            <Button
              onClick={() =>
                router.push(`/photographer/upload?sessionId=${sessionId}`)
              }
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <Upload className="w-4 h-4" />
              Загрузить фото
            </Button>
          </div>
        </div>

        {/* Session Info */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">{session.name}</CardTitle>
              <Badge className={getStatusColor(session.status)}>
                {getStatusText(session.status)}
              </Badge>
            </div>
            {session.description && (
              <p className="text-muted-foreground">{session.description}</p>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>Запланировано: {formatDate(session.scheduledAt)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>Создана: {formatDate(session.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Image className="w-4 h-4 text-muted-foreground" />
                <span>Фотографий: {session.photos.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Photo Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Image className="w-5 h-5" />
                Управление фотографиями
              </CardTitle>
              {hasChanges && (
                <Button
                  onClick={savePhotoSelection}
                  disabled={isUpdatingPhotos}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isUpdatingPhotos ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Сохранение...
                    </>
                  ) : (
                    'Сохранить изменения'
                  )}
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Выберите фотографии, которые будут видны клиентам. Выбрано:{' '}
              {selectedPhotos.size} из {session.photos.length}
            </p>
          </CardHeader>
          <CardContent>
            {session.photos.length === 0 ? (
              <div className="text-center py-12">
                <Image className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  В этой фотосессии пока нет фотографий
                </p>
                <Button
                  onClick={() =>
                    router.push(`/photographer/upload?sessionId=${sessionId}`)
                  }
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Загрузить первые фото
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {session.photos.map((photo) => (
                  <div
                    key={photo.id}
                    className={`relative group border-2 rounded-lg overflow-hidden transition-all ${
                      selectedPhotos.has(photo.id)
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="aspect-square relative">
                      <NextImage
                        src={photo.filePath}
                        alt={photo.fileName}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />

                      {/* Selection overlay */}
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />

                      {/* Selection indicator */}
                      <div className="absolute top-2 left-2">
                        <button
                          type="button"
                          onClick={() => togglePhotoSelection(photo.id)}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                            selectedPhotos.has(photo.id)
                              ? 'bg-green-500 border-green-500 text-white'
                              : 'bg-white border-gray-300 hover:border-green-500'
                          }`}
                        >
                          {selectedPhotos.has(photo.id) && (
                            <Eye className="w-3 h-3" />
                          )}
                        </button>
                      </div>

                      {/* Delete button */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => deletePhoto(photo.id)}
                          className="w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="p-2">
                      <p className="text-xs text-muted-foreground truncate">
                        {photo.fileName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {photo.fileSize
                          ? `${(photo.fileSize / 1024 / 1024).toFixed(1)} MB`
                          : 'Размер неизвестен'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* QR Code Modal */}
        {showQR && qrData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h2 className="text-lg font-semibold mb-4">
                QR код для фотосессии
              </h2>

              <div
                id="session-qr-code"
                className="flex justify-center p-4 bg-white rounded-lg border mb-4"
              >
                <QRCode
                  value={JSON.stringify(qrData)}
                  size={200}
                  style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
                />
              </div>

              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 text-center">
                  <strong>Покажите этот QR код клиентам</strong>
                  <br />
                  Они смогут получить доступ к фотографиям из этой сессии
                </p>
              </div>

              <div className="mb-4">
                <label
                  htmlFor="session-link"
                  className="text-sm font-medium mb-2 block"
                >
                  Ссылка на фотосессию:
                </label>
                <div className="flex gap-2">
                  <input
                    id="session-link"
                    type="text"
                    value={sessionLink}
                    readOnly
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md bg-gray-50"
                  />
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(sessionLink)
                      toast.success('Ссылка скопирована')
                    }}
                    variant="outline"
                    size="sm"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Отправьте эту ссылку клиентам через WhatsApp, Telegram или
                  email
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => setShowQR(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Закрыть
                </Button>
                <Button
                  onClick={() => {
                    // Download QR code as SVG
                    const svg = document.querySelector('#session-qr-code svg')
                    if (svg) {
                      const svgData = new XMLSerializer().serializeToString(svg)
                      const svgBlob = new Blob([svgData], {
                        type: 'image/svg+xml;charset=utf-8',
                      })
                      const svgUrl = URL.createObjectURL(svgBlob)
                      const downloadLink = document.createElement('a')
                      downloadLink.href = svgUrl
                      downloadLink.download = `qr-session-${session?.name || 'photo'}.svg`
                      document.body.appendChild(downloadLink)
                      downloadLink.click()
                      document.body.removeChild(downloadLink)
                      URL.revokeObjectURL(svgUrl)
                      toast.success('QR код скачан')
                    } else {
                      toast.error('Не удалось найти QR код')
                    }
                  }}
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Скачать
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  )
}
