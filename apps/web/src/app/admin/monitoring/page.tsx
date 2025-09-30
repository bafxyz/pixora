'use client'

import { msg, Trans } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Download,
  HardDrive,
  Info,
  RefreshCw,
  Server,
  XCircle,
} from 'lucide-react'
import { PageLayout } from '@/shared/components/page-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical'
  activeConnections: number
}

interface SystemStats {
  totalClients: number
  totalPhotographers: number
  totalSessions: number
  totalPhotos: number
  totalOrders: number
  pendingOrders: number
  processingOrders: number
  completedOrders: number
  totalRevenue: number
  pendingPayments: number
}

interface LogEntry {
  id: string
  timestamp: Date | string
  level: 'info' | 'warning' | 'error'
  category: string
  message: string
  user?: string
}

export default function AdminMonitoringPage() {
  const { _ } = useLingui()
  const [health, setHealth] = useState<SystemHealth>({
    status: 'healthy',
    activeConnections: 0,
  })
  const [stats, setStats] = useState<SystemStats>({
    totalClients: 0,
    totalPhotographers: 0,
    totalSessions: 0,
    totalPhotos: 0,
    totalOrders: 0,
    pendingOrders: 0,
    processingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
    pendingPayments: 0,
  })
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [filterLevel, setFilterLevel] = useState<string>('all')


  const loadMonitoringData = useCallback(async () => {
    setIsRefreshing(true)
    try {
      const response = await fetch('/api/admin/monitoring')
      if (!response.ok) throw new Error('Failed to fetch monitoring data')

      const data = await response.json()
      setHealth(data.health)
      setStats(data.stats)
      setLogs(data.logs)
    } catch (error) {
      console.error('Error loading monitoring data:', error)
      toast.error(_(msg`Failed to load monitoring data`))
    } finally {
      setIsRefreshing(false)
    }
  }, [_])

  useEffect(() => {
    loadMonitoringData()
    const interval = setInterval(loadMonitoringData, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [])

  const handleDownloadLogs = () => {
    const logsText = logs
      .map(
        (log) =>
          `[${new Date(log.timestamp).toISOString()}] [${log.level.toUpperCase()}] [${log.category}] ${log.message}${log.user ? ` - User: ${log.user}` : ''}`
      )
      .join('\n')

    const blob = new Blob([logsText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pixora-logs-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success(_(msg`Logs downloaded successfully`))
  }


  const getStatusColor = (status: SystemHealth['status']) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500'
      case 'warning':
        return 'bg-yellow-500'
      case 'critical':
        return 'bg-red-500'
    }
  }

  const getLevelIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />
    }
  }

  const filteredLogs =
    filterLevel === 'all' ? logs : logs.filter((log) => log.level === filterLevel)

  return (
    <PageLayout
      title={_(msg`Monitoring & Logs`)}
      description={_(msg`System monitoring and log viewer`)}
      action={{
        label: _(msg`Download Logs`),
        onClick: handleDownloadLogs,
        icon: <Download className="w-4 h-4" />,
      }}
    >
      <div className="space-y-6">
        {/* System Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Database className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-sm text-blue-700">
                    <Trans>Total Orders</Trans>
                  </p>
                  <p className="font-semibold text-blue-800">
                    {stats.totalOrders}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm text-green-700">
                    <Trans>Total Revenue</Trans>
                  </p>
                  <p className="font-semibold text-green-800">
                    ${stats.totalRevenue.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-yellow-600" />
                <div>
                  <p className="text-sm text-yellow-700">
                    <Trans>Pending Orders</Trans>
                  </p>
                  <p className="font-semibold text-yellow-800">
                    {stats.pendingOrders}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Activity className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-sm text-purple-700">
                    <Trans>Active Sessions</Trans>
                  </p>
                  <p className="font-semibold text-purple-800">
                    {stats.totalSessions}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Statistics */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Server className="w-5 h-5" />
                <Trans>Order Statistics</Trans>
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={loadMonitoringData}
                disabled={isRefreshing}
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`}
                />
                <Trans>Refresh</Trans>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-slate-600 mb-2">
                  <Trans>Order Status Distribution</Trans>
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Pending</span>
                    <Badge variant="secondary">{stats.pendingOrders}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Processing</span>
                    <Badge variant="secondary">{stats.processingOrders}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Completed</span>
                    <Badge variant="secondary">{stats.completedOrders}</Badge>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-2">
                  <Trans>Revenue Metrics</Trans>
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Revenue</span>
                    <Badge variant="secondary">${stats.totalRevenue.toFixed(2)}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Pending Payments</span>
                    <Badge variant="secondary">${stats.pendingPayments.toFixed(2)}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Active Connections</span>
                    <Badge variant="secondary">{health.activeConnections}</Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Logs */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                <Trans>System Logs</Trans>
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant={filterLevel === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterLevel('all')}
                >
                  <Trans>All</Trans> ({logs.length})
                </Button>
                <Button
                  variant={filterLevel === 'info' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterLevel('info')}
                >
                  <Trans>Info</Trans> (
                  {logs.filter((log) => log.level === 'info').length})
                </Button>
                <Button
                  variant={filterLevel === 'warning' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterLevel('warning')}
                >
                  <Trans>Warning</Trans> (
                  {logs.filter((log) => log.level === 'warning').length})
                </Button>
                <Button
                  variant={filterLevel === 'error' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterLevel('error')}
                >
                  <Trans>Error</Trans> (
                  {logs.filter((log) => log.level === 'error').length})
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="mt-0.5">{getLevelIcon(log.level)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {log.category}
                      </Badge>
                      <span className="text-xs text-slate-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-800">{log.message}</p>
                    {log.user && (
                      <p className="text-xs text-slate-500 mt-1">
                        User: {log.user}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}
