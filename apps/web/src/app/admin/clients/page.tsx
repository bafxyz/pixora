'use client'

import { msg, Trans } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { PageLayout } from '@/shared/components/page-layout'
import { Button } from '@repo/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { Badge } from '@repo/ui/badge'
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

interface Client {
  id: string
  name: string
  email: string
  createdAt: string
  photographersCount: number
  photosCount: number
  sessionsCount: number
}

export default function AdminClientsPage() {
  const { _ } = useLingui()
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [formData, setFormData] = useState({ name: '', email: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadClients = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/clients')
      if (response.ok) {
        const data = await response.json()
        setClients(data.clients || [])
        setFilteredClients(data.clients || [])
      } else {
        toast.error(_(msg`Failed to load clients`))
      }
    } catch (error) {
      console.error('Error loading clients:', error)
      toast.error(_(msg`Error loading clients`))
    } finally {
      setIsLoading(false)
    }
  }, [_])

  useEffect(() => {
    loadClients()
  }, [loadClients])

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredClients(clients)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredClients(
        clients.filter(
          (client) =>
            client.name.toLowerCase().includes(query) ||
            client.email.toLowerCase().includes(query)
        )
      )
    }
  }, [searchQuery, clients])

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error(_(msg`Name and email are required`))
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success(_(msg`Client created successfully`))
        setIsCreateDialogOpen(false)
        setFormData({ name: '', email: '' })
        loadClients()
      } else {
        const error = await response.json()
        toast.error(error.error || _(msg`Failed to create client`))
      }
    } catch (error) {
      console.error('Error creating client:', error)
      toast.error(_(msg`Error creating client`))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingClient || !formData.name.trim()) {
      toast.error(_(msg`Name is required`))
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/clients/${editingClient.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success(_(msg`Client updated successfully`))
        setEditingClient(null)
        setFormData({ name: '', email: '' })
        loadClients()
      } else {
        const error = await response.json()
        toast.error(error.error || _(msg`Failed to update client`))
      }
    } catch (error) {
      console.error('Error updating client:', error)
      toast.error(_(msg`Error updating client`))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteClient = async (client: Client) => {
    if (
      !confirm(
        _(
          msg`Are you sure you want to delete "${client.name}"? This action cannot be undone.`
        )
      )
    ) {
      return
    }

    try {
      const response = await fetch(`/api/admin/clients/${client.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success(_(msg`Client deleted successfully`))
        loadClients()
      } else {
        const error = await response.json()
        toast.error(error.error || _(msg`Failed to delete client`))
      }
    } catch (error) {
      console.error('Error deleting client:', error)
      toast.error(_(msg`Error deleting client`))
    }
  }

  const openEditDialog = (client: Client) => {
    setEditingClient(client)
    setFormData({ name: client.name, email: client.email })
  }

  const closeDialogs = () => {
    setIsCreateDialogOpen(false)
    setEditingClient(null)
    setFormData({ name: '', email: '' })
  }

  if (isLoading) {
    return (
      <PageLayout
        title={_(msg`Client Management`)}
        description={_(msg`View and manage platform clients`)}
      >
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">
              <Trans>Loading clients...</Trans>
            </p>
          </div>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout
      title={_(msg`Client Management`)}
      description={_(msg`View and manage platform clients`)}
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
            <Trans>Create Client</Trans>
          </Button>
        </div>

        {/* Clients Grid */}
        {filteredClients.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">
                {searchQuery
                  ? _(msg`No clients found matching your search`)
                  : _(msg`No clients yet. Create your first client to get started.`)}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map((client) => (
              <Card
                key={client.id}
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
                          {client.name}
                        </CardTitle>
                        <p className="text-sm text-slate-500 truncate">
                          {client.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(client)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClient(client)}
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
                        {client.photographersCount}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <FileImage className="w-4 h-4" />
                        <span>
                          <Trans>Photos</Trans>
                        </span>
                      </div>
                      <Badge variant="secondary">{client.photosCount}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Building className="w-4 h-4" />
                        <span>
                          <Trans>Sessions</Trans>
                        </span>
                      </div>
                      <Badge variant="secondary">{client.sessionsCount}</Badge>
                    </div>
                    <div className="pt-2 border-t text-xs text-slate-500">
                      <Trans>Created:</Trans>{' '}
                      {new Date(client.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      {(isCreateDialogOpen || editingClient) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>
                {editingClient ? (
                  <Trans>Edit Client</Trans>
                ) : (
                  <Trans>Create New Client</Trans>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={editingClient ? handleUpdateClient : handleCreateClient}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="name">
                    <Trans>Client Name</Trans>
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder={_(msg`Enter client name`)}
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">
                    <Trans>Email</Trans>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={_(msg`Enter email address`)}
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required={!editingClient}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeDialogs}
                    className="flex-1"
                    disabled={isSubmitting}
                  >
                    <Trans>Cancel</Trans>
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Trans>Saving...</Trans>
                    ) : editingClient ? (
                      <Trans>Update</Trans>
                    ) : (
                      <Trans>Create</Trans>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </PageLayout>
  )
}