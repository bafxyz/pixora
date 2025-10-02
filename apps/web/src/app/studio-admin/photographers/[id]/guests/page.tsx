'use client'

import { msg, Trans } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'
import { EmptyState } from '@repo/ui/empty-state'
import { Input } from '@repo/ui/input'
import { Spinner } from '@repo/ui/spinner'
import { ArrowLeft, Calendar, Mail, Search, User, Users } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { PageLayout } from '@repo/ui/page-layout'

interface Guest {
  id: string
  name: string
  email: string
  phone: string | null
  createdAt: string
  photoCount: number
  lastActiveAt: string | null
}

interface PhotographerDetails {
  id: string
  name: string
  email: string
}

export default function PhotographerGuestsPage() {
  const { _ } = useLingui()
  const [guests, setGuests] = useState<Guest[]>([])
  const [filteredGuests, setFilteredGuests] = useState<Guest[]>([])
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

        // Fetch guests
        const guestsResponse = await fetch(
          `/api/studio-admin/photographers/${photographerId}/guests`
        )
        const guestsData = await guestsResponse.json()

        if (guestsResponse.ok) {
          setGuests(guestsData.guests || [])
          setFilteredGuests(guestsData.guests || [])
        } else {
          console.error('Failed to fetch guests:', guestsData.error)
          toast.error(_(msg`Ошибка при загрузке гостей`))
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
      setFilteredGuests(guests)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredGuests(
        guests.filter(
          (guest) =>
            guest.name.toLowerCase().includes(query) ||
            guest.email.toLowerCase().includes(query) ||
            (guest.phone && guest.phone.includes(query))
        )
      )
    }
  }, [searchQuery, guests])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatLastActive = (dateString: string | null) => {
    if (!dateString) return _(msg`Никогда`)

    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    )

    if (diffInHours < 1) return _(msg`Только что`)
    if (diffInHours < 24) return `${diffInHours} ${_(msg`ч.`)} назад`
    if (diffInHours < 24 * 7)
      return `${Math.floor(diffInHours / 24)} ${_(msg`д.`)} назад`
    return formatDate(dateString)
  }

  if (loading) {
    return (
      <PageLayout
        title={_(msg`Гости фотографа`)}
        description={_(msg`Просмотр гостей фотографа`)}
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
      title={_(msg`Гости фотографа: ${photographer.name}`)}
      description={_(msg`Просмотр и управление гостями фотографа`)}
    >
      <div className="space-y-6">
        {/* Actions Bar */}
        <div className="flex flex-col gap-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              type="text"
              placeholder={_(msg`Поиск по имени, email или телефону...`)}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full"
            />
          </div>
          <Button
            variant="outline"
            onClick={() =>
              router.push(`/studio-admin/photographers/${photographerId}`)
            }
            className="w-full sm:w-auto"
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
                    <Trans>Total Guests</Trans>
                  </p>
                  <p className="text-2xl font-bold">{guests.length}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    <Trans>Active Guests</Trans>
                  </p>
                  <p className="text-2xl font-bold">
                    {
                      guests.filter(
                        (g) =>
                          g.lastActiveAt &&
                          new Date(g.lastActiveAt) >
                            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                      ).length
                    }
                  </p>
                </div>
                <User className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    <Trans>Total Photos</Trans>
                  </p>
                  <p className="text-2xl font-bold">
                    {guests.reduce((sum, guest) => sum + guest.photoCount, 0)}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Guests List */}
        {filteredGuests.length === 0 ? (
          <EmptyState
            icon={<Users className="w-12 h-12" />}
            title={searchQuery ? _(msg`Гости не найдены`) : _(msg`Нет гостей`)}
            description={
              searchQuery
                ? _(msg`Гости не найдены по вашему запросу`)
                : _(msg`У этого фотографа пока нет гостей`)
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGuests.map((guest) => (
              <Card
                key={guest.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">
                          {guest.name}
                        </CardTitle>
                        <p className="text-sm text-slate-500 truncate">
                          {guest.email}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {guest.phone && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Mail className="w-4 h-4" />
                        <span>{guest.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Calendar className="w-4 h-4" />
                        <span>
                          <Trans>Photos:</Trans>
                        </span>
                      </div>
                      <Badge variant="secondary">{guest.photoCount}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <User className="w-4 h-4" />
                        <span>
                          <Trans>Activity:</Trans>
                        </span>
                      </div>
                      <span className="text-xs text-slate-500">
                        {formatLastActive(guest.lastActiveAt)}
                      </span>
                    </div>
                    <div className="pt-2 border-t text-xs text-slate-500">
                      <Trans>Регистрация:</Trans> {formatDate(guest.createdAt)}
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
