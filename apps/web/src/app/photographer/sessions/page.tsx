'use client'

import { Trans } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'
import { useConfirmation } from '@repo/ui/confirmation-dialog'
import { EmptyState } from '@repo/ui/empty-state'
import { Input } from '@repo/ui/input'
import { Modal, ModalContent, ModalFooter, ModalHeader } from '@repo/ui/modal'
import { PageLayout } from '@repo/ui/page-layout'
import { Spinner } from '@repo/ui/spinner'
import {
  Calendar,
  Clock,
  Eye,
  Image,
  Pencil,
  Trash2,
  Upload,
  Users,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import QRCode from 'react-qr-code'
import { toast } from 'sonner'
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
  const { _ } = useLingui()
  const router = useRouter()
  const { confirm, dialog } = useConfirmation()
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
    scheduledAt: new Date().toISOString().split('T')[0],
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
          toast.error(_('Error loading photo sessions'))
        }
      } catch (error) {
        console.error('Error fetching sessions:', error)
        toast.error(_('Error loading photo sessions'))
      } finally {
        setLoading(false)
      }
    }

    fetchSessions()
  }, [_])

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
      toast.error(_('Photo session name is required'))
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
        toast.success(_('Photo session updated'))
        setSessions(
          sessions.map((s) =>
            s.id === editingSession.id ? data.photoSession : s
          )
        )
        setShowEditModal(false)
        setEditingSession(null)
      } else {
        toast.error(data.error || _('Error updating session'))
      }
    } catch (error) {
      console.error('Error updating session:', error)
      toast.error(_('Error updating session'))
    }
  }

  const handleDeleteSession = async (
    sessionId: string,
    sessionName: string
  ) => {
    const confirmed = await confirm({
      title: _('Delete Photo Session'),
      description: _(
        'Are you sure you want to delete session "{name}"? All photos will be deleted.',
        { name: sessionName }
      ),
      confirmText: _('Delete'),
      cancelText: _('Cancel'),
      variant: 'danger',
    })

    if (!confirmed) {
      return
    }

    try {
      const response = await fetch(`/api/photo-sessions/${sessionId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success(_('Photo session deleted'))
        setSessions(sessions.filter((s) => s.id !== sessionId))
      } else {
        const data = await response.json()
        toast.error(data.error || _('Error deleting session'))
      }
    } catch (error) {
      console.error('Error deleting session:', error)
      toast.error(_('Error deleting session'))
    }
  }

  const handleCreateSession = async () => {
    if (!newSession.name.trim()) {
      toast.error(_('Photo session name is required'))
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

        toast.success(_('Photo session created successfully'))
        setSessions([session, ...sessions])
        setCreatedSession(session)
        setSessionQRData(qrData)
        setNewSession({ name: '', description: '', scheduledAt: '' })
        setShowCreateModal(false)
        setShowQRModal(true) // Show QR code immediately
      } else {
        toast.error(data.error || _('Error creating photo session'))
      }
    } catch (error) {
      console.error('Error creating session:', error)
      toast.error(_('Error creating photo session'))
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
    if (!dateString) return _('Not scheduled')
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <PageLayout
        title={_('My Photo Sessions')}
        description={_('Plan and manage your photo sessions')}
      >
        <div className="flex justify-center items-center py-12">
          <Spinner size="lg" />
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout
      title={_('My Photo Sessions')}
      description={_('Plan and manage your photo sessions')}
    >
      {dialog}
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold">
            <Trans>Photo Sessions</Trans>
          </h1>
        </div>

        {/* Modal for editing session */}
        <Modal
          isOpen={showEditModal && !!editingSession}
          onClose={() => {
            setShowEditModal(false)
            setEditingSession(null)
          }}
          size="md"
        >
          <ModalHeader>
            <h2 className="text-lg font-semibold">
              <Trans>Edit Photo Session</Trans>
            </h2>
          </ModalHeader>
          <ModalContent>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="edit-name"
                  className="block text-sm font-medium mb-1"
                >
                  <Trans>Name</Trans>
                </label>
                <Input
                  id="edit-name"
                  value={editSession.name}
                  onChange={(e) =>
                    setEditSession({ ...editSession, name: e.target.value })
                  }
                  placeholder={_('e.g., Wedding shoot, Portrait session')}
                />
              </div>
              <div>
                <label
                  htmlFor="edit-description"
                  className="block text-sm font-medium mb-1"
                >
                  <Trans>Description</Trans>
                </label>
                <Input
                  id="edit-description"
                  value={editSession.description}
                  onChange={(e) =>
                    setEditSession({
                      ...editSession,
                      description: e.target.value,
                    })
                  }
                  placeholder={_('Brief description of the photo session')}
                />
              </div>
              <div>
                <label
                  htmlFor="edit-datetime"
                  className="block text-sm font-medium mb-1"
                >
                  <Trans>Date and Time</Trans>
                </label>
                <Input
                  id="edit-datetime"
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
          </ModalContent>
          <ModalFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditModal(false)
                setEditingSession(null)
              }}
            >
              <Trans>Cancel</Trans>
            </Button>
            <Button onClick={handleUpdateSession}>
              <Trans>Save</Trans>
            </Button>
          </ModalFooter>
        </Modal>

        {/* Modal for creating session */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          size="md"
        >
          <ModalHeader>
            <h2 className="text-lg font-semibold">
              <Trans>Create New Photo Session</Trans>
            </h2>
          </ModalHeader>
          <ModalContent>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="new-name"
                  className="block text-sm font-medium mb-1"
                >
                  <Trans>Name</Trans>
                </label>
                <Input
                  id="new-name"
                  value={newSession.name}
                  onChange={(e) =>
                    setNewSession({ ...newSession, name: e.target.value })
                  }
                  placeholder={_('e.g., Wedding shoot, Portrait session')}
                />
              </div>
              <div>
                <label
                  htmlFor="new-description"
                  className="block text-sm font-medium mb-1"
                >
                  <Trans>Description</Trans>
                </label>
                <Input
                  id="new-description"
                  value={newSession.description}
                  onChange={(e) =>
                    setNewSession({
                      ...newSession,
                      description: e.target.value,
                    })
                  }
                  placeholder={_('Brief description of the photo session')}
                />
              </div>
              <div>
                <label
                  htmlFor="new-datetime"
                  className="block text-sm font-medium mb-1"
                >
                  <Trans>Date and Time</Trans>
                </label>
                <Input
                  id="new-datetime"
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
          </ModalContent>
          <ModalFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              <Trans>Cancel</Trans>
            </Button>
            <Button onClick={handleCreateSession}>
              <Trans>Create</Trans>
            </Button>
          </ModalFooter>
        </Modal>

        {sessions.length === 0 ? (
          <EmptyState
            icon={<Calendar className="w-16 h-16" />}
            title={_('No Photo Sessions')}
            description={_('Create your first photo session to get started')}
            action={{
              label: _('Create Session'),
              onClick: () => setShowCreateModal(true),
            }}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
                        ? _('Created')
                        : session.status === 'active'
                          ? _('Active')
                          : session.status === 'completed'
                            ? _('Completed')
                            : session.status === 'archived'
                              ? _('Archived')
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
                      {session.guestCount}{' '}
                      {session.guestCount === 1 ? _('guest') : _('guests')}
                    </div>

                    <div className="flex items-center text-sm text-muted-foreground">
                      <Image className="w-4 h-4 mr-2" />
                      {session.photoCount}{' '}
                      {session.photoCount === 1 ? _('photo') : _('photos')}
                    </div>

                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4 mr-2" />
                      <Trans>Created:</Trans>{' '}
                      {new Date(session.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t space-y-2">
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/photographer/sessions/${session.id}`)
                        }}
                        className="flex-1 hover:cursor-pointer"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        <span className="hidden sm:inline">
                          <Trans>View</Trans>
                        </span>
                        <span className="sm:hidden">
                          <Trans>View</Trans>
                        </span>
                      </Button>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(
                            `/photographer/upload?sessionId=${session.id}`
                          )
                        }}
                        className="bg-green-600 hover:bg-green-700 flex-1 hover:cursor-pointer"
                      >
                        <Upload className="w-4 h-4 mr-1" />
                        <span className="hidden sm:inline">
                          <Trans>Upload</Trans>
                        </span>
                        <span className="sm:hidden">
                          <Trans>Upload</Trans>
                        </span>
                      </Button>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditClick(session)
                        }}
                        className="flex-1 hover:cursor-pointer"
                      >
                        <Pencil className="w-4 h-4 mr-1" />
                        <span className="hidden sm:inline">
                          <Trans>Edit</Trans>
                        </span>
                        <span className="sm:hidden">
                          <Trans>Edit</Trans>
                        </span>
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteSession(session.id, session.name)
                        }}
                        className="flex-1 hover:cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        <span className="hidden sm:inline">
                          <Trans>Delete</Trans>
                        </span>
                        <span className="sm:hidden">
                          <Trans>Del</Trans>
                        </span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* QR Code Modal */}
        <Modal
          isOpen={showQRModal && !!createdSession && !!sessionQRData}
          onClose={() => setShowQRModal(false)}
          size="md"
        >
          <ModalHeader>
            <h2 className="text-lg font-semibold">QR Code for Photo Session</h2>
          </ModalHeader>
          <ModalContent>
            {createdSession && sessionQRData && (
              <>
                {/* Session Info */}
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">
                    Photo Session Created!
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{createdSession.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Session ID:</span>
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
                    <strong>Show this QR code to clients</strong>
                    <br />
                    They will be able to scan it and access photos from this
                    session
                  </p>
                </div>
              </>
            )}
          </ModalContent>
          <ModalFooter>
            <Button
              onClick={() => {
                if (createdSession) {
                  router.push(
                    `/photographer/upload?sessionId=${createdSession.id}`
                  )
                }
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Photos to Session
            </Button>
            <Button onClick={() => setShowQRModal(false)} variant="outline">
              Close
            </Button>
          </ModalFooter>
        </Modal>
      </div>
    </PageLayout>
  )
}
