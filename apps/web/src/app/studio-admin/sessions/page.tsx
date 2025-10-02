'use client'

import { Trans } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'
import { EmptyState } from '@repo/ui/empty-state'
import { PageLayout } from '@repo/ui/page-layout'
import { Spinner } from '@repo/ui/spinner'
import { Calendar, Clock, Eye, Image, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

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

export default function StudioAdminSessionsPage() {
  const { _ } = useLingui()
  const router = useRouter()
  const [sessions, setSessions] = useState<PhotoSession[]>([])
  const [loading, setLoading] = useState(true)

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

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'archived':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
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
        title={_('Photo Sessions')}
        description={_('View and manage all photo sessions in your studio')}
      >
        <div className="flex justify-center items-center py-12">
          <Spinner size="lg" />
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout
      title={_('Photo Sessions')}
      description={_('View and manage all photo sessions in your studio')}
    >
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold">
            <Trans>Photo Sessions</Trans>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            <Trans>All photo sessions from your studio photographers</Trans>
          </p>
        </div>

        {sessions.length === 0 ? (
          <EmptyState
            icon={<Calendar className="w-16 h-16" />}
            title={_('No Photo Sessions')}
            description={_(
              "Photographers in your studio haven't created any sessions yet"
            )}
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
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusVariant(session.status)}`}
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
                      <Users className="w-4 h-4 mr-2" />
                      <Trans>Photographer:</Trans>{' '}
                      {session.photographer.name || session.photographer.email}
                    </div>

                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="w-4 h-4 mr-2" />
                      {formatDate(session.scheduledAt)}
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

                  <div className="mt-4 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/photographer/sessions/${session.id}`)
                      }}
                      className="w-full hover:cursor-pointer"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      <Trans>View Details</Trans>
                    </Button>
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
