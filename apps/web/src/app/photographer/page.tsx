'use client'

import { msg, Trans } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Button } from '@repo/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/card'
import { LoadingScreen } from '@repo/ui/loading-screen'
import { Camera, Clock, Image as ImageIcon, QrCode, Upload } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

interface PhotoSession {
  id: string
  name: string
  createdAt: string
  photoCount: number
}

interface PhotographerStats {
  totalSessions: number
  totalPhotos: number
  recentSessions: PhotoSession[]
}

export default function PhotographerPage() {
  const { _ } = useLingui()
  const router = useRouter()
  const [stats, setStats] = useState<PhotographerStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadStats = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/photo-sessions')
      if (response.ok) {
        const data = await response.json()
        const sessions = data.photoSessions || []

        setStats({
          totalSessions: sessions.length,
          totalPhotos: sessions.reduce(
            (sum: number, s: { photoCount?: number }) =>
              sum + (s.photoCount || 0),
            0
          ),
          recentSessions: sessions
            .slice(0, 3)
            .map(
              (s: {
                id: string
                name: string
                createdAt: string
                photoCount?: number
              }) => ({
                id: s.id,
                name: s.name,
                createdAt: s.createdAt,
                photoCount: s.photoCount || 0,
              })
            ),
        })
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  if (isLoading) {
    return <LoadingScreen message={_(msg`Loading...`)} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900">
      <div className="container mx-auto px-4 py-6 lg:py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">
            <Trans>Photographer Dashboard</Trans>
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            <Trans>Manage your photo sessions and uploads</Trans>
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <Card className="bg-white/70 backdrop-blur-sm border border-white/20 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    <Trans>Total Sessions</Trans>
                  </p>
                  <p className="text-3xl font-bold text-slate-800 mt-1">
                    {stats?.totalSessions || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border border-white/20 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    <Trans>Total Photos</Trans>
                  </p>
                  <p className="text-3xl font-bold text-slate-800 mt-1">
                    {stats?.totalPhotos || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Sessions */}
        {stats?.recentSessions && stats.recentSessions.length > 0 ? (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-slate-800">
                <Trans>Recent Sessions</Trans>
              </h3>
              <Button
                onClick={() => router.push('/photographer/sessions')}
                variant="outline"
                size="sm"
              >
                <Trans>View All</Trans>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.recentSessions.map((session) => (
                <Card
                  key={session.id}
                  className="bg-white/70 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1"
                  onClick={() =>
                    router.push(`/photographer/sessions/${session.id}`)
                  }
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg line-clamp-1">
                      {session.name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 text-xs">
                      <Clock className="w-3 h-3" />
                      {new Date(session.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-600">
                        <ImageIcon className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {session.photoCount} <Trans>photos</Trans>
                        </span>
                      </div>
                      <Button size="sm" variant="outline">
                        <Trans>Open</Trans>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <Card className="bg-white/70 backdrop-blur-sm border border-white/20 shadow-lg mb-8">
            <CardContent className="py-12 text-center">
              <Camera className="w-16 h-16 mx-auto mb-4 text-slate-400" />
              <h3 className="text-xl font-semibold text-slate-800 mb-2">
                <Trans>No Sessions Yet</Trans>
              </h3>
              <p className="text-slate-600 mb-6">
                <Trans>Create your first photo session to get started</Trans>
              </p>
              <Button
                onClick={() => router.push('/photographer/sessions')}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <Camera className="w-5 h-5 mr-2" />
                <Trans>Create Your First Session</Trans>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card
            className="bg-white/70 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all cursor-pointer hover:-translate-y-1"
            onClick={() => router.push('/photographer/sessions')}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Camera className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-base">
                    <Trans>Sessions</Trans>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    <Trans>Manage sessions</Trans>
                  </CardDescription>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="bg-white/70 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all cursor-pointer hover:-translate-y-1"
            onClick={() => router.push('/photographer/upload')}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                  <Upload className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-base">
                    <Trans>Upload</Trans>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    <Trans>Upload photos</Trans>
                  </CardDescription>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="bg-white/70 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all cursor-pointer hover:-translate-y-1"
            onClick={() => router.push('/photographer/qr-scanner')}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg flex items-center justify-center">
                  <QrCode className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-base">
                    <Trans>QR Scanner</Trans>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    <Trans>Scan QR codes</Trans>
                  </CardDescription>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
