'use client'

import { msg, Trans } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'
import { useConfirmation } from '@repo/ui/confirmation-dialog'
import { PageLayout } from '@repo/ui/page-layout'
import {
  ArrowLeft,
  Calendar,
  Camera,
  Edit,
  Loader2,
  Mail,
  Phone,
  ShoppingBag,
  Trash2,
  Users,
} from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface PhotographerDetails {
  id: string
  name: string
  email: string
  phone: string | null
  createdAt: string
  guestCount: number
  photoCount: number
  orderCount: number
}

interface RecentActivity {
  id: string
  type: 'guest' | 'photo' | 'order'
  description: string
  createdAt: string
}

export default function PhotographerDetailsPage() {
  const { _ } = useLingui()
  const [photographer, setPhotographer] = useState<PhotographerDetails | null>(
    null
  )
  const [_recentActivity, _setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const params = useParams()
  const photographerId = params.id as string
  const { confirm, dialog } = useConfirmation()

  useEffect(() => {
    const fetchPhotographerDetails = async () => {
      try {
        const response = await fetch(
          `/api/studio-admin/photographers/${photographerId}`
        )
        const data = await response.json()

        if (response.ok) {
          setPhotographer(data.photographer)
        } else {
          console.error('Failed to fetch photographer details:', data.error)
          toast.error(_(msg`Error loading photographer data`))
          router.push('/studio-admin/photographers')
        }
      } catch (error) {
        console.error('Error fetching photographer details:', error)
        toast.error(_(msg`Error loading photographer data`))
        router.push('/studio-admin/photographers')
      } finally {
        setLoading(false)
      }
    }

    if (photographerId) {
      fetchPhotographerDetails()
    }
  }, [photographerId, router, _])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const handleDelete = async () => {
    if (!photographer) return

    const confirmed = await confirm({
      title: _(msg`Delete Photographer`),
      description: _(msg`Are you sure you want to delete this photographer?`),
      variant: 'danger',
    })

    if (!confirmed) return

    try {
      const response = await fetch(
        `/api/studio-admin/photographers/${photographerId}`,
        {
          method: 'DELETE',
        }
      )

      if (response.ok) {
        toast.success(_(msg`Photographer deleted successfully`))
        router.push('/studio-admin/photographers')
      } else {
        const data = await response.json()
        toast.error(data.error || _(msg`Error deleting photographer`))
      }
    } catch (error) {
      console.error('Error deleting photographer:', error)
      toast.error(_(msg`Error deleting photographer`))
    }
  }

  if (loading) {
    return (
      <PageLayout
        title={_(msg`Photographer Details`)}
        description={_(msg`View detailed information about the photographer`)}
      >
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
            <Trans>Back to List</Trans>
          </Button>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout
      title={_(msg`Photographer: ${photographer.name}`)}
      description={_(
        msg`Detailed information about the photographer and their activities`
      )}
    >
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <Button
            variant="outline"
            onClick={() => router.push('/studio-admin/photographers')}
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            <Trans>Back to List</Trans>
          </Button>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() =>
                router.push(
                  `/studio-admin/photographers/${photographerId}/edit`
                )
              }
              className="w-full sm:w-auto"
            >
              <Edit className="w-4 h-4 mr-2" />
              <Trans>Edit</Trans>
            </Button>
            <Button
              variant="outline"
              onClick={handleDelete}
              className="text-red-600 hover:text-red-700 w-full sm:w-auto"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              <Trans>Delete</Trans>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="xl:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  <Trans>Basic Information</Trans>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">
                      <Trans>Name</Trans>
                    </span>
                    <p className="text-lg font-semibold break-words">
                      {photographer.name}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">
                      <Trans>Registration Date</Trans>
                    </span>
                    <p className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="break-words">
                        {formatDate(photographer.createdAt)}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">
                      <Trans>Email</Trans>
                    </span>
                    <p className="flex items-center">
                      <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="break-words text-sm">
                        {photographer.email}
                      </span>
                    </p>
                  </div>
                  {photographer.phone && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">
                        <Trans>Phone</Trans>
                      </span>
                      <p className="flex items-center">
                        <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="break-words">
                          {photographer.phone}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Statistics */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  <Trans>Statistics</Trans>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded">
                  <div className="flex items-center min-w-0">
                    <Users className="w-5 h-5 mr-2 text-blue-600 flex-shrink-0" />
                    <span className="font-medium truncate">
                      <Trans>Guests</Trans>
                    </span>
                  </div>
                  <Badge variant="secondary" className="flex-shrink-0">
                    {photographer.guestCount}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/30 rounded">
                  <div className="flex items-center min-w-0">
                    <Camera className="w-5 h-5 mr-2 text-green-600 flex-shrink-0" />
                    <span className="font-medium truncate">
                      <Trans>Photos</Trans>
                    </span>
                  </div>
                  <Badge variant="secondary" className="flex-shrink-0">
                    {photographer.photoCount}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/30 rounded">
                  <div className="flex items-center min-w-0">
                    <ShoppingBag className="w-5 h-5 mr-2 text-purple-600 flex-shrink-0" />
                    <span className="font-medium truncate">
                      <Trans>Orders</Trans>
                    </span>
                  </div>
                  <Badge variant="secondary" className="flex-shrink-0">
                    {photographer.orderCount}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>
                  <Trans>Quick Actions</Trans>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() =>
                    router.push(
                      `/studio-admin/photographers/${photographerId}/guests`
                    )
                  }
                >
                  <Users className="w-4 h-4 mr-2" />
                  <Trans>View Guests</Trans>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() =>
                    router.push(
                      `/studio-admin/photographers/${photographerId}/photos`
                    )
                  }
                >
                  <Camera className="w-4 h-4 mr-2" />
                  <Trans>View Photos</Trans>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() =>
                    router.push(
                      `/studio-admin/photographers/${photographerId}/orders`
                    )
                  }
                >
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  <Trans>View Orders</Trans>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {dialog}
    </PageLayout>
  )
}
