'use client'

import { useLingui } from '@lingui/react'
import { Trans } from '@lingui/react/macro'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'
import { Calendar, Clock, Image, Loader2, Upload, Users } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { PhotoUpload } from '@/features/photographer/components/photo-upload'

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
  guestCount: number
  photoCount: number
}

export default function PhotographerUploadPage() {
  const { _ } = useLingui()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [selectedSessionId, setSelectedSessionId] = useState<string>('')
  const [sessions, setSessions] = useState<PhotoSession[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSessions = useCallback(async () => {
    try {
      const response = await fetch('/api/photo-sessions')
      const data = await response.json()

      if (response.ok) {
        setSessions(data.photoSessions)
      } else {
        console.error('Failed to fetch sessions:', data.error)
        toast.error('Ошибка при загрузке фотосессий')
      }
    } catch (error) {
      console.error('Error fetching sessions:', error)
      toast.error('Ошибка при загрузке фотосессий')
    } finally {
      setLoading(false)
    }
  }, [])

  // Handle URL parameters
  useEffect(() => {
    const sessionIdParam = searchParams.get('sessionId')

    if (sessionIdParam) {
      setSelectedSessionId(sessionIdParam)
      setLoading(false)
    } else {
      // No target selected, fetch sessions
      fetchSessions()
    }
  }, [searchParams, fetchSessions])

  const handleUploadComplete = (
    _uploadedUrls: string[],
    _sessionId: string
  ) => {
    toast.success(`Photos uploaded successfully to session!`)
    setSelectedSessionId('')
  }

  const handleSessionSelect = (sessionId: string) => {
    router.push(`/photographer/upload?sessionId=${sessionId}`)
  }

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'default'
      case 'completed':
        return 'success'
      case 'archived':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Не запланировано'
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900">
      <div className="container mx-auto px-4 py-6 lg:py-8">
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">
            <Trans>Photo Upload</Trans>
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
            <Trans>Upload photos for guests and organize sessions</Trans>
          </p>
        </div>

        {selectedSessionId ? (
          <PhotoUpload
            presetSessionId={selectedSessionId}
            onUploadComplete={handleUploadComplete}
            onUploadError={(error) => console.error('Upload error:', error)}
          />
        ) : loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : sessions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                <Trans>No photo sessions</Trans>
              </h3>
              <p className="text-gray-600 text-center mb-4">
                <Trans>Create a photo session first to upload photos</Trans>
              </p>
              <Button onClick={() => router.push('/photographer/sessions')}>
                <Trans>Create Session</Trans>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
                <Trans>Select a photo session to upload to:</Trans>
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sessions.map((session) => (
                <Card
                  key={session.id}
                  className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleSessionSelect(session.id)}
                >
                  <CardHeader className="bg-muted/30">
                    <CardTitle className="flex items-center justify-between">
                      <span className="truncate">{session.name}</span>
                      <Badge
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusVariant(session.status) === 'secondary' ? 'bg-gray-100 text-gray-800' : getStatusVariant(session.status) === 'default' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}
                      >
                        {session.status === 'created'
                          ? 'Создана'
                          : session.status === 'active'
                            ? 'Активна'
                            : session.status === 'completed'
                              ? 'Завершена'
                              : session.status === 'archived'
                                ? 'Архив'
                                : session.status}
                      </Badge>
                    </CardTitle>
                    {session.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {session.description}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="w-4 h-4 mr-2" />
                        {formatDate(session.scheduledAt)}
                      </div>

                      <div className="flex items-center text-sm text-muted-foreground">
                        <Users className="w-4 h-4 mr-2" />
                        {session.guestCount} гостей
                      </div>

                      <div className="flex items-center text-sm text-muted-foreground">
                        <Image className="w-4 h-4 mr-2" />
                        {session.photoCount} фото
                      </div>

                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4 mr-2" />
                        Создана:{' '}
                        {new Date(session.createdAt).toLocaleDateString(
                          'ru-RU'
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t flex justify-center">
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSessionSelect(session.id)
                        }}
                        className="bg-green-600 hover:bg-green-700 w-full"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        <Trans>Upload Photos</Trans>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
