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
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

interface Studio {
  id: string
  name: string
  email: string
  createdAt: string
  photographersCount: number
  photosCount: number
  sessionsCount: number
}

export default function AdminStudiosPage() {
  const { _ } = useLingui()
  const [studios, setStudios] = useState<Studio[]>([])
  const [filteredStudios, setFilteredStudios] = useState<Studio[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingStudio, setEditingStudio] = useState<Studio | null>(null)
  const [formData, setFormData] = useState({ name: '', email: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadStudios = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/studios')
      if (response.ok) {
        const data = await response.json()
        setStudios(data.studios || [])
        setFilteredStudios(data.studios || [])
      } else {
        toast.error(_(msg`Failed to load studios`))
      }
    } catch (error) {
      console.error('Error loading studios:', error)
      toast.error(_(msg`Error loading studios`))
    } finally {
      setIsLoading(false)
    }
  }, [_])

  useEffect(() => {
    loadStudios()
  }, [loadStudios])

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredStudios(studios)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredStudios(
        studios.filter(
          (studio) =>
            studio.name.toLowerCase().includes(query) ||
            studio.email.toLowerCase().includes(query)
        )
      )
    }
  }, [searchQuery, studios])

  const handleCreateStudio = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error(_(msg`Name and email are required`))
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/admin/studios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success(_(msg`Studio created successfully`))
        setIsCreateDialogOpen(false)
        setFormData({ name: '', email: '' })
        loadStudios()
      } else {
        const error = await response.json()
        toast.error(error.error || _(msg`Failed to create studio`))
      }
    } catch (error) {
      console.error('Error creating studio:', error)
      toast.error(_(msg`Error creating studio`))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateStudio = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingStudio || !formData.name.trim()) {
      toast.error(_(msg`Name is required`))
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/studios/${editingStudio.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success(_(msg`Studio updated successfully`))
        setEditingStudio(null)
        setFormData({ name: '', email: '' })
        loadStudios()
      } else {
        const error = await response.json()
        toast.error(error.error || _(msg`Failed to update studio`))
      }
    } catch (error) {
      console.error('Error updating studio:', error)
      toast.error(_(msg`Error updating studio`))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteStudio = async (studio: Studio) => {
    if (
      !confirm(
        _(
          msg`Are you sure you want to delete "${studio.name}"? This action cannot be undone.`
        )
      )
    ) {
      return
    }

    try {
      const response = await fetch(`/api/admin/studios/${studio.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success(_(msg`Studio deleted successfully`))
        loadStudios()
      } else {
        const error = await response.json()
        toast.error(error.error || _(msg`Failed to delete studio`))
      }
    } catch (error) {
      console.error('Error deleting studio:', error)
      toast.error(_(msg`Error deleting studio`))
    }
  }

  const openEditDialog = (studio: Studio) => {
    setEditingStudio(studio)
    setFormData({ name: studio.name, email: studio.email })
  }

  const closeDialogs = () => {
    setIsCreateDialogOpen(false)
    setEditingStudio(null)
    setFormData({ name: '', email: '' })
  }

  if (isLoading) {
    return (
      <PageLayout
        title={_(msg`Studio Management`)}
        description={_(msg`Create, manage and monitor photo studios`)}
      >
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Spinner size="lg" className="mx-auto mb-4" />
            <p className="text-slate-600">
              <Trans>Loading studios...</Trans>
            </p>
          </div>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout
      title={_(msg`Studio Management`)}
      description={_(msg`Create, manage and monitor photo studios`)}
    >
      <div className="space-y-6">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              type="text"
              placeholder={_(msg`Search by name or email...`)}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            <Trans>Create Studio</Trans>
          </Button>
        </div>

        {/* Studios Grid */}
        {filteredStudios.length === 0 ? (
          <EmptyState
            icon={<Building className="w-12 h-12" />}
            title={
              searchQuery ? _(msg`No studios found`) : _(msg`No studios yet`)
            }
            description={
              searchQuery
                ? _(msg`No studios found matching your search`)
                : _(msg`Create your first studio to get started.`)
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStudios.map((studio) => (
              <Card
                key={studio.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Building className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">
                          {studio.name}
                        </CardTitle>
                        <p className="text-sm text-slate-500 truncate">
                          {studio.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(studio)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteStudio(studio)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Camera className="w-4 h-4" />
                        <span>
                          <Trans>Photographers</Trans>
                        </span>
                      </div>
                      <Badge variant="secondary">
                        {studio.photographersCount}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <FileImage className="w-4 h-4" />
                        <span>
                          <Trans>Photos</Trans>
                        </span>
                      </div>
                      <Badge variant="secondary">{studio.photosCount}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Building className="w-4 h-4" />
                        <span>
                          <Trans>Sessions</Trans>
                        </span>
                      </div>
                      <Badge variant="secondary">{studio.sessionsCount}</Badge>
                    </div>
                    <div className="pt-2 border-t text-xs text-slate-500">
                      <Trans>Created:</Trans>{' '}
                      {new Date(studio.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Modal
        isOpen={isCreateDialogOpen || !!editingStudio}
        onClose={closeDialogs}
        size="md"
      >
        <ModalHeader>
          <h2 className="text-xl font-semibold">
            {editingStudio ? (
              <Trans>Edit Studio</Trans>
            ) : (
              <Trans>Create New Studio</Trans>
            )}
          </h2>
        </ModalHeader>
        <ModalContent>
          <form
            id="studio-form"
            onSubmit={editingStudio ? handleUpdateStudio : handleCreateStudio}
            className="space-y-4"
          >
            <FormField label={_(msg`Studio Name`)} required>
              <Input
                type="text"
                placeholder={_(msg`Enter studio name`)}
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </FormField>
            <FormField label={_(msg`Email`)} required={!editingStudio}>
              <Input
                type="email"
                placeholder={_(msg`Enter email address`)}
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required={!editingStudio}
              />
            </FormField>
          </form>
        </ModalContent>
        <ModalFooter>
          <Button
            type="button"
            variant="outline"
            onClick={closeDialogs}
            disabled={isSubmitting}
          >
            <Trans>Cancel</Trans>
          </Button>
          <Button
            type="submit"
            form="studio-form"
            disabled={isSubmitting}
            className="flex items-center gap-2"
          >
            {isSubmitting && <Spinner size="sm" />}
            {isSubmitting ? (
              <Trans>Saving...</Trans>
            ) : editingStudio ? (
              <Trans>Update</Trans>
            ) : (
              <Trans>Create</Trans>
            )}
          </Button>
        </ModalFooter>
      </Modal>
    </PageLayout>
  )
}
