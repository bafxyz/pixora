'use client'

import { msg, Trans } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'
import { EmptyState } from '@repo/ui/empty-state'
import { FormField } from '@repo/ui/form-field'
import { Input } from '@repo/ui/input'
import { Modal, ModalContent, ModalFooter, ModalHeader } from '@repo/ui/modal'
import { PageLayout } from '@repo/ui/page-layout'
import { Spinner } from '@repo/ui/spinner'
import {
  Building,
  Camera,
  FileImage,
  Phone,
  Search,
  ShieldCheck,
  UserPlus,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

interface Studio {
  id: string
  name: string
  email: string
}

interface StudioAdmin {
  id: string
  name: string
  email: string
  phone: string | null
  studio: Studio
  createdAt: string
  photoCount: number
  sessionCount: number
}

interface FormData {
  name: string
  email: string
  password: string
  phone: string
  studioId: string
}

export default function AdminStudioAdminsPage() {
  const { _ } = useLingui()
  const [studioAdmins, setStudioAdmins] = useState<StudioAdmin[]>([])
  const [studios, setStudios] = useState<Studio[]>([])
  const [filteredAdmins, setFilteredAdmins] = useState<StudioAdmin[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    phone: '',
    studioId: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadStudioAdmins = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/studio-admins')
      if (response.ok) {
        const data = await response.json()
        setStudioAdmins(data.studioAdmins || [])
        setFilteredAdmins(data.studioAdmins || [])
      } else {
        toast.error(_(msg`Failed to load studio admins`))
      }
    } catch (error) {
      console.error('Error loading studio admins:', error)
      toast.error(_(msg`Error loading studio admins`))
    } finally {
      setIsLoading(false)
    }
  }, [_])

  const loadStudios = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/studios')
      if (response.ok) {
        const data = await response.json()
        setStudios(data.studios || [])
      }
    } catch (error) {
      console.error('Error loading studios:', error)
    }
  }, [])

  useEffect(() => {
    loadStudioAdmins()
    loadStudios()
  }, [loadStudioAdmins, loadStudios])

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredAdmins(studioAdmins)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredAdmins(
        studioAdmins.filter(
          (admin) =>
            admin.name.toLowerCase().includes(query) ||
            admin.email.toLowerCase().includes(query) ||
            admin.studio.name.toLowerCase().includes(query)
        )
      )
    }
  }, [searchQuery, studioAdmins])

  const handleCreateStudioAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.password.trim() ||
      !formData.studioId
    ) {
      toast.error(_(msg`All fields are required`))
      return
    }

    if (formData.password.length < 6) {
      toast.error(_(msg`Password must be at least 6 characters`))
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/admin/studio-admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success(_(msg`Studio admin created successfully`))
        setIsCreateDialogOpen(false)
        setFormData({
          name: '',
          email: '',
          password: '',
          phone: '',
          studioId: '',
        })
        loadStudioAdmins()
      } else {
        const error = await response.json()
        toast.error(error.error || _(msg`Failed to create studio admin`))
      }
    } catch (error) {
      console.error('Error creating studio admin:', error)
      toast.error(_(msg`Error creating studio admin`))
    } finally {
      setIsSubmitting(false)
    }
  }

  const closeDialog = () => {
    setIsCreateDialogOpen(false)
    setFormData({ name: '', email: '', password: '', phone: '', studioId: '' })
  }

  if (isLoading) {
    return (
      <PageLayout
        title={_(msg`Studio Admin Management`)}
        description={_(msg`Create and manage studio administrators`)}
      >
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Spinner size="lg" className="mx-auto mb-4" />
            <p className="text-slate-600">
              <Trans>Loading studio admins...</Trans>
            </p>
          </div>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout
      title={_(msg`Studio Admin Management`)}
      description={_(msg`Create and manage studio administrators`)}
    >
      <div className="space-y-6">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              type="text"
              placeholder={_(msg`Search by name, email or studio...`)}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            <Trans>Create Studio Admin</Trans>
          </Button>
        </div>

        {/* Studio Admins Grid */}
        {filteredAdmins.length === 0 ? (
          <EmptyState
            icon={<ShieldCheck className="w-12 h-12" />}
            title={
              searchQuery
                ? _(msg`No studio admins found`)
                : _(msg`No studio admins yet`)
            }
            description={
              searchQuery
                ? _(msg`No studio admins found matching your search`)
                : _(msg`Create your first studio admin to get started.`)
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAdmins.map((admin) => (
              <Card
                key={admin.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <ShieldCheck className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">
                          {admin.name}
                        </CardTitle>
                        <p className="text-sm text-slate-500 truncate">
                          {admin.email}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Building className="w-4 h-4" />
                        <span className="truncate">{admin.studio.name}</span>
                      </div>
                    </div>
                    {admin.phone && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Phone className="w-4 h-4" />
                        <span>{admin.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Camera className="w-4 h-4" />
                        <span>
                          <Trans>Sessions</Trans>
                        </span>
                      </div>
                      <Badge variant="secondary">{admin.sessionCount}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <FileImage className="w-4 h-4" />
                        <span>
                          <Trans>Photos</Trans>
                        </span>
                      </div>
                      <Badge variant="secondary">{admin.photoCount}</Badge>
                    </div>
                    <div className="pt-2 border-t text-xs text-slate-500">
                      <Trans>Created:</Trans>{' '}
                      {new Date(admin.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Modal isOpen={isCreateDialogOpen} onClose={closeDialog} size="md">
        <ModalHeader>
          <h2 className="text-xl font-semibold">
            <Trans>Create Studio Admin</Trans>
          </h2>
        </ModalHeader>
        <ModalContent>
          <form
            id="studio-admin-form"
            onSubmit={handleCreateStudioAdmin}
            className="space-y-4"
          >
            <FormField label={_(msg`Name`)} required>
              <Input
                type="text"
                placeholder={_(msg`Enter name`)}
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </FormField>
            <FormField label={_(msg`Email`)} required>
              <Input
                type="email"
                placeholder={_(msg`Enter email address`)}
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </FormField>
            <FormField label={_(msg`Password`)} required>
              <Input
                type="password"
                placeholder={_(msg`Enter password (min 6 characters)`)}
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
                minLength={6}
              />
            </FormField>
            <FormField label={_(msg`Phone`)} description={_(msg`Optional`)}>
              <Input
                type="tel"
                placeholder={_(msg`Enter phone number`)}
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </FormField>
            <FormField label={_(msg`Studio`)} required>
              <select
                value={formData.studioId}
                onChange={(e) =>
                  setFormData({ ...formData, studioId: e.target.value })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="">{_(msg`Select a studio`)}</option>
                {studios.map((studio) => (
                  <option key={studio.id} value={studio.id}>
                    {studio.name}
                  </option>
                ))}
              </select>
            </FormField>
          </form>
        </ModalContent>
        <ModalFooter>
          <Button
            type="button"
            variant="outline"
            onClick={closeDialog}
            disabled={isSubmitting}
          >
            <Trans>Cancel</Trans>
          </Button>
          <Button
            type="submit"
            form="studio-admin-form"
            disabled={isSubmitting}
            className="flex items-center gap-2"
          >
            {isSubmitting && <Spinner size="sm" />}
            {isSubmitting ? <Trans>Creating...</Trans> : <Trans>Create</Trans>}
          </Button>
        </ModalFooter>
      </Modal>
    </PageLayout>
  )
}
