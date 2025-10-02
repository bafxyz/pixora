'use client'

import { msg, Trans } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { Card, CardContent } from '@repo/ui/card'
import { Bell, Check, CreditCard, Loader2, Package, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
  readAt?: string
}

export function Notifications() {
  const { _ } = useLingui()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/notifications')
      const data = await response.json()

      if (response.ok) {
        setNotifications(data.notifications)
        setUnreadCount(
          data.notifications.filter((n: Notification) => !n.isRead).length
        )
      } else {
        console.error('Failed to fetch notifications:', data.error)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(
        `/api/notifications/${notificationId}/read`,
        {
          method: 'POST',
        }
      )

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId
              ? { ...n, isRead: true, readAt: new Date().toISOString() }
              : n
          )
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      } else {
        toast.error(_(msg`Failed to mark notification as read`))
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
      toast.error(_(msg`Failed to mark notification as read`))
    }
  }

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter((n) => !n.isRead)

    for (const notification of unreadNotifications) {
      await markAsRead(notification.id)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_order':
        return <Package className="w-4 h-4 text-blue-500" />
      case 'order_status_changed':
        return <Package className="w-4 h-4 text-yellow-500" />
      case 'payment_received':
        return <CreditCard className="w-4 h-4 text-green-500" />
      default:
        return <Bell className="w-4 h-4 text-gray-500" />
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    )

    if (diffInMinutes < 1) return _(msg`Just now`)
    if (diffInMinutes < 60) return `${diffInMinutes} ${_(msg`minutes ago`)}`
    if (diffInMinutes < 1440)
      return `${Math.floor(diffInMinutes / 60)} ${_(msg`hours ago`)}`
    return `${Math.floor(diffInMinutes / 1440)} ${_(msg`days ago`)}`
  }

  useEffect(() => {
    fetchNotifications()

    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element
      if (!target.closest('.relative')) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.addEventListener('click', handleClickOutside)
      return () => {
        document.removeEventListener('keydown', handleEscape)
        document.removeEventListener('click', handleClickOutside)
      }
    }
  }, [isOpen])

  return (
    <div className="relative">
      {/* Notification Bell */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notification Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" />

          {/* Dropdown Content */}
          <Card className="absolute right-0 top-12 w-96 max-h-[600px] z-50 shadow-lg">
            <CardContent className="p-0">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-semibold text-lg">
                  <Trans>Notifications</Trans>
                </h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="text-xs h-8"
                    >
                      <Check className="w-3 h-3 mr-1" />
                      <Trans>Mark all read</Trans>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="p-1 h-8 w-8"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Notifications List */}
              <div className="max-h-[500px] overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center p-8 text-gray-500">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">
                      <Trans>No notifications yet</Trans>
                    </p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {notifications.map((notification) => (
                      <button
                        key={notification.id}
                        type="button"
                        className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors text-left w-full ${
                          !notification.isRead ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => {
                          if (!notification.isRead) {
                            markAsRead(notification.id)
                          }
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex-shrink-0">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className="font-medium text-sm flex-1">
                                {notification.title}
                              </h4>
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2 break-words">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400">
                              {formatTime(notification.createdAt)}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
