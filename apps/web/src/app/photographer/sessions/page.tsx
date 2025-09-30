'use client'

import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'
// Dialog component not available
// import { Dialog } from '@repo/ui/dialog'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import {
  Calendar,
  CalendarPlus,
  Clock,
  Eye,
  Image,
  Loader2,
  Pencil,
  Trash2,
  Upload,
  Users,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
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
  guestCount: number
  photoCount: number
}

export default function PhotographerSessionsPage() {
  const router = useRouter()
  const [sessions, setSessions] = useState<PhotoSession[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [createdSession, setCreatedSession] = useState<PhotoSession | null>(
    null
  )
  const [editingSession, setEditingSession] = useState<PhotoSession | null>(
    null
  )
  const [sessionQRData, setSessionQRData] = useState<QRData | null>(null)
  const [newSession, setNewSession] = useState({
    name: '',
    description: '',
    scheduledAt: '',
  })
  const [editSession, setEditSession] = useState({
    name: '',
    description: '',
    scheduledAt: '',
  })

  useEffect(() => {
    const fetchSessions = async () => {
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
    }

    fetchSessions()
  }, [])

  const handleEditClick = (session: PhotoSession) => {
    setEditingSession(session)
    setEditSession({
      name: session.name,
      description: session.description || '',
      scheduledAt: session.scheduledAt
        ? new Date(session.scheduledAt).toISOString().slice(0, 16)
        : '',
    })
    setShowEditModal(true)
  }

  const handleUpdateSession = async () => {
    if (!editingSession || !editSession.name.trim()) {
      toast.error('Название фотосессии обязательно')
      return
    }

    try {
      // Convert datetime-local format to ISO string for API
      let scheduledAtISO = null
      if (editSession.scheduledAt) {
        scheduledAtISO = new Date(`${editSession.scheduledAt}:00`).toISOString()
      }

      const response = await fetch(`/api/photo-sessions/${editingSession.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editSession.name,
          description: editSession.description,
          scheduledAt: scheduledAtISO,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Фотосессия обновлена')
        setSessions(
          sessions.map((s) =>
            s.id === editingSession.id ? data.photoSession : s
          )
        )
        setShowEditModal(false)
        setEditingSession(null)
      } else {
        toast.error(data.error || 'Ошибка при обновлении')
      }
    } catch (error) {
      console.error('Error updating session:', error)
      toast.error('Ошибка при обновлении')
    }
  }

  const handleDeleteSession = async (
    sessionId: string,
    sessionName: string
  ) => {
    if (
      !confirm(
        `Вы уверены, что хотите удалить сессию "${sessionName}"? Все фотографии будут удалены.`
      )
    ) {
      return
    }

    try {
      const response = await fetch(`/api/photo-sessions/${sessionId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Фотосессия удалена')
        setSessions(sessions.filter((s) => s.id !== sessionId))
      } else {
        const data = await response.json()
        toast.error(data.error || 'Ошибка при удалении')
      }
    } catch (error) {
      console.error('Error deleting session:', error)
      toast.error('Ошибка при удалении')
    }
  }

  const handleCreateSession = async () => {
    if (!newSession.name.trim()) {
      toast.error('Название фотосессии обязательно')
      return
    }

    try {
      // Convert datetime-local format to ISO string for API
      let scheduledAtISO = null
      if (newSession.scheduledAt) {
        scheduledAtISO = new Date(`${newSession.scheduledAt}:00`).toISOString()
      }

      const response = await fetch('/api/photo-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newSession.name,
          description: newSession.description,
          scheduledAt: scheduledAtISO,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        const session = data.photoSession

        // Generate QR code for the session
        const qrData: QRData = {
          id: session.id,
          name: session.name,
          type: 'session',
          timestamp: new Date().toISOString(),
        }

        toast.success('Фотосессия создана успешно')
        setSessions([session, ...sessions])
        setCreatedSession(session)
        setSessionQRData(qrData)
        setNewSession({ name: '', description: '', scheduledAt: '' })
        setShowCreateModal(false)
        setShowQRModal(true) // Show QR code immediately
      } else {
        toast.error(data.error || 'Ошибка при создании фотосессии')
      }
    } catch (error) {
      console.error('Error creating session:', error)
      toast.error('Ошибка при создании фотосессии')
    }
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

  if (loading) {
    return (
      <PageLayout
        title="Мои фотосессии"
        description="Планирование и управление вашими фотосессиями"
      >
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout
      title="Мои фотосессии"
      description="Планирование и управление вашими фотосессиями"
    >
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Фотосессии</h1>
          <Button onClick={() => setShowCreateModal(true)}>
            <CalendarPlus className="w-4 h-4 mr-2" />
            Создать сессию
          </Button>
        </div>

        {/* Modal for editing session */}
        {showEditModal && editingSession && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h2 className="text-lg font-semibold mb-4">
                Редактировать фотосессию
              </h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Название</Label>
                  <Input
                    id="edit-name"
                    value={editSession.name}
                    onChange={(e) =>
                      setEditSession({ ...editSession, name: e.target.value })
                    }
                    placeholder="Например: Свадебная съемка, Портретная сессия"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Описание</Label>
                  <Input
                    id="edit-description"
                    value={editSession.description}
                    onChange={(e) =>
                      setEditSession({
                        ...editSession,
                        description: e.target.value,
                      })
                    }
                    placeholder="Краткое описание фотосессии"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-scheduledAt">Дата и время</Label>
                  <Input
                    id="edit-scheduledAt"
                    type="datetime-local"
                    value={editSession.scheduledAt}
                    onChange={(e) =>
                      setEditSession({
                        ...editSession,
                        scheduledAt: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingSession(null)
                  }}
                >
                  Отмена
                </Button>
                <Button onClick={handleUpdateSession}>Сохранить</Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal for creating session */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h2 className="text-lg font-semibold mb-4">
                Создать новую фотосессию
              </h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Название</Label>
                  <Input
                    id="name"
                    value={newSession.name}
                    onChange={(e) =>
                      setNewSession({ ...newSession, name: e.target.value })
                    }
                    placeholder="Например: Свадебная съемка, Портретная сессия"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Описание</Label>
                  <Input
                    id="description"
                    value={newSession.description}
                    onChange={(e) =>
                      setNewSession({
                        ...newSession,
                        description: e.target.value,
                      })
                    }
                    placeholder="Краткое описание фотосессии"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scheduledAt">Дата и время</Label>
                  <Input
                    id="scheduledAt"
                    type="datetime-local"
                    value={newSession.scheduledAt}
                    onChange={(e) =>
                      setNewSession({
                        ...newSession,
                        scheduledAt: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                >
                  Отмена
                </Button>
                <Button onClick={handleCreateSession}>Создать</Button>
              </div>
            </div>
          </div>
        )}

        {sessions.length === 0 ? (
          <div className="text-center py-16">
            <Calendar className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
              Нет фотосессий
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Создайте первую фотосессию, чтобы начать
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((session) => (
              <Card
                key={session.id}
                className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() =>
                  router.push(`/photographer/sessions/${session.id}`)
                }
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
                      {new Date(session.createdAt).toLocaleDateString('ru-RU')}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t space-y-2">
                    <div className="flex gap-2 justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/photographer/sessions/${session.id}`)
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Просмотр
                      </Button>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(
                            `/photographer/upload?sessionId=${session.id}`
                          )
                        }}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Upload className="w-4 h-4 mr-1" />
                        Загрузить
                      </Button>
                    </div>
                    <div className="flex gap-2 justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditClick(session)
                        }}
                      >
                        <Pencil className="w-4 h-4 mr-1" />
                        Изменить
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteSession(session.id, session.name)
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Удалить
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* QR Code Modal */}
        {showQRModal && createdSession && sessionQRData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h2 className="text-lg font-semibold mb-4">
                QR код для фотосессии
              </h2>

              {/* Session Info */}
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">
                  Фотосессия создана!
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Название:</span>
                    <span className="font-medium">{createdSession.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">ID сессии:</span>
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                      {createdSession.id}
                    </code>
                  </div>
                </div>
              </div>

              {/* QR Code */}
              <div className="flex justify-center p-4 bg-white rounded-lg border mb-4">
                <QRCode
                  value={JSON.stringify(sessionQRData)}
                  size={200}
                  style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
                />
              </div>

              {/* Instructions */}
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 text-center">
                  <strong>Покажите этот QR код клиентам</strong>
                  <br />
                  Они смогут отсканировать его и получить доступ к фотографиям
                  из этой сессии
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button
                  onClick={() =>
                    router.push(
                      `/photographer/upload?sessionId=${createdSession.id}`
                    )
                  }
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Загрузить фотографии в сессию
                </Button>

                <Button
                  onClick={() => setShowQRModal(false)}
                  variant="outline"
                  className="w-full"
                >
                  Закрыть
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  )
}
