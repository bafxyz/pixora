'use client'

import { msg, Trans } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Button } from '@repo/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'
import { useConfirmation } from '@repo/ui/confirmation-dialog'
import { FormField } from '@repo/ui/form-field'
import { Input } from '@repo/ui/input'
import { Modal, ModalContent, ModalFooter, ModalHeader } from '@repo/ui/modal'
import { PageLayout } from '@repo/ui/page-layout'
import {
  Camera,
  Edit,
  Eye,
  Loader2,
  Mail,
  Phone,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface Photographer {
  id: string
  name: string
  email: string
  phone: string | null
  createdAt: string
  guestCount: number
  photoCount: number
  orderCount: number
}

interface NewPhotographer {
  name: string
  email: string
  phone: string
  password: string
}

interface EditPhotographer {
  id: string
  name: string
  email: string
  phone: string
}

export default function StudioAdminPhotographersPage() {
  const { _ } = useLingui()
  const [photographers, setPhotographers] = useState<Photographer[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null)
  const [newPhotographer, setNewPhotographer] = useState<NewPhotographer>({
    name: '',
    email: '',
    phone: '',
    password: '',
  })
  const [editPhotographer, setEditPhotographer] =
    useState<EditPhotographer | null>(null)
  const router = useRouter()
  const { confirm, dialog } = useConfirmation()

  useEffect(() => {
    const fetchPhotographers = async () => {
      try {
        const response = await fetch('/api/studio-admin/photographers')
        const data = await response.json()

        if (response.ok) {
          setPhotographers(data.photographers)
          setCurrentUserEmail(data.currentUserEmail)
        } else {
          console.error('Failed to fetch photographers:', data.error)
          toast.error(_(msg`Error loading photographers`))
        }
      } catch (error) {
        console.error('Error fetching photographers:', error)
        toast.error(_(msg`Error loading photographers`))
      } finally {
        setLoading(false)
      }
    }

    fetchPhotographers()
  }, [_])

  const handleCreatePhotographer = async () => {
    if (!newPhotographer.name.trim() || !newPhotographer.email.trim()) {
      toast.error(_(msg`Name and email are required`))
      return
    }

    if (newPhotographer.password && newPhotographer.password.length < 6) {
      toast.error(_(msg`Password must be at least 6 characters`))
      return
    }

    try {
      const response = await fetch('/api/studio-admin/photographers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPhotographer),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(_(msg`Photographer created successfully`))
        setPhotographers([data.photographer, ...photographers])
        setNewPhotographer({ name: '', email: '', phone: '', password: '' })
        setShowCreateModal(false)
      } else {
        toast.error(data.error || _(msg`Error creating photographer`))
      }
    } catch (error) {
      console.error('Error creating photographer:', error)
      toast.error(_(msg`Error creating photographer`))
    }
  }

  const handleEditPhotographer = (photographer: Photographer) => {
    setEditPhotographer({
      id: photographer.id,
      name: photographer.name,
      email: photographer.email,
      phone: photographer.phone || '',
    })
    setShowEditModal(true)
  }

  const handleUpdatePhotographer = async () => {
    if (
      !editPhotographer ||
      !editPhotographer.name.trim() ||
      !editPhotographer.email.trim()
    ) {
      toast.error(_(msg`Name and email are required`))
      return
    }

    try {
      const response = await fetch(
        `/api/studio-admin/photographers/${editPhotographer.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: editPhotographer.name,
            email: editPhotographer.email,
            phone: editPhotographer.phone,
          }),
        }
      )

      const data = await response.json()

      if (response.ok) {
        toast.success(_(msg`Photographer updated successfully`))
        setPhotographers(
          photographers.map((p) =>
            p.id === editPhotographer.id ? data.photographer : p
          )
        )
        setEditPhotographer(null)
        setShowEditModal(false)
      } else {
        toast.error(data.error || _(msg`Error updating photographer`))
      }
    } catch (error) {
      console.error('Error updating photographer:', error)
      toast.error(_(msg`Error updating photographer`))
    }
  }

  const handleDeletePhotographer = async (photographerId: string) => {
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
        setPhotographers(photographers.filter((p) => p.id !== photographerId))
      } else {
        const data = await response.json()
        toast.error(data.error || _(msg`Error deleting photographer`))
      }
    } catch (error) {
      console.error('Error deleting photographer:', error)
      toast.error(_(msg`Error deleting photographer`))
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <PageLayout
        title={_(msg`Photographer Management`)}
        description={_(msg`Add, edit and manage photographers`)}
      >
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout
      title={_(msg`Photographer Management`)}
      description={_(msg`Add, edit and manage photographers`)}
    >
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            <Trans>Photographers</Trans> ({photographers.length})
          </h1>
          <Button onClick={() => setShowCreateModal(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            <Trans>Add Photographer</Trans>
          </Button>
        </div>

        {/* Modal for creating photographer */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          size="md"
        >
          <ModalHeader>
            <h2 className="text-lg font-semibold">
              <Trans>Add New Photographer</Trans>
            </h2>
          </ModalHeader>
          <ModalContent>
            <div className="space-y-4">
              <FormField label={_(msg`Name`)}>
                <Input
                  value={newPhotographer.name}
                  onChange={(e) =>
                    setNewPhotographer({
                      ...newPhotographer,
                      name: e.target.value,
                    })
                  }
                  placeholder={_(msg`Photographer name`)}
                />
              </FormField>
              <FormField label={_(msg`Email`)}>
                <Input
                  type="email"
                  value={newPhotographer.email}
                  onChange={(e) =>
                    setNewPhotographer({
                      ...newPhotographer,
                      email: e.target.value,
                    })
                  }
                  placeholder="email@example.com"
                />
              </FormField>
              <FormField label={_(msg`Phone`)}>
                <Input
                  value={newPhotographer.phone}
                  onChange={(e) =>
                    setNewPhotographer({
                      ...newPhotographer,
                      phone: e.target.value,
                    })
                  }
                  placeholder="+7 (XXX) XXX-XXXX"
                />
              </FormField>
              <FormField
                label={_(msg`Password`)}
                description={_(
                  msg`If password is provided, a login account will be created for the photographer`
                )}
              >
                <Input
                  type="password"
                  value={newPhotographer.password}
                  onChange={(e) =>
                    setNewPhotographer({
                      ...newPhotographer,
                      password: e.target.value,
                    })
                  }
                  placeholder={_(msg`Minimum 6 characters`)}
                  minLength={6}
                />
              </FormField>
            </div>
          </ModalContent>
          <ModalFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              <Trans>Cancel</Trans>
            </Button>
            <Button onClick={handleCreatePhotographer}>
              <Trans>Create</Trans>
            </Button>
          </ModalFooter>
        </Modal>

        {/* Modal for editing photographer */}
        <Modal
          isOpen={showEditModal && !!editPhotographer}
          onClose={() => {
            setShowEditModal(false)
            setEditPhotographer(null)
          }}
          size="md"
        >
          <ModalHeader>
            <h2 className="text-lg font-semibold">
              <Trans>Edit Photographer</Trans>
            </h2>
          </ModalHeader>
          <ModalContent>
            <div className="space-y-4">
              <FormField label={_(msg`Name`)}>
                <Input
                  value={editPhotographer?.name || ''}
                  onChange={(e) =>
                    setEditPhotographer(
                      editPhotographer
                        ? {
                            ...editPhotographer,
                            name: e.target.value,
                          }
                        : null
                    )
                  }
                  placeholder={_(msg`Photographer name`)}
                />
              </FormField>
              <FormField label={_(msg`Email`)}>
                <Input
                  type="email"
                  value={editPhotographer?.email || ''}
                  onChange={(e) =>
                    setEditPhotographer(
                      editPhotographer
                        ? {
                            ...editPhotographer,
                            email: e.target.value,
                          }
                        : null
                    )
                  }
                  placeholder="email@example.com"
                />
              </FormField>
              <FormField label={_(msg`Phone`)}>
                <Input
                  value={editPhotographer?.phone || ''}
                  onChange={(e) =>
                    setEditPhotographer(
                      editPhotographer
                        ? {
                            ...editPhotographer,
                            phone: e.target.value,
                          }
                        : null
                    )
                  }
                  placeholder="+7 (XXX) XXX-XXXX"
                />
              </FormField>
            </div>
          </ModalContent>
          <ModalFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditModal(false)
                setEditPhotographer(null)
              }}
            >
              <Trans>Cancel</Trans>
            </Button>
            <Button onClick={handleUpdatePhotographer}>
              <Trans>Save</Trans>
            </Button>
          </ModalFooter>
        </Modal>

        {photographers.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
              <Trans>No Photographers</Trans>
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              <Trans>Add your first photographer to get started</Trans>
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {photographers.map((photographer) => (
              <Card key={photographer.id} className="overflow-hidden">
                <CardHeader className="bg-muted/30">
                  <CardTitle className="flex items-center justify-between">
                    <span className="truncate">{photographer.name}</span>
                    {photographer.email !== currentUserEmail && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditPhotographer(photographer)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleDeletePhotographer(photographer.id)
                          }
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Mail className="w-4 h-4 mr-2" />
                      {photographer.email}
                    </div>

                    {photographer.phone && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Phone className="w-4 h-4 mr-2" />
                        {photographer.phone}
                      </div>
                    )}

                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="w-4 h-4 mr-2" />
                      {photographer.guestCount} <Trans>guests</Trans>
                    </div>

                    <div className="flex items-center text-sm text-muted-foreground">
                      <Camera className="w-4 h-4 mr-2" />
                      {photographer.photoCount} <Trans>photos</Trans>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      <Trans>Registered:</Trans>{' '}
                      {formatDate(photographer.createdAt)}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t flex justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        router.push(
                          `/studio-admin/photographers/${photographer.id}`
                        )
                      }
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      <Trans>View Details</Trans>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {dialog}
    </PageLayout>
  )
}
