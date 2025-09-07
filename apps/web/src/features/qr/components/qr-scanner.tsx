'use client'

import { Button } from '@repo/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/card'
import { Camera, CameraOff, CheckCircle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface QRScannerProps {
  onScan?: (data: string) => void
  onError?: (error: string) => void
}

export function QRScanner({ onScan, onError }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [lastScanned, setLastScanned] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    return () => {
      // Очистка при размонтировании
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop()
        })
      }
    }
  }, [])

  const startScanning = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // Используем заднюю камеру
      })

      setHasPermission(true)
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsScanning(true)
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      setHasPermission(false)
      if (onError) {
        onError('Не удалось получить доступ к камере')
      }
    }
  }

  const stopScanning = () => {
    setIsScanning(false)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop()
      })
      streamRef.current = null
    }
  }

  const simulateScan = () => {
    // Имитация сканирования для тестирования
    const mockData = JSON.stringify({
      id: 'guest-1234567890-abc123def',
      name: 'Тестовый Гость',
      type: 'guest',
      timestamp: new Date().toISOString(),
    })

    setLastScanned(mockData)
    if (onScan) {
      onScan(mockData)
    }
  }

  const handleManualInput = () => {
    const manualData = prompt('Введите QR-данные вручную:')
    if (manualData) {
      setLastScanned(manualData)
      if (onScan) {
        onScan(manualData)
      }
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-5 h-5" />
          Сканер QR-кодов
        </CardTitle>
        <CardDescription>Отсканируйте QR-код гостя</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Видео элемент для камеры */}
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-64 bg-gray-100 rounded-lg ${
              isScanning ? 'block' : 'hidden'
            }`}
          />

          {!isScanning && (
            <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <CameraOff className="w-12 h-12 text-gray-400" />
            </div>
          )}

          {/* Оверлей с рамкой для QR */}
          {isScanning && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-48 border-2 border-blue-500 rounded-lg bg-transparent"></div>
            </div>
          )}
        </div>

        {/* Кнопки управления */}
        <div className="flex gap-2">
          {!isScanning ? (
            <Button
              onClick={startScanning}
              className="flex-1"
              disabled={hasPermission === false}
            >
              <Camera className="w-4 h-4 mr-2" />
              Начать сканирование
            </Button>
          ) : (
            <Button onClick={stopScanning} variant="outline" className="flex-1">
              <CameraOff className="w-4 h-4 mr-2" />
              Остановить
            </Button>
          )}

          <Button onClick={simulateScan} variant="outline" size="sm">
            Тест
          </Button>
        </div>

        {/* Ручной ввод */}
        <Button
          onClick={handleManualInput}
          variant="outline"
          className="w-full"
        >
          Ввести вручную
        </Button>

        {/* Статус */}
        {hasPermission === false && (
          <p className="text-sm text-red-600">
            Доступ к камере запрещен. Разрешите доступ в настройках браузера.
          </p>
        )}

        {/* Последний отсканированный код */}
        {lastScanned && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                Код отсканирован
              </span>
            </div>
            <p className="text-xs text-green-700 break-all">{lastScanned}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
