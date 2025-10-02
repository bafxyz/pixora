'use client'

import { Button } from '@repo/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'
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
          toast.error('Ошибка при загрузке фотографов')
        }
      } catch (error) {
        console.error('Error fetching photographers:', error)
        toast.error('Ошибка при загрузке фотографов')
      } finally {
        setLoading(false)
      }
    }

    fetchPhotographers()
  }, [])

  const handleCreatePhotographer = async () => {
    if (!newPhotographer.name.trim() || !newPhotographer.email.trim()) {
      toast.error('Название и email обязательны')
      return
    }

    if (newPhotographer.password && newPhotographer.password.length < 6) {
      toast.error('Пароль должен содержать минимум 6 символов')
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
        toast.success('Фотограф создан успешно')
        setPhotographers([data.photographer, ...photographers])
        setNewPhotographer({ name: '', email: '', phone: '', password: '' })
        setShowCreateModal(false)
      } else {
        toast.error(data.error || 'Ошибка при создании фотографа')
      }
    } catch (error) {
      console.error('Error creating photographer:', error)
      toast.error('Ошибка при создании фотографа')
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
      toast.error('Название и email обязательны')
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
        toast.success('Фотограф обновлен успешно')
        setPhotographers(
          photographers.map((p) =>
            p.id === editPhotographer.id ? data.photographer : p
          )
        )
        setEditPhotographer(null)
        setShowEditModal(false)
      } else {
        toast.error(data.error || 'Ошибка при обновлении фотографа')
      }
    } catch (error) {
      console.error('Error updating photographer:', error)
      toast.error('Ошибка при обновлении фотографа')
    }
  }

  const handleDeletePhotographer = async (photographerId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этого фотографа?')) {
      return
    }

    try {
      const response = await fetch(
        `/api/studio-admin/photographers/${photographerId}`,
        {
          method: 'DELETE',
        }
      )

      if (response.ok) {
        toast.success('Фотограф удален успешно')
        setPhotographers(photographers.filter((p) => p.id !== photographerId))
      } else {
        const data = await response.json()
        toast.error(data.error || 'Ошибка при удалении фотографа')
      }
    } catch (error) {
      console.error('Error deleting photographer:', error)
      toast.error('Ошибка при удалении фотографа')
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
        title="Управление фотографами"
        description="Добавление, редактирование и управление фотографами"
      >
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout
      title="Управление фотографами"
      description="Добавление, редактирование и управление фотографами"
    >
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            Фотографы ({photographers.length})
          </h1>
          <Button onClick={() => setShowCreateModal(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Добавить фотографа
          </Button>
        </div>

        {/* Modal for creating photographer */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          size="md"
        >
          <ModalHeader>
            <h2 className="text-lg font-semibold">Добавить нового фотографа</h2>
          </ModalHeader>
          <ModalContent>
            <div className="space-y-4">
              <FormField label="Имя">
                <Input
                  value={newPhotographer.name}
                  onChange={(e) =>
                    setNewPhotographer({
                      ...newPhotographer,
                      name: e.target.value,
                    })
                  }
                  placeholder="Имя фотографа"
                />
              </FormField>
              <FormField label="Email">
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
              <FormField label="Телефон">
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
                label="Пароль"
                description="Если указан пароль, для фотографа будет создан аккаунт для входа"
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
                  placeholder="Минимум 6 символов"
                  minLength={6}
                />
              </FormField>
            </div>
          </ModalContent>
          <ModalFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Отмена
            </Button>
            <Button onClick={handleCreatePhotographer}>Создать</Button>
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
            <h2 className="text-lg font-semibold">Редактировать фотографа</h2>
          </ModalHeader>
          <ModalContent>
            <div className="space-y-4">
              <FormField label="Имя">
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
                  placeholder="Имя фотографа"
                />
              </FormField>
              <FormField label="Email">
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
              <FormField label="Телефон">
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
              Отмена
            </Button>
            <Button onClick={handleUpdatePhotographer}>Сохранить</Button>
          </ModalFooter>
        </Modal>

        {photographers.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
              Нет фотографов
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Добавьте первого фотографа, чтобы начать
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
                      {photographer.guestCount} гостей
                    </div>

                    <div className="flex items-center text-sm text-muted-foreground">
                      <Camera className="w-4 h-4 mr-2" />
                      {photographer.photoCount} фото
                    </div>

                    <div className="text-sm text-muted-foreground">
                      Зарегистрирован: {formatDate(photographer.createdAt)}
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
                      Подробнее
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
