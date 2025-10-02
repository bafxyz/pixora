'use client'

import { msg, Trans } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Button } from '@repo/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'
import { FormField } from '@repo/ui/form-field'
import { Input } from '@repo/ui/input'
import { PageLayout } from '@repo/ui/page-layout'
import { Spinner } from '@repo/ui/spinner'
import { ArrowLeft, Save } from 'lucide-react'
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

export default function EditPhotographerPage() {
  const { _ } = useLingui()
  const [photographer, setPhotographer] = useState<PhotographerDetails | null>(
    null
  )
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const params = useParams()
  const photographerId = params.id as string

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  })

  useEffect(() => {
    const fetchPhotographerDetails = async () => {
      try {
        const response = await fetch(
          `/api/studio-admin/photographers/${photographerId}`
        )
        const data = await response.json()

        if (response.ok) {
          setPhotographer(data.photographer)
          setFormData({
            name: data.photographer.name,
            email: data.photographer.email,
            phone: data.photographer.phone || '',
          })
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error(_(msg`Name and email are required`))
      return
    }

    setSaving(true)
    try {
      const response = await fetch(
        `/api/studio-admin/photographers/${photographerId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            phone: formData.phone || null,
          }),
        }
      )

      if (response.ok) {
        toast.success(_(msg`Photographer updated successfully`))
        router.push(`/studio-admin/photographers/${photographerId}`)
      } else {
        const data = await response.json()
        toast.error(data.error || _(msg`Error updating photographer`))
      }
    } catch (error) {
      console.error('Error updating photographer:', error)
      toast.error(_(msg`Error updating photographer`))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <PageLayout
        title={_(msg`Edit Photographer`)}
        description={_(msg`Update photographer information`)}
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
      title={_(msg`Edit Photographer`)}
      description={_(msg`Update photographer information`)}
    >
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-6">
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

        <Card>
          <CardHeader>
            <CardTitle>
              <Trans>Basic Information</Trans>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <FormField label={_(msg`Name`)} required>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder={_(msg`Enter photographer name`)}
                  required
                />
              </FormField>

              <FormField label={_(msg`Email`)} required>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder={_(msg`Enter email`)}
                  required
                />
              </FormField>

              <FormField label={_(msg`Phone`)} description={_(msg`Optional`)}>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder={_(msg`Enter phone number`)}
                />
              </FormField>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    router.push(`/studio-admin/photographers/${photographerId}`)
                  }
                  disabled={saving}
                  className="w-full sm:w-auto order-2 sm:order-1"
                >
                  <Trans>Cancel</Trans>
                </Button>
                <Button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={saving}
                  className="flex items-center justify-center gap-2 w-full sm:w-auto order-1 sm:order-2"
                >
                  {saving && <Spinner size="sm" />}
                  <Save className="w-4 h-4" />
                  {saving ? <Trans>Saving...</Trans> : <Trans>Save</Trans>}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}
